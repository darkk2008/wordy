import { describe, it, expect, beforeEach, vi } from "vitest";

const store = {};
beforeEach(() => {
  for (const k in store) delete store[k];
  globalThis.window = {
    localStorage: {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => void (store[k] = String(v)),
      removeItem: (k) => void delete store[k],
    },
    dispatchEvent: () => true,
  };
  globalThis.CustomEvent = class { constructor(t, o) { this.type = t; this.detail = o && o.detail; } };
  vi.resetModules();
});

async function load() {
  return import("../premium-status");
}

describe("loadPremiumStatus", () => {
  it("is inactive when nothing is stored", async () => {
    const { loadPremiumStatus } = await load();
    expect(loadPremiumStatus().active).toBe(false);
  });

  it("treats an expired subscription as inactive", async () => {
    const { loadPremiumStatus } = await load();
    const { ADMIN_PREMIUM_KEY } = await import("../../core/srs-and-seed-data");
    store[ADMIN_PREMIUM_KEY] = JSON.stringify({ active: true, type: "monthly", expiresAt: Date.now() - 1000 });
    expect(loadPremiumStatus().active).toBe(false);
  });

  it("keeps a valid subscription active", async () => {
    const { loadPremiumStatus } = await load();
    const { ADMIN_PREMIUM_KEY } = await import("../../core/srs-and-seed-data");
    store[ADMIN_PREMIUM_KEY] = JSON.stringify({ active: true, type: "yearly", expiresAt: Date.now() + 1e9 });
    expect(loadPremiumStatus().active).toBe(true);
  });
});
