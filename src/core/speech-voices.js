/* core/speech-voices.js
 * Text-to-speech: voice list, voice scoring/picking, speak(), romanization toggle.
 */

import { useEffect, useState } from "react";
import { getLangName } from "../components/language-settings/language-settings";
import { SPEECH_LANG_CODES } from "./constants";

export const GENERIC_GENDER_COLORS = ["#5B9DFF", "#FF6FA8", "#43D9A3"];
export const LEARNING_LANG_WORD_LABEL = {
  en: "English word",
  de: "German word",
  es: "Spanish word",
  fr: "French word",
  it: "Italian word",
  pt: "Portuguese word",
  nl: "Dutch word",
  pl: "Polish word",
  sv: "Swedish word",
  tr: "Turkish word",
  ru: "Russian word",
  uk: "Ukrainian word",
  uz: "Uzbek word",
  ar: "Arabic word",
  hi: "Hindi word",
  zh: "Chinese word",
  ja: "Japanese word",
  ko: "Korean word",
};
export let currentLearningLangCode = "de";
export function setSpeechLanguage(code) {
  currentLearningLangCode = code || "de";
}
export let dmRomanizationEnabled = (function () {
  try {
    return window.localStorage.getItem("deutschmaster-romanization") === "1";
  } catch (e) {
    return false;
  }
})();
export function dmSetRomanizationEnabled(val) {
  dmRomanizationEnabled = !!val;
  try {
    window.localStorage.setItem("deutschmaster-romanization", dmRomanizationEnabled ? "1" : "0");
  } catch (e) {}
  try {
    window.dispatchEvent(
      new CustomEvent("dm-romanization-changed", {
        detail: {
          enabled: dmRomanizationEnabled,
        },
      })
    );
  } catch (e) {}
}
export function useRomanizationEnabled() {
  const [val, setVal] = useState(dmRomanizationEnabled);
  useEffect(() => {
    const onChange = (e) => setVal(!!(e && e.detail && e.detail.enabled));
    window.addEventListener("dm-romanization-changed", onChange);
    return () => window.removeEventListener("dm-romanization-changed", onChange);
  }, []);
  return val;
}
let __dmVoiceList = [];
const __dmVoiceWarned = {};
export const DM_VOICE_SAMPLES = {
  en: "Hello, how are you?",
  de: "Guten Tag, wie geht es dir?",
  es: "Hola, ¿cómo estás?",
  fr: "Bonjour, comment ça va ?",
  it: "Ciao, come stai?",
  pt: "Olá, tudo bem?",
  nl: "Hallo, hoe gaat het?",
  pl: "Cześć, jak się masz?",
  sv: "Hej, hur mår du?",
  tr: "Merhaba, nasılsın?",
  ru: "Привет, как дела?",
  uk: "Привіт, як справи?",
  uz: "Salom, yaxshimisiz?",
  ar: "مرحبا، كيف حالك؟",
  hi: "नमस्ते, आप कैसे हैं?",
  zh: "你好，你好吗？",
  ja: "こんにちは、お元気ですか？",
  ko: "안녕하세요, 잘 지내세요?",
};
export const DM_VOICE_FALLBACKS = {
  uz: ["tr", "ru"],
};
export function dmLoadVoices() {
  try {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const v = window.speechSynthesis.getVoices();
      if (v && v.length) __dmVoiceList = v;
    }
  } catch (e) {}
  return __dmVoiceList;
}
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  try {
    window.speechSynthesis.addEventListener("voiceschanged", dmLoadVoices);
  } catch (e) {}
  dmLoadVoices();
}
function dmVoiceScore(v, bcp47) {
  const lang = String((v && v.lang) || "")
    .replace("_", "-")
    .toLowerCase();
  const want = String(bcp47 || "").toLowerCase();
  let sc;
  if (lang === want) sc = 100;
  else if (lang && lang.split("-")[0] === want.split("-")[0]) sc = 65;
  else return -1;
  if (want.startsWith("zh") && /^(zh-hk|yue)/.test(lang)) return -1;
  const name = String(v.name || "");
  if (/natural|neural|enhanced|premium|studio|wavenet/i.test(name)) sc += 45;
  if (/google/i.test(name)) sc += 12;
  if (/siri/i.test(name)) sc += 10;
  if (v.localService) sc += 6;
  if (/compact/i.test(name)) sc -= 10;
  if (/espeak|festival/i.test(name)) sc -= 70;
  return sc;
}
export function dmVoicesForLang(code) {
  const bcp47 = SPEECH_LANG_CODES[code] || "de-DE";
  return dmLoadVoices()
    .map((v) => ({
      voice: v,
      score: dmVoiceScore(v, bcp47),
    }))
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score);
}
export function dmVoicePref(code) {
  try {
    return window.localStorage.getItem("deutschmaster-voice-" + code) || "";
  } catch (e) {
    return "";
  }
}
export function dmVoiceRate() {
  try {
    const r = parseFloat(window.localStorage.getItem("deutschmaster-voice-rate"));
    if (r >= 0.5 && r <= 1.2) return r;
  } catch (e) {}
  return 0.88;
}
function dmPickVoice(code) {
  const voices = dmLoadVoices();
  const saved = dmVoicePref(code);
  if (saved) {
    const v = voices.find((x) => x.voiceURI === saved || x.name === saved);
    if (v) return v;
  }
  const list = dmVoicesForLang(code);
  return list.length ? list[0].voice : null;
}
function dmVoiceToast(msg) {
  try {
    const d = document.createElement("div");
    d.className = "dm-voice-toast";
    d.textContent = msg;
    d.onclick = () => d.remove();
    document.body.appendChild(d);
    setTimeout(() => {
      try {
        d.remove();
      } catch (e) {}
    }, 9e3);
  } catch (e) {}
}
export function speak(text) {
  try {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const code = currentLearningLangCode;
    const bcp47 = SPEECH_LANG_CODES[code] || "de-DE";
    const u = new SpeechSynthesisUtterance(text);
    u.lang = bcp47;
    u.rate = dmVoiceRate();
    const v = dmPickVoice(code);
    if (v) {
      u.voice = v;
      u.lang = v.lang || bcp47;
    } else if (dmLoadVoices().length && !__dmVoiceWarned[code]) {
      __dmVoiceWarned[code] = true;
      const ln = getLangName(code);
      dmVoiceToast(
        "No " +
          ln +
          " voice found on this device, so audio may sound wrong or stay silent. Choose another voice in Settings → Voice, or install " +
          ln +
          " text-to-speech in your device's system settings."
      );
    }
    window.speechSynthesis.speak(u);
  } catch (e) {}
}
