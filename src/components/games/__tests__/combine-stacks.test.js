import { describe, expect, it } from "vitest";
import { MULTI_STACK_ID, combineStacks, uniqueWordCount } from "../combine-stacks";

const w = (id) => ({ id, de: id, en: id, type: "noun" });
const A = { id: "a", name: "A", words: [w("1"), w("2")] };
const B = { id: "b", name: "B", words: [w("3"), w("2")] }; // "2" is in both
const FAV = { id: "__favorites__", name: "Favorites", words: [{ ...w("1"), _stackId: "a", favorite: true }] };

describe("combineStacks", () => {
  it("merges the words of several stacks into one stack", () => {
    const c = combineStacks([A, B]);
    expect(c.id).toBe(MULTI_STACK_ID);
    expect(c.name).toBe("2 stacks");
    expect(c.words.map((x) => x.id)).toEqual(["1", "2", "3"]);
  });
  it("remembers which stack every word really lives in (so answers are saved there)", () => {
    const c = combineStacks([A, B]);
    expect(c.words.map((x) => x._stackId)).toEqual(["a", "a", "b"]);
  });
  it("a favorite and its original stack give the word only once, still pointing at the real stack", () => {
    const c = combineStacks([FAV, A]);
    expect(c.words.map((x) => x.id)).toEqual(["1", "2"]);
    expect(c.words[0]._stackId).toBe("a");
    expect(c.words[0].favorite).toBe(true);
  });
  it("does not change the stacks it is given", () => {
    combineStacks([A, B]);
    expect(A.words[0]._stackId).toBeUndefined();
    expect(A.words).toHaveLength(2);
  });
  it("counts each word once", () => {
    expect(uniqueWordCount([A, B])).toBe(3);
    expect(uniqueWordCount([FAV, A])).toBe(2);
    expect(uniqueWordCount([])).toBe(0);
  });
  it("copes with empty input and stacks without words", () => {
    expect(combineStacks([]).words).toEqual([]);
    expect(combineStacks([null, { id: "x", name: "X" }]).words).toEqual([]);
  });
});
