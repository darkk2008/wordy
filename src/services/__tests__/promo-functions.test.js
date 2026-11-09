/* global process */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import promoAdmin from "../../../netlify/functions/promo-admin.mjs";

// Fake Supabase: /auth/v1/user (token check) and /rest/v1/entitlements (read + upsert + delete).
function fakeSupabase({ users = { good: "user-1" }, table = {}, tableMissing = false } = {}) {
  const calls = [];
  globalThis.fetch = vi.fn(async (url, init = {}) => {
    const u = String(url);
    calls.push({ url: u, init });
    if (u.includes("/auth/v1/user")) {
      const tok = /^Bearer (.+)$/.exec(init.headers.Authorization || "")?.[1];
      return users[tok] ? new Response(JSON.stringify({ id: users[tok] })) : new Response("{}", { status: 401 });
    }
    if (u.includes("/rest/v1/entitlements")) {
      if (tableMissing) return new Response('{"code":"PGRST205"}', { status: 404 });
      const method = init.method || "GET";
      if (method === "GET") {
        const id = /user_id=eq\.([^&]+)/.exec(u)[1];
        return new Response(JSON.stringify(table[id] ? [table[id]] : []));
      }
      if (method === "POST") {
        const row = JSON.parse(init.body);
        table[row.user_id] = row;
        return new Response(null, { status: 201 });
      }
      if (method === "DELETE") {
        delete table[/user_id=eq\.([^&]+)/.exec(u)[1]];
        return new Response(null, { status: 204 });
      }
    }
    return new Response("{}", { status: 500 });
  });
  return { calls, table };
}

const call = (body, headers = {}) =>
  promoAdmin(
    new Request("https://x.test/.netlify/functions/promo-admin", {
      method: "POST",
      headers: { "x-admin-secret": "s3cret", "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
    })
  ).then((r) => r.json());

describe("promo-admin grant-self", () => {
  const realFetch = globalThis.fetch;
  beforeEach(() => {
    process.env.ADMIN_SECRET = "s3cret";
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";
  });
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it("verifies the login with the public key, so it works even without a URL env var", async () => {
    const { calls, table } = fakeSupabase();
    const r = await call({ action: "grant-self", type: "permanent" }, { authorization: "Bearer good" });
    expect(r.ok).toBe(true);
    expect(table["user-1"].premium_type).toBe("permanent");
    const auth = calls.find((c) => c.url.includes("/auth/v1/user"));
    expect(auth.init.headers.apikey).toMatch(/^sb_publishable_/);
  });

  it("asks to sign in only when there really is no / a bad token", async () => {
    fakeSupabase();
    const none = await call({ action: "grant-self", type: "yearly" });
    expect(none.needsLogin).toBe(true);
    const bad = await call({ action: "grant-self", type: "yearly" }, { authorization: "Bearer nope" });
    expect(bad.needsLogin).toBe(true);
    expect(bad.message).toMatch(/expired/);
  });

  it("names the missing service key instead of blaming the login", async () => {
    fakeSupabase();
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const r = await call({ action: "grant-self", type: "monthly" }, { authorization: "Bearer good" });
    expect(r.ok).toBe(false);
    expect(r.needsLogin).toBeFalsy();
    expect(r.message).toMatch(/SUPABASE_SERVICE_ROLE_KEY/);
  });

  it("tells you to run the SQL when the table is missing", async () => {
    fakeSupabase({ tableMissing: true });
    const r = await call({ action: "grant-self", type: "monthly" }, { authorization: "Bearer good" });
    expect(r.ok).toBe(false);
    expect(r.message).toMatch(/supabase-entitlements\.sql/);
  });

  it("revokes", async () => {
    const { table } = fakeSupabase({ table: { "user-1": { premium_type: "permanent" } } });
    const r = await call({ action: "revoke-self" }, { authorization: "Bearer good" });
    expect(r.ok).toBe(true);
    expect(table["user-1"]).toBeUndefined();
  });
});
