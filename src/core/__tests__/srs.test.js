import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { bumpSrs, isHardWord, shuffle } from "../srs-and-seed-data";
import { SRS_STEPS, DAY } from "../constants";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
});
afterEach(() => vi.useRealTimers());

describe("bumpSrs", () => {
  it("starts a new word at level 0 and moves up on a correct answer", () => {
    const r = bumpSrs({}, true);
    expect(r.level).toBe(1);
    expect(r.correct).toBe(1);
    expect(r.wrong).toBe(0);
    expect(r.streak).toBe(1);
    expect(r.next).toBe(Date.now() + SRS_STEPS[1] * DAY);
  });

  it("never goes above the last step", () => {
    const top = SRS_STEPS.length - 1;
    const r = bumpSrs({ srs: { level: top, correct: 5, wrong: 0, next: 0 } }, true);
    expect(r.level).toBe(top);
  });

  it("resets to level 0 and breaks the streak on a wrong answer", () => {
    const r = bumpSrs({ srs: { level: 3, correct: 4, wrong: 0, streak: 4, next: 0 } }, false);
    expect(r.level).toBe(0);
    expect(r.streak).toBe(0);
    expect(r.wrong).toBe(1);
    expect(r.miss).toBe(1);
  });

  it("marks a word hard after two misses, and clears it after a 3-correct streak", () => {
    let w = { srs: { level: 0, correct: 0, wrong: 0, next: 0 } };
    w = { srs: bumpSrs(w, false) };
    expect(w.srs.hard).toBe(false);
    w = { srs: bumpSrs(w, false) };
    expect(w.srs.hard).toBe(true);
    for (let i = 0; i < 3; i++) w = { srs: bumpSrs(w, true) };
    expect(w.srs.hard).toBe(false);
    expect(w.srs.miss).toBe(0);
  });
});

describe("isHardWord", () => {
  it("is false without srs data", () => {
    expect(isHardWord(null)).toBe(false);
    expect(isHardWord({})).toBe(false);
  });
  it("respects an explicit hard flag", () => {
    expect(isHardWord({ srs: { hard: true } })).toBe(true);
    expect(isHardWord({ srs: { hard: false, wrong: 9, correct: 0 } })).toBe(false);
  });
  it("falls back to wrong >= 2 and wrong > correct for old data", () => {
    expect(isHardWord({ srs: { wrong: 2, correct: 1 } })).toBe(true);
    expect(isHardWord({ srs: { wrong: 2, correct: 2 } })).toBe(false);
    expect(isHardWord({ srs: { wrong: 1, correct: 0 } })).toBe(false);
  });
});

describe("shuffle", () => {
  it("returns a new array with the same items", () => {
    const src = [1, 2, 3, 4, 5];
    const out = shuffle(src);
    expect(out).not.toBe(src);
    expect([...out].sort()).toEqual(src);
    expect(src).toEqual([1, 2, 3, 4, 5]);
  });
});
