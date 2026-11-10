// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { StackView } from "../stack-view";
import { getFormOptions, resolvePickedForm } from "../../word-forms/form-pick";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const noun = { id: "n1", type: "noun", de: "Hund", en: "dog", article: "der", plural: "Hunde" };
const adj = { id: "a1", type: "adj", de: "schnell", en: "fast", komparativ: "schneller", superlativ: "am schnellsten" };
const verb = { id: "v1", type: "verb", de: "gehen", en: "to go", praeteritum: "ging", partizipII: "gegangen" };

describe("form options and picked forms", () => {
  it("noun: every case of singular and plural", () => {
    const o = getFormOptions([noun]);
    expect(Object.keys(o)).toEqual(["noun"]);
    expect(o.noun.map((g) => g.title)).toEqual(["Singular", "Plural"]);
    expect(o.noun[0].items.map((i) => i.label)).toEqual(["Nominativ", "Akkusativ", "Dativ", "Genitiv"]);
    expect(o.noun[0].items[2].tag).toBe("Singular · Dativ");
  });
  it("adjective: comparative, superlative and the second superlative (no base row)", () => {
    const o = getFormOptions([adj]);
    expect(o.adj).toHaveLength(1);
    expect(o.adj[0].items.map((i) => i.label)).toEqual([
      "Komparativ",
      "Superlativ (Prädikat)",
      "Superlativ (vor Nomen)",
    ]);
    expect(o.adj[0].items[0].tag).toBe("Komparativ");
  });
  it("verb: every form of every table", () => {
    const o = getFormOptions([verb]);
    expect(o.verb.map((g) => g.title)).toEqual(["Präsens", "Präteritum", "Perfekt", "Imperativ"]);
    expect(o.verb[0].items).toHaveLength(6);
  });
  it("only offers the types that are in the stack", () => {
    expect(Object.keys(getFormOptions([verb]))).toEqual(["verb"]);
    expect(getFormOptions([])).toEqual({});
  });
  it("resolves the chosen form of a word, or null when the word does not have it", () => {
    const dat = getFormOptions([noun]).noun[0].items[2];
    expect(resolvePickedForm(noun, dat)).toEqual({ tag: "Singular · Dativ", value: "dem Hund" });
    expect(resolvePickedForm(noun, { section: "Singular", label: "Vokativ" })).toBeNull();
    expect(resolvePickedForm(noun, undefined)).toBeNull();
  });
});

function mount() {
  const el = document.createElement("div");
  document.body.appendChild(el);
  const root = createRoot(el);
  act(() => {
    root.render(
      <StackView
        stack={{ id: "s1", name: "Mix", emoji: "book", words: [noun, adj, verb] }}
        onUpdateStack={() => {}}
        onBack={() => {}}
        onSpeak={() => {}}
        isPremium
      />
    );
  });
  return { el, root };
}
const click = (node) => act(() => node.dispatchEvent(new MouseEvent("click", { bubbles: true })));
const pointer = (node, type) =>
  act(() => node.dispatchEvent(new MouseEvent(type, { bubbles: true, clientX: 5, clientY: 5 })));
const advance = (ms) => act(() => vi.advanceTimersByTime(ms));
const seg = (el, name) => [...el.querySelectorAll(".dm-seg")].find((b) => b.textContent.startsWith(name));
const list = (el) => el.querySelector(".dm-list").textContent;
const modal = () => document.body.querySelector(".dm-formpick");
// hold the FORMS filter long enough, then let go (the click that follows a long press is sent too)
function longPress(el) {
  const forms = seg(el, "FORMS");
  pointer(forms, "pointerdown");
  advance(500);
  pointer(forms, "pointerup");
  click(forms);
}
const chip = (type, group, label) => {
  const g = [...modal().querySelectorAll(`[data-type="${type}"] .dm-formpick-group`)].find(
    (n) => n.querySelector(".dm-formpick-group-title")?.textContent === group
  );
  return [...(g || modal().querySelector(`[data-type="${type}"]`)).querySelectorAll(".dm-formpick-chip")].find(
    (b) => b.textContent === label
  );
};
// the menu ignores clicks right after it opens (the press that opened it may still be ending)
const pickChip = (btn) => {
  advance(400);
  click(btn);
  advance(300); // closing animation
};

describe("long press on the FORMS filter", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("a normal tap only switches to FORMS; holding opens the menu and does not switch", () => {
    const { el } = mount();
    expect(seg(el, "BOTH").className).toContain("dm-seg-active");
    pointer(seg(el, "FORMS"), "pointerdown");
    advance(100);
    pointer(seg(el, "FORMS"), "pointerup");
    click(seg(el, "FORMS"));
    expect(modal()).toBeNull();
    expect(seg(el, "FORMS").className).toContain("dm-seg-active");

    click(seg(el, "BOTH"));
    longPress(el);
    expect(modal()).toBeTruthy();
    expect(seg(el, "BOTH").className).toContain("dm-seg-active"); // the held press did not switch
    expect([...modal().querySelectorAll(".dm-formpick-type-title")].map((n) => n.textContent)).toEqual([
      "Nouns",
      "Adjectives",
      "Verbs",
    ]);
  });

  it("moving the finger away cancels the hold", () => {
    const { el } = mount();
    const forms = seg(el, "FORMS");
    pointer(forms, "pointerdown");
    act(() => forms.dispatchEvent(new MouseEvent("pointermove", { bubbles: true, clientX: 60, clientY: 5 })));
    advance(600);
    expect(modal()).toBeNull();
  });

  it("a chosen form replaces the default, survives filter changes, and can be reset", () => {
    const { el } = mount();
    click(seg(el, "FORMS"));
    expect(list(el)).toContain("die Hunde");
    expect(list(el)).toContain("ging");

    longPress(el);
    pickChip(chip("noun", "Singular", "Dativ"));
    expect(modal()).toBeNull();
    expect(list(el)).toContain("dem Hund");
    expect(list(el)).toContain("Singular · Dativ");
    expect(list(el)).not.toContain("die Hunde");
    expect(list(el)).toContain("ging"); // the verb is untouched
    expect(el.querySelector(".dm-seg-dot")).toBeTruthy();

    // other filter and back: still the chosen form
    click(el.querySelectorAll(".dm-seg")[1]); // the second filter (native language)
    click(seg(el, "FORMS"));
    expect(list(el)).toContain("dem Hund");
    expect(list(el)).not.toContain("die Hunde");

    // the menu shows the current choice, and the reset button brings the defaults back
    longPress(el);
    expect(chip("noun", "Singular", "Dativ").className).toContain("is-active");
    const reset = modal().querySelector(".dm-formpick-reset");
    expect(reset.disabled).toBe(false);
    advance(400);
    click(reset);
    advance(300);
    expect(list(el)).toContain("die Hunde");
    expect(list(el)).not.toContain("dem Hund");
    expect(el.querySelector(".dm-seg-dot")).toBeNull();

    longPress(el);
    expect(modal().querySelector(".dm-formpick-reset").disabled).toBe(true);
  });

  it("each word type keeps its own choice; the default row of a type clears only that type", () => {
    const { el } = mount();
    longPress(el);
    pickChip(chip("adj", "Steigerung", "Komparativ") || chip("adj", undefined, "Komparativ"));
    expect(list(el)).toContain("schneller");
    expect(list(el)).not.toContain("schnellste");

    longPress(el);
    pickChip(chip("verb", "Präsens", "du"));
    expect(list(el)).toContain("gehst");
    expect(list(el)).toContain("schneller"); // the adjective choice is still there
    expect(list(el)).toContain("die Hunde"); // nouns were never changed

    longPress(el);
    const def = modal().querySelector('[data-type="verb"] .dm-formpick-default');
    pickChip(def);
    expect(list(el)).toContain("ging");
    expect(list(el)).not.toContain("gehst");
    expect(list(el)).toContain("schneller");
  });

  it("opening the stack again starts from the default forms", () => {
    const first = mount();
    longPress(first.el);
    pickChip(chip("noun", "Plural", "Genitiv"));
    expect(list(first.el)).toContain("der Hunde");
    act(() => first.root.unmount());
    document.body.innerHTML = "";

    const second = mount();
    click(seg(second.el, "FORMS"));
    expect(list(second.el)).toContain("die Hunde");
    expect(second.el.querySelector(".dm-seg-dot")).toBeNull();
  });

  it("a click that ends the press cannot close the menu or pick a form by accident", () => {
    const { el } = mount();
    const forms = seg(el, "FORMS");
    pointer(forms, "pointerdown");
    advance(460);
    click(document.body.querySelector(".dm-modal-backdrop"));
    click(chip("noun", "Singular", "Dativ"));
    advance(300);
    expect(modal()).toBeTruthy();
    expect(list(el)).not.toContain("dem Hund");
  });
});
