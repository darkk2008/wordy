// Validates and consumes a promo code. The app applies the effect locally;
// the server's job is to make sure each code can only be used as intended.
import { json, kv, readJson, rateLimited, originOk, validId } from "../lib/common.mjs";

const MESSAGES = {
  monthly: "Premium unlocked for 30 days.",
  yearly: "Premium unlocked for 1 year.",
  permanent: "Premium unlocked forever.",
};

const DAYS = { monthly: 30, yearly: 365 };

// Verifies the caller's Supabase login token and returns the user id (or null).
async function userFromToken(req) {
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

// Writes Pro to the `entitlements` table, extending (never shortening) what the user already has.
async function grantEntitlement(userId, type) {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  const headers = { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, "Content-Type": "application/json" };
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

export default async (req) => {
  if (req.method !== "POST") return json(405, { ok: false, message: "POST only." });
  if (!originOk(req)) return json(403, { ok: false, message: "Not allowed." });
  // Brute-force guard: few attempts per minute per IP.
  if (rateLimited(req, "redeem", 8)) return json(429, { ok: false, message: "Too many attempts. Try again in a minute." });
  let body;
  try { body = await readJson(req); } catch (e) { return json(400, { ok: false, message: "Bad request." }); }
  const code = String(body.code || "").trim().toUpperCase();
  if (!/^[A-Z0-9-]{4,32}$/.test(code)) return json(200, { ok: false, message: "That code isn't valid." });
  const deviceId = validId(body.deviceId) ? body.deviceId : "unknown";

  const store = await kv("promo");
  const entry = await store.get(code);
  if (!entry) return json(200, { ok: false, message: "That code isn't valid." });

  if (entry.type === "discount") {
    if (entry.expiresAt && entry.expiresAt < Date.now()) return json(200, { ok: false, message: "That code has expired." });
    if ((entry.usesCount || 0) >= entry.maxUses) return json(200, { ok: false, message: "That code has reached its limit." });
    const used = entry.usedBy || [];
    if (used.includes(deviceId) && deviceId !== "unknown") return json(200, { ok: false, message: "You already used this code." });
    entry.usesCount = (entry.usesCount || 0) + 1;
    entry.usedBy = used.concat(deviceId).slice(-1000);
    await store.set(code, entry);
    return json(200, {
      ok: true, kind: "discount", percent: entry.percent, code, expiresAt: entry.expiresAt || null,
      message: `${entry.percent}% discount applied.`,
    });
  }

  if (entry.used) return json(200, { ok: false, message: "That code was already used." });
  // Signed-in user + premium code: write Pro on the server FIRST, so a failure never burns the code.
  let entitled = false;
  if (DAYS[entry.type] || entry.type === "permanent") {
    const userId = await userFromToken(req);
    if (userId) {
      if (!(await grantEntitlement(userId, entry.type))) return json(200, { ok: false, message: "Couldn't save your Premium. Try again." });
      entitled = true;
    }
  }
  entry.used = true;
  entry.usedAt = Date.now();
  entry.usedBy = deviceId;
  await store.set(code, entry);

  if (entry.type === "gems") {
    return json(200, { ok: true, kind: "gems", amount: entry.amount, message: `${entry.amount} gems added.` });
  }
  return json(200, { ok: true, kind: "premium", type: entry.type, entitled, message: MESSAGES[entry.type] || "Premium unlocked." });
};
