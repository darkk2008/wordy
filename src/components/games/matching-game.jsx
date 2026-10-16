/* components/games/matching-game.jsx
 * Matching game.
 */

import { useEffect, useState } from "react";
import { shuffle } from "../../core/srs-and-seed-data";
import { GameDone, GameTopBar } from "./game-chrome";

export function MatchingGame({ words, onAnswer, onExit, onPlayAgain }) {
  const pool = shuffle(words).slice(0, Math.min(6, words.length));
  const [left] = useState(() => shuffle(pool));
  const [right] = useState(() => shuffle(pool));
  const [selL, setSelL] = useState(null);
  const [selR, setSelR] = useState(null);
  const [matched, setMatched] = useState([]);
  const [wrongFlash, setWrongFlash] = useState(null);
  useEffect(() => {
    if (selL && selR) {
      const correct = selL.id === selR.id;
      onAnswer(selL.id, correct);
      if (correct) {
        setMatched((m) => [...m, selL.id]);
        setSelL(null);
        setSelR(null);
      } else {
        setWrongFlash(selR.id);
        setTimeout(() => {
          setWrongFlash(null);
          setSelL(null);
          setSelR(null);
        }, 500);
      }
    }
  }, [selL, selR]);
  const done = matched.length === pool.length;
  if (done) return <GameDone onExit={onExit} onPlayAgain={onPlayAgain} label="Matching" />;
  return (
    <div className="dm-game-play">
      <GameTopBar onExit={onExit} progress={`${matched.length}/${pool.length}`} title="Matching" />
      <div className="dm-match-grid">
        <div className="dm-match-col">
          {left.map((w) => (
            <button
              key={w.id}
              disabled={matched.includes(w.id)}
              className={`dm-match-item ${selL?.id === w.id ? "dm-match-sel" : ""} ${matched.includes(w.id) ? "dm-match-done" : ""}`}
              onClick={() => setSelL(w)}
            >
              {w.de}
            </button>
          ))}
        </div>
        <div className="dm-match-col">
          {right.map((w) => (
            <button
              key={w.id}
              disabled={matched.includes(w.id)}
              className={`dm-match-item ${selR?.id === w.id ? "dm-match-sel" : ""} ${matched.includes(w.id) ? "dm-match-done" : ""} ${wrongFlash === w.id ? "dm-match-wrong" : ""}`}
              onClick={() => setSelR(w)}
            >
              {w.en}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
