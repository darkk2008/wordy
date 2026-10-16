/* core/srs-and-seed-data.js
 * Spaced repetition, level/article reference data, seed words, loadData/saveData.
 */

import { DAY, SRS_STEPS, todayStr, uid } from "./constants";

export function bumpSrs(word, correct) {
  const srs = word.srs || {
    level: 0,
    next: Date.now(),
    correct: 0,
    wrong: 0,
  };
  let level = srs.level;
  if (correct) level = Math.min(level + 1, SRS_STEPS.length - 1);
  else level = 0;
  let miss = srs.miss || 0;
  let streak = srs.streak || 0;
  let hard = isHardWord(word);
  if (correct) {
    streak += 1;
    if (hard && streak >= 3) {
      hard = false;
      miss = 0;
    }
  } else {
    streak = 0;
    miss += 1;
    if (miss >= 2) hard = true;
  }
  return {
    level,
    next: Date.now() + SRS_STEPS[level] * DAY,
    correct: srs.correct + (correct ? 1 : 0),
    wrong: srs.wrong + (correct ? 0 : 1),
    miss,
    streak,
    hard,
  };
}
export function isHardWord(w) {
  const s = w && w.srs;
  if (!s) return false;
  if (typeof s.hard === "boolean") return s.hard;
  return (s.wrong || 0) >= 2 && (s.wrong || 0) > (s.correct || 0);
}
export const ARTICLE_COLOR = {
  der: "#5B9DFF",
  die: "#FF6FA8",
  das: "#43D9A3",
  el: "#5B9DFF",
  la: "#FF6FA8",
  le: "#5B9DFF",
  il: "#5B9DFF",
  o: "#5B9DFF",
  a: "#FF6FA8",
  de: "#5B9DFF",
  het: "#43D9A3",
  en: "#5B9DFF",
  ett: "#43D9A3",
  m: "#5B9DFF",
  f: "#FF6FA8",
  n: "#43D9A3",
};
export const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const NOUN_REFERENCE = {
  tisch: {
    article: "der",
    plural: "Tische",
  },
  stuhl: {
    article: "der",
    plural: "Stühle",
  },
  haus: {
    article: "das",
    plural: "Häuser",
  },
  auto: {
    article: "das",
    plural: "Autos",
  },
  buch: {
    article: "das",
    plural: "Bücher",
  },
  familie: {
    article: "die",
    plural: "Familien",
  },
  schule: {
    article: "die",
    plural: "Schulen",
  },
  mutter: {
    article: "die",
    plural: "Mütter",
  },
  vater: {
    article: "der",
    plural: "Väter",
  },
  bruder: {
    article: "der",
    plural: "Brüder",
  },
  schwester: {
    article: "die",
    plural: "Schwestern",
  },
  kind: {
    article: "das",
    plural: "Kinder",
  },
  frau: {
    article: "die",
    plural: "Frauen",
  },
  mann: {
    article: "der",
    plural: "Männer",
  },
  freund: {
    article: "der",
    plural: "Freunde",
  },
  freundin: {
    article: "die",
    plural: "Freundinnen",
  },
  tag: {
    article: "der",
    plural: "Tage",
  },
  jahr: {
    article: "das",
    plural: "Jahre",
  },
  woche: {
    article: "die",
    plural: "Wochen",
  },
  monat: {
    article: "der",
    plural: "Monate",
  },
  zeit: {
    article: "die",
    plural: "Zeiten",
  },
  stadt: {
    article: "die",
    plural: "Städte",
  },
  land: {
    article: "das",
    plural: "Länder",
  },
  welt: {
    article: "die",
    plural: "Welten",
  },
  wasser: {
    article: "das",
    plural: "Wasser",
  },
  essen: {
    article: "das",
    plural: "Essen",
  },
  brot: {
    article: "das",
    plural: "Brote",
  },
  milch: {
    article: "die",
    plural: "—",
  },
  kaffee: {
    article: "der",
    plural: "Kaffees",
  },
  arbeit: {
    article: "die",
    plural: "Arbeiten",
  },
  geld: {
    article: "das",
    plural: "Gelder",
  },
  "haus tier": {
    article: "das",
    plural: "Haustiere",
  },
  hund: {
    article: "der",
    plural: "Hunde",
  },
  katze: {
    article: "die",
    plural: "Katzen",
  },
  tier: {
    article: "das",
    plural: "Tiere",
  },
  auge: {
    article: "das",
    plural: "Augen",
  },
  hand: {
    article: "die",
    plural: "Hände",
  },
  fuß: {
    article: "der",
    plural: "Füße",
  },
  kopf: {
    article: "der",
    plural: "Köpfe",
  },
  zimmer: {
    article: "das",
    plural: "Zimmer",
  },
  fenster: {
    article: "das",
    plural: "Fenster",
  },
  tur: {
    article: "die",
    plural: "Türen",
  },
  tür: {
    article: "die",
    plural: "Türen",
  },
  straße: {
    article: "die",
    plural: "Straßen",
  },
  flughafen: {
    article: "der",
    plural: "Flughäfen",
  },
  fahrkarte: {
    article: "die",
    plural: "Fahrkarten",
  },
  gepäck: {
    article: "das",
    plural: "—",
  },
  sprache: {
    article: "die",
    plural: "Sprachen",
  },
  wort: {
    article: "das",
    plural: "Wörter",
  },
  satz: {
    article: "der",
    plural: "Sätze",
  },
  frage: {
    article: "die",
    plural: "Fragen",
  },
  antwort: {
    article: "die",
    plural: "Antworten",
  },
  lehrer: {
    article: "der",
    plural: "Lehrer",
  },
  lehrerin: {
    article: "die",
    plural: "Lehrerinnen",
  },
  schuler: {
    article: "der",
    plural: "Schüler",
  },
  schüler: {
    article: "der",
    plural: "Schüler",
  },
  arzt: {
    article: "der",
    plural: "Ärzte",
  },
  krankenhaus: {
    article: "das",
    plural: "Krankenhäuser",
  },
  restaurant: {
    article: "das",
    plural: "Restaurants",
  },
  geschäft: {
    article: "das",
    plural: "Geschäfte",
  },
  supermarkt: {
    article: "der",
    plural: "Supermarkte",
  },
  zug: {
    article: "der",
    plural: "Züge",
  },
  bus: {
    article: "der",
    plural: "Busse",
  },
  flugzeug: {
    article: "das",
    plural: "Flugzeuge",
  },
  buro: {
    article: "das",
    plural: "Büros",
  },
  büro: {
    article: "das",
    plural: "Büros",
  },
};
export function checkNounReference(deBare) {
  const key = (deBare || "").trim().toLowerCase();
  return NOUN_REFERENCE[key] || null;
}
const ADJ_REFERENCE = {
  gut: {
    komparativ: "besser",
    superlativ: "am besten",
  },
  viel: {
    komparativ: "mehr",
    superlativ: "am meisten",
  },
  gern: {
    komparativ: "lieber",
    superlativ: "am liebsten",
  },
  hoch: {
    komparativ: "höher",
    superlativ: "am höchsten",
  },
  nah: {
    komparativ: "näher",
    superlativ: "am nächsten",
  },
  groß: {
    komparativ: "größer",
    superlativ: "am größten",
  },
  dunkel: {
    komparativ: "dunkler",
    superlativ: "am dunkelsten",
  },
  teuer: {
    komparativ: "teurer",
    superlativ: "am teuersten",
  },
  sauer: {
    komparativ: "saurer",
    superlativ: "am sauersten",
  },
  edel: {
    komparativ: "edler",
    superlativ: "am edelsten",
  },
  wenig: {
    komparativ: "weniger",
    superlativ: "am wenigsten",
  },
  alt: {
    komparativ: "älter",
    superlativ: "am ältesten",
  },
  jung: {
    komparativ: "jünger",
    superlativ: "am jüngsten",
  },
  kalt: {
    komparativ: "kälter",
    superlativ: "am kältesten",
  },
  warm: {
    komparativ: "wärmer",
    superlativ: "am wärmsten",
  },
  lang: {
    komparativ: "länger",
    superlativ: "am längsten",
  },
  kurz: {
    komparativ: "kürzer",
    superlativ: "am kürzesten",
  },
  stark: {
    komparativ: "stärker",
    superlativ: "am stärksten",
  },
  schwach: {
    komparativ: "schwächer",
    superlativ: "am schwächsten",
  },
  klug: {
    komparativ: "klüger",
    superlativ: "am klügsten",
  },
  arm: {
    komparativ: "ärmer",
    superlativ: "am ärmsten",
  },
  scharf: {
    komparativ: "schärfer",
    superlativ: "am schärfsten",
  },
  grob: {
    komparativ: "gröber",
    superlativ: "am gröbsten",
  },
  gesund: {
    komparativ: "gesünder",
    superlativ: "am gesündesten",
  },
};
export function checkAdjReference(deBare) {
  const key = (deBare || "").trim().toLowerCase();
  return ADJ_REFERENCE[key] || null;
}
export const LEVEL_COLOR = {
  A1: "#43D9A3",
  A2: "#6EE7F9",
  B1: "#5B9DFF",
  B2: "#C7A6FF",
  C1: "#FFB020",
  C2: "#FF6FA8",
};
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const SEED_WORD_BANK = {
  house: {
    en: "house",
    de: "Haus",
    es: "casa",
    fr: "maison",
    it: "casa",
    pt: "casa",
    nl: "huis",
    pl: "dom",
    sv: "hus",
    tr: "ev",
    ru: "дом",
    uk: "дім",
    uz: "uy",
    ar: "بيت",
    hi: "घर",
    zh: "房子",
    ja: "家",
    ko: "집",
  },
  cat: {
    en: "cat",
    de: "Katze",
    es: "gato",
    fr: "chat",
    it: "gatto",
    pt: "gato",
    nl: "kat",
    pl: "kot",
    sv: "katt",
    tr: "kedi",
    ru: "кошка",
    uk: "кіт",
    uz: "mushuk",
    ar: "قطة",
    hi: "बिल्ली",
    zh: "猫",
    ja: "猫",
    ko: "고양이",
  },
  table: {
    en: "table",
    de: "Tisch",
    es: "mesa",
    fr: "table",
    it: "tavolo",
    pt: "mesa",
    nl: "tafel",
    pl: "stół",
    sv: "bord",
    tr: "masa",
    ru: "стол",
    uk: "стіл",
    uz: "stol",
    ar: "طاولة",
    hi: "मेज़",
    zh: "桌子",
    ja: "テーブル",
    ko: "탁자",
  },
  fast: {
    en: "fast",
    de: "schnell",
    es: "rápido",
    fr: "rapide",
    it: "veloce",
    pt: "rápido",
    nl: "snel",
    pl: "szybki",
    sv: "snabb",
    tr: "hızlı",
    ru: "быстрый",
    uk: "швидкий",
    uz: "tez",
    ar: "سريع",
    hi: "तेज़",
    zh: "快",
    ja: "速い",
    ko: "빠른",
  },
  good: {
    en: "good",
    de: "gut",
    es: "bueno",
    fr: "bon",
    it: "buono",
    pt: "bom",
    nl: "goed",
    pl: "dobry",
    sv: "bra",
    tr: "iyi",
    ru: "хороший",
    uk: "добрий",
    uz: "yaxshi",
    ar: "جيد",
    hi: "अच्छा",
    zh: "好",
    ja: "良い",
    ko: "좋은",
  },
  thanks: {
    en: "thank you",
    de: "Danke",
    es: "gracias",
    fr: "merci",
    it: "grazie",
    pt: "obrigado",
    nl: "dank je",
    pl: "dziękuję",
    sv: "tack",
    tr: "teşekkürler",
    ru: "спасибо",
    uk: "дякую",
    uz: "rahmat",
    ar: "شكرا",
    hi: "धन्यवाद",
    zh: "谢谢",
    ja: "ありがとう",
    ko: "감사합니다",
  },
  begin: {
    en: "to begin",
    de: "beginnen",
    es: "empezar",
    fr: "commencer",
    it: "iniziare",
    pt: "começar",
    nl: "beginnen",
    pl: "zaczynać",
    sv: "börja",
    tr: "başlamak",
    ru: "начинать",
    uk: "починати",
    uz: "boshlamoq",
    ar: "يبدأ",
    hi: "शुरू करना",
    zh: "开始",
    ja: "始める",
    ko: "시작하다",
  },
  go: {
    en: "to go",
    de: "gehen",
    es: "ir",
    fr: "aller",
    it: "andare",
    pt: "ir",
    nl: "gaan",
    pl: "iść",
    sv: "gå",
    tr: "gitmek",
    ru: "идти",
    uk: "йти",
    uz: "bormoq",
    ar: "يذهب",
    hi: "जाना",
    zh: "去",
    ja: "行く",
    ko: "가다",
  },
  speak: {
    en: "to speak",
    de: "sprechen",
    es: "hablar",
    fr: "parler",
    it: "parlare",
    pt: "falar",
    nl: "spreken",
    pl: "mówić",
    sv: "tala",
    tr: "konuşmak",
    ru: "говорить",
    uk: "говорити",
    uz: "gapirmoq",
    ar: "يتكلم",
    hi: "बोलना",
    zh: "说话",
    ja: "話す",
    ko: "말하다",
  },
  eat: {
    en: "to eat",
    de: "essen",
    es: "comer",
    fr: "manger",
    it: "mangiare",
    pt: "comer",
    nl: "eten",
    pl: "jeść",
    sv: "äta",
    tr: "yemek",
    ru: "есть",
    uk: "їсти",
    uz: "yemoq",
    ar: "يأكل",
    hi: "खाना",
    zh: "吃",
    ja: "食べる",
    ko: "먹다",
  },
  offer: {
    en: "to offer",
    de: "anbieten",
    es: "ofrecer",
    fr: "offrir",
    it: "offrire",
    pt: "oferecer",
    nl: "aanbieden",
    pl: "oferować",
    sv: "erbjuda",
    tr: "sunmak",
    ru: "предлагать",
    uk: "пропонувати",
    uz: "taklif qilmoq",
    ar: "يعرض",
    hi: "पेश करना",
    zh: "提供",
    ja: "提供する",
    ko: "제공하다",
  },
  airport: {
    en: "airport",
    de: "Flughafen",
    es: "aeropuerto",
    fr: "aéroport",
    it: "aeroporto",
    pt: "aeroporto",
    nl: "vliegveld",
    pl: "lotnisko",
    sv: "flygplats",
    tr: "havalimanı",
    ru: "аэропорт",
    uk: "аеропорт",
    uz: "aeroport",
    ar: "مطار",
    hi: "हवाई अड्डा",
    zh: "机场",
    ja: "空港",
    ko: "공항",
  },
  ticket: {
    en: "ticket",
    de: "Fahrkarte",
    es: "billete",
    fr: "billet",
    it: "biglietto",
    pt: "bilhete",
    nl: "kaartje",
    pl: "bilet",
    sv: "biljett",
    tr: "bilet",
    ru: "билет",
    uk: "квиток",
    uz: "chipta",
    ar: "تذكرة",
    hi: "टिकट",
    zh: "票",
    ja: "切符",
    ko: "표",
  },
  luggage: {
    en: "luggage",
    de: "Gepäck",
    es: "equipaje",
    fr: "bagages",
    it: "bagaglio",
    pt: "bagagem",
    nl: "bagage",
    pl: "bagaż",
    sv: "bagage",
    tr: "bagaj",
    ru: "багаж",
    uk: "багаж",
    uz: "yuk",
    ar: "أمتعة",
    hi: "सामान",
    zh: "行李",
    ja: "荷物",
    ko: "짐",
  },
  book: {
    en: "to book",
    de: "buchen",
    es: "reservar",
    fr: "réserver",
    it: "prenotare",
    pt: "reservar",
    nl: "boeken",
    pl: "rezerwować",
    sv: "boka",
    tr: "rezervasyon yapmak",
    ru: "бронировать",
    uk: "бронювати",
    uz: "bron qilmoq",
    ar: "يحجز",
    hi: "बुक करना",
    zh: "预订",
    ja: "予約する",
    ko: "예약하다",
  },
};
export function seedWord(concept, code) {
  const row = SEED_WORD_BANK[concept];
  return row ? row[code] || row.en : concept;
}
export function seedData(learningLanguage, nativeLanguage) {
  const learn = learningLanguage || "de";
  const native = nativeLanguage || "en";
  const isDe = learn === "de";
  const mk = (concept, extra = {}) => ({
    id: uid(),
    de: seedWord(concept, learn),
    en: seedWord(concept, native),
    type: extra.type || "other",
    level: extra.level || "",
    article: isDe ? extra.article || "" : "",
    plural: isDe ? extra.plural || "" : "",
    praeteritum: isDe ? extra.praeteritum || "" : "",
    partizipII: isDe ? extra.partizipII || "" : "",
    komparativ: isDe ? extra.komparativ || "" : "",
    superlativ: isDe ? extra.superlativ || "" : "",
    favorite: false,
    srs: {
      level: 0,
      next: Date.now(),
      correct: 0,
      wrong: 0,
    },
  });
  return {
    stacks: [
      {
        id: uid(),
        name: "A1 Basics",
        emoji: "book",
        words: [
          mk("house", {
            type: "noun",
            article: "das",
            plural: "Häuser",
          }),
          mk("cat", {
            type: "noun",
            article: "die",
            plural: "Katzen",
          }),
          mk("table", {
            type: "noun",
            article: "der",
            plural: "Tische",
          }),
          mk("fast", {
            type: "adj",
            komparativ: "schneller",
            superlativ: "am schnellsten",
          }),
          mk("good", {
            type: "adj",
            komparativ: "besser",
            superlativ: "am besten",
          }),
          mk("thanks"),
        ],
      },
      {
        id: uid(),
        name: "Verbs Starter",
        emoji: "bolt",
        words: [
          mk("begin", {
            type: "verb",
            praeteritum: "begann",
            partizipII: "begonnen",
          }),
          mk("go", {
            type: "verb",
            praeteritum: "ging",
            partizipII: "gegangen",
          }),
          mk("speak", {
            type: "verb",
            praeteritum: "sprach",
            partizipII: "gesprochen",
          }),
          mk("eat", {
            type: "verb",
            praeteritum: "aß",
            partizipII: "gegessen",
          }),
          mk("offer", {
            type: "verb",
            praeteritum: "bot an",
            partizipII: "angeboten",
          }),
        ],
      },
      {
        id: uid(),
        name: "Travel",
        emoji: "plane",
        words: [
          mk("airport", {
            type: "noun",
            article: "der",
            plural: "Flughäfen",
          }),
          mk("ticket", {
            type: "noun",
            article: "die",
            plural: "Fahrkarten",
          }),
          mk("luggage", {
            type: "noun",
            article: "das",
            plural: "—",
          }),
          mk("book", {
            type: "verb",
            praeteritum: "buchte",
            partizipII: "gebucht",
          }),
        ],
      },
    ],
    miniStacks: {},
    streak: 1,
    lastActive: todayStr(),
    todayReviews: {
      date: todayStr(),
      count: 0,
    },
  };
}
export function migrateMiniStacks(data) {
  if (!data) return {};
  if (data.miniStacks && typeof data.miniStacks === "object") return data.miniStacks;
  const legacy = data.miniStack;
  if (!legacy || !Array.isArray(legacy.words) || !legacy.words.length) return {};
  const stackList = Array.isArray(data.stacks) ? data.stacks : [];
  const out = {};
  legacy.words.forEach((w) => {
    let ownerId = w.stackId && stackList.some((s) => s.id === w.stackId) ? w.stackId : null;
    if (!ownerId) {
      const owner = stackList.find((s) => s.words && s.words.some((sw) => sw.id === w.id));
      ownerId = owner ? owner.id : null;
    }
    if (!ownerId) return;
    if (!out[ownerId])
      out[ownerId] = {
        id: uid(),
        emoji: legacy.emoji,
        words: [],
      };
    out[ownerId].words.push(w);
  });
  return out;
}
export async function loadData() {
  try {
    const raw = window.localStorage.getItem("deutschmaster-data");
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}
export async function saveData(data) {
  try {
    window.localStorage.setItem("deutschmaster-data", JSON.stringify(data));
  } catch (e) {}
}
export const ADMIN_PREMIUM_KEY = "deutschmaster-premium-status";
export const PROMO_DURATIONS = {
  monthly: 30 * 24 * 60 * 60 * 1e3,
  yearly: 365 * 24 * 60 * 60 * 1e3,
  permanent: null,
};
