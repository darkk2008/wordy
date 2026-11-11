import { describe, expect, it } from "vitest";
import { countByColor, isWordColor, withColor, wordsWithColor } from "../word-colors";

const stacks = [
  { id: "a", name: "A", words: [{ id: "1", color: "red" }, { id: "2" }] },
  { id: "b", name: "B", words: [{ id: "3", color: "red" }, { id: "4", color: "nope" }] },
];

describe("word colours", () => {
  it("validates ids", () => {
    expect(isWordColor("blue")).toBe(true);
    expect(isWordColor("nope")).toBe(false);
  });
  it("sets and clears a colour", () => {
    expect(withColor({ id: "1" }, "green").color).toBe("green");
    expect("color" in withColor({ id: "1", color: "red" }, "")).toBe(false);
    expect("color" in withColor({ id: "1" }, "bogus")).toBe(false);
  });
  it("collects words across stacks, tagged with their stack", () => {
    const w = wordsWithColor(stacks, "red");
    expect(w.map((x) => [x.id, x.stackId])).toEqual([["1", "a"], ["3", "b"]]);
  });
  it("counts only known colours", () => {
    expect(countByColor(stacks)).toEqual({ red: 2 });
  });
});
