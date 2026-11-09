/* components/games/russian-forms.js
 * Past tense and past (active) participle of a Russian verb, for the form cards
 * (e.g. "Past participle of verbrennen" with a Russian prompt).
 *   сжигать -> сжигал / сжигавший,   сжечь -> сжёг / сжёгший,   идти -> шёл / шедший
 * Rule based: a verb it can't recognise returns null, so the caller can fall back to the
 * saved translation instead of showing a made-up form.
 */

// Prefixes that can stand before an irregular base verb (принести, вынести, сжечь, ...).
const PREFIXES = [
  "", "в", "во", "вз", "взо", "вс", "вы", "до", "за", "из", "ис", "на", "над", "надо", "недо",
  "о", "об", "обо", "от", "ото", "пере", "по", "под", "подо", "пре", "пред", "при", "про",
  "раз", "разо", "рас", "с", "со", "у", "воз", "вос",
];

// base infinitive -> [masculine past, active past participle]
const IRREGULAR = {
  вести: ["вёл", "ведший"],
  нести: ["нёс", "несший"],
  везти: ["вёз", "везший"],
  расти: ["рос", "росший"],
  грести: ["грёб", "гребший"],
  цвести: ["цвёл", "цветший"],
  мести: ["мёл", "метший"],
  плести: ["плёл", "плётший"],
  брести: ["брёл", "бредший"],
  ползти: ["полз", "ползший"],
  мочь: ["мог", "могший"],
  беречь: ["берёг", "берёгший"],
  стеречь: ["стерёг", "стерёгший"],
  жечь: ["жёг", "жёгший"],
  печь: ["пёк", "пёкший"],
  течь: ["тёк", "тёкший"],
  лечь: ["лёг", "лёгший"],
  стричь: ["стриг", "стригший"],
  влечь: ["влёк", "влёкший"],
  сечь: ["сёк", "сёкший"],
  толочь: ["толок", "толокший"],
  тереть: ["тёр", "тёрший"],
  гаснуть: ["гас", "гасший"],
  мёрзнуть: ["мёрз", "мёрзший"],
  сохнуть: ["сох", "сохший"],
  привыкнуть: ["привык", "привыкший"],
  достигнуть: ["достиг", "достигший"],
  исчезнуть: ["исчез", "исчезший"],
  погибнуть: ["погиб", "погибший"],
};
const IRREGULAR_KEYS = Object.keys(IRREGULAR).sort((a, b) => b.length - a.length);

function findIrregular(inf) {
  for (const base of IRREGULAR_KEYS) {
    if (!inf.endsWith(base)) continue;
    const prefix = inf.slice(0, inf.length - base.length);
    if (PREFIXES.includes(prefix)) return { prefix, forms: IRREGULAR[base] };
  }
  return null;
}

// "вы-" takes the stress, so the stem loses its ё: вынес, вывел, выжег (but принёс, сжёг).
const withPrefix = (prefix, form) => prefix + (prefix === "вы" ? form.replace(/ё/g, "е") : form);

// Past masculine + participle of a non-reflexive infinitive, or null.
function coreForms(inf) {
  // -йти: найти -> нашёл, прийти -> пришёл, выйти -> вышел
  if (/йти$/.test(inf)) {
    const prefix = inf.slice(0, -3);
    return { past: withPrefix(prefix, "шёл"), part: prefix + "шедший" };
  }
  if (inf === "идти") return { past: "шёл", part: "шедший" };
  const irr = findIrregular(inf);
  if (irr) return { past: withPrefix(irr.prefix, irr.forms[0]), part: withPrefix(irr.prefix, irr.forms[1]) };
  let past = null;
  if (/ереть$/.test(inf)) past = inf.slice(0, -3); // умереть -> умер, запереть -> запер
  else if (/зть$/.test(inf)) past = inf.slice(0, -2); // лезть -> лез, грызть -> грыз
  else if (/сть$/.test(inf)) past = inf.slice(0, -3) + "л"; // сесть -> сел, есть -> ел
  else if (/ти$/.test(inf)) past = inf.slice(0, -2); // спасти -> спас
  else if (/(ть)$/.test(inf)) past = inf.slice(0, -2) + "л"; // сжигать -> сжигал
  if (!past) return null; // -чь and anything unknown: don't guess
  const part = past.endsWith("л") ? past.slice(0, -1) + "вший" : past + "ший";
  return { past, part };
}

// kind: "past" | "participle". `base` is the (already cleaned) Russian meaning,
// e.g. "сжигать" or "открывать дверь". Returns the phrase, or null when it isn't a verb we know.
export function russianPastPhrase(kind, base) {
  const text = String(base || "").trim().toLowerCase();
  if (!text) return null;
  const words = text.split(/\s+/);
  let verb = words[0];
  const rest = words.slice(1).join(" ");
  let refl = false;
  const m = /^(.*(?:ть|ти|чь))(ся|сь)$/.exec(verb);
  if (m) {
    verb = m[1];
    refl = true;
  }
  if (!/(ть|ти|чь)$/.test(verb)) return null;
  const f = coreForms(verb);
  if (!f) return null;
  const form = (kind === "participle" ? f.part : f.past) + (refl ? "ся" : "");
  return rest ? `${form} ${rest}` : form;
}
