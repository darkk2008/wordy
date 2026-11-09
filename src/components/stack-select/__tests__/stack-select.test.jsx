// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { StackSelect } from "../stack-select";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const stacks = [
  { id: "a", name: "verbs", emoji: "book", words: new Array(10).fill({}) },
  { id: "b", name: "nouns", emoji: "book", words: new Array(1).fill({}) },
  { id: "c", name: "adjectives", emoji: "book", words: new Array(3).fill({}) },
];

describe("StackSelect picker", () => {
  it("opens a sheet with one row per stack, marks the current one, and closes on pick", async () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const root = createRoot(el);
    let picked = null;
    await act(async () =>
      root.render(<StackSelect stacks={stacks} value="a" onChange={(id) => (picked = id)} variant="dropdown" />)
    );
    expect(el.querySelector(".dm-ss-sheet")).toBeNull();
    await act(async () => el.querySelector(".dm-stackselect-trigger").click());
    const opts = [...el.querySelectorAll(".dm-ss-opt")];
    expect(opts.length).toBe(3);
    expect(el.querySelector(".dm-ss-sub").textContent).toBe("3 stacks");
    expect(opts[0].classList.contains("dm-ss-opt-active")).toBe(true);
    expect(opts[0].getAttribute("aria-selected")).toBe("true");
    expect(opts[1].querySelector(".dm-ss-opt-count").textContent).toBe("1 word");
    expect(opts[0].querySelector(".dm-ss-opt-name").textContent).toBe("verbs");
    await act(async () => opts[2].click());
    expect(picked).toBe("c");
    expect(el.querySelector(".dm-ss-sheet")).toBeNull();
  });

  it("closes from the backdrop and from Escape", async () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const root = createRoot(el);
    await act(async () => root.render(<StackSelect stacks={stacks} value="a" onChange={() => {}} variant="dropdown" />));
    await act(async () => el.querySelector(".dm-stackselect-trigger").click());
    await act(async () => el.querySelector(".dm-ss-backdrop").click());
    expect(el.querySelector(".dm-ss-sheet")).toBeNull();
    await act(async () => el.querySelector(".dm-stackselect-trigger").click());
    await act(async () => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })));
    expect(el.querySelector(".dm-ss-sheet")).toBeNull();
  });
});
