/* components/premium-celebration/premium-celebration.js
 * Loading-overlay strings and the "Premium unlocked" celebration (plain DOM, not React).
 */

import { dmGroqFetch, dmParseJson } from "../../services/ai-groq";
import { UI_LANG_NAMES, uiTranslationLangCode } from "../../services/ui-translation";
import { PROMO_TYPE_LABELS } from "../stack-card/stack-card";

const _loadingOverlayTranslationCache = {};
export async function translateLoadingOverlayStrings(langCode) {
  if (!langCode || langCode === "en") return null;
  const cached = _loadingOverlayTranslationCache[langCode];
  if (cached) return cached;
  let apiKey = "";
  try {
    apiKey = window.localStorage.getItem("deutschmaster-groq-key") || "";
  } catch (e) {}
  if (!apiKey) return null;
  const targetName = (typeof UI_LANG_NAMES !== "undefined" && UI_LANG_NAMES[langCode]) || langCode;
  const strings = {
    title: "Translating wwordy into " + targetName,
    estimating: "Estimating time…",
    almost: "Almost done…",
    seconds: "About {{0}}s left",
    minutes: "About {{0}} min left",
  };
  const keys = Object.keys(strings);
  const values = keys.map(function (k) {
    return strings[k];
  });
  try {
    const res = await dmGroqFetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiKey,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          {
            role: "system",
            content:
              "You translate short user-interface strings from English into " +
              targetName +
              " for a mobile app's loading screen, shown while the app itself is being translated into " +
              targetName +
              ". Respond ONLY with a single JSON object mapping EACH input string EXACTLY as given (as the key) to its natural " +
              targetName +
              ' translation (as the value). Keep it concise, keep the app name "wwordy" unchanged, and preserve any {{0}} placeholder token exactly, in the position that reads naturally in ' +
              targetName +
              ". Do not add, merge, or drop any keys.",
          },
          {
            role: "user",
            content: JSON.stringify(values),
          },
        ],
        temperature: 0.2,
        max_tokens: 512,
        response_format: {
          type: "json_object",
        },
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const content =
      data &&
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content;
    if (!content) return null;
    let parsed = null;
    try {
      parsed = dmParseJson(content);
    } catch (e) {}
    if (!parsed || typeof parsed !== "object") return null;
    const out = {};
    keys.forEach(function (k) {
      const val = parsed[strings[k]];
      out[k] = typeof val === "string" && val.trim() ? val : strings[k];
    });
    _loadingOverlayTranslationCache[langCode] = out;
    return out;
  } catch (e) {
    return null;
  }
}
let _premiumCelebrationActive = false;
const _premiumCelebrateTranslationCache = {};
async function translatePremiumCelebrateStrings(langCode, strings) {
  // strings: { title, sub, btn } in English. Returns a translated copy,
  // or null if translation isn't possible/available right now.
  if (!langCode || langCode === "en") return null;
  const cached = _premiumCelebrateTranslationCache[langCode];
  if (cached) {
    let allCached = true;
    const fromCache = {};
    Object.keys(strings).forEach(function (k) {
      if (cached[strings[k]]) fromCache[k] = cached[strings[k]];
      else allCached = false;
    });
    if (allCached) return fromCache;
  }
  let apiKey = "";
  try {
    apiKey = window.localStorage.getItem("deutschmaster-groq-key") || "";
  } catch (e) {}
  if (!apiKey) return null;
  const targetName = (typeof UI_LANG_NAMES !== "undefined" && UI_LANG_NAMES[langCode]) || langCode;
  const keys = Object.keys(strings);
  const values = keys.map(function (k) {
    return strings[k];
  });
  try {
    const res = await dmGroqFetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiKey,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          {
            role: "system",
            content:
              "You translate short user-interface strings from English into " +
              targetName +
              " for a mobile app's celebratory unlock screen. Respond ONLY with a single JSON object mapping EACH input string EXACTLY as given (as the key) to its natural " +
              targetName +
              " translation (as the value). Keep the celebratory tone, keep it concise, preserve numbers/placeholders/punctuation-only tokens unchanged. Do not add, merge, or drop any keys.",
          },
          {
            role: "user",
            content: JSON.stringify(values),
          },
        ],
        temperature: 0.2,
        max_tokens: 1024,
        response_format: {
          type: "json_object",
        },
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const content =
      data &&
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content;
    if (!content) return null;
    let parsed = null;
    try {
      parsed = dmParseJson(content);
    } catch (e) {}
    if (!parsed || typeof parsed !== "object") return null;
    if (!_premiumCelebrateTranslationCache[langCode])
      _premiumCelebrateTranslationCache[langCode] = {};
    const out = {};
    keys.forEach(function (k) {
      const orig = strings[k];
      const val = parsed[orig];
      if (typeof val === "string" && val.trim()) {
        _premiumCelebrateTranslationCache[langCode][orig] = val;
        out[k] = val;
      }
    });
    return out;
  } catch (e) {
    return null;
  }
}
const PREMIUM_CELEBRATE_FEATURES = [
  {
    icon: '<path d="M4 5h16v11H8l-4 4V5z"></path>',
    title: "Chat with your AI tutor",
    sub: "Unlimited AI Tutor chats, auto-fill & translations.",
  },
  {
    icon: '<path d="M3 3v18h18"></path><rect x="7" y="12" width="3" height="6"></rect><rect x="12.5" y="8" width="3" height="10"></rect><rect x="18" y="5" width="3" height="13"></rect>',
    title: "See your progress",
    sub: "Deeper stats: mastery trends & streak insights.",
  },
  {
    icon: '<rect x="3" y="6" width="11" height="15" rx="2"></rect><rect x="11" y="3" width="11" height="15" rx="2"></rect><path d="M14.5 7.5l4 4M18.5 7.5l-4 4"></path>',
    title: "Organize without limits",
    sub: "Unlimited stacks, families & mini-stacks.",
  },
  {
    icon: '<path d="M12 2a10 10 0 1 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.3-.5-.8-.5-1.2 0-.9.7-1.6 1.6-1.6H16a4 4 0 0 0 4-4c0-5.5-4.5-9.9-8-9.9z"></path><circle cx="7.5" cy="10.5" r="1.2"></circle><circle cx="11.5" cy="6.8" r="1.2"></circle><circle cx="16" cy="9" r="1.2"></circle>',
    title: "Make it yours",
    sub: "Every app theme, unlocked.",
  },
  {
    icon: '<path d="M6.5 16a4.5 4.5 0 1 1 1.4-8.8A6 6 0 0 1 19 10.5 4 4 0 0 1 18 18H7"></path>',
    title: "Never lose your progress",
    sub: "Priority cloud backup & sync.",
  },
  {
    icon: '<path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z"></path><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z"></path>',
    title: "Be first to try what’s new",
    sub: "Early access to new games and features.",
  },
];
export function celebratePremiumUnlock(type) {
  try {
    if (_premiumCelebrationActive) return;
    if (document.getElementById("dm-premium-celebrate-overlay")) return;
    _premiumCelebrationActive = true;

    // Mirror the app's *current theme* classes onto the overlay itself.
    // The overlay is appended to document.body (outside .dm-app) so it can
    // sit above absolutely everything, but that also means it doesn't
    // inherit any of the .dm-app.dm-<theme> CSS variables (colors,
    // surfaces, borders) by default -- it would always render with the
    // hardcoded fallback dark palette no matter which theme is active.
    // Copying the same classes here makes every var(--...) resolve
    // correctly for whatever theme the person has chosen.
    const appEl = document.querySelector(".dm-app");
    const themeClassList = appEl
      ? appEl.className
          .split(/\s+/)
          .filter((c) => c && c !== "dm-loading" && c !== "dm-restrict-copy")
      : ["dm-app"];
    if (!themeClassList.includes("dm-app")) themeClassList.unshift("dm-app");
    const overlay = document.createElement("div");
    overlay.id = "dm-premium-celebrate-overlay";
    overlay.className = ["dm-premium-celebrate-overlay", ...themeClassList].join(" ");
    const canvas = document.createElement("canvas");
    canvas.className = "dm-premium-confetti-canvas";
    overlay.appendChild(canvas);
    const planLabel = (typeof PROMO_TYPE_LABELS !== "undefined" && PROMO_TYPE_LABELS[type]) || null;

    // T holds every piece of copy shown across the whole flow (the
    // celebration screen plus one screen per premium feature). It starts
    // in English and is updated in place once/if a translation comes back,
    // so re-rendering the current step always reflects the latest text.
    const T = {
      welcomeBadge: "Premium unlocked",
      welcomeTitle: "Welcome to Premium",
      welcomeSub:
        (planLabel
          ? "Your " + planLabel + " plan is now active."
          : "Your account has been upgraded.") + " Every feature is unlocked and ready to go.",
      btnContinue: "Continue",
      btnSkip: "Skip",
      btnGetStarted: "Get started",
    };
    PREMIUM_CELEBRATE_FEATURES.forEach((f, i) => {
      T["f" + i + "Title"] = f.title;
      T["f" + i + "Sub"] = f.sub;
    });
    const totalSteps = 1 + PREMIUM_CELEBRATE_FEATURES.length;
    let stepIndex = 0;
    const card = document.createElement("div");
    card.className = "dm-premium-celebrate-card";
    function dotsHTML(activeFeatureIdx) {
      return (
        '<div class="dm-premium-celebrate-dots">' +
        PREMIUM_CELEBRATE_FEATURES.map(
          (_, di) =>
            '<span class="dm-premium-celebrate-dot' +
            (di === activeFeatureIdx ? " dm-premium-celebrate-dot-active" : "") +
            '"></span>'
        ).join("") +
        "</div>"
      );
    }
    function stepHTML(idx) {
      if (idx === 0) {
        return (
          '<div class="dm-premium-celebrate-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="30" height="30"><path d="M3 19h18l-1.6-8.4-4.4 3.2L12 6l-3 7.8-4.4-3.2L3 19z"></path><path d="M5.5 21.5h13"></path></svg></div>' +
          '<span class="dm-premium-celebrate-badge" data-k="welcomeBadge">' +
          T.welcomeBadge +
          "</span>" +
          '<h2 class="dm-premium-celebrate-title" data-k="welcomeTitle">' +
          T.welcomeTitle +
          "</h2>" +
          '<p class="dm-premium-celebrate-sub" data-k="welcomeSub">' +
          T.welcomeSub +
          "</p>" +
          '<button type="button" class="dm-premium-celebrate-btn" data-action="next" data-k="btnContinue">' +
          T.btnContinue +
          "</button>"
        );
      }
      const fi = idx - 1;
      const f = PREMIUM_CELEBRATE_FEATURES[fi];
      const isLast = idx === totalSteps - 1;
      return (
        '<div class="dm-premium-celebrate-topbar"><button type="button" class="dm-premium-celebrate-skip" data-action="skip" data-k="btnSkip">' +
        T.btnSkip +
        "</button></div>" +
        '<div class="dm-premium-celebrate-icon dm-premium-celebrate-icon-feature"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="28" height="28">' +
        f.icon +
        "</svg></div>" +
        '<h2 class="dm-premium-celebrate-title" data-k="f' +
        fi +
        'Title">' +
        T["f" + fi + "Title"] +
        "</h2>" +
        '<p class="dm-premium-celebrate-sub" data-k="f' +
        fi +
        'Sub">' +
        T["f" + fi + "Sub"] +
        "</p>" +
        dotsHTML(fi) +
        '<button type="button" class="dm-premium-celebrate-btn" data-action="next" data-k="' +
        (isLast ? "btnGetStarted" : "btnContinue") +
        '">' +
        (isLast ? T.btnGetStarted : T.btnContinue) +
        "</button>"
      );
    }
    function bindStepEvents() {
      const nextBtn = card.querySelector('[data-action="next"]');
      if (nextBtn) nextBtn.addEventListener("click", onNext);
      const skipBtn = card.querySelector('[data-action="skip"]');
      if (skipBtn) skipBtn.addEventListener("click", onSkip);
    }
    function renderStep(idx, immediate) {
      stepIndex = idx;
      const doRender = () => {
        card.innerHTML = stepHTML(idx);
        bindStepEvents();
        if (!immediate) {
          card.classList.add("dm-premium-celebrate-step-in");
          requestAnimationFrame(() => card.classList.remove("dm-premium-celebrate-step-in"));
        }
      };
      if (immediate) {
        doRender();
        return;
      }
      card.classList.add("dm-premium-celebrate-step-out");
      window.setTimeout(doRender, 160);
    }
    function onNext() {
      if (stepIndex >= totalSteps - 1) {
        cleanup();
        return;
      }
      renderStep(stepIndex + 1);
    }
    function onSkip() {
      cleanup();
    }
    renderStep(0, true);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add("dm-premium-celebrate-show"));

    // This overlay is appended directly to document.body, outside #root,
    // so it's outside the reach of the in-app UI translation observer.
    // Translate it here directly into the user's saved native language.
    (function translateCelebrationCard() {
      let langCode =
        (typeof uiTranslationLangCode !== "undefined" && uiTranslationLangCode) || null;
      if (!langCode) {
        try {
          langCode = window.localStorage.getItem("deutschmaster-native-lang") || null;
        } catch (e) {}
      }
      if (!langCode || langCode === "en") return;
      translatePremiumCelebrateStrings(langCode, T).then(function (translated) {
        if (!translated || !document.body.contains(card)) return;
        Object.assign(T, translated);
        renderStep(stepIndex, true);
      });
    })();
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0,
      h = 0;
    function resize() {
      w = canvas.width = Math.ceil(window.innerWidth * dpr);
      h = canvas.height = Math.ceil(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
    }
    resize();
    window.addEventListener("resize", resize);
    const themeVar = (name, fallback) => {
      const v = appEl ? getComputedStyle(appEl).getPropertyValue(name).trim() : "";
      return v || fallback;
    };
    const colors = [
      themeVar("--cyan", "#6EE7F9"),
      themeVar("--gold", "#FFB020"),
      themeVar("--green", "#43D9A3"),
      themeVar("--red", "#FF3B5C"),
      themeVar("--text", "#F2F4F8"),
    ];
    const count = Math.max(90, Math.min(160, Math.round((window.innerWidth / 380) * 90)));
    const pieces = [];
    for (let i = 0; i < count; i++) {
      pieces.push({
        x: Math.random() * w,
        y: -Math.random() * h * 1.2,
        r: (4 + Math.random() * 5) * dpr,
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: (1.6 + Math.random() * 2.6) * dpr,
        drift: (Math.random() - 0.5) * 1.7 * dpr,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.22,
        shape: Math.random() > 0.5 ? "rect" : "circle",
      });
    }
    let raf = null;
    let running = true;
    const startTime = Date.now();
    const rainDuration = 4200;
    const fadeDuration = 900;
    function draw() {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      const elapsed = Date.now() - startTime;
      const fade =
        elapsed > rainDuration ? Math.max(0, 1 - (elapsed - rainDuration) / fadeDuration) : 1;
      pieces.forEach((p) => {
        p.y += p.speed;
        p.x += p.drift;
        p.rotation += p.rotSpeed;
        if (p.y > h + 20) {
          p.y = -20;
          p.x = Math.random() * w;
        }
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        if (p.shape === "rect") {
          ctx.fillRect(-p.r / 2, -p.r * 0.8, p.r, p.r * 1.6);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.r / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });
      if (fade <= 0) {
        running = false;
        return;
      }
      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);
    function cleanup() {
      if (!_premiumCelebrationActive) return;
      _premiumCelebrationActive = false;
      running = false;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      overlay.classList.remove("dm-premium-celebrate-show");
      window.setTimeout(() => {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, 260);
    }
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) cleanup();
    });
    // Safety net only -- with up to seven screens to read through, people
    // should be able to take their time. This just guards against the
    // overlay getting stuck open if something goes wrong.
    window.setTimeout(
      () => {
        if (document.body.contains(overlay)) cleanup();
      },
      5 * 60 * 1000
    );
  } catch (e) {
    _premiumCelebrationActive = false;
  }
}
