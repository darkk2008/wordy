import { afterEach, describe, expect, it, vi } from "vitest";
import { dateStr, todayStr, yesterdayStr } from "../constants";

afterEach(() => vi.useRealTimers());

describe("local calendar dates", () => {
  it("dateStr uses local fields, zero-padded", () => {
    expect(dateStr(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });
  it("todayStr follows local midnight, not UTC", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 13, 0, 30)); // 00:30 local on 13 Nov, whatever the zone
    expect(todayStr()).toBe("2026-11-13");
    expect(yesterdayStr()).toBe("2026-11-12");
  });
  it("yesterdayStr crosses month and year borders", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 1, 12, 0));
    expect(yesterdayStr()).toBe("2025-12-31");
  });
});
