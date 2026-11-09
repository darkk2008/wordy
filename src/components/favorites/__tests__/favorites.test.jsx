// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { FavoritesView } from "../favorites";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const mk = (id, de, en, favorite) => ({ id, de, en, favorite, type: "verb", srs: { level: 0, next: 0 } });
const stacks = [
  { id: "s1", name: "verbs", emoji: "book", words: [mk("w1", "wählen", "to choose", true), mk("w2", "einladen", "to invite", false)] },
  { id: "s2", name: "nouns", emoji: "book", words: [mk("w3", "Haus", "house", true)] },
];

function mount(props) {
  const el = document.createElement("div");
  document.body.appendChild(el);
  const root = createRoot(el);
  act(() => root.render(<FavoritesView stacks={stacks} nativeLanguage="en" learningLanguage="de" isPremium {...props} />));
  return { el, root };
}

describe("FavoritesView", () => {
  it("uses the stack screen layout with a Favorites title and the starred words", () => {
    const { el } = mount({ onBack: () => {}, onUpdateWord: () => {} });
    expect(el.querySelector(".dm-stack-screen")).toBeTruthy();
    expect(el.querySelector(".dm-topbar")).toBeTruthy();
    expect(el.querySelector(".dm-stack-title-name").textContent).toBe("Favorites");
    expect(el.querySelector(".dm-stack-wide-toggle")).toBeTruthy();
    expect(el.textContent).toContain("wählen");
    expect(el.textContent).toContain("Haus");
    expect(el.textContent).not.toContain("einladen");
  });

  it("the + button opens a picker that stars a word in its own stack", () => {
    const onUpdateWord = vi.fn();
    const { el } = mount({ onBack: () => {}, onUpdateWord });
    const plus = el.querySelectorAll(".dm-topbar > .dm-topbar-fixed-btn");
    act(() => plus[plus.length - 1].click());
    const row = el.querySelector(".dm-fav-add-row");
    expect(row.textContent).toContain("einladen");
    act(() => row.click());
    expect(onUpdateWord).toHaveBeenCalledTimes(1);
    const [stackId, wordId, fn] = onUpdateWord.mock.calls[0];
    expect([stackId, wordId]).toEqual(["s1", "w2"]);
    expect(fn(stacks[0].words[1]).favorite).toBe(true);
  });

  it("back button calls onBack", () => {
    const onBack = vi.fn();
    const { el } = mount({ onBack, onUpdateWord: () => {} });
    act(() => el.querySelector(".dm-topbar > .dm-topbar-fixed-btn").click());
    expect(onBack).toHaveBeenCalled();
  });
});
