/* components/games/word-quiz-stages.jsx
 * Building blocks for the single-word quiz (swipe a word left -> Quiz):
 *  - LookStage:   see the word once, with its meaning and forms
 *  - TypeStage:   type the answer from memory (optional step-by-step hints)
 *  - ChoiceStage: pick the answer (article, look-alike words)
 * Every stage ends with a Continue button, so the learner always sees the
 * right answer before moving on (no auto-skipping past feedback).
 */

import { useEffect, useState } from "react";
import { speak } from "../../core/speech-voices";
import { WordMeta } from "../common/common";
import { Input } from "../common/Input";
import { Check, LightbulbSuggestIcon, Volume2 } from "../icons/icons";
import { stripArticle } from "../word-forms/word-forms";
import { GameTopBar } from "./game-chrome";

const norm = (s) => String(s || "").normalize("NFC").toLowerCase().replace(/\s+/g, " ").trim();

function accepted(answer) {
  return [...new Set([norm(answer), norm(stripArticle(answer))])];
}
// "Tisch" -> "T _ _ _ _" (1 hint) / "T i s _ _" (2 hints)
function hintPattern(base, hints) {
  const chars = Array.from(base);
  const reveal = hints <= 1 ? 1 : Math.ceil(chars.length / 2);
  return chars
    .map((c, i) => (c === " " ? "\u00A0\u00A0" : i < reveal || !/\p{L}/u.test(c) ? c : "_"))
    .join(" ");
}

export function LookStage({ target, title, progress, onExit, onNext, nextLabel, ...chrome }) {
  useEffect(() => {
    const t = setTimeout(() => speak(target.de), 250);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="dm-game-play">
      <GameTopBar onExit={onExit} progress={progress} title={title} {...chrome} />
      <div className="dm-quiz-word">
        {target.de}
        <button className="dm-speak-btn dm-speak-inline" onClick={() => speak(target.de)}>
          <Volume2 size={16} />
        </button>
      </div>
      <div className="dm-write-hint">{target.en}</div>
      <div className="dm-wq-meta">
        <WordMeta w={target} />
      </div>
      <p className="dm-wq-tip">
        Read it, say it out loud. Next you will have to recall it yourself, with no hints on the
        last check.
      </p>
      <button className="dm-btn-primary dm-write-submit" onClick={onNext} autoFocus>
        {nextLabel}
      </button>
    </div>
  );
}

export function TypeStage({
  items,
  title,
  progress,
  onExit,
  onAnswer,
  onNext,
  nextLabel,
  placeholder = "Type from memory…",
  ...chrome
}) {
  const [idx, setIdx] = useState(0);
  const [val, setVal] = useState("");
  const [hints, setHints] = useState(0);
  const [status, setStatus] = useState(null); // null | correct | hinted | wrong
  const q = items[idx];
  const last = idx + 1 >= items.length;
  const base = stripArticle(q.answer);
  const check = () => {
    if (status || !val.trim()) return;
    const ok = accepted(q.answer).includes(norm(val));
    setStatus(ok ? (hints ? "hinted" : "correct") : "wrong");
    // A hinted answer is shown as right but counts as a miss for the review schedule.
    onAnswer(ok && hints === 0);
  };
  const advance = () => {
    if (last) return onNext();
    setIdx((i) => i + 1);
    setVal("");
    setHints(0);
    setStatus(null);
  };
  return (
    <div className="dm-game-play">
      <GameTopBar onExit={onExit} progress={progress} title={title} {...chrome} />
      {q.badge && <div className="dm-mix-badge">{q.badge}</div>}
      <div className="dm-quiz-word">{q.prompt}</div>
      {q.hintable && hints > 0 && <div className="dm-wq-hintline">{hintPattern(base, hints)}</div>}
      <Input
        className={`dm-input dm-write-input ${status === "correct" || status === "hinted" ? "dm-ok" : status === "wrong" ? "dm-bad" : ""}`}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder={placeholder}
        onKeyDown={(e) => e.key === "Enter" && check()}
        autoFocus
        disabled={!!status}
      />
      {status === "wrong" && (
        <div className="dm-write-answer">
          {"Correct: "}
          <b>{q.answer}</b>
          <button className="dm-speak-btn dm-speak-inline" onClick={() => speak(q.answer)}>
            <Volume2 size={16} />
          </button>
        </div>
      )}
      {status === "hinted" && (
        <div className="dm-wq-feedback">
          Right, but with a hint, so it counts as a miss and the word will come back sooner.
        </div>
      )}
      {status === "correct" && <div className="dm-wq-feedback dm-wq-feedback-ok">Correct!</div>}
      {!status ? (
        <div className="dm-wq-actions">
          {q.hintable && (
            <button
              type="button"
              className="dm-btn-secondary"
              disabled={hints >= 2}
              onClick={() => setHints((h) => Math.min(2, h + 1))}
            >
              <LightbulbSuggestIcon size={15} />
              {hints ? " More hint" : " Hint"}
            </button>
          )}
          <button className="dm-btn-primary dm-write-submit" onClick={check} disabled={!val.trim()}>
            <Check size={16} />
            {" Check"}
          </button>
        </div>
      ) : (
        <button className="dm-btn-primary dm-write-submit" onClick={advance} autoFocus>
          {last ? nextLabel : "Next"}
        </button>
      )}
    </div>
  );
}

export function ChoiceStage({
  prompt,
  sub,
  speakText,
  options,
  correct,
  title,
  progress,
  onExit,
  onAnswer,
  onNext,
  nextLabel,
  ...chrome
}) {
  const [picked, setPicked] = useState(null);
  const pick = (o) => {
    if (picked !== null) return;
    setPicked(o);
    onAnswer(o === correct);
  };
  return (
    <div className="dm-game-play">
      <GameTopBar onExit={onExit} progress={progress} title={title} {...chrome} />
      <div className="dm-quiz-word">
        {prompt}
        {speakText && (
          <button className="dm-speak-btn dm-speak-inline" onClick={() => speak(speakText)}>
            <Volume2 size={16} />
          </button>
        )}
      </div>
      {sub && <div className="dm-write-hint">{sub}</div>}
      <div className="dm-options">
        {options.map((o) => {
          let cls = "dm-option";
          if (picked !== null) {
            if (o === correct) cls += " dm-option-correct";
            else if (o === picked) cls += " dm-option-wrong";
          }
          return (
            <button key={o} className={cls} onClick={() => pick(o)}>
              {o}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <button className="dm-btn-primary dm-write-submit" onClick={onNext} autoFocus>
          {nextLabel}
        </button>
      )}
    </div>
  );
}
