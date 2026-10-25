/* components/games/scramble-game.jsx
 * Letter scramble game.
 *
 * - The answer is a row of slots, one per letter (with gaps for word breaks like "der Hund").
 * - Drag any tile into any slot; drag a placed letter to another slot to move/swap it, or back to the
 *   tile pool to take it out. Tapping a tile fills the first empty slot; tapping a placed letter removes it.
 * - When every slot is filled the word is checked. A correct word moves on by itself. A wrong one is
 *   NOT final: it shakes and stays editable so the letters can be rearranged (it counts as a miss).
 * - Hint puts the next correct letter in place; Shuffle re-orders the tiles; keyboard typing works.
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { speak } from "../../core/speech-voices";
import { shuffle } from "../../core/srs-and-seed-data";
import { LightbulbSuggestIcon, RotateCcw, Shuffle, Volume2 } from "../icons/icons";
import { GameDone, GameTopBar } from "./game-chrome";

// A word solved with a hint still shows as solved, but counts as a miss for the review schedule
// and the score, because it was not recalled unaided. Set to false to give full credit instead.
const HINT_COUNTS_AS_MISS = true;
const CORRECT_DELAY_MS = 900;
const LONG_WORD = 12;
const DRAG_THRESHOLD = 6;

const letterKey = (s) => s.replace(/\s/g, "").toLowerCase();
const fold = (s) => s.normalize("NFD").replace(/\p{M}/gu, "");

// Positions (number of letters before the space) where the word has a break.
function wordBreaks(word) {
  const breaks = new Set();
  let count = 0;
  let prevSpace = true;
  for (const ch of word.trim()) {
    if (/\s/.test(ch)) {
      if (!prevSpace && count > 0) breaks.add(count);
      prevSpace = true;
    } else {
      count++;
      prevSpace = false;
    }
  }
  return breaks;
}

// Shuffle until the result differs from the answer (when that is possible at all).
function scrambleLetters(letters) {
  if (letters.length < 2 || new Set(letters).size < 2) return [...letters];
  let s = shuffle(letters);
  for (let tries = 0; tries < 12 && s.join("") === letters.join(""); tries++) s = shuffle(letters);
  if (s.join("") === letters.join("")) [s[0], s[1]] = [s[1], s[0]];
  return s;
}

// Easy-to-hard ramp: short words first, long compounds last (random inside each bucket).
const lengthBucket = (w) => {
  const n = letterKey(w.de).length;
  return n <= 5 ? 0 : n <= 9 ? 1 : 2;
};

function ScrambleRound({ w, deckKeys, onAnswer, onFinish }) {
  const original = w.de.trim().replace(/\s/g, "").split("");
  const targetLetters = original.map((c) => c.toLowerCase());
  const targetKey = targetLetters.join("");
  const total = targetLetters.length;
  const breaks = useRef(wordBreaks(w.de)).current;

  // Other words in the deck made of exactly the same letters are accepted too (real anagrams).
  const accepted = useRef(
    new Set(
      deckKeys.filter((k) => [...k].sort().join("") === [...targetKey].sort().join(""))
    )
  ).current;

  // tiles: fixed ids, only their on-screen order changes when shuffling
  const [tiles, setTiles] = useState(() =>
    scrambleLetters(targetLetters).map((l, i) => ({ l, i }))
  );
  // slots[k] = id of the tile sitting in slot k, or null
  const [slots, setSlots] = useState(() => Array(total).fill(null));
  const [placedOrder, setPlacedOrder] = useState([]); // placement order, for Undo
  const [status, setStatus] = useState(null); // null | "correct"
  const [hints, setHints] = useState(0);
  const [missed, setMissed] = useState(false);
  const [shake, setShake] = useState(0);
  const [drag, setDrag] = useState(null); // { id, from, letter, x, y } while dragging
  const [hover, setHover] = useState(null); // slot index | "pool" | null

  const hintsRef = useRef(0);
  const missedRef = useRef(false);
  const reportedRef = useRef(false);
  const timer = useRef(null);
  const builtRef = useRef(null);
  const poolRef = useRef(null);
  const dragRef = useRef(null);
  const suppressClick = useRef(false);
  const cleanupDrag = useRef(null);

  const letterOf = (id) => tiles.find((t) => t.i === id).l;
  const usedSet = new Set(slots.filter((x) => x !== null));
  const full = slots.every((x) => x !== null);
  const bad = full && !status;

  useEffect(
    () => () => {
      clearTimeout(timer.current);
      cleanupDrag.current?.();
    },
    []
  );

  const buzz = (pattern) => {
    try {
      navigator.vibrate?.(pattern);
    } catch (e) {
      /* vibration is optional */
    }
  };

  const evaluate = (next) => {
    const guess = next.map(letterOf).join("");
    const ok = guess === targetKey || accepted.has(guess);
    if (ok) {
      const unaided = !missedRef.current && !(hintsRef.current > 0 && HINT_COUNTS_AS_MISS);
      setStatus("correct");
      if (!reportedRef.current) {
        reportedRef.current = true;
        onAnswer(w.id, unaided);
      }
      buzz(12);
      timer.current = setTimeout(() => onFinish(unaided), CORRECT_DELAY_MS);
    } else {
      // a wrong arrangement is recorded once as a miss, but the player can keep fixing it
      if (!reportedRef.current) {
        reportedRef.current = true;
        onAnswer(w.id, false);
      }
      missedRef.current = true;
      setMissed(true);
      setShake((n) => n + 1);
      buzz([30, 40, 30]);
    }
  };

  const commit = (next) => {
    setSlots(next);
    setPlacedOrder((prev) => {
      const placed = new Set(next.filter((x) => x !== null));
      const kept = prev.filter((x) => placed.has(x));
      next.forEach((x) => {
        if (x !== null && !kept.includes(x)) kept.push(x);
      });
      return kept;
    });
    if (next.every((x) => x !== null)) evaluate(next);
  };

  const placeFirstEmpty = (id) => {
    if (status || usedSet.has(id)) return;
    const k = slots.indexOf(null);
    if (k < 0) return;
    const next = [...slots];
    next[k] = id;
    commit(next);
  };
  const removeSlot = (k) => {
    if (status || slots[k] === null) return;
    const next = [...slots];
    next[k] = null;
    commit(next);
  };
  const undo = () => {
    if (status || placedOrder.length === 0) return;
    const k = slots.indexOf(placedOrder[placedOrder.length - 1]);
    if (k >= 0) removeSlot(k);
  };
  const reshuffle = () => {
    if (!status) setTiles((t) => shuffle(t));
  };
  const hint = () => {
    if (status) return;
    // first slot that is empty or holds the wrong letter
    let p = 0;
    while (p < total && slots[p] !== null && letterOf(slots[p]) === targetLetters[p]) p++;
    if (p >= total) return;
    const correctlyPlaced = new Set();
    slots.forEach((id, q) => {
      if (id !== null && letterOf(id) === targetLetters[q]) correctlyPlaced.add(id);
    });
    const tile = tiles.find((t) => t.l === targetLetters[p] && !correctlyPlaced.has(t.i));
    if (!tile) return;
    const next = [...slots];
    const from = next.indexOf(tile.i);
    if (from >= 0) next[from] = null;
    next[p] = tile.i; // whatever was in slot p goes back to the pool
    hintsRef.current += 1;
    setHints((h) => h + 1);
    commit(next);
  };

  // Apply a finished drag. target: slot index, "pool" or null (dropped nowhere = cancel).
  const drop = (id, from, target) => {
    if (status || target === null) return;
    const next = [...slots];
    if (target === "pool") {
      if (from === "pool") return;
      next[from] = null;
    } else if (from === "pool") {
      next[target] = id; // a tile that was in this slot returns to the pool
    } else {
      if (from === target) return;
      [next[from], next[target]] = [next[target], next[from]]; // move into empty slot or swap
    }
    commit(next);
  };

  // Which drop zone is under the pointer: the tile pool, the nearest slot, or nothing.
  const targetAt = (x, y) => {
    const pr = poolRef.current?.getBoundingClientRect();
    if (pr && x >= pr.left && x <= pr.right && y >= pr.top - 8 && y <= pr.bottom + 8) return "pool";
    const br = builtRef.current?.getBoundingClientRect();
    if (br && x >= br.left - 12 && x <= br.right + 12 && y >= br.top - 12 && y <= br.bottom + 12) {
      let best = null;
      let bestD = Infinity;
      builtRef.current.querySelectorAll("[data-slot]").forEach((el) => {
        const r = el.getBoundingClientRect();
        const d = (x - (r.left + r.width / 2)) ** 2 + (y - (r.top + r.height / 2)) ** 2;
        if (d < bestD) {
          bestD = d;
          best = Number(el.dataset.slot);
        }
      });
      return best;
    }
    return null;
  };

  const api = useRef({});
  api.current = { drop, placeFirstEmpty, undo, tiles, usedSet, status, targetAt };

  const startDrag = (e, id, from, letter) => {
    if (status || (e.button !== undefined && e.button !== 0)) return;
    cleanupDrag.current?.();
    dragRef.current = { id, from, letter, sx: e.clientX, sy: e.clientY, moved: false };
    const move = (ev) => {
      const d = dragRef.current;
      if (!d) return;
      if (!d.moved) {
        if (Math.hypot(ev.clientX - d.sx, ev.clientY - d.sy) < DRAG_THRESHOLD) return;
        d.moved = true;
      }
      setDrag({ id: d.id, from: d.from, letter: d.letter, x: ev.clientX, y: ev.clientY });
      setHover(api.current.targetAt(ev.clientX, ev.clientY));
    };
    const end = (ev, cancelled) => {
      const d = dragRef.current;
      cleanup();
      setDrag(null);
      setHover(null);
      if (d?.moved) {
        // the click that follows a drag must not also count as a tap
        suppressClick.current = true;
        setTimeout(() => {
          suppressClick.current = false;
        }, 0);
        if (!cancelled) api.current.drop(d.id, d.from, api.current.targetAt(ev.clientX, ev.clientY));
      }
    };
    const up = (ev) => end(ev, false);
    const cancel = (ev) => end(ev, true);
    function cleanup() {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
      dragRef.current = null;
      cleanupDrag.current = null;
    }
    cleanupDrag.current = cleanup;
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
  };

  const onTileClick = (id) => {
    if (suppressClick.current) return;
    placeFirstEmpty(id);
  };
  const onChipClick = (k) => {
    if (suppressClick.current) return;
    removeSlot(k);
  };

  // Desktop keyboard: type letters to fill the next empty slot, Backspace to undo.
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      const a = api.current;
      if (e.key === "Backspace") {
        e.preventDefault();
        a.undo();
      } else if (e.key.length === 1 && /\p{L}/u.test(e.key) && !a.status) {
        const k = e.key.toLowerCase();
        const free = a.tiles.filter((x) => !a.usedSet.has(x.i));
        const tile = free.find((x) => x.l === k) || free.find((x) => fold(x.l) === fold(k));
        if (tile) {
          e.preventDefault();
          a.placeFirstEmpty(tile.i);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Slots: placed letters + empty outlines, with gaps where the word has breaks.
  const slotEls = [];
  for (let k = 0; k < total; k++) {
    const id = slots[k];
    const isHover = hover === k;
    if (id !== null) {
      // once solved, show the proper capitalisation of the word
      const shown = status === "correct" ? original[k] : letterOf(id);
      slotEls.push(
        <button
          key={`c${k}-${id}`}
          type="button"
          data-slot={k}
          className={`dm-letter-chip dm-letter-pop ${drag?.id === id ? "dm-dragging" : ""} ${
            isHover ? "dm-slot-hover" : ""
          }`}
          onPointerDown={(e) => startDrag(e, id, k, letterOf(id))}
          onClick={() => onChipClick(k)}
          aria-label={`Remove letter ${shown}`}
          disabled={!!status}
        >
          {shown}
        </button>
      );
    } else {
      slotEls.push(
        <span
          key={`s${k}`}
          data-slot={k}
          className={`dm-letter-slot ${isHover ? "dm-slot-hover" : ""}`}
          aria-hidden="true"
        />
      );
    }
    if (breaks.has(k + 1) && k + 1 < total) {
      slotEls.push(<span key={`g${k}`} className="dm-scramble-gap" aria-hidden="true" />);
    }
  }

  const ghostParent =
    drag && (builtRef.current?.closest(".dm-app") || document.body);

  return (
    <>
      <div className="dm-scramble-hint">
        {w.en}{" "}
        <button
          className="dm-speak-btn dm-speak-inline"
          onClick={() => speak(w.de)}
          aria-label="Listen"
        >
          <Volume2 size={15} />
        </button>
      </div>
      <div
        ref={builtRef}
        role="group"
        aria-label="Your answer"
        className={`dm-scramble-built ${total > LONG_WORD ? "dm-scramble-long" : ""} ${
          status === "correct"
            ? "dm-ok"
            : bad
              ? `dm-bad dm-scramble-shake-${shake % 2}`
              : ""
        }`}
      >
        {slotEls}
      </div>
      <div className="dm-write-answer dm-scramble-feedback" aria-live="polite">
        {bad && "Not quite — drag the letters to fix it"}
        {status === "correct" && hints > 0 && "Solved with a hint"}
        {!status && !bad && usedSet.size === 0 && (
          <span className="dm-flip-hint">Tap, drag or type the letters</span>
        )}
      </div>
      <div
        ref={poolRef}
        className={`dm-scramble-pool ${total > LONG_WORD ? "dm-scramble-long" : ""} ${
          hover === "pool" && drag && drag.from !== "pool" ? "dm-pool-hover" : ""
        }`}
      >
        {tiles.map((t) => (
          <button
            key={t.i}
            type="button"
            className={`dm-letter-tile ${usedSet.has(t.i) ? "dm-letter-used" : ""} ${
              drag?.id === t.i ? "dm-dragging" : ""
            }`}
            onPointerDown={(e) => !usedSet.has(t.i) && startDrag(e, t.i, "pool", t.l)}
            onClick={() => onTileClick(t.i)}
            disabled={usedSet.has(t.i) || !!status}
            aria-label={`Letter ${t.l}`}
          >
            {t.l}
          </button>
        ))}
      </div>
      <div className="dm-answer-row">
        <button
          className="dm-btn-secondary"
          onClick={undo}
          disabled={placedOrder.length === 0 || !!status}
          type="button"
        >
          <RotateCcw size={16} />
          {" Undo"}
        </button>
        <button className="dm-btn-secondary" onClick={hint} disabled={!!status} type="button">
          <LightbulbSuggestIcon size={16} />
          {" Hint"}
        </button>
        <button
          className="dm-btn-secondary"
          onClick={reshuffle}
          disabled={!!status || usedSet.size >= total - 1}
          type="button"
        >
          <Shuffle size={16} />
          {" Shuffle"}
        </button>
      </div>
      {drag &&
        drag.x !== undefined &&
        createPortal(
          <div
            className={`dm-letter-chip dm-drag-ghost ${total > LONG_WORD ? "dm-scramble-long" : ""}`}
            style={{ left: drag.x, top: drag.y }}
          >
            {drag.letter}
          </div>,
          ghostParent
        )}
    </>
  );
}

export function ScrambleGame({
  words,
  onAnswer,
  onExit,
  onPlayAgain,
  onNext,
  nextLabel,
  showRing,
  progressOverride,
}) {
  const [deck] = useState(() => {
    const valid = words.filter((x) => x && typeof x.de === "string" && letterKey(x.de).length > 0);
    return shuffle(valid).sort((a, b) => lengthBucket(a) - lengthBucket(b));
  });
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const done = idx >= deck.length;
  if (done)
    return (
      <GameDone
        onExit={onExit}
        onPlayAgain={onPlayAgain}
        label="Word Scramble"
        score={`${score}/${deck.length}`}
        onNext={onNext}
        nextLabel={nextLabel}
        showRing={showRing}
      />
    );
  const w = deck[idx];
  return (
    <div className="dm-game-play">
      <GameTopBar
        onExit={onExit}
        progress={progressOverride || `${idx + 1}/${deck.length}`}
        title="Word Scramble"
      />
      <ScrambleRound
        key={idx}
        w={w}
        deckKeys={deck.map((x) => letterKey(x.de))}
        onAnswer={onAnswer}
        onFinish={(unaidedCorrect) => {
          if (unaidedCorrect) setScore((s) => s + 1);
          setIdx((i) => i + 1);
        }}
      />
    </div>
  );
}
