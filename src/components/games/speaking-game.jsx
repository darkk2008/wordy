/* components/games/speaking-game.jsx
 * Speaking game and speech-matching helpers (tokenize, levenshtein, scoring).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { SPEECH_LANG_CODES } from "../../core/constants";
import { currentLearningLangCode, speak } from "../../core/speech-voices";
import { shuffle } from "../../core/srs-and-seed-data";
import { ArrowRight, Mic, Volume2 } from "../icons/icons";
import { stripArticle } from "../word-forms/word-forms";
import { GameDone, GameTopBar } from "./game-chrome";

export function stripPunct(t) {
  return (t || "").replace(
    /^[„"\u201C'«(\[\u300C\u300E\uFF08\u00BF\u00A1]+|[.,!?;:„"\u201C\u201D'»)\]\u3002\u3001\uFF0C\uFF01\uFF1F\uFF1B\uFF1A\u300D\u300F\uFF09\u2026\u061F\u060C\u0964]+$/g,
    ""
  );
}
export function normTok(t) {
  return stripPunct(t).toLowerCase().normalize("NFKC");
}
export function tokenizeDe(s) {
  const str = (s || "").trim();
  const lc = currentLearningLangCode;
  if (lc === "zh" || lc === "ja") {
    if (typeof Intl !== "undefined" && Intl.Segmenter) {
      try {
        const out = [];
        for (const part of new Intl.Segmenter(lc, {
          granularity: "word",
        }).segment(str)) {
          if (part.isWordLike) out.push(part.segment);
        }
        if (out.length) return out;
      } catch (e) {}
    }
    return Array.from(str).filter(
      (ch) => !/[\s\u3000-\u303F\uFF00-\uFF0F\uFF1A-\uFF20.,!?;:"'\u00AB\u00BB()\[\]]/.test(ch)
    );
  }
  return str.split(/\s+/).filter(Boolean);
}
function getSpeechRecognitionCtor() {
  return typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition || null
    : null;
}
function stripDiacriticsLoose(s) {
  try {
    return (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  } catch (e) {
    return s || "";
  }
}
function levenshtein(a, b) {
  const m = a.length,
    n = b.length;
  if (!m) return n;
  if (!n) return m;
  const row = new Array(n + 1);
  for (let j = 0; j <= n; j++) row[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = row[j];
      row[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, row[j], row[j - 1]);
      prev = tmp;
    }
  }
  return row[n];
}
function scoreSpeechAttempt(target, heard) {
  const norm = (s) =>
    stripDiacriticsLoose(stripPunct((s || "").trim().toLowerCase())).replace(/\s+/g, " ");
  const t = norm(target);
  const h = norm(heard);
  if (!t || !h) return 0;
  if (t === h) return 100;
  const dist = levenshtein(t, h);
  const maxLen = Math.max(t.length, h.length);
  const ratio = maxLen ? 1 - dist / maxLen : 0;
  return Math.max(0, Math.min(100, Math.round(ratio * 100)));
}
export function SpeakingGame({ words, onAnswer, onExit, onPlayAgain, learningLanguage }) {
  const deck = useMemo(() => shuffle(words).slice(0, Math.min(12, words.length)), [words]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [listening, setListening] = useState(false);
  const [result, setResult] = useState(null);
  const [micError, setMicError] = useState("");
  const recogRef = useRef(null);
  const Ctor = useMemo(() => getSpeechRecognitionCtor(), []);
  useEffect(
    () => () => {
      try {
        if (recogRef.current) recogRef.current.abort();
      } catch (e) {}
    },
    []
  );
  if (!deck.length) {
    return (
      <div className="dm-game-play">
        <GameTopBar onExit={onExit} progress="0/0" title="Speaking Practice" />
        <div className="dm-empty">Add some words to this stack first.</div>
      </div>
    );
  }
  const done = idx >= deck.length;
  if (done)
    return (
      <GameDone
        onExit={onExit}
        onPlayAgain={onPlayAgain}
        label="Speaking Practice"
        score={`${score}/${deck.length}`}
      />
    );
  const q = deck[idx];
  const targetText = q.article ? `${q.article} ${stripArticle(q.de)}` : q.de;
  const startListening = () => {
    if (!Ctor) return;
    setMicError("");
    setResult(null);
    try {
      const recog = new Ctor();
      recogRef.current = recog;
      recog.lang =
        SPEECH_LANG_CODES[learningLanguage] ||
        SPEECH_LANG_CODES[currentLearningLangCode] ||
        "en-US";
      recog.maxAlternatives = 1;
      recog.interimResults = false;
      recog.onresult = (ev) => {
        const heard = ev.results?.[0]?.[0]?.transcript || "";
        const s = scoreSpeechAttempt(targetText, heard);
        setResult({
          score: s,
          heard,
        });
        onAnswer(q.id, s >= 70);
        if (s >= 70) setScore((n) => n + 1);
      };
      recog.onerror = (ev) => {
        setListening(false);
        if (ev.error === "not-allowed" || ev.error === "service-not-allowed") {
          setMicError(
            "Microphone access was denied. Allow mic access in your browser to use Speaking Practice."
          );
        } else if (ev.error === "no-speech") {
          setMicError("Didn't catch that — try again a bit closer to the mic.");
        } else {
          setMicError("Something went wrong with speech recognition. Try again.");
        }
      };
      recog.onend = () => setListening(false);
      recog.start();
      setListening(true);
    } catch (e) {
      setMicError("Couldn't start the microphone. Try again.");
    }
  };
  const stopListening = () => {
    try {
      if (recogRef.current) recogRef.current.stop();
    } catch (e) {}
    setListening(false);
  };
  const next = () => {
    setResult(null);
    setMicError("");
    setIdx((i) => i + 1);
  };
  if (!Ctor) {
    return (
      <div className="dm-game-play">
        <GameTopBar
          onExit={onExit}
          progress={`${idx + 1}/${deck.length}`}
          title="Speaking Practice"
        />
        <div className="dm-empty">
          Speech recognition isn't supported in this browser. Try Chrome on desktop or Android.
        </div>
      </div>
    );
  }
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
        title="Speaking Practice"
      />
      <div className={`dm-listen-card dm-speak-card ${gradeClass}`}>
        <div className="dm-speak-target">{targetText}</div>
        <button type="button" className="dm-speak-btn dm-speak-big" onClick={() => speak(q.de)}>
          <Volume2 size={18} />
          {" Hear it"}
        </button>
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
        {result && <div className="dm-speak-heard">You said: “{result.heard || "—"}”</div>}
        {!result && (
          <button
            type="button"
            className={`dm-mic-btn ${listening ? "dm-mic-btn-active" : ""}`}
            onClick={listening ? stopListening : startListening}
          >
            <Mic size={26} />
          </button>
        )}
        {!result && (
          <div className="dm-speak-hint">
            {listening ? "Listening… speak now" : "Tap the mic and say the word"}
          </div>
        )}
        {micError && <div className="dm-autofill-error">{micError}</div>}
      </div>
      {result && (
        <button className="dm-btn-primary dm-write-submit" onClick={next}>
          <ArrowRight size={16} />
          {" Next"}
        </button>
      )}
    </div>
  );
}
