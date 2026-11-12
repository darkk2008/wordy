// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { BottomNav } from "../bottom-nav";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Minimal stand-in for testing-library's fireEvent: dispatches a bubbling DOM event with extra fields.
function fire(type, el, init = {}) {
  const ev = new Event(type, { bubbles: true, cancelable: true });
  Object.assign(ev, init);
  el.dispatchEvent(ev);
}
const fireEvent = {
  pointerDown: (el, i) => fire("pointerdown", el, i),
  pointerUp: (el, i) => fire("pointerup", el, i),
  pointerMove: (el, i) => fire("pointermove", el, i),
  contextMenu: (el, i) => fire("contextmenu", el, i),
  keyDown: (el, i) => fire("keydown", el, i),
};

const roots = [];
async function mount(props) {
  const host = document.createElement("div");
  host.className = "dm-app";
  document.body.appendChild(host);
  const root = createRoot(host);
  roots.push(root);
  await act(async () => root.render(<BottomNav tab="home" hidden={false} {...props} />));
  return { host, root };
}
const settingsBtn = () => document.querySelector('button[aria-label="Settings"]');
const menu = () => document.querySelector(".dm-nav-quickmenu");

describe("Settings long-press quick menu", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(async () => {
    // unmount so a menu left open by one test cannot keep its document listeners for the next
    await act(async () => roots.splice(0).forEach((r) => r.unmount()));
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("a normal tap switches to the Settings tab and shows no menu", async () => {
    const setTab = vi.fn();
    await mount({ setTab });
    await act(async () => {
      fireEvent.pointerDown(settingsBtn(), { button: 0 });
      vi.advanceTimersByTime(100);
      fireEvent.pointerUp(settingsBtn());
      settingsBtn().click();
    });
    expect(setTab).toHaveBeenCalledWith("settings");
    expect(menu()).toBeNull();
  });

  it("a long press opens the menu with Archived Stacks, Families and Appearance, and does not change the tab", async () => {
    const setTab = vi.fn();
    await mount({ setTab });
    await act(async () => {
      fireEvent.pointerDown(settingsBtn(), { button: 0 });
      vi.advanceTimersByTime(500);
    });
    expect(menu()).not.toBeNull();
    expect([...menu().querySelectorAll("[role=menuitem]")].map((b) => b.textContent)).toEqual([
      "Archived Stacks",
      "Families",
      "Appearance",
    ]);
    // the click that follows the release must not also switch tabs
    await act(async () => {
      fireEvent.pointerUp(settingsBtn());
      settingsBtn().click();
    });
    expect(setTab).not.toHaveBeenCalled();
    expect(menu()).not.toBeNull();
  });

  it("the tap after a long press works normally again", async () => {
    const setTab = vi.fn();
    await mount({ setTab });
    await act(async () => {
      fireEvent.pointerDown(settingsBtn(), { button: 0 });
      vi.advanceTimersByTime(500);
      fireEvent.pointerUp(settingsBtn());
    });
    await act(async () => {
      fireEvent.keyDown(document, { key: "Escape" });
      vi.advanceTimersByTime(300);
    });
    expect(menu()).toBeNull();
    await act(async () => {
      fireEvent.pointerDown(settingsBtn(), { button: 0 });
      fireEvent.pointerUp(settingsBtn());
      settingsBtn().click();
    });
    expect(setTab).toHaveBeenCalledWith("settings");
  });

  it("moving the finger cancels the long press", async () => {
    await mount({ setTab: vi.fn() });
    await act(async () => {
      fireEvent.pointerDown(settingsBtn(), { button: 0, clientX: 10, clientY: 10 });
      fireEvent.pointerMove(settingsBtn(), { clientX: 60, clientY: 10 });
      vi.advanceTimersByTime(600);
    });
    expect(menu()).toBeNull();
  });

  it("picking an item reports the section and closes the menu", async () => {
    const onOpenSettingsSection = vi.fn();
    await mount({ setTab: vi.fn(), onOpenSettingsSection });
    await act(async () => {
      fireEvent.pointerDown(settingsBtn(), { button: 0 });
      vi.advanceTimersByTime(500);
    });
    await act(async () => menu().querySelectorAll("[role=menuitem]")[0].click());
    expect(onOpenSettingsSection).toHaveBeenCalledWith("archived");
    // it shrinks back toward the icon first, then it is removed
    expect(menu().className).toContain("dm-nav-quickmenu-closing");
    await act(async () => vi.advanceTimersByTime(300));
    expect(menu()).toBeNull();
    await act(async () => {
      fireEvent.contextMenu(settingsBtn());
    });
    await act(async () => menu().querySelectorAll("[role=menuitem]")[2].click());
    expect(onOpenSettingsSection).toHaveBeenLastCalledWith("appearance");
  });

  it("a press outside closes the menu", async () => {
    await mount({ setTab: vi.fn() });
    await act(async () => {
      fireEvent.pointerDown(settingsBtn(), { button: 0 });
      vi.advanceTimersByTime(500);
    });
    expect(menu()).not.toBeNull();
    await act(async () => {
      fireEvent.pointerDown(document.body);
    });
    expect(menu().className).toContain("dm-nav-quickmenu-closing");
    await act(async () => vi.advanceTimersByTime(300));
    expect(menu()).toBeNull();
  });

  it("while the menu is open, other buttons only close it and do not act", async () => {
    const setTab = vi.fn();
    await mount({ setTab });
    await act(async () => {
      fireEvent.pointerDown(settingsBtn(), { button: 0 });
      vi.advanceTimersByTime(500);
    });
    const home = document.querySelector('button[aria-label="Home"]');
    await act(async () => {
      fireEvent.pointerDown(home, { button: 0 });
      fireEvent.pointerUp(home);
      home.click();
    });
    expect(setTab).not.toHaveBeenCalled();
    expect(menu().className).toContain("dm-nav-quickmenu-closing");
    await act(async () => vi.advanceTimersByTime(300));
    expect(menu()).toBeNull();
    // afterwards the buttons work again
    await act(async () => home.click());
    expect(setTab).toHaveBeenCalledWith("home");
  });

  it("one corner next to the Settings icon is marked sharp", async () => {
    await mount({ setTab: vi.fn() });
    await act(async () => {
      fireEvent.pointerDown(settingsBtn(), { button: 0 });
      vi.advanceTimersByTime(500);
    });
    expect(["tl", "bl", "br"]).toContain(menu().getAttribute("data-corner"));
  });
});
