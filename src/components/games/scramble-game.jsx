/* components/games/scramble-game.jsx
 * Letter scramble game.
 */

import { useEffect, useState } from "react";
import { speak } from "../../core/speech-voices";
import { shuffle } from "../../core/srs-and-seed-data";
import { Check, RotateCcw, Volume2 } from "../icons/icons";
import { GameDone, GameTopBar } from "./game-chrome";

function scrambleWord(word) {
  const letters = word.replace(/\s/g, "").split("");
  let s = shuffle(letters);
  if (s.join("") === letters.join("") && s.length > 1) {
    [s[0], s[1]] = [s[1], s[0]];
  }
  return s;
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
  const [deck] = useState(() => shuffle(words));
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const w = deck[idx];
  const target = (w?.de || "").replace(/\s/g, "");
  const [pool, setPool] = useState(() =>
    scrambleWord(target).map((l, i) => ({
      l,
      i,
      used: false,
    }))
  );
  const [built, setBuilt] = useState([]);
  const [status, setStatus] = useState(null);
  useEffect(() => {
    if (!w) return;
    const t = (w.de || "").replace(/\s/g, "");
    setPool(
      scrambleWord(t).map((l, i) => ({
        l,
        i,
        used: false,
      }))
    );
    setBuilt([]);
    setStatus(null);
  }, [idx]);
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
  const pick = (item) => {
    if (item.used || status) return;
    setPool((p) =>
      p.map((x) =>
        x.i === item.i
          ? {
              ...x,
              used: true,
            }
          : x
      )
    );
    setBuilt((b) => [...b, item]);
  };
  const removeLast = () => {
    if (status || built.length === 0) return;
    const last = built[built.length - 1];
    setPool((p) =>
      p.map((x) =>
        x.i === last.i
          ? {
              ...x,
              used: false,
            }
          : x
      )
    );
    setBuilt((b) => b.slice(0, -1));
  };
  const check = () => {
    const guess = built.map((x) => x.l).join("");
    const correct = guess.toLowerCase() === target.toLowerCase();
    setStatus(correct ? "correct" : "wrong");
    onAnswer(w.id, correct);
    if (correct) setScore((s) => s + 1);
    setTimeout(() => setIdx((i) => i + 1), 1e3);
  };
  return (
    <div className="dm-game-play">
      <GameTopBar
        onExit={onExit}
        progress={progressOverride || `${idx + 1}/${deck.length}`}
        title="Word Scramble"
      />
      <div className="dm-scramble-hint">
        {w.en}{" "}
        <button className="dm-speak-btn dm-speak-inline" onClick={() => speak(w.de)}>
          <Volume2 size={15} />
        </button>
      </div>
      <div
        className={`dm-scramble-built ${status === "correct" ? "dm-ok" : status === "wrong" ? "dm-bad" : ""}`}
      >
        {built.length === 0 && <span className="dm-flip-hint">Tap letters below</span>}
        {built.map((b) => (
          <span key={b.i} className="dm-letter-chip" onClick={removeLast}>
            {b.l}
          </span>
        ))}
      </div>
      <div className="dm-scramble-pool">
        {pool.map((item) => (
          <button
            key={item.i}
            className={`dm-letter-tile ${item.used ? "dm-letter-used" : ""}`}
            onClick={() => pick(item)}
            disabled={item.used}
          >
            {item.l}
          </button>
        ))}
      </div>
      <div className="dm-answer-row">
        <button
          className="dm-btn-secondary"
          onClick={removeLast}
          disabled={built.length === 0 || status}
        >
          <RotateCcw size={16} />
          {" Undo"}
        </button>
        <button
          className="dm-btn-primary"
          onClick={check}
          disabled={built.length !== pool.length || status}
        >
          <Check size={16} />
          {" Check"}
        </button>
      </div>
    </div>
  );
}
