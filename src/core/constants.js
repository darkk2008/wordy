/* core/constants.js
 * Small shared helpers and language/article/gender constants.
 */

export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
export const todayStr = () => new Date().toISOString().slice(0, 10);
export const DAY = 864e5;
export const SRS_STEPS = [10 / 1440, 1, 3, 7, 14, 30, 90];
export const SPEECH_LANG_CODES = {
  en: "en-US",
  de: "de-DE",
  es: "es-ES",
  fr: "fr-FR",
  it: "it-IT",
  pt: "pt-PT",
  nl: "nl-NL",
  pl: "pl-PL",
  sv: "sv-SE",
  tr: "tr-TR",
  ru: "ru-RU",
  uk: "uk-UA",
  uz: "uz-UZ",
  ar: "ar-SA",
  hi: "hi-IN",
  zh: "zh-CN",
  ja: "ja-JP",
  ko: "ko-KR",
};
export const ARTICLE_SETS = {
  de: ["der", "die", "das"],
  es: ["el", "la"],
  fr: ["le", "la"],
  it: ["il", "la"],
  pt: ["o", "a"],
  nl: ["de", "het"],
  sv: ["en", "ett"],
};
const GENDER_TAG_SETS = {
  ru: ["m", "f", "n"],
  uk: ["m", "f", "n"],
  pl: ["m", "f", "n"],
  ar: ["m", "f"],
  hi: ["m", "f"],
};
export const GENDER_SETS = {
  ...ARTICLE_SETS,
  ...GENDER_TAG_SETS,
};
export const ROMAN_LANGS = {
  ru: "Latin transliteration",
  uk: "Latin transliteration",
  ar: "Latin transliteration",
  hi: "Latin transliteration",
  zh: "pinyin with tone marks",
  ja: "romaji",
  ko: "romanization (Revised Romanization)",
};
export function usesGenderTag(code) {
  return !!GENDER_TAG_SETS[code];
}
export function wordGender(w) {
  return (w && (w.article || w.gender)) || "";
}
export function dmArticleProp(code, langName) {
  const set = GENDER_SETS[code];
  if (!set)
    return {
      type: "string",
      description: "Always leave empty — " + langName + " nouns have no article or gender field.",
    };
  if (usesGenderTag(code))
    return {
      type: "string",
      enum: set,
      description:
        "REQUIRED whenever type is 'noun'. The noun's grammatical gender in " +
        langName +
        ", exactly one of " +
        set.join("/") +
        " (m = masculine, f = feminine, n = neuter).",
    };
  return {
    type: "string",
    enum: set,
    description:
      "REQUIRED whenever type is 'noun'. The article used with this noun in " +
      langName +
      " (singular), exactly one of " +
      set.join("/") +
      ".",
  };
}
export function dmNonGermanFieldRule(code, langName) {
  const set = GENDER_SETS[code];
  let r = "The 'trennbar' and 'reflexiv' fields are German-specific — always set them to false. ";
  if (!set)
    r +=
      langName +
      " nouns have no article or gender field — always leave 'article' as an empty string. ";
  else if (usesGenderTag(code))
    r +=
      "For every noun set 'article' to its grammatical gender tag, exactly one of " +
      set.map((a) => '"' + a + '"').join("/") +
      " (m = masculine, f = feminine, n = neuter); leave it empty for other word types. ";
  else
    r +=
      "For every noun set 'article' to the article used with it in " +
      langName +
      ", exactly one of " +
      set.map((a) => '"' + a + '"').join("/") +
      "; leave it empty for other word types. ";
  if (ROMAN_LANGS[code])
    r +=
      "For EVERY word set 'roman' to its " +
      ROMAN_LANGS[code] +
      " in Latin letters (never empty, never a translation). ";
  return r;
}
