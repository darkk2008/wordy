/* components/stack-select/stack-select.jsx
 * Stack dropdowns (StackSelect, StackPickerUp).
 */

import { useEffect, useRef, useState } from "react";
import { AnimatedIcon } from "../common/common";
import { uniqueWordCount } from "../games/combine-stacks";
import { Check, ChevronDown, Layers, X } from "../icons/icons";

/* The "Select multiple stacks" switch shown in both pickers (the sheet and the rail). */
function MultiSwitch({ on, onChange, compact }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      className={`dm-ss-multi${on ? " is-on" : ""}${compact ? " dm-ss-multi-compact" : ""}`}
      onClick={() => onChange(!on)}
    >
      <span className="dm-ss-multi-text">
        <span className="dm-ss-multi-title">Select multiple stacks</span>
        {!compact && (
          <span className="dm-ss-multi-sub">Play games with several stacks at once</span>
        )}
      </span>
      <span className="dm-ss-multi-track" aria-hidden="true">
        <span className="dm-ss-multi-thumb" />
      </span>
    </button>
  );
}

export function StackSelect({
  stacks,
  value,
  onChange,
  variant,
  active = true,
  // Several stacks at once (optional): `multi` is the mode, `values` the picked stack ids. The switch
  // only shows when onMultiChange is given and there is more than one stack to choose from.
  multi = false,
  values = [],
  onMultiChange,
  onChangeValues,
}) {
  const showDropdown = variant !== "rail";
  const showRail = variant !== "dropdown";
  const [open, setOpen] = useState(false);
  const listRef = useRef(null);
  const [edges, setEdges] = useState({
    t: false,
    b: false,
  });
  const ref = useRef(null);
  const railRef = useRef(null);
  const current = stacks.find((s) => s.id === value) || stacks[0];
  const canMulti = typeof onMultiChange === "function" && stacks.length > 1;
  const multiOn = multi && canMulti;
  const picked = multiOn ? values.map((id) => stacks.find((s) => s.id === id)).filter(Boolean) : [];
  const pickedIds = picked.map((s) => s.id);
  const manyPicked = multiOn && picked.length > 1;
  const pickedWords = manyPicked ? uniqueWordCount(picked) : 0;
  const allPicked = multiOn && picked.length === stacks.length;
  const isOn = (id) => (multiOn ? pickedIds.includes(id) : id === value);
  const toggleValue = (id) => {
    const has = pickedIds.includes(id);
    if (has && pickedIds.length <= 1) return; // there is always at least one stack
    onChangeValues(has ? pickedIds.filter((v) => v !== id) : [...pickedIds, id]);
  };
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
    if (!open || !listRef.current) return;
    const a = listRef.current.querySelector('[aria-selected="true"]');
    if (a && a.scrollIntoView) a.scrollIntoView({ block: "center" });
  }, [open]);
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
            },
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
            {manyPicked ? <Layers size={20} /> : <AnimatedIcon id={(multiOn && picked[0] ? picked[0] : current)?.emoji} size={22} />}
          </span>
          <span className="dm-stackselect-info">
            <span className="dm-stackselect-name">
              {manyPicked ? `${picked.length} stacks` : (multiOn && picked[0] ? picked[0] : current)?.name}
            </span>
            <span className="dm-stackselect-count">
              {manyPicked ? pickedWords : (multiOn && picked[0] ? picked[0] : current)?.words.length}
              {" words"}
            </span>
          </span>
          <ChevronDown size={18} className="dm-stackselect-chevron" />
        </button>
      )}
      {showDropdown && open && (
        <div
          className="dm-modal-backdrop dm-ss-backdrop"
          onClick={() => setOpen(false)}
        >
          <div
            className="dm-modal dm-ss-sheet"
            role="dialog"
            aria-label="Choose a stack to practice"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dm-ss-head">
              <div className="dm-ss-head-text">
                <div className="dm-ss-title">{multiOn ? "Practice stacks" : "Practice stack"}</div>
                <div className="dm-ss-sub">
                  {multiOn ? (
                    `${picked.length} selected · ${uniqueWordCount(picked)} ${
                      uniqueWordCount(picked) === 1 ? "word" : "words"
                    }`
                  ) : (
                    <>
                      {stacks.length}
                      {stacks.length === 1 ? " stack" : " stacks"}
                    </>
                  )}
                </div>
              </div>
              {multiOn && (
                // Between the title and the close button, so the sheet does not get taller.
                <div className="dm-ss-head-actions">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={allPicked}
                    aria-label="Select all"
                    className={`dm-ss-all${allPicked ? " is-on" : ""}`}
                    onClick={() =>
                      onChangeValues(allPicked ? pickedIds.slice(0, 1) : stacks.map((s) => s.id))
                    }
                  >
                    <span className="dm-ss-all-box" aria-hidden="true">
                      {allPicked && <Check size={12} />}
                    </span>
                    All
                  </button>
                  <button
                    type="button"
                    className="dm-ss-done"
                    aria-label="Done"
                    title="Done"
                    onClick={() => setOpen(false)}
                  >
                    <Check size={18} />
                  </button>
                </div>
              )}
              <button
                type="button"
                className="dm-ss-close"
                aria-label="Close"
                onClick={() => setOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            {canMulti && <MultiSwitch on={multiOn} onChange={onMultiChange} />}
            <div
              className="dm-ss-list"
              role="listbox"
              aria-multiselectable={multiOn || undefined}
              ref={listRef}
            >
              {stacks.map((s) => {
                const on = isOn(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    role="option"
                    aria-selected={on}
                    className={`dm-ss-opt ${on ? "dm-ss-opt-active" : ""}`}
                    onClick={() => {
                      if (multiOn) {
                        toggleValue(s.id);
                        return;
                      }
                      onChange(s.id);
                      setOpen(false);
                    }}
                  >
                    <span className="dm-ss-opt-icon">
                      <AnimatedIcon id={s.emoji} size={26} />
                    </span>
                    <span className="dm-ss-opt-text">
                      <span className="dm-ss-opt-name">{s.name}</span>
                      <span className="dm-ss-opt-count">
                        <b>{s.words.length}</b>
                        {s.words.length === 1 ? " word" : " words"}
                      </span>
                    </span>
                    <span
                      className={`dm-ss-opt-mark${multiOn ? " dm-ss-opt-mark-box" : ""}`}
                      aria-hidden="true"
                    >
                      {on && <Check size={14} />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {showRail && canMulti && <MultiSwitch on={multiOn} onChange={onMultiChange} compact />}
      {showRail && (
        <div
          ref={railRef}
          className={`dm-stackrail${edges.t ? " dm-stackrail-fade-t" : ""}${edges.b ? " dm-stackrail-fade-b" : ""}`}
          role={multiOn ? "group" : "radiogroup"}
          aria-label={multiOn ? "Practice stacks" : "Practice stack"}
          onKeyDown={(e) => {
            if (multiOn) return;
            if (
              e.key !== "ArrowRight" &&
              e.key !== "ArrowLeft" &&
              e.key !== "ArrowDown" &&
              e.key !== "ArrowUp"
            )
              return;
            const i = stacks.findIndex((s) => s.id === value);
            if (i < 0) return;
            const step =
              e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1;
            const next = stacks[(i + step + stacks.length) % stacks.length];
            e.preventDefault();
            onChange(next.id);
            const el = e.currentTarget.querySelector(
              `[data-stack-id="${next.id}"]`,
            );
            if (el) el.focus();
          }}
        >
          {stacks.map((s) => {
            const on = isOn(s.id);
            return (
              <button
                key={s.id}
                type="button"
                role={multiOn ? "checkbox" : "radio"}
                data-stack-id={s.id}
                aria-checked={on}
                tabIndex={multiOn || on ? 0 : -1}
                className={`dm-stackrail-item ${on ? "dm-stackrail-item-active" : ""}${multiOn ? " dm-stackrail-item-multi" : ""}`}
                onClick={() => (multiOn ? toggleValue(s.id) : onChange(s.id))}
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
                {multiOn && (
                  <span className="dm-stackrail-check" aria-hidden="true">
                    {on && <Check size={12} />}
                  </span>
                )}
              </button>
            );
          })}
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
              <span className="dm-stackselect-item-count">
                {s.words.length}
              </span>
              {s.id === value && (
                <Check size={15} className="dm-stackselect-check" />
              )}
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
      String(Date.now() + GAME_COOLDOWN_MS),
    );
  } catch (e) {}
}
export function formatCooldownClock(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1e3));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}
