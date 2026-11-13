/* core/level-stacks.js
 * Ready-made stacks per CEFR level (A1-B2) for the first-run onboarding.
 * The vocabulary itself lives in level-data-a.js / level-data-b.js; this file turns it into stacks
 * for the chosen learning language, with word meanings in the user's native language.
 */

import { uid } from "./constants";
import { A1, A2 } from "./level-data-a";
import { B1, B2 } from "./level-data-b";

// Column order of every data row after [type, germanGrammar].
export const LEVEL_LANGS = ["en", "de", "es", "fr", "it", "pt", "nl", "pl", "sv", "tr", "ru", "uk", "uz", "ar", "hi", "zh", "ja", "ko"];
export const START_LEVELS = ["A1", "A2", "B1", "B2"];
export const LEVEL_DATA = { A1, A2, B1, B2 };

const colOf = (code) => {
  const i = LEVEL_LANGS.indexOf(code);
  return i < 0 ? -1 : 2 + i;
};

// True when ready-made stacks exist for this learning language.
export function hasLevelStacks(learningLanguage) {
  return colOf(learningLanguage) >= 0;
}

// Stack names/emojis/word counts for the onboarding preview, in the user's native language
// (names exist in en, ru, uz and de; any other native language sees the English names).
export function levelStackPreview(level, nativeLanguage) {
  const stacks = LEVEL_DATA[level] || [];
  return stacks.map((s) => ({
    emoji: s.emoji,
    name: s.names[nativeLanguage] || s.names.en,
    count: s.rows.length,
  }));
}

function buildWord(row, level, learnCol, nativeCol, isGerman) {
  const [type, gram] = row;
  const parts = String(gram || "").split("|");
  const w = {
    id: uid(),
    de: row[learnCol],
    en: row[nativeCol],
    type,
    level,
    article: "",
    plural: "",
    praeteritum: "",
    partizipII: "",
    komparativ: "",
    superlativ: "",
    favorite: false,
    srs: { level: 0, next: Date.now(), correct: 0, wrong: 0 },
  };
  // Grammar columns are German-only (the same rule the old starter stacks followed).
  if (isGerman) {
    if (type === "noun") {
      w.article = parts[0] || "";
      w.plural = parts[1] || "";
    } else if (type === "verb") {
      w.praeteritum = parts[0] || "";
      w.partizipII = parts[1] || "";
      if (/^sich\s/i.test(w.de)) w.reflexiv = true;
    } else if (type === "adj") {
      w.komparativ = parts[0] || "";
      w.superlativ = parts[1] || "";
    }
  }
  return w;
}

// Returns the stacks for `level` (5 stacks, 10 words each), or [] if the language/level is unknown.
export function buildLevelStacks(level, learningLanguage, nativeLanguage) {
  const stacksData = LEVEL_DATA[level];
  const learnCol = colOf(learningLanguage);
  if (!stacksData || learnCol < 0) return [];
  const nativeCol = colOf(nativeLanguage) >= 0 ? colOf(nativeLanguage) : colOf("en");
  const isGerman = learningLanguage === "de";
  return stacksData.map((s) => ({
    id: uid(),
    name: s.names[nativeLanguage] || s.names.en,
    emoji: s.emoji,
    words: s.rows.map((r) => buildWord(r, level, learnCol, nativeCol, isGerman)),
  }));
}
