import { json, kv, isAdmin } from "../lib/common.mjs";
export default async (req) => {
  if (!isAdmin(req)) return json(401, { online: null });
  const store = await kv("presence");
  const map = (await store.get("all")) || {};
  const now = Date.now();
  return json(200, { online: Object.values(map).filter((t) => now - t <= 60000).length });
};
