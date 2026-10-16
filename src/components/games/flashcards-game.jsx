/* components/games/flashcards-game.jsx
 * Flashcards game.
 */

import { useContext, useEffect, useRef, useState } from "react";
import { HideArticlesContext } from "../../core/contexts";
import { speak, useRomanizationEnabled } from "../../core/speech-voices";
import { shuffle } from "../../core/srs-and-seed-data";
import { WordMeta } from "../common/common";
import { Check, ChevronLeft, ChevronRight, Volume2, X } from "../icons/icons";
import { stripArticle } from "../word-forms/word-forms";
import { GameDone, GameTopBar } from "./game-chrome";
import { FormsToggle } from "./setup-controls";

export function FlashcardsGame({
  words,
  onAnswer,
  onExit,
  onPlayAgain,
  direction,
  mixForms,
  learningLanguage,
  nativeLanguage,
}) {
  const hideArticles = useContext(HideArticlesContext);
  const romanizationEnabled = useRomanizationEnabled();
  const [deck] = useState(() => shuffle(words));
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showForms, setShowForms] = useState(false);
  const [navDir, setNavDir] = useState(1);
  const [score, setScore] = useState(0);
  const answeredRef = useRef(new Set());
  const wrapRef = useRef(null);
  const againLabelRef = useRef(null);
  const goodLabelRef = useRef(null);
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const startRef = useRef({
    x: 0,
    t: 0,
  });
  const SWIPE_THRESHOLD = 90;
  const FLICK_VELOCITY = 0.5;
  const isDE2EN = direction !== "en2de";
  const done = idx >= deck.length;
  const w = deck[idx];
  const next = (correct) => {
    if (!answeredRef.current.has(idx)) {
      answeredRef.current.add(idx);
      onAnswer(w.id, correct);
      if (correct) setScore((s) => s + 1);
    }
    setFlipped(false);
    setNavDir(1);
    setIdx((i) => i + 1);
  };
  const goPrev = () => {
    setFlipped(false);
    setNavDir(-1);
    setIdx((i) => Math.max(0, i - 1));
  };
  const goNext = () => {
    setFlipped(false);
    setNavDir(1);
    setIdx((i) => Math.min(deck.length - 1, i + 1));
  };
  const applyCardTransform = (x, animate) => {
    const el = wrapRef.current;
    if (!el) return;
    const rounded = Math.round(x);
    el.style.transition = animate ? "transform 0.32s cubic-bezier(.16,1,.3,1)" : "none";
    el.style.transform = `translateX(${rounded}px) rotate(${rounded / 22}deg)`;
    const pull = Math.min(Math.abs(rounded) / SWIPE_THRESHOLD, 1);
    if (againLabelRef.current) againLabelRef.current.style.opacity = rounded < 0 ? pull : 0;
    if (goodLabelRef.current) goodLabelRef.current.style.opacity = rounded > 0 ? pull : 0;
  };
  const removeGlobalListeners = () => {
    window.removeEventListener("touchmove", onMove);
    window.removeEventListener("touchend", onUp);
    window.removeEventListener("touchcancel", onUp);
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
    window.removeEventListener("dragstart", onUp);
  };
  function onMove(e) {
    if (!draggingRef.current) return;
    if (!e.touches && e.buttons === 0) {
      onUp(e);
      return;
    }
    const p = e.touches ? e.touches[0] : e;
    const dx = p.clientX - startRef.current.x;
    if (Math.abs(dx) > 6) movedRef.current = true;
    if (e.cancelable) e.preventDefault();
    applyCardTransform(dx, false);
  }
  function onUp(e) {
    removeGlobalListeners();
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const p = e.changedTouches ? e.changedTouches[0] : e;
    const dx = p.clientX - startRef.current.x;
    const dt = Math.max(1, Date.now() - startRef.current.t);
    const velocity = dx / dt;
    let goingGood = null;
    if (Math.abs(velocity) > FLICK_VELOCITY) goingGood = velocity > 0;
    else if (dx > SWIPE_THRESHOLD) goingGood = true;
    else if (dx < -SWIPE_THRESHOLD) goingGood = false;
    if (goingGood === null) {
      applyCardTransform(0, true);
    } else {
      applyCardTransform(goingGood ? 700 : -700, true);
      setTimeout(() => next(goingGood), 160);
    }
  }
  const onDown = (e) => {
    const p = e.touches ? e.touches[0] : e;
    if (!e.touches) {
      e.preventDefault();
      if (typeof window !== "undefined" && window.getSelection) {
        const sel = window.getSelection();
        if (sel && sel.removeAllRanges) sel.removeAllRanges();
      }
    }
    startRef.current = {
      x: p.clientX,
      t: Date.now(),
    };
    movedRef.current = false;
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
  const onCardClick = () => {
    if (movedRef.current) {
      movedRef.current = false;
      return;
    }
    setFlipped((f) => !f);
  };
  useEffect(() => () => removeGlobalListeners(), []);
  useEffect(() => {
    applyCardTransform(0, false);
  }, [idx]);
  if (done)
    return (
      <GameDone
        onExit={onExit}
        onPlayAgain={onPlayAgain}
        label="Flashcards"
        score={`${score}/${deck.length}`}
      />
    );
  const isFormCard = !!w.isFormCard;
  const displayDe = hideArticles ? stripArticle(w.de) : w.de;
  const frontWord = isFormCard ? w.en : isDE2EN ? displayDe : w.en;
  const backWord = isFormCard ? displayDe : isDE2EN ? w.en : displayDe;
  const speakWord = isFormCard ? w.de : w.de;
  return (
    <div className="dm-game-play">
      <GameTopBar
        onExit={onExit}
        progress={`${idx + 1}/${deck.length}`}
        title="Flashcards"
        direction={direction}
        learningLanguage={learningLanguage}
        nativeLanguage={nativeLanguage}
      />
      <div className="dm-forms-toggle-row">
        {isFormCard ? (
          <span className="dm-case-pill">WORD FORM</span>
        ) : (
          <FormsToggle checked={showForms} onChange={setShowForms} />
        )}
      </div>
      <div
        className={`dm-flip-wrap ${navDir < 0 ? "dm-flip-wrap-inprev" : "dm-flip-wrap-innext"}`}
        key={idx}
        ref={wrapRef}
        onClick={onCardClick}
        onTouchStart={onDown}
        onMouseDown={onDown}
      >
        <span
          ref={againLabelRef}
          className="dm-swipe-grade-label dm-swipe-grade-label-again"
          style={{
            opacity: 0,
          }}
        >
          AGAIN
        </span>
        <span
          ref={goodLabelRef}
          className="dm-swipe-grade-label dm-swipe-grade-label-good"
          style={{
            opacity: 0,
          }}
        >
          GOOD
        </span>
        <div className={`dm-flipcard ${flipped ? "dm-flipped" : ""}`}>
          <div className="dm-flip-face dm-flip-front">
            <span className="dm-flip-word">{frontWord}</span>
            {!isFormCard && isDE2EN && romanizationEnabled && w.roman && (
              <span className="dm-flip-roman">{w.roman}</span>
            )}
            {!isFormCard && isDE2EN && showForms && <WordMeta w={w} />}
            <span className="dm-flip-hint">Tap to reveal</span>
          </div>
          <div className="dm-flip-face dm-flip-back">
            <span className="dm-flip-word">{backWord}</span>
            {!isFormCard && !isDE2EN && romanizationEnabled && w.roman && (
              <span className="dm-flip-roman">{w.roman}</span>
            )}
            {!isFormCard && !isDE2EN && showForms && <WordMeta w={w} />}
            <button
              className="dm-speak-btn"
              onClick={(e) => {
                e.stopPropagation();
                speak(speakWord);
              }}
            >
              <Volume2 size={16} />
              {isDE2EN || isFormCard ? ` ${speakWord}` : null}
            </button>
          </div>
        </div>
      </div>
      <div className="dm-flip-nav">
        <button className="dm-flip-nav-btn" onClick={goPrev} disabled={idx === 0} type="button">
          <ChevronLeft size={18} />
          {" Prev"}
        </button>
        {idx === deck.length - 1 ? (
          <button className="dm-flip-nav-btn dm-flip-nav-btn-quit" onClick={onExit} type="button">
            <X size={18} />
            {" Quit"}
          </button>
        ) : (
          <button className="dm-flip-nav-btn" onClick={goNext} type="button">
            {"Next "}
            <ChevronRight size={18} />
          </button>
        )}
      </div>
      {flipped && (
        <div className="dm-answer-row">
          <button className="dm-btn-wrong" onClick={() => next(false)}>
            <X size={18} />
            {" Again"}
          </button>
          <button className="dm-btn-correct" onClick={() => next(true)}>
            <Check size={18} />
            {" Good"}
          </button>
        </div>
      )}
    </div>
  );
}
