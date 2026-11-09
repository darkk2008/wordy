// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";

// Minimal in-memory stand-in for the Supabase client: one user_data row, update().eq().eq().select(),
// upsert(..., {ignoreDuplicates}).select(), and channel().on().subscribe().
function makeFakeSupabase() {
  const db = { row: null };
  const query = (op, row, opts) => {
    const filters = {};
    const q = {
      eq(k, v) {
        filters[k] = v;
        return q;
      },
      async select() {
        if (op === "update") {
          if (!db.row || Object.keys(filters).some((k) => db.row[k] !== filters[k]))
            return { data: [], error: null };
          db.row = { ...row };
          return { data: [{ updated_at: db.row.updated_at }], error: null };
        }
        if (db.row && opts && opts.ignoreDuplicates) return { data: [], error: null };
        db.row = { ...row };
        return { data: [{ updated_at: db.row.updated_at }], error: null };
      },
    };
    return q;
  };
  const statusCbs = [];
  const client = {
    auth: { getSession: async () => ({ data: { session: { user: { id: "u1" } } } }) },
    from: () => ({
      update: (row) => query("update", row),
      upsert: (row, opts) => query("upsert", row, opts),
    }),
    channel: () => {
      const ch = {
        on: () => ch,
        subscribe: (cb) => {
          statusCbs.push(cb);
          return ch;
        },
      };
      return ch;
    },
    removeChannel: () => {},
  };
  return { db, client, statusCbs };
}

async function loadCloud(fake, deviceId) {
  vi.resetModules();
  window.localStorage.clear();
  window.localStorage.setItem("wordify-device-id", deviceId);
  window.supabase = { createClient: () => fake.client };
  await import("../cloud-sync.js");
  return window.wwordyCloud;
}

describe("cloud sync", () => {
  let fake;
  beforeEach(() => {
    fake = makeFakeSupabase();
  });

  it("first write succeeds, a second device's first write is a conflict", async () => {
    const a = await loadCloud(fake, "A");
    const r1 = await a.pushDataChecked({ stacks: [1] }, null);
    expect(r1.ok).toBe(true);
    const b = await loadCloud(fake, "B");
    const r2 = await b.pushDataChecked({ stacks: [] }, null);
    expect(r2.conflict).toBe(true);
    expect(fake.db.row.payload.stacks).toEqual([1]);
  });

  it("a stale device cannot overwrite a newer upload", async () => {
    const a = await loadCloud(fake, "A");
    const first = await a.pushDataChecked({ stacks: ["s1"] }, null);
    const b = await loadCloud(fake, "B");
    // A pushes a new stack; B still believes the row is at `first.updatedAt`.
    await new Promise((r) => setTimeout(r, 5));
    const a2 = await loadCloud(fake, "A");
    const second = await a2.pushDataChecked({ stacks: ["s1", "s2"] }, first.updatedAt);
    expect(second.ok).toBe(true);
    const stale = await b.pushDataChecked({ stacks: ["s1", "only-b"] }, first.updatedAt);
    expect(stale.conflict).toBe(true);
    expect(fake.db.row.payload.stacks).toEqual(["s1", "s2"]);
    expect(fake.db.row.updated_by_device).toBe("A");
  });

  it("subscribe reconnects after a channel error", async () => {
    vi.useFakeTimers();
    const a = await loadCloud(fake, "A");
    const stop = a.subscribe(() => {});
    await vi.advanceTimersByTimeAsync(0);
    expect(fake.statusCbs.length).toBe(1);
    fake.statusCbs[0]("CHANNEL_ERROR");
    await vi.advanceTimersByTimeAsync(5100);
    expect(fake.statusCbs.length).toBe(2);
    stop();
    vi.useRealTimers();
  });
});
