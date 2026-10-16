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
