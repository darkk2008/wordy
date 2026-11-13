// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { FAIR_USE_AI_LIMIT, premiumSystemEnabled } from "../premium-status";

afterEach(() => {
  delete window.DM_CONFIG;
});

describe("premium master switch", () => {
  it("is off when the flag is missing or false", () => {
    expect(premiumSystemEnabled()).toBe(false);
    window.DM_CONFIG = { premiumEnabled: false };
    expect(premiumSystemEnabled()).toBe(false);
  });
  it("is on only when premiumEnabled is true", () => {
    window.DM_CONFIG = { premiumEnabled: true };
    expect(premiumSystemEnabled()).toBe(true);
  });
  it("keeps a daily AI cap while premium is off", () => {
    expect(FAIR_USE_AI_LIMIT).toBeGreaterThan(0);
    expect(Number.isFinite(FAIR_USE_AI_LIMIT)).toBe(true);
  });
});
