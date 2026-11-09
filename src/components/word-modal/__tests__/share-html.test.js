// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { JSDOM } from "jsdom";
import { buildShareHTML } from "../word-modal";
import { buildFamilyShareHTML } from "../../../core/sharing-and-export";

const stack = {
  name: "Test <stack>",
  emoji: "book",
  words: [
    { id: "1", de: "Hund", en: "dog", type: "noun", article: "der", plural: "Hunde", level: "A1" },
    { id: "2", de: "gehen", en: "to go", type: "verb", praeteritum: "ging", partizipII: "gegangen" },
    { id: "3", de: "schnell", en: "fast", type: "adj", komparativ: "schneller", superlativ: "schnellste" },
    { id: "4", de: "heute", en: "today", type: "other" },
  ],
};

describe("share HTML: list / tables toggle", () => {
  it("stack file has the toggle, the old list and one table per word", () => {
    const html = buildShareHTML(stack);
    expect(html).toContain('data-mode="list"');
    expect(html).toContain('data-mode="tables"');
    expect(html).toContain('id="listWrap"');
    expect((html.match(/class="wtab"/g) || []).length).toBe(4);
    expect(html).toContain("Präsens");
    expect(html).toContain("Genitiv");
    expect(html).toContain("Steigerung");
    expect(html).toContain("No inflected forms for this word.");
    expect(html).toContain("der Hund");
    expect(html).toContain("dog");
  });
  it("escapes html in names", () => {
    expect(buildShareHTML(stack)).not.toContain("Test <stack>");
  });
  it("family file has the toggle and keeps its importable data", () => {
    const html = buildFamilyShareHTML("Fam", "family", [stack]);
    expect(html).toContain('data-mode="tables"');
    expect(html).toContain('id="wordifyFamilyData"');
    expect((html.match(/class="wtab"/g) || []).length).toBe(4);
  });
  it("empty stack does not crash", () => {
    expect(() => buildShareHTML({ name: "x", words: [] })).not.toThrow();
  });
  it("toggle button switches the views when the file is opened", () => {
    const dom = new JSDOM(buildShareHTML(stack), { runScripts: "dangerously", url: "https://x.test/" });
    const { document } = dom.window;
    const btn = (m) => document.querySelector(`[data-mode="${m}"]`);
    expect(document.body.classList.contains("mode-tables")).toBe(false);
    expect(btn("list").getAttribute("aria-pressed")).toBe("true");
    btn("tables").click();
    expect(document.body.classList.contains("mode-tables")).toBe(true);
    expect(btn("tables").getAttribute("aria-pressed")).toBe("true");
    expect(btn("list").getAttribute("aria-pressed")).toBe("false");
    btn("list").click();
    expect(document.body.classList.contains("mode-tables")).toBe(false);
  });
  it("flashcards still work (list mode unchanged)", () => {
    const dom = new JSDOM(buildShareHTML(stack), { runScripts: "dangerously", url: "https://x.test/" });
    const { document } = dom.window;
    expect(document.getElementById("counter").textContent).toBe("1 / 4");
    document.getElementById("nextBtn").click();
    expect(document.getElementById("counter").textContent).toBe("2 / 4");
  });
});
