/* components/games/word-forms-game.jsx
 * Word forms game.
 */

import { useState } from "react";
import { shuffle } from "../../core/srs-and-seed-data";
import { FormSpeakBtn } from "../common/common";
import { Input } from "../common/Input";
import { Check } from "../icons/icons";
import { GameDone, GameTopBar } from "./game-chrome";
import { buildFormQuestions } from "./write-game";

export function WordFormsGame({ words, onAnswer, onExit, onPlayAgain }) {
  const [deck] = useState(() => shuffle(words.flatMap(buildFormQuestions)).slice(0, 20));
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [val, setVal] = useState("");
  const [status, setStatus] = useState(null);
  const q = deck[idx];
  const done = idx >= deck.length;
  if (!deck.length) {
    return (
      <div className="dm-game-play">
        <GameTopBar onExit={onExit} progress="0/0" title="Word Forms" />
        <div className="dm-empty">None of the words in this stack have saved forms yet.</div>
      </div>
    );
  }
  if (done)
    return (
      <GameDone
        onExit={onExit}
        onPlayAgain={onPlayAgain}
        label="Word Forms"
        score={`${score}/${deck.length}`}
      />
    );
  const check = () => {
    const correct = val.trim().toLowerCase() === q.answer.trim().toLowerCase();
    setStatus(correct ? "correct" : "wrong");
    onAnswer(q.wordId, correct);
    if (correct) setScore((s) => s + 1);
    setTimeout(() => {
      setVal("");
      setStatus(null);
      setIdx((i) => i + 1);
    }, 1200);
  };
  return (
    <div className="dm-game-play">
      <GameTopBar onExit={onExit} progress={`${idx + 1}/${deck.length}`} title="Word Forms" />
      <div className="dm-write-hint">{q.prompt}</div>
      <Input
        className={`dm-input dm-write-input ${status === "correct" ? "dm-ok" : status === "wrong" ? "dm-bad" : ""}`}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="Type the form…"
        onKeyDown={(e) => e.key === "Enter" && check()}
        autoFocus
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
        onClick={check}
        disabled={!val.trim() || status}
      >
        <Check size={16} />
        {" Check"}
      </button>
    </div>
  );
}
