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
/* Shared German accuracy rules injected into the existing AI prompts (no per-word data). */
export const DM_DE_FORM_RULES =
  "GERMAN FORM RULES (apply to every German noun and verb): " +
  "NOUNS: always give the correct singular article/gender (der, die or das) in the article field — determine it from the real gender of the noun (for compounds, from the LAST component), never from the plural 'die'; the 'de' field stays the bare singular noun without the article, correctly capitalized, so that article + de reads like \"der Hund\". " +
  "VERBS: give praeteritum as the 3rd person singular and partizipII as the bare past participle (no hat/ist). Get irregular forms right: strong verbs (vowel change, e.g. -ging/-gegangen pattern), mixed verbs (vowel change plus -te, e.g. -brannte/-gebrannt pattern) and weak verbs (-te, or -ete after a stem ending in d/t or consonant+m/n), including stem changes and spelling (ß/ss, umlauts). Never apply a regular pattern to an irregular verb. " +
  "SEPARABLE verbs: in praeteritum the prefix moves to the end (pattern \"stand auf\"), and partizipII puts ge between prefix and stem (pattern \"aufgestanden\"); only treat a prefix as separable when it really is (e.g. an, auf, aus, mit, vor, zu, ab, ein, weg are usually separable; be-, ge-, er-, ver-, zer-, ent-, emp-, miss- never are; über-, unter-, um-, durch-, wider- can be either, so decide from the actual verb). " +
  "INSEPARABLE prefix verbs and verbs ending in -ieren take NO ge- in partizipII. " +
  "REFLEXIVE verbs: if the verb is used with sich as part of its normal meaning, KEEP the reflexive pronoun everywhere: the base form starts with \"sich \", praeteritum is \"<form> sich\" and partizipII is \"sich <participle>\" (pattern: sich X-en → X-te sich → sich ge-X-t). Set reflexiv to true only for such verbs and false for verbs that are merely sometimes used reflexively. Both forms must be internally consistent with the base form. " +
  "Before answering, silently double-check each form against standard German (Duden) conjugation.";
export const DM_DE_SPELLING_RULES =
  "GERMAN INPUT/SPELLING RULES: the input may contain typos, wrong capitalization, missing umlauts or ß, or letter swaps. " +
  "If the input is a correctly spelled German word, keep it exactly as it is (only fix capitalization or normalize to the dictionary base form as required above) — never replace a valid word with a different one. " +
  "If it is misspelled and exactly one real German word is clearly the most likely intended one (closest in spelling, sound and keyboard distance; prefer the more common word), silently use that corrected word for ALL fields. " +
  "If two or more different real words are about equally plausible, or you are not confident, do NOT guess: ";
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
