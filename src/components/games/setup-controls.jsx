/* components/games/setup-controls.jsx
 * Game setup controls: forms toggle, time select, audio toggle.
 */

import { useEffect, useRef, useState } from "react";
import { shuffle } from "../../core/srs-and-seed-data";
import { ChevronDown, Clock, Type, Volume2 } from "../icons/icons";
import { buildFormQuestions } from "./write-game";

export function FormsToggle({ checked, onChange, compact, title }) {
  return (
    <button
      className={`dm-forms-toggle ${checked ? "dm-forms-toggle-on" : ""} ${compact ? "dm-forms-toggle-compact" : ""}`}
      onClick={() => onChange(!checked)}
      type="button"
      title={title || "Plural / comparative forms"}
    >
      <span className="dm-forms-toggle-track">
        <span className="dm-forms-toggle-knob" />
      </span>
      {!compact && <span className="dm-forms-toggle-label">Plural / comparative forms</span>}
    </button>
  );
}
function time24Parts(value) {
  const parts = (value || "09:00").split(":");
  let hh = parseInt(parts[0], 10);
  if (isNaN(hh) || hh < 0 || hh > 23) hh = 9;
  let mm = parseInt(parts[1], 10);
  if (isNaN(mm) || mm < 0 || mm > 59) mm = 0;
  return {
    hh,
    mm,
  };
}
function formatTimeLabel(value) {
  const { hh, mm } = time24Parts(value);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}
const TIME_SELECT_HOURS = Array.from(
  {
    length: 24,
  },
  (_, i) => i
);
const TIME_SELECT_MINUTES = Array.from(
  {
    length: 12,
  },
  (_, i) => i * 5
);
export function TimeSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const panelRef = useRef(null);
  const hourColRef = useRef(null);
  const minColRef = useRef(null);
  const hourDragRef = useRef({
    dragging: false,
    moved: false,
  });
  const minDragRef = useRef({
    dragging: false,
    moved: false,
  });
  const { hh, mm } = time24Parts(value);
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const keyHandler = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handler, true);
    document.addEventListener("keydown", keyHandler, true);
    return () => {
      document.removeEventListener("mousedown", handler, true);
      document.removeEventListener("keydown", keyHandler, true);
    };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      const hEl =
        hourColRef.current && hourColRef.current.querySelector(".dm-time-col-item-active");
      const mEl = minColRef.current && minColRef.current.querySelector(".dm-time-col-item-active");
      if (hEl)
        hEl.scrollIntoView({
          block: "center",
        });
      if (mEl)
        mEl.scrollIntoView({
          block: "center",
        });
    });
  }, [open]);
  // A drag can otherwise get stuck "in progress" forever if the panel
  // closes mid-drag (e.g. an outside click while the mouse is still
  // down) or the pointerup/pointercancel never reaches this element
  // (e.g. release happens outside the window). Once stuck, any future
  // mouse movement over the column is misread as an active drag and the
  // list appears to chase the cursor from the very first pixel. Force a
  // full reset whenever the panel closes, and as a safety net, on any
  // pointerup/pointercancel/blur anywhere, regardless of the target.
  useEffect(() => {
    if (open) return;
    hourDragRef.current = {
      dragging: false,
      moved: false,
    };
    minDragRef.current = {
      dragging: false,
      moved: false,
    };
  }, [open]);
  useEffect(() => {
    const resetDrags = () => {
      hourDragRef.current.dragging = false;
      minDragRef.current.dragging = false;
    };
    window.addEventListener("pointerup", resetDrags);
    window.addEventListener("pointercancel", resetDrags);
    window.addEventListener("blur", resetDrags);
    return () => {
      window.removeEventListener("pointerup", resetDrags);
      window.removeEventListener("pointercancel", resetDrags);
      window.removeEventListener("blur", resetDrags);
    };
  }, []);
  // Lets you scroll the hour/minute list by wheeling or click-dragging
  // right over the numbers themselves, not just a thin scrollbar strip.
  // Native overflow-y:auto already handles touch drag, so the manual
  // pointer-drag path here only kicks in for mouse/pen input.
  const makeColHandlers = (dragRef) => ({
    onWheel: (e) => {
      e.stopPropagation();
      const el = e.currentTarget;
      let delta = e.deltaY;
      if (e.deltaMode === 1) delta *= 18;
      else if (e.deltaMode === 2) delta *= el.clientHeight;
      el.scrollTop += delta;
    },
    onTouchStart: (e) => e.stopPropagation(),
    onTouchMove: (e) => e.stopPropagation(),
    onPointerDown: (e) => {
      if (e.pointerType === "touch") return;
      const el = e.currentTarget;
      dragRef.current = {
        dragging: true,
        moved: false,
        startY: e.clientY,
        startTop: el.scrollTop,
        pointerId: e.pointerId,
      };
    },
    onPointerMove: (e) => {
      const d = dragRef.current;
      if (!d || !d.dragging) return;
      const dy = e.clientY - d.startY;
      if (!d.moved) {
        if (Math.abs(dy) <= 4) return;
        d.moved = true;
        d.dragStartY = e.clientY;
        d.dragStartTop = e.currentTarget.scrollTop;
        try {
          e.currentTarget.setPointerCapture(d.pointerId);
        } catch (err) {}
      }
      const dragDy = e.clientY - d.dragStartY;
      e.currentTarget.scrollTop = d.dragStartTop - dragDy;
      if (e.cancelable) e.preventDefault();
    },
    onPointerUp: (e) => {
      const d = dragRef.current;
      if (d) d.dragging = false;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (err) {}
    },
    onPointerCancel: (e) => {
      const d = dragRef.current;
      if (d) d.dragging = false;
    },
    onClickCapture: (e) => {
      const d = dragRef.current;
      if (d && d.moved) {
        e.preventDefault();
        e.stopPropagation();
        d.moved = false;
      }
    },
  });
  const hourHandlers = makeColHandlers(hourDragRef);
  const minHandlers = makeColHandlers(minDragRef);
  return (
    <div className="dm-time-select" ref={wrapRef}>
      <button
        type="button"
        className="dm-input dm-select dm-time-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Clock size={14} className="dm-time-select-icon" />
        <span className="dm-time-select-label">{formatTimeLabel(value)}</span>
        <ChevronDown
          size={16}
          className={`dm-select-chevron dm-time-select-chevron ${open ? "dm-select-chevron-open" : ""}`}
        />
      </button>
      {open && (
        <div className="dm-time-select-panel" role="listbox" ref={panelRef}>
          <div className="dm-time-col" ref={hourColRef} {...hourHandlers}>
            {TIME_SELECT_HOURS.map((hVal) => (
              <button
                key={hVal}
                type="button"
                role="option"
                aria-selected={hVal === hh}
                className={`dm-time-col-item ${hVal === hh ? "dm-time-col-item-active" : ""}`}
                onClick={() =>
                  onChange(`${String(hVal).padStart(2, "0")}:${String(mm).padStart(2, "0")}`)
                }
              >
                {String(hVal).padStart(2, "0")}
              </button>
            ))}
          </div>
          <div className="dm-time-col-sep">:</div>
          <div className="dm-time-col" ref={minColRef} {...minHandlers}>
            {TIME_SELECT_MINUTES.map((m5) => (
              <button
                key={m5}
                type="button"
                role="option"
                aria-selected={m5 === mm}
                className={`dm-time-col-item ${m5 === mm ? "dm-time-col-item-active" : ""}`}
                onClick={() =>
                  onChange(`${String(hh).padStart(2, "0")}:${String(m5).padStart(2, "0")}`)
                }
              >
                {String(m5).padStart(2, "0")}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
export function FormsAudioToggle({ checked, onChange, title, audioMode = true }) {
  const ToggleIcon = audioMode ? Volume2 : Type;
  return (
    <button
      className={`dm-forms-audio-toggle ${!audioMode ? "dm-forms-audio-toggle-text" : ""} ${checked ? "dm-forms-audio-toggle-on" : ""}`}
      onClick={() => onChange(!checked)}
      type="button"
      role="switch"
      aria-checked={checked}
      title={
        title ||
        (audioMode
          ? "Show/hide pronunciation for word forms"
          : "Show/hide plural • comparative forms")
      }
    >
      <span className="dm-forms-audio-track">
        <ToggleIcon size={audioMode ? 9 : 8} className="dm-forms-audio-icon" />
        <span className="dm-forms-audio-knob" />
      </span>
    </button>
  );
}
function buildFormFlashcards(w) {
  return shuffle(buildFormQuestions(w))
    .slice(0, 2)
    .map((q, i) => ({
      id: `${w.id}__formcard${i}`,
      de: q.answer,
      en: q.prompt,
      isFormCard: true,
      favorite: false,
      level: w.level,
    }));
}
