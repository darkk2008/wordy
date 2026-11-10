// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { LanguagesSettings } from "../language-settings";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const click = (node) => act(() => node.dispatchEvent(new MouseEvent("click", { bubbles: true })));
const card = (el, label) =>
  [...el.querySelectorAll(".dm-lang-card")].find((c) => c.querySelector(".dm-settings-card-name").textContent === label);

function mount(props = {}) {
  const fns = {
    onBack: vi.fn(),
    onSetNativeLanguage: vi.fn(),
    onSetLearningLanguage: vi.fn(),
    onSetUiLanguage: vi.fn(),
    onResetUiLanguage: vi.fn(),
  };
  const el = document.createElement("div");
  document.body.appendChild(el);
  const root = createRoot(el);
  act(() => {
    root.render(
      <LanguagesSettings
        nativeLanguage="ru"
        learningLanguage="de"
        uiLanguage="ru"
        uiLanguageCustom={false}
        {...fns}
        {...props}
      />
    );
  });
  return { el, root, ...fns };
}
afterEach(() => {
  document.body.innerHTML = "";
});

describe("Languages settings: interface language", () => {
  it("has its own Interface language card next to the native and learning ones", () => {
    const { el } = mount();
    expect([...el.querySelectorAll(".dm-settings-card-name")].map((n) => n.textContent)).toEqual([
      "Native language",
      "Learning language",
      "Interface language",
    ]);
    // until one is picked it shows (and follows) the native language
    expect(card(el, "Interface language").textContent).toContain("Russian");
    expect(el.textContent).toContain("Only changes the text of the app");
    expect(el.textContent).not.toContain("doesn't change anything else");
  });

  it("picking an interface language changes only the interface, not the native language", () => {
    const { el, onSetUiLanguage, onSetNativeLanguage } = mount();
    click(card(el, "Interface language"));
    const english = [...card(el, "Interface language").querySelectorAll("[role=option]")].find((b) =>
      b.textContent.includes("English")
    );
    click(english);
    expect(onSetUiLanguage).toHaveBeenCalledWith("en");
    expect(onSetNativeLanguage).not.toHaveBeenCalled();
    expect(card(el, "Interface language").querySelector("[role=listbox]")).toBeNull(); // closed again
  });

  it("picking a native language does not call the interface setter", () => {
    const { el, onSetUiLanguage, onSetNativeLanguage } = mount();
    click(card(el, "Native language"));
    click([...el.querySelectorAll("[role=option]")].find((b) => b.textContent.includes("German")));
    expect(onSetNativeLanguage).toHaveBeenCalledWith("de");
    expect(onSetUiLanguage).not.toHaveBeenCalled();
  });

  it("shows the chosen interface language and a button to follow the native language again", () => {
    const { el, onResetUiLanguage } = mount({ uiLanguage: "en", uiLanguageCustom: true });
    expect(card(el, "Interface language").textContent).toContain("English");
    expect(card(el, "Native language").textContent).toContain("Russian");
    const reset = el.querySelector(".dm-lang-ui-reset");
    expect(reset.textContent).toBe("Follow native language");
    click(reset);
    expect(onResetUiLanguage).toHaveBeenCalledTimes(1);
  });

  it("hides that button while the interface already follows the native language", () => {
    const { el } = mount();
    expect(el.querySelector(".dm-lang-ui-reset")).toBeNull();
  });
});
