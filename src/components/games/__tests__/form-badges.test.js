// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { buildFormQuestions } from "../write-game";

describe("form question badges", () => {
  it("name the base word instead of the generic word class", () => {
    const qs = buildFormQuestions({ id: 1, type: "adj", de: "gemütlich", en: "cozy" });
    const badges = qs.map((q) => q.badge);
    expect(badges.some((b) => b === "Superlative of gemütlich")).toBe(true);
    expect(badges.some((b) => b === "Comparative of gemütlich")).toBe(true);
    expect(badges.join(" ")).not.toMatch(/ of (adj|noun|verb)\b/);
  });
});
