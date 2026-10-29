/* components/games/english-forms.js
 * Builds the English meaning of a word form for the form games
 * (e.g. adj "patient" → comparative "more patient", noun "table" →
 * plural "tables", verb "to wait" → past "waited"), so the game prompt
 * can show the meaning instead of "Komparativ of geduldig".
 */

const IRREGULAR_VERBS = {
  be: ["was", "been"], become: ["became", "become"], begin: ["began", "begun"],
  bite: ["bit", "bitten"], blow: ["blew", "blown"], break: ["broke", "broken"],
  bring: ["brought", "brought"], build: ["built", "built"], buy: ["bought", "bought"],
  catch: ["caught", "caught"], choose: ["chose", "chosen"], come: ["came", "come"],
  cost: ["cost", "cost"], cut: ["cut", "cut"], do: ["did", "done"],
  draw: ["drew", "drawn"], drink: ["drank", "drunk"], drive: ["drove", "driven"],
  eat: ["ate", "eaten"], fall: ["fell", "fallen"], feel: ["felt", "felt"],
  fight: ["fought", "fought"], find: ["found", "found"], fly: ["flew", "flown"],
  forget: ["forgot", "forgotten"], forgive: ["forgave", "forgiven"], get: ["got", "got"],
  give: ["gave", "given"], go: ["went", "gone"], grow: ["grew", "grown"],
  have: ["had", "had"], hear: ["heard", "heard"], hide: ["hid", "hidden"],
  hit: ["hit", "hit"], hold: ["held", "held"], keep: ["kept", "kept"],
  know: ["knew", "known"], lead: ["led", "led"], leave: ["left", "left"],
  lend: ["lent", "lent"], let: ["let", "let"], lie: ["lay", "lain"],
  lose: ["lost", "lost"], make: ["made", "made"], mean: ["meant", "meant"],
  meet: ["met", "met"], pay: ["paid", "paid"], put: ["put", "put"],
  read: ["read", "read"], ride: ["rode", "ridden"], ring: ["rang", "rung"],
  run: ["ran", "run"], say: ["said", "said"], see: ["saw", "seen"],
  sell: ["sold", "sold"], send: ["sent", "sent"], set: ["set", "set"],
  shine: ["shone", "shone"], shut: ["shut", "shut"], sing: ["sang", "sung"],
  sink: ["sank", "sunk"], sit: ["sat", "sat"], sleep: ["slept", "slept"],
  speak: ["spoke", "spoken"], spend: ["spent", "spent"], stand: ["stood", "stood"],
  steal: ["stole", "stolen"], swim: ["swam", "swum"], take: ["took", "taken"],
  teach: ["taught", "taught"], tear: ["tore", "torn"], tell: ["told", "told"],
  think: ["thought", "thought"], throw: ["threw", "thrown"],
  understand: ["understood", "understood"], wake: ["woke", "woken"],
  wear: ["wore", "worn"], win: ["won", "won"], write: ["wrote", "written"],
};

const IRREGULAR_PLURALS = {
  man: "men", woman: "women", child: "children", foot: "feet", tooth: "teeth",
  mouse: "mice", person: "people", goose: "geese", life: "lives", wife: "wives",
  knife: "knives", leaf: "leaves", half: "halves", wolf: "wolves", fish: "fish",
  sheep: "sheep",
};

// First meaning only ("big; large" / "big, large" → "big"), no leading
// "to " / article / bracketed notes.
function cleanMeaning(en) {
  return String(en || "")
    .split(/[;,/，；、،]/)[0]
    .replace(/[(（][^)）]*[)）]/g, "")
    .trim();
}
function splitHead(text) {
  const parts = text.split(/\s+/);
  return { head: parts[0] || "", rest: parts.slice(1).join(" ") };
}
function regularPast(v) {
  if (/e$/.test(v)) return `${v}d`;
  if (/[^aeiou]y$/.test(v)) return `${v.slice(0, -1)}ied`;
  if (/^[^aeiou]*[aeiou][^aeiouwxy]$/.test(v) && v.length <= 4) return `${v}${v.slice(-1)}ed`;
  return `${v}ed`;
}
function pluralWord(w) {
  const lower = w.toLowerCase();
  if (IRREGULAR_PLURALS[lower]) return IRREGULAR_PLURALS[lower];
  if (/[^aeiou]y$/.test(lower)) return `${w.slice(0, -1)}ies`;
  if (/(s|x|z|ch|sh)$/.test(lower)) return `${w}es`;
  return `${w}s`;
}
function joinRest(head, rest) {
  return rest ? `${head} ${rest}` : head;
}

// Comparative / superlative are built the analytic way ("more X",
// "más X", "更X"…) in every language, so they work on any base-form
// translation without needing that language's morphology.
const COMPARATIVE_PREFIX = {
  de: "mehr ", es: "más ", fr: "plus ", it: "più ", pt: "mais ", nl: "meer ",
  pl: "bardziej ", sv: "mer ", tr: "daha ", ru: "более ", uk: "більш ",
  uz: "yanada ", ar: "أكثر ", hi: "ज़्यादा ", zh: "更", ja: "もっと", ko: "더 ",
};
const SUPERLATIVE_PREFIX = {
  de: "am meisten ", es: "el más ", fr: "le plus ", it: "il più ", pt: "o mais ",
  nl: "meest ", pl: "najbardziej ", sv: "mest ", tr: "en ", ru: "самый ",
  uk: "найбільш ", uz: "eng ", ar: "الأكثر ", hi: "सबसे ", zh: "最", ja: "一番", ko: "가장 ",
};

/* Prompt for a form question, in the user's NATIVE language.
 * `meaning` is the word's saved translation (native language), `lang` the
 * native language code. English gets full forms (plural, past tense…).
 * Other languages get "more X" / "most X" for comparative/superlative;
 * plural/past/participle/genitive can't be derived reliably for arbitrary
 * words, so they show the base meaning and the badge names the form. */
export function nativeFormPhrase(kind, meaning, lang) {
  const code = lang || "en";
  if (code === "en") return englishFormPhrase(kind, meaning);
  const base = cleanMeaning(meaning);
  if (!base) return "";
  if (kind === "comparative") return (COMPARATIVE_PREFIX[code] || "") + base;
  if (kind === "superlative") return (SUPERLATIVE_PREFIX[code] || "") + base;
  return base;
}

export function englishFormPhrase(kind, en) {
  const base = cleanMeaning(en);
  if (!base) return "";
  if (kind === "comparative") return `more ${base}`;
  if (kind === "superlative") return `the most ${base}`;
  if (kind === "plural") {
    const noun = base.replace(/^(the|a|an)\s+/i, "");
    // Pluralize the last word ("ice cream" → "ice creams").
    const parts = noun.split(/\s+/);
    parts[parts.length - 1] = pluralWord(parts[parts.length - 1]);
    return parts.join(" ");
  }
  if (kind === "genitive") return `of the ${base.replace(/^(the|a|an)\s+/i, "")}`;
  if (kind === "past" || kind === "participle") {
    const { head, rest } = splitHead(base.replace(/^to\s+/i, ""));
    const irr = IRREGULAR_VERBS[head.toLowerCase()];
    const form = irr ? irr[kind === "past" ? 0 : 1] : regularPast(head);
    return joinRest(form, rest);
  }
  return base;
}
