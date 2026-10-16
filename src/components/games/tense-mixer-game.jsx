/* components/games/tense-mixer-game.jsx
 * Tense mixer game.
 */

import { useState } from "react";
import { speak } from "../../core/speech-voices";
import { shuffle } from "../../core/srs-and-seed-data";
import { Volume2 } from "../icons/icons";
import { buildTenseMixerQuestions } from "../word-forms/word-forms";
import { GameDone, GameTopBar } from "./game-chrome";

export function TenseMixerGame({ words, onAnswer, onExit, onPlayAgain }) {
  const [deck] = useState(() => shuffle(words.flatMap(buildTenseMixerQuestions)).slice(0, 18));
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const q = deck[idx];
  const done = idx >= deck.length;
  if (!deck.length) {
    return (
      <div className="dm-game-play">
        <GameTopBar onExit={onExit} progress="0/0" title="Verb Tense Mixer" />
        <div className="dm-empty">Add at least one verb to this stack to mix tenses.</div>
      </div>
    );
  }
  if (done)
    return (
      <GameDone
        onExit={onExit}
        onPlayAgain={onPlayAgain}
        label="Verb Tense Mixer"
        score={`${score}/${deck.length}`}
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
      <GameTopBar onExit={onExit} progress={`${idx + 1}/${deck.length}`} title="Verb Tense Mixer" />
      <div className="dm-case-pill-row">
        <span className="dm-case-pill">{q.tenseLabel.toUpperCase()}</span>
      </div>
      <div className="dm-case-hint">Pick the correct form for “{q.pronoun}”</div>
      <div className="dm-case-word-chip">
        <span className="dm-case-word-noun">{q.verb}</span>
        <button className="dm-speak-btn dm-speak-inline" onClick={() => speak(q.verb)}>
          <Volume2 size={16} />
        </button>
      </div>
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
