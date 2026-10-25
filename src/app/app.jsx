/* app/app.jsx
 * App: root component, global state, routing between screens, modals.
 */

import { Fragment, Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BottomNav } from "../components/bottom-nav/bottom-nav";
import { AppLogo } from "../components/common/common";
import { DailyBonusToast } from "../components/daily-bonus-toast/daily-bonus-toast";
import { FavoritesView } from "../components/favorites/favorites";
import { FORMS_ONLY_GAMES } from "../components/games/games-config";
import { GamesHub, ReviewGamePicker } from "../components/games/games-hub";
import { WriteGame, buildFormWordPool } from "../components/games/write-game";
import { HomeView } from "../components/home/home";
import { LANGUAGES } from "../components/language-settings/language-settings";
import { GOAL_OPTIONS } from "../components/notification-settings/notification-settings";
import { translateLoadingOverlayStrings } from "../components/premium-celebration/premium-celebration";
import { recordGameCooldown } from "../components/stack-select/stack-select";
import { StackView } from "../components/stack-view/stack-view";
import { TranslationLoadingOverlay } from "../components/translation-overlay/translation-overlay";
import { stripArticle } from "../components/word-forms/word-forms";
import { DAY, ROMAN_LANGS, todayStr, uid } from "../core/constants";
import { HideArticlesContext, ShowLevelBadgeContext } from "../core/contexts";
import { FAMILY_ICON_IDS, MINISTACK_ICON_IDS } from "../core/icon-registry";
import { currentLearningLangCode, setSpeechLanguage, speak } from "../core/speech-voices";
import {
  bumpSrs,
  loadData,
  migrateMiniStacks,
  saveData,
  seedData,
  shuffle,
} from "../core/srs-and-seed-data";
import { registerDevice } from "../services/admin-promo";
import { dmFetchParadigm, dmFetchRomanBatch, dmHasParadigm } from "../services/ai-groq";
import {
  PRESENCE_HEARTBEAT_MS,
  getPresenceSessionId,
  presenceJoin,
  presenceLeave,
  recordAppOpen,
  touchLastActive,
  track,
} from "../services/analytics-presence";
import { GameBackLabelContext } from "../components/games/game-chrome";
import { dmSanitizeBackup } from "../services/config-and-validation";
import {
  FREE_FAVORITE_LIMIT,
  addGemsToBalance,
  loadGemsBalance,
  applySyncedPremium,
  applyServerPremium,
  loadPremiumStatus,
  premiumForSync,
  spendGemsFromBalance,
} from "../services/premium-gems-store";
import {
  UI_LANG_NAMES,
  preloadUiTranslations,
  setUiProtectedNames,
  setUiTranslationLanguage,
} from "../services/ui-translation";

// Heavy screens are loaded on demand so the first page load stays small.
const lazyNamed = (loader, name) => lazy(() => loader().then((m) => ({ default: m[name] })));
const AdjEndingsGame = lazyNamed(() => import("../components/games/adj-endings-game"), "AdjEndingsGame");
const CasesGame = lazyNamed(() => import("../components/games/cases-game"), "CasesGame");
const ConjugationLadderGame = lazyNamed(() => import("../components/games/conjugation-ladder-game"), "ConjugationLadderGame");
const DailyMixGame = lazyNamed(() => import("../components/games/daily-mix-game"), "DailyMixGame");
const FlashcardsGame = lazyNamed(() => import("../components/games/flashcards-game"), "FlashcardsGame");
const ListeningDictationGame = lazyNamed(() => import("../components/games/listening-dictation-game"), "ListeningDictationGame");
const MatchingGame = lazyNamed(() => import("../components/games/matching-game"), "MatchingGame");
const MemoryGame = lazyNamed(() => import("../components/games/memory-game"), "MemoryGame");
const MultipleChoiceGame = lazyNamed(() => import("../components/games/multiple-choice-game"), "MultipleChoiceGame");
const ParadigmGame = lazyNamed(() => import("../components/games/paradigm-game"), "ParadigmGame");
const ScrambleGame = lazyNamed(() => import("../components/games/scramble-game"), "ScrambleGame");
const SentencePracticeGame = lazyNamed(() => import("../components/games/sentence-practice-game"), "SentencePracticeGame");
const SpeakingGame = lazyNamed(() => import("../components/games/speaking-game"), "SpeakingGame");
const SpeedFormsGame = lazyNamed(() => import("../components/games/speed-forms-game"), "SpeedFormsGame");
const TenseMixerGame = lazyNamed(() => import("../components/games/tense-mixer-game"), "TenseMixerGame");
const TrueFalseGame = lazyNamed(() => import("../components/games/true-false-game"), "TrueFalseGame");
const WordFormsGame = lazyNamed(() => import("../components/games/word-forms-game"), "WordFormsGame");
const WordQuizGame = lazyNamed(() => import("../components/games/word-quiz-game"), "WordQuizGame");
const WordRainGame = lazyNamed(() => import("../components/games/word-rain-game"), "WordRainGame");
const AuthModal = lazyNamed(() => import("../components/account/account"), "AuthModal");
const AiModal = lazyNamed(() => import("../components/ai-modal/ai-modal"), "AiModal");
const SettingsView = lazyNamed(() => import("../components/settings-view/settings-view"), "SettingsView");
const StoreView = lazyNamed(() => import("../components/store/store"), "StoreView");
const AdminPage = lazyNamed(() => import("../components/admin-panel/admin-panel"), "AdminPage");
const OnboardingFlow = lazyNamed(() => import("../components/onboarding/onboarding"), "OnboardingFlow");

// Warm the on-demand chunks (modals, settings, store) once the app is idle, so the first
// click opens instantly instead of waiting for the chunk to download and parse.
const preloadLazyScreens = () => {
  [
    () => import("../components/account/account"),
    () => import("../components/ai-modal/ai-modal"),
    () => import("../components/settings-view/settings-view"),
    () => import("../components/store/store"),
  ].forEach((load) => load().catch(() => {}));
};
if (typeof window !== "undefined") {
  const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 1500));
  window.addEventListener("load", () => idle(preloadLazyScreens, { timeout: 4000 }), { once: true });
}

export function App() {
  // Admin page: opened by the secret gesture on the home screen, which sets the URL hash to #admin.
  const [adminPage, setAdminPage] = useState(() => typeof window !== "undefined" && window.location.hash === "#admin");
  useEffect(() => {
    const onHash = () => setAdminPage(window.location.hash === "#admin");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const closeAdminPage = useCallback(() => {
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    setAdminPage(false);
  }, []);
  const [premiumRefreshTick, setPremiumRefreshTick] = useState(0);
  const isPremium = useMemo(() => loadPremiumStatus().active, [premiumRefreshTick]);
  useEffect(() => {
    const bump = () => setPremiumRefreshTick((n) => n + 1);
    window.addEventListener("dm-premium-updated", bump);
    return () => window.removeEventListener("dm-premium-updated", bump);
  }, []);
  useEffect(() => {
    const onFocus = () => setPremiumRefreshTick((n) => n + 1);
    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onFocus);
    };
  }, []);
  useEffect(() => {
    recordAppOpen();
    registerDevice();
    const onActivity = () => touchLastActive();
    const heartbeat = window.setInterval(() => {
      if (document.visibilityState === "visible") touchLastActive();
    }, 15e3);
    window.addEventListener("focus", onActivity);
    document.addEventListener("visibilitychange", onActivity);
    window.addEventListener("pointerdown", onActivity, {
      passive: true,
    });
    return () => {
      window.clearInterval(heartbeat);
      window.removeEventListener("focus", onActivity);
      document.removeEventListener("visibilitychange", onActivity);
      window.removeEventListener("pointerdown", onActivity);
    };
  }, []);
  useEffect(() => {
    const presenceId = getPresenceSessionId();
    presenceJoin(presenceId);
    const presenceHeartbeat = window.setInterval(
      () => presenceJoin(presenceId),
      PRESENCE_HEARTBEAT_MS
    );
    const onLeave = () => presenceLeave(presenceId);
    window.addEventListener("pagehide", onLeave);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") onLeave();
    });
    return () => {
      window.clearInterval(presenceHeartbeat);
      window.removeEventListener("pagehide", onLeave);
      onLeave();
    };
  }, []);
  const [loaded, setLoaded] = useState(false);
  const [pendingFirstLaunch, setPendingFirstLaunch] = useState(false);
  const [account, setAccount] = useState({
    id: null,
    checking: true,
  });
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("signin");
  const openAuth = (m) => {
    setAuthMode(m || "signin");
    setAuthOpen(true);
  };
  const closeAuth = () => setAuthOpen(false);
  const handleAuthSuccess = (id) => {
    setAccount({
      id,
      checking: false,
    });
    setAuthOpen(false);
  };
  const openAccountEntry = () => {
    if (account.id) {
      setSettingsInitialSection("account");
      setSettingsMountKey((k) => k + 1);
      setTab("settings");
    } else {
      openAuth("signin");
    }
  };
  const handleSignOut = async () => {
    try {
      await (window.wwordyCloud && window.wwordyCloud.signOut());
    } catch (e) {}
    setAccount({
      id: null,
      checking: false,
    });
  };
  const handleDeleteAccount = async (password) => {
    await window.wwordyCloud.deleteAccount(account.id, password);
    setAccount({
      id: null,
      checking: false,
    });
  };
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!window.wwordyCloud || !window.wwordyCloud.ready()) {
        if (!cancelled)
          setAccount({
            id: null,
            checking: false,
          });
        return;
      }
      const uid = await window.wwordyCloud.getSessionId();
      if (!uid) {
        if (!cancelled)
          setAccount({
            id: null,
            checking: false,
          });
        return;
      }
      const pid = await window.wwordyCloud.getMyPublicId();
      if (!cancelled)
        setAccount({
          id: pid,
          checking: false,
        });
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  const [stacks, setStacks] = useState([]);
  const [miniStacks, setMiniStacks] = useState({});
  const [favMiniStack, setFavMiniStack] = useState(null);
  const [families, setFamilies] = useState([]);
  const [streak, setStreak] = useState(1);
  const [bestStreak, setBestStreak] = useState(1);
  const [dailyBonus, setDailyBonus] = useState(null);
  const [gemsBalance, setGemsBalance] = useState(() => loadGemsBalance());
  const addGems = (amount) => setGemsBalance(addGemsToBalance(amount));
  const spendGems = (amount) => {
    const result = spendGemsFromBalance(amount);
    if (result.ok) setGemsBalance(result.balance);
    return result.ok;
  };
  const [todayReviews, setTodayReviews] = useState(0);
  const [tab, setTab] = useState("home");
  const [settingsInitialSection, setSettingsInitialSection] = useState(null);
  const [settingsMountKey, setSettingsMountKey] = useState(0);
  const [openStackId, setOpenStackId] = useState(null);
  const [premiumReturnTab, setPremiumReturnTab] = useState(null);
  const openPremium = () => {
    track("premium_modal_opened");
    setPremiumReturnTab(tab === "settings" ? null : tab);
    setOpenStackId(null);
    setSettingsInitialSection("premium");
    setSettingsMountKey((k) => k + 1);
    setTab("settings");
  };
  const exitPremiumToPreviousTab = () => {
    setPremiumRefreshTick((n) => n + 1);
    setTab(premiumReturnTab || "home");
    setPremiumReturnTab(null);
  };
  const [game, setGame] = useState(null);
  // Games section: keep the screen locked (no pinch / double-tap zoom) exactly like before;
  // the rest of the app stays zoomable.
  const inGames = !!game || tab === "games";
  useEffect(() => {
    if (!inGames) return;
    const m = document.querySelector('meta[name="viewport"]');
    if (!m) return;
    const base = m.getAttribute("content") || "";
    m.setAttribute("content", base + ", maximum-scale=1.0, user-scalable=no");
    return () => m.setAttribute("content", base);
  }, [inGames]);
  // Scroll to the top of the page whenever the visible section changes
  // (switching tabs, opening/closing a stack, starting/leaving a game).
  // The app scrolls the whole window rather than an inner container, so
  // without this the new section would otherwise just keep whatever
  // scroll position was left over from the previous one, making it look
  // like it opened halfway down or at the bottom instead of at the top.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tab, openStackId, game ? game.type : null]);
  const [apiKey, setApiKey] = useState(() => {
    try {
      return window.localStorage.getItem("deutschmaster-groq-key") || "";
    } catch (e) {
      return "";
    }
  });
  const [aiOpen, setAiOpen] = useState(false);
  const openAI = () => setAiOpen(true);
  const [storeOpen, setStoreOpen] = useState(false);
  const openStore = () => setStoreOpen(true);
  const [familyReviewPick, setFamilyReviewPick] = useState(null);
  const [familyPlayPick, setFamilyPlayPick] = useState(null);
  const [archivedPlayPick, setArchivedPlayPick] = useState(null);
  const [stackPlayPick, setStackPlayPick] = useState(null);
  const [restrictCopy, setRestrictCopy] = useState(() => {
    try {
      return window.localStorage.getItem("deutschmaster-restrict-copy") === "1";
    } catch (e) {
      return false;
    }
  });
  const toggleRestrictCopy = (val) => {
    setRestrictCopy(val);
    try {
      window.localStorage.setItem("deutschmaster-restrict-copy", val ? "1" : "0");
    } catch (e) {}
  };
  const [hideArticles, setHideArticles] = useState(() => {
    try {
      return window.localStorage.getItem("deutschmaster-hide-articles") === "1";
    } catch (e) {
      return false;
    }
  });
  const toggleHideArticles = (val) => {
    setHideArticles(val);
    try {
      window.localStorage.setItem("deutschmaster-hide-articles", val ? "1" : "0");
    } catch (e) {}
  };
  const [showLevelBadge, setShowLevelBadge] = useState(() => {
    try {
      return window.localStorage.getItem("deutschmaster-show-level-badge") !== "0";
    } catch (e) {
      return true;
    }
  });
  const toggleShowLevelBadge = (val) => {
    setShowLevelBadge(val);
    try {
      window.localStorage.setItem("deutschmaster-show-level-badge", val ? "1" : "0");
    } catch (e) {}
  };
  const [showFamilyStats, setShowFamilyStats] = useState(() => {
    try {
      return window.localStorage.getItem("deutschmaster-show-family-stats") !== "0";
    } catch (e) {
      return true;
    }
  });
  const toggleShowFamilyStats = (val) => {
    setShowFamilyStats(val);
    try {
      window.localStorage.setItem("deutschmaster-show-family-stats", val ? "1" : "0");
    } catch (e) {}
  };
  const [hideFamilyFilters, setHideFamilyFilters] = useState(() => {
    try {
      return window.localStorage.getItem("deutschmaster-hide-family-filters") === "1";
    } catch (e) {
      return false;
    }
  });
  const toggleHideFamilyFilters = (val) => {
    setHideFamilyFilters(val);
    try {
      window.localStorage.setItem("deutschmaster-hide-family-filters", val ? "1" : "0");
    } catch (e) {}
  };
  const [dailyGoal, setDailyGoal] = useState(() => {
    try {
      const stored = parseInt(window.localStorage.getItem("deutschmaster-daily-goal"), 10);
      return GOAL_OPTIONS.includes(stored) ? stored : 20;
    } catch (e) {
      return 20;
    }
  });
  const updateDailyGoal = (val) => {
    setDailyGoal(val);
    try {
      window.localStorage.setItem("deutschmaster-daily-goal", String(val));
    } catch (e) {}
  };
  const [nativeLanguage, setNativeLanguage] = useState(() => {
    try {
      const stored = window.localStorage.getItem("deutschmaster-native-lang");
      return LANGUAGES.some((l) => l.code === stored) ? stored : "en";
    } catch (e) {
      return "en";
    }
  });
  const [i18nLoading, setI18nLoading] = useState(null);
  const [i18nLoadingStrings, setI18nLoadingStrings] = useState(null);
  const commitNativeLanguage = (code) => {
    setNativeLanguage(code);
    try {
      window.localStorage.setItem("deutschmaster-native-lang", code);
    } catch (e) {}
  };
  const updateNativeLanguage = (code) => {
    if (!code || code === nativeLanguage) return;
    let hasKey = false;
    try {
      hasKey = !!window.localStorage.getItem("deutschmaster-groq-key");
    } catch (e) {}
    if (code === "en" || code === "ru" || !hasKey) {
      commitNativeLanguage(code);
      return;
    }
    setI18nLoading({
      code,
      percent: 0,
      etaSeconds: null,
    });
    setI18nLoadingStrings(null);
    translateLoadingOverlayStrings(code)
      .then((s) => {
        if (s) setI18nLoadingStrings(s);
      })
      .catch(() => {});
    preloadUiTranslations(code, (done, total, etaSeconds) => {
      setI18nLoading({
        code,
        percent: total ? Math.round((done / total) * 100) : 100,
        etaSeconds,
      });
    })
      .catch(() => {})
      .finally(() => {
        setI18nLoading(null);
        setI18nLoadingStrings(null);
        commitNativeLanguage(code);
      });
  };
  useEffect(() => {
    setUiTranslationLanguage(nativeLanguage);
  }, [nativeLanguage]);
  const [learningLanguage, setLearningLanguage] = useState(() => {
    try {
      const stored = window.localStorage.getItem("deutschmaster-learning-lang");
      return LANGUAGES.some((l) => l.code === stored) ? stored : "de";
    } catch (e) {
      return "de";
    }
  });
  const updateLearningLanguage = (code) => {
    setLearningLanguage(code);
    try {
      window.localStorage.setItem("deutschmaster-learning-lang", code);
    } catch (e) {}
  };
  useEffect(() => {
    setSpeechLanguage(learningLanguage);
  }, [learningLanguage]);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try {
      return window.localStorage.getItem("deutschmaster-onboarded") !== "1";
    } catch (e) {
      return true;
    }
  });
  const [starterStack, setStarterStack] = useState(() => {
    try {
      return window.localStorage.getItem("deutschmaster-starter-stack") !== "0";
    } catch (e) {
      return true;
    }
  });
  const updateStarterStack = (val) => {
    setStarterStack(val);
    try {
      window.localStorage.setItem("deutschmaster-starter-stack", val ? "1" : "0");
    } catch (e) {}
  };
  const completeOnboarding = () => {
    setShowOnboarding(false);
    try {
      window.localStorage.setItem("deutschmaster-onboarded", "1");
    } catch (e) {}
    track("onboarding_completed", {
      nativeLanguage,
      learningLanguage,
    });
  };
  useEffect(() => {
    if (!pendingFirstLaunch || showOnboarding) return;
    const seeded = seedData(learningLanguage, nativeLanguage);
    setStacks(starterStack ? seeded.stacks.slice(0, 1) : []);
    setMiniStacks(seeded.miniStacks || {});
    setFavMiniStack(seeded.favMiniStack || null);
    setStreak(seeded.streak);
    setBestStreak(seeded.streak);
    setTodayReviews(seeded.todayReviews.count || 0);
    setPendingFirstLaunch(false);
  }, [pendingFirstLaunch, showOnboarding, learningLanguage, nativeLanguage, starterStack]);
  useEffect(() => {
    if (!restrictCopy) return;
    const blockCopy = (e) => {
      e.preventDefault();
    };
    document.addEventListener("copy", blockCopy);
    document.addEventListener("cut", blockCopy);
    return () => {
      document.removeEventListener("copy", blockCopy);
      document.removeEventListener("cut", blockCopy);
    };
  }, [restrictCopy]);
  const [aiMessages, setAiMessages] = useState([]);
  const [theme, setTheme] = useState(() => {
    try {
      return window.localStorage.getItem("deutschmaster-theme") || "dark";
    } catch (e) {
      return "dark";
    }
  });
  const toggleTheme = () => {
    setTheme((t) => {
      const next = t === "light" ? "dark" : "light";
      try {
        window.localStorage.setItem("deutschmaster-theme", next);
      } catch (e) {}
      return next;
    });
  };
  const selectTheme = (id) => {
    setTheme(id);
    try {
      window.localStorage.setItem("deutschmaster-theme", id);
    } catch (e) {}
  };
  useEffect(() => {
    document.body.style.transition = "background 0.4s ease";
    const THEME_BG = {
      dark: "#0a0c11",
      light: "#F5F6FA",
      midnight: "#0b0a17",
      sunset: "#170e0c",
      forest: "#F4F8F3",
      ocean: "#EEF6F9",
      rose: "#FBF0F4",
      slate: "#10141c",
      amber: "#FCF6E9",
      aurora: "#081414",
      crimson: "#17090c",
      cobalt: "#070c16",
      graphite: "#101114",
      lavender: "#F6F3FC",
      mint: "#EFFBF7",
      cocoa: "#FBF3EA",
      nord: "#2E3440",
      clay: "#E0C9A6",
      lagoon: "#16302E",
      mauve: "#D9BFC4",
      peach: "#FFF1E8",
      emerald: "#0a1511",
      onyx: "#0c0b09",
      plum: "#150b17",
      sage: "#EDF1E8",
      citrus: "#FBFAE8",
    };
    document.body.style.background = THEME_BG[theme] || THEME_BG.dark;
  }, [theme]);
  const saveApiKey = (key) => {
    setApiKey(key);
    try {
      window.localStorage.setItem("deutschmaster-groq-key", key);
    } catch (e) {}
  };
  useEffect(() => {
    (async () => {
      let data = await loadData();
      if (!data) {
        setPendingFirstLaunch(true);
        setLoaded(true);
        return;
      }
      const today = todayStr();
      let awardedBonus = null;
      if (data.lastActive !== today) {
        const yesterday = new Date(Date.now() - DAY).toISOString().slice(0, 10);
        data.streak = data.lastActive === yesterday ? (data.streak || 0) + 1 : 1;
        data.lastActive = today;
        data.todayReviews = {
          date: today,
          count: 0,
        };
        const bonusAmount = Math.min(60, 10 + (data.streak - 1) * 3);
        addGems(bonusAmount);
        awardedBonus = {
          amount: bonusAmount,
          streak: data.streak,
        };
      }
      if (!data.todayReviews || data.todayReviews.date !== today) {
        data.todayReviews = {
          date: today,
          count: 0,
        };
      }
      data.bestStreak = Math.max(data.bestStreak || 0, data.streak || 1);
      setStacks(data.stacks);
      setMiniStacks(migrateMiniStacks(data));
      setFavMiniStack(data.favMiniStack || null);
      setFamilies(data.families || []);
      setStreak(data.streak || 1);
      setBestStreak(data.bestStreak);
      setTodayReviews(data.todayReviews.count || 0);
      if (awardedBonus) setDailyBonus(awardedBonus);
      setLoaded(true);
    })();
  }, []);
  const persist = useCallback((next) => {
    saveData({
      stacks: next.stacks,
      miniStacks: next.miniStacks,
      favMiniStack: next.favMiniStack,
      families: next.families,
      streak: next.streak,
      bestStreak: next.bestStreak,
      lastActive: todayStr(),
      todayReviews: {
        date: todayStr(),
        count: next.todayReviews,
      },
    });
  }, []);
  useEffect(() => {
    if (!loaded) return;
    persist({
      stacks,
      miniStacks,
      favMiniStack,
      families,
      streak,
      bestStreak,
      todayReviews,
      loaded,
    });
  }, [stacks, miniStacks, favMiniStack, families, streak, bestStreak, todayReviews, loaded]);
  // ---- Cloud sync ---------------------------------------------------------------------------
  // lastSyncedRef: fingerprint of the data the cloud is known to hold. A push only happens when the
  // local data differs from it, and applying remote data records it - this is what stops two
  // devices from endlessly re-uploading each other's data (and overwriting fresh edits).
  const lastSyncedRef = useRef("");
  const syncReadyRef = useRef(false); // true once the first pull for this account succeeded
  const latestRef = useRef({});
  const [syncTick, setSyncTick] = useState(0); // bumps the push effect once the first pull is done
  const [retryTick, setRetryTick] = useState(0); // re-runs the first pull after a failed read
  latestRef.current = { miniStacks, favMiniStack };
  const cloudFingerprint = (c) =>
    JSON.stringify([
      c.stacks,
      c.families,
      c.miniStacks,
      c.favMiniStack,
      c.streak,
      c.bestStreak,
      c.reviews,
      c.premium || null,
    ]);
  const buildCloudPayload = () => ({
    stacks,
    families,
    miniStacks,
    favMiniStack,
    streak,
    bestStreak,
    lastActive: todayStr(),
    todayReviews: {
      date: todayStr(),
      count: todayReviews,
    },
    premium: premiumForSync(),
  });
  const fingerprintOfPayload = (p) =>
    cloudFingerprint({
      stacks: p.stacks,
      families: p.families,
      miniStacks: p.miniStacks,
      favMiniStack: p.favMiniStack,
      streak: p.streak,
      bestStreak: p.bestStreak,
      reviews: p.todayReviews.count,
      premium: p.premium,
    });
  const handleSyncNow = async () => {
    const payload = buildCloudPayload();
    const ok = await window.wwordyCloud.pushData(payload);
    if (ok) lastSyncedRef.current = fingerprintOfPayload(payload);
    return ok;
  };
  // Applies data that came from the cloud (not from a backup file).
  const applyRemote = (rawData) => {
    const data = dmSanitizeBackup(rawData);
    applySyncedPremium(rawData && rawData.premium);
    // Older cloud copies were saved without mini stacks: keep this device's ones in that case.
    const hasMini = !!(rawData && (rawData.miniStacks || rawData.miniStack));
    const mini = hasMini ? migrateMiniStacks(data) : latestRef.current.miniStacks || {};
    const fav = hasMini ? data.favMiniStack || null : latestRef.current.favMiniStack || null;
    const best = Math.max(data.bestStreak || 0, data.streak || 1);
    const today = todayStr();
    const reviews =
      data.todayReviews && data.todayReviews.date === today ? data.todayReviews.count || 0 : 0;
    const fp = cloudFingerprint({
      stacks: data.stacks || [],
      families: data.families || [],
      miniStacks: mini,
      favMiniStack: fav,
      streak: data.streak || 1,
      bestStreak: best,
      reviews,
      premium: premiumForSync(),
    });
    if (fp === lastSyncedRef.current) return; // nothing new from the cloud
    lastSyncedRef.current = fp;
    setStacks(data.stacks || []);
    setMiniStacks(mini);
    setFavMiniStack(fav);
    setFamilies(data.families || []);
    setStreak(data.streak || 1);
    setBestStreak(best);
    setTodayReviews(reviews);
  };
  useEffect(() => {
    if (!account.id || !loaded) {
      syncReadyRef.current = false;
      lastSyncedRef.current = "";
      return;
    }
    const cloud = window.wwordyCloud;
    let cancelled = false;
    let unsub = () => {};
    let retry = null;
    syncReadyRef.current = false;
    const onVisible = async () => {
      if (document.visibilityState !== "visible" || !syncReadyRef.current) return;
      const r = await cloud.pullData();
      if (cancelled || r.failed || !r.payload) return;
      if (r.updated_by_device === cloud.getDeviceId()) return;
      applyRemote(r.payload);
    };
    (async () => {
      const remote = await cloud.pullData();
      if (cancelled) return;
      if (remote.failed) {
        // Could not read the cloud: keep local data and never overwrite the cloud blindly.
        retry = setTimeout(() => setRetryTick((n) => n + 1), 5000);
        return;
      }
      // Pro status comes from the server-owned entitlements table (no-op unless enabled in config).
      const ent = await cloud.getEntitlements();
      if (cancelled) return;
      if (!ent || !ent.failed) applyServerPremium(ent);
      const p = remote.payload;
      if (p && Array.isArray(p.stacks) && p.stacks.length) applyRemote(p);
      else applySyncedPremium(p && p.premium); // cloud has no stacks yet: local data gets uploaded
      syncReadyRef.current = true;
      setSyncTick((n) => n + 1);
      unsub = cloud.subscribe((payload) => {
        if (payload) applyRemote(payload);
      });
    })();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onVisible);
    return () => {
      cancelled = true;
      if (retry) clearTimeout(retry);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onVisible);
      unsub();
    };
  }, [account.id, loaded, retryTick]);
  useEffect(() => {
    if (!loaded || !account.id || !syncReadyRef.current) return;
    const payload = buildCloudPayload();
    const fp = fingerprintOfPayload(payload);
    if (fp === lastSyncedRef.current) return;
    const t = setTimeout(async () => {
      const ok = await window.wwordyCloud.pushData(payload);
      if (ok) lastSyncedRef.current = fp;
    }, 1200);
    return () => clearTimeout(t);
  }, [
    stacks,
    families,
    miniStacks,
    favMiniStack,
    streak,
    bestStreak,
    todayReviews,
    loaded,
    account.id,
    syncTick,
    premiumRefreshTick,
  ]);
  const updateStack = (updated) =>
    setStacks((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  const importAllData = (rawData) => {
    const data = dmSanitizeBackup(rawData);
    setStacks(data.stacks || []);
    setMiniStacks(migrateMiniStacks(data));
    setFavMiniStack(data.favMiniStack || null);
    setFamilies(data.families || []);
    setStreak(data.streak || 1);
    setBestStreak(Math.max(data.bestStreak || 0, data.streak || 1));
    const today = todayStr();
    setTodayReviews(
      data.todayReviews && data.todayReviews.date === today ? data.todayReviews.count || 0 : 0
    );
  };
  const resetAllData = () => {
    setStacks([]);
    setMiniStacks({});
    setFavMiniStack(null);
    setFamilies([]);
    setStreak(1);
    setBestStreak(1);
    setTodayReviews(0);
  };
  const createStack = (s) => {
    track("stack_created");
    setStacks((prev) => [
      s.familyId
        ? {
            ...s,
            familyAddedAt: Date.now(),
          }
        : s,
      ...prev,
    ]);
  };
  const createFamily = (name, emoji) => {
    const fam = {
      id: uid(),
      name,
      emoji: FAMILY_ICON_IDS.includes(emoji) ? emoji : "family",
    };
    setFamilies((prev) => [...prev, fam]);
    return fam;
  };
  const importFamily = (imported) => {
    const fam = {
      id: uid(),
      name: imported.name || "Imported family",
      emoji: FAMILY_ICON_IDS.includes(imported.emoji) ? imported.emoji : "family",
    };
    const importedAt = Date.now();
    const newStacks = (imported.stacks || []).map((s, i) => ({
      ...s,
      familyId: fam.id,
      familyAddedAt: importedAt - i,
    }));
    setFamilies((prev) => [...prev, fam]);
    setStacks((prev) => [...newStacks, ...prev]);
  };
  const renameFamily = (id, name) =>
    setFamilies((prev) =>
      prev.map((f) =>
        f.id === id
          ? {
              ...f,
              name,
            }
          : f
      )
    );
  const setFamilyEmoji = (id, emoji) =>
    setFamilies((prev) =>
      prev.map((f) =>
        f.id === id
          ? {
              ...f,
              emoji,
            }
          : f
      )
    );
  const deleteFamily = (id) => {
    setFamilies((prev) => prev.filter((f) => f.id !== id));
    setStacks((prev) =>
      prev.map((s) =>
        s.familyId === id
          ? {
              ...s,
              familyId: null,
              familyAddedAt: undefined,
            }
          : s
      )
    );
  };
  const setStackFamily = (stackId, familyId) => {
    setStacks((prev) =>
      prev.map((s) =>
        s.id === stackId
          ? {
              ...s,
              familyId,
              familyAddedAt: familyId ? Date.now() : undefined,
            }
          : s
      )
    );
  };
  const togglePinStack = (stackId) => {
    setStacks((prev) =>
      prev.map((s) =>
        s.id === stackId
          ? {
              ...s,
              pinned: !s.pinned,
            }
          : s
      )
    );
  };
  const toggleFamilyPinStack = (stackId) => {
    setStacks((prev) =>
      prev.map((s) =>
        s.id === stackId
          ? {
              ...s,
              familyPinned: !s.familyPinned,
            }
          : s
      )
    );
  };
  const archiveStack = (stackId) => {
    setStacks((prev) =>
      prev.map((s) =>
        s.id === stackId
          ? {
              ...s,
              archived: true,
            }
          : s
      )
    );
    setOpenStackId((cur) => (cur === stackId ? null : cur));
  };
  const unarchiveStack = (stackId) => {
    setStacks((prev) =>
      prev.map((s) =>
        s.id === stackId
          ? {
              ...s,
              archived: false,
            }
          : s
      )
    );
  };
  const activeStacks = useMemo(() => stacks.filter((s) => !s.archived), [stacks]);
  const archivedStacks = useMemo(() => stacks.filter((s) => s.archived), [stacks]);
  useEffect(() => {
    const names = [];
    stacks.forEach((s) => {
      if (s && s.name) names.push(s.name);
    });
    families.forEach((f) => {
      if (f && f.name) names.push(f.name);
    });
    Object.values(miniStacks).forEach((m) => {
      if (m && m.name) names.push(m.name);
    });
    if (favMiniStack && favMiniStack.name) names.push(favMiniStack.name);
    setUiProtectedNames(names);
  }, [stacks, families, miniStacks, favMiniStack]);
  const favoriteWords = useMemo(() => {
    const list = [];
    activeStacks.forEach((s) =>
      s.words.forEach((w) => {
        if (w.favorite)
          list.push({
            ...w,
            _stackId: s.id,
          });
      })
    );
    return list;
  }, [activeStacks]);
  const gamesStacks = useMemo(
    () =>
      favoriteWords.length
        ? [
            {
              id: "__favorites__",
              name: "Favorites",
              emoji: "star",
              words: favoriteWords,
            },
            ...activeStacks,
          ]
        : activeStacks,
    [favoriteWords, activeStacks]
  );
  const dueWords = useMemo(() => {
    const now = Date.now();
    const list = [];
    activeStacks.forEach((s) =>
      s.words.forEach((w) => {
        if (w.srs && w.srs.next <= now)
          list.push({
            ...w,
            _stackId: s.id,
          });
      })
    );
    return list;
  }, [activeStacks]);
  const createMiniStack = (stackId, emoji) => {
    if (!stackId) return;
    setMiniStacks((prev) =>
      prev[stackId]
        ? prev
        : {
            ...prev,
            [stackId]: {
              id: uid(),
              emoji: MINISTACK_ICON_IDS.includes(emoji) ? emoji : MINISTACK_ICON_IDS[0],
              words: [],
            },
          }
    );
  };
  const deleteMiniStack = (stackId) => {
    setMiniStacks((prev) => {
      if (!prev[stackId]) return prev;
      const next = {
        ...prev,
      };
      delete next[stackId];
      return next;
    });
  };
  const toggleMiniStackWord = (stackId, word) => {
    setMiniStacks((prev) => {
      const cur = prev[stackId];
      if (!cur) return prev;
      const exists = cur.words.some((w) => w.id === word.id);
      return {
        ...prev,
        [stackId]: {
          ...cur,
          words: exists ? cur.words.filter((w) => w.id !== word.id) : [...cur.words, word],
        },
      };
    });
  };
  const createFavMiniStack = (emoji) => {
    setFavMiniStack(
      (prev) =>
        prev || {
          id: uid(),
          emoji: MINISTACK_ICON_IDS.includes(emoji) ? emoji : MINISTACK_ICON_IDS[0],
          words: [],
        }
    );
  };
  const deleteFavMiniStack = () => {
    setFavMiniStack(null);
  };
  const toggleFavMiniStackWord = (word) => {
    setFavMiniStack((prev) => {
      if (!prev) return prev;
      const exists = prev.words.some((w) => w.id === word.id);
      return {
        ...prev,
        words: exists ? prev.words.filter((w) => w.id !== word.id) : [...prev.words, word],
      };
    });
  };
  const startReview = () => {
    if (!dueWords.length) return;
    setGame({
      type: "dailymix",
      stack: {
        id: "__due_review__",
        name: "Review",
        words: shuffle(dueWords),
      },
      direction: "de2en",
      isReview: true,
      backLabel: "Done",
    });
  };
  const startFamilyReview = (familyId) => {
    const now = Date.now();
    const fam = families.find((f) => f.id === familyId);
    const famDue = [];
    activeStacks.forEach((s) => {
      if (s.familyId !== familyId) return;
      s.words.forEach((w) => {
        if (w.srs && w.srs.next <= now)
          famDue.push({
            ...w,
            _stackId: s.id,
          });
      });
    });
    if (!famDue.length) return;
    setFamilyReviewPick({
      familyId,
      name: fam ? `${fam.name} review` : "Family review",
      words: famDue,
    });
  };
  const startFamilyReviewGame = (gameType, direction, level) => {
    if (!familyReviewPick) return;
    setGame({
      type: gameType,
      stack: {
        id: `__family_review_${familyReviewPick.familyId}__`,
        name: familyReviewPick.name,
        words: shuffle(familyReviewPick.words),
      },
      direction: direction || "de2en",
      level,
      isReview: true,
      backLabel: "Done",
    });
    setFamilyReviewPick(null);
  };
  const startFamilyPlay = (familyId) => {
    const fam = families.find((f) => f.id === familyId);
    const famWords = [];
    activeStacks.forEach((s) => {
      if (s.familyId !== familyId) return;
      s.words.forEach((w) =>
        famWords.push({
          ...w,
          _stackId: s.id,
        })
      );
    });
    if (!famWords.length) return;
    setFamilyPlayPick({
      familyId,
      name: fam ? fam.name : "Family",
      words: famWords,
    });
  };
  const startFamilyPlayGame = (gameType, direction, level) => {
    if (!familyPlayPick) return;
    setGame({
      type: gameType,
      stack: {
        id: `__family_play_${familyPlayPick.familyId}__`,
        name: familyPlayPick.name,
        words: shuffle(familyPlayPick.words),
      },
      direction: direction || "de2en",
      level,
      backLabel: "Done",
    });
    setFamilyPlayPick(null);
  };
  const startArchivedStackPlay = (stackId) => {
    const st = stacks.find((s) => s.id === stackId);
    if (!st || !st.words.length) return;
    setArchivedPlayPick({
      stackId,
      name: st.name,
      words: st.words.map((w) => ({
        ...w,
        _stackId: st.id,
      })),
    });
  };
  const startArchivedPlayGame = (gameType, direction, level) => {
    if (!archivedPlayPick) return;
    setGame({
      type: gameType,
      stack: {
        id: archivedPlayPick.stackId,
        name: archivedPlayPick.name,
        words: shuffle(archivedPlayPick.words),
      },
      direction: direction || "de2en",
      level,
      backLabel: "Done",
    });
    setArchivedPlayPick(null);
  };
  const startStackPlay = (st) => {
    if (!st || !st.words.length) return;
    setStackPlayPick({
      stackId: st.id,
      name: st.name,
      words: st.words.map((w) => ({
        ...w,
        _stackId: st.id,
      })),
    });
  };
  const startStackPlayGame = (gameType, direction, level) => {
    if (!stackPlayPick) return;
    setGame({
      type: gameType,
      stack: {
        id: stackPlayPick.stackId,
        name: stackPlayPick.name,
        words: shuffle(stackPlayPick.words),
      },
      direction: direction || "de2en",
      level,
      backLabel: "Back to stack",
    });
    setStackPlayPick(null);
  };
  const drillWord = (word, stackId, poolWords) => {
    setGame({
      type: "wordquiz",
      stack: {
        id: "__drill__",
        name: `Quiz: ${word.de}`,
        words: [
          {
            ...word,
            _stackId: stackId,
          },
        ],
      },
      pool: poolWords && poolWords.length ? poolWords : [word],
      direction: "de2en",
      isDrill: true,
      backLabel: openStackId ? "Back to stack" : "Done",
    });
  };
  const deleteStack = (id) => {
    setStacks((prev) => prev.filter((s) => s.id !== id));
    deleteMiniStack(id);
    setOpenStackId(null);
  };
  const addWordToStack = (stackId, word) => {
    track("word_added", {
      type: word && word.type,
    });
    setStacks((prev) =>
      prev.map((s) =>
        s.id === stackId
          ? {
              ...s,
              words: [...s.words, word],
            }
          : s
      )
    );
  };
  const addWordsToStack = (stackId, words) => {
    setStacks((prev) =>
      prev.map((s) =>
        s.id === stackId
          ? {
              ...s,
              words: [...s.words, ...words],
            }
          : s
      )
    );
  };
  const updateWordInStack = (stackId, wordId, fn) => {
    setStacks((prev) => {
      const totalFavorites = prev.reduce(
        (acc, st) => acc + st.words.filter((x) => x.favorite).length,
        0
      );
      return prev.map((s) =>
        s.id !== stackId
          ? s
          : {
              ...s,
              words: s.words.map((w) => {
                if (w.id !== wordId) return w;
                const next = fn(w);
                if (
                  !isPremium &&
                  !w.favorite &&
                  next.favorite &&
                  totalFavorites >= FREE_FAVORITE_LIMIT
                ) {
                  openPremium();
                  return w;
                }
                return next;
              }),
            }
      );
    });
  };
  const deleteWordFromStack = (stackId, wordId) => {
    setStacks((prev) =>
      prev.map((s) =>
        s.id !== stackId
          ? s
          : {
              ...s,
              words: s.words.filter((w) => w.id !== wordId),
            }
      )
    );
    setMiniStacks((prev) => {
      const cur = prev[stackId];
      if (!cur || !cur.words.some((w) => w.id === wordId)) return prev;
      return {
        ...prev,
        [stackId]: {
          ...cur,
          words: cur.words.filter((w) => w.id !== wordId),
        },
      };
    });
    setFavMiniStack((prev) =>
      prev && prev.words.some((w) => w.id === wordId)
        ? {
            ...prev,
            words: prev.words.filter((w) => w.id !== wordId),
          }
        : prev
    );
  };
  const registerAnswer = (stackId, wordId, correct) => {
    setTodayReviews((n) => n + 1);
    updateWordInStack(stackId, wordId, (w) => ({
      ...w,
      srs: bumpSrs(w, correct),
    }));
  };
  const [gamesStackId, setGamesStackId] = useState(null);
  const [gamesMixForms, setGamesMixForms] = useState(false);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [game ? `game-${game.type}` : openStackId ? `stack-${openStackId}` : `tab-${tab}`]);
  useEffect(() => {
    const onFilled = (e) => {
      const d = e && e.detail;
      if (!d || !d.id || !d.fields) return;
      setStacks((prev) =>
        prev.map((st) =>
          st.words.some((x) => x.id === d.id)
            ? {
                ...st,
                words: st.words.map((x) =>
                  x.id === d.id
                    ? {
                        ...x,
                        ...d.fields,
                      }
                    : x
                ),
              }
            : st
        )
      );
    };
    window.addEventListener("dm-word-forms-filled", onFilled);
    return () => window.removeEventListener("dm-word-forms-filled", onFilled);
  }, []);
  // Build grammar tables in the background as soon as words are available,
  // instead of waiting for the person to open the "All forms" modal. That
  // modal just reads w.paradigm (via dmHasParadigm), so anything queued up
  // here shows up instantly once they tap the table icon.
  useEffect(() => {
    if (!loaded || !isPremium || !apiKey) return;
    const code = currentLearningLangCode;
    if (code === "de") return;
    const queue = [];
    const seen = new Set();
    stacks.forEach((st) =>
      (st.words || []).forEach((w) => {
        if (!w || !w.id || seen.has(w.id)) return;
        if (!(w.type === "noun" || w.type === "verb" || w.type === "adj")) return;
        if (dmHasParadigm(w)) return;
        const key = "paradigm:" + w.id + ":" + code;
        window.__dmFormsDone = window.__dmFormsDone || {};
        window.__dmFormsBusy = window.__dmFormsBusy || {};
        if (window.__dmFormsDone[key] || window.__dmFormsBusy[key]) return;
        seen.add(w.id);
        queue.push(w);
      })
    );
    if (!queue.length) return;
    let cancelled = false;
    const PREFETCH_CONCURRENCY = 2;
    let cursor = 0;
    const runNext = () => {
      if (cancelled) return;
      const w = queue[cursor++];
      if (!w) return;
      const key = "paradigm:" + w.id + ":" + code;
      window.__dmFormsBusy[key] = true;
      dmFetchParadigm(apiKey, w)
        .then((p) => {
          // Persist the result even if this effect instance was since
          // superseded by a re-render (e.g. another word just finished) —
          // only the recursive scheduling below should stop, not the save.
          window.__dmFormsDone[key] = true;
          window.dispatchEvent(
            new CustomEvent("dm-word-forms-filled", {
              detail: {
                id: w.id,
                fields: {
                  paradigm: p,
                },
              },
            })
          );
        })
        .catch(() => {})
        .finally(() => {
          window.__dmFormsBusy[key] = false;
          if (!cancelled) runNext();
        });
    };
    for (let i = 0; i < PREFETCH_CONCURRENCY; i++) runNext();
    return () => {
      cancelled = true;
    };
    // Re-run whenever the word list changes shape (new words added/removed)
    // or premium/API-key/language state changes; already-built or
    // already-queued words are skipped via the __dmFormsDone/__dmFormsBusy
    // caches above, so this stays cheap.
  }, [loaded, isPremium, apiKey, learningLanguage, stacks]);
  // Same idea for romanization: build it in the background for everyone
  // (free included) as soon as words exist, instead of waiting on a manual
  // button tap. Premium only gates whether it's *shown* (see WordCard),
  // not whether the AI generates it.
  useEffect(() => {
    if (!loaded || !apiKey) return;
    const code = currentLearningLangCode;
    if (!ROMAN_LANGS[code]) return;
    const missing = [];
    const seen = new Set();
    stacks.forEach((st) =>
      (st.words || []).forEach((w) => {
        if (!w || !w.id || seen.has(w.id)) return;
        if (!w.de || String(w.roman || "").trim()) return;
        const key = "roman:" + w.id + ":" + code;
        window.__dmRomanDone = window.__dmRomanDone || {};
        window.__dmRomanBusy = window.__dmRomanBusy || {};
        if (window.__dmRomanDone[key] || window.__dmRomanBusy[key]) return;
        seen.add(w.id);
        missing.push(w);
      })
    );
    if (!missing.length) return;
    let cancelled = false;
    (async () => {
      for (let i = 0; i < missing.length; i += 40) {
        if (cancelled) return;
        const chunk = missing.slice(i, i + 40);
        chunk.forEach((w) => {
          window.__dmRomanBusy["roman:" + w.id + ":" + code] = true;
        });
        try {
          const out = await dmFetchRomanBatch(
            apiKey,
            code,
            chunk.map((w) => stripArticle(w.de).replace(/^sich\s+/i, ""))
          );
          Object.keys(out).forEach((k) => {
            const w = chunk[Number(k)];
            if (!w) return;
            window.__dmRomanDone["roman:" + w.id + ":" + code] = true;
            window.dispatchEvent(
              new CustomEvent("dm-word-forms-filled", {
                detail: {
                  id: w.id,
                  fields: {
                    roman: out[k],
                  },
                },
              })
            );
          });
        } catch (e) {
        } finally {
          chunk.forEach((w) => {
            window.__dmRomanBusy["roman:" + w.id + ":" + code] = false;
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loaded, apiKey, learningLanguage, stacks]);
  if (!loaded) {
    return (
      <div className={`dm-app dm-loading ${theme !== "dark" ? `dm-${theme}` : ""}`}>
        <div className="dm-skeleton-wrap">
          <div className="dm-skeleton-header">
            <AppLogo size={30} />
            <span className="dm-skeleton-brand notranslate" translate="no">
              wwordy
            </span>
          </div>
          <div className="dm-skeleton-bar dm-skeleton-bar-title" />
          <div className="dm-skeleton-list">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="dm-skeleton-card"
                style={{
                  animationDelay: `${i * 0.08}s`,
                }}
              >
                <div className="dm-skeleton-line dm-skeleton-line-lg" />
                <div className="dm-skeleton-line dm-skeleton-line-sm" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  const openStack = stacks.find((s) => s.id === openStackId);
  const goTab = (id) => {
    if (game) setGame(null);
    if (openStackId) setOpenStackId(null);
    if (tab === "games" && id !== "games") {
      setGamesStackId(null);
      setGamesMixForms(false);
    }
    setTab(id);
  };
  let content;
  const viewKey = game ? `game-${game.type}` : openStack ? `stack-${openStack.id}` : `tab-${tab}`;
  if (game) {
    const wantsFormsOnly = !!game.mixForms && FORMS_ONLY_GAMES.includes(game.type);
    const formsPool = wantsFormsOnly ? buildFormWordPool(game.stack.words) : null;
    const effectiveWords = formsPool && formsPool.length ? formsPool : game.stack.words;
    const props = {
      key: `${game.type}-${game.stack.id}-${game.direction || "de2en"}-${game.mixForms ? "mix" : "std"}-${game.runId || 0}`,
      words: effectiveWords,
      pool: game.pool || effectiveWords,
      mixForms: game.mixForms,
      stacks,
      onAddWord: addWordToStack,
      level: game.level,
      onAnswer: (wordId, correct) => {
        const srcWord = game.stack.words.find((w) => w.id === wordId);
        const srcStackId = (srcWord && srcWord._stackId) || game.stack.id;
        registerAnswer(srcStackId, wordId, correct);
      },
      onExit: () => {
        if (!isPremium && game) recordGameCooldown(game.type);
        setGame(null);
      },
      onPlayAgain: () =>
        setGame((g) =>
          g
            ? {
                ...g,
                runId: (g.runId || 0) + 1,
              }
            : g
        ),
      direction: game.direction || "de2en",
      apiKey,
      onOpenAI: openAI,
      title: game.isReview ? "Review" : undefined,
      learningLanguage,
      nativeLanguage,
    };
    if (game.type === "flashcards") content = <FlashcardsGame {...props} />;
    else if (game.type === "sprint") content = <MultipleChoiceGame {...props} timed />;
    else if (game.type === "quiz") content = <MultipleChoiceGame {...props} timed={false} />;
    else if (game.type === "matching") content = <MatchingGame {...props} />;
    else if (game.type === "truefalse") content = <TrueFalseGame {...props} />;
    else if (game.type === "memory") content = <MemoryGame {...props} />;
    else if (game.type === "ladder") content = <ConjugationLadderGame {...props} />;
    else if (game.type === "paradigm") content = <ParadigmGame {...props} />;
    else if (game.type === "dailymix") content = <DailyMixGame {...props} />;
    else if (game.type === "wordrain") content = <WordRainGame {...props} />;
    else if (game.type === "scramble") content = <ScrambleGame {...props} />;
    else if (game.type === "write") content = <WriteGame {...props} />;
    else if (game.type === "wordforms") content = <WordFormsGame {...props} />;
    else if (game.type === "sentence") content = <SentencePracticeGame {...props} />;
    else if (game.type === "listening") content = <ListeningDictationGame {...props} />;
    else if (game.type === "cases") content = <CasesGame {...props} />;
    else if (game.type === "speedforms") content = <SpeedFormsGame {...props} />;
    else if (game.type === "tensemixer") content = <TenseMixerGame {...props} />;
    else if (game.type === "adjendings") content = <AdjEndingsGame {...props} />;
    else if (game.type === "wordquiz") content = <WordQuizGame {...props} />;
    else if (game.type === "speaking") content = <SpeakingGame {...props} />;
  } else if (openStack) {
    content = (
      <StackView
        stack={openStack}
        onBack={() => setOpenStackId(null)}
        onUpdateStack={updateStack}
        onDeleteStack={deleteStack}
        onSpeak={speak}
        onOpenAI={openAI}
        apiKey={apiKey}
        onDrillWord={drillWord}
        miniStack={miniStacks[openStack.id] || null}
        onCreateMiniStack={(emoji) => createMiniStack(openStack.id, emoji)}
        onToggleMiniStackWord={(word) => toggleMiniStackWord(openStack.id, word)}
        onDeleteMiniStack={() => deleteMiniStack(openStack.id)}
        allStacks={activeStacks}
        onUpdateWord={updateWordInStack}
        onDeleteWord={deleteWordFromStack}
        onPlayGames={startStackPlay}
        nativeLanguage={nativeLanguage}
        learningLanguage={learningLanguage}
        onOpenPremium={openPremium}
        isPremium={isPremium}
      />
    );
  } else if (tab === "home") {
    content = (
      <HomeView
        stacks={activeStacks}
        families={families}
        onSetStackFamily={setStackFamily}
        onOpenStack={setOpenStackId}
        onCreateStack={createStack}
        onImportFamily={importFamily}
        streak={streak}
        bestStreak={bestStreak}
        onOpenAI={openAI}
        theme={theme}
        onToggleTheme={toggleTheme}
        dueCount={dueWords.length}
        todayReviews={todayReviews}
        dailyGoal={dailyGoal}
        onStartReview={startReview}
        onStartFamilyReview={startFamilyReview}
        onPlayFamilyGames={startFamilyPlay}
        showFamilyStats={showFamilyStats}
        hideFamilyFilters={hideFamilyFilters}
        onTogglePinStack={togglePinStack}
        onToggleFamilyPinStack={toggleFamilyPinStack}
        onDeleteStack={deleteStack}
        onArchiveStack={archiveStack}
        learningLanguage={learningLanguage}
        onOpenPremium={openPremium}
        isPremium={isPremium}
        gemsBalance={gemsBalance}
        onOpenStore={openStore}
        account={account}
        onOpenAccount={openAccountEntry}
      />
    );
  } else if (tab === "games") {
    content = (
      <GamesHub
        stacks={gamesStacks}
        stackId={
          gamesStackId || (gamesStacks.find((s) => s.id !== "__favorites__") || gamesStacks[0])?.id
        }
        onChangeStackId={setGamesStackId}
        mixForms={gamesMixForms}
        onChangeMixForms={setGamesMixForms}
        onStart={(type, stack, direction, level, mixForms) =>
          setGame({
            type,
            stack:
              stack && stack.id === "__favorites__"
                ? {
                    ...stack,
                    words: shuffle(stack.words),
                  }
                : stack,
            direction,
            level,
            mixForms,
          })
        }
        learningLanguage={learningLanguage}
        nativeLanguage={nativeLanguage}
        isPremium={isPremium}
        onOpenPremium={openPremium}
      />
    );
  } else if (tab === "favorites") {
    content = (
      <FavoritesView
        stacks={activeStacks}
        onUpdateWord={updateWordInStack}
        onDeleteWord={deleteWordFromStack}
        onSpeak={speak}
        apiKey={apiKey}
        onOpenAI={openAI}
        onDrillWord={drillWord}
        miniStack={favMiniStack}
        onCreateMiniStack={createFavMiniStack}
        onToggleMiniStackWord={toggleFavMiniStackWord}
        onDeleteMiniStack={deleteFavMiniStack}
        nativeLanguage={nativeLanguage}
        learningLanguage={learningLanguage}
        isPremium={isPremium}
        onOpenPremium={openPremium}
      />
    );
  } else if (tab === "settings") {
    content = (
      <SettingsView
        key={`settings-${settingsMountKey}`}
        theme={theme}
        onSelectTheme={selectTheme}
        streak={streak}
        stacks={activeStacks}
        archivedStacks={archivedStacks}
        onUnarchiveStack={unarchiveStack}
        onPlayArchivedStack={startArchivedStackPlay}
        families={families}
        onCreateFamily={createFamily}
        onRenameFamily={renameFamily}
        onDeleteFamily={deleteFamily}
        onSetFamilyEmoji={setFamilyEmoji}
        onImportFamily={importFamily}
        onOpenStack={setOpenStackId}
        onPlayFamilyGames={startFamilyPlay}
        showFamilyStats={showFamilyStats}
        onToggleShowFamilyStats={toggleShowFamilyStats}
        hideFamilyFilters={hideFamilyFilters}
        onToggleHideFamilyFilters={toggleHideFamilyFilters}
        restrictCopy={restrictCopy}
        onToggleRestrictCopy={toggleRestrictCopy}
        hideArticles={hideArticles}
        onToggleHideArticles={toggleHideArticles}
        showLevelBadge={showLevelBadge}
        onToggleShowLevelBadge={toggleShowLevelBadge}
        dueCount={dueWords.length}
        todayReviews={todayReviews}
        bestStreak={bestStreak}
        onImportAllData={importAllData}
        onResetAllData={resetAllData}
        dailyGoal={dailyGoal}
        onSetDailyGoal={updateDailyGoal}
        nativeLanguage={nativeLanguage}
        learningLanguage={learningLanguage}
        onSetNativeLanguage={updateNativeLanguage}
        onSetLearningLanguage={updateLearningLanguage}
        initialSection={settingsInitialSection}
        onConsumeInitialSection={() => setSettingsInitialSection(null)}
        isPremium={isPremium}
        onPremiumChange={() => setPremiumRefreshTick((n) => n + 1)}
        onExitToPreviousTab={exitPremiumToPreviousTab}
        gemsBalance={gemsBalance}
        onAddGems={addGems}
        account={account}
        onOpenAuth={openAuth}
        onSignOut={handleSignOut}
        onSyncNow={handleSyncNow}
        onDeleteAccount={handleDeleteAccount}
        onCreateStack={createStack}
      />
    );
  }
  if (adminPage) {
    return (
      <div className={`dm-app ${theme !== "dark" ? `dm-${theme}` : ""}`}>
        <div className="dm-bg-glow dm-bg-glow-1" />
        <div className="dm-bg-glow dm-bg-glow-2" />
        <div className="dm-content dm-content-noreserve">
          <Suspense fallback={null}>
            <AdminPage onClose={closeAdminPage} />
          </Suspense>
        </div>
      </div>
    );
  }
  return (
    <HideArticlesContext.Provider value={hideArticles}>
      <ShowLevelBadgeContext.Provider value={showLevelBadge}>
        <div
          className={`dm-app ${theme !== "dark" ? `dm-${theme}` : ""} ${restrictCopy ? "dm-restrict-copy" : ""} ${game || tab === "games" ? "dm-section-games" : ""}`}
        >
          <div
            id="google_translate_element"
            className="notranslate"
            style={{
              display: "none",
            }}
          />
          <div className="dm-bg-glow dm-bg-glow-1" />
          <div className="dm-bg-glow dm-bg-glow-2" />
          <div className={`dm-content ${openStack && !game ? "dm-content-noreserve" : ""}`}>
            <Fragment key={viewKey}>
              <GameBackLabelContext.Provider value={(game && game.backLabel) || "Back to games"}>
                <Suspense fallback={null}>{content}</Suspense>
              </GameBackLabelContext.Provider>
            </Fragment>
          </div>
          <BottomNav
            tab={tab}
            setTab={goTab}
            hidden={!!(game || openStack)}
            learningLanguage={learningLanguage}
          />
          <Suspense fallback={null}>
          {aiOpen && (
            <AiModal
              apiKey={apiKey}
              onSaveKey={saveApiKey}
              onClose={() => setAiOpen(false)}
              contextStack={openStack || null}
              stacks={activeStacks}
              onCreateStack={createStack}
              onAddWord={addWordToStack}
              messages={aiMessages}
              setMessages={setAiMessages}
              isPremium={isPremium}
              onOpenPremium={() => {
                setAiOpen(false);
                openPremium();
              }}
              learningLanguage={learningLanguage}
              nativeLanguage={nativeLanguage}
            />
          )}
          {storeOpen && (
            <StoreView
              onClose={() => setStoreOpen(false)}
              stacks={activeStacks}
              onCreateStack={createStack}
              onAddWordsToStack={addWordsToStack}
              gemsBalance={gemsBalance}
              onSpendGems={spendGems}
              onAddGems={addGems}
              apiKey={apiKey}
              onOpenAI={() => {
                setStoreOpen(false);
                openAI();
              }}
              nativeLanguage={nativeLanguage}
              learningLanguage={learningLanguage}
              onOpenPremium={() => {
                setStoreOpen(false);
                openPremium();
              }}
            />
          )}
          {authOpen && (
            <AuthModal mode={authMode} onClose={closeAuth} onSuccess={handleAuthSuccess} />
          )}
          {dailyBonus && (
            <DailyBonusToast
              amount={dailyBonus.amount}
              streak={dailyBonus.streak}
              onDismiss={() => setDailyBonus(null)}
            />
          )}
          {familyReviewPick && (
            <ReviewGamePicker
              words={familyReviewPick.words}
              title={familyReviewPick.name}
              onClose={() => setFamilyReviewPick(null)}
              onStart={startFamilyReviewGame}
              learningLanguage={learningLanguage}
              nativeLanguage={nativeLanguage}
              isPremium={isPremium}
              onOpenPremium={openPremium}
            />
          )}
          {familyPlayPick && (
            <ReviewGamePicker
              words={familyPlayPick.words}
              title={familyPlayPick.name}
              onClose={() => setFamilyPlayPick(null)}
              onStart={startFamilyPlayGame}
              learningLanguage={learningLanguage}
              nativeLanguage={nativeLanguage}
              isPremium={isPremium}
              onOpenPremium={openPremium}
            />
          )}
          {archivedPlayPick && (
            <ReviewGamePicker
              words={archivedPlayPick.words}
              title={archivedPlayPick.name}
              onClose={() => setArchivedPlayPick(null)}
              onStart={startArchivedPlayGame}
              learningLanguage={learningLanguage}
              nativeLanguage={nativeLanguage}
              isPremium={isPremium}
              onOpenPremium={openPremium}
            />
          )}
          {stackPlayPick && (
            <ReviewGamePicker
              words={stackPlayPick.words}
              title={stackPlayPick.name}
              onClose={() => setStackPlayPick(null)}
              onStart={startStackPlayGame}
              translationsOnly
              learningLanguage={learningLanguage}
              nativeLanguage={nativeLanguage}
              isPremium={isPremium}
              onOpenPremium={openPremium}
            />
          )}
          {showOnboarding && (
            <OnboardingFlow
              nativeLanguage={nativeLanguage}
              learningLanguage={learningLanguage}
              onSetNativeLanguage={updateNativeLanguage}
              onSetLearningLanguage={updateLearningLanguage}
              theme={theme}
              onSelectTheme={selectTheme}
              starterStack={starterStack}
              onSetStarterStack={updateStarterStack}
              onFinish={completeOnboarding}
            />
          )}
          </Suspense>
          {i18nLoading && (
            <TranslationLoadingOverlay
              percent={i18nLoading.percent}
              etaSeconds={i18nLoading.etaSeconds}
              languageName={UI_LANG_NAMES[i18nLoading.code] || i18nLoading.code}
              strings={i18nLoadingStrings}
            />
          )}
        </div>
      </ShowLevelBadgeContext.Provider>
    </HideArticlesContext.Provider>
  );
}
