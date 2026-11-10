// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

async function mountApp() {
  window.matchMedia =
    window.matchMedia ||
    (() => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
  window.scrollTo = () => {};
  await import("../../boot/config.js");
  const { App } = await import("../app");
  const el = document.createElement("div");
  el.id = "root";
  document.body.appendChild(el);
  const root = createRoot(el);
  await act(async () => {
    root.render(<App />);
  });
  await act(async () => {
    await new Promise((r) => setTimeout(r, 200));
  });
  return { el, root };
}

describe("the interface language is separate from the native language", () => {
  let spy;
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem("deutschmaster-onboarded", "1");
    window.localStorage.setItem("deutschmaster-native-lang", "ru");
    spy = vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    spy.mockRestore();
    document.body.innerHTML = "";
  });

  it("follows the native language until an interface language is picked", async () => {
    const { root } = await mountApp();
    const { uiTranslationLangCode } = await import("../../services/ui-translation");
    expect(uiTranslationLangCode).toBe("ru");
    expect(document.documentElement.lang).toBe("ru");
    await act(async () => root.unmount());
  });

  it("uses the picked interface language while the native language stays Russian", async () => {
    window.localStorage.setItem("deutschmaster-ui-lang", "en");
    const { root } = await mountApp();
    const { uiTranslationLangCode } = await import("../../services/ui-translation");
    const { nativeFormLangCode } = await import("../../core/form-prompt-setting");
    expect(uiTranslationLangCode).toBe("en");
    expect(document.documentElement.lang).toBe("en");
    expect(nativeFormLangCode).toBe("ru"); // AI-written form prompts stay in the native language
    expect(window.localStorage.getItem("deutschmaster-native-lang")).toBe("ru");
    await act(async () => root.unmount());
  });
});
