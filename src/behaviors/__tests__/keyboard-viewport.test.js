// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { initKeyboardViewport, isKeyboardOpen } from "../keyboard-viewport";

const raf = () => new Promise((r) => requestAnimationFrame(() => r()));

describe("keyboard viewport", () => {
  let vv;
  beforeEach(() => {
    const listeners = {};
    vv = {
      height: 800,
      offsetTop: 0,
      scale: 1,
      addEventListener: (t, fn) => ((listeners[t] = listeners[t] || []).push(fn)),
      fire: (t) => (listeners[t] || []).forEach((fn) => fn()),
    };
    window.visualViewport = vv;
    window.innerHeight = 800;
    document.documentElement.classList.remove("dm-kb-open");
    document.documentElement.removeAttribute("style");
    initKeyboardViewport();
  });

  it("writes the viewport height once per frame and only when it changed", async () => {
    const root = document.documentElement;
    expect(root.style.getPropertyValue("--vv-height")).toBe("800px");
    vv.height = 500;
    vv.fire("resize");
    vv.height = 480;
    vv.fire("resize");
    vv.fire("scroll");
    expect(root.style.getPropertyValue("--vv-height")).toBe("800px"); // nothing yet, batched
    await raf();
    expect(root.style.getPropertyValue("--vv-height")).toBe("480px");
  });

  it("does not flap the keyboard state while it is still sliding (hysteresis)", async () => {
    vv.height = 500; // 300px of keyboard
    vv.fire("resize");
    await raf();
    expect(isKeyboardOpen()).toBe(true);
    vv.height = 660; // shrink 140: between the open (150) and close (100) thresholds
    vv.fire("resize");
    await raf();
    expect(isKeyboardOpen()).toBe(true);
    vv.height = 720; // shrink 80: closed
    vv.fire("resize");
    await raf();
    expect(isKeyboardOpen()).toBe(false);
  });
});
