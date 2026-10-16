/* components/games/daily-mix-game.jsx
 * Daily mix game.
 */

import { useState } from "react";
import { ARTICLE_SETS } from "../../core/constants";
import { currentLearningLangCode, speak } from "../../core/speech-voices";
import { shuffle } from "../../core/srs-and-seed-data";
import { Volume2 } from "../icons/icons";
import { stripArticle } from "../word-forms/word-forms";
import { GameDone, GameTopBar } from "./game-chrome";

function buildMixQuestion(w, words) {
  const pool = words.filter((x) => x.id !== w.id);
  const kinds = ["translate", "listening"];
  if (
    w.type === "noun" &&
    w.article &&
    ARTICLE_SETS[currentLearningLangCode] &&
    ARTICLE_SETS[currentLearningLangCode].includes(w.article)
  )
    kinds.push("article");
  if (w.type === "verb" || w.type === "adj" || (w.type === "noun" && w.plural)) kinds.push("form");
  const kind = kinds[Math.floor(Math.random() * kinds.length)];
  if (kind === "article") {
    return {
      kind,
      wordId: w.id,
      prompt: stripArticle(w.de),
      sub: "Pick the article",
      options: shuffle(ARTICLE_SETS[currentLearningLangCode] || ["der", "die", "das"]),
      correct: w.article,
    };
  }
  if (kind === "form") {
    let correct, sub, siblingPool;
    if (w.type === "verb") {
      sub = "Partizip II";
      correct = w.partizipII || `ge${w.de.replace(/en?$/, "")}t`;
      siblingPool = pool
        .filter((x) => x.type === "verb")
        .map((x) => x.partizipII || `ge${(x.de || "").replace(/en?$/, "")}t`);
    } else if (w.type === "adj") {
      sub = "Komparativ";
      correct = w.komparativ || `${w.de}er`;
      siblingPool = pool.filter((x) => x.type === "adj").map((x) => x.komparativ || `${x.de}er`);
    } else {
      sub = "Plural";
      correct = w.plural || `${stripArticle(w.de)}e`;
      siblingPool = pool
        .filter((x) => x.type === "noun")
        .map((x) => x.plural || `${stripArticle(x.de)}e`);
    }
    const distractors = shuffle(siblingPool.filter(Boolean)).slice(0, 3);
    return {
      kind,
      wordId: w.id,
      prompt: w.de,
      sub,
      options: shuffle([correct, ...distractors]),
      correct,
    };
  }
  if (kind === "listening") {
    const others = shuffle(pool)
      .slice(0, 3)
      .map((x) => x.en);
    return {
      kind,
      wordId: w.id,
      prompt: null,
      sub: "Listen & choose",
      options: shuffle([w.en, ...others]),
      correct: w.en,
      speakText: w.de,
    };
  }
  const others = shuffle(pool)
    .slice(0, 3)
    .map((x) => x.en);
  return {
    kind,
    wordId: w.id,
    prompt: w.de,
    sub: "Translate",
    options: shuffle([w.en, ...others]),
    correct: w.en,
  };
}
export function DailyMixGame({ words, onAnswer, onExit, onPlayAgain, title }) {
  const gameTitle = title || "Daily Mix";
  const [deck] = useState(() =>
    shuffle(words)
      .slice(0, Math.min(12, words.length))
      .map((w) => buildMixQuestion(w, words))
  );
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const q = deck[idx];
  const done = idx >= deck.length;
  if (done)
    return (
      <GameDone
        onExit={onExit}
        onPlayAgain={onPlayAgain}
        label={gameTitle}
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
    }, 700);
  };
  return (
    <div className="dm-game-play">
      <GameTopBar onExit={onExit} progress={`${idx + 1}/${deck.length}`} title={gameTitle} />
      <div className="dm-mix-badge">{q.sub}</div>
      {q.speakText ? (
        <button className="dm-mix-listen-btn" onClick={() => speak(q.speakText)} type="button">
          <Volume2 size={22} />
          <span>Tap to listen</span>
        </button>
      ) : (
        <div className="dm-quiz-word">
          {q.prompt}
          {q.kind === "translate" && (
            <button className="dm-speak-btn dm-speak-inline" onClick={() => speak(q.prompt)}>
              <Volume2 size={16} />
            </button>
          )}
        </div>
      )}
      <div className="dm-options">
        {q.options.map((o) => {
          let cls = "dm-option";
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
