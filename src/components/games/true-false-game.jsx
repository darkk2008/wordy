/* components/games/true-false-game.jsx
 * True/False game.
 */

import { useState } from "react";
import { shuffle } from "../../core/srs-and-seed-data";
import { Check, X } from "../icons/icons";
import { GameDone, GameTopBar } from "./game-chrome";

function buildTFQuestion(pool, word, direction) {
  const isDE2EN = direction !== "en2de";
  const showCorrect = Math.random() < 0.5;
  let shown;
  if (showCorrect) {
    shown = isDE2EN ? word.en : word.de;
  } else {
    const distractorPool = pool.filter(
      (w) => w.id !== word.id && (isDE2EN ? w.en !== word.en : w.de !== word.de)
    );
    const distractor = distractorPool.length
      ? distractorPool[Math.floor(Math.random() * distractorPool.length)]
      : word;
    shown = isDE2EN ? distractor.en : distractor.de;
  }
  return {
    word,
    shown,
    isCorrect: showCorrect,
  };
}
export function TrueFalseGame({
  words,
  pool,
  onAnswer,
  onExit,
  onPlayAgain,
  direction,
  onNext,
  nextLabel,
  showRing,
  progressOverride,
  learningLanguage,
  nativeLanguage,
}) {
  const distractorPool = pool && pool.length ? pool : words;
  const [deck] = useState(() =>
    shuffle(words).map((w) => buildTFQuestion(distractorPool, w, direction))
  );
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const isDE2EN = direction !== "en2de";
  const done = idx >= deck.length;
  const q = deck[idx];
  const choose = (answer) => {
    if (picked !== null) return;
    const correct = answer === q.isCorrect;
    setPicked(answer);
    onAnswer(q.word.id, correct);
    if (correct) setScore((s) => s + 1);
    setTimeout(() => {
      setPicked(null);
      setIdx((i) => i + 1);
    }, 600);
  };
  if (done)
    return (
      <GameDone
        onExit={onExit}
        onPlayAgain={onPlayAgain}
        label="True or False"
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
        title="True or False"
        direction={direction}
        learningLanguage={learningLanguage}
        nativeLanguage={nativeLanguage}
      />
      <div className="dm-tf-card">
        <span className="dm-tf-word">{isDE2EN ? q.word.de : q.word.en}</span>
        <span className="dm-tf-eq">=</span>
        <span className="dm-tf-translation">{q.shown}</span>
      </div>
      <div className="dm-tf-buttons">
        <button
          type="button"
          className={`dm-tf-btn dm-tf-false ${picked !== null ? (q.isCorrect === false ? "dm-tf-btn-correct" : picked === false ? "dm-tf-btn-wrong" : "dm-tf-btn-dim") : ""}`}
          disabled={picked !== null}
          onClick={() => choose(false)}
        >
          <X size={15} />
          False
        </button>
        <button
          type="button"
          className={`dm-tf-btn dm-tf-true ${picked !== null ? (q.isCorrect === true ? "dm-tf-btn-correct" : picked === true ? "dm-tf-btn-wrong" : "dm-tf-btn-dim") : ""}`}
          disabled={picked !== null}
          onClick={() => choose(true)}
        >
          <Check size={15} />
          True
        </button>
      </div>
    </div>
  );
}
