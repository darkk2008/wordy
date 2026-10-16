/* services/analytics-presence.js
 * Analytics counters, PostHog init, live "online now" presence.
 */

import { dmAnalyticsConsent } from "./config-and-validation";
import { getAdminSecret } from "./admin-promo";

const ANALYTICS_OPENS_KEY = "deutschmaster-analytics-opens";
const ANALYTICS_FIRST_OPEN_KEY = "deutschmaster-analytics-first-open";
const ANALYTICS_LAST_ACTIVE_KEY = "deutschmaster-analytics-last-active";
const ANALYTICS_INTENT_KEY = "deutschmaster-analytics-premium-intent";
const ANALYTICS_ACTIVATIONS_KEY = "deutschmaster-analytics-premium-activations";
const ANALYTICS_ONLINE_WINDOW_MS = 45 * 1e3;
function analyticsReadJSON(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}
function analyticsWriteJSON(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {}
}
function analyticsReadInt(key) {
  try {
    return parseInt(window.localStorage.getItem(key) || "0", 10) || 0;
  } catch (e) {
    return 0;
  }
}

// --- Product analytics (PostHog) -------------------------------------
// 1. Sign up for a free account at https://posthog.com
// 2. Create a project, pick US or EU cloud, and copy its "Project API Key"
//    (starts with "phc_...") from Project Settings.
// 3. Paste that key below. Nothing is sent anywhere until you do.
const POSTHOG_API_KEY = "phc_uuCnVDcw2gbvUWL4P4PMrqob3ViWi2TsLhLuKvaJxLk4";

// Use "https://us.i.posthog.com" for a US-region project, or
// "https://eu.i.posthog.com" for an EU-region project.
const POSTHOG_API_HOST = "https://us.i.posthog.com";
let __posthogInitialized = false;
export function initAnalytics() {
  if (__posthogInitialized) return;
  if (!dmAnalyticsConsent()) return;
  __posthogInitialized = true;
  if (!POSTHOG_API_KEY || POSTHOG_API_KEY.indexOf("REPLACE_WITH") === 0) return;
  try {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/posthog-js@1.194.4/dist/array.full.js";
    s.integrity = "sha384-OOM/Ly/x8PMCPePhenS8wfKxQjF0Edm3lzU+rHpn0Dl6fzbWRxpAVNcwSuEvBVYQ";
    s.crossOrigin = "anonymous";
    s.async = true;
    s.onload = function () {
      try {
        window.posthog &&
          window.posthog.init(POSTHOG_API_KEY, {
            api_host: POSTHOG_API_HOST,
            autocapture: false,
            capture_pageview: true,
            person_profiles: "identified_only",
            disable_session_recording: true,
            disable_surveys: true,
            respect_dnt: true,
            ip: false,
          });
      } catch (e) {}
    };
    document.head.appendChild(s);
  } catch (e) {}
}
export function track(event, props) {
  try {
    if (!dmAnalyticsConsent()) return;
    if (!__posthogInitialized) initAnalytics();
    window.posthog && window.posthog.capture && window.posthog.capture(event, props || {});
  } catch (e) {}
}

// --- Live "online now" presence -----------------------------------
// A per-tab id, heartbeat, and an explicit "leaving" beacon so the
// server-side count can go up/down close to in real time. See
// /netlify/functions/presence-*.js for the storage side.
export const PRESENCE_HEARTBEAT_MS = 20000;
export function getPresenceSessionId() {
  try {
    const existing = window.sessionStorage.getItem("deutschmaster-presence-id");
    if (existing) return existing;
    const id =
      window.crypto && window.crypto.randomUUID
        ? window.crypto.randomUUID()
        : Date.now().toString(36) + Math.random().toString(36).slice(2);
    window.sessionStorage.setItem("deutschmaster-presence-id", id);
    return id;
  } catch (e) {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }
}
export function presenceJoin(id) {
  try {
    fetch("/.netlify/functions/presence-join", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: id,
      }),
      keepalive: true,
    }).catch(function () {});
  } catch (e) {}
}
export function presenceLeave(id) {
  try {
    const payload = JSON.stringify({
      id: id,
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        "/.netlify/functions/presence-leave",
        new Blob([payload], {
          type: "application/json",
        })
      );
    } else {
      fetch("/.netlify/functions/presence-leave", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: payload,
        keepalive: true,
      }).catch(function () {});
    }
  } catch (e) {}
}
export async function fetchOnlineCount() {
  try {
    const res = await fetch("/.netlify/functions/presence-count", {
      cache: "no-store",
      headers: { "x-admin-secret": getAdminSecret() },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.online === "number" ? data.online : null;
  } catch (e) {
    return null;
  }
}
export function recordAppOpen() {
  try {
    const now = Date.now();
    const opens = analyticsReadInt(ANALYTICS_OPENS_KEY) + 1;
    window.localStorage.setItem(ANALYTICS_OPENS_KEY, String(opens));
    if (!window.localStorage.getItem(ANALYTICS_FIRST_OPEN_KEY)) {
      window.localStorage.setItem(ANALYTICS_FIRST_OPEN_KEY, String(now));
    }
    window.localStorage.setItem(ANALYTICS_LAST_ACTIVE_KEY, String(now));
  } catch (e) {}
  track("app_opened");
}
export function touchLastActive() {
  try {
    window.localStorage.setItem(ANALYTICS_LAST_ACTIVE_KEY, String(Date.now()));
  } catch (e) {}
}
export function recordPremiumIntent(planId) {
  try {
    const cur = analyticsReadJSON(ANALYTICS_INTENT_KEY, {
      total: 0,
    });
    cur.total = (cur.total || 0) + 1;
    if (planId) cur[planId] = (cur[planId] || 0) + 1;
    analyticsWriteJSON(ANALYTICS_INTENT_KEY, cur);
  } catch (e) {}
  track("premium_buy_clicked", {
    plan: planId || "unknown",
  });
}
export function recordPremiumActivation() {
  try {
    const n = analyticsReadInt(ANALYTICS_ACTIVATIONS_KEY) + 1;
    window.localStorage.setItem(ANALYTICS_ACTIVATIONS_KEY, String(n));
  } catch (e) {}
  track("premium_activated");
}
function resetAnalytics() {
  try {
    window.localStorage.removeItem(ANALYTICS_OPENS_KEY);
    window.localStorage.removeItem(ANALYTICS_FIRST_OPEN_KEY);
    window.localStorage.removeItem(ANALYTICS_LAST_ACTIVE_KEY);
    window.localStorage.removeItem(ANALYTICS_INTENT_KEY);
    window.localStorage.removeItem(ANALYTICS_ACTIVATIONS_KEY);
  } catch (e) {}
}
export function getAnalyticsSnapshot() {
  const opens = analyticsReadInt(ANALYTICS_OPENS_KEY);
  const firstOpenRaw = analyticsReadInt(ANALYTICS_FIRST_OPEN_KEY);
  const lastActiveRaw = analyticsReadInt(ANALYTICS_LAST_ACTIVE_KEY);
  const intent = analyticsReadJSON(ANALYTICS_INTENT_KEY, {
    total: 0,
  });
  const activations = analyticsReadInt(ANALYTICS_ACTIVATIONS_KEY);
  const now = Date.now();
  const isOnline =
    document.visibilityState === "visible" &&
    (!lastActiveRaw || now - lastActiveRaw < ANALYTICS_ONLINE_WINDOW_MS);
  return {
    opens,
    firstOpen: firstOpenRaw || null,
    lastActive: lastActiveRaw || null,
    intentTotal: intent.total || 0,
    intentByPlan: intent,
    activations,
    isOnline,
  };
}
