/* services/ai-groq.js
 * Groq AI calls: model choice, paradigm fetch, term lookup, romanization.
 */

import { getLangName } from "../components/language-settings/language-settings";
import { stripArticle } from "../components/word-forms/word-forms";
import {
  ARTICLE_SETS,
  GENDER_SETS,
  ROMAN_LANGS,
  usesGenderTag,
  wordGender,
} from "../core/constants";
import { currentLearningLangCode, dmRomanizationEnabled } from "../core/speech-voices";
import { shuffle } from "../core/srs-and-seed-data";
import { DM_PROXY_URL, DM_SHARED_KEY, dmIsProxyKey } from "./config-and-validation";

export const DM_DEFAULT_MODEL = "openai/gpt-oss-120b";
const DM_LOW_RESOURCE = {
  uz: true,
};
function dmAiModel() {
  try {
    const m = (window.localStorage.getItem("deutschmaster-ai-model") || "").trim();
    if (m) return m;
  } catch (e) {}
  return DM_DEFAULT_MODEL;
}
function dmNoAiResponse(status, msg) {
  return new Response(
    JSON.stringify({
      error: {
        message: msg,
      },
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}
export async function dmGroqFetch(url, opt) {
  const authHeader =
    (opt && opt.headers && (opt.headers.Authorization || opt.headers.authorization)) || "";
  if (authHeader && dmIsProxyKey(String(authHeader).replace(/^Bearer\s*/i, ""))) {
    if (DM_PROXY_URL) {
      let pres;
      try {
        pres = await fetch(DM_PROXY_URL, {
          ...opt,
          headers: {
            "Content-Type": "application/json",
          },
        });
      } catch (e) {
        return dmNoAiResponse(
          502,
          "Couldn't reach the AI service. Check your connection, or add your own Groq key in the AI Tutor."
        );
      }
      const ct =
        pres.headers && pres.headers.get
          ? String(pres.headers.get("content-type") || "")
          : "application/json";
      if (pres.status === 404 || pres.status === 405 || pres.status === 503 || !/json/i.test(ct))
        return dmNoAiResponse(
          503,
          "The AI service isn't set up yet. Add your own Groq key in the AI Tutor to use AI features."
        );
      return pres;
    }
    if (DM_SHARED_KEY)
      opt = {
        ...opt,
        headers: {
          ...opt.headers,
          Authorization: "Bearer " + DM_SHARED_KEY,
        },
      };
    else return dmNoAiResponse(401, "No Groq API key set. Add your key in the AI Tutor.");
  }
  const custom = dmAiModel();
  if (custom === DM_DEFAULT_MODEL || !opt || typeof opt.body !== "string") return fetch(url, opt);
  let body;
  try {
    body = JSON.parse(opt.body);
  } catch (e) {
    return fetch(url, opt);
  }
  if (!body || body.model !== DM_DEFAULT_MODEL) return fetch(url, opt);
  try {
    const res = await fetch(url, {
      ...opt,
      body: JSON.stringify({
        ...body,
        model: custom,
      }),
    });
    if (res.ok || (res.status !== 400 && res.status !== 404)) return res;
  } catch (e) {}
  return fetch(url, opt);
}
export function dmParseJson(content) {
  let t = String(content == null ? "" : content)
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .trim();
  const fence = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fence) t = fence[1].trim();
  try {
    return JSON.parse(t);
  } catch (e) {
    const a = t.indexOf("{"),
      b = t.lastIndexOf("}");
    if (a >= 0 && b > a) return JSON.parse(t.slice(a, b + 1));
    throw e;
  }
}
export function dmLowResourceNote() {
  const names = [];
  const codes = [currentLearningLangCode];
  try {
    codes.push(window.localStorage.getItem("deutschmaster-native-lang") || "");
  } catch (e) {}
  codes.forEach((c) => {
    if (c && DM_LOW_RESOURCE[c]) {
      const n = getLangName(c);
      if (!names.includes(n)) names.push(n);
    }
  });
  return names.length
    ? "AI accuracy is lower for " +
        names.join(" and ") +
        " — double-check translations and forms before relying on them."
    : "";
}
export function dmHasParadigm(w) {
  return !!(
    w &&
    w.paradigm &&
    w.paradigm.lang === currentLearningLangCode &&
    Array.isArray(w.paradigm.sections) &&
    w.paradigm.sections.length
  );
}
export async function dmFetchParadigm(apiKey, w) {
  const code = currentLearningLangCode;
  const langName = getLangName(code);
  const roman = dmRomanizationEnabled ? ROMAN_LANGS[code] : null;
  const typeName = w.type === "verb" ? "verb" : w.type === "adj" ? "adjective" : "noun";
  const sys = `You are a ${langName} grammar reference engine inside a vocabulary app for learners. The user sends a JSON object with a ${langName} word (dictionary base form), its type and an English gloss. Respond ONLY with a single JSON object (no prose, no markdown fences): {"sections":[{"title":string,"rows":[{"label":string,"value":string}]}]}. Build a compact but genuinely useful table for a learner of ${langName}. VERB: the most important tenses/moods of ${langName} (typically 4-6 sections, for example present, past/preterite, imperfect if it exists, future, conditional or subjunctive if commonly used, imperative); one row per grammatical person/number using the language's own pronouns as labels (for example "yo", "tú", "él / ella"). For languages that conjugate differently (Japanese, Korean, Chinese, Arabic, Hindi, Turkish, Uzbek and so on) use that language's natural paradigm (for example Japanese: dictionary, polite, negative, past, te-form, potential; Chinese: the main aspect and negation patterns such as 了, 过, 没, 在). NOUN: singular and plural forms; if ${langName} has grammatical cases, one section per number with one row per case (label = the case name in English, for example "Nominative"); if the language does not inflect nouns (for example Chinese, Japanese, Korean) give the most useful patterns instead (the measure word or counter, common particles) or {"sections":[]} if nothing useful exists. ADJECTIVE: agreement forms (gender/number) where the language has them, plus comparative and superlative where they exist. RULES: title = short English name of the group, with the native term in parentheses when helpful; label = the pronoun, person or case as printed in a ${langName} textbook; value = the inflected form in ${langName}'s normal script (for compound tenses include the auxiliary); no translations, no explanations, no example sentences; only forms that really exist (omit a row rather than invent one); at most 7 sections and 8 rows per section.${roman ? ` Also add a "roman" key to every row: the ${roman} of that value in Latin letters.` : ""}`;
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
          content: JSON.stringify({
            word: String(w.de || ""),
            type: typeName,
            gender: wordGender(w),
            translation: String(w.en || ""),
          }),
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
  const secs = Array.isArray(parsed && parsed.sections) ? parsed.sections : [];
  const sections = secs
    .slice(0, 7)
    .map((sec) => ({
      title: String((sec && sec.title) || "")
        .trim()
        .slice(0, 60),
      rows: (Array.isArray(sec && sec.rows) ? sec.rows : [])
        .slice(0, 8)
        .map((r) => {
          let v = String(r && r.value != null ? r.value : "").trim();
          const lab = String(r && r.label != null ? r.label : "")
            .trim()
            .slice(0, 40);
          if (!v || !lab) return null;
          const rm = roman && r.roman ? String(r.roman).trim() : "";
          if (rm) v += " (" + rm + ")";
          return {
            label: lab,
            value: v.slice(0, 80),
          };
        })
        .filter(Boolean),
    }))
    .filter((sec) => sec.title && sec.rows.length);
  return {
    lang: code,
    sections,
  };
}
export function dmBuildParadigmQuestions(items, count) {
  const qs = [];
  const globalPool = [];
  const perWord = Math.max(2, Math.min(4, Math.ceil(count / Math.max(1, items.length))));
  items.forEach((it) =>
    it.paradigm.sections.forEach((sec) =>
      sec.rows.forEach((r) =>
        globalPool.push({
          wordId: it.word.id,
          value: r.value,
        })
      )
    )
  );
  shuffle(items).forEach((it) => {
    const w = it.word;
    const secs = it.paradigm.sections.filter((sec) => sec.rows.length >= 2);
    if (!secs.length) return;
    let added = 0;
    for (let k = 0; k < 12 && added < perWord; k++) {
      const sec = secs[Math.floor(Math.random() * secs.length)];
      const row = sec.rows[Math.floor(Math.random() * sec.rows.length)];
      const correct = row.value;
      if (qs.some((q) => q.wordId === w.id && q.correct === correct)) continue;
      let pool = [...new Set(sec.rows.map((r) => r.value).filter((v) => v !== correct))];
      if (pool.length < 3) {
        const more = it.paradigm.sections
          .flatMap((s2) => s2.rows.map((r) => r.value))
          .filter((v) => v !== correct && !pool.includes(v));
        pool = pool.concat([...new Set(more)]);
      }
      if (pool.length < 3) {
        const more = globalPool
          .filter((g) => g.wordId !== w.id && g.value !== correct && !pool.includes(g.value))
          .map((g) => g.value);
        pool = pool.concat([...new Set(more)]);
      }
      const distract = shuffle(pool).slice(0, 3);
      if (!distract.length) continue;
      qs.push({
        wordId: w.id,
        prompt: w.de,
        sub: sec.title + " · " + row.label,
        options: shuffle([correct, ...distract]),
        correct,
      });
      added++;
    }
  });
  return shuffle(qs).slice(0, count);
}
export function dmStripLangArticle(str) {
  let out = stripArticle(str || "");
  const set = ARTICLE_SETS[currentLearningLangCode];
  if (set && currentLearningLangCode !== "de")
    out = out.replace(new RegExp("^(" + set.join("|") + ")\\s+", "i"), "");
  return out;
}
export function dmLookupTerm(data) {
  const lang = currentLearningLangCode;
  const g = String(data.article || data.gender || "").trim();
  let t = data.de || "";
  if (data.type === "noun" && g && !usesGenderTag(lang)) t = g + " " + dmStripLangArticle(data.de);
  else if (data.type === "noun" && g) t = dmStripLangArticle(data.de) + " (" + g + ")";
  if (data.roman) t += "  ·  " + data.roman;
  return t;
}
export function dmLookupPrompt(code, nativeLangName) {
  const langName = getLangName(code);
  const set = GENDER_SETS[code];
  const q = (a) => '"' + a + '"';
  let art;
  if (!set)
    art =
      "article (always an empty string — " + langName + " nouns have no article or gender field)";
  else if (usesGenderTag(code))
    art =
      "article (the grammatical gender tag of the noun, exactly one of " +
      set.map(q).join("/") +
      " — m = masculine, f = feminine, n = neuter — REQUIRED if type is noun, else empty string)";
  else
    art =
      "article (the article used with this noun in " +
      langName +
      ", exactly one of " +
      set.map(q).join("/") +
      " — REQUIRED if type is noun, else empty string)";
  const roman = ROMAN_LANGS[code]
    ? ", roman (REQUIRED for every word: its " +
      ROMAN_LANGS[code] +
      " in Latin letters, never a translation)"
    : "";
  return (
    "You are a " +
    langName +
    " dictionary engine built into a vocabulary app. The user gives you a single " +
    langName +
    " word or short phrase exactly as it appeared inside a sentence (it may be inflected, conjugated or capitalized mid-sentence). Respond ONLY with a single JSON object (no prose, no markdown fences) describing its dictionary base form, with these exact keys: de (the dictionary base form in " +
    langName +
    " — the singular for nouns WITHOUT the article, the infinitive or dictionary form for verbs, the base form for adjectives, or the word itself for other types), en (a concise translation in " +
    nativeLangName +
    '), type (one of "noun", "verb", "adj", "other"), level (CEFR: one of "A1","A2","B1","B2","C1","C2", chosen honestly), ' +
    art +
    ", plural (the bare plural noun if type is noun and " +
    langName +
    " has a plural form, else empty string), praeteritum (a simple past-tense form if type is verb and " +
    langName +
    " has one, else empty string), partizipII (a past-participle form if type is verb and " +
    langName +
    " has one, else empty string), reflexiv (always false), komparativ (empty string if not adj or not gradable), superlativ (empty string if not adj or not gradable)" +
    roman +
    "."
  );
}
export async function dmFetchRomanBatch(apiKey, code, words) {
  const langName = getLangName(code);
  const style = ROMAN_LANGS[code] || "Latin transliteration";
  const input = {};
  words.forEach((t, i) => {
    input[String(i + 1)] = t;
  });
  const sys = `You are a ${langName} transliteration engine. The user sends a JSON object mapping numeric keys to ${langName} words or short phrases. Respond ONLY with a single JSON object with exactly the same keys, where each value is the ${style} of that word in Latin letters (use the standard tone marks or diacritics of that system; never translate; keep phrase word order and spaces).`;
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
          content: JSON.stringify(input),
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
  words.forEach((t, i) => {
    const v = parsed && parsed[String(i + 1)];
    if (typeof v === "string" && v.trim()) out[i] = v.trim();
  });
  return out;
}
