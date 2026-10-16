// Validates and consumes a promo code. The app applies the effect locally;
// the server's job is to make sure each code can only be used as intended.
import { json, kv, readJson, rateLimited, originOk, validId } from "../lib/common.mjs";

const MESSAGES = {
  monthly: "Premium unlocked for 30 days.",
  yearly: "Premium unlocked for 1 year.",
  permanent: "Premium unlocked forever.",
};

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
  entry.used = true;
  entry.usedAt = Date.now();
  entry.usedBy = deviceId;
  await store.set(code, entry);

  if (entry.type === "gems") {
    return json(200, { ok: true, kind: "gems", amount: entry.amount, message: `${entry.amount} gems added.` });
  }
  return json(200, { ok: true, kind: "premium", type: entry.type, message: MESSAGES[entry.type] || "Premium unlocked." });
};
