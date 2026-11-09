// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { MiniStackView } from "../mini-stack";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const mk = (id, de, en) => ({ id, de, en, type: "verb", srs: { level: 0, next: 0 } });
const stacks = [{ id: "s1", name: "verbs", emoji: "book", words: [mk("w1", "wählen", "to choose"), mk("w2", "einladen", "to invite"), mk("w3", "zugeben", "to admit")] }];
const mini = { id: "m", emoji: "spark", words: [{ ...mk("w1", "OLD", "stale copy"), stackId: "s1" }, { ...mk("w2", "einladen", "to invite"), stackId: "s1" }] };

function mount(props) {
  const el = document.createElement("div");
  document.body.appendChild(el);
  const root = createRoot(el);
  act(() =>
    root.render(
      <MiniStackView stacks={stacks} parentId="s1" miniStack={mini} nativeLanguage="en" learningLanguage="de" isPremium onUpdateWord={() => {}} onToggleMiniStackWord={() => {}} onClearMiniStack={() => {}} {...props} />
    )
  );
  return el;
}

describe("MiniStackView", () => {
  it("is a real stack screen titled Mini stack, showing live words, without AI / mini buttons", () => {
    const el = mount({ onBack: () => {} });
    expect(el.querySelector(".dm-stack-screen")).toBeTruthy();
    expect(el.querySelector(".dm-stack-title-name").textContent).toBe("Mini stack");
    expect(el.textContent).toContain("wählen"); // live word, not the stale "OLD" copy
    expect(el.textContent).not.toContain("OLD");
    expect(el.textContent).not.toContain("zugeben");
    expect(el.querySelector(".dm-stackview-ai-btn")).toBeNull();
    expect(el.querySelector(".dm-stack-title-ministack-btn")).toBeNull();
    expect(el.querySelector('[title="Play games"]')).toBeTruthy();
  });

  it("back goes to the stack; the trash button asks, then clears", () => {
    const onBack = vi.fn();
    const onClear = vi.fn();
    const el = mount({ onBack, onClearMiniStack: onClear });
    act(() => el.querySelector(".dm-topbar > .dm-topbar-fixed-btn").click());
    expect(onBack).toHaveBeenCalled();
    act(() => el.querySelector('[title="Remove all words"]').click());
    expect(onClear).not.toHaveBeenCalled();
    const confirm = [...el.querySelectorAll(".dm-btn-danger")].find((b) => b.textContent.includes("Remove all"));
    act(() => confirm.click());
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("+ lists only this stack's words that are not pinned yet and pins the chosen one", () => {
    const onToggle = vi.fn();
    const el = mount({ onBack: () => {}, onToggleMiniStackWord: onToggle });
    const plus = el.querySelectorAll(".dm-topbar > .dm-topbar-fixed-btn");
    act(() => plus[plus.length - 1].click());
    const rows = el.querySelectorAll(".dm-fav-add-row");
    expect(rows.length).toBe(1);
    act(() => rows[0].click());
    expect(onToggle.mock.calls[0][0]).toMatchObject({ id: "w3", stackId: "s1" });
  });
});
