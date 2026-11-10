// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { createRoot } from "react-dom/client";
import { act, useState } from "react";
import { GamesHub } from "../games-hub";
import { MULTI_STACK_ID } from "../combine-stacks";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const mk = (id, name, n) => ({
  id,
  name,
  emoji: "book",
  words: Array.from({ length: n }, (_, i) => ({ id: `${id}${i}`, de: `${id}${i}`, en: "x", type: "noun" })),
});
// every stack alone has too few words for most games (they need 4), two of them together do
const stacks = [mk("a", "A", 2), mk("b", "B", 2), mk("c", "C", 2)];

function Harness({ onStart }) {
  const [stackId, setStackId] = useState("a");
  const [multi, setMulti] = useState(false);
  const [ids, setIds] = useState([]);
  return (
    <GamesHub
      stacks={stacks}
      stackId={stackId}
      onChangeStackId={setStackId}
      multi={multi}
      stackIds={ids}
      onChangeMulti={setMulti}
      onChangeStackIds={setIds}
      mixForms={false}
      onChangeMixForms={() => {}}
      onStart={onStart}
      learningLanguage="de"
      nativeLanguage="en"
      isPremium
    />
  );
}
let root, el;
afterEach(() => {
  act(() => root.unmount());
  document.body.innerHTML = "";
});
const click = (n) => act(() => n.dispatchEvent(new MouseEvent("click", { bubbles: true })));

describe("GamesHub with several stacks", () => {
  it("plays the merged words of every picked stack", () => {
    const onStart = vi.fn();
    el = document.createElement("div");
    document.body.appendChild(el);
    root = createRoot(el);
    act(() => root.render(<Harness onStart={onStart} />));
    const memory = () => el.querySelector('[data-game="memory"]');

    // one small stack: not enough words for the game
    expect(memory().className).toContain("dm-game-card-unavailable");

    click(el.querySelector(".dm-stackselect-trigger"));
    click(el.querySelector('[role="switch"]'));
    const opts = [...el.querySelectorAll(".dm-ss-opt")];
    click(opts[1]);
    expect(el.querySelector(".dm-ss-sub").textContent).toBe("2 selected · 4 words");
    click(el.querySelector(".dm-ss-done"));

    // the two stacks together are enough
    expect(el.querySelector(".dm-stackselect-name").textContent).toBe("2 stacks");
    expect(memory().className).not.toContain("dm-game-card-unavailable");

    click(memory());
    expect(onStart).toHaveBeenCalledTimes(1);
    const [type, stack] = onStart.mock.calls[0];
    expect(type).toBe("memory");
    expect(stack.id).toBe(MULTI_STACK_ID);
    expect(stack.words.map((w) => w.id)).toEqual(["a0", "a1", "b0", "b1"]);
    expect(stack.words.map((w) => w._stackId)).toEqual(["a", "a", "b", "b"]);
  });

  it("back to single choice plays one stack again", () => {
    const onStart = vi.fn();
    el = document.createElement("div");
    document.body.appendChild(el);
    root = createRoot(el);
    act(() => root.render(<Harness onStart={onStart} />));
    click(el.querySelector(".dm-stackselect-trigger"));
    click(el.querySelector('[role="switch"]'));
    click(el.querySelectorAll(".dm-ss-opt")[1]);
    click(el.querySelector('[role="switch"]')); // off again: keeps the first picked stack (A)
    click(el.querySelector(".dm-ss-backdrop"));
    expect(el.querySelector(".dm-stackselect-name").textContent).toBe("A");
    expect(el.querySelector('[data-game="memory"]').className).toContain("dm-game-card-unavailable");
  });
});
