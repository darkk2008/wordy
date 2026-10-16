/* components/word-forms/word-forms.jsx
 * Word forms line, forms table and the "all forms" modal (conjugations/declensions).
 */

import { Fragment, useEffect, useState } from "react";
import {
  ARTICLE_SETS,
  GENDER_SETS,
  ROMAN_LANGS,
  usesGenderTag,
  wordGender,
} from "../../core/constants";
import { currentLearningLangCode } from "../../core/speech-voices";
import { shuffle } from "../../core/srs-and-seed-data";
import {
  dmFetchParadigm,
  dmGroqFetch,
  dmHasParadigm,
  dmLowResourceNote,
  dmParseJson,
} from "../../services/ai-groq";
import { FormEyeBtn, FormSpeakBtn, IconBtn } from "../common/common";
import { CASE_INFO } from "../games/cases-game";
import { VERB_TENSE_LABELS } from "../games/write-game";
import { Eye, EyeOff, Loader2, Sparkles, Star, X } from "../icons/icons";
import { getLangName } from "../language-settings/language-settings";

export function WordFormsLine({ w, showAudio }) {
  if (w.type === "noun" && w.plural) {
    const pluralText =
      currentLearningLangCode === "de" ? `die ${stripArticle(w.plural)}` : w.plural;
    return (
      <div className="dm-meta">
        <span className="dm-mono dm-forms-only">{pluralText}</span>
        {showAudio && <FormSpeakBtn text={pluralText} />}
      </div>
    );
  }
  if (w.type === "verb" && (w.praeteritum || w.partizipII)) {
    return (
      <div className="dm-meta">
        <span className="dm-mono dm-meta-sub">{w.praeteritum}</span>
        {showAudio && <FormSpeakBtn text={w.praeteritum} />}
        <span className="dm-meta-arrow">→</span>
        <span className="dm-mono dm-meta-sub">{w.partizipII}</span>
        {showAudio && <FormSpeakBtn text={w.partizipII} />}
      </div>
    );
  }
  if (w.type === "adj" && (w.komparativ || w.superlativ)) {
    const supDisplay = formatSuperlativ(w.superlativ, w.de || "");
    return (
      <div className="dm-meta">
        <span className="dm-mono dm-meta-sub">{w.komparativ}</span>
        {showAudio && <FormSpeakBtn text={w.komparativ} />}
        <span className="dm-meta-arrow">→</span>
        <span className="dm-mono dm-meta-sub">{supDisplay}</span>
        {showAudio && <FormSpeakBtn text={supDisplay} />}
      </div>
    );
  }
  return (
    <div className="dm-meta">
      <span className="dm-forms-none">No forms saved</span>
    </div>
  );
}
function endsWithAny(str, arr) {
  const s = (str || "").toLowerCase();
  return arr.some((suf) => s.endsWith(suf));
}
export function stripArticle(str) {
  return (str || "").replace(/^(der|die|das)\s+/i, "").trim();
}
export function computeNounForms(w) {
  if (currentLearningLangCode !== "de") {
    return {
      singular: [
        {
          label: "Singular",
          value:
            (ARTICLE_SETS[currentLearningLangCode] && w.article ? w.article + " " : "") +
            (w.de || "—"),
        },
      ],
      plural: [
        {
          label: "Plural",
          value: w.plural || "—",
        },
      ],
    };
  }
  const noun = stripArticle(w.de || "");
  const article = w.article || "der";
  const plural = (w.plural || noun + "e").trim();
  const genArticle = article === "die" ? "der" : "des";
  const datArticle = article === "die" ? "der" : "dem";
  const akkArticle = article === "der" ? "den" : article;
  const genSuffix = endsWithAny(noun, ["s", "ß", "x", "z", "sch", "ch"]) ? "es" : "s";
  const genForm = article === "die" ? noun : noun + genSuffix;
  const datPluralForm = endsWithAny(plural, ["n", "s"]) ? plural : plural + "n";
  return {
    singular: [
      {
        label: "Nominativ",
        value: `${article} ${noun}`,
      },
      {
        label: "Akkusativ",
        value: `${akkArticle} ${noun}`,
      },
      {
        label: "Dativ",
        value: `${datArticle} ${noun}`,
      },
      {
        label: "Genitiv",
        value: `${genArticle} ${genForm}`,
      },
    ],
    plural: [
      {
        label: "Nominativ",
        value: `die ${plural}`,
      },
      {
        label: "Akkusativ",
        value: `die ${plural}`,
      },
      {
        label: "Dativ",
        value: `den ${datPluralForm}`,
      },
      {
        label: "Genitiv",
        value: `der ${plural}`,
      },
    ],
  };
}
const IRREGULAR_PRAESENS = {
  sein: {
    ich: "bin",
    du: "bist",
    er: "ist",
  },
  haben: {
    ich: "habe",
    du: "hast",
    er: "hat",
  },
  werden: {
    ich: "werde",
    du: "wirst",
    er: "wird",
  },
  wissen: {
    ich: "weiß",
    du: "weißt",
    er: "weiß",
  },
  können: {
    ich: "kann",
    du: "kannst",
    er: "kann",
  },
  müssen: {
    ich: "muss",
    du: "musst",
    er: "muss",
  },
  wollen: {
    ich: "will",
    du: "willst",
    er: "will",
  },
  dürfen: {
    ich: "darf",
    du: "darfst",
    er: "darf",
  },
  sollen: {
    ich: "soll",
    du: "sollst",
    er: "soll",
  },
  mögen: {
    ich: "mag",
    du: "magst",
    er: "mag",
  },
  fahren: {
    du: "fährst",
    er: "fährt",
  },
  schlafen: {
    du: "schläfst",
    er: "schläft",
  },
  tragen: {
    du: "trägst",
    er: "trägt",
  },
  fangen: {
    du: "fängst",
    er: "fängt",
  },
  lassen: {
    du: "lässt",
    er: "lässt",
  },
  laufen: {
    du: "läufst",
    er: "läuft",
  },
  schlagen: {
    du: "schlägst",
    er: "schlägt",
  },
  waschen: {
    du: "wäschst",
    er: "wäscht",
  },
  wachsen: {
    du: "wächst",
    er: "wächst",
  },
  fallen: {
    du: "fällst",
    er: "fällt",
  },
  halten: {
    du: "hältst",
    er: "hält",
  },
  raten: {
    du: "rätst",
    er: "rät",
  },
  braten: {
    du: "brätst",
    er: "brät",
  },
  graben: {
    du: "gräbst",
    er: "gräbt",
  },
  backen: {
    du: "bäckst",
    er: "bäckt",
  },
  geben: {
    du: "gibst",
    er: "gibt",
  },
  nehmen: {
    du: "nimmst",
    er: "nimmt",
  },
  sprechen: {
    du: "sprichst",
    er: "spricht",
  },
  essen: {
    du: "isst",
    er: "isst",
  },
  vergessen: {
    du: "vergisst",
    er: "vergisst",
  },
  helfen: {
    du: "hilfst",
    er: "hilft",
  },
  werfen: {
    du: "wirfst",
    er: "wirft",
  },
  treffen: {
    du: "triffst",
    er: "trifft",
  },
  brechen: {
    du: "brichst",
    er: "bricht",
  },
  sterben: {
    du: "stirbst",
    er: "stirbt",
  },
  gelten: {
    du: "giltst",
    er: "gilt",
  },
  messen: {
    du: "misst",
    er: "misst",
  },
  lesen: {
    du: "liest",
    er: "liest",
  },
  sehen: {
    du: "siehst",
    er: "sieht",
  },
  empfehlen: {
    du: "empfiehlst",
    er: "empfiehlt",
  },
  stehlen: {
    du: "stiehlst",
    er: "stiehlt",
  },
};
export function computeVerbForms(w) {
  if (currentLearningLangCode !== "de") {
    return {
      praesens: [
        {
          label: "Base form",
          value: w.de || "—",
        },
      ],
      praeteritum: [
        {
          label: "Past form",
          value: w.praeteritum || "—",
        },
      ],
      perfekt: [
        {
          label: "Participle",
          value: w.partizipII || "—",
        },
      ],
    };
  }
  const inf = w.de || "";
  const stem = inf.endsWith("en") ? inf.slice(0, -2) : inf.endsWith("n") ? inf.slice(0, -1) : inf;
  const needsE = endsWithAny(stem, ["t", "d"]);
  const sEnding = endsWithAny(stem, ["s", "ß", "z", "x"]);
  const irregular = IRREGULAR_PRAESENS[inf.trim().toLowerCase()] || {};
  const praesens = {
    ich: irregular.ich || stem + "e",
    du: irregular.du || (sEnding ? stem + "t" : stem + (needsE ? "est" : "st")),
    er: irregular.er || stem + (needsE ? "et" : "t"),
    wir: inf,
    ihr: stem + (needsE ? "et" : "t"),
    sie: inf,
  };
  const rawPraet = (w.praeteritum || (needsE ? stem + "ete" : stem + "te")).trim();
  const praetTokens = rawPraet.split(/\s+/).filter(Boolean);
  const praetPrefix = praetTokens.length > 1 ? praetTokens.pop() : "";
  const praet = praetTokens.join(" ") || rawPraet;
  const praetSEnding = endsWithAny(praet, ["s", "ß", "z", "x"]);
  const isWeak = praet.toLowerCase().endsWith("te");
  const withPrefix = (form) => (praetPrefix ? `${form} ${praetPrefix}` : form);
  const praeteritum = {
    ich: withPrefix(praet),
    du: withPrefix(isWeak ? praet + "st" : praetSEnding ? praet + "t" : praet + "st"),
    er: withPrefix(praet),
    wir: withPrefix(isWeak ? praet + "n" : praet + "en"),
    ihr: withPrefix(praet + "t"),
    sie: withPrefix(isWeak ? praet + "n" : praet + "en"),
  };
  const partizip = w.partizipII || `ge${stem}${needsE ? "et" : "t"}`;
  const AUX =
    dmVerbAux(w) === "sein"
      ? {
          ich: "bin",
          du: "bist",
          er: "ist",
          wir: "sind",
          ihr: "seid",
          sie: "sind",
        }
      : {
          ich: "habe",
          du: "hast",
          er: "hat",
          wir: "haben",
          ihr: "habt",
          sie: "haben",
        };
  const perfekt = {
    ich: `${AUX.ich} ${partizip}`,
    du: `${AUX.du} ${partizip}`,
    er: `${AUX.er} ${partizip}`,
    wir: `${AUX.wir} ${partizip}`,
    ihr: `${AUX.ihr} ${partizip}`,
    sie: `${AUX.sie} ${partizip}`,
  };
  const rows = (obj) => [
    {
      label: "ich",
      value: obj.ich,
    },
    {
      label: "du",
      value: obj.du,
    },
    {
      label: "er/sie/es",
      value: obj.er,
    },
    {
      label: "wir",
      value: obj.wir,
    },
    {
      label: "ihr",
      value: obj.ihr,
    },
    {
      label: "sie/Sie",
      value: obj.sie,
    },
  ];
  return {
    praesens: rows(praesens),
    praeteritum: rows(praeteritum),
    perfekt: rows(perfekt),
  };
}
export function formatSuperlativ(raw, base) {
  let sup = (raw || "").trim();
  if (!sup) {
    if (currentLearningLangCode !== "de") return "—";
    sup = `${base}sten`;
  }
  if (!sup.toLowerCase().startsWith("am ")) {
    if (currentLearningLangCode === "de") {
      if (/e$/i.test(sup) && !/en$/i.test(sup)) sup = `${sup}n`;
      sup = `am ${sup}`;
    }
  }
  return sup;
}
export function computeAdjForms(w) {
  const isDe = currentLearningLangCode === "de";
  const base = w.de || "";
  const komp = w.komparativ || (isDe ? `${base}er` : "—");
  let sup = formatSuperlativ(w.superlativ, base);
  return [
    {
      label: isDe ? "Positiv" : "Base",
      value: base,
    },
    {
      label: isDe ? "Komparativ" : "Comparative",
      value: komp,
    },
    {
      label: isDe ? "Superlativ" : "Superlative",
      value: sup,
    },
  ];
}
export function buildTenseMixerQuestions(w) {
  if (!(w && w.type === "verb" && w.de)) return [];
  const forms = computeVerbForms(w);
  const tenseKeys = ["praesens", "praeteritum", "perfekt"];
  const allValues = [];
  tenseKeys.forEach((t) => forms[t].forEach((r) => allValues.push(r.value)));
  const qs = [];
  tenseKeys.forEach((t) => {
    forms[t].forEach((r) => {
      const correct = r.value;
      const pool = [...new Set(allValues.filter((v) => v !== correct))];
      const distractors = shuffle(pool).slice(0, 3);
      const options = shuffle([correct, ...distractors]);
      qs.push({
        wordId: w.id,
        verb: w.de,
        tenseLabel: VERB_TENSE_LABELS[t],
        pronoun: r.label,
        correct,
        options,
      });
    });
  });
  return qs;
}
const ADJ_ENDING_GENDERS = [
  {
    key: "der",
    noun: "Mann",
    article: {
      Nominativ: "Der",
      Akkusativ: "Den",
      Dativ: "Dem",
      Genitiv: "Des",
    },
  },
  {
    key: "die",
    noun: "Frau",
    article: {
      Nominativ: "Die",
      Akkusativ: "Die",
      Dativ: "Der",
      Genitiv: "Der",
    },
  },
  {
    key: "das",
    noun: "Kind",
    article: {
      Nominativ: "Das",
      Akkusativ: "Das",
      Dativ: "Dem",
      Genitiv: "Des",
    },
  },
  {
    key: "plural",
    noun: "Leute",
    article: {
      Nominativ: "Die",
      Akkusativ: "Die",
      Dativ: "Den",
      Genitiv: "Der",
    },
  },
];
const ADJ_ENDING_TABLE = {
  Nominativ: {
    der: "e",
    die: "e",
    das: "e",
    plural: "en",
  },
  Akkusativ: {
    der: "en",
    die: "e",
    das: "e",
    plural: "en",
  },
  Dativ: {
    der: "en",
    die: "en",
    das: "en",
    plural: "en",
  },
  Genitiv: {
    der: "en",
    die: "en",
    das: "en",
    plural: "en",
  },
};
const ADJ_ENDING_CASES = ["Nominativ", "Akkusativ", "Dativ", "Genitiv"];
function adjWithEnding(stem, ending) {
  if (stem.endsWith("e")) return ending === "e" ? stem : stem + ending.slice(1);
  return stem + ending;
}
export function buildAdjEndingQuestions(w) {
  if (!(w && w.type === "adj" && w.de)) return [];
  const stem = w.de.trim();
  const qs = [];
  ADJ_ENDING_CASES.forEach((caseName) => {
    ADJ_ENDING_GENDERS.forEach((g) => {
      const ending = ADJ_ENDING_TABLE[caseName][g.key];
      const correct = adjWithEnding(stem, ending);
      const otherEndings = ["e", "en", "em", "es"].filter((e) => e !== ending);
      const distractors = shuffle(otherEndings)
        .slice(0, 3)
        .map((e) => adjWithEnding(stem, e));
      const options = shuffle([...new Set([correct, ...distractors])]);
      qs.push({
        wordId: w.id,
        caseName,
        article: g.article[caseName],
        noun: g.noun,
        correct,
        options,
        wordDe: w.de,
        wordEn: w.en,
      });
    });
  });
  return qs;
}
export function buildAdjFallbackSentence(caseName, article, noun) {
  const templates = CASE_INFO[caseName].templates;
  const template = templates[Math.floor(Math.random() * templates.length)];
  const parts = template.split("{art} {noun}");
  return {
    before: parts[0] || "",
    after: parts[1] || ".",
  };
}
export async function generateAdjSentence(apiKey, { caseName, article, noun, wordDe, wordEn }) {
  const sys = `You are a German A1-A2 course writer creating adjective-ending drill sentences. You are given a grammatical case ("${caseName}") and a fixed noun phrase slot "${article} ___ ${noun}" that MUST appear in the sentence exactly as given (do not change the article or the noun, and do not write the adjective yourself — "___" stands for it). Write ONE short, natural, grammatically correct German sentence at A1-A2 level that uses this exact noun phrase in the correct case, and that makes real-world sense together with the adjective meaning "${wordDe}" (English: "${wordEn}") — the adjective must plausibly describe that noun in a sensible everyday situation, not just be grammatically attached to it. If a sensible pairing feels forced, pick a plain, simple, obviously-sensible sentence rather than a strange or surprising one. Respond ONLY with a JSON object with exact keys: "before" (any text appearing immediately before the slot, or "" if the sentence starts with the slot) and "after" (text immediately after the noun, ending with the sentence's final punctuation). Do not repeat "${article}", "${noun}", or any form of the adjective inside "before" or "after".`;
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
          content: "Generate the sentence now.",
        },
      ],
      temperature: 0.6,
      response_format: {
        type: "json_object",
      },
    }),
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("(no response)");
  const parsed = dmParseJson(content);
  let before = (parsed.before || "").trim();
  let after = (parsed.after || "").trim() || ".";
  if (before) before += " ";
  if (after && !/^[.,!?;: ]/.test(after)) after = " " + after;
  return {
    before,
    after,
  };
}
function FormsTable({ rows, hidden, locked }) {
  const [overrides, setOverrides] = useState({});
  useEffect(() => {
    setOverrides({});
  }, [hidden]);
  const toggleRow = (i) => {
    if (locked) return;
    setOverrides((prev) => {
      const current = prev[i] !== undefined ? prev[i] : hidden;
      return {
        ...prev,
        [i]: !current,
      };
    });
  };
  return (
    <div className="dm-forms-modal-table">
      {rows.map((r, i) => {
        const rowHidden = locked ? true : overrides[i] !== undefined ? overrides[i] : hidden;
        return (
          <div key={i} className="dm-forms-modal-row">
            <span className="dm-forms-modal-pronoun">{r.label}</span>
            <span
              className={`dm-forms-modal-value${rowHidden ? " dm-forms-modal-value-hidden" : ""}`}
            >
              <span
                className={`dm-forms-modal-value-blur${rowHidden ? " dm-forms-modal-value-blur-hidden" : ""}`}
              >
                {r.value}
              </span>
            </span>
            <FormEyeBtn hidden={rowHidden} onToggle={() => toggleRow(i)} locked={locked} />
            <FormSpeakBtn text={locked ? "" : r.value} />
          </div>
        );
      })}
    </div>
  );
}
function dmVerbAux(w) {
  if (w && (w.auxiliary === "sein" || w.auxiliary === "haben")) return w.auxiliary;
  const inf = String((w && w.de) || "")
    .trim()
    .toLowerCase()
    .replace(/^sich\s+/, "");
  const exact = [
    "sein",
    "werden",
    "bleiben",
    "passieren",
    "geschehen",
    "gelingen",
    "misslingen",
    "begegnen",
    "verschwinden",
    "vergehen",
    "entstehen",
    "erscheinen",
    "erwachen",
    "entkommen",
    "aufwachen",
    "einschlafen",
    "einsteigen",
    "aussteigen",
    "umsteigen",
    "umziehen",
    "aufstehen",
    "verreisen",
    "ertrinken",
    "sterben",
    "wachsen",
    "schwimmen",
    "rennen",
    "wandern",
    "reisen",
    "folgen",
    "landen",
    "starten",
  ];
  if (exact.includes(inf)) return "sein";
  const base = [
    "gehen",
    "kommen",
    "fahren",
    "laufen",
    "fliegen",
    "steigen",
    "springen",
    "fallen",
    "bleiben",
    "reisen",
    "treten",
    "ziehen",
  ];
  const pre = [
    "ab",
    "an",
    "auf",
    "aus",
    "ein",
    "mit",
    "weg",
    "zurück",
    "vorbei",
    "hin",
    "her",
    "herunter",
    "hinauf",
    "hinaus",
    "heraus",
    "herein",
    "hinein",
    "los",
    "fort",
    "heim",
    "hoch",
    "weiter",
    "vor",
    "nach",
    "zu",
    "um",
    "rein",
    "raus",
    "runter",
    "rauf",
  ];
  for (const b of base) {
    if (inf === b && b !== "ziehen" && b !== "treten") return "sein";
    for (const x of pre) {
      if (inf === x + b && !(b === "ziehen" && x !== "um") && !(b === "treten" && x !== "ein"))
        return "sein";
    }
  }
  return "haben";
}
function dmMissingFormFields(w) {
  const m = [];
  const code = currentLearningLangCode;
  if (!w) return m;
  if (w.type === "noun") {
    if (!String(w.plural || "").trim()) m.push("plural");
    if (GENDER_SETS[code] && !wordGender(w)) m.push("article");
  } else if (w.type === "verb") {
    if (!String(w.praeteritum || "").trim()) m.push("praeteritum");
    if (!String(w.partizipII || "").trim()) m.push("partizipII");
    if (code === "de" && !w.auxiliary) m.push("auxiliary");
  } else if (w.type === "adj") {
    if (!String(w.komparativ || "").trim()) m.push("komparativ");
    if (!String(w.superlativ || "").trim()) m.push("superlativ");
  }
  if (
    (w.type === "noun" || w.type === "verb" || w.type === "adj") &&
    ROMAN_LANGS[code] &&
    !String(w.roman || "").trim()
  )
    m.push("roman");
  return m;
}
async function dmFetchMissingForms(apiKey, w, need) {
  const code = currentLearningLangCode;
  const langName = getLangName(code);
  const isDe = code === "de";
  const genders = GENDER_SETS[code] || [];
  const desc = {
    article: usesGenderTag(code)
      ? `article (the noun's grammatical gender tag, exactly one of ${genders.map((a) => `"${a}"`).join("/")}; m = masculine, f = feminine, n = neuter)`
      : `article (the SINGULAR grammatical gender article, exactly one of ${genders.map((a) => `"${a}"`).join("/")})`,
    plural: `plural (the bare plural form of the noun with NO article; use an empty string only if ${langName} truly has no plural form for this word)`,
    praeteritum: isDe
      ? `praeteritum (simple past, 3rd person singular, e.g. "ging"; for a separable verb put the prefix last, e.g. "stand auf")`
      : `praeteritum (the simple past / preterite form in ${langName}; empty string only if ${langName} has no such form)`,
    partizipII: isDe
      ? `partizipII (the past participle only, without hat/ist, e.g. "gegangen")`
      : `partizipII (the past participle in ${langName}; empty string only if ${langName} has no such form)`,
    roman: `roman (the ${ROMAN_LANGS[code] || "Latin transliteration"} of the word itself, in Latin letters with the standard tone marks or diacritics; never a translation)`,
    auxiliary: `auxiliary (exactly "haben" or "sein": the auxiliary this verb normally takes in the Perfekt; "sein" for verbs of motion or change of state such as gehen, kommen, sterben, aufstehen)`,
    komparativ: `komparativ (the bare comparative form; empty string only if the adjective is not gradable)`,
    superlativ: `superlativ (the superlative form; empty string only if the adjective is not gradable)`,
  };
  const sys = `You are a ${langName} dictionary and grammar engine inside a vocabulary app. The user gives you one ${langName} word (dictionary base form) of type "${w.type}". Respond ONLY with a single JSON object (no prose, no markdown fences) with exactly these keys: ${need.map((k) => desc[k]).join("; ")}. Be accurate, including irregular forms and umlauts. Never guess a regular pattern when the word is irregular.`;
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
          content: String(w.de || ""),
        },
      ],
      temperature: 0.1,
      response_format: {
        type: "json_object",
      },
    }),
  });
  if (!res.ok) throw new Error("Request failed (" + res.status + ")");
  const data = await res.json();
  const content =
    data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  if (!content) throw new Error("no response");
  const parsed = dmParseJson(content);
  const out = {};
  need.forEach((k) => {
    let v = parsed && parsed[k];
    if (typeof v !== "string") return;
    v = v.trim();
    if (!v) return;
    if (k === "plural") v = stripArticle(v);
    if (k === "partizipII") v = v.replace(/^(hat|ist|habe|bin|has|have|is|am)\s+/i, "");
    if (k === "roman") {
      v = v.replace(/^["'(\[]+|["')\]]+$/g, "").trim();
      if (!v) return;
    }
    if (k === "auxiliary") {
      v = v.toLowerCase();
      if (v !== "haben" && v !== "sein") return;
    }
    if (k === "article") {
      v = v.toLowerCase();
      if (!genders.includes(v)) return;
    }
    out[k] = v;
  });
  if (usesGenderTag(code) && out.article) {
    out.gender = out.article;
    delete out.article;
  }
  return out;
}
export function AllFormsModal({ w: wProp, onClose, mini, isPremium, onOpenPremium }) {
  const locked = !isPremium;
  const [aiExtra, setAiExtra] = useState(null);
  const [aiStatus, setAiStatus] = useState("idle");
  const w = aiExtra
    ? {
        ...wProp,
        ...aiExtra,
      }
    : wProp;
  const runFill = () => {
    const need = dmMissingFormFields(wProp);
    if (!need.length || !wProp || !wProp.id) return;
    let apiKey = "";
    try {
      apiKey = window.localStorage.getItem("deutschmaster-groq-key") || "";
    } catch (e) {}
    if (!apiKey) return;
    const key = wProp.id + ":" + currentLearningLangCode + ":" + need.join(",");
    window.__dmFormsDone = window.__dmFormsDone || {};
    window.__dmFormsBusy = window.__dmFormsBusy || {};
    if (window.__dmFormsDone[key] || window.__dmFormsBusy[key]) return;
    window.__dmFormsBusy[key] = true;
    setAiStatus("loading");
    dmFetchMissingForms(apiKey, wProp, need)
      .then((fields) => {
        window.__dmFormsDone[key] = true;
        if (fields && Object.keys(fields).length) {
          setAiExtra((prev) => ({
            ...(prev || {}),
            ...fields,
          }));
          try {
            window.dispatchEvent(
              new CustomEvent("dm-word-forms-filled", {
                detail: {
                  id: wProp.id,
                  fields,
                },
              })
            );
          } catch (e) {}
        }
        setAiStatus("idle");
      })
      .catch(() => {
        setAiStatus("error");
      })
      .finally(() => {
        window.__dmFormsBusy[key] = false;
      });
  };
  const [pStatus, setPStatus] = useState("idle");
  const runParadigm = (force) => {
    const code = currentLearningLangCode;
    if (code === "de" || !wProp || !wProp.id) return;
    if (!(wProp.type === "noun" || wProp.type === "verb" || wProp.type === "adj")) return;
    if (!force && dmHasParadigm(wProp)) return;
    let apiKey = "";
    try {
      apiKey = window.localStorage.getItem("deutschmaster-groq-key") || "";
    } catch (e) {}
    if (!apiKey) return;
    const key = "paradigm:" + wProp.id + ":" + code;
    window.__dmFormsDone = window.__dmFormsDone || {};
    window.__dmFormsBusy = window.__dmFormsBusy || {};
    if ((!force && window.__dmFormsDone[key]) || window.__dmFormsBusy[key]) return;
    window.__dmFormsBusy[key] = true;
    setPStatus("loading");
    dmFetchParadigm(apiKey, wProp)
      .then((p) => {
        window.__dmFormsDone[key] = true;
        setAiExtra((prev) => ({
          ...(prev || {}),
          paradigm: p,
        }));
        try {
          window.dispatchEvent(
            new CustomEvent("dm-word-forms-filled", {
              detail: {
                id: wProp.id,
                fields: {
                  paradigm: p,
                },
              },
            })
          );
        } catch (e) {}
        setPStatus("idle");
      })
      .catch(() => {
        setPStatus("error");
      })
      .finally(() => {
        window.__dmFormsBusy[key] = false;
      });
  };
  useEffect(() => {
    if (!locked) {
      runFill();
      runParadigm(false);
    }
  }, [wProp && wProp.id, locked]);
  const aiStatusEl =
    aiStatus === "loading" ? (
      <div className="dm-autofill-hint">
        <Loader2 size={13} className="dm-autofill-spin" />
        {" AI is filling in the missing forms…"}
      </div>
    ) : aiStatus === "error" ? (
      <div
        className="dm-autofill-error"
        style={{
          cursor: "pointer",
        }}
        onClick={runFill}
      >
        Couldn't fill the forms with AI — tap to retry.
      </div>
    ) : null;
  const [hidden, setHidden] = useState(false);
  const [headerShakeId, setHeaderShakeId] = useState(0);
  const [closing, setClosing] = useState(false);
  const effectiveHidden = locked ? true : hidden;
  const closeWithAnim = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(() => onClose(), 220);
  };
  const handleHeaderEyeClick = () => {
    if (locked) {
      setHeaderShakeId((n) => n + 1);
      return;
    }
    setHidden((v) => !v);
  };
  let titleWord = w.de;
  if (w.type === "noun" && w.article) titleWord = `${w.article} ${stripArticle(w.de)}`;
  let body;
  const isDeWordModal = currentLearningLangCode === "de";
  if (w.type === "noun") {
    const forms = computeNounForms(w);
    body = (
      <>
        <div className="dm-forms-modal-section">
          <div className="dm-forms-modal-title">Singular</div>
          <FormsTable rows={forms.singular} hidden={effectiveHidden} locked={locked} />
        </div>
        <div className="dm-forms-modal-section">
          <div className="dm-forms-modal-title">Plural</div>
          <FormsTable rows={forms.plural} hidden={effectiveHidden} locked={locked} />
        </div>
      </>
    );
  } else if (w.type === "verb") {
    const forms = computeVerbForms(w);
    body = (
      <>
        <div className="dm-forms-modal-section">
          <div className="dm-forms-modal-title">{isDeWordModal ? "Präsens" : "Base form"}</div>
          <FormsTable rows={forms.praesens} hidden={effectiveHidden} locked={locked} />
        </div>
        <div className="dm-forms-modal-section">
          <div className="dm-forms-modal-title">{isDeWordModal ? "Präteritum" : "Past form"}</div>
          <FormsTable rows={forms.praeteritum} hidden={effectiveHidden} locked={locked} />
        </div>
        <div className="dm-forms-modal-section">
          <div className="dm-forms-modal-title">{isDeWordModal ? "Perfekt" : "Participle"}</div>
          <FormsTable rows={forms.perfekt} hidden={effectiveHidden} locked={locked} />
        </div>
      </>
    );
  } else if (w.type === "adj") {
    const rows = computeAdjForms(w);
    body = (
      <>
        <div className="dm-forms-modal-section">
          <div className="dm-forms-modal-title">{isDeWordModal ? "Steigerung" : "Comparison"}</div>
          <FormsTable rows={rows} hidden={effectiveHidden} locked={locked} />
        </div>
      </>
    );
  } else {
    body = <div className="dm-forms-modal-empty">No inflected forms for this word type.</div>;
  }
  if (!isDeWordModal && (w.type === "noun" || w.type === "verb" || w.type === "adj")) {
    if (dmHasParadigm(w)) {
      const lowNote = dmLowResourceNote();
      body = (
        <>
          {w.paradigm.sections.map((sec, si) => (
            <div key={si} className="dm-forms-modal-section">
              <div className="dm-forms-modal-title">{sec.title}</div>
              <FormsTable rows={sec.rows} hidden={effectiveHidden} locked={locked} />
            </div>
          ))}
          {!locked && (
            <button
              type="button"
              className="dm-autofill-btn"
              onClick={() => runParadigm(true)}
              disabled={pStatus === "loading"}
            >
              {pStatus === "loading" ? (
                <Loader2 size={15} className="dm-autofill-spin" />
              ) : (
                <Sparkles size={15} />
              )}
              {pStatus === "loading" ? " Rebuilding…" : " Regenerate table"}
            </button>
          )}
          {lowNote && <div className="dm-autofill-hint">{lowNote}</div>}
        </>
      );
    } else if (pStatus === "loading") {
      body = (
        <>
          <div className="dm-autofill-hint">
            <Loader2 size={13} className="dm-autofill-spin" />
            {" Building the full table with AI…"}
          </div>
          {body}
        </>
      );
    } else if (pStatus === "error") {
      body = (
        <>
          <div
            className="dm-autofill-error"
            style={{
              cursor: "pointer",
            }}
            onClick={() => runParadigm(true)}
          >
            Couldn't build the full table — tap to retry.
          </div>
          {body}
        </>
      );
    }
  }
  return (
    <div
      className={`dm-modal-backdrop dm-modal-review-backdrop${mini ? " dm-mini-forms-backdrop" : ""}${closing ? " dm-modal-backdrop-closing" : ""}`}
      onClick={closeWithAnim}
    >
      <div
        className={`dm-modal dm-modal-review${mini ? " dm-mini-forms-modal" : ""}${closing ? " dm-modal-closing" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dm-modal-head">
          <h3>{`All forms — ${titleWord}`}</h3>
          <div className="dm-forms-head-actions">
            <IconBtn
              onClick={handleHeaderEyeClick}
              title={
                locked
                  ? "Unlock with Premium to reveal forms"
                  : hidden
                    ? "Show forms"
                    : "Hide forms"
              }
            >
              <span
                key={`${effectiveHidden ? "off" : "on"}-${headerShakeId}`}
                className={`dm-eye-toggle${headerShakeId > 0 ? " dm-eye-shake" : ""}`}
              >
                {effectiveHidden ? <EyeOff size={18} /> : <Eye size={18} />}
              </span>
            </IconBtn>
            <IconBtn onClick={closeWithAnim}>
              <X size={18} />
            </IconBtn>
          </div>
        </div>
        {locked && (
          <div
            className="dm-autofill-hint dm-forms-premium-hint"
            onClick={() => onOpenPremium && onOpenPremium()}
          >
            <Star size={13} />
            {" Unlock full grammar tables with Premium"}
          </div>
        )}
        {aiStatusEl}
        {body}
      </div>
    </div>
  );
}
