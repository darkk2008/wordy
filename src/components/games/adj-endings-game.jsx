/* components/games/adj-endings-game.jsx
 * Adjective endings game.
 */

import { useEffect, useRef, useState } from "react";
import { shuffle } from "../../core/srs-and-seed-data";
import { Loader2 } from "../icons/icons";
import {
  buildAdjEndingQuestions,
  buildAdjFallbackSentence,
  generateAdjSentence,
} from "../word-forms/word-forms";
import { GameDone, GameTopBar } from "./game-chrome";

export function AdjEndingsGame({
  words,
  onAnswer,
  onExit,
  onPlayAgain,
  apiKey,
  onOpenAI,
  onNext,
  nextLabel,
  showRing,
  progressOverride,
}) {
  const [deck] = useState(() => shuffle(words.flatMap(buildAdjEndingQuestions)).slice(0, 15));
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [sentence, setSentence] = useState(null);
  const [sentenceLoading, setSentenceLoading] = useState(false);
  const cacheRef = useRef({});
  const q = deck[idx];
  const done = idx >= deck.length;
  useEffect(() => {
    if (!q) return;
    const key = `${q.wordId}-${q.caseName}-${q.noun}`;
    const cached = cacheRef.current[key];
    if (cached) {
      setSentence(cached);
      setSentenceLoading(false);
      return;
    }
    let cancelled = false;
    setSentence(null);
    setSentenceLoading(!!apiKey);
    const fallback = () => buildAdjFallbackSentence(q.caseName, q.article, q.noun);
    if (!apiKey) {
      const s = fallback();
      cacheRef.current[key] = s;
      setSentence(s);
      return;
    }
    generateAdjSentence(apiKey, q)
      .then((s) => {
        if (cancelled) return;
        cacheRef.current[key] = s;
        setSentence(s);
      })
      .catch(() => {
        if (cancelled) return;
        const s = fallback();
        cacheRef.current[key] = s;
        setSentence(s);
      })
      .finally(() => {
        if (!cancelled) setSentenceLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [idx, q?.wordId, q?.caseName, q?.noun, apiKey]);
  if (!deck.length) {
    return (
      <div className="dm-game-play">
        <GameTopBar onExit={onExit} progress="0/0" title="Adjective Endings" />
        <div className="dm-empty">Add at least one adjective to this stack to drill endings.</div>
      </div>
    );
  }
  if (done)
    return (
      <GameDone
        onExit={onExit}
        onPlayAgain={onPlayAgain}
        label="Adjective Endings"
        score={`${score}/${deck.length}`}
        onNext={onNext}
        nextLabel={nextLabel}
        showRing={showRing}
      />
    );
  const choose = (opt) => {
    if (picked !== null) return;
    const correct = opt === q.correct;
    setPicked(opt);
    onAnswer(q.wordId, correct);
    if (correct) setScore((s) => s + 1);
    setTimeout(() => {
      setPicked(null);
      setIdx((i) => i + 1);
    }, 900);
  };
  return (
    <div className="dm-game-play">
      <GameTopBar
        onExit={onExit}
        progress={progressOverride || `${idx + 1}/${deck.length}`}
        title="Adjective Endings"
      />
      <div className="dm-case-pill-row">
        <span className="dm-case-pill">{q.caseName.toUpperCase()}</span>
      </div>
      {sentenceLoading ? (
        <div className="dm-case-sentence dm-case-sentence-loading">
          <Loader2 size={16} className="dm-autofill-spin" />
          {" Writing a sentence…"}
        </div>
      ) : (
        <div className="dm-case-sentence">
          {sentence?.before}
          {(() => {
            const a = q.article || "";
            if (!a) return a;
            return (sentence?.before || "").trim()
              ? a.charAt(0).toLowerCase() + a.slice(1)
              : a.charAt(0).toUpperCase() + a.slice(1);
          })()}
          {" … "}
          {q.noun}
          {sentence?.after}
        </div>
      )}
      {!apiKey && (
        <div className="dm-autofill-hint" onClick={onOpenAI}>
          Add a Groq API key in the AI Tutor for sentences written just for this word.
        </div>
      )}
      <div className="dm-options">
        {q.options.map((o) => {
          let cls = "dm-option dm-case-option";
          if (picked !== null) {
            if (o === q.correct) cls += " dm-option-correct";
            else if (o === picked) cls += " dm-option-wrong";
          }
          return (
            <button key={o} className={cls} onClick={() => choose(o)}>
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}
