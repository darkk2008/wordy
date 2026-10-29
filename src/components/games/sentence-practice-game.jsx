/* components/games/sentence-practice-game.jsx
 * Sentence practice game.
 */

import { useState, useEffect, useRef } from "react";
import { shuffle } from "../../core/srs-and-seed-data";
import { dmGroqFetch, dmParseJson } from "../../services/ai-groq";
import { ArrowRight, Check, Loader2 } from "../icons/icons";
import { getLangName } from "../language-settings/language-settings";
import { computeAdjForms, computeVerbForms } from "../word-forms/word-forms";
import { GameDone, GameTopBar } from "./game-chrome";

function buildSentenceQuestions(w) {
  const qs = [];
  if (w.type === "noun" && w.plural) {
    const titleWord = `${w.article || "der"} ${w.de}`;
    qs.push({
      wordId: w.id,
      category: "Plural",
      instruction: `Write a German sentence using the plural of “${titleWord}” — “${w.plural}”.`,
      target: w.plural,
    });
  }
  if (w.type === "verb") {
    const forms = computeVerbForms(w);
    qs.push({
      wordId: w.id,
      category: "Präsens",
      instruction: `Write a German sentence using the present-tense (er/sie/es) form of “${w.de}” — “${forms.praesens[2].value}”.`,
      target: forms.praesens[2].value,
    });
    qs.push({
      wordId: w.id,
      category: "Präteritum",
      instruction: `Write a German sentence using the past-tense (er/sie/es) form of “${w.de}” — “${forms.praeteritum[2].value}”.`,
      target: forms.praeteritum[2].value,
    });
    qs.push({
      wordId: w.id,
      category: "Perfekt",
      instruction: `Write a German sentence using the Perfekt (er/sie/es) form of “${w.de}” — “${forms.perfekt[2].value}”.`,
      target: forms.perfekt[2].value,
    });
  }
  if (w.type === "adj" && (w.komparativ || w.superlativ)) {
    const rows = computeAdjForms(w);
    qs.push({
      wordId: w.id,
      category: "Komparativ",
      instruction: `Write a German sentence using the comparative of “${w.de}” — “${rows[1].value}”.`,
      target: rows[1].value,
    });
    qs.push({
      wordId: w.id,
      category: "Superlativ",
      instruction: `Write a German sentence using the superlative of “${w.de}” — “${rows[2].value}”.`,
      target: rows[2].value,
    });
  }
  return qs;
}
export function SentencePracticeGame({
  words,
  apiKey,
  onOpenAI,
  onAnswer,
  onExit,
  onPlayAgain,
  nativeLanguage,
}) {
  const nativeLangName = getLangName(nativeLanguage || "en");
  const [deck] = useState(() => shuffle(words.flatMap(buildSentenceQuestions)).slice(0, 15));
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [val, setVal] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const q = deck[idx];
  const done = idx >= deck.length;
  const taRef = useRef(null);
  const nextRef = useRef(null);
  // keep the cursor in the box for every new question (the box is disabled while a result shows)
  useEffect(() => {
    if (!result) taRef.current?.focus();
  }, [idx, result]);
  // once a result is showing, Enter goes to the next question
  useEffect(() => {
    if (!result) return undefined;
    const onKey = (e) => {
      if (e.key !== "Enter" || e.repeat || e.isComposing) return;
      if (e.target && e.target.closest && e.target.closest("button")) return; // a focused button handles Enter itself
      e.preventDefault();
      nextRef.current?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [result]);
  if (!deck.length) {
    return (
      <div className="dm-game-play">
        <GameTopBar onExit={onExit} progress="0/0" title="Sentence Practice" />
        <div className="dm-empty">None of the words in this stack have saved forms yet.</div>
      </div>
    );
  }
  if (done)
    return (
      <GameDone
        onExit={onExit}
        onPlayAgain={onPlayAgain}
        label="Sentence Practice"
        score={`${score}/${deck.length}`}
      />
    );
  const submit = async () => {
    if (!val.trim() || loading) return;
    if (!apiKey) {
      if (onOpenAI) onOpenAI();
      return;
    }
    setLoading(true);
    setError("");
    try {
      const sys = `You are a strict but encouraging German grammar grader inside a language-learning app. The learner was asked to: "${q.instruction}" They must use the target form "${q.target}" correctly, and the whole sentence must be grammatically correct German. Respond ONLY with a single JSON object (no prose, no markdown fences) with exact keys: score (integer 0-100 reflecting both correct use of the target form and overall grammatical correctness), feedback (a short, specific explanation of what's right or wrong, 1-3 sentences, plain text, no markdown, written in ${nativeLangName} so the learner can understand it — quoting the German words/forms being discussed is fine), suggested (a corrected/ideal German sentence using the target form).`;
      const res = await dmGroqFetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [
            {
              role: "system",
              content: sys,
            },
            {
              role: "user",
              content: val.trim(),
            },
          ],
          temperature: 0.3,
          response_format: {
            type: "json_object",
          },
        }),
      });
      if (!res.ok) {
        let msg = `Request failed (${res.status})`;
        try {
          const errJson = await res.json();
          if (errJson?.error?.message) msg = errJson.error.message;
        } catch (e) {}
        throw new Error(msg);
      }
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error("(no response)");
      let parsed;
      try {
        parsed = dmParseJson(content);
      } catch (e) {
        throw new Error("Couldn't parse the response. Try again.");
      }
      const gradeScore = Math.max(0, Math.min(100, Math.round(Number(parsed.score) || 0)));
      setResult({
        score: gradeScore,
        feedback: parsed.feedback || "",
        suggested: parsed.suggested || "",
      });
      onAnswer(q.wordId, gradeScore >= 70);
      if (gradeScore >= 70) setScore((s) => s + 1);
    } catch (e) {
      setError(e.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };
  const next = () => {
    setVal("");
    setResult(null);
    setError("");
    setIdx((i) => i + 1);
  };
  nextRef.current = next;
  const gradeClass = result
    ? result.score < 60
      ? "dm-grade-red"
      : result.score < 85
        ? "dm-grade-gold"
        : "dm-grade-green"
    : "";
  return (
    <div className="dm-game-play">
      <GameTopBar
        onExit={onExit}
        progress={`${idx + 1}/${deck.length}`}
        title="Sentence Practice"
      />
      <div className="dm-sentence-prompt-card">
        <div className="dm-sentence-category">{q.category}</div>
        <div className="dm-sentence-instruction">{q.instruction}</div>
      </div>
      <textarea
        className="dm-input dm-sentence-textarea"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="Schreib einen Satz auf Deutsch…"
        disabled={!!result}
        ref={taRef}
        autoFocus
        onKeyDown={(e) => {
          // Enter submits (a sentence is one line); Shift+Enter still inserts a line break
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            if (val.trim() && !loading) submit();
          }
        }}
      />
      {error && <div className="dm-autofill-error">{error}</div>}
      {!apiKey && !result && (
        <div className="dm-autofill-hint">
          Add a Groq API key in the AI Tutor to grade sentences.
        </div>
      )}
      {!result ? (
        <button
          className="dm-btn-primary dm-write-submit"
          onClick={submit}
          disabled={!val.trim() || loading}
        >
          {loading ? <Loader2 size={16} className="dm-autofill-spin" /> : <Check size={16} />}
          {loading ? " Grading…" : " Submit"}
        </button>
      ) : (
        <>
          <div className={`dm-sentence-feedback-card ${gradeClass}`}>
            <div className="dm-sentence-score">{result.score}%</div>
            <div className="dm-sentence-feedback-text">{result.feedback}</div>
            {result.suggested && (
              <div className="dm-sentence-suggested">
                {"Suggested: "}
                <b>{result.suggested}</b>
              </div>
            )}
          </div>
          <button className="dm-btn-primary dm-write-submit" onClick={next}>
            <ArrowRight size={16} />
            {" Next"}
          </button>
        </>
      )}
    </div>
  );
}
