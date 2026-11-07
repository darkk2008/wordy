// Validates and consumes a promo code. The app applies the effect locally;
// the server's job is to make sure each code can only be used as intended.
import { json, kv, readJson, rateLimited, originOk, validId, userFromToken, grantEntitlement } from "../lib/common.mjs";

const MESSAGES = {
  monthly: "Premium unlocked for 30 days.",
  yearly: "Premium unlocked for 1 year.",
  permanent: "Premium unlocked forever.",
};

const DAYS = { monthly: 30, yearly: 365 };

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
  // Premium lives on the server, tied to an account. Without a valid login there is nowhere to
  // store it (a device-only grant is wiped by the next sync), so refuse WITHOUT burning the code.
  let entitled = false;
  if (DAYS[entry.type] || entry.type === "permanent") {
    const userId = await userFromToken(req);
    if (!userId) return json(200, { ok: false, needsLogin: true, message: "Sign in to your account first, then enter the code again. Your code was not used." });
    if (!(await grantEntitlement(userId, entry.type))) return json(200, { ok: false, message: "Couldn't save your Premium. Try again." });
    entitled = true;
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
