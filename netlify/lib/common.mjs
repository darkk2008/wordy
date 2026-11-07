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

// Verifies the caller's Supabase login token and returns the user id (or null).
export async function userFromToken(req) {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  const m = /^Bearer (.+)$/.exec(req.headers.get("authorization") || "");
  if (!m || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${m[1]}` },
    });
    if (!r.ok) return null;
    const u = await r.json();
    return u && typeof u.id === "string" ? u.id : null;
  } catch (e) { return null; }
}

function sbHeaders() {
  const { SUPABASE_SERVICE_ROLE_KEY } = process.env;
  return { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, "Content-Type": "application/json" };
}

const DAYS = { monthly: 30, yearly: 365 };

// Writes Pro to the `entitlements` table, extending (never shortening) what the user already has.
export async function grantEntitlement(userId, type) {
  const { SUPABASE_URL } = process.env;
  if (!SUPABASE_URL || !(type === "permanent" || DAYS[type])) return false;
  const headers = sbHeaders();
  const cur = await fetch(`${SUPABASE_URL}/rest/v1/entitlements?user_id=eq.${userId}&select=premium_type,premium_expires_at`, { headers });
  if (!cur.ok) return false;
  const row = (await cur.json())[0];
  let expires = null;
  if (type !== "permanent" && row?.premium_type !== "permanent") {
    const base = Math.max(Date.now(), row?.premium_expires_at ? Date.parse(row.premium_expires_at) : 0);
    expires = new Date(base + DAYS[type] * 864e5).toISOString();
  }
  const finalType = row?.premium_type === "permanent" ? "permanent" : type;
  const up = await fetch(`${SUPABASE_URL}/rest/v1/entitlements?on_conflict=user_id`, {
    method: "POST",
    headers: { ...headers, Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ user_id: userId, premium_type: finalType, premium_expires_at: finalType === "permanent" ? null : expires, updated_at: new Date().toISOString() }),
  });
  return up.ok;
}

// Removes Pro from the server (admin "Revoke").
export async function revokeEntitlement(userId) {
  const { SUPABASE_URL } = process.env;
  if (!SUPABASE_URL) return false;
  const r = await fetch(`${SUPABASE_URL}/rest/v1/entitlements?user_id=eq.${userId}`, {
    method: "DELETE",
    headers: { ...sbHeaders(), Prefer: "return=minimal" },
  });
  return r.ok;
}
