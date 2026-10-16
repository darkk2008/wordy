/* components/stack-select/stack-select.jsx
 * Stack dropdowns (StackSelect, StackPickerUp).
 */

import { useEffect, useRef, useState } from "react";
import { AnimatedIcon } from "../common/common";
import { Check, ChevronDown, Layers } from "../icons/icons";

export function StackSelect({ stacks, value, onChange, variant, active = true }) {
  const showDropdown = variant !== "rail";
  const showRail = variant !== "dropdown";
  const [open, setOpen] = useState(false);
  const [menuMounted, setMenuMounted] = useState(false);
  useEffect(() => {
    if (open) {
      setMenuMounted(true);
      return;
    }
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setMenuMounted(false);
      return;
    }
    const t = setTimeout(() => setMenuMounted(false), 180);
    return () => clearTimeout(t);
  }, [open]);
  const showMenu = open || menuMounted;
  const [edges, setEdges] = useState({
    t: false,
    b: false,
  });
  const ref = useRef(null);
  const railRef = useRef(null);
  const current = stacks.find((s) => s.id === value) || stacks[0];
  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);
  useEffect(() => {
    if (!active) setOpen(false);
  }, [active]);
  useEffect(() => {
    if (!showRail) return;
    const el = railRef.current;
    if (!el) return;
    const update = () => {
      const t = el.scrollTop > 2;
      const b = el.scrollTop + el.clientHeight < el.scrollHeight - 2;
      setEdges((p) =>
        p.t === t && p.b === b
          ? p
          : {
              t,
              b,
            }
      );
    };
    update();
    el.addEventListener("scroll", update, {
      passive: true,
    });
    window.addEventListener("resize", update);
    let ro = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(update);
      ro.observe(el);
    }
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      if (ro) ro.disconnect();
    };
  }, [showRail, stacks.length]);
  useEffect(() => {
    if (!showRail || !active) return;
    const el = railRef.current;
    if (!el) return;
    const a = el.querySelector('[aria-checked="true"]');
    if (!a) return;
    const top = a.offsetTop,
      bottom = top + a.offsetHeight;
    if (top < el.scrollTop || bottom > el.scrollTop + el.clientHeight) {
      const target = Math.max(0, top - (el.clientHeight - a.offsetHeight) / 2);
      try {
        el.scrollTo({
          top: target,
          behavior: "smooth",
        });
      } catch (e) {
        el.scrollTop = target;
      }
    }
  }, [value, active, showRail]);
  if (!stacks.length) return null;
  return (
    <div
      className={`dm-stackselect ${showDropdown && !showRail ? "dm-stackselect-compact" : ""}`}
      ref={ref}
    >
      {showDropdown && (
        <button
          type="button"
          className={`dm-stackselect-trigger ${open ? "dm-stackselect-trigger-open" : ""}`}
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className="dm-stackselect-emoji">
            <AnimatedIcon id={current?.emoji} size={22} />
          </span>
          <span className="dm-stackselect-info">
            <span className="dm-stackselect-name">{current?.name}</span>
            <span className="dm-stackselect-count">
              {current?.words.length}
              {" words"}
            </span>
          </span>
          <ChevronDown size={18} className="dm-stackselect-chevron" />
        </button>
      )}
      {showDropdown && showMenu && (
        <div className={"dm-stackselect-menu" + (open ? "" : " dm-stackselect-menu-leaving")}>
          {stacks.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`dm-stackselect-item ${s.id === value ? "dm-stackselect-item-active" : ""}`}
              onClick={() => {
                onChange(s.id);
                setOpen(false);
              }}
            >
              <span className="dm-stackselect-emoji">
                <AnimatedIcon id={s.emoji} size={20} />
              </span>
              <span className="dm-stackselect-item-name">{s.name}</span>
              <span className="dm-stackselect-item-count">{s.words.length}</span>
              {s.id === value && <Check size={15} className="dm-stackselect-check" />}
            </button>
          ))}
        </div>
      )}
      {showRail && (
        <div
          ref={railRef}
          className={`dm-stackrail${edges.t ? " dm-stackrail-fade-t" : ""}${edges.b ? " dm-stackrail-fade-b" : ""}`}
          role="radiogroup"
          aria-label="Practice stack"
          onKeyDown={(e) => {
            if (
              e.key !== "ArrowRight" &&
              e.key !== "ArrowLeft" &&
              e.key !== "ArrowDown" &&
              e.key !== "ArrowUp"
            )
              return;
            const i = stacks.findIndex((s) => s.id === value);
            if (i < 0) return;
            const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1;
            const next = stacks[(i + step + stacks.length) % stacks.length];
            e.preventDefault();
            onChange(next.id);
            const el = e.currentTarget.querySelector(`[data-stack-id="${next.id}"]`);
            if (el) el.focus();
          }}
        >
          {stacks.map((s) => (
            <button
              key={s.id}
              type="button"
              role="radio"
              data-stack-id={s.id}
              aria-checked={s.id === value}
              tabIndex={s.id === value ? 0 : -1}
              className={`dm-stackrail-item ${s.id === value ? "dm-stackrail-item-active" : ""}`}
              onClick={() => onChange(s.id)}
            >
              <span className="dm-stackrail-emoji">
                <AnimatedIcon id={s.emoji} size={22} />
              </span>
              <span className="dm-stackrail-text">
                <span className="dm-stackrail-name">{s.name}</span>
                <span className="dm-stackrail-count">
                  {s.words.length}
                  {s.words.length === 1 ? " word" : " words"}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
export function StackPickerUp({ stacks, value, onChange, open, setOpen }) {
  const ref = useRef(null);
  const current = stacks.find((s) => s.id === value) || stacks[0];
  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  if (!stacks.length) {
    return (
      <div className="dm-tr-stackpick dm-tr-stackpick-empty">
        <Layers size={15} />
        {" New stack"}
      </div>
    );
  }
  return (
    <div className="dm-tr-stackpick" ref={ref}>
      <button
        type="button"
        className={`dm-tr-stackpick-trigger ${open ? "dm-tr-stackpick-trigger-open" : ""}`}
        onClick={() => setOpen((o) => !o)}
      >
        <AnimatedIcon id={current?.emoji} size={18} />
        <span className="dm-tr-stackpick-name">{current?.name}</span>
        <span className="dm-tr-stackpick-count">
          {current?.words.length}
          {current?.words.length === 1 ? " word" : " words"}
        </span>
        <ChevronDown size={15} className="dm-tr-stackpick-chevron" />
      </button>
      {open && (
        <div className="dm-tr-stackpick-menu">
          {stacks.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`dm-stackselect-item ${s.id === value ? "dm-stackselect-item-active" : ""}`}
              onClick={() => {
                onChange(s.id);
                setOpen(false);
              }}
            >
              <span className="dm-stackselect-emoji">
                <AnimatedIcon id={s.emoji} size={20} />
              </span>
              <span className="dm-stackselect-item-name">{s.name}</span>
              <span className="dm-stackselect-item-count">{s.words.length}</span>
              {s.id === value && <Check size={15} className="dm-stackselect-check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
const GAME_COOLDOWN_MS = 3 * 60 * 1e3;
export function getGameCooldownUntil(gameId) {
  try {
    const raw = window.localStorage.getItem("wf-game-cooldown-" + gameId);
    const until = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(until) ? until : 0;
  } catch (e) {
    return 0;
  }
}
export function recordGameCooldown(gameId) {
  try {
    window.localStorage.setItem(
      "wf-game-cooldown-" + gameId,
      String(Date.now() + GAME_COOLDOWN_MS)
    );
  } catch (e) {}
}
export function formatCooldownClock(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1e3));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}
