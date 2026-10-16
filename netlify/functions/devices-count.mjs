import { json, kv, isAdmin } from "../lib/common.mjs";
// Only the admin panel needs this number.
export default async (req) => {
  if (!isAdmin(req)) return json(401, { count: null });
  const store = await kv("devices");
  return json(200, { count: (await store.keys()).length });
};
