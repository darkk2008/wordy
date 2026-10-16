/* components/games/word-rain-game.jsx
 * Word rain game.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { shuffle } from "../../core/srs-and-seed-data";
import { GameDone, GameTopBar } from "./game-chrome";

export function WordRainGame({
  words,
  onAnswer,
  onExit,
  onPlayAgain,
  direction,
  learningLanguage,
  nativeLanguage,
}) {
  const GAME_SECONDS = 60;
  const pickWord = (prevId) => {
    if (!words.length) return null;
    if (words.length === 1) return words[0];
    let w;
    do {
      w = words[Math.floor(Math.random() * words.length)];
    } while (w.id === prevId);
    return w;
  };
  const [current, setCurrent] = useState(() => pickWord(null));
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [streak, setStreak] = useState(0);
  const [status, setStatus] = useState(null);
  const [picked, setPicked] = useState(null);
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);
  const [done, setDone] = useState(false);
  const timerRef = useRef(null);
  const isDE2EN = direction !== "en2de";
  const w = current;
  const duration = Math.max(1.3, 5.5 - streak * 0.18);
  const promptWord = w ? (isDE2EN ? w.de : w.en) : "";
  const answerWord = w ? (isDE2EN ? w.en : w.de) : "";
  const options = useMemo(() => {
    if (!w) return [];
    const pick = (x) => (isDE2EN ? x.en : x.de);
    let others = shuffle(words.filter((x) => x.id !== w.id))
      .slice(0, 2)
      .map(pick);
    return shuffle([answerWord, ...others]);
  }, [round]);
  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft((tl) => {
        if (tl <= 1) {
          clearInterval(t);
          setDone(true);
          return 0;
        }
        return tl - 1;
      });
    }, 1e3);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (done || !w) return;
    setStatus(null);
    setPicked(null);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onAnswer(w.id, false);
      setAttempts((a) => a + 1);
      setStreak(0);
      setStatus("wrong");
      setTimeout(() => {
        setCurrent((c) => pickWord(c ? c.id : null));
        setRound((r) => r + 1);
      }, 450);
    }, duration * 1e3);
    return () => clearTimeout(timerRef.current);
  }, [round, done]);
  if (done)
    return (
      <GameDone
        onExit={onExit}
        onPlayAgain={onPlayAgain}
        label="Word Rain"
        score={`${score}/${attempts}`}
      />
    );
  const choose = (opt) => {
    if (status) return;
    clearTimeout(timerRef.current);
    const correct = opt === answerWord;
    onAnswer(w.id, correct);
    setAttempts((a) => a + 1);
    if (correct) {
      setScore((s) => s + 1);
      setStreak((s) => s + 1);
    } else {
      setStreak(0);
    }
    setPicked(opt);
    setStatus(correct ? "correct" : "wrong");
    setTimeout(() => {
      setCurrent((c) => pickWord(c ? c.id : null));
      setRound((r) => r + 1);
    }, 450);
  };
  return (
    <div className="dm-game-play">
      <GameTopBar
        onExit={onExit}
        progress={`${timeLeft}s`}
        title="Word Rain"
        direction={direction}
        learningLanguage={learningLanguage}
        nativeLanguage={nativeLanguage}
      />
      <div className="dm-rain-stage">
        <div
          key={round}
          className={`dm-rain-word ${status === "correct" ? "dm-rain-correct" : status === "wrong" ? "dm-rain-wrong" : ""}`}
          style={{
            animationDuration: `${duration}s`,
          }}
        >
          {promptWord}
        </div>
      </div>
      <div className="dm-rain-options dm-options">
        {options.map((o, i) => {
          let cls = "dm-option";
          if (status) {
            if (o === answerWord) cls += " dm-option-correct";
            else if (o === picked) cls += " dm-option-wrong";
          }
          return (
            <button key={i} className={cls} onClick={() => choose(o)}>
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}
