/* services/config-and-validation.js
 * AI proxy config, size limits, backup/import sanitizers, analytics consent.
 */

import { uid } from "../core/constants";
import { initAnalytics } from "./analytics-presence";

export const DM_PROXY_URL = (window.DM_CONFIG && window.DM_CONFIG.proxyUrl) || "";
export const DM_SHARED_KEY = (window.DM_CONFIG && window.DM_CONFIG.sharedKey) || "";
const DM_PROXY_KEY = "proxy";
export function dmIsProxyKey(k) {
  const t = String(k == null ? "" : k)
    .trim()
    .toLowerCase();
  return !t || t === DM_PROXY_KEY;
}
export const DM_LIMITS = {
  stacks: 500,
  families: 200,
  wordsPerStack: 1e4,
  miniWords: 1e3,
};
export function dmStr(v, n) {
  if (typeof v === "string") return v.slice(0, n || 200);
  if (typeof v === "number" && isFinite(v)) return String(v).slice(0, n || 200);
  return "";
}
function dmNum(v, lo, hi, dflt) {
  const x = typeof v === "number" ? v : parseFloat(v);
  if (!isFinite(x)) return dflt;
  return Math.min(hi, Math.max(lo, x));
}
function dmScalars(o, maxStr) {
  const out = {};
  if (!o || typeof o !== "object") return out;
  Object.keys(o).forEach((k) => {
    if (k === "__proto__" || k === "constructor" || k === "prototype") return;
    const v = o[k];
    if (typeof v === "string") out[k] = v.slice(0, maxStr || 200);
    else if (typeof v === "number") out[k] = isFinite(v) ? v : 0;
    else if (typeof v === "boolean") out[k] = v;
  });
  return out;
}
export function dmSafeIcon(v, fallback) {
  if (typeof v !== "string") return fallback;
  if (/^[a-z0-9_-]{1,32}$/i.test(v)) return v;
  if (v.length >= 1 && v.length <= 12 && !/[<>&"'`\\\/\u0000-\u001f]/.test(v)) return v;
  return fallback;
}
function dmValidateParadigm(p) {
  if (!p || typeof p !== "object" || !Array.isArray(p.sections)) return null;
  const sections = p.sections
    .slice(0, 7)
    .map((sec) => ({
      title: dmStr(sec && sec.title, 60),
      rows: (Array.isArray(sec && sec.rows) ? sec.rows : [])
        .slice(0, 8)
        .map((r) => ({
          label: dmStr(r && r.label, 40),
          value: dmStr(r && r.value, 80),
        }))
        .filter((r) => r.label && r.value),
    }))
    .filter((sec) => sec.title && sec.rows.length);
  return {
    lang: dmStr(p.lang, 8),
    sections,
  };
}
function dmSanitizeWord(w) {
  if (!w || typeof w !== "object" || Array.isArray(w)) return null;
  const out = dmScalars(w);
  out.id = dmStr(w.id, 64) || uid();
  out.de = dmStr(w.de);
  out.en = dmStr(w.en);
  out.type = typeof w.type === "string" && /^[a-z_]{1,16}$/.test(w.type) ? w.type : "other";
  [
    "level",
    "article",
    "gender",
    "plural",
    "praeteritum",
    "partizipII",
    "komparativ",
    "superlativ",
    "roman",
  ].forEach((k) => {
    out[k] = dmStr(w[k]);
  });
  out.auxiliary = w.auxiliary === "sein" || w.auxiliary === "haben" ? w.auxiliary : "";
  out.favorite = !!w.favorite;
  if ("trennbar" in w) out.trennbar = !!w.trennbar;
  if ("reflexiv" in w) out.reflexiv = !!w.reflexiv;
  const sr = w.srs && typeof w.srs === "object" && !Array.isArray(w.srs) ? w.srs : {};
  out.srs = {
    ...dmScalars(sr, 40),
    level: dmNum(sr.level, 0, 20, 0),
    next: dmNum(sr.next, 0, 864e13, Date.now()),
    correct: dmNum(sr.correct, 0, 1e6, 0),
    wrong: dmNum(sr.wrong, 0, 1e6, 0),
  };
  const par = dmValidateParadigm(w.paradigm);
  if (par) out.paradigm = par;
  return out;
}
export function dmSanitizeStack(st) {
  if (!st || typeof st !== "object" || Array.isArray(st)) return null;
  const out = dmScalars(st);
  out.id = dmStr(st.id, 64) || uid();
  out.name = dmStr(st.name, 80) || "Stack";
  out.emoji = dmSafeIcon(st.emoji, "book");
  out.words = (Array.isArray(st.words) ? st.words : [])
    .slice(0, DM_LIMITS.wordsPerStack)
    .map(dmSanitizeWord)
    .filter(Boolean);
  return out;
}
function dmSanitizeFamily(f) {
  if (!f || typeof f !== "object" || Array.isArray(f)) return null;
  const out = dmScalars(f);
  out.id = dmStr(f.id, 64) || uid();
  out.name = dmStr(f.name, 80) || "Family";
  out.emoji = dmSafeIcon(f.emoji, "family");
  return out;
}
function dmSanitizeMini(m) {
  if (!m || typeof m !== "object" || Array.isArray(m)) return null;
  return {
    ...dmScalars(m),
    id: dmStr(m.id, 64) || uid(),
    emoji: dmSafeIcon(m.emoji, "book"),
    words: (Array.isArray(m.words) ? m.words : [])
      .slice(0, DM_LIMITS.miniWords)
      .map(dmSanitizeWord)
      .filter(Boolean),
  };
}
export function dmSanitizeBackup(data) {
  const d = data && typeof data === "object" ? data : {};
  const out = {
    stacks: (Array.isArray(d.stacks) ? d.stacks : [])
      .slice(0, DM_LIMITS.stacks)
      .map(dmSanitizeStack)
      .filter(Boolean),
    families: (Array.isArray(d.families) ? d.families : [])
      .slice(0, DM_LIMITS.families)
      .map(dmSanitizeFamily)
      .filter(Boolean),
    streak: dmNum(d.streak, 0, 1e5, 1),
    bestStreak: dmNum(d.bestStreak, 0, 1e5, 0),
    favMiniStack: dmSanitizeMini(d.favMiniStack),
    todayReviews:
      d.todayReviews && typeof d.todayReviews === "object"
        ? {
            date: dmStr(d.todayReviews.date, 12),
            count: dmNum(d.todayReviews.count, 0, 1e6, 0),
          }
        : null,
  };
  if (d.miniStacks && typeof d.miniStacks === "object" && !Array.isArray(d.miniStacks)) {
    out.miniStacks = {};
    Object.keys(d.miniStacks)
      .slice(0, DM_LIMITS.stacks)
      .forEach((k) => {
        if (k === "__proto__" || k === "constructor" || k === "prototype") return;
        const m = dmSanitizeMini(d.miniStacks[k]);
        if (m) out.miniStacks[dmStr(k, 64)] = m;
      });
  } else if (d.miniStack && typeof d.miniStack === "object" && Array.isArray(d.miniStack.words)) {
    out.miniStack = dmSanitizeMini(d.miniStack);
  }
  return out;
}
const DM_ANALYTICS_DEFAULT_OPT_IN = false;
export function dmAnalyticsConsent() {
  try {
    const v = window.localStorage.getItem("deutschmaster-analytics-consent");
    if (v === "1") return true;
    if (v === "0") return false;
  } catch (e) {}
  return DM_ANALYTICS_DEFAULT_OPT_IN;
}
export function dmSetAnalyticsConsent(on) {
  try {
    window.localStorage.setItem("deutschmaster-analytics-consent", on ? "1" : "0");
  } catch (e) {}
  try {
    if (on) {
      initAnalytics();
      if (window.posthog && window.posthog.opt_in_capturing) window.posthog.opt_in_capturing();
    } else if (window.posthog && window.posthog.opt_out_capturing)
      window.posthog.opt_out_capturing();
  } catch (e) {}
}
