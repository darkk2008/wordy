/* components/games/speed-forms-game.jsx
 * Speed forms game.
 */

import { useEffect, useRef, useState } from "react";
import { shuffle } from "../../core/srs-and-seed-data";
import { FormSpeakBtn } from "../common/common";
import { Input } from "../common/Input";
import { Check } from "../icons/icons";
import { GameDone, GameTopBar } from "./game-chrome";
import { buildFormQuestions } from "./write-game";

export function SpeedFormsGame({
  words,
  onAnswer,
  onExit,
  onPlayAgain,
  onNext,
  nextLabel,
  showRing,
  progressOverride,
}) {
  const [deck] = useState(() => shuffle(words.flatMap(buildFormQuestions)).slice(0, 20));
  const [idx, setIdx] = useState(0);
  const [val, setVal] = useState("");
  const [status, setStatus] = useState(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const timerRef = useRef(null);
  const q = deck[idx];
  const done = idx >= deck.length;
  useEffect(() => {
    if (done || status) return;
    setTimeLeft(10);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          check(true);
          return 0;
        }
        return t - 1;
      });
    }, 1e3);
    return () => clearInterval(timerRef.current);
  }, [idx, done]);
  if (!deck.length) {
    return (
      <div className="dm-game-play">
        <GameTopBar onExit={onExit} progress="0/0" title="Speed Forms" />
        <div className="dm-empty">None of the words in this stack have saved forms yet.</div>
      </div>
    );
  }
  if (done)
    return (
      <GameDone
        onExit={onExit}
        onPlayAgain={onPlayAgain}
        label="Speed Forms"
        score={`${score}/${deck.length}`}
        onNext={onNext}
        nextLabel={nextLabel}
        showRing={showRing}
      />
    );
  const check = (timedOut) => {
    if (status) return;
    clearInterval(timerRef.current);
    const correct = !timedOut && val.trim().toLowerCase() === q.answer.trim().toLowerCase();
    setStatus(correct ? "correct" : "wrong");
    onAnswer(q.wordId, correct);
    if (correct) setScore((s) => s + 1);
    setTimeout(() => {
      setVal("");
      setStatus(null);
      setIdx((i) => i + 1);
    }, 900);
  };
  return (
    <div className="dm-game-play">
      <GameTopBar
        onExit={onExit}
        progress={progressOverride || `${idx + 1}/${deck.length}`}
        title="Speed Forms"
      />
      <div className="dm-timer-bar">
        <div
          className="dm-timer-fill"
          style={{
            width: `${(timeLeft / 10) * 100}%`,
          }}
        />
      </div>
      {q.badge && <div className="dm-mix-badge">{q.badge}</div>}
      <div className="dm-write-hint">{q.prompt}</div>
      <Input
        className={`dm-input dm-write-input ${status === "correct" ? "dm-ok" : status === "wrong" ? "dm-bad" : ""}`}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="Type the form…"
        onKeyDown={(e) => e.key === "Enter" && check(false)}
        autoFocus
        disabled={!!status}
      />
      {status === "wrong" && (
        <div className="dm-write-answer">
          {"Correct: "}
          <b>{q.answer}</b>
          <FormSpeakBtn text={q.answer} />
        </div>
      )}
      <button
        className="dm-btn-primary dm-write-submit"
        onClick={() => check(false)}
        disabled={!val.trim() || status}
      >
        <Check size={16} />
        {" Check"}
      </button>
    </div>
  );
}
