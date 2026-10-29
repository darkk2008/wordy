/* components/games/multiple-choice-game.jsx
 * Multiple choice game.
 */

import { useEffect, useRef, useState } from "react";
import { speak } from "../../core/speech-voices";
import { shuffle } from "../../core/srs-and-seed-data";
import { Volume2 } from "../icons/icons";
import { GameDone, GameTopBar } from "./game-chrome";
import { buildFormQuestions } from "./write-game";

function buildMCQuestion(words, w) {
  const others = shuffle(words.filter((x) => x.id !== w.id)).slice(0, 3);
  const options = shuffle([w, ...others]);
  return {
    kind: "vocab",
    word: w,
    options,
  };
}
function buildFormMCQuestions(words, w) {
  const own = buildFormQuestions(w);
  if (!own.length) return [];
  const picks = shuffle(own).slice(0, 2);
  const pool = [
    ...new Set(
      words
        .filter((x) => x.id !== w.id)
        .flatMap(buildFormQuestions)
        .map((r) => r.answer)
        .filter(Boolean)
    ),
  ];
  return picks.map((q) => {
    let distractorPool = pool.filter((a) => a !== q.answer);
    if (distractorPool.length < 3) {
      const sameWordAlt = own.map((r) => r.answer).filter((a) => a !== q.answer);
      distractorPool = [...new Set([...distractorPool, ...sameWordAlt])];
    }
    const distractors = shuffle(distractorPool).slice(0, 3);
    const options = shuffle([q.answer, ...distractors]);
    return {
      kind: "form",
      wordId: w.id,
      prompt: q.prompt,
      badge: q.badge,
      correct: q.answer,
      options,
    };
  });
}
export function MultipleChoiceGame({
  words,
  pool,
  onAnswer,
  onExit,
  onPlayAgain,
  timed,
  direction,
  mixForms,
  onNext,
  nextLabel,
  showRing,
  progressOverride,
  learningLanguage,
  nativeLanguage,
}) {
  const distractorPool = pool && pool.length ? pool : words;
  const [deck] = useState(() => shuffle(words).map((w) => buildMCQuestion(distractorPool, w)));
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(8);
  const timerRef = useRef(null);
  const isDE2EN = direction !== "en2de";
  const done = idx >= deck.length;
  const q = deck[idx];
  const isForm = q && q.kind === "form";
  useEffect(() => {
    if (!timed || done || picked !== null) return;
    setTimeLeft(8);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          choose(null);
          return 0;
        }
        return t - 1;
      });
    }, 1e3);
    return () => clearInterval(timerRef.current);
  }, [idx, done]);
  const correctValue = isForm ? q.correct : q && q.word.id;
  const choose = (opt) => {
    if (picked !== null) return;
    clearInterval(timerRef.current);
    const optKey = isForm ? opt : opt ? opt.id : null;
    const correct = opt !== null && optKey === correctValue;
    setPicked(opt === null ? "timeout" : opt);
    onAnswer(isForm ? q.wordId : q.word.id, !!correct);
    if (correct) setScore((s) => s + 1);
    setTimeout(() => {
      setPicked(null);
      setIdx((i) => i + 1);
    }, 700);
  };
  if (done)
    return (
      <GameDone
        onExit={onExit}
        onPlayAgain={onPlayAgain}
        label={timed ? "Sprint" : "Multiple Choice"}
        score={`${score}/${deck.length}`}
        onNext={onNext}
        nextLabel={nextLabel}
        showRing={showRing}
      />
    );
  return (
    <div className="dm-game-play">
      <GameTopBar
        onExit={onExit}
        progress={progressOverride || `${idx + 1}/${deck.length}`}
        title={timed ? "Sprint" : "Multiple Choice"}
        direction={direction}
        learningLanguage={learningLanguage}
        nativeLanguage={nativeLanguage}
      />
      {timed && (
        <div className="dm-timer-bar">
          <div
            className="dm-timer-fill"
            style={{
              width: `${(timeLeft / 8) * 100}%`,
            }}
          />
        </div>
      )}
      {isForm ? (
        <>
          {q.badge && <div className="dm-mix-badge">{q.badge}</div>}
          <div className="dm-write-hint">{q.prompt}</div>
        </>
      ) : (
        <div className="dm-quiz-word">
          {isDE2EN ? q.word.de : q.word.en}
          {isDE2EN && (
            <button className="dm-speak-btn dm-speak-inline" onClick={() => speak(q.word.de)}>
              <Volume2 size={16} />
            </button>
          )}
        </div>
      )}
      <div className="dm-options">
        {q.options.map((o) => {
          const key = isForm ? o : o.id;
          let cls = "dm-option";
          if (picked !== null) {
            if (key === correctValue) cls += " dm-option-correct";
            else if (picked !== "timeout" && (isForm ? picked === o : picked.id === o.id))
              cls += " dm-option-wrong";
          }
          return (
            <button key={key} className={cls} onClick={() => choose(o)}>
              {isForm ? o : isDE2EN ? o.en : o.de}
            </button>
          );
        })}
      </div>
    </div>
  );
}
