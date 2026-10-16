import { json, kv, readJson, rateLimited, originOk, validId } from "../lib/common.mjs";
export default async (req) => {
  if (req.method !== "POST") return json(405, { ok: false });
  if (!originOk(req) || rateLimited(req, "device", 20)) return json(429, { ok: false });
  let body;
  try { body = await readJson(req, 1024); } catch (e) { return json(400, { ok: false }); }
  if (!validId(body.deviceId)) return json(400, { ok: false });
  const store = await kv("devices");
  if (!(await store.get(body.deviceId))) await store.set(body.deviceId, { firstSeen: Date.now() });
  return json(200, { ok: true });
};
