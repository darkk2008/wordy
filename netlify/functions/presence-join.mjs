import { json, kv, readJson, rateLimited, originOk, validId } from "../lib/common.mjs";
export const TTL_MS = 60000;
export default async (req) => {
  if (req.method !== "POST") return json(405, { ok: false });
  if (!originOk(req) || rateLimited(req, "presence", 30)) return json(429, { ok: false });
  let body;
  try { body = await readJson(req, 1024); } catch (e) { return json(400, { ok: false }); }
  if (!validId(body.id)) return json(400, { ok: false });
  const store = await kv("presence");
  const now = Date.now();
  const map = (await store.get("all")) || {};
  for (const k of Object.keys(map)) if (now - map[k] > TTL_MS) delete map[k];
  map[body.id] = now;
  await store.set("all", map);
  return json(200, { ok: true });
};
