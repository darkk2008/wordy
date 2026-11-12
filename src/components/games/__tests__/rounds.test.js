import { describe, expect, it } from "vitest";
import { chunkIntoRounds } from "../rounds";

const mk = (n) => Array.from({ length: n }, (_, i) => ({ id: i }));

describe("chunkIntoRounds", () => {
  it("keeps a small stack as a single round", () => {
    expect(chunkIntoRounds(mk(5), 6)).toHaveLength(1);
    expect(chunkIntoRounds(mk(6), 6)).toHaveLength(1);
  });
  it("splits into rounds of N in order", () => {
    const r = chunkIntoRounds(mk(18), 6);
    expect(r.map((x) => x.length)).toEqual([6, 6, 6]);
    expect(r[1][0].id).toBe(6);
  });
  it("keeps a reasonable last round", () => {
    expect(chunkIntoRounds(mk(15), 6).map((x) => x.length)).toEqual([6, 6, 3]);
  });
  it("folds a tiny leftover into the previous round", () => {
    expect(chunkIntoRounds(mk(13), 6).map((x) => x.length)).toEqual([6, 7]);
    expect(chunkIntoRounds(mk(7), 6).map((x) => x.length)).toEqual([7]);
  });
  it("uses every word exactly once", () => {
    const ids = chunkIntoRounds(mk(25), 6).flat().map((w) => w.id);
    expect(ids.sort((a, b) => a - b)).toEqual(mk(25).map((w) => w.id));
  });
});
