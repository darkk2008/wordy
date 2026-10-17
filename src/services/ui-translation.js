/* services/ui-translation.js
 * Live UI translation: DOM observer, translation cache, language switching.
 */

import { dmGroqFetch, dmParseJson } from "./ai-groq";
import { UI_RU_DICT, UI_RU_NAV, UI_RU_PATTERNS } from "./ui-ru";

export const UI_LANG_NAMES = {
  en: "English",
  de: "German",
  es: "Spanish",
  fr: "French",
  it: "Italian",
  pt: "Portuguese",
  nl: "Dutch",
  pl: "Polish",
  sv: "Swedish",
  tr: "Turkish",
  ru: "Russian",
  uk: "Ukrainian",
  uz: "Uzbek",
  ar: "Arabic",
  hi: "Hindi",
  zh: "Chinese",
  ja: "Japanese",
  ko: "Korean",
};
const RTL_LANGS = new Set(["ar"]);
function applyDocumentLanguage(code) {
  try {
    const nextCode = code || "en";
    document.documentElement.lang = nextCode;
    document.documentElement.dir = RTL_LANGS.has(nextCode) ? "rtl" : "ltr";
  } catch (e) {}
}
export let uiTranslationLangCode = "en";
let uiTranslationCache = {};
let uiProtectedNames = new Set();
export function setUiProtectedNames(names) {
  uiProtectedNames = new Set(
    names.filter((n) => typeof n === "string" && n.trim()).map((n) => n.trim())
  );
}
let uiOriginalTextByNode = typeof WeakMap !== "undefined" ? new WeakMap() : null;
let uiOriginalAttrByEl = typeof WeakMap !== "undefined" ? new WeakMap() : null;
const UI_TRANSLATABLE_ATTRS = ["title", "aria-label", "placeholder"];
const uiTranslationQueue = new Set();
let uiTranslationQueueTimer = null;
let uiTranslationObserver = null;
let uiTranslationInFlight = false;
function loadUiTranslationCache(code) {
  try {
    const raw = window.localStorage.getItem("wf-ui-i18n-" + code);
    uiTranslationCache = raw ? JSON.parse(raw) : {};
  } catch (e) {
    uiTranslationCache = {};
  }
}
function saveUiTranslationCache(code) {
  try {
    window.localStorage.setItem("wf-ui-i18n-" + code, JSON.stringify(uiTranslationCache));
  } catch (e) {}
}
const UI_NON_TRANSLATABLE_TERMS = new Set(["der", "die", "das", "den", "dem", "des"]);
function isUiTranslatableText(text) {
  const t = text.trim();
  if (!t || t.length > 300) return false;
  if (UI_NON_TRANSLATABLE_TERMS.has(t.toLowerCase())) return false;
  if (uiProtectedNames.has(t)) return false;
  return /[A-Za-z]/.test(t);
}
function uiTemplateOf(text) {
  const nums = [];
  const template = text.replace(/\d+(?:[.,]\d+)?(?:\s*\/\s*\d+(?:[.,]\d+)?)?/g, (match) => {
    const idx = nums.length;
    nums.push(match);
    return "{{" + idx + "}}";
  });
  return {
    template,
    nums,
  };
}
function uiApplyTemplate(translatedTemplate, nums) {
  if (!nums.length) return translatedTemplate;
  return translatedTemplate.replace(/\{\{(\d+)\}\}/g, (m, i) => {
    const idx = parseInt(i, 10);
    return nums[idx] !== undefined ? nums[idx] : m;
  });
}
/* Russian is a built-in language: its strings live in ui-ru.js and are never sent to the AI translator. */
const RU_TEMPLATES = (() => {
  const map = {};
  Object.keys(UI_RU_DICT).forEach((en) => {
    map[uiTemplateOf(en).template.replace(/\s+/g, " ").trim()] = uiTemplateOf(UI_RU_DICT[en]).template;
  });
  return map;
})();
function uiLookup(template) {
  if (uiTranslationLangCode !== "ru") return uiTranslationCache[template];
  const m = template.match(/^(\s*)([\s\S]*?)(\s*)$/);
  const core = m[2].replace(/\s+/g, " ");
  let hit = RU_TEMPLATES[core];
  if (!hit) {
    for (const [re, rep] of UI_RU_PATTERNS) {
      if (re.test(core)) {
        hit = core.replace(re, rep);
        break;
      }
    }
  }
  return hit ? m[1] + hit + m[3] : undefined;
}
export function uiNavLabel(label) {
  return uiTranslationLangCode === "ru" && UI_RU_NAV[label] ? UI_RU_NAV[label] : label;
}
/* Static (no-AI) translation of a whole string, for places that split text into pieces (e.g. animated titles). */
export function uiStaticText(text) {
  if (uiTranslationLangCode !== "ru" || typeof text !== "string") return text;
  const { template, nums } = uiTemplateOf(text);
  const hit = uiLookup(template);
  return hit ? uiApplyTemplate(hit, nums) : text;
}
function uiAncestorExcluded(startEl) {
  let el = startEl;
  while (el) {
    // Russian is static (no AI), so the stack view's interface text may be translated there;
    // the learning words inside it are still protected by the content classes below.
    if (uiTranslationLangCode === "ru" && el.getAttribute && el.getAttribute("data-ui-ru")) {
      el = el.parentElement;
      continue;
    }
    if (
      el.classList &&
      (el.classList.contains("notranslate") ||
        el.classList.contains("dm-word-pair") ||
        el.classList.contains("dm-peek-translation") ||
        el.classList.contains("dm-tr-term") ||
        el.classList.contains("dm-tr-translation") ||
        el.classList.contains("dm-tr-example") ||
        el.classList.contains("dm-tr-grammar-value") ||
        el.classList.contains("dm-ai-msg") ||
        el.classList.contains("dm-meta-sub") ||
        el.classList.contains("dm-forms-only") ||
        el.classList.contains("dm-forms-modal-value") ||
        el.classList.contains("dm-case-sentence") ||
        el.classList.contains("dm-case-word-chip") ||
        el.classList.contains("dm-case-word-noun") ||
        el.classList.contains("dm-case-pill") ||
        el.classList.contains("dm-flip-word") ||
        el.classList.contains("dm-ladder-verb") ||
        el.classList.contains("dm-ladder-pronoun") ||
        el.classList.contains("dm-ladder-slip") ||
        el.classList.contains("dm-listen-attempt") ||
        el.classList.contains("dm-listen-correct") ||
        el.classList.contains("dm-listen-word-target") ||
        el.classList.contains("dm-listen-word-review") ||
        el.classList.contains("dm-listen-en") ||
        el.classList.contains("dm-onboard-word") ||
        el.classList.contains("dm-quiz-word") ||
        el.classList.contains("dm-scramble-pool") ||
        el.classList.contains("dm-sentence-suggested") ||
        el.classList.contains("dm-sentence-prompt-card") ||
        el.classList.contains("dm-write-hint") ||
        el.classList.contains("dm-de") ||
        el.classList.contains("dm-en") ||
        el.classList.contains("dm-option") ||
        el.classList.contains("dm-match-item") ||
        el.classList.contains("dm-memory-face") ||
        el.classList.contains("dm-tf-word") ||
        el.classList.contains("dm-tf-translation") ||
        el.classList.contains("dm-rain-word") ||
        el.classList.contains("dm-write-answer") ||
        el.classList.contains("dm-speak-target") ||
        el.classList.contains("dm-letter-tile") ||
        el.classList.contains("dm-letter-chip") ||
        el.classList.contains("dm-listen-word") ||
        el.classList.contains("dm-flip-roman") ||
        el.classList.contains("dm-roman-inline"))
    )
      return true;
    if (el.getAttribute && el.getAttribute("translate") === "no") return true;
    const tag = el.tagName;
    if (tag === "SCRIPT" || tag === "STYLE") return true;
    el = el.parentElement;
  }
  return false;
}
function uiNodeIsExcluded(node) {
  return uiAncestorExcluded(node.parentElement);
}
function processUiTextNode(node) {
  if (node.nodeType !== 3) return;
  const current = node.nodeValue;
  if (!isUiTranslatableText(current)) return;
  if (uiNodeIsExcluded(node)) return;
  if (!uiOriginalTextByNode) return;
  let original = uiOriginalTextByNode.get(node);
  if (original === undefined) {
    original = current;
    uiOriginalTextByNode.set(node, original);
  } else {
    const { template: prevTemplate, nums: prevNums } = uiTemplateOf(original);
    const cachedForOriginal = uiLookup(prevTemplate);
    const expectedDisplay = cachedForOriginal
      ? uiApplyTemplate(cachedForOriginal, prevNums)
      : undefined;
    if (current !== original && current !== expectedDisplay) {
      original = current;
      uiOriginalTextByNode.set(node, original);
    }
  }
  const { template, nums } = uiTemplateOf(original);
  const translatedTemplate = uiLookup(template);
  if (translatedTemplate) {
    const display = uiApplyTemplate(translatedTemplate, nums);
    if (node.nodeValue !== display) node.nodeValue = display;
  } else {
    if (uiTranslationLangCode !== "ru") uiTranslationQueue.add(template);
  }
}
function processUiAttrEl(el, attrName) {
  if (!el || el.nodeType !== 1) return;
  const current = el.getAttribute(attrName);
  if (!current || !isUiTranslatableText(current)) return;
  if (uiAncestorExcluded(el)) return;
  if (!uiOriginalAttrByEl) return;
  let rec = uiOriginalAttrByEl.get(el);
  if (!rec) {
    rec = {};
    uiOriginalAttrByEl.set(el, rec);
  }
  let original = rec[attrName];
  if (original === undefined) {
    original = current;
    rec[attrName] = original;
  } else {
    const { template: prevTemplate, nums: prevNums } = uiTemplateOf(original);
    const cachedForOriginal = uiLookup(prevTemplate);
    const expectedDisplay = cachedForOriginal
      ? uiApplyTemplate(cachedForOriginal, prevNums)
      : undefined;
    if (current !== original && current !== expectedDisplay) {
      original = current;
      rec[attrName] = original;
    }
  }
  const { template, nums } = uiTemplateOf(original);
  const translatedTemplate = uiLookup(template);
  if (translatedTemplate) {
    const display = uiApplyTemplate(translatedTemplate, nums);
    if (el.getAttribute(attrName) !== display) el.setAttribute(attrName, display);
  } else {
    if (uiTranslationLangCode !== "ru") uiTranslationQueue.add(template);
  }
}
function scanUiAttrsInRoot(root) {
  if (!root) return;
  UI_TRANSLATABLE_ATTRS.forEach((attr) => {
    if (root.nodeType === 1 && root.hasAttribute && root.hasAttribute(attr))
      processUiAttrEl(root, attr);
    if (root.querySelectorAll) {
      root.querySelectorAll("[" + attr + "]").forEach((el) => processUiAttrEl(el, attr));
    }
  });
}
function scanUiTranslatable(root) {
  if (!root || uiTranslationLangCode === "en") return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  let n;
  while ((n = walker.nextNode())) processUiTextNode(n);
  scanUiAttrsInRoot(root);
  scheduleUiTranslationFlush();
}
function startUiTranslationObserver() {
  if (uiTranslationObserver) return;
  const root = document.getElementById("root");
  if (!root) return;
  uiTranslationObserver = new MutationObserver((mutations) => {
    if (uiTranslationLangCode === "en") return;
    mutations.forEach((m) => {
      if (m.type === "characterData") {
        processUiTextNode(m.target);
      } else if (m.type === "attributes") {
        if (m.target.nodeType === 1 && m.attributeName) processUiAttrEl(m.target, m.attributeName);
      } else if (m.type === "childList") {
        m.addedNodes.forEach((added) => {
          if (added.nodeType === 3) {
            processUiTextNode(added);
          } else if (added.nodeType === 1) {
            const walker = document.createTreeWalker(added, NodeFilter.SHOW_TEXT, null);
            let n;
            while ((n = walker.nextNode())) processUiTextNode(n);
            scanUiAttrsInRoot(added);
          }
        });
      }
    });
    scheduleUiTranslationFlush();
  });
  uiTranslationObserver.observe(root, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: UI_TRANSLATABLE_ATTRS,
  });
}
function scheduleUiTranslationFlush() {
  if (uiTranslationQueueTimer) return;
  uiTranslationQueueTimer = setTimeout(flushUiTranslationQueue, 450);
}
function applyCachedUiTranslations() {
  const root = document.getElementById("root");
  if (!root) return;
  if (uiOriginalTextByNode) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    let n;
    while ((n = walker.nextNode())) {
      const original = uiOriginalTextByNode.get(n);
      if (original !== undefined) {
        const { template, nums } = uiTemplateOf(original);
        const translatedTemplate = uiLookup(template);
        if (translatedTemplate) {
          const display = uiApplyTemplate(translatedTemplate, nums);
          if (n.nodeValue !== display) n.nodeValue = display;
        }
      }
    }
  }
  if (uiOriginalAttrByEl) {
    UI_TRANSLATABLE_ATTRS.forEach((attr) => {
      root.querySelectorAll("[" + attr + "]").forEach((el) => {
        const rec = uiOriginalAttrByEl.get(el);
        const original = rec && rec[attr];
        if (original !== undefined) {
          const { template, nums } = uiTemplateOf(original);
          const translatedTemplate = uiLookup(template);
          if (translatedTemplate) {
            const display = uiApplyTemplate(translatedTemplate, nums);
            if (el.getAttribute(attr) !== display) el.setAttribute(attr, display);
          }
        }
      });
    });
  }
}
async function flushUiTranslationQueue() {
  uiTranslationQueueTimer = null;
  if (uiTranslationLangCode === "ru") {
    uiTranslationQueue.clear();
    return;
  }
  if (uiTranslationInFlight || uiTranslationQueue.size === 0 || uiTranslationLangCode === "en")
    return;
  const batch = Array.from(uiTranslationQueue).slice(0, 60);
  batch.forEach((t) => uiTranslationQueue.delete(t));
  let apiKey = "";
  try {
    apiKey = window.localStorage.getItem("deutschmaster-groq-key") || "";
  } catch (e) {}
  if (!apiKey) return;
  uiTranslationInFlight = true;
  try {
    const targetName = UI_LANG_NAMES[uiTranslationLangCode] || uiTranslationLangCode;
    const sysPrompt =
      "You translate short user-interface strings (button labels, menu items, headings, help text) from English into " +
      targetName +
      " for wwordy, a German vocabulary-learning app. Respond ONLY with a single JSON object mapping EACH input string EXACTLY as given (as the key) to its natural " +
      targetName +
      " translation (as the value). Keep translations concise, matching the tone and length of UI copy, and prefer the terminology language-learning apps and courses normally use in " +
      targetName +
      " (e.g. for grammatical cases, word types, or CEFR levels) over a literal word-for-word rendering. If an input string is itself German-language learning content rather than app interface text (a bare German word or article, or a German grammatical case name), return it completely unchanged. Numbers appear as placeholders like {{0}}, {{1}} — keep every placeholder token exactly as written, in the position that reads naturally in " +
      targetName +
      ". Preserve any emoji or punctuation-only tokens unchanged. Do not add, merge, or drop any keys.";
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
            content: JSON.stringify(batch),
          },
        ],
        temperature: 0.2,
        max_tokens: 4096,
        response_format: {
          type: "json_object",
        },
      }),
    });
    if (res.ok) {
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;
      if (content) {
        let parsed = null;
        try {
          parsed = dmParseJson(content);
        } catch (e) {}
        if (parsed && typeof parsed === "object") {
          let changed = false;
          batch.forEach((orig) => {
            const val = parsed[orig];
            if (typeof val === "string" && val.trim()) {
              uiTranslationCache[orig] = val;
              changed = true;
            }
          });
          if (changed) {
            saveUiTranslationCache(uiTranslationLangCode);
            applyCachedUiTranslations();
          }
        }
      }
    }
  } catch (e) {
  } finally {
    uiTranslationInFlight = false;
    if (uiTranslationQueue.size > 0) scheduleUiTranslationFlush();
  }
}
function revertUiTranslationsToEnglish() {
  const oldTextMap = uiOriginalTextByNode;
  const oldAttrMap = uiOriginalAttrByEl;
  const root = document.getElementById("root");
  if (oldTextMap && root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    let n;
    while ((n = walker.nextNode())) {
      const original = oldTextMap.get(n);
      if (original !== undefined && n.nodeValue !== original) n.nodeValue = original;
    }
  }
  if (oldAttrMap && root) {
    UI_TRANSLATABLE_ATTRS.forEach((attr) => {
      root.querySelectorAll("[" + attr + "]").forEach((el) => {
        const rec = oldAttrMap.get(el);
        const original = rec && rec[attr];
        if (original !== undefined && el.getAttribute(attr) !== original)
          el.setAttribute(attr, original);
      });
    });
  }
}
export function setUiTranslationLanguage(code) {
  const nextCode = code || "en";
  applyDocumentLanguage(nextCode);
  if (nextCode === uiTranslationLangCode) return;
  revertUiTranslationsToEnglish();
  uiTranslationLangCode = nextCode;
  uiTranslationQueue.clear();
  uiOriginalTextByNode = typeof WeakMap !== "undefined" ? new WeakMap() : null;
  uiOriginalAttrByEl = typeof WeakMap !== "undefined" ? new WeakMap() : null;
  if (nextCode === "en") {
    if (uiTranslationObserver) {
      uiTranslationObserver.disconnect();
      uiTranslationObserver = null;
    }
    return;
  }
  loadUiTranslationCache(nextCode);
  startUiTranslationObserver();
  scanUiTranslatable(document.getElementById("root"));
}
const UI_PRELOAD_STRINGS = [
  "Home",
  "Games",
  "Favorites",
  "Settings",
  "Cancel",
  "Save",
  "Delete",
  "Close",
  "Back",
  "Continue",
  "Skip",
  "Next",
  "Check",
  "Get started",
  "Play again",
  "Back to games",
  "Exit quiz",
  "round complete",
  "Customize",
  "Premium",
  "Plans, pricing & promo code",
  "Appearance",
  "Theme and colors",
  "Languages",
  "Families",
  "Organize your stacks",
  "Notifications",
  "Reminders and daily goal",
  "Restrictions",
  "Copying and access limits",
  "Your Stats",
  "Progress, streaks & words",
  "Archived Stacks",
  "Data & Backup",
  "Export, import or reset",
  "About",
  "How wwordy works",
  "Set the language you already know and the one you're learning. This is just remembered for later — it doesn't change anything else in the app yet.",
  "Native language",
  "Learning language",
  "Pick a theme for the app. The quick toggle on the Home screen only switches between Dark and Light.",
  "Welcome to wwordy!",
  "Let's set a few things up so your flashcards feel right for you. It only takes a minute.",
  "What's your native language?",
  "We'll use this for translations and the filter labels around the app.",
  "Which language are you learning?",
  "This sets your flashcards, games, and the flag on your logo.",
  "Pick a look",
  "You can always change this later in Settings.",
  "Creating a stack",
  "Tap the + button on Home to create a stack, give it a name and icon, then add words inside it with its own + button. Each word can have a translation, article, plural and more.",
  "Browsing your cards",
  "Inside a stack, scroll through your word list, tap a card to flip it, or swipe it down to pin it to your mini stack for focused review.",
  "Quick revision",
  "Star words to collect them here.",
  "Your progress",
  "Statistics",
  "Train your recall",
  "Practice stack",
  "Play all games with word forms only (genitive, plural, tenses, comparatives)",
  "No words match yet. Add one with the + button.",
  "Delete this stack?",
  "Delete stack",
  "AI Tutor",
  "Mini stack",
  "Create mini stack",
  "Play games",
  "Share stack",
  "Sync to phone via QR",
  "Upgrade to Premium",
  "Pro",
  "Remove from mini stack",
  "Add to mini stack",
  "selected",
  "More options",
  "Add",
  "Edit",
  "Search",
];
export async function preloadUiTranslations(code, onProgress) {
  if (code === "ru") {
    if (onProgress) onProgress(0, 0, 0);
    return;
  }
  const targetName = UI_LANG_NAMES[code] || code;
  let cache = {};
  try {
    const raw = window.localStorage.getItem("wf-ui-i18n-" + code);
    cache = raw ? JSON.parse(raw) : {};
  } catch (e) {
    cache = {};
  }
  const pending = UI_PRELOAD_STRINGS.filter((s) => !(s in cache));
  const total = pending.length;
  if (total === 0) {
    if (onProgress) onProgress(0, 0, 0);
    return;
  }
  let apiKey = "";
  try {
    apiKey = window.localStorage.getItem("deutschmaster-groq-key") || "";
  } catch (e) {}
  if (!apiKey) {
    if (onProgress) onProgress(0, 0, 0);
    return;
  }
  const BATCH = 50;
  const batches = [];
  for (let i = 0; i < pending.length; i += BATCH) batches.push(pending.slice(i, i + BATCH));
  let done = 0;
  const batchTimes = [];
  if (onProgress) onProgress(done, total, null);
  for (const batch of batches) {
    const batchStart = Date.now();
    try {
      const sysPrompt =
        "You translate short user-interface strings (button labels, menu items, headings, help text) from English into " +
        targetName +
        " for wwordy, a language-learning app. Respond ONLY with a single JSON object mapping EACH input string EXACTLY as given (as the key) to its natural " +
        targetName +
        " translation (as the value). Keep translations concise, matching the tone and length of UI copy, and prefer the terminology language-learning apps normally use in " +
        targetName +
        " over a literal word-for-word rendering. Preserve any emoji, numbers, placeholders, or punctuation-only tokens unchanged. Do not add, merge, or drop any keys.";
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
              content: JSON.stringify(batch),
            },
          ],
          temperature: 0.2,
          max_tokens: 4096,
          response_format: {
            type: "json_object",
          },
        }),
      });
      let parsed = null;
      if (res.ok) {
        const data = await res.json();
        const content = data?.choices?.[0]?.message?.content;
        if (content) {
          try {
            parsed = dmParseJson(content);
          } catch (e) {}
        }
      }
      batch.forEach((orig) => {
        const val = parsed && parsed[orig];
        cache[orig] = typeof val === "string" && val.trim() ? val : orig;
      });
    } catch (e) {
      batch.forEach((orig) => {
        cache[orig] = orig;
      });
    }
    done += batch.length;
    batchTimes.push(Date.now() - batchStart);
    try {
      window.localStorage.setItem("wf-ui-i18n-" + code, JSON.stringify(cache));
    } catch (e) {}
    const avgBatchTime = batchTimes.reduce((a, b) => a + b, 0) / batchTimes.length;
    const remainingBatches = batches.length - batchTimes.length;
    const etaSeconds = Math.max(0, Math.round((avgBatchTime * remainingBatches) / 1000));
    if (onProgress) onProgress(done, total, etaSeconds);
  }
}
