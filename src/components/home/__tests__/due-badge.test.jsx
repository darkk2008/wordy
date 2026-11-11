// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { createRoot } from "react-dom/client";
import { act, useMemo } from "react";
import { DueBadge } from "../due-badge";
import { useMinuteClock } from "../../../core/use-minute-clock";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function mount(node) {
  const el = document.createElement("div");
  document.body.appendChild(el);
  const root = createRoot(el);
  act(() => root.render(node));
  return { el, root };
}
afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = "";
});

describe("DueBadge", () => {
  it("is one button: dot, '<n> words due', and a 'Review now' hint", () => {
    const onClick = vi.fn();
    const { el } = mount(<DueBadge count={12} onClick={onClick} />);
    const btn = el.querySelector("button.dm-due");
    expect(btn).toBeTruthy();
    expect(btn.querySelector(".dm-due-dot")).toBeTruthy();
    expect(btn.querySelector(".dm-due-text").textContent).toBe("12 words due");
    expect(btn.querySelector(".dm-due-go").textContent).toBe("Review now");
    expect(btn.getAttribute("aria-label")).toBe("Review: 12 words due");
    act(() => btn.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("says '1 word due' in the singular", () => {
    const { el } = mount(<DueBadge count={1} onClick={() => {}} />);
    expect(el.querySelector(".dm-due-text").textContent).toBe("1 word due");
  });

  it("renders nothing when no word is due, or the count is not a usable number", () => {
    for (const c of [0, -3, undefined, null, NaN]) {
      const { el, root } = mount(<DueBadge count={c} onClick={() => {}} />);
      expect(el.querySelector(".dm-due")).toBeNull();
      act(() => root.unmount());
    }
  });
});

describe("useMinuteClock keeps 'due' from going stale", () => {
  it("a word that becomes due while the app stays open is counted without any other change", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T10:00:00Z"));
    const dueAt = Date.parse("2026-01-01T10:02:30Z");
    function Probe() {
      const clock = useMinuteClock();
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const due = useMemo(() => (dueAt <= Date.now() ? 1 : 0), [clock]);
      return <DueBadge count={due} onClick={() => {}} />;
    }
    const { el } = mount(<Probe />);
    expect(el.querySelector(".dm-due")).toBeNull();
    act(() => vi.advanceTimersByTime(60000));
    expect(el.querySelector(".dm-due")).toBeNull(); // 10:01, not yet
    act(() => vi.advanceTimersByTime(120000));
    expect(el.querySelector(".dm-due-text").textContent).toBe("1 word due"); // 10:03, now due
  });

  it("refreshes when the app returns to the foreground", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T10:00:00Z"));
    const dueAt = Date.parse("2026-01-01T10:05:00Z");
    function Probe() {
      const clock = useMinuteClock();
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const due = useMemo(() => (dueAt <= Date.now() ? 1 : 0), [clock]);
      return <span id="n">{due}</span>;
    }
    const { el } = mount(<Probe />);
    expect(el.textContent).toBe("0");
    // the phone slept: the clock jumped but no timer ran
    vi.setSystemTime(new Date("2026-01-01T11:00:00Z"));
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(el.textContent).toBe("1");
  });

  it("stops its timer and listener when the screen goes away", () => {
    vi.useFakeTimers();
    const spy = vi.spyOn(document, "removeEventListener");
    function Probe() {
      useMinuteClock();
      return null;
    }
    const { root } = mount(<Probe />);
    act(() => root.unmount());
    expect(spy).toHaveBeenCalledWith("visibilitychange", expect.any(Function));
    expect(vi.getTimerCount()).toBe(0);
    spy.mockRestore();
  });
});
