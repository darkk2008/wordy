// Admin API for promo codes. Needs the ADMIN_SECRET environment variable.
import { json, kv, isAdmin, readJson, makeCode, rateLimited } from "../lib/common.mjs";

export default async (req) => {
  if (req.method !== "POST") return json(405, { ok: false, message: "POST only." });
  if (rateLimited(req, "promo-admin", 30)) return json(429, { ok: false, message: "Too many requests." });
  if (!isAdmin(req)) return json(401, { ok: false, message: "Unauthorized." });
  let body;
  try { body = await readJson(req); } catch (e) { return json(400, { ok: false, message: "Bad request." }); }
  const store = await kv("promo");
  const action = body.action;

  if (action === "list") {
    const codes = [];
    for (const k of await store.keys()) {
      const c = await store.get(k);
      if (c) codes.push(c);
    }
    codes.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return json(200, { ok: true, codes });
  }

  if (action === "create") {
    const type = body.type;
    const o = body.options || {};
    const entry = { code: makeCode(), type, createdAt: Date.now(), used: false, usedAt: null };
    if (type === "gems") {
      const amount = Math.round(Number(o.amount));
      if (!(amount >= 1 && amount <= 100000)) return json(400, { ok: false, message: "Gems amount must be 1-100000." });
      entry.amount = amount;
    } else if (type === "discount") {
      const percent = Math.round(Number(o.percent));
      const maxUses = Math.round(Number(o.maxUses));
      if (!(percent >= 1 && percent <= 100)) return json(400, { ok: false, message: "Percent must be 1-100." });
      if (!(maxUses >= 1 && maxUses <= 100000)) return json(400, { ok: false, message: "Max uses must be 1-100000." });
      entry.percent = percent;
      entry.maxUses = maxUses;
      entry.usesCount = 0;
      entry.expiresAt = o.expiresAt ? Number(o.expiresAt) : null;
    } else if (!["monthly", "yearly", "permanent"].includes(type)) {
      return json(400, { ok: false, message: "Unknown code type." });
    }
    await store.set(entry.code, entry);
    return json(200, { ok: true, code: entry.code, entry });
  }

  if (action === "delete") {
    const code = String(body.code || "").toUpperCase();
    if (!/^[A-Z0-9-]{4,32}$/.test(code)) return json(400, { ok: false, message: "Bad code." });
    await store.del(code);
    return json(200, { ok: true });
  }
  return json(400, { ok: false, message: "Unknown action." });
};
