/* components/games/listening-dictation-game.jsx
 * Listening dictation game.
 */

import { useEffect, useState } from "react";
import { currentLearningLangCode, speak } from "../../core/speech-voices";
import { LEVEL_COLOR, shuffle } from "../../core/srs-and-seed-data";
import { dmGroqFetch, dmParseJson } from "../../services/ai-groq";
import { Input } from "../common/Input";
import { ArrowRight, Check, Volume2 } from "../icons/icons";
import { getLangName } from "../language-settings/language-settings";
import { GameDone, GameTopBar } from "./game-chrome";
import { normTok, tokenizeDe } from "./speaking-game";
import { WordLookupPopup } from "./word-lookup-popup";

export function ListeningDictationGame({
  words,
  stacks,
  onAddWord,
  level,
  apiKey,
  onOpenAI,
  onAnswer,
  onExit,
  onPlayAgain,
  nativeLanguage,
}) {
  const nativeLangName = getLangName(nativeLanguage || "en");
  const [deck, setDeck] = useState(null);
  const [genError, setGenError] = useState("");
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [val, setVal] = useState("");
  const [result, setResult] = useState(null);
  const [popupToken, setPopupToken] = useState(null);
  useEffect(() => {
    if (!apiKey) return;
    let cancelled = false;
    (async () => {
      try {
        const pool = shuffle(words);
        const count = Math.min(8, Math.max(1, pool.length));
        const targets = [];
        for (let i = 0; i < count; i++) targets.push(pool[i % pool.length]);
        const dictLang = getLangName(currentLearningLangCode);
        const sysPrompt = `You are a ${dictLang} sentence generator for a listening-dictation exercise in a language-learning app. You will be given a CEFR level and a JSON array of target ${dictLang} words. For EACH target word (in the same order), write one natural, ${level}-appropriate ${dictLang} sentence that clearly and correctly uses that word (inflected naturally if needed), plus its translation in ${nativeLangName}. RULE 1 (highest priority) — real-world logic: the sentence must describe something that actually makes sense — a plausible person, object, action, or situation in the real world. Every noun, adjective, and verb in the sentence must fit together sensibly (e.g. don't pair an adjective with a subject or place it couldn't logically describe, and don't drop in a random extra noun/location just for novelty). If you're unsure whether a combination makes sense, choose a simpler, safer, obviously-sensible sentence instead. RULE 2 — variety: within that constraint, vary the topic, subject/character, tense, and sentence structure across words and across calls, and avoid reusing the exact same generic textbook example every time. Coherence always wins over novelty: a plain, sensible sentence is far better than a strange or nonsensical one. Use the provided random seed only as light inspiration for scenario variety (do not mention it in the output). Respond ONLY with a single JSON object (no prose, no markdown fences) with exact key: sentences — an array, same length and order as the input words, of objects with exact keys: de (the ${dictLang} sentence with correct punctuation, and correct capitalization where the language uses it), en (its translation in ${nativeLangName}).`;
        const variationSeed = Math.random().toString(36).slice(2) + "-" + Date.now();
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
                content: sysPrompt,
              },
              {
                role: "user",
                content: JSON.stringify({
                  level,
                  words: targets.map((w) => w.de),
                  randomSeed: variationSeed,
                }),
              },
            ],
            temperature: 0.8,
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
        const sentences = Array.isArray(parsed.sentences) ? parsed.sentences : [];
        const built = targets
          .map((w, i) => ({
            word: w,
            de: sentences[i]?.de || "",
            en: sentences[i]?.en || "",
          }))
          .filter((q) => q.de);
        if (!cancelled) setDeck(built);
      } catch (e) {
        if (!cancelled)
          setGenError(e.message || "Something went wrong generating sentences. Try again.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  if (!apiKey) {
    return (
      <div className="dm-game-play">
        <GameTopBar onExit={onExit} progress="0/0" title="Listening Dictation" />
        <div className="dm-empty">
          Add a Groq API key in the AI Tutor to generate dictation sentences.
        </div>
        <button className="dm-btn-primary dm-write-submit" onClick={onOpenAI}>
          Open AI Tutor
        </button>
      </div>
    );
  }
  if (genError) {
    return (
      <div className="dm-game-play">
        <GameTopBar onExit={onExit} progress="0/0" title="Listening Dictation" />
        <div className="dm-autofill-error">{genError}</div>
      </div>
    );
  }
  if (!deck) {
    return (
      <div className="dm-game-play">
        <GameTopBar onExit={onExit} progress="…" title="Listening Dictation" />
        <div className="dm-ai-msg dm-ai-msg-assistant dm-ai-typing dm-tr-loading">
          <span />
          <span />
          <span />
        </div>
      </div>
    );
  }
  if (!deck.length) {
    return (
      <div className="dm-game-play">
        <GameTopBar onExit={onExit} progress="0/0" title="Listening Dictation" />
        <div className="dm-empty">Couldn't generate sentences for this stack. Try again.</div>
      </div>
    );
  }
  const done = idx >= deck.length;
  if (done)
    return (
      <GameDone
        onExit={onExit}
        onPlayAgain={onPlayAgain}
        label="Listening Dictation"
        score={`${score}/${deck.length}`}
      />
    );
  const q = deck[idx];
  const correctTokens = tokenizeDe(q.de);
  const targetIdx = correctTokens.findIndex((tok) => normTok(tok) === normTok(q.word.de));
  const userTokens = result ? tokenizeDe(result.attempt) : [];
  const matched = correctTokens.map(
    (tok, i) => !!userTokens[i] && normTok(tok) === normTok(userTokens[i])
  );
  const submit = () => {
    if (!val.trim()) return;
    const uTokens = tokenizeDe(val);
    let matchCount = 0;
    correctTokens.forEach((tok, i) => {
      if (uTokens[i] && normTok(tok) === normTok(uTokens[i])) matchCount++;
    });
    const attemptScore = correctTokens.length
      ? Math.round((matchCount / correctTokens.length) * 100)
      : 0;
    setResult({
      score: attemptScore,
      attempt: val,
    });
    onAnswer(q.word.id, attemptScore >= 70);
    if (attemptScore >= 70) setScore((s) => s + 1);
  };
  const next = () => {
    setVal("");
    setResult(null);
    setIdx((i) => i + 1);
  };
  const gradeClass = result
    ? result.score < 50
      ? "dm-grade-red"
      : result.score < 80
        ? "dm-grade-gold"
        : "dm-grade-green"
    : "";
  const ringColor = result
    ? result.score < 50
      ? "var(--red)"
      : result.score < 80
        ? "var(--gold)"
        : "var(--green)"
    : "var(--cyan)";
  return (
    <div className="dm-game-play">
      <GameTopBar
        onExit={onExit}
        progress={`${idx + 1}/${deck.length}`}
        title="Listening Dictation"
      />
      <div className="dm-listen-level-row">
        <span
          className="dm-level-badge"
          style={{
            color: LEVEL_COLOR[level],
            borderColor: (LEVEL_COLOR[level] || "#8B93A7") + "55",
            background: (LEVEL_COLOR[level] || "#8B93A7") + "1a",
          }}
        >
          {level}
        </span>
      </div>
      <div className={`dm-listen-card ${gradeClass}`}>
        {result && (
          <div
            className="dm-ring"
            style={{
              background: `conic-gradient(${ringColor} ${result.score * 3.6}deg, var(--surface) 0deg)`,
            }}
          >
            <div className="dm-ring-inner">{result.score}%</div>
          </div>
        )}
        {!result && (
          <button className="dm-speak-btn dm-speak-big" onClick={() => speak(q.de)}>
            <Volume2 size={20} />
            {" Listen"}
          </button>
        )}
        {result && (
          <div className="dm-listen-attempt">
            {tokenizeDe(result.attempt).map((tok, i) => (
              <span key={i} className={matched[i] ? "" : "dm-listen-wrong"}>
                {tok}
              </span>
            ))}
          </div>
        )}
        {result && (
          <div className="dm-listen-correct">
            {correctTokens.map((tok, i) => (
              <button
                key={i}
                type="button"
                className={`dm-listen-word ${i === targetIdx ? "dm-listen-word-target" : matched[i] ? "" : "dm-listen-word-review"}`}
                onClick={() => setPopupToken(tok)}
              >
                {tok}
              </button>
            ))}
          </div>
        )}
        {result && <div className="dm-listen-divider" />}
        {result && <div className="dm-listen-en">{q.en}</div>}
      </div>
      {!result && (
        <Input
          className="dm-input dm-write-input"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="Type what you hear…"
          onKeyDown={(e) => e.key === "Enter" && submit()}
          autoFocus
        />
      )}
      {!result ? (
        <button className="dm-btn-primary dm-write-submit" onClick={submit} disabled={!val.trim()}>
          <Check size={16} />
          {" Check"}
        </button>
      ) : (
        <button className="dm-btn-primary dm-write-submit" onClick={next}>
          <ArrowRight size={16} />
          {" Next"}
        </button>
      )}
      {popupToken && (
        <WordLookupPopup
          token={popupToken}
          targetWord={q.word}
          apiKey={apiKey}
          stacks={stacks}
          onAddWord={onAddWord}
          onSpeak={speak}
          onClose={() => setPopupToken(null)}
          nativeLanguage={nativeLanguage}
        />
      )}
    </div>
  );
}
