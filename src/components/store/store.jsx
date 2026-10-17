/* components/store/store.jsx
 * Store: word packs, gem packs, purchase flow.
 */

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  GENDER_SETS,
  ROMAN_LANGS,
  DM_DE_FORM_RULES,
  dmNonGermanFieldRule,
  uid,
  usesGenderTag,
} from "../../core/constants";
import { ICON_IDS } from "../../core/icon-registry";
import { LEVELS } from "../../core/srs-and-seed-data";
import { dmGroqFetch, dmParseJson } from "../../services/ai-groq";
import {
  loadOwnedStorePacks,
  loadStorePreview,
  saveOwnedStorePacks,
  saveStorePreview,
} from "../../services/premium-gems-store";
import { IconBtn } from "../common/common";
import { Check, ChevronDown, IconBase, KeyIcon, Loader2, X } from "../icons/icons";
import { GemIcon } from "../icons/settings-icons";
import { getLangName } from "../language-settings/language-settings";
import { stripArticle } from "../word-forms/word-forms";

export const GEM_PACKS = [
  {
    id: "pack_small",
    amount: 100,
    price: "$0.99",
    bonus: null,
  },
  {
    id: "pack_medium",
    amount: 550,
    price: "$4.99",
    bonus: "+10% bonus",
  },
  {
    id: "pack_large",
    amount: 1200,
    price: "$9.99",
    bonus: "+20% bonus",
  },
  {
    id: "pack_mega",
    amount: 2600,
    price: "$19.99",
    bonus: "+30% bonus",
  },
];
export const StoreIcon = (p) => (
  <IconBase {...p}>
    <path d="M4 8 5.2 4h13.6L20 8" />
    <path d="M4 8h16v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8z" />
    <path d="M9 12a3 3 0 0 0 6 0" />
  </IconBase>
);
const STORE_CATEGORIES = [
  "Life & Health",
  "Food & Drink",
  "Travel",
  "Work & Study",
  "Nature",
  "Culture & Life",
  "Safety",
];
function parseStoreLevelRange(str) {
  const parts = String(str || "A1")
    .split("–")
    .map((s) => s.trim())
    .filter(Boolean);
  const first = parts[0] || "A1";
  const last = parts[parts.length - 1] || first;
  const lo = LEVELS.indexOf(first);
  const hi = LEVELS.indexOf(last);
  return [lo < 0 ? 0 : lo, hi < 0 ? (lo < 0 ? 0 : lo) : hi];
}
const STORE_PACKS = [
  {
    id: "health",
    name: "Health & Wellness",
    topic: "health, wellness, the body, illness, doctors and medicine",
    emoji: "🩺",
    count: 20,
    price: 60,
    level: "A2–B1",
    stackIcon: "target",
    category: "Life & Health",
  },
  {
    id: "sport",
    name: "Sports & Fitness",
    topic: "sports, fitness, exercise, competitions and athletes",
    emoji: "⚽",
    count: 20,
    price: 60,
    level: "A2–B1",
    stackIcon: "bolt",
    category: "Life & Health",
  },
  {
    id: "gym",
    name: "Gym & Training",
    topic: "the gym, workouts, strength training and exercise routines",
    emoji: "🏋\ufe0f",
    count: 15,
    price: 45,
    level: "A2–B1",
    stackIcon: "bolt",
    category: "Life & Health",
  },
  {
    id: "food",
    name: "Food & Drink",
    topic: "food, drinks, meals, ingredients and taste",
    emoji: "🍎",
    count: 20,
    price: 55,
    level: "A1–A2",
    stackIcon: "food",
    category: "Food & Drink",
  },
  {
    id: "restaurant",
    name: "Restaurant & Dining",
    topic: "eating out, restaurants, ordering food, waiters and the bill",
    emoji: "🍽\ufe0f",
    count: 18,
    price: 50,
    level: "A2–B1",
    stackIcon: "food",
    category: "Food & Drink",
  },
  {
    id: "cooking",
    name: "Kitchen & Cooking",
    topic: "cooking, kitchen tools, recipes and food preparation",
    emoji: "🍳",
    count: 18,
    price: 50,
    level: "A2–B1",
    stackIcon: "food",
    category: "Food & Drink",
  },
  {
    id: "travel",
    name: "Travel & Tourism",
    topic: "travel, tourism, trips, hotels and sightseeing",
    emoji: "✈\ufe0f",
    count: 20,
    price: 60,
    level: "A2–B1",
    stackIcon: "plane",
    category: "Travel",
  },
  {
    id: "airport",
    name: "Airport & Flying",
    topic: "airports, flights, check-in, luggage and boarding",
    emoji: "🛫",
    count: 15,
    price: 45,
    level: "A2–B1",
    stackIcon: "plane",
    category: "Travel",
  },
  {
    id: "transportation",
    name: "Transportation",
    topic: "transportation, cars, public transport, trains and traffic",
    emoji: "🚗",
    count: 18,
    price: 50,
    level: "A1–A2",
    stackIcon: "plane",
    category: "Travel",
  },
  {
    id: "city",
    name: "City & Places",
    topic: "cities, places, directions and landmarks",
    emoji: "🏙\ufe0f",
    count: 18,
    price: 50,
    level: "A1–A2",
    stackIcon: "plane",
    category: "Travel",
  },
  {
    id: "beach",
    name: "Beach & Summer",
    topic: "the beach, summer, swimming and vacations by the sea",
    emoji: "🏖\ufe0f",
    count: 15,
    price: 40,
    level: "A1–A2",
    stackIcon: "sprout",
    category: "Travel",
  },
  {
    id: "business",
    name: "Business & Work",
    topic: "business, the workplace, jobs, meetings and careers",
    emoji: "💼",
    count: 20,
    price: 65,
    level: "B1–B2",
    stackIcon: "briefcase",
    category: "Work & Study",
  },
  {
    id: "office",
    name: "Office & Meetings",
    topic: "office life, meetings, emails, deadlines and coworkers",
    emoji: "🗂\ufe0f",
    count: 15,
    price: 50,
    level: "B1–B2",
    stackIcon: "briefcase",
    category: "Work & Study",
  },
  {
    id: "jobs",
    name: "Jobs & Professions",
    topic: "jobs, professions, careers and workplaces",
    emoji: "👷",
    count: 18,
    price: 50,
    level: "A2–B1",
    stackIcon: "briefcase",
    category: "Work & Study",
  },
  {
    id: "money",
    name: "Shopping & Money",
    topic: "shopping, money, prices, banking and paying",
    emoji: "🛍\ufe0f",
    count: 18,
    price: 50,
    level: "A1–A2",
    stackIcon: "briefcase",
    category: "Work & Study",
  },
  {
    id: "technology",
    name: "Technology",
    topic: "technology, computers, the internet, apps and gadgets",
    emoji: "💻",
    count: 20,
    price: 65,
    level: "B1–B2",
    stackIcon: "bolt",
    category: "Work & Study",
  },
  {
    id: "science",
    name: "Science",
    topic: "science, experiments, research and discoveries",
    emoji: "🔬",
    count: 18,
    price: 55,
    level: "B1–B2",
    stackIcon: "school",
    category: "Work & Study",
  },
  {
    id: "school",
    name: "School & Education",
    topic: "school, education, studying, exams and university",
    emoji: "🎓",
    count: 20,
    price: 55,
    level: "A2–B1",
    stackIcon: "school",
    category: "Work & Study",
  },
  {
    id: "law",
    name: "Law & Government",
    topic: "law, government, politics and civic life",
    emoji: "🏛\ufe0f",
    count: 18,
    price: 55,
    level: "B1–B2",
    stackIcon: "briefcase",
    category: "Work & Study",
  },
  {
    id: "advanced_business",
    name: "Advanced Business",
    topic: "advanced business, negotiations, finance and corporate strategy",
    emoji: "📈",
    count: 15,
    price: 75,
    level: "C1",
    stackIcon: "briefcase",
    category: "Work & Study",
  },
  {
    id: "nature",
    name: "Nature & Environment",
    topic: "nature, the outdoors, plants, landscapes and the environment",
    emoji: "🌿",
    count: 20,
    price: 55,
    level: "A2–B1",
    stackIcon: "sprout",
    category: "Nature",
  },
  {
    id: "environment",
    name: "Climate & Environment",
    topic: "climate change, sustainability, pollution and the environment",
    emoji: "🌍",
    count: 18,
    price: 55,
    level: "B1–B2",
    stackIcon: "sprout",
    category: "Nature",
  },
  {
    id: "animals",
    name: "Animals",
    topic: "animals, pets and wildlife",
    emoji: "🐾",
    count: 18,
    price: 50,
    level: "A1–A2",
    stackIcon: "sprout",
    category: "Nature",
  },
  {
    id: "weather",
    name: "Weather & Seasons",
    topic: "weather, seasons, temperature and climate",
    emoji: "☀\ufe0f",
    count: 15,
    price: 45,
    level: "A1–A2",
    stackIcon: "sprout",
    category: "Nature",
  },
  {
    id: "winter",
    name: "Winter & Holidays",
    topic: "winter, snow, Christmas and winter holidays",
    emoji: "❄\ufe0f",
    count: 15,
    price: 40,
    level: "A1–A2",
    stackIcon: "sprout",
    category: "Nature",
  },
  {
    id: "family",
    name: "Family & Relationships",
    topic: "family members, relationships and people close to you",
    emoji: "👨\u200d👩\u200d👧",
    count: 18,
    price: 50,
    level: "A1–A2",
    stackIcon: "book",
    category: "Culture & Life",
  },
  {
    id: "relationships",
    name: "Love & Dating",
    topic: "love, dating, relationships and romance",
    emoji: "💕",
    count: 15,
    price: 45,
    level: "A2–B1",
    stackIcon: "book",
    category: "Culture & Life",
  },
  {
    id: "emotions",
    name: "Emotions & Feelings",
    topic: "emotions, feelings and describing moods",
    emoji: "😊",
    count: 18,
    price: 50,
    level: "A1–B1",
    stackIcon: "target",
    category: "Life & Health",
  },
  {
    id: "mentalhealth",
    name: "Mental Health",
    topic: "mental health, stress, therapy and emotional wellbeing",
    emoji: "🧠",
    count: 15,
    price: 55,
    level: "B1–B2",
    stackIcon: "target",
    category: "Life & Health",
  },
  {
    id: "body",
    name: "Human Body",
    topic: "the human body, body parts and anatomy",
    emoji: "🫀",
    count: 18,
    price: 50,
    level: "A1–A2",
    stackIcon: "target",
    category: "Life & Health",
  },
  {
    id: "clothing",
    name: "Clothing & Fashion",
    topic: "clothing, fashion, accessories and getting dressed",
    emoji: "👗",
    count: 18,
    price: 50,
    level: "A1–A2",
    stackIcon: "target",
    category: "Culture & Life",
  },
  {
    id: "home",
    name: "Home & Furniture",
    topic: "the home, rooms, furniture and household items",
    emoji: "🏠",
    count: 18,
    price: 50,
    level: "A1–A2",
    stackIcon: "book",
    category: "Culture & Life",
  },
  {
    id: "music",
    name: "Music & Art",
    topic: "music, art, instruments and creativity",
    emoji: "🎨",
    count: 18,
    price: 50,
    level: "A2–B1",
    stackIcon: "book",
    category: "Culture & Life",
  },
  {
    id: "hobbies",
    name: "Hobbies & Leisure",
    topic: "hobbies, leisure activities and free time",
    emoji: "🎮",
    count: 18,
    price: 50,
    level: "A1–A2",
    stackIcon: "target",
    category: "Culture & Life",
  },
  {
    id: "numbers",
    name: "Numbers & Time",
    topic: "numbers, time, dates and schedules",
    emoji: "⏰",
    count: 15,
    price: 40,
    level: "A1",
    stackIcon: "target",
    category: "Culture & Life",
  },
  {
    id: "colors",
    name: "Colors & Shapes",
    topic: "colors, shapes and basic descriptions",
    emoji: "🌈",
    count: 12,
    price: 35,
    level: "A1",
    stackIcon: "target",
    category: "Culture & Life",
  },
  {
    id: "holidays",
    name: "Holidays & Celebrations",
    topic: "holidays, celebrations, festivals and parties",
    emoji: "🎉",
    count: 15,
    price: 45,
    level: "A2–B1",
    stackIcon: "book",
    category: "Culture & Life",
  },
  {
    id: "idioms",
    name: "Idioms & Expressions",
    topic: "common idioms, sayings and figurative expressions",
    emoji: "💬",
    count: 15,
    price: 70,
    level: "B2–C1",
    stackIcon: "target",
    category: "Culture & Life",
  },
  {
    id: "emergency",
    name: "Emergency & Safety",
    topic: "emergencies, safety, accidents and calling for help",
    emoji: "🚨",
    count: 15,
    price: 45,
    level: "A2–B1",
    stackIcon: "target",
    category: "Safety",
  },
];
export function StoreView({
  onClose,
  stacks,
  onCreateStack,
  onAddWordsToStack,
  gemsBalance,
  onSpendGems,
  onAddGems,
  apiKey,
  onOpenAI,
  nativeLanguage,
  learningLanguage,
  onOpenPremium,
}) {
  const learnLangName = getLangName(learningLanguage || "de");
  const nativeLangName = getLangName(nativeLanguage || "en");
  const isLearningGerman = (learningLanguage || "de") === "de";
  const [buyingId, setBuyingId] = useState(null);
  const [notice, setNotice] = useState("");
  const [closing, setClosing] = useState(false);
  const [ownedIds, setOwnedIds] = useState(() =>
    loadOwnedStorePacks(learningLanguage, nativeLanguage)
  );
  const [themeFilter, setThemeFilter] = useState("All");
  const [levelFilter, setLevelFilter] = useState("All");
  const [sizeFilter, setSizeFilter] = useState("All");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const [previewWords, setPreviewWords] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const noticeTimer = useRef(null);
  const stacksRef = useRef(stacks || []);
  useEffect(() => {
    stacksRef.current = stacks || [];
  }, [stacks]);
  useEffect(() => {
    setOwnedIds(loadOwnedStorePacks(learningLanguage, nativeLanguage));
  }, [learningLanguage, nativeLanguage]);
  useEffect(
    () => () => {
      if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    },
    []
  );
  useEffect(() => {
    const pack = STORE_PACKS.find((p) => p.id === detailId) || null;
    if (!pack) {
      setPreviewWords(null);
      setPreviewLoading(false);
      return;
    }
    const cached = loadStorePreview(pack.id, learningLanguage, nativeLanguage);
    if (cached) {
      setPreviewWords(cached);
      setPreviewLoading(false);
      return;
    }
    setPreviewWords(null);
    if (!apiKey) return;
    let cancelled = false;
    setPreviewLoading(true);
    (async () => {
      try {
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
                content: `Give exactly 3 short, representative ${getLangName(learningLanguage || "de")} example words or short phrases (with their ${getLangName(nativeLanguage || "en")} translation) from this vocabulary topic: ${pack.topic}. Nouns with no leading article. Respond ONLY with a JSON object of the exact shape {"words": [{"de": "...", "en": "..."}]} and nothing else.`,
              },
            ],
            temperature: 0.4,
            max_tokens: 300,
            response_format: {
              type: "json_object",
            },
          }),
        });
        if (!res.ok) throw new Error("preview request failed");
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        const parsed = dmParseJson(content);
        const list = (Array.isArray(parsed.words) ? parsed.words : [])
          .slice(0, 3)
          .map((w) => ({
            de: String(w?.de || "").trim(),
            en: String(w?.en || "").trim(),
          }))
          .filter((w) => w.de);
        if (!cancelled && list.length) {
          setPreviewWords(list);
          saveStorePreview(pack.id, learningLanguage, nativeLanguage, list);
        }
      } catch (e) {
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [detailId, apiKey, learningLanguage, nativeLanguage]);
  const showNotice = (msg) => {
    setNotice(msg);
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(""), 3200);
  };
  const closeWithAnim = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(() => onClose(), 240);
  };
  const toBool = (v) => v === true || v === "true" || v === 1 || v === "1";
  const getEffective = (pack) => {
    if (sizeFilter === "10" || sizeFilter === "20") {
      const desired = parseInt(sizeFilter, 10);
      const pricePerWord = pack.price / pack.count;
      const price = Math.max(15, Math.round((pricePerWord * desired) / 5) * 5);
      return {
        count: desired,
        price,
      };
    }
    return {
      count: pack.count,
      price: pack.price,
    };
  };
  const filteredPacks = useMemo(() => {
    const levelIdx = levelFilter === "All" ? -1 : LEVELS.indexOf(levelFilter);
    return STORE_PACKS.filter((pack) => {
      if (themeFilter !== "All" && pack.category !== themeFilter) return false;
      if (levelIdx >= 0) {
        const [lo, hi] = parseStoreLevelRange(pack.level);
        if (levelIdx < lo || levelIdx > hi) return false;
      }
      return true;
    });
  }, [themeFilter, levelFilter]);
  const detailPack = STORE_PACKS.find((p) => p.id === detailId) || null;
  const generatePackWords = async (pack, countOverride) => {
    const count = countOverride || getEffective(pack).count;
    const grammarRule = isLearningGerman
      ? `Grammar fields are mandatory: for a noun, set article to its TRUE grammatical gender (der/die/das) in the singular, and always include the bare plural (no article). For a verb, always give praeteritum, partizipII, and set trennbar/reflexiv (true/false) correctly — whenever reflexiv is true, the 'de' field must include the leading "sich " (e.g. "sich freuen"). For a gradable adjective, always give komparativ and superlativ. Mix der/die/das genders realistically and mix nouns/verbs/adjectives rather than only nouns. ${DM_DE_FORM_RULES}`
      : `${dmNonGermanFieldRule(learningLanguage || "de", learnLangName)} Use 'plural' for the plural/base form where ${learnLangName} has one, else leave it empty. Use 'praeteritum' for a simple past-tense form if ${learnLangName} has one and 'partizipII' for a past-participle form if it has one, else leave those empty. For a gradable adjective, give komparativ and superlativ in ${learnLangName} if that concept exists there. Mix nouns/verbs/adjectives naturally.`;
    const sysPrompt =
      `You are a vocabulary generator built into a language-learning app called wwordy. Generate exactly ${count} ${learnLangName} vocabulary flashcards about the topic: ${pack.topic}. The words must be genuinely about that topic and useful for a learner, with no duplicates or near-duplicates. Target CEFR difficulty range: ${pack.level}. Respond ONLY with a single JSON object (no prose, no markdown fences) of the exact shape {"words": [...]} where each array item has these exact keys: de (the ${learnLangName} word/phrase, in dictionary base form — nominative singular for nouns with no article, infinitive for verbs, positive form for adjectives), en (the translation in ${nativeLangName}), type (one of "noun", "verb", "adj", "other"), level (CEFR: one of "A1","A2","B1","B2","C1","C2", chosen honestly), article, plural, praeteritum, partizipII, trennbar, reflexiv, komparativ, superlativ${ROMAN_LANGS[learningLanguage || "de"] ? ", roman" : ""}. ` +
      grammarRule +
      " Never leave a grammar field blank when it's required by the type and applicable to " +
      learnLangName +
      ".";
    let data = null;
    let lastErrMsg = "";
    for (let attempt = 0; attempt < 3 && !data; attempt++) {
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
              content: `Generate the ${pack.name} pack now.`,
            },
          ],
          temperature: 0.5,
          max_tokens: 4096,
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
        lastErrMsg = msg;
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
          continue;
        }
        throw new Error(msg);
      }
      data = await res.json();
    }
    if (!data) throw new Error(lastErrMsg || "Request failed after retries.");
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("(no response)");
    let parsed;
    try {
      parsed = dmParseJson(content);
    } catch (e) {
      throw new Error("Couldn't parse the generated words. Try again.");
    }
    const rawList = Array.isArray(parsed.words)
      ? parsed.words
      : Array.isArray(parsed)
        ? parsed
        : [];
    if (!rawList.length) throw new Error("No words were generated. Try again.");
    const existingStack = (stacksRef.current || []).find(
      (s) => (s.name || "").toLowerCase() === pack.name.toLowerCase()
    );
    const existingKeys = new Set(
      (existingStack ? existingStack.words : []).map((w) =>
        stripArticle(w.de || "")
          .toLowerCase()
          .replace(/^sich\s+/, "")
      )
    );
    const seen = new Set();
    const newWords = [];
    rawList.forEach((raw) => {
      if (!raw || !raw.de) return;
      let type = ["noun", "verb", "adj", "other"].includes(raw.type) ? raw.type : "other";
      const rawDe = String(raw.de).trim();
      if (!rawDe) return;
      const bareDe = stripArticle(rawDe);
      let article =
        type === "noun" &&
        (GENDER_SETS[learningLanguage || "de"] || []).includes(
          String(raw.article || "")
            .toLowerCase()
            .trim()
        )
          ? String(raw.article).toLowerCase().trim()
          : "";
      let pluralValue = type === "noun" ? stripArticle(raw.plural || "") : "";
      const isReflexivVerb = type === "verb" ? toBool(raw.reflexiv) : false;
      let de = type === "noun" && article && isLearningGerman ? `${article} ${bareDe}` : rawDe;
      if (type === "verb" && isReflexivVerb && !/^sich\s/i.test(de)) de = `sich ${de}`;
      const key = bareDe.toLowerCase().replace(/^sich\s+/, "");
      if (!key || seen.has(key) || existingKeys.has(key)) return;
      seen.add(key);
      newWords.push({
        id: uid(),
        de,
        en: raw.en || "",
        type,
        level: LEVELS.includes(raw.level) ? raw.level : "",
        article: type === "noun" && !usesGenderTag(learningLanguage || "de") ? article : "",
        gender: type === "noun" && usesGenderTag(learningLanguage || "de") ? article : "",
        roman: ROMAN_LANGS[learningLanguage || "de"] ? String(raw.roman || "").trim() : "",
        plural: type === "noun" ? pluralValue : "",
        praeteritum: raw.praeteritum || "",
        partizipII: raw.partizipII || "",
        trennbar: type === "verb" ? toBool(raw.trennbar) : false,
        reflexiv: isReflexivVerb,
        komparativ: type === "adj" ? raw.komparativ || "" : "",
        superlativ: type === "adj" ? raw.superlativ || "" : "",
        favorite: false,
        srs: {
          level: 0,
          next: Date.now(),
          correct: 0,
          wrong: 0,
        },
      });
    });
    if (!newWords.length)
      throw new Error("Those words are already in your stack — try a different pack.");
    if (existingStack) {
      onAddWordsToStack(existingStack.id, newWords);
      stacksRef.current = stacksRef.current.map((s) =>
        s.id === existingStack.id
          ? {
              ...s,
              words: [...s.words, ...newWords],
            }
          : s
      );
    } else {
      const newStack = {
        id: uid(),
        name: pack.name,
        emoji: ICON_IDS.includes(pack.stackIcon)
          ? pack.stackIcon
          : ICON_IDS[Math.floor(Math.random() * ICON_IDS.length)],
        words: newWords,
      };
      stacksRef.current = [newStack, ...stacksRef.current];
      onCreateStack(newStack);
    }
    setOwnedIds((prev) => {
      const next = prev.includes(pack.id) ? prev : [...prev, pack.id];
      saveOwnedStorePacks(learningLanguage, nativeLanguage, next);
      return next;
    });
    return {
      addedCount: newWords.length,
    };
  };
  const buyPack = async (pack) => {
    if (buyingId) return false;
    if (!apiKey) {
      showNotice(
        "Add a Groq API key in the AI Tutor first — the Store uses it to write your words."
      );
      return false;
    }
    const effective = getEffective(pack);
    if ((gemsBalance || 0) < effective.price) {
      showNotice(`Not enough gems — you need ${effective.price}.`);
      return false;
    }
    setBuyingId(pack.id);
    try {
      const result = await generatePackWords(pack, effective.count);
      const spendOk = onSpendGems(effective.price);
      if (!spendOk) {
        showNotice("Not enough gems.");
        return false;
      }
      showNotice(
        `+${result.addedCount} ${learnLangName} word${result.addedCount === 1 ? "" : "s"} added to "${pack.name}"!`
      );
      return true;
    } catch (e) {
      console.error("Store buyPack failed:", e);
      showNotice(e && e.message ? e.message : "Something went wrong. Try again.");
      return false;
    } finally {
      setBuyingId(null);
    }
  };
  const buyBundle = async (categoryName) => {
    if (buyingId) return;
    if (!apiKey) {
      onOpenAI && onOpenAI();
      return;
    }
    const packsInCat = STORE_PACKS.filter((p) => p.category === categoryName);
    if (packsInCat.length < 2) return;
    const individualTotal = packsInCat.reduce((sum, p) => sum + getEffective(p).price, 0);
    const bundlePrice = Math.max(25, Math.round((individualTotal * 0.8) / 5) * 5);
    if ((gemsBalance || 0) < bundlePrice) {
      showNotice(`Not enough gems for the bundle — you need ${bundlePrice}.`);
      return;
    }
    const bundleId = `bundle:${categoryName}`;
    setBuyingId(bundleId);
    const spendOk = onSpendGems(bundlePrice);
    if (!spendOk) {
      showNotice("Not enough gems.");
      setBuyingId(null);
      return;
    }
    let successCount = 0;
    let addedWords = 0;
    for (const p of packsInCat) {
      try {
        const result = await generatePackWords(p);
        successCount++;
        addedWords += result.addedCount;
      } catch (e) {
        console.error("Bundle pack failed:", p.id, e);
      }
    }
    setBuyingId(null);
    if (!successCount) {
      onAddGems && onAddGems(bundlePrice);
      showNotice("Bundle failed — gems refunded.");
    } else {
      showNotice(
        `${categoryName} bundle unlocked — ${successCount}/${packsInCat.length} packs, +${addedWords} words!`
      );
    }
  };
  return (
    <div
      className={`dm-modal-backdrop ${closing ? "dm-modal-backdrop-closing" : ""}`}
      onClick={closeWithAnim}
    >
      <div
        className={`dm-modal dm-store-modal ${closing ? "dm-modal-closing" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dm-modal-head">
          <h3 className="dm-ai-title">
            <StoreIcon size={18} />
            {" Store"}
          </h3>
          <IconBtn onClick={closeWithAnim}>
            <X size={18} />
          </IconBtn>
        </div>
        <p className="dm-store-sub">{`Ready-made ${learnLangName} word packs by topic, translated into ${nativeLangName}.`}</p>
        <div
          className={`dm-premium-notice dm-store-notice-top ${notice && !detailPack ? "dm-premium-notice-show" : ""}`}
        >
          {notice || "\xA0"}
        </div>
        <div className="dm-gems-balance-card dm-store-gems-card">
          <GemIcon size={24} className="dm-gems-balance-icon" />
          <div className="dm-gems-balance-text">
            <span className="dm-gems-balance-value">{(gemsBalance || 0).toLocaleString()}</span>
            <span className="dm-gems-balance-label">Gems available</span>
          </div>
          <button
            type="button"
            className="dm-btn-secondary dm-store-getgems-btn"
            onClick={() => onOpenPremium && onOpenPremium()}
          >
            Get more
          </button>
        </div>
        {!apiKey && (
          <p
            className="dm-settings-hint dm-autofill-hint dm-store-key-hint"
            onClick={() => onOpenAI && onOpenAI()}
          >
            Add a Groq API key in the AI Tutor to unlock the Store.
          </p>
        )}
        <button
          type="button"
          className={`dm-store-filters-toggle${filtersOpen ? " dm-store-filters-toggle-open" : ""}`}
          aria-expanded={filtersOpen}
          onClick={() => setFiltersOpen((o) => !o)}
        >
          <span className="dm-store-filters-label">Filters</span>
          <span className="dm-store-filters-summary">
            {(() => {
              const parts = [
                themeFilter !== "All" ? themeFilter : null,
                levelFilter !== "All" ? levelFilter : null,
                sizeFilter !== "All" ? `${sizeFilter} words` : null,
              ].filter(Boolean);
              return parts.length ? parts.join(" · ") : "All packs";
            })()}
          </span>
          <ChevronDown size={16} className="dm-store-filters-chevron" />
        </button>
        {filtersOpen && (
          <>
            <div className="dm-store-filter-group">
              <div className="dm-store-filter-label">Theme</div>
              <div className="dm-family-filter-row dm-store-theme-row">
                <button
                  key="all"
                  type="button"
                  className={`dm-family-chip ${themeFilter === "All" ? "dm-family-chip-active" : ""}`}
                  onClick={() => setThemeFilter("All")}
                >
                  All
                </button>
                {STORE_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`dm-family-chip ${themeFilter === cat ? "dm-family-chip-active" : ""}`}
                    onClick={() => setThemeFilter(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div className="dm-store-filter-group">
              <div className="dm-store-filter-label">Level</div>
              <div className="dm-segmented dm-store-level-segmented">
                {["All", ...LEVELS.slice(0, 5)].map((lv) => (
                  <button
                    key={lv}
                    type="button"
                    className={`dm-seg ${levelFilter === lv ? "dm-seg-active" : ""}`}
                    onClick={() => setLevelFilter(lv)}
                  >
                    {lv}
                  </button>
                ))}
              </div>
            </div>
            <div className="dm-store-filter-group">
              <div className="dm-store-filter-label">Words per stack</div>
              <div className="dm-segmented dm-store-size-segmented">
                {[
                  {
                    v: "All",
                    l: "Default",
                  },
                  {
                    v: "10",
                    l: "10 words",
                  },
                  {
                    v: "20",
                    l: "20 words",
                  },
                ].map((opt) => (
                  <button
                    key={opt.v}
                    type="button"
                    className={`dm-seg ${sizeFilter === opt.v ? "dm-seg-active" : ""}`}
                    onClick={() => setSizeFilter(opt.v)}
                  >
                    {opt.l}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
        {themeFilter !== "All" &&
          (() => {
            const packsInCat = STORE_PACKS.filter((p) => p.category === themeFilter);
            if (packsInCat.length < 2) return null;
            const individualTotal = packsInCat.reduce((sum, p) => sum + getEffective(p).price, 0);
            const bundlePrice = Math.max(25, Math.round((individualTotal * 0.8) / 5) * 5);
            const bundleId = `bundle:${themeFilter}`;
            const bundling = buyingId === bundleId;
            return (
              <div className="dm-store-bundle-banner">
                <div className="dm-store-bundle-text">
                  <div className="dm-store-bundle-title">{`${themeFilter} Bundle`}</div>
                  <div className="dm-store-bundle-sub">{`All ${packsInCat.length} packs in this theme · save 20%`}</div>
                </div>
                <button
                  type="button"
                  className="dm-store-bundle-btn"
                  disabled={bundling}
                  onClick={() => buyBundle(themeFilter)}
                >
                  {bundling ? (
                    <Loader2 size={13} className="dm-autofill-spin" />
                  ) : (
                    <GemIcon size={13} />
                  )}
                  {bundling ? (
                    " Unlocking…"
                  ) : (
                    <>
                      {` ${bundlePrice} `}
                      <span className="dm-store-bundle-strike">{individualTotal}</span>
                    </>
                  )}
                </button>
              </div>
            );
          })()}
        {filteredPacks.length === 0 && (
          <p className="dm-settings-hint dm-store-empty-hint">
            No packs match these filters — try a different theme or level.
          </p>
        )}
        <div className="dm-store-grid">
          {filteredPacks.map((pack, i) => {
            const effective = getEffective(pack);
            const owned = ownedIds.includes(pack.id);
            const buying = buyingId === pack.id;
            const affordable = (gemsBalance || 0) >= effective.price;
            return (
              <div
                key={pack.id}
                className={`dm-store-card ${!affordable ? "dm-store-card-locked" : ""}`}
                style={{
                  animationDelay: `${Math.min(i, 12) * 0.035}s`,
                }}
                onClick={() => setDetailId(pack.id)}
                role="button"
                tabIndex={0}
              >
                {owned && (
                  <div className="dm-store-owned-badge">
                    <Check size={10} />
                    {" Owned"}
                  </div>
                )}
                <div className="dm-store-emoji">{pack.emoji}</div>
                <div className="dm-store-name">{pack.name}</div>
                <div className="dm-store-meta">{`${effective.count} words · ${pack.level}`}</div>
                <button
                  type="button"
                  className="dm-store-buy-btn"
                  disabled={buying}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!apiKey) {
                      onOpenAI && onOpenAI();
                      return;
                    }
                    buyPack(pack);
                  }}
                >
                  {buying ? (
                    <Loader2 size={13} className="dm-autofill-spin" />
                  ) : !apiKey ? (
                    <KeyIcon size={13} />
                  ) : (
                    <GemIcon size={13} />
                  )}
                  {!apiKey ? " Add key" : ` ${effective.price}`}
                </button>
              </div>
            );
          })}
        </div>
        <p className="dm-settings-hint dm-premium-footnote">
          Words are generated for your current native → learning language pair. Gem purchases are a
          free preview — nothing is charged.
        </p>
      </div>
      {detailPack && (
        <div
          className="dm-modal-backdrop dm-store-detail-backdrop"
          onClick={(e) => {
            e.stopPropagation();
            setDetailId(null);
          }}
        >
          <div className="dm-modal dm-store-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dm-modal-head">
              <h3 className="dm-ai-title dm-store-detail-title">
                <span className="dm-store-detail-emoji">{detailPack.emoji}</span> {detailPack.name}
              </h3>
              <IconBtn onClick={() => setDetailId(null)}>
                <X size={18} />
              </IconBtn>
            </div>
            <div
              className={`dm-premium-notice dm-store-notice-top ${notice ? "dm-premium-notice-show" : ""}`}
            >
              {notice || "\xA0"}
            </div>
            <div className="dm-store-detail-badges">
              <span className="dm-store-detail-tag">{detailPack.category}</span>
              <span className="dm-store-detail-tag">{detailPack.level}</span>
              {ownedIds.includes(detailPack.id) && (
                <span className="dm-store-detail-tag dm-store-detail-tag-owned">
                  <Check size={10} />
                  {" Owned"}
                </span>
              )}
            </div>
            <p className="dm-store-detail-desc">{`A ${getEffective(detailPack).count}-word ${learnLangName} pack covering ${detailPack.topic}, translated into ${nativeLangName}.`}</p>
            {ownedIds.includes(detailPack.id) && (
              <p className="dm-store-detail-owned-hint">
                You already own this pack — buying again adds fresh words to the same stack,
                skipping any duplicates.
              </p>
            )}
            <div className="dm-store-preview">
              <div className="dm-store-preview-label">Preview</div>
              {previewLoading ? (
                <div className="dm-store-preview-loading">
                  <Loader2 size={13} className="dm-autofill-spin" />
                  {" Loading examples…"}
                </div>
              ) : previewWords && previewWords.length ? (
                <div className="dm-store-preview-list">
                  {previewWords.map((w, i) => (
                    <div key={i} className="dm-store-preview-chip">
                      <span className="dm-store-preview-de">{w.de}</span>
                      <span className="dm-store-preview-en">{w.en}</span>
                    </div>
                  ))}
                </div>
              ) : !apiKey ? (
                <p className="dm-store-preview-hint">Add a Groq API key to see example words.</p>
              ) : (
                <p className="dm-store-preview-hint">Preview unavailable right now.</p>
              )}
            </div>
            <div className="dm-store-detail-price-row">
              <GemIcon size={22} />
              <span className="dm-store-detail-price">{getEffective(detailPack).price}</span>
              <span className="dm-store-detail-price-label">gems</span>
            </div>
            {!apiKey ? (
              <button
                type="button"
                className="dm-btn-primary dm-store-detail-buy-btn"
                onClick={() => onOpenAI && onOpenAI()}
              >
                <KeyIcon size={15} />
                {" Add a Groq API key to unlock"}
              </button>
            ) : (gemsBalance || 0) < getEffective(detailPack).price ? (
              <>
                <p className="dm-settings-hint dm-store-detail-short-hint">{`You have ${(gemsBalance || 0).toLocaleString()} gems.`}</p>
                <button
                  type="button"
                  className="dm-btn-primary dm-store-detail-buy-btn"
                  onClick={() => onOpenPremium && onOpenPremium()}
                >
                  <GemIcon size={15} />
                  {" Get more gems"}
                </button>
              </>
            ) : (
              <button
                type="button"
                className="dm-btn-primary dm-store-detail-buy-btn"
                disabled={buyingId === detailPack.id}
                onClick={async () => {
                  const ok = await buyPack(detailPack);
                  if (ok) setDetailId(null);
                }}
              >
                {buyingId === detailPack.id ? (
                  <Loader2 size={15} className="dm-autofill-spin" />
                ) : (
                  <GemIcon size={15} />
                )}
                {` Buy for ${getEffective(detailPack).price} gems`}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
