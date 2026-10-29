// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("App smoke test", () => {
  it("mounts, renders something, and does not throw or log render errors", async () => {
    window.matchMedia = window.matchMedia || (() => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
    window.scrollTo = () => {};
    const errors = [];
    const spy = vi.spyOn(console, "error").mockImplementation((...a) => errors.push(a.map(String).join(" ")));
    await import("../../boot/config.js");
    const { App } = await import("../app");
    const el = document.createElement("div");
    document.body.appendChild(el);
    const root = createRoot(el);
    await act(async () => {
      root.render(<App />);
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 300));
    });
    expect(el.innerHTML.length).toBeGreaterThan(200);
    const real = errors.filter((e) => /Rendered (fewer|more) hooks|Cannot read|is not defined|is not a function|Minified React|Invalid hook/.test(e));
    expect(real).toEqual([]);
    await act(async () => root.unmount());
    spy.mockRestore();
  });
});
