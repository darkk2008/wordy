/* components/games/cases-game.jsx
 * Cases (articles/declension) game.
 */

import { useState } from "react";
import { speak } from "../../core/speech-voices";
import { shuffle } from "../../core/srs-and-seed-data";
import { Volume2 } from "../icons/icons";
import { computeNounForms } from "../word-forms/word-forms";
import { GameDone, GameTopBar } from "./game-chrome";

export const CASE_INFO = {
  Nominativ: {
    hint: "the subject — who or what is doing the action",
    templates: [
      "{art} {noun} ist hier.",
      "{art} {noun} sieht gut aus.",
      "{art} {noun} steht auf dem Tisch.",
    ],
  },
  Akkusativ: {
    hint: "the direct object — who/what is affected",
    templates: ["Ich sehe {art} {noun}.", "Ich brauche {art} {noun}.", "Wir kaufen {art} {noun}."],
  },
  Dativ: {
    hint: "the indirect object — to/for whom something happens",
    templates: ["Ich helfe {art} {noun}.", "Ich danke {art} {noun}.", "Das gehört {art} {noun}."],
  },
  Genitiv: {
    hint: "shows possession — whose it is",
    templates: [
      "Das ist die Farbe {art} {noun}.",
      "Wegen {art} {noun} bin ich spät.",
      "Das ist der Preis {art} {noun}.",
    ],
  },
};
const CASE_ARTICLE_POOL = ["der", "die", "das", "den", "dem", "des"];
export function isRealNoun(w) {
  return !!(w && w.type === "noun" && w.article && /^[A-Z\xC4\xD6\xDC]/.test(w.de || ""));
}
export function isRealVerb(w) {
  return !!(w && w.type === "verb" && w.de);
}
function buildCaseQuestions(w) {
  if (!isRealNoun(w)) return [];
  const forms = computeNounForms(w).singular;
  const qs = [];
  forms.forEach((f) => {
    const [correctArt, ...rest] = f.value.split(" ");
    const nounPart = rest.join(" ");
    const info = CASE_INFO[f.label];
    const template = info.templates[Math.floor(Math.random() * info.templates.length)];
    const sentence = template.replace("{art}", "…").replace("{noun}", nounPart);
    const distractors = shuffle(CASE_ARTICLE_POOL.filter((a) => a !== correctArt)).slice(0, 3);
    const options = shuffle([correctArt, ...distractors]);
    qs.push({
      wordId: w.id,
      caseName: f.label,
      hint: info.hint,
      sentence,
      correctArt,
      baseArticle: w.article,
      noun: w.de,
      options,
    });
  });
  return qs;
}
export function CasesGame({
  words,
  onAnswer,
  onExit,
  onPlayAgain,
  onNext,
  nextLabel,
  showRing,
  progressOverride,
}) {
  const [deck] = useState(() => shuffle(words.flatMap(buildCaseQuestions)).slice(0, 15));
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const q = deck[idx];
  const done = idx >= deck.length;
  if (!deck.length) {
    return (
      <div className="dm-game-play">
        <GameTopBar onExit={onExit} progress="0/0" title="Cases Drill" />
        <div className="dm-empty">
          None of the words in this stack are nouns with a known article yet.
        </div>
      </div>
    );
  }
  if (done)
    return (
      <GameDone
        onExit={onExit}
        onPlayAgain={onPlayAgain}
        label="Cases Drill"
        score={`${score}/${deck.length}`}
        onNext={onNext}
        nextLabel={nextLabel}
        showRing={showRing}
      />
    );
  const choose = (opt) => {
    if (picked !== null) return;
    const correct = opt === q.correctArt;
    setPicked(opt);
    onAnswer(q.wordId, correct);
    if (correct) setScore((s) => s + 1);
    setTimeout(() => {
      setPicked(null);
      setIdx((i) => i + 1);
    }, 900);
  };
  const parts = q.sentence.split("…");
  return (
    <div className="dm-game-play">
      <GameTopBar
        onExit={onExit}
        progress={progressOverride || `${idx + 1}/${deck.length}`}
        title="Cases Drill"
      />
      <div className="dm-case-pill-row">
        <span className="dm-case-pill">{q.caseName.toUpperCase()}</span>
      </div>
      <div className="dm-case-hint">{q.hint}</div>
      <div className="dm-case-sentence">
        {parts[0]}
        <span
          className={`dm-case-blank ${picked !== null ? (picked === q.correctArt ? "dm-case-blank-ok" : "dm-case-blank-bad") : ""}`}
        >
          {picked !== null ? picked : "…"}
        </span>
        {parts[1]}
      </div>
      <div className="dm-case-word-chip">
        <span className="dm-case-word-noun">{q.noun}</span>
        <button
          className="dm-speak-btn dm-speak-inline"
          onClick={() => speak(`${q.baseArticle} ${q.noun}`)}
        >
          <Volume2 size={16} />
        </button>
      </div>
      <div className="dm-options">
        {q.options.map((o) => {
          let cls = "dm-option dm-case-option";
          if (picked !== null) {
            if (o === q.correctArt) cls += " dm-option-correct";
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
