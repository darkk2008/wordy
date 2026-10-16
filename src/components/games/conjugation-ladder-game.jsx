/* components/games/conjugation-ladder-game.jsx
 * Conjugation ladder game.
 */

import { useMemo, useState } from "react";
import { speak } from "../../core/speech-voices";
import { shuffle } from "../../core/srs-and-seed-data";
import { Volume2 } from "../icons/icons";
import { computeVerbForms } from "../word-forms/word-forms";
import { isRealVerb } from "./cases-game";
import { GameDone, GameTopBar } from "./game-chrome";

export function ConjugationLadderGame({ words, onAnswer, onExit, onPlayAgain }) {
  const [verbs] = useState(() => {
    const pool = words.filter(isRealVerb);
    return shuffle(pool).slice(0, Math.min(6, pool.length));
  });
  const [verbIdx, setVerbIdx] = useState(0);
  const [personIdx, setPersonIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [slipped, setSlipped] = useState(false);
  const [climbed, setClimbed] = useState(0);
  if (!verbs.length) {
    return (
      <div className="dm-game-play">
        <GameTopBar onExit={onExit} progress="0/0" title="Conjugation Ladder" />
        <div className="dm-empty">Add at least 4 verbs to this stack to climb the ladder.</div>
      </div>
    );
  }
  const totalRungs = verbs.length * 6;
  const done = verbIdx >= verbs.length;
  if (done)
    return (
      <GameDone
        onExit={onExit}
        onPlayAgain={onPlayAgain}
        label="Conjugation Ladder"
        score={`${climbed}/${totalRungs}`}
      />
    );
  const verb = verbs[verbIdx];
  const forms = computeVerbForms(verb).praesens;
  const order = useMemo(() => shuffle([0, 1, 2, 3, 4, 5]), [verbIdx]);
  const person = forms[order[personIdx]];
  const options = useMemo(() => {
    const seen = new Set([person.value]);
    const distractors = [];
    for (const r of shuffle(forms.filter((_, i) => i !== order[personIdx]))) {
      if (seen.has(r.value)) continue;
      seen.add(r.value);
      distractors.push(r.value);
      if (distractors.length === 3) break;
    }
    return shuffle([person.value, ...distractors]);
  }, [verbIdx, personIdx]);
  const choose = (opt) => {
    if (picked !== null) return;
    const correct = opt === person.value;
    setPicked(opt);
    onAnswer(verb.id, correct);
    if (correct) {
      setClimbed((c) => c + 1);
      setTimeout(() => {
        setPicked(null);
        if (personIdx + 1 >= 6) {
          setVerbIdx((v) => v + 1);
          setPersonIdx(0);
        } else {
          setPersonIdx((p) => p + 1);
        }
      }, 550);
    } else {
      setSlipped(true);
      setTimeout(() => {
        setPicked(null);
        setSlipped(false);
        setPersonIdx(0);
      }, 900);
    }
  };
  return (
    <div className="dm-game-play">
      <GameTopBar
        onExit={onExit}
        progress={`${climbed}/${totalRungs}`}
        title="Conjugation Ladder"
      />
      <div className="dm-ladder-verb-row">
        <span className="dm-ladder-verb">{verb.de}</span>
        <button className="dm-speak-btn dm-speak-inline" onClick={() => speak(verb.de)}>
          <Volume2 size={16} />
        </button>
      </div>
      {slipped && <div className="dm-ladder-slip">Slipped — back to the bottom of this verb.</div>}
      <div className="dm-ladder-body">
        <div className="dm-ladder-track">
          {Array.from({
            length: 6,
          }).map((_, i) => (
            <div
              key={i}
              className={`dm-ladder-rung ${i < personIdx ? "dm-ladder-rung-done" : ""} ${i === personIdx ? "dm-ladder-rung-current" : ""}`}
            />
          ))}
        </div>
        <div className="dm-ladder-qcol">
          <div className="dm-ladder-pronoun">{person.label}</div>
          <div className="dm-options">
            {options.map((o) => {
              let cls = "dm-option dm-ladder-option";
              if (picked !== null) {
                if (o === person.value) cls += " dm-option-correct";
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
      </div>
    </div>
  );
}
