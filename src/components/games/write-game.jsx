/* components/games/write-game.jsx
 * Write-the-answer game plus the shared form-question builders.
 */

import { useEffect, useState } from "react";
import { currentLearningLangCode, speak } from "../../core/speech-voices";
import { shuffle } from "../../core/srs-and-seed-data";
import { Input } from "../common/Input";
import { Check, Volume2 } from "../icons/icons";
import { computeAdjForms, computeNounForms, computeVerbForms } from "../word-forms/word-forms";
import { uiTranslationLangCode } from "../../services/ui-translation";
import { nativeFormPhrase } from "./english-forms";
import { GameDone, GameTopBar } from "./game-chrome";

export function WriteGame({
  words,
  onAnswer,
  onExit,
  onPlayAgain,
  onNext,
  nextLabel,
  showRing,
  progressOverride,
}) {
  const [deck] = useState(() => shuffle(words));
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [val, setVal] = useState("");
  const [status, setStatus] = useState(null);
  const w = deck[idx];
  const done = idx >= deck.length;
  useEffect(() => {
    if (w) setTimeout(() => speak(w.de), 200);
  }, [idx]);
  if (done)
    return (
      <GameDone
        onExit={onExit}
        onPlayAgain={onPlayAgain}
        label="Write the Word"
        score={`${score}/${deck.length}`}
        onNext={onNext}
        nextLabel={nextLabel}
        showRing={showRing}
      />
    );
  const check = () => {
    const correct = val.trim().toLowerCase() === w.de.trim().toLowerCase();
    setStatus(correct ? "correct" : "wrong");
    onAnswer(w.id, correct);
    if (correct) setScore((s) => s + 1);
    setTimeout(() => {
      setVal("");
      setStatus(null);
      setIdx((i) => i + 1);
    }, 1100);
  };
  return (
    <div className="dm-game-play">
      <GameTopBar
        onExit={onExit}
        progress={progressOverride || `${idx + 1}/${deck.length}`}
        title="Write the Word"
      />
      <button className="dm-speak-btn dm-speak-big" onClick={() => speak(w.de)}>
        <Volume2 size={20} />
        {" Listen again"}
      </button>
      <Input
        className={`dm-input dm-write-input ${status === "correct" ? "dm-ok" : status === "wrong" ? "dm-bad" : ""}`}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="Type what you hear…"
        onKeyDown={(e) => e.key === "Enter" && check()}
        autoFocus
      />
      {status === "wrong" && (
        <div className="dm-write-answer">
          {"Correct: "}
          <b>{w.de}</b>
        </div>
      )}
      <button
        className="dm-btn-primary dm-write-submit"
        onClick={check}
        disabled={!val.trim() || status}
      >
        <Check size={16} />
        {" Check"}
      </button>
    </div>
  );
}
export const VERB_TENSE_LABELS = {
  praesens: "Präsens",
  praeteritum: "Präteritum",
  perfekt: "Perfekt",
  imperativ: "Imperativ",
};
// Builds one form question. The prompt is the English meaning of the
// form in the user's native language (e.g. "more patient"); the grammar label goes in `badge`
// (e.g. "Comparative of schön" — the generic "adj/noun/verb" is swapped for the base word). Falls back to the old "<label> of <word>"
// text when the word has no English translation to build from.
function formQ(w, kind, badge, fallbackLabel, answer) {
  const phrase = nativeFormPhrase(kind, w.en, uiTranslationLangCode);
  return {
    wordId: w.id,
    prompt: phrase || `${fallbackLabel} of “${w.de}”`,
    // "Superlative of adj" -> "Superlative of gemütlich": name the word the form belongs to.
    badge: badge.replace(/ of (adj|noun|verb)$/, () => ` of ${w.de}`),
    answer,
  };
}
export function buildFormQuestions(w) {
  const qs = [];
  if (w.type === "noun") {
    const forms = computeNounForms(w);
    if (currentLearningLangCode === "de") {
      // The 3 main forms of a German noun, the way a dictionary lists
      // them (der Tisch, des Tisches, die Tische) — Nominativ singular is
      // the word as saved, so only the other two are quizzed here,
      // instead of every case (Dativ, Akkusativ, ...).
      const genitivSingular = forms.singular.find((r) => r.label === "Genitiv");
      const nominativPlural = forms.plural.find((r) => r.label === "Nominativ");
      if (genitivSingular)
        qs.push(formQ(w, "genitive", "Genitive of noun", "Genitiv singular", genitivSingular.value));
      if (nominativPlural)
        qs.push(formQ(w, "plural", "Plural of noun", "Plural", nominativPlural.value));
    } else {
      // No case system outside German — the singular is the word as
      // saved, so only the plural is a "form" worth quizzing.
      const plural = forms.plural[0];
      if (plural && plural.value && plural.value !== "—") {
        qs.push(formQ(w, "plural", "Plural of noun", "Plural", plural.value));
      }
    }
  } else if (w.type === "verb") {
    const forms = computeVerbForms(w);
    const praeteritumForm = (forms.praeteritum.find((r) => r.label === "er/sie/es") || {}).value;
    const perfektIch = (forms.perfekt.find((r) => r.label === "ich") || {}).value || "";
    const partizipForm = perfektIch.replace(/^habe\s+/, "").replace(/^bin\s+/, "");
    if (praeteritumForm)
      qs.push(formQ(w, "past", "Past tense of verb", "Präteritum", praeteritumForm));
    if (partizipForm)
      qs.push(formQ(w, "participle", "Past participle of verb", "Partizip II", partizipForm));
  } else if (w.type === "adj") {
    // The 3 main forms of an adjective are Positiv/Komparativ/Superlativ
    // (schön, schöner, am schönsten) — row 0 is always the base form as
    // saved, regardless of language, so skip it by position rather than
    // by the German-only "Positiv" label.
    const rows = computeAdjForms(w);
    rows.forEach((r, i) => {
      if (i === 0) return;
      const isComp = i === 1;
      const badge = isComp
        ? "Comparative of adj"
        : i === 3
          ? "Superlative (before noun) of adj"
          : "Superlative of adj";
      qs.push(formQ(w, isComp ? "comparative" : "superlative", badge, r.label, r.value));
    });
  }
  return qs;
}
export function buildFormWordPool(words) {
  return words.flatMap((w) =>
    buildFormQuestions(w).map((q, i) => ({
      id: `${w.id}__form${i}`,
      baseWordId: w.id,
      de: q.answer,
      en: q.prompt,
      formBadge: q.badge,
      favorite: false,
      level: w.level,
      isFormCard: true,
    }))
  );
}
