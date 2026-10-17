/* components/swipeable-row/swipeable-row.jsx
 * Swipe-to-reveal row with its gesture guards.
 */

import { useEffect, useRef, useState } from "react";

const __openSwipeRows = new Set();
function closeAllOpenSwipeRows() {
  __openSwipeRows.forEach((fn) => {
    try {
      fn();
    } catch (e) {}
  });
  __openSwipeRows.clear();
}

/* Releasing a mouse/touch drag makes the browser dispatch a normal
   trailing "click" on whatever element ended up under the pointer —
   even though the gesture was a swipe, not a tap. Left alone, that
   click is indistinguishable from "the user tapped to dismiss this
   row", so both the document-level dmListClickGuard below and each
   row's own backdrop onClick would immediately re-close the row we
   just opened, before there's any chance to tap one of its action
   buttons. Call this right after settle() concludes a real drag (not
   a plain tap) to swallow exactly that one click, in the capture
   phase, before it reaches any other handler. */
function swallowTrailingClick() {
  if (typeof window === "undefined") return;
  const swallow = (ev) => {
    // A tap that lands on one of the just-revealed action buttons is a
    // real, intentional interaction (not the trailing click this function
    // exists to suppress), so let it through untouched. Otherwise a swipe
    // that opens a row would eat the user's first tap on its own action
    // button, requiring a second tap to actually fire it.
    const target = ev.target;
    if (target && target.closest && target.closest(".dm-swipe-action")) return;
    ev.stopPropagation();
    if (ev.cancelable) ev.preventDefault();
  };
  // Capture-phase listeners run in DOM order (window, then document, then
  // descendants) regardless of when they were registered, so attaching
  // this to window guarantees it runs before the document-level
  // dmListClickGuard below, intercepting the click before that guard
  // ever sees it.
  window.addEventListener("click", swallow, {
    capture: true,
    once: true,
  });
  // If the browser never dispatches the trailing click at all (this
  // varies by browser/input type), don't leave the listener armed to
  // swallow some unrelated later click instead — drop it shortly after.
  setTimeout(() => {
    window.removeEventListener("click", swallow, {
      capture: true,
    });
  }, 500);
}
function dmSwipeDownGuard(e) {
  if (__openSwipeRows.size === 0) return;
  const target = e.target;
  const openRow = target && target.closest && target.closest("[data-swipe-open]");
  if (openRow && openRow.getAttribute("data-swipe-open") !== "none") {
    return;
  }
  if (e.cancelable) e.preventDefault();
  e.stopPropagation();
  closeAllOpenSwipeRows();
}
export function dmListClickGuard(e) {
  if (__openSwipeRows.size === 0) return;
  const target = e.target;
  if (target && target.closest && target.closest(".dm-swipe-action")) {
    return;
  }
  if (e.cancelable) e.preventDefault();
  e.stopPropagation();
  closeAllOpenSwipeRows();
}
if (typeof document !== "undefined") {
  document.addEventListener("click", dmListClickGuard, true);
  document.addEventListener("mousedown", dmSwipeDownGuard, true);
  document.addEventListener("touchstart", dmSwipeDownGuard, {
    capture: true,
    passive: false,
  });
}
const SWIPE_ACTION_BTN = 44;
const SWIPE_ACTION_GAP = 4;
const SWIPE_ACTION_PADDING = 14;
const SWIPE_AXIS_DEADZONE = 32;
const SWIPE_TAP_GUARD_MS = 220;
function swipeActionsWidth(n, vertical) {
  if (n <= 0) return 0;
  if (vertical) {
    return SWIPE_ACTION_BTN + SWIPE_ACTION_PADDING;
  }
  return n * SWIPE_ACTION_BTN + (n - 1) * SWIPE_ACTION_GAP + SWIPE_ACTION_PADDING;
}
export function SwipeableRow({
  actions,
  leftActions,
  downActions,
  downEnabled,
  children,
  actionsColumn,
  forceElevated,
  forcedOpenSide,
  disableGestures,
}) {
  const rightActions = actions || [];
  const leftActs = leftActions || [];
  const downActs = downActions || [];
  const downEnabledRef = useRef(!!downEnabled);
  useEffect(() => {
    downEnabledRef.current = !!downEnabled;
  }, [downEnabled]);
  const [openSide, setOpenSide] = useState("none");
  const contentRef = useRef(null);
  const draggingRef = useRef(false);
  const axisRef = useRef(null);
  const startRef = useRef({
    x: 0,
    y: 0,
    t: 0,
    baseX: 0,
    baseY: 0,
  });
  const settleTimeoutRef = useRef(null);
  const pointerIdRef = useRef(null);
  const lastPointerIdRef = useRef(null);
  const capturedRef = useRef(false);
  const lastPosRef = useRef({
    x: 0,
    y: 0,
  });
  const closeRowRef = useRef(() => {});
  const startOpenSideRef = useRef("none");
  const stableCloserRef = useRef(null);
  if (stableCloserRef.current === null) stableCloserRef.current = () => closeRowRef.current();
  const maxNeg = -swipeActionsWidth(rightActions.length, actionsColumn);
  const maxPos = swipeActionsWidth(leftActs.length, actionsColumn);
  const maxDownPos = downActs.length > 0 ? SWIPE_ACTION_BTN + SWIPE_ACTION_PADDING : 0;
  const targetFor = (side) =>
    side === "right"
      ? {
          x: maxNeg,
          y: 0,
        }
      : side === "left"
        ? {
            x: maxPos,
            y: 0,
          }
        : side === "down"
          ? {
              x: 0,
              y: maxDownPos,
            }
          : {
              x: 0,
              y: 0,
            };
  const clearSettling = (el) => {
    if (settleTimeoutRef.current) {
      clearTimeout(settleTimeoutRef.current);
      settleTimeoutRef.current = null;
    }
    if (el) el.classList.remove("dm-swipe-settling");
  };
  const applyTransform = (x, y, animate) => {
    const el = contentRef.current;
    if (!el) return;
    const rx = Math.round(x);
    const ry = Math.round(y);
    el.style.transition = animate ? "transform 0.38s cubic-bezier(.16,1,.3,1)" : "none";
    el.style.transform = `translate(${rx}px, ${ry}px)`;
    el.classList.add("dm-swipe-settling");
    const outer = el.parentElement;
    const cell = outer && outer.closest(".dm-stack-cell");
    if (rx !== 0 || ry !== 0) {
      if (outer) outer.classList.add("dm-swipe-elevated");
      if (cell) cell.classList.add("dm-swipe-elevated");
    } else {
      if (outer) outer.classList.remove("dm-swipe-elevated");
      if (cell) cell.classList.remove("dm-swipe-elevated");
    }
    if (settleTimeoutRef.current) clearTimeout(settleTimeoutRef.current);
    if (animate) {
      settleTimeoutRef.current = setTimeout(() => clearSettling(el), 420);
    } else {
      settleTimeoutRef.current = null;
    }
  };
  const removeGlobalListeners = () => {
    window.removeEventListener("touchmove", onMove);
    window.removeEventListener("touchend", onUp);
    window.removeEventListener("touchcancel", onUp);
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
    window.removeEventListener("dragstart", onUp);
    const el = contentRef.current;
    if (el && pointerIdRef.current !== null) {
      try {
        el.releasePointerCapture(pointerIdRef.current);
      } catch (e) {}
    }
    pointerIdRef.current = null;
  };
  const settle = (side) => {
    draggingRef.current = false;
    setOpenSide(side);
    const t = targetFor(side);
    applyTransform(t.x, t.y, true);
    if (disableGestures) return;
    if (side === "none") {
      __openSwipeRows.delete(stableCloserRef.current);
    } else {
      __openSwipeRows.add(stableCloserRef.current);
    }
  };
  function onMove(e) {
    if (!draggingRef.current) return;
    if (!e.touches && e.buttons === 0) {
      onUp(e);
      return;
    }
    const p = e.touches ? e.touches[0] : e;
    lastPosRef.current = {
      x: p.clientX,
      y: p.clientY,
    };
    const dx = p.clientX - startRef.current.x;
    const dy = p.clientY - startRef.current.y;
    if (e.touches && axisRef.current === null) {
      const downSwipeArmedEarly =
        downEnabledRef.current &&
        downActs.length > 0 &&
        startOpenSideRef.current !== "left" &&
        startOpenSideRef.current !== "right";
      // On touch devices the browser decides whether a gesture is a page-scroll
      // within the very first touchmove events. If we wait until the axis is
      // locked (after the deadzone below) to call preventDefault, native
      // scrolling has often already taken over and a later preventDefault is
      // ignored. So while a down-swipe is armed, block the default scroll from
      // the first touchmove, before the deadzone/tap-guard checks below.
      if (downSwipeArmedEarly && e.cancelable) e.preventDefault();
    }
    if (axisRef.current === null) {
      if (Math.abs(dx) < SWIPE_AXIS_DEADZONE && Math.abs(dy) < SWIPE_AXIS_DEADZONE) return;
      const elapsed = Date.now() - startRef.current.t;
      if (
        elapsed < SWIPE_TAP_GUARD_MS &&
        Math.abs(dx) < SWIPE_AXIS_DEADZONE * 1.5 &&
        Math.abs(dy) < SWIPE_AXIS_DEADZONE * 1.5
      )
        return;
      const downSwipeArmed =
        downEnabledRef.current &&
        downActs.length > 0 &&
        startOpenSideRef.current !== "left" &&
        startOpenSideRef.current !== "right";
      if (downSwipeArmed) {
        if (dy > 0) {
          axisRef.current = "down";
        } else {
          draggingRef.current = false;
          return;
        }
      } else {
        const primaryAxis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
        if (primaryAxis === "y") {
          draggingRef.current = false;
          return;
        }
        axisRef.current = "x";
        if (
          !e.touches &&
          !capturedRef.current &&
          lastPointerIdRef.current !== null &&
          contentRef.current &&
          contentRef.current.setPointerCapture
        ) {
          capturedRef.current = true;
          try {
            contentRef.current.setPointerCapture(lastPointerIdRef.current);
            pointerIdRef.current = lastPointerIdRef.current;
          } catch (e2) {}
        }
      }
    }
    if (axisRef.current === "down") {
      if (e.cancelable) e.preventDefault();
      const deadZoneAdjustedDy = Math.abs(dy) <= SWIPE_AXIS_DEADZONE ? 0 : dy - SWIPE_AXIS_DEADZONE;
      let nextY = startRef.current.baseY + deadZoneAdjustedDy;
      if (nextY < 0) nextY = 0;
      const OVERSHOOT_CAP_Y = 28;
      if (nextY > maxDownPos) nextY = maxDownPos + (nextY - maxDownPos) * 0.25;
      nextY = Math.min(maxDownPos + OVERSHOOT_CAP_Y, nextY);
      applyTransform(0, nextY, false);
      return;
    }
    if (axisRef.current !== "x") return;
    if (e.cancelable) e.preventDefault();
    const deadZoneAdjustedDx =
      Math.abs(dx) <= SWIPE_AXIS_DEADZONE ? 0 : dx - Math.sign(dx) * SWIPE_AXIS_DEADZONE;
    let next = startRef.current.baseX + deadZoneAdjustedDx;
    if (startOpenSideRef.current === "right") next = Math.min(next, 0);
    else if (startOpenSideRef.current === "left") next = Math.max(next, 0);
    if (next > maxPos) next = maxPos + (next - maxPos) * 0.25;
    if (next < maxNeg) next = maxNeg + (next - maxNeg) * 0.25;
    const OVERSHOOT_CAP = 28;
    next = Math.max(maxNeg - OVERSHOOT_CAP, Math.min(maxPos + OVERSHOOT_CAP, next));
    applyTransform(next, 0, false);
  }
  function onUp(e) {
    removeGlobalListeners();
    if (!draggingRef.current) {
      axisRef.current = null;
      return;
    }
    const wasRealDrag = axisRef.current === "x" || axisRef.current === "down";
    const p = e.changedTouches ? e.changedTouches[0] : e;
    if (axisRef.current === "down") {
      const dy = p.clientY - startRef.current.y;
      const dt2 = Math.max(1, Date.now() - startRef.current.t);
      const velocityY = dy / dt2;
      const rawNextY = startRef.current.baseY + dy;
      let downSide;
      if (velocityY > 0.55 && dy > 20) downSide = "down";
      else if (rawNextY > maxDownPos / 2) downSide = "down";
      else downSide = "none";
      if (downSide === "down" && downActs.length === 0) downSide = "none";
      axisRef.current = null;
      settle(downSide);
      if (wasRealDrag) swallowTrailingClick();
      return;
    }
    const dx = p.clientX - startRef.current.x;
    const dt = Math.max(1, Date.now() - startRef.current.t);
    const velocity = dx / dt;
    const rawNext = startRef.current.baseX + dx;
    let side;
    if (axisRef.current !== "x") {
      side = startOpenSideRef.current;
    } else if (Math.abs(velocity) > 0.55 && Math.abs(dx) > 20)
      side = velocity < 0 ? "right" : "left";
    else if (rawNext < maxNeg / 2) side = "right";
    else if (rawNext > maxPos / 2) side = "left";
    else side = "none";
    if (side === "right" && rightActions.length === 0) side = "none";
    if (side === "left" && leftActs.length === 0) side = "none";
    if (
      startOpenSideRef.current !== "none" &&
      side !== "none" &&
      side !== startOpenSideRef.current
    ) {
      side = "none";
    }
    if (
      side !== "none" &&
      openSide === "none" &&
      typeof navigator !== "undefined" &&
      navigator.vibrate
    ) {
      try {
        navigator.vibrate(8);
      } catch (e2) {}
    }
    axisRef.current = null;
    settle(side);
    if (wasRealDrag) swallowTrailingClick();
  }
  const onDown = (e) => {
    if (disableGestures) return;
    if (!rightActions.length && !leftActs.length && !downActs.length) return;
    if (openSide === "none" && __openSwipeRows.size > 0) {
      closeAllOpenSwipeRows();
      return;
    }
    const p = e.touches ? e.touches[0] : e;
    if (!e.touches) {
      e.preventDefault();
      if (typeof window !== "undefined" && window.getSelection) {
        const sel = window.getSelection();
        if (sel && sel.removeAllRanges) sel.removeAllRanges();
      }
    }
    const startTarget = targetFor(openSide);
    startRef.current = {
      x: p.clientX,
      y: p.clientY,
      t: Date.now(),
      baseX: startTarget.x,
      baseY: startTarget.y,
    };
    startOpenSideRef.current = openSide;
    axisRef.current = null;
    capturedRef.current = false;
    draggingRef.current = true;
    window.addEventListener("touchmove", onMove, {
      passive: false,
    });
    window.addEventListener("touchend", onUp);
    window.addEventListener("touchcancel", onUp);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    if (!e.touches) window.addEventListener("dragstart", onUp);
  };
  const closeRow = () => {
    if (openSide !== "none") settle("none");
  };
  closeRowRef.current = closeRow;
  useEffect(() => {
    if (openSide !== "none") {
      const t = targetFor(openSide);
      applyTransform(t.x, t.y, true);
    }
  }, [rightActions.length, leftActs.length, downActs.length]);
  const wasForcedRef = useRef(false);
  useEffect(() => {
    if (forcedOpenSide !== undefined) {
      wasForcedRef.current = true;
      settle(forcedOpenSide);
    } else if (wasForcedRef.current) {
      wasForcedRef.current = false;
      settle("none");
    }
  }, [forcedOpenSide]);
  useEffect(
    () => () => {
      removeGlobalListeners();
      clearSettling(contentRef.current);
      __openSwipeRows.delete(stableCloserRef.current);
    },
    []
  );
  const renderPanel = (list, side) =>
    list.length > 0 && (
      <div
        className={`${side === "left" ? "dm-swipe-actions-left" : side === "down" ? "dm-swipe-actions-down" : "dm-swipe-actions"} ${actionsColumn ? "dm-swipe-actions-column" : ""}`}
        style={{
          ...(side === "down"
            ? {
                height: maxDownPos,
              }
            : {
                width: swipeActionsWidth(list.length, actionsColumn),
              }),
          // These panels are always mounted (so their width/height is known
          // for the drag math) and are positioned edge-to-edge, so the
          // "down" panel in particular sits on top of the left/right
          // panels' buttons wherever their boxes overlap, even while this
          // panel isn't the open one — silently eating clicks meant for
          // the visible buttons. Only the side that's actually open should
          // be clickable; the rest shouldn't intercept pointer events at all.
          pointerEvents: openSide === side ? "auto" : "none",
        }}
      >
        {list.map((a) => (
          <button
            key={a.key}
            type="button"
            className={`dm-swipe-action dm-swipe-action-${a.tone || "default"} ${a.active ? "dm-swipe-action-active" : ""}`}
            title={a.label}
            aria-label={a.label}
            onClick={(e) => {
              e.stopPropagation();
              a.onClick();
              closeRow();
            }}
          >
            {a.icon}
          </button>
        ))}
      </div>
    );
  return (
    <div
      className={`dm-swipe-outer ${openSide !== "none" || forceElevated ? "dm-swipe-elevated" : ""} ${openSide === "down" ? "dm-swipe-outer-down-open" : ""}`}
      style={
        openSide === "down"
          ? {
              paddingBottom: maxDownPos,
            }
          : undefined
      }
      data-swipe-open={openSide}
      onClick={() => {
        if (disableGestures) return;
        if (openSide !== "none") closeRow();
      }}
    >
      {renderPanel(leftActs, "left")}
      {renderPanel(rightActions, "right")}
      {renderPanel(downActs, "down")}
      <div
        ref={contentRef}
        className="dm-swipe-content"
        onTouchStart={onDown}
        onMouseDown={onDown}
        onPointerDown={(e) => {
          if (e.pointerType === "mouse") lastPointerIdRef.current = e.pointerId;
        }}
        onLostPointerCapture={() => {
          if (draggingRef.current)
            onUp({
              clientX: lastPosRef.current.x,
              clientY: lastPosRef.current.y,
              changedTouches: null,
            });
        }}
        onClickCapture={(e) => {
          if (disableGestures) return;
          if (openSide !== "none") {
            e.preventDefault();
            e.stopPropagation();
            closeRow();
          }
        }}
      >
        {children}
      </div>
    </div>
  );
}
