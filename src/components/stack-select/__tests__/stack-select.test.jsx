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

describe("StackSelect dropdown", () => {
  it("lists each stack as its own stair tile and steps them back in when closing", async () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const root = createRoot(el);
    let picked = null;
    await act(async () => root.render(<StackSelect stacks={stacks} value="a" onChange={(id) => (picked = id)} variant="dropdown" />));
    expect(el.querySelector(".dm-stackselect-menu")).toBeNull();
    await act(async () => el.querySelector(".dm-stackselect-trigger").click());
    const opts = [...el.querySelectorAll(".dm-ss-opt")];
    expect(opts.length).toBe(3);
    expect(opts.map((o) => o.style.getPropertyValue("--i"))).toEqual(["0", "1", "2"]);
    expect(opts[0].classList.contains("dm-ss-opt-active")).toBe(true);
    expect(opts[1].querySelector(".dm-ss-opt-count").textContent).toBe("1 word");
    expect(opts[0].querySelector(".dm-ss-opt-name").textContent).toBe("verbs");
    await act(async () => opts[2].click());
    expect(picked).toBe("c");
    expect(el.querySelector(".dm-stackselect-menu-leaving")).toBeTruthy(); // still mounted while stepping in
    await new Promise((r) => setTimeout(r, 450));
    expect(el.querySelector(".dm-stackselect-menu")).toBeNull();
  });
});
