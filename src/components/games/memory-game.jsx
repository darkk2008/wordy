/* components/games/memory-game.jsx
 * Memory (pairs) game.
 */

import { useRef, useState } from "react";
import { shuffle } from "../../core/srs-and-seed-data";
import { CardsIcon } from "../icons/icons";
import { GameDone, GameTopBar } from "./game-chrome";

export function MemoryGame({ words, onAnswer, onExit, onPlayAgain }) {
  const [cards] = useState(() => {
    const pool = shuffle(words).slice(0, Math.min(6, words.length));
    return shuffle(
      pool.flatMap((w) => [
        {
          key: `${w.id}-de`,
          wordId: w.id,
          matchKey: w.id,
          text: w.de,
        },
        {
          key: `${w.id}-en`,
          wordId: w.id,
          matchKey: w.id,
          text: w.en,
        },
      ])
    );
  });
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [wrongPair, setWrongPair] = useState([]);
  const [correctPair, setCorrectPair] = useState([]);
  const busyRef = useRef(false);
  const pairCount = cards.length / 2;
  const flipCard = (card) => {
    if (busyRef.current) return;
    if (flipped.includes(card.key) || matched.includes(card.key)) return;
    const next = [...flipped, card.key];
    setFlipped(next);
    if (next.length === 2) {
      busyRef.current = true;
      const a = cards.find((c) => c.key === next[0]);
      const b = cards.find((c) => c.key === next[1]);
      const isMatch = a.matchKey === b.matchKey;
      onAnswer(a.wordId, isMatch);
      if (isMatch) {
        setCorrectPair(next);
        setTimeout(() => {
          setMatched((m) => [...m, a.key, b.key]);
          setCorrectPair([]);
          setFlipped([]);
          busyRef.current = false;
        }, 450);
      } else {
        setWrongPair(next);
        setTimeout(() => {
          setWrongPair([]);
          setFlipped([]);
          busyRef.current = false;
        }, 750);
      }
    }
  };
  const done = matched.length === cards.length;
  if (done)
    return (
      <GameDone
        onExit={onExit}
        onPlayAgain={onPlayAgain}
        label="Memory"
        score={`${pairCount}/${pairCount}`}
      />
    );
  return (
    <div className="dm-game-play">
      <GameTopBar onExit={onExit} progress={`${matched.length / 2}/${pairCount}`} title="Memory" />
      <div className="dm-memory-grid">
        {cards.map((c) => {
          const isUp = flipped.includes(c.key) || matched.includes(c.key);
          const isDone = matched.includes(c.key);
          const isWrong = wrongPair.includes(c.key);
          const isCorrect = correctPair.includes(c.key);
          return (
            <button
              key={c.key}
              className={`dm-memory-card ${isUp ? "dm-memory-up" : ""} ${isDone ? "dm-memory-matched" : ""} ${isWrong ? "dm-memory-wrong" : ""} ${isCorrect ? "dm-memory-correct" : ""}`}
              onClick={() => flipCard(c)}
            >
              <div className="dm-memory-inner">
                <div className="dm-memory-face dm-memory-back">
                  <CardsIcon size={20} />
                </div>
                <div className="dm-memory-face dm-memory-front">{c.text}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
