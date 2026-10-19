/* services/premium-gems-store.js
 * Premium status, gems balance, owned store packs, free-tier limits, promo redemption.
 */

import { ADMIN_PREMIUM_KEY, PROMO_DURATIONS } from "../core/srs-and-seed-data";
import { NETLIFY_FN_BASE, getDeviceId } from "./admin-promo";
import { recordPremiumActivation } from "./analytics-presence";

export function loadPremiumStatus() {
  try {
    const raw = window.localStorage.getItem(ADMIN_PREMIUM_KEY);
    if (raw) {
      const status = JSON.parse(raw);
      if (status && status.active && status.expiresAt && status.expiresAt < Date.now()) {
        return {
          active: false,
          type: null,
          expiresAt: null,
        };
      }
      return status;
    }
  } catch (e) {}
  return {
    active: false,
    type: null,
    expiresAt: null,
  };
}
function savePremiumStatus(status) {
  try {
    window.localStorage.setItem(ADMIN_PREMIUM_KEY, JSON.stringify(status));
  } catch (e) {}
  try {
    window.dispatchEvent(
      new CustomEvent("dm-premium-updated", {
        detail: status,
      })
    );
  } catch (e) {}
}
const GEMS_BALANCE_KEY = "deutschmaster-gems-balance";
const GEMS_STARTER_AMOUNT = 50;
export function loadGemsBalance() {
  try {
    const raw = window.localStorage.getItem(GEMS_BALANCE_KEY);
    if (raw !== null) return Math.max(0, parseInt(raw, 10) || 0);
  } catch (e) {}
  saveGemsBalance(GEMS_STARTER_AMOUNT);
  return GEMS_STARTER_AMOUNT;
}
function saveGemsBalance(amount) {
  try {
    window.localStorage.setItem(GEMS_BALANCE_KEY, String(Math.max(0, Math.round(amount || 0))));
  } catch (e) {}
}
export function addGemsToBalance(amount) {
  const next = loadGemsBalance() + Math.max(0, Math.round(amount || 0));
  saveGemsBalance(next);
  return next;
}
export function spendGemsFromBalance(amount) {
  const current = loadGemsBalance();
  const cost = Math.max(0, Math.round(amount || 0));
  if (current < cost)
    return {
      ok: false,
      balance: current,
    };
  const next = current - cost;
  saveGemsBalance(next);
  return {
    ok: true,
    balance: next,
  };
}
function storeOwnedPacksKey(learningLanguage, nativeLanguage) {
  return `deutschmaster-store-owned-${learningLanguage || "de"}-${nativeLanguage || "en"}`;
}
export function loadOwnedStorePacks(learningLanguage, nativeLanguage) {
  try {
    const raw = window.localStorage.getItem(storeOwnedPacksKey(learningLanguage, nativeLanguage));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}
export function saveOwnedStorePacks(learningLanguage, nativeLanguage, ids) {
  try {
    window.localStorage.setItem(
      storeOwnedPacksKey(learningLanguage, nativeLanguage),
      JSON.stringify(ids || [])
    );
  } catch (e) {}
}
function storePreviewKey(packId, learningLanguage, nativeLanguage) {
  return `deutschmaster-store-preview-${learningLanguage || "de"}-${nativeLanguage || "en"}-${packId}`;
}
export function loadStorePreview(packId, learningLanguage, nativeLanguage) {
  try {
    const raw = window.localStorage.getItem(
      storePreviewKey(packId, learningLanguage, nativeLanguage)
    );
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return null;
}
export function saveStorePreview(packId, learningLanguage, nativeLanguage, words) {
  try {
    window.localStorage.setItem(
      storePreviewKey(packId, learningLanguage, nativeLanguage),
      JSON.stringify(words || [])
    );
  } catch (e) {}
}
// Free tier, simplified: everything that costs us nothing is free. The only real limit is on
// things that cost money (AI translation), and it resets every day instead of running out forever.
export const FREE_FAMILY_LIMIT = 1;
export const FREE_THEME_LIMIT = 8;
export const FREE_FAVORITE_LIMIT = Infinity; // favorites cost nothing, so no limit
export const FREE_TRANSLATE_LIMIT = 10; // per day (was 4 in total, ever)
const FREE_TRANSLATE_COUNT_KEY = "deutschmaster-free-translate-count";
function translateDay() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
// Stored as "<day>:<count>"; an old plain number or a different day counts as 0.
export function getFreeTranslateCount() {
  try {
    const raw = window.localStorage.getItem(FREE_TRANSLATE_COUNT_KEY) || "";
    const [day, n] = raw.split(":");
    return day === translateDay() ? parseInt(n, 10) || 0 : 0;
  } catch (e) {
    return 0;
  }
}
export function incFreeTranslateCount() {
  try {
    const n = getFreeTranslateCount() + 1;
    window.localStorage.setItem(FREE_TRANSLATE_COUNT_KEY, `${translateDay()}:${n}`);
    return n;
  } catch (e) {
    return getFreeTranslateCount();
  }
}
export function grantPremium(type) {
  const duration = PROMO_DURATIONS[type];
  const status = {
    active: true,
    type,
    expiresAt: duration ? Date.now() + duration : null,
  };
  savePremiumStatus(status);
  recordPremiumActivation();
  return status;
}
export function revokePremium() {
  const status = {
    active: false,
    type: null,
    expiresAt: null,
  };
  savePremiumStatus(status);
  return status;
}
const ADMIN_DISCOUNT_KEY = "deutschmaster-active-discount";
export function loadActiveDiscount() {
  try {
    const raw = window.localStorage.getItem(ADMIN_DISCOUNT_KEY);
    if (raw) {
      const discount = JSON.parse(raw);
      if (discount && discount.expiresAt && discount.expiresAt < Date.now()) {
        return null;
      }
      return discount;
    }
  } catch (e) {}
  return null;
}
function saveActiveDiscount(discount) {
  try {
    if (discount) window.localStorage.setItem(ADMIN_DISCOUNT_KEY, JSON.stringify(discount));
    else window.localStorage.removeItem(ADMIN_DISCOUNT_KEY);
  } catch (e) {}
}
export async function redeemPromoCode(rawCode) {
  const code = (rawCode || "").trim().toUpperCase();
  if (!code)
    return {
      ok: false,
      message: "Enter a code.",
    };
  let data;
  try {
    const res = await fetch(`${NETLIFY_FN_BASE}/promo-redeem`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code,
        deviceId: getDeviceId(),
      }),
    });
    data = await res.json();
  } catch (e) {
    return {
      ok: false,
      message: "Couldn't reach the server. Check your connection and try again.",
    };
  }
  if (!data || !data.ok)
    return {
      ok: false,
      message: (data && data.message) || "That code isn't valid.",
    };
  // The server only validates and consumes the code; applying its effect
  // to this device's local premium/gems/discount state still happens here.
  if (data.kind === "discount") {
    const discount = {
      percent: data.percent,
      code: data.code,
      expiresAt: data.expiresAt,
      appliedAt: Date.now(),
    };
    saveActiveDiscount(discount);
    return {
      ok: true,
      message: data.message,
      discount,
    };
  }
  if (data.kind === "gems") {
    return {
      ok: true,
      message: data.message,
      gemsAmount: data.amount,
    };
  }
  if (data.kind === "premium") {
    const status = grantPremium(data.type);
    return {
      ok: true,
      message: data.message,
      status,
    };
  }
  return {
    ok: true,
    message: data.message,
  };
}
