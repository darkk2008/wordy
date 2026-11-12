// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";

vi.mock("../../../core/speech-voices", async (orig) => ({ ...(await orig()), speak: vi.fn() }));
import { WriteGame, normalizeAnswer } from "../write-game";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function setup(onAnswer) {
  const el = document.createElement("div");
  document.body.appendChild(el);
  const root = createRoot(el);
  act(() =>
    root.render(
      <WriteGame words={[{ id: "1", de: "Hund", en: "dog" }, { id: "2", de: "Katze", en: "cat" }]} onAnswer={onAnswer} onExit={() => {}} onPlayAgain={() => {}} />
    )
  );
  return { el, root };
}
// React tracks the value itself, so set it through the native setter before dispatching "input".
function type(input, value) {
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
  act(() => {
    set.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
const enter = (input) => act(() => input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })));

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = "";
});

describe("Write the Word: Enter key", () => {
  it("does nothing on an empty field", () => {
    const onAnswer = vi.fn();
    const { el } = setup(onAnswer);
    enter(el.querySelector("input"));
    expect(onAnswer).not.toHaveBeenCalled();
  });
  it("answers once even if Enter is pressed twice during the feedback delay", () => {
    const onAnswer = vi.fn();
    const { el } = setup(onAnswer);
    const input = el.querySelector("input");
    type(input, "x");
    enter(input);
    enter(input);
    expect(onAnswer).toHaveBeenCalledTimes(1);
  });
  it("does not answer after the game was left", () => {
    const onAnswer = vi.fn();
    const { el, root } = setup(onAnswer);
    const input = el.querySelector("input");
    type(input, "Hund");
    enter(input);
    act(() => root.unmount());
    act(() => vi.advanceTimersByTime(2000));
    expect(onAnswer).toHaveBeenCalledTimes(1); // only the first, immediate answer
  });
});

describe("normalizeAnswer", () => {
  it("ignores case, outer/inner spaces and composed vs decomposed accents", () => {
    expect(normalizeAnswer("  Schöne   Frau ")).toBe(normalizeAnswer("schöne frau"));
  });
});
