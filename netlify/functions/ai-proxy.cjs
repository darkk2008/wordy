// netlify/functions/ai-proxy.cjs
//
// Server-side proxy for Groq chat completions, so NO API key ships in the page.
//
// Setup (Netlify dashboard -> Site configuration -> Environment variables):
//   GROQ_API_KEY          (required)  a NEW Groq key. Revoke the old one that was in index.html.
//   AI_ALLOWED_MODELS     (optional)  comma-separated model IDs, default "openai/gpt-oss-120b"
//   AI_ALLOWED_ORIGINS    (optional)  comma-separated origins, e.g. "https://yourapp.netlify.app".
//                                     If unset, only same-origin browser requests are accepted.
//   AI_RATE_LIMIT_PER_MIN (optional)  per-IP requests per minute, default 30
//
// Limits: the rate limiter is in-memory, so it is per warm function instance (best effort).
// For hard limits use a shared store (Netlify Blobs / Upstash) and, ideally, check a
// server-issued premium token here before serving paid usage.
"use strict";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MAX_BODY_BYTES = 64 * 1024;
const MAX_MESSAGES = 60;
const MAX_TOTAL_CHARS = 48000;
const MAX_TOKENS_CAP = 4096;
const UPSTREAM_TIMEOUT_MS = 28000;
const ROLES = new Set(["system", "user", "assistant", "tool"]);

const hits = new Map(); // ip -> [timestamps]

function json(statusCode, obj, extra) {
  return { statusCode, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...(extra || {}) }, body: JSON.stringify(obj) };
}
const err = (statusCode, message, extra) => json(statusCode, { error: { message } }, extra);

function header(event, name) {
  const h = event.headers || {};
  const key = Object.keys(h).find((k) => k.toLowerCase() === name);
  return key ? h[key] : "";
}

function clientIp(event) {
  return String(header(event, "x-nf-client-connection-ip") || header(event, "client-ip") || String(header(event, "x-forwarded-for")).split(",")[0] || "unknown").trim();
}

function rateLimited(ip, limit, now) {
  const arr = (hits.get(ip) || []).filter((t) => now - t < 60000);
  if (arr.length >= limit) { hits.set(ip, arr); return true; }
  arr.push(now); hits.set(ip, arr);
  if (hits.size > 5000) { for (const [k, v] of hits) if (!v.length || now - v[v.length - 1] > 60000) hits.delete(k); }
  return false;
}

function originAllowed(event) {
  const origin = header(event, "origin");
  const allowed = String(process.env.AI_ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (allowed.length) return !!origin && allowed.includes(origin);
  if (!origin) return true; // non-browser client; still rate limited
  try { return new URL(origin).host === header(event, "host"); } catch (e) { return false; }
}

function buildPayload(body, allowedModels) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { error: "Invalid request body." };
  if (body.stream) return { error: "Streaming is not supported." };
  if (typeof body.model !== "string" || !allowedModels.includes(body.model)) return { error: "Model not allowed." };
  if (!Array.isArray(body.messages) || !body.messages.length || body.messages.length > MAX_MESSAGES) return { error: "Invalid messages." };
  let chars = 0;
  const messages = [];
  for (const m of body.messages) {
    if (!m || typeof m !== "object" || !ROLES.has(m.role)) return { error: "Invalid message." };
    const out = { role: m.role };
    if (typeof m.content === "string") { out.content = m.content; chars += m.content.length; }
    else if (m.content === null || m.content === undefined) out.content = "";
    else return { error: "Invalid message content." };
    if (typeof m.name === "string") out.name = m.name.slice(0, 64);
    if (typeof m.tool_call_id === "string") out.tool_call_id = m.tool_call_id.slice(0, 128);
    if (m.tool_calls !== undefined) {
      if (!Array.isArray(m.tool_calls) || m.tool_calls.length > 16) return { error: "Invalid tool calls." };
      out.tool_calls = m.tool_calls; chars += JSON.stringify(m.tool_calls).length;
    }
    messages.push(out);
  }
  if (chars > MAX_TOTAL_CHARS) return { error: "Request too large." };
  const payload = { model: body.model, messages };
  if (typeof body.temperature === "number" && body.temperature >= 0 && body.temperature <= 2) payload.temperature = body.temperature;
  if (typeof body.top_p === "number" && body.top_p > 0 && body.top_p <= 1) payload.top_p = body.top_p;
  if (typeof body.max_tokens === "number" && body.max_tokens > 0) payload.max_tokens = Math.min(Math.floor(body.max_tokens), MAX_TOKENS_CAP);
  if (body.response_format && (body.response_format.type === "json_object" || body.response_format.type === "text")) payload.response_format = { type: body.response_format.type };
  if (body.tools !== undefined) {
    if (!Array.isArray(body.tools) || body.tools.length > 8 || JSON.stringify(body.tools).length > 16000) return { error: "Invalid tools." };
    payload.tools = body.tools;
    if (typeof body.tool_choice === "string" || (body.tool_choice && typeof body.tool_choice === "object")) payload.tool_choice = body.tool_choice;
  }
  return { payload };
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return err(405, "Method not allowed.", { Allow: "POST" });
  if (!originAllowed(event)) return err(403, "Origin not allowed.");
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return err(503, "AI service is not configured.");
  const limit = Number(process.env.AI_RATE_LIMIT_PER_MIN || 30);
  if (rateLimited(clientIp(event), limit, Date.now())) return err(429, "Too many requests. Please slow down.", { "Retry-After": "30" });

  const raw = event.isBase64Encoded ? Buffer.from(event.body || "", "base64").toString("utf8") : String(event.body || "");
  if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) return err(413, "Request too large.");
  let body;
  try { body = JSON.parse(raw); } catch (e) { return err(400, "Invalid JSON."); }
  const allowedModels = String(process.env.AI_ALLOWED_MODELS || "openai/gpt-oss-120b").split(",").map((s) => s.trim()).filter(Boolean);
  const built = buildPayload(body, allowedModels);
  if (built.error) return err(400, built.error);

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const res = await fetch(GROQ_URL, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + apiKey }, body: JSON.stringify(built.payload), signal: ctrl.signal });
    const text = await res.text();
    if (res.status === 401 || res.status === 403) return err(503, "AI service is unavailable.");
    return { statusCode: res.status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: text };
  } catch (e) {
    return err(e && e.name === "AbortError" ? 504 : 502, "AI service did not respond.");
  } finally {
    clearTimeout(timer);
  }
};

exports._test = { buildPayload, rateLimited, originAllowed, hits };
