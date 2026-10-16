/* components/games/paradigm-game.jsx
 * Paradigm (full conjugation) game.
 */

import { useEffect, useState } from "react";
import { speak } from "../../core/speech-voices";
import { shuffle } from "../../core/srs-and-seed-data";
import { dmBuildParadigmQuestions, dmFetchParadigm, dmHasParadigm } from "../../services/ai-groq";
import { GameDone, GameTopBar } from "./game-chrome";

export function ParadigmGame({ words, onAnswer, onExit, onPlayAgain, apiKey, onOpenAI, title }) {
  const gameTitle = title || "Grammar Forms";
  const [deck, setDeck] = useState(null);
  const [genError, setGenError] = useState("");
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cands = shuffle(
          words.filter((w) => w.type === "noun" || w.type === "verb" || w.type === "adj")
        );
        const items = [];
        cands
          .filter(dmHasParadigm)
          .slice(0, 8)
          .forEach((w) =>
            items.push({
              word: w,
              paradigm: w.paradigm,
            })
          );
        const need = cands.filter((w) => !dmHasParadigm(w)).slice(0, Math.max(0, 6 - items.length));
        if (need.length && apiKey) {
          await Promise.all(
            need.map(async (w) => {
              try {
                const p = await dmFetchParadigm(apiKey, w);
                if (p && p.sections.length) {
                  items.push({
                    word: w,
                    paradigm: p,
                  });
                  window.dispatchEvent(
                    new CustomEvent("dm-word-forms-filled", {
                      detail: {
                        id: w.id,
                        fields: {
                          paradigm: p,
                        },
                      },
                    })
                  );
                }
              } catch (e) {}
            })
          );
        }
        if (cancelled) return;
        if (!items.length) {
          setGenError(
            apiKey
              ? "Couldn't build grammar tables for these words. Try again in a moment."
              : "needkey"
          );
          return;
        }
        const qs = dmBuildParadigmQuestions(items, 10);
        if (!qs.length) setGenError("Not enough forms to make questions for these words.");
        else setDeck(qs);
      } catch (e) {
        if (!cancelled) setGenError((e && e.message) || "Something went wrong. Try again.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  if (genError === "needkey") {
    return (
      <div className="dm-game-play">
        <GameTopBar onExit={onExit} progress="0/0" title={gameTitle} />
        <div className="dm-empty">Add a Groq API key in the AI Tutor to build grammar tables.</div>
        <button className="dm-btn-primary dm-write-submit" onClick={onOpenAI}>
          Open AI Tutor
        </button>
      </div>
    );
  }
  if (genError) {
    return (
      <div className="dm-game-play">
        <GameTopBar onExit={onExit} progress="0/0" title={gameTitle} />
        <div className="dm-autofill-error">{genError}</div>
      </div>
    );
  }
  if (!deck) {
    return (
      <div className="dm-game-play">
        <GameTopBar onExit={onExit} progress="…" title={gameTitle} />
        <div className="dm-ai-msg dm-ai-msg-assistant dm-ai-typing dm-tr-loading">
          <span />
          <span />
          <span />
        </div>
      </div>
    );
  }
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
  const q = deck[idx];
  const choose = (opt) => {
    if (picked !== null) return;
    const correct = opt === q.correct;
    setPicked(opt);
    onAnswer(q.wordId, correct);
    if (correct) setScore((sc) => sc + 1);
    speak(q.correct.replace(/\s*\([^)]*\)\s*$/, ""));
    setTimeout(() => {
      setPicked(null);
      setIdx((i) => i + 1);
    }, 900);
  };
  return (
    <div className="dm-game-play">
      <GameTopBar onExit={onExit} progress={`${idx + 1}/${deck.length}`} title={gameTitle} />
      <div className="dm-mix-badge">{q.sub}</div>
      <div className="dm-quiz-word">{q.prompt}</div>
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
