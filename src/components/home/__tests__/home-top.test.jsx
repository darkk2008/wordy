// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { HomeView } from "../home";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const mk = (id, n) => ({ id, name: id, emoji: "book", words: Array.from({ length: n }, (_, i) => ({ id: id + i, type: "noun", de: "Haus", en: "house" })) });

function mount(props = {}) {
  const fns = {
    onOpenAI: vi.fn(),
    onOpenPremium: vi.fn(),
    onToggleTheme: vi.fn(),
    onOpenAccount: vi.fn(),
    onStartReview: vi.fn(),
  };
  const el = document.createElement("div");
  document.body.appendChild(el);
  const root = createRoot(el);
  act(() => {
    root.render(
      <HomeView
        stacks={[mk("a", 3), mk("b", 2)]}
        families={[]}
        streak={7}
        bestStreak={9}
        theme="dark"
        dueCount={0}
        todayReviews={1}
        dailyGoal={20}
        isPremium={false}
        account={null}
        learningLanguage="de"
        showFamilyStats
        onSetStackFamily={() => {}}
        onOpenStack={() => {}}
        onCreateStack={() => {}}
        onImportFamily={() => {}}
        onStartFamilyReview={() => {}}
        onPlayFamilyGames={() => {}}
        onTogglePinStack={() => {}}
        onToggleFamilyPinStack={() => {}}
        onDeleteStack={() => {}}
        onArchiveStack={() => {}}
        {...fns}
        {...props}
      />
    );
  });
  return { el, root, ...fns };
}
const click = (node) => act(() => node.dispatchEvent(new MouseEvent("click", { bubbles: true })));
afterEach(() => {
  document.body.innerHTML = "";
});

describe("Home header", () => {
  it("is one plain row: logo and name on the left, the actions on the right", () => {
    const { el } = mount();
    const head = el.querySelector("header.dm-hh");
    expect(head).toBeTruthy();
    expect([...head.children].map((c) => c.className)).toEqual(["dm-hh-brand", "dm-hh-actions"]);
    expect(head.querySelector(".dm-hh-logo .dm-logo")).toBeTruthy();
    expect(head.querySelector("h1.dm-hh-word").textContent).toBe("wwordy");
    expect(head.querySelectorAll(".dm-hh-actions .dm-iconbtn").length).toBeGreaterThanOrEqual(3); // account, AI, search
  });

  it("each action does its job", () => {
    const { el, onOpenAI, onOpenPremium, onOpenAccount } = mount();
    const btn = (title) => el.querySelector(`.dm-hh [title="${title}"]`);
    click(btn("AI Tutor"));
    expect(onOpenAI).toHaveBeenCalledTimes(1);
    click(btn("Upgrade to Premium"));
    expect(onOpenPremium).toHaveBeenCalledTimes(1);
    click(btn("Sign up or sign in"));
    expect(onOpenAccount).toHaveBeenCalledTimes(1);
  });

  it("search opens and closes from its button", () => {
    const { el } = mount();
    click(el.querySelector('.dm-hh [title="Search stacks"]'));
    const close = el.querySelector('.dm-hh [title="Close search"]');
    expect(close).toBeTruthy();
    expect(close.className).toContain("dm-iconbtn-active");
    click(close);
    expect(el.querySelector('.dm-hh [title="Search stacks"]')).toBeTruthy();
  });

  it("the Pro button is only for people without Premium", () => {
    expect(mount().el.querySelector(".dm-hh-pro")).toBeTruthy();
    document.body.innerHTML = "";
    expect(mount({ isPremium: true }).el.querySelector(".dm-hh-pro")).toBeNull();
  });

  it("the streak pill shows the number and opens the streak details", () => {
    const { el } = mount();
    const pill = el.querySelector(".dm-hh-streak");
    expect(pill.textContent).toBe("7");
    expect(pill.getAttribute("aria-label")).toBe("Streak: 7 days. Show details");
    expect(document.body.querySelector(".dm-streak-modal")).toBeNull();
    click(pill);
    expect(document.body.querySelector(".dm-streak-modal .dm-streak-hero-num").textContent).toBe("7");
  });

  it("says '1 day' for a one-day streak", () => {
    const { el } = mount({ streak: 1 });
    expect(el.querySelector(".dm-hh-streak").getAttribute("aria-label")).toBe("Streak: 1 day. Show details");
  });
});

describe("Home toolbar", () => {
  it("has a Colours button that opens a dropdown and picks a colour", () => {
    const onOpenColor = vi.fn();
    const { el } = mount({ onOpenColor });
    expect(el.querySelector(".dm-ht-counts")).toBeNull();
    expect(el.querySelector(".dm-ht-colors-menu")).toBeNull();
    click(el.querySelector(".dm-ht-colors-btn"));
    const items = el.querySelectorAll(".dm-ht-colors-item");
    expect(items.length).toBe(5);
    click(items[0]);
    expect(onOpenColor).toHaveBeenCalledWith("red");
    expect(el.querySelector(".dm-ht-colors-menu")).toBeNull();
  });

  it("the theme button switches in both directions", () => {
    const dark = mount();
    expect(dark.el.querySelector(".dm-ht-theme").getAttribute("title")).toBe("Switch to light mode");
    click(dark.el.querySelector(".dm-ht-theme"));
    expect(dark.onToggleTheme).toHaveBeenCalledTimes(1);
    document.body.innerHTML = "";
    const light = mount({ theme: "light" });
    expect(light.el.querySelector(".dm-ht-theme").getAttribute("title")).toBe("Switch to dark mode");
  });

  it("New stack opens the create dialog", () => {
    const { el } = mount();
    const btn = el.querySelector(".dm-ht-new");
    expect(btn.getAttribute("aria-label")).toBe("New stack");
    expect(btn.querySelector(".dm-ht-new-label").textContent).toBe("New stack");
    const before = document.body.innerHTML.length;
    click(btn);
    expect(document.body.innerHTML.length).toBeGreaterThan(before);
  });

  it("the due row comes right after the toolbar and only when words are due", () => {
    const none = mount();
    expect(none.el.querySelector(".dm-due")).toBeNull();
    document.body.innerHTML = "";
    const some = mount({ dueCount: 3 });
    expect(some.el.querySelector(".dm-ht + .dm-due")).toBeTruthy();
    click(some.el.querySelector(".dm-due"));
    expect(some.onStartReview).toHaveBeenCalledTimes(1);
  });
});

describe("the old header styles are gone for good", () => {
  it("no stylesheet still styles the removed Home header/toolbar classes", () => {
    const gone =
      /\.(dm-stats-row|dm-stats-group|dm-count-pill|dm-count-item|dm-theme-toggle|dm-stat-newstack|dm-mobile-brand|dm-header-brand|dm-header-logo|dm-header-actions|dm-home-hero-copy|dm-home-premium-btn|dm-due-banner)(?![\w-])/;
    const found = [];
    const walk = (dir) => {
      for (const f of fs.readdirSync(dir)) {
        const p = path.join(dir, f);
        if (fs.statSync(p).isDirectory()) walk(p);
        else if (p.endsWith(".css") && gone.test(fs.readFileSync(p, "utf8"))) found.push(p);
      }
    };
    walk(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../.."));
    expect(found).toEqual([]);
  });
});
