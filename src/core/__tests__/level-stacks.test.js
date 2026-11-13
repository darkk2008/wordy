import { describe, expect, it } from "vitest";
import { checkNounReference } from "../srs-and-seed-data";
import {
  LEVEL_DATA,
  LEVEL_LANGS,
  START_LEVELS,
  buildLevelStacks,
  hasLevelStacks,
  levelStackPreview,
} from "../level-stacks";

const ICONS = ["sprout", "bolt", "plane", "book", "school", "briefcase", "food", "target", "family", "heart", "star", "home", "tree", "nest", "folder", "orbit", "puzzle", "crown", "spark", "gem", "magnet", "comet", "beacon"];
const allRows = START_LEVELS.flatMap((lv) => LEVEL_DATA[lv].flatMap((s) => s.rows.map((r) => ({ lv, r }))));

describe("level data", () => {
  it("has 4 levels x 5 stacks x 10 words", () => {
    for (const lv of START_LEVELS) {
      expect(LEVEL_DATA[lv]).toHaveLength(5);
      for (const s of LEVEL_DATA[lv]) {
        expect(s.rows, `${lv} ${s.names.en}`).toHaveLength(10);
        expect(ICONS).toContain(s.emoji);
        for (const code of ["en", "ru", "uz", "de"]) expect(s.names[code]).toBeTruthy();
      }
    }
  });

  it("every row has a type, grammar and one non-empty word per language", () => {
    for (const { lv, r } of allRows) {
      expect(r, `${lv} ${r[2]}`).toHaveLength(2 + LEVEL_LANGS.length);
      expect(["noun", "verb", "adj", "other"]).toContain(r[0]);
      r.slice(2).forEach((w, i) => {
        expect(typeof w === "string" && w.trim() === w && w.length > 0, `${lv} "${r[2]}" ${LEVEL_LANGS[i]}`).toBe(true);
      });
    }
  });

  it("German grammar has the right shape for each type", () => {
    for (const { lv, r } of allRows) {
      const [type, gram] = r;
      const where = `${lv} ${r[2]}`;
      if (type === "noun") expect(gram, where).toMatch(/^(der|die|das)\|.+$/);
      else if (type === "verb") expect(gram, where).toMatch(/^[^|]+\|[^|]+$/);
      else if (type === "adj") expect(gram === "" || /^[^|]+\|am [^|]+$/.test(gram), where).toBe(true);
      else expect(gram, where).toBe("");
    }
  });

  it("noun articles agree with the app's own German reference list", () => {
    let checked = 0;
    for (const { lv, r } of allRows) {
      if (r[0] !== "noun") continue;
      const ref = checkNounReference(r[3]);
      if (!ref) continue;
      checked++;
      expect(r[1].split("|")[0], `${lv} ${r[3]}`).toBe(ref.article);
    }
    expect(checked).toBeGreaterThan(0);
  });

  it("no duplicate English meanings or German words inside a level", () => {
    // "Nachrichten" is intentionally both "news" and "message" (B1).
    const SAME_GERMAN_ON_PURPOSE = new Set(["nachrichten"]);
    for (const lv of START_LEVELS) {
      const rows = LEVEL_DATA[lv].flatMap((s) => s.rows);
      const en = rows.map((r) => r[2].toLowerCase());
      const de = rows.map((r) => r[3].toLowerCase()).filter((w) => !SAME_GERMAN_ON_PURPOSE.has(w));
      expect(new Set(en).size, `${lv} en`).toBe(en.length);
      expect(new Set(de).size, `${lv} de`).toBe(de.length);
    }
  });
});

describe("buildLevelStacks", () => {
  it("builds 5 stacks of 10 words with German grammar for a German learner", () => {
    const stacks = buildLevelStacks("A1", "de", "ru");
    expect(stacks).toHaveLength(5);
    expect(stacks[0].name).toBe("Приветствия и основы");
    const house = stacks[4].words.find((w) => w.de === "Haus");
    expect(house).toMatchObject({ en: "дом", article: "das", plural: "Häuser", level: "A1", type: "noun" });
    const go = stacks[4].words.find((w) => w.de === "gehen");
    expect(go).toMatchObject({ praeteritum: "ging", partizipII: "gegangen" });
    expect(house.srs).toMatchObject({ level: 0, correct: 0, wrong: 0 });
  });

  it("gives other languages no German-only grammar and uses the right words", () => {
    const stacks = buildLevelStacks("B1", "es", "en");
    const w = stacks.flatMap((s) => s.words).find((x) => x.en === "opinion");
    expect(w).toMatchObject({ de: "opinión", article: "", plural: "" });
    expect(stacks[0].name).toBe("Work & Career");
  });

  it("falls back to English names/meanings for an unknown native language, [] for bad input", () => {
    expect(buildLevelStacks("A2", "fr", "xx")[0].name).toBe("Shopping & Money");
    expect(buildLevelStacks("A2", "fr", "xx")[0].words[0].en).toBe("shop");
    expect(buildLevelStacks("C2", "de", "en")).toEqual([]);
    expect(buildLevelStacks("A1", "xx", "en")).toEqual([]);
    expect(hasLevelStacks("ko")).toBe(true);
    expect(hasLevelStacks("xx")).toBe(false);
  });

  it("creates unique ids", () => {
    const stacks = buildLevelStacks("B2", "de", "en");
    const ids = [...stacks.map((s) => s.id), ...stacks.flatMap((s) => s.words.map((w) => w.id))];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("previews names and counts for the onboarding", () => {
    const p = levelStackPreview("A2", "uz");
    expect(p).toHaveLength(5);
    expect(p[0]).toMatchObject({ name: "Xarid va pul", count: 10 });
  });
});
