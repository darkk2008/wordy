// Shared helpers for the Netlify functions (promo codes, devices, presence).
// Storage is Netlify Blobs; tests can swap it with globalThis.__KV_MOCK(name).
import { timingSafeEqual, randomBytes } from "node:crypto";

export function json(status, obj) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export async function kv(name) {
  if (globalThis.__KV_MOCK) return globalThis.__KV_MOCK(name);
  const { getStore } = await import("@netlify/blobs");
  const s = getStore({ name, consistency: "strong" });
  return {
    async get(key) {
      try { return await s.get(key, { type: "json" }); } catch (e) { return null; }
    },
    async set(key, val) { await s.setJSON(key, val); },
    async del(key) { await s.delete(key); },
    async keys() {
      const out = [];
      const { blobs } = await s.list();
      for (const b of blobs) out.push(b.key);
      return out;
    },
  };
}

export function safeEqual(a, b) {
  const x = Buffer.from(String(a || ""));
  const y = Buffer.from(String(b || ""));
  if (x.length !== y.length || x.length === 0) return false;
  return timingSafeEqual(x, y);
}

export function isAdmin(req) {
  const secret = process.env.ADMIN_SECRET || "";
  if (!secret) return false;
  return safeEqual(req.headers.get("x-admin-secret"), secret);
}

// Same-origin only (the app and its functions live on the same site).
export function originOk(req) {
  const origin = req.headers.get("origin");
  if (!origin) return true; // sendBeacon / same-origin GET
  const allowed = (process.env.AI_ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (allowed.length) return allowed.includes(origin);
  try {
    return new URL(origin).host === new URL(req.url).host;
  } catch (e) {
    return false;
  }
}

const hits = new Map();
export function rateLimited(req, bucket, limit, windowMs = 60000) {
  const ip = (req.headers.get("x-nf-client-connection-ip") || req.headers.get("x-forwarded-for") || "?").split(",")[0].trim();
  const k = bucket + ":" + ip;
  const now = Date.now();
  const arr = (hits.get(k) || []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(k, arr);
  if (hits.size > 5000) for (const [kk, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(kk);
  return arr.length > limit;
}

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export function makeCode() {
  const bytes = randomBytes(12);
  let s = "";
  for (let i = 0; i < 12; i++) s += ALPHABET[bytes[i] % ALPHABET.length];
  return s.slice(0, 4) + "-" + s.slice(4, 8) + "-" + s.slice(8, 12);
}

export async function readJson(req, max = 8192) {
  const text = await req.text();
  if (text.length > max) throw new Error("too large");
  return text ? JSON.parse(text) : {};
}

export const validId = (v) => typeof v === "string" && /^[A-Za-z0-9_-]{8,64}$/.test(v);

// ---- Supabase helpers shared by promo-redeem and promo-admin ----------------------------------

// The project URL and the publishable (anon) key are public: the browser already ships them in
// src/services/cloud-sync.js. They are used as a fallback so the functions keep working when only the
// secret key was added to Netlify. Only the service-role (secret) key has to be configured.
const PUBLIC_SUPABASE_URL = "https://cdnwkqidxgeluxxoheoo.supabase.co";
const PUBLIC_SUPABASE_ANON_KEY = "sb_publishable_spV56yK2wRuDitapAVZO4g_E2SJrC08";

export function supabaseConfig() {
  const env = process.env;
  return {
    url: String(env.SUPABASE_URL || env.VITE_SUPABASE_URL || PUBLIC_SUPABASE_URL).replace(/\/+$/, ""),
    anonKey: env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || PUBLIC_SUPABASE_ANON_KEY,
    serviceKey: env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY || "",
  };
}

const MSG_NO_SERVICE_KEY =
  "The server has no SUPABASE_SERVICE_ROLE_KEY. In Netlify > Site configuration > Environment variables add it " +
  "(Supabase > Project Settings > API > service_role / secret key), then redeploy the site.";

// Headers for a request made with an API key. The new-style keys (sb_...) are not JWTs, so they go
// in `apikey` only; legacy JWT keys are also sent as the bearer token.
function keyHeaders(key, extra) {
  const h = { apikey: key, "Content-Type": "application/json", ...(extra || {}) };
  if (!String(key).startsWith("sb_")) h.Authorization = `Bearer ${key}`;
  return h;
}

// Verifies the caller's Supabase login token. Returns { userId } on success, otherwise
// { reason, message } where reason is "no-token" | "bad-token" | "unreachable".
// The token is checked with the public key: that call does not need the secret key at all.
export async function authenticate(req) {
  const m = /^Bearer (.+)$/.exec(req.headers.get("authorization") || "");
  if (!m) {
    return {
      reason: "no-token",
      message: "This device sent no login. Open Settings > Account, make sure you are signed in (sign out and in again if you are), then retry.",
    };
  }
  const { url, anonKey } = supabaseConfig();
  try {
    const r = await fetch(`${url}/auth/v1/user`, { headers: keyHeaders(anonKey, { Authorization: `Bearer ${m[1]}` }) });
    if (r.status === 401 || r.status === 403) {
      return { reason: "bad-token", message: "Your login has expired. Sign out and sign in again in Settings > Account, then retry." };
    }
    if (!r.ok) return { reason: "unreachable", message: `Couldn't verify your login (Supabase answered ${r.status}).` };
    const u = await r.json();
    if (u && typeof u.id === "string") return { userId: u.id };
    return { reason: "bad-token", message: "Your login could not be verified. Sign out and sign in again, then retry." };
  } catch (e) {
    return { reason: "unreachable", message: "Couldn't reach Supabase to verify your login." };
  }
}

// Kept for callers that only need the id.
export async function userFromToken(req) {
  const r = await authenticate(req);
  return r.userId || null;
}

function sbHeaders() {
  return keyHeaders(supabaseConfig().serviceKey);
}

// Turns a failed PostgREST answer into a message that says what to fix.
async function explainFailure(res, what) {
  let detail = "";
  try { detail = (await res.text()).slice(0, 300); } catch (e) {}
  if (res.status === 404 || /PGRST205|42P01|does not exist|schema cache/i.test(detail)) {
    return "The entitlements table doesn't exist yet. Run supabase-entitlements.sql in the Supabase SQL editor.";
  }
  if (res.status === 401 || res.status === 403 || /permission denied|42501|Invalid API key|JWT/i.test(detail)) {
    return "Supabase refused the server's key. Check SUPABASE_SERVICE_ROLE_KEY in Netlify (must be the service_role / secret key) and re-run supabase-entitlements.sql so the grants exist.";
  }
  return `Supabase error while ${what} (${res.status}). ${detail}`.trim();
}

const DAYS = { monthly: 30, yearly: 365 };

// Writes Pro to the `entitlements` table, extending (never shortening) what the user already has.
// Returns { ok: true } or { ok: false, message }.
export async function grantEntitlement(userId, type) {
  const { url, serviceKey } = supabaseConfig();
  if (!serviceKey) return { ok: false, message: MSG_NO_SERVICE_KEY };
  if (!(type === "permanent" || DAYS[type])) return { ok: false, message: "Unknown type." };
  try {
    const headers = sbHeaders();
    const cur = await fetch(`${url}/rest/v1/entitlements?user_id=eq.${encodeURIComponent(userId)}&select=premium_type,premium_expires_at`, { headers });
    if (!cur.ok) return { ok: false, message: await explainFailure(cur, "reading the entitlement") };
    const row = (await cur.json())[0];
    let expires = null;
    if (type !== "permanent" && row?.premium_type !== "permanent") {
      const base = Math.max(Date.now(), row?.premium_expires_at ? Date.parse(row.premium_expires_at) : 0);
      expires = new Date(base + DAYS[type] * 864e5).toISOString();
    }
    const finalType = row?.premium_type === "permanent" ? "permanent" : type;
    const up = await fetch(`${url}/rest/v1/entitlements?on_conflict=user_id`, {
      method: "POST",
      headers: { ...headers, Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ user_id: userId, premium_type: finalType, premium_expires_at: finalType === "permanent" ? null : expires, updated_at: new Date().toISOString() }),
    });
    if (!up.ok) return { ok: false, message: await explainFailure(up, "saving the entitlement") };
    return { ok: true };
  } catch (e) {
    return { ok: false, message: "Couldn't reach Supabase to save Premium." };
  }
}

// Removes Pro from the server (admin "Revoke"). Returns { ok: true } or { ok: false, message }.
export async function revokeEntitlement(userId) {
  const { url, serviceKey } = supabaseConfig();
  if (!serviceKey) return { ok: false, message: MSG_NO_SERVICE_KEY };
  try {
    const r = await fetch(`${url}/rest/v1/entitlements?user_id=eq.${encodeURIComponent(userId)}`, {
      method: "DELETE",
      headers: { ...sbHeaders(), Prefer: "return=minimal" },
    });
    if (!r.ok) return { ok: false, message: await explainFailure(r, "revoking the entitlement") };
    return { ok: true };
  } catch (e) {
    return { ok: false, message: "Couldn't reach Supabase to revoke Premium." };
  }
}
