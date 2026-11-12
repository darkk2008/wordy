import { describe, expect, it } from "vitest";
import { hashOf, mergeThreeWay, sameSnapshot, snapshot, stable } from "../sync-merge";

const w = (id, extra = {}) => ({ id, de: "de" + id, en: "en" + id, ...extra });
const stack = (id, words, extra = {}) => ({ id, name: "S" + id, emoji: "book", words, ...extra });
const data = (stacks, rest = {}) => ({ stacks, families: [], miniStacks: {}, favMiniStack: null, ...rest });
const ids = (stacks, sid) => stacks.find((s) => s.id === sid).words.map((x) => x.id);

describe("stable hashing", () => {
  it("ignores key order (Postgres jsonb reorders keys)", () => {
    expect(stable({ a: 1, b: { c: 2, d: 3 } })).toBe(stable({ b: { d: 3, c: 2 }, a: 1 }));
    expect(hashOf({ a: 1, b: 2 })).toBe(hashOf({ b: 2, a: 1 }));
    expect(hashOf({ a: 1 })).not.toBe(hashOf({ a: 2 }));
  });
});

describe("three-way merge", () => {
  const base = data([stack("s1", [w("1"), w("2"), w("3")])]);
  const snap = snapshot(base);

  it("keeps offline progress on a word the cloud did not change (old code let the cloud win)", () => {
    const local = data([stack("s1", [w("1", { srs: { level: 3, correct: 5, wrong: 0 } }), w("2"), w("3")])]);
    const remote = data([stack("s1", [w("1"), w("2"), w("3"), w("4")])]); // other device only added a word
    const m = mergeThreeWay(snap, local, remote);
    expect(m.stacks[0].words.find((x) => x.id === "1").srs.level).toBe(3);
    expect(ids(m.stacks, "s1")).toEqual(["1", "2", "3", "4"]);
  });

  it("propagates a deletion made on the other device (old code resurrected it)", () => {
    const local = data([stack("s1", [w("1"), w("2"), w("3")])]); // unchanged here
    const remote = data([stack("s1", [w("1"), w("3")])]); // word 2 deleted there
    expect(ids(mergeThreeWay(snap, local, remote).stacks, "s1")).toEqual(["1", "3"]);
  });

  it("propagates a deletion made on this device", () => {
    const local = data([stack("s1", [w("1"), w("3")])]);
    const remote = data([stack("s1", [w("1"), w("2"), w("3"), w("4")])]);
    expect(ids(mergeThreeWay(snap, local, remote).stacks, "s1")).toEqual(["1", "3", "4"]);
  });

  it("an edit beats a deletion on the other side", () => {
    const local = data([stack("s1", [w("1"), w("2", { en: "edited" }), w("3")])]);
    const remote = data([stack("s1", [w("1"), w("3")])]);
    const m = mergeThreeWay(snap, local, remote);
    expect(m.stacks[0].words.find((x) => x.id === "2").en).toBe("edited");
  });

  it("deleted whole stacks stay deleted; edited ones survive", () => {
    const b2 = data([stack("s1", [w("1")]), stack("s2", [w("9")])]);
    const s2 = snapshot(b2);
    const local = data([stack("s1", [w("1")])]); // deleted s2 here
    const remote = data([stack("s1", [w("1")]), stack("s2", [w("9")])]);
    expect(mergeThreeWay(s2, local, remote).stacks.map((s) => s.id)).toEqual(["s1"]);
    const remoteEdited = data([stack("s1", [w("1")]), stack("s2", [w("9", { en: "new" })])]);
    expect(mergeThreeWay(s2, local, remoteEdited).stacks.map((s) => s.id)).toEqual(["s1", "s2"]);
  });

  it("when both changed one word, local wins but the more-reviewed srs is kept", () => {
    const local = data([stack("s1", [w("1", { en: "mine", srs: { correct: 1, wrong: 0 } }), w("2"), w("3")])]);
    const remote = data([stack("s1", [w("1", { en: "theirs", srs: { correct: 9, wrong: 2 } }), w("2"), w("3")])]);
    const x = mergeThreeWay(snap, local, remote).stacks[0].words[0];
    expect(x.en).toBe("mine");
    expect(x.srs.correct).toBe(9);
  });

  it("stack settings: only the changed side wins", () => {
    const local = data([stack("s1", [w("1"), w("2"), w("3")], { name: "Renamed here" })]);
    const remote = data([stack("s1", [w("1"), w("2"), w("3"), w("4")])]);
    const m = mergeThreeWay(snap, local, remote);
    expect(m.stacks[0].name).toBe("Renamed here");
    expect(ids(m.stacks, "s1")).toHaveLength(4);
  });

  it("families and mini stacks use the same rules", () => {
    const b = data([], { families: [{ id: "f1", name: "A" }, { id: "f2", name: "B" }], miniStacks: { s1: { id: "m", words: [w("1")] } } });
    const local = data([], { families: [{ id: "f1", name: "A" }, { id: "f3", name: "new" }], miniStacks: {} });
    const remote = data([], { families: [{ id: "f1", name: "A" }, { id: "f2", name: "B" }], miniStacks: { s1: { id: "m", words: [w("1")] } } });
    const m = mergeThreeWay(snapshot(b), local, remote);
    expect(m.families.map((f) => f.id).sort()).toEqual(["f1", "f3"]); // f2 deleted here, f3 added here
    expect(m.miniStacks).toEqual({}); // mini stack removed here, untouched there
  });
});

describe("without a base (first sync on this device)", () => {
  it("is a union: nothing local is lost, the cloud wins on shared ids, nothing is deleted", () => {
    const local = data([stack("s1", [w("1", { en: "local" }), w("5")]), stack("s9", [w("7")])]);
    const remote = data([stack("s1", [w("1", { en: "cloud" }), w("2")])]);
    const m = mergeThreeWay(null, local, remote);
    expect(m.stacks.map((s) => s.id)).toEqual(["s1", "s9"]);
    expect(ids(m.stacks, "s1")).toEqual(["1", "2", "5"]);
    expect(m.stacks[0].words[0].en).toBe("cloud");
  });
});

describe("snapshot", () => {
  it("is equal for equal data regardless of key order and differs after an edit", () => {
    const a = data([stack("s1", [w("1")])]);
    const b = data([{ words: [{ en: "en1", de: "de1", id: "1" }], emoji: "book", name: "Ss1", id: "s1" }]);
    b.stacks[0].name = "Ss1";
    a.stacks[0].name = "Ss1";
    expect(sameSnapshot(snapshot(a), snapshot(b))).toBe(true);
    b.stacks[0].words[0].en = "x";
    expect(sameSnapshot(snapshot(a), snapshot(b))).toBe(false);
  });
});
