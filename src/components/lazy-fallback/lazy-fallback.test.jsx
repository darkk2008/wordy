// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { LazyFallback } from "./lazy-fallback";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("LazyFallback", () => {
  it("shows nothing at first (no flash for fast loads), then a spinner", async () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const root = createRoot(el);
    await act(async () => root.render(<LazyFallback delay={30} />));
    expect(el.querySelector(".dm-lazy-fallback")).toBeNull();
    await act(async () => new Promise((r) => setTimeout(r, 60)));
    expect(el.querySelector(".dm-lazy-fallback-spinner")).toBeTruthy();
  });
});
