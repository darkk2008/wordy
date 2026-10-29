/* components/home/home.jsx
 * HomeView: the main screen.
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { uid } from "../../core/constants";
import { ICON_IDS } from "../../core/icon-registry";
import { AnimatedIcon, AppLogo, IconBtn } from "../common/common";
import { Input } from "../common/Input";
import {
  Bot,
  CameraIcon,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Flame,
  Layers,
  Moon,
  Plus,
  Search,
  Sparkles,
  Star,
  Sun,
  Trash2,
  Type,
  UserIcon,
  X,
} from "../icons/icons";
import { ArchiveIcon } from "../icons/settings-icons";
import { StreakModal } from "../pickers/pickers";
import { QRScanModal, QR_SHARING_ENABLED } from "../qr-share/qr-share";
import { StackCard } from "../stack-card/stack-card";
import { dmListClickGuard } from "../swipeable-row/swipeable-row";

import { activateOnKey } from "../../behaviors/keyboard-activation";
export function HomeView({
  stacks,
  families,
  onSetStackFamily,
  onOpenStack,
  onCreateStack,
  onImportFamily,
  streak,
  bestStreak,
  onOpenAI,
  theme,
  onToggleTheme,
  dueCount,
  todayReviews,
  dailyGoal,
  onStartReview,
  onStartFamilyReview,
  onPlayFamilyGames,
  showFamilyStats,
  hideFamilyFilters,
  onTogglePinStack,
  onToggleFamilyPinStack,
  onDeleteStack,
  onArchiveStack,
  learningLanguage,
  onOpenPremium,
  isPremium,
  account,
  onOpenAccount,
}) {
  const totalWords = stacks.reduce((n, st) => n + ((st.words && st.words.length) || 0), 0);
  const [creating, setCreating] = useState(false);
  const [streakOpen, setStreakOpen] = useState(false);
  const [name, setName] = useState("");
  const EMOJIS = ICON_IDS;
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [scanning, setScanning] = useState(false);
  const [newStackFamilyId, setNewStackFamilyId] = useState(null);
  const [familyDropdownOpen, setFamilyDropdownOpen] = useState(false);
  const familyDropdownRef = useRef(null);
  useEffect(() => {
    if (!familyDropdownOpen) return;
    const handler = (e) => {
      if (familyDropdownRef.current && !familyDropdownRef.current.contains(e.target)) {
        setFamilyDropdownOpen(false);
      }
    };
    const keyHandler = (e) => {
      if (e.key === "Escape") setFamilyDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler, true);
    document.addEventListener("keydown", keyHandler, true);
    return () => {
      document.removeEventListener("mousedown", handler, true);
      document.removeEventListener("keydown", keyHandler, true);
    };
  }, [familyDropdownOpen]);
  const [activeFamily, setActiveFamily] = useState("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef(null);
  useEffect(() => {
    if (searchOpen && searchInputRef.current) searchInputRef.current.focus();
  }, [searchOpen]);
  const secretRef = useRef({
    stage: 0,
    clicks: 0,
    timer: null,
  });
  useEffect(
    () => () => {
      if (secretRef.current.timer) clearTimeout(secretRef.current.timer);
    },
    []
  );
  const resetSecret = () => {
    secretRef.current.stage = 0;
    secretRef.current.clicks = 0;
  };
  const armSecretTimeout = () => {
    if (secretRef.current.timer) clearTimeout(secretRef.current.timer);
    secretRef.current.timer = setTimeout(resetSecret, 6e3);
  };
  const handleLogoClick = () => {
    const s = secretRef.current;
    if (s.stage === 0) {
      s.clicks += 1;
      armSecretTimeout();
      if (s.clicks >= 5) {
        s.stage = 1;
        s.clicks = 0;
      }
    } else if (s.stage === 3) {
      s.clicks += 1;
      armSecretTimeout();
      if (s.clicks >= 2) {
        if (s.timer) clearTimeout(s.timer);
        resetSecret();
        // The admin tools are a separate page (#admin), handled in app.jsx.
        window.location.hash = "admin";
      }
    }
  };
  const toggleSearch = () => {
    setSearchOpen((o) => {
      const next = !o;
      if (!next && searchQuery) handleSearchChange("");
      if (next && secretRef.current.stage === 1) {
        secretRef.current.stage = 2;
        armSecretTimeout();
      }
      return next;
    });
  };
  const [menuStackId, setMenuStackId] = useState(null);
  const [closingMenuId, setClosingMenuId] = useState(null);
  const menuCloseTimerRef = useRef(null);
  const closeStackMenu = useCallback((id) => {
    if (menuCloseTimerRef.current) clearTimeout(menuCloseTimerRef.current);
    setMenuStackId((cur) => (cur === id ? null : cur));
    setClosingMenuId(id);
    menuCloseTimerRef.current = setTimeout(() => {
      setClosingMenuId((cur) => (cur === id ? null : cur));
    }, 160);
  }, []);
  useEffect(
    () => () => {
      if (menuCloseTimerRef.current) clearTimeout(menuCloseTimerRef.current);
    },
    []
  );
  useEffect(() => {
    if (!menuStackId) return;
    const handler = (e) => {
      if (
        e.target.closest &&
        (e.target.closest(".dm-stack-dots") || e.target.closest(".dm-dots-menu"))
      )
        return;
      e.preventDefault();
      e.stopPropagation();
      closeStackMenu(menuStackId);
    };
    const keyHandler = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeStackMenu(menuStackId);
      }
    };
    document.addEventListener("click", handler, true);
    document.addEventListener("keydown", keyHandler, true);
    return () => {
      document.removeEventListener("click", handler, true);
      document.removeEventListener("keydown", keyHandler, true);
    };
  }, [menuStackId, closeStackMenu]);
  const [assigningStackId, setAssigningStackId] = useState(null);
  const [confirmDeleteStackId, setConfirmDeleteStackId] = useState(null);
  const [confirmArchiveStackId, setConfirmArchiveStackId] = useState(null);
  const gridRef = useRef(null);
  const cardRefs = useRef({});
  const [exitingCards, setExitingCards] = useState([]);
  const [enteringIds, setEnteringIds] = useState(() => new Set());
  const exitTimersRef = useRef({});
  const enterTimersRef = useRef({});
  const pendingFlipRef = useRef(null);
  const setCardRef = useCallback((id, node) => {
    if (node) cardRefs.current[id] = node;
    else delete cardRefs.current[id];
  }, []);
  const familyById = {};
  families.forEach((f) => {
    familyById[f.id] = f;
  });
  const stackMatchesQuery = useCallback(
    (s, q) => {
      if (!q) return true;
      if (s.name && s.name.toLowerCase().includes(q)) return true;
      const fam = s.familyId ? familyById[s.familyId] : null;
      if (fam && fam.name && fam.name.toLowerCase().includes(q)) return true;
      return s.words.some((w) =>
        [w.de, w.en, w.plural, w.praeteritum, w.partizipII, w.komparativ, w.superlativ]
          .filter(Boolean)
          .some((f) => f.toLowerCase().includes(q))
      );
    },
    [familyById]
  );
  const computeVisibleIds = useCallback(
    (family, query) => {
      const q = (query || "").trim().toLowerCase();
      return stacks
        .filter((s) => (family === "all" || s.familyId === family) && stackMatchesQuery(s, q))
        .map((s) => s.id);
    },
    [stacks, stackMatchesQuery]
  );
  const beginVisibilityTransition = useCallback(
    (nextVisibleIds) => {
      const container = gridRef.current;
      const containerRect = container
        ? container.getBoundingClientRect()
        : {
            left: 0,
            top: 0,
          };
      const rects = {};
      Object.keys(cardRefs.current).forEach((id) => {
        const node = cardRefs.current[id];
        if (!node) return;
        const r = node.getBoundingClientRect();
        rects[id] = {
          left: r.left - containerRect.left,
          top: r.top - containerRect.top,
          width: r.width,
          height: r.height,
        };
      });
      const prevVisibleIds = Object.keys(cardRefs.current);
      const nextVisibleSet = new Set(nextVisibleIds);
      const disappearing = prevVisibleIds
        .filter((id) => !nextVisibleSet.has(id))
        .map((id) => {
          const stackObj = stacks.find((s) => s.id === id);
          return stackObj
            ? {
                id,
                stack: stackObj,
                rect: rects[id],
              }
            : null;
        })
        .filter((x) => x && x.rect);
      pendingFlipRef.current = {
        rects,
        disappearing,
        prevVisibleIds,
      };
    },
    [stacks]
  );
  const changeFamily = useCallback(
    (nextFamily) => {
      setActiveFamily((cur) => {
        if (cur === nextFamily) return cur;
        beginVisibilityTransition(computeVisibleIds(nextFamily, searchQuery));
        return nextFamily;
      });
    },
    [beginVisibilityTransition, computeVisibleIds, searchQuery]
  );
  const handleSearchChange = (value) => {
    beginVisibilityTransition(computeVisibleIds(activeFamily, value));
    setSearchQuery(value);
    if (secretRef.current.stage === 2 && value.trim().toLowerCase() === "admin") {
      secretRef.current.stage = 3;
      secretRef.current.clicks = 0;
      armSecretTimeout();
    }
  };
  const statsRowRef = useRef(null);
  useLayoutEffect(() => {
    const row = statsRowRef.current;
    if (!row) return;
    const fit = () => {
      const btn = row.querySelector(".dm-stat-newstack");
      if (!btn) return;
      btn.classList.remove("dm-newstack-compact");
      const overflows = row.scrollWidth > row.clientWidth + 1 || btn.scrollWidth > btn.clientWidth + 1;
      if (overflows) btn.classList.add("dm-newstack-compact");
    };
    fit();
    let ro = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(fit);
      ro.observe(row);
    }
    window.addEventListener("resize", fit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit).catch(() => {});
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, [stacks.length, totalWords, learningLanguage, theme]);
  useLayoutEffect(() => {
    const pending = pendingFlipRef.current;
    pendingFlipRef.current = null;
    if (!pending) return;
    const container = gridRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    Object.keys(cardRefs.current).forEach((id) => {
      const node = cardRefs.current[id];
      const oldRect = pending.rects[id];
      if (!node || !oldRect) return;
      const newRectRaw = node.getBoundingClientRect();
      const dx = oldRect.left - (newRectRaw.left - containerRect.left);
      const dy = oldRect.top - (newRectRaw.top - containerRect.top);
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
        node.style.transition = "none";
        node.style.transform = `translate(${dx}px, ${dy}px)`;
        node.getBoundingClientRect();
        requestAnimationFrame(() => {
          node.style.transition = "";
          node.style.transform = "";
        });
      }
    });
    const prevVisibleSet = new Set(pending.prevVisibleIds);
    const newlyEntered = Object.keys(cardRefs.current).filter((id) => !prevVisibleSet.has(id));
    if (newlyEntered.length) {
      setEnteringIds((prev) => {
        const next = new Set(prev);
        newlyEntered.forEach((id) => next.add(id));
        return next;
      });
      newlyEntered.forEach((id) => {
        if (enterTimersRef.current[id]) clearTimeout(enterTimersRef.current[id]);
        enterTimersRef.current[id] = setTimeout(() => {
          setEnteringIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
          delete enterTimersRef.current[id];
        }, 380);
      });
    }
    if (pending.disappearing.length) {
      setExitingCards((prev) => [...prev, ...pending.disappearing]);
      pending.disappearing.forEach(({ id }) => {
        if (exitTimersRef.current[id]) clearTimeout(exitTimersRef.current[id]);
        exitTimersRef.current[id] = setTimeout(() => {
          setExitingCards((prev) => prev.filter((x) => x.id !== id));
          delete exitTimersRef.current[id];
        }, 340);
      });
    }
  }, [activeFamily, searchQuery]);
  useEffect(
    () => () => {
      Object.values(exitTimersRef.current).forEach(clearTimeout);
      Object.values(enterTimersRef.current).forEach(clearTimeout);
    },
    []
  );
  const assigningStack = stacks.find((s) => s.id === assigningStackId) || null;
  const confirmDeleteStack = stacks.find((s) => s.id === confirmDeleteStackId) || null;
  const confirmArchiveStack = stacks.find((s) => s.id === confirmArchiveStackId) || null;
  const familyStats = useMemo(() => {
    const now = Date.now();
    const map = {};
    families.forEach((f) => {
      const famStacks = stacks.filter((s) => s.familyId === f.id);
      let words = 0,
        mastered = 0,
        due = 0;
      famStacks.forEach((s) =>
        s.words.forEach((w) => {
          words++;
          if (w.srs && w.srs.level >= 5) mastered++;
          if (w.srs && w.srs.next <= now) due++;
        })
      );
      map[f.id] = {
        stackCount: famStacks.length,
        words,
        mastered,
        due,
        progress: words ? Math.round((mastered / words) * 100) : 0,
      };
    });
    return map;
  }, [families, stacks]);
  const activeFamilyStats =
    activeFamily !== "all" && !searchQuery.trim() ? familyStats[activeFamily] : null;
  const trimmedQuery = searchQuery.trim().toLowerCase();
  const visibleStacks = useMemo(() => {
    const filtered = stacks.filter(
      (s) =>
        (activeFamily === "all" || s.familyId === activeFamily) &&
        stackMatchesQuery(s, trimmedQuery)
    );
    return filtered
      .map((s, i) => ({
        s,
        i,
      }))
      .sort((a, b) => {
        const aPinned = !!a.s.pinned || (activeFamily !== "all" && !!a.s.familyPinned);
        const bPinned = !!b.s.pinned || (activeFamily !== "all" && !!b.s.familyPinned);
        if (aPinned !== bPinned) return aPinned ? -1 : 1;
        if (activeFamily !== "all") {
          const aAt = a.s.familyAddedAt || 0;
          const bAt = b.s.familyAddedAt || 0;
          if (aAt !== bAt) return bAt - aAt;
        }
        return a.i - b.i;
      })
      .map((x) => x.s);
  }, [stacks, activeFamily, trimmedQuery, stackMatchesQuery]);
  const goalN = dailyGoal || 0;
  const doneN = Math.min(todayReviews || 0, goalN);
  const goalPct = goalN ? Math.round((doneN / goalN) * 100) : 0;
  const goalReached = goalN > 0 && doneN >= goalN;
  return (
    <div className="dm-view dm-home-view">
      <div className="dm-mobile-brand notranslate" translate="no">
        <span className="dm-brand-ww">ww</span>ordy
      </div>
      <div className="dm-header">
        <div role="button" tabIndex={0} onKeyDown={activateOnKey} className="dm-header-brand" onClick={handleLogoClick}>
          <AppLogo
            size={84}
            className="dm-header-logo"
            animated
            learningLanguage={learningLanguage}
          />
        </div>
        <div className="dm-home-hero-copy">
          <h1 className="dm-h1 dm-home-hero-title">
            <span className="dm-brand-ww">ww</span>ordy
          </h1>
        </div>
        <div className="dm-header-actions">
          {!isPremium && (
            <button
              type="button"
              className="dm-topbar-premium-btn dm-home-premium-btn"
              title="Upgrade to Premium"
              onClick={() => onOpenPremium && onOpenPremium()}
            >
              <Star size={19} />
              <span className="dm-topbar-premium-label-full">Premium</span>
              <span className="dm-topbar-premium-label-short">Pro</span>
            </button>
          )}
          <IconBtn
            title={
              account && account.checking
                ? "Checking account…"
                : account && account.id
                  ? `Account: ${account.id}`
                  : "Sign up or sign in"
            }
            className="dm-account-btn"
            onClick={onOpenAccount}
          >
            <UserIcon size={20} />
            {account && account.id && <span className="dm-account-dot" />}
          </IconBtn>
          <IconBtn title="AI Tutor" onClick={onOpenAI}>
            <Bot size={20} />
          </IconBtn>
          <IconBtn
            title={searchOpen ? "Close search" : "Search stacks"}
            active={searchOpen}
            onClick={toggleSearch}
          >
            <Search size={20} />
          </IconBtn>
          {QR_SHARING_ENABLED && (
            <IconBtn title="Import stack via QR" onClick={() => setScanning(true)}>
              <CameraIcon size={20} />
            </IconBtn>
          )}
          <button
            type="button"
            className="dm-streak"
            title="Streak details"
            aria-label={`Streak: ${streak} ${streak === 1 ? "day" : "days"}. Show details`}
            onClick={() => setStreakOpen(true)}
          >
            <Flame size={20} color="#FF3B5C" />
            <span>{streak}</span>
          </button>
          {streakOpen && (
            <StreakModal
              streak={streak}
              bestStreak={bestStreak}
              todayReviews={todayReviews}
              dailyGoal={dailyGoal}
              onClose={() => setStreakOpen(false)}
            />
          )}
        </div>
      </div>
      <div className="dm-stats-row" ref={statsRowRef}>
        <div className="dm-stats-group">
          <div
            className="dm-count-pill"
            role="group"
            aria-label={`${stacks.length} ${stacks.length === 1 ? "stack" : "stacks"}, ${totalWords} ${totalWords === 1 ? "word" : "words"}`}
          >
            <span className="dm-count-item">
              <Layers size={14} />
              <b>{stacks.length.toLocaleString()}</b>
              <span className="dm-count-label">{stacks.length === 1 ? "stack" : "stacks"}</span>
            </span>
            <span className="dm-count-sep" aria-hidden="true" />
            <span className="dm-count-item">
              <Type size={14} />
              <b>{totalWords.toLocaleString()}</b>
              <span className="dm-count-label">{totalWords === 1 ? "word" : "words"}</span>
            </span>
          </div>
          <button
            className="dm-theme-toggle"
            onClick={onToggleTheme}
            type="button"
            title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          >
            {theme === "light" ? <Moon size={12} /> : <Sun size={12} />}
          </button>
        </div>
        <button
          className="dm-stat-newstack"
          onClick={() => setCreating(true)}
          type="button"
          title="New stack"
          aria-label="New stack"
        >
          <Plus size={14} />
          <span className="dm-newstack-label">New stack</span>
        </button>
      </div>
      {dueCount > 0 && (
        <button className="dm-due-banner" onClick={onStartReview} type="button">
          <div className="dm-due-banner-icon">
            <Clock size={18} />
          </div>
          <div className="dm-due-banner-text">
            <div className="dm-due-banner-title">
              {`${dueCount} word${dueCount === 1 ? "" : "s"} due for review`}
            </div>
            <div className="dm-due-banner-sub">Tap to review now</div>
          </div>
          <ChevronRight size={18} />
        </button>
      )}
      {searchOpen && (
        <div className="dm-search-row dm-home-filter-fade">
          <Search size={16} className="dm-search-row-icon" />
          <Input
            ref={searchInputRef}
            className="dm-search-input"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search stacks, families, or words…"
            type="text"
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.currentTarget.blur();
                toggleSearch();
              }
            }}
          />
          {searchQuery && (
            <button
              type="button"
              className="dm-search-row-clear"
              title="Clear search"
              onClick={() => handleSearchChange("")}
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}
      <div className="dm-section-title">
        {trimmedQuery
          ? `Search results for “${searchQuery.trim()}”`
          : activeFamily !== "all" && familyById[activeFamily]
            ? familyById[activeFamily].name
            : "Your stacks"}
      </div>
      {families.length > 0 && !hideFamilyFilters && (
        <div className="dm-family-filter-row">
          <button
            key="all"
            type="button"
            className={`dm-family-chip ${activeFamily === "all" ? "dm-family-chip-active" : ""}`}
            onClick={() => changeFamily("all")}
          >
            All
          </button>
          {families.map((f) => {
            const fs = familyStats[f.id];
            return (
              <button
                key={f.id}
                type="button"
                className={`dm-family-chip ${activeFamily === f.id ? "dm-family-chip-active" : ""}`}
                onClick={() => changeFamily(f.id)}
                onDoubleClick={() => onPlayFamilyGames && onPlayFamilyGames(f.id)}
              >
                <AnimatedIcon id={f.emoji || "family"} size={15} className="dm-family-chip-emoji" />
                {f.name}
                {fs && showFamilyStats !== false && fs.due > 0 && (
                  <span className="dm-family-chip-due">{fs.due}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
      {showFamilyStats !== false && activeFamilyStats && (
        <div key={`stats-${activeFamily}`} className="dm-family-stats dm-home-filter-fade">
          <div className="dm-family-stats-row">
            <div className="dm-family-stat">
              <div className="dm-family-stat-value">{activeFamilyStats.words}</div>
              <div className="dm-family-stat-label">words</div>
            </div>
            <div className="dm-family-stat">
              <div className="dm-family-stat-value">{activeFamilyStats.mastered}</div>
              <div className="dm-family-stat-label">mastered</div>
            </div>
            <div className="dm-family-stat">
              <div className="dm-family-stat-value">{`${activeFamilyStats.progress}%`}</div>
              <div className="dm-family-stat-label">progress</div>
            </div>
          </div>
          <div className="dm-family-progress-track">
            <div
              className="dm-family-progress-fill"
              style={{
                width: `${activeFamilyStats.progress}%`,
              }}
            />
          </div>
          {activeFamilyStats.due > 0 && (
            <button
              className="dm-family-review-btn"
              type="button"
              onClick={() => onStartFamilyReview(activeFamily)}
            >
              <Clock size={15} />
              {` Review ${activeFamilyStats.due} due word${activeFamilyStats.due === 1 ? "" : "s"}`}
              <ChevronRight size={15} />
            </button>
          )}
        </div>
      )}
      {trimmedQuery && visibleStacks.length === 0 && (
        <div className="dm-empty">No stacks match your search.</div>
      )}
      {stacks.length === 0 && !trimmedQuery && (
        <div className="dm-home-empty">
          <div className="dm-he-art" aria-hidden>
            <div className="dm-he-glow" />
            <div className="dm-he-card dm-he-card-a" />
            <div className="dm-he-card dm-he-card-b" />
            <div className="dm-he-card dm-he-card-c">
              <div className="dm-he-line dm-he-line-1" />
              <div className="dm-he-line dm-he-line-2" />
              <div className="dm-he-line dm-he-line-3" />
            </div>
            <div className="dm-he-plus">
              <Plus size={20} />
            </div>
            <Sparkles size={16} className="dm-he-spark dm-he-spark-1" />
            <Sparkles size={12} className="dm-he-spark dm-he-spark-2" />
            <Sparkles size={14} className="dm-he-spark dm-he-spark-3" />
          </div>
          <h2 className="dm-he-title">No stacks yet</h2>
          <p className="dm-he-sub">
            A stack is a set of words you learn together. Create your first one and start building
            your vocabulary.
          </p>
          <button type="button" className="dm-he-btn" onClick={() => setCreating(true)}>
            <Plus size={20} />
            {" Create first stack"}
          </button>
        </div>
      )}
      <div className="dm-stack-grid" ref={gridRef} onClickCapture={dmListClickGuard}>
        {visibleStacks.map((s) => {
          const isEntering = enteringIds.has(s.id);
          const isPinned = !!s.pinned || (activeFamily !== "all" && !!s.familyPinned);
          const familyName =
            s.familyId && familyById[s.familyId] ? familyById[s.familyId].name : null;
          return (
            <StackCard
              key={s.id}
              s={s}
              isPinned={isPinned}
              isEntering={isEntering}
              activeFamily={activeFamily}
              familyName={familyName}
              menuStackId={menuStackId}
              closingMenuId={closingMenuId}
              setMenuStackId={setMenuStackId}
              setClosingMenuId={setClosingMenuId}
              closeStackMenu={closeStackMenu}
              onOpenStack={onOpenStack}
              setAssigningStackId={setAssigningStackId}
              onTogglePinStack={onTogglePinStack}
              onToggleFamilyPinStack={onToggleFamilyPinStack}
              onRequestDeleteStack={setConfirmDeleteStackId}
              onRequestArchiveStack={setConfirmArchiveStackId}
              setCardRef={setCardRef}
            />
          );
        })}
        {exitingCards.map(({ id, stack: s, rect }) => (
          <div
            key={`exiting-${id}`}
            className="dm-stack-cell dm-stack-cell-exiting"
            aria-hidden
            style={{
              left: `${rect.left}px`,
              top: `${rect.top}px`,
              width: `${rect.width}px`,
              height: `${rect.height}px`,
            }}
          >
            <div className="dm-stack-cell-inner">
              <div className="dm-stack-card">
                <div className="dm-stack-emoji">
                  <AnimatedIcon id={s.emoji} size={30} />
                </div>
                <div className="dm-stack-name">{s.name}</div>
                <div className="dm-stack-count">
                  {`${s.words.length} ${s.words.length === 1 ? "word" : "words"}`}
                </div>
                {s.familyId && familyById[s.familyId] && (
                  <div className="dm-stack-family-badge" title={familyById[s.familyId].name}>
                    {familyById[s.familyId].name}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {creating && (
        <div
          className="dm-modal-backdrop"
          onClick={() => {
            setCreating(false);
            setNewStackFamilyId(null);
          }}
        >
          <div className="dm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dm-modal-head">
              <h3>New stack</h3>
              <IconBtn
                onClick={() => {
                  setCreating(false);
                  setNewStackFamilyId(null);
                }}
              >
                <X size={18} />
              </IconBtn>
            </div>
            <label className="dm-label">Name</label>
            <Input
              className="dm-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. B1 Grammar"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim()) {
                  onCreateStack({
                    id: uid(),
                    name: name.trim(),
                    emoji,
                    words: [],
                    familyId: newStackFamilyId,
                  });
                  setCreating(false);
                  setName("");
                  setNewStackFamilyId(null);
                } else if (e.key === "Escape") {
                  setCreating(false);
                  setNewStackFamilyId(null);
                }
              }}
            />
            <label className="dm-label">Icon</label>
            <div className="dm-emoji-row">
              {EMOJIS.map((em) => (
                <button
                  key={em}
                  className={`dm-emoji-pick ${emoji === em ? "dm-emoji-pick-active" : ""}`}
                  onClick={() => setEmoji(em)}
                >
                  <AnimatedIcon id={em} size={24} />
                </button>
              ))}
            </div>
            {families.length > 0 && <label className="dm-label">Family (optional)</label>}
            {families.length > 0 && (
              <div className="dm-select-wrap dm-dropdown" ref={familyDropdownRef}>
                <button
                  type="button"
                  className="dm-input dm-select dm-dropdown-trigger"
                  aria-haspopup="listbox"
                  aria-expanded={familyDropdownOpen}
                  onClick={() => setFamilyDropdownOpen((v) => !v)}
                >
                  <span className="dm-dropdown-trigger-label">
                    {newStackFamilyId
                      ? [
                          <AnimatedIcon
                            key="ic"
                            id={
                              (families.find((f) => f.id === newStackFamilyId) || {}).emoji ||
                              "family"
                            }
                            size={16}
                          />,
                          <span key="txt">
                            {(families.find((f) => f.id === newStackFamilyId) || {}).name}
                          </span>,
                        ]
                      : "No family"}
                  </span>
                </button>
                <ChevronDown
                  size={18}
                  className={`dm-select-chevron ${familyDropdownOpen ? "dm-select-chevron-open" : ""}`}
                />
                {familyDropdownOpen && (
                  <div className="dm-dropdown-panel" role="listbox">
                    <button
                      type="button"
                      role="option"
                      aria-selected={!newStackFamilyId}
                      className={`dm-dropdown-item ${!newStackFamilyId ? "dm-dropdown-item-active" : ""}`}
                      onClick={() => {
                        setNewStackFamilyId(null);
                        setFamilyDropdownOpen(false);
                      }}
                    >
                      <span className="dm-dropdown-item-label">No family</span>
                      {!newStackFamilyId && <Check size={15} />}
                    </button>
                    {families.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        role="option"
                        aria-selected={newStackFamilyId === f.id}
                        className={`dm-dropdown-item ${newStackFamilyId === f.id ? "dm-dropdown-item-active" : ""}`}
                        onClick={() => {
                          setNewStackFamilyId(f.id);
                          setFamilyDropdownOpen(false);
                        }}
                      >
                        <span className="dm-dropdown-item-label">
                          <AnimatedIcon id={f.emoji || "family"} size={16} />
                          {f.name}
                        </span>
                        {newStackFamilyId === f.id && <Check size={15} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="dm-modal-actions">
              <button
                className="dm-btn-primary"
                disabled={!name.trim()}
                onClick={() => {
                  onCreateStack({
                    id: uid(),
                    name: name.trim(),
                    emoji,
                    words: [],
                    familyId: newStackFamilyId,
                  });
                  setCreating(false);
                  setName("");
                  setNewStackFamilyId(null);
                }}
              >
                <Check size={16} />
                {" Create"}
              </button>
            </div>
          </div>
        </div>
      )}
      {scanning && (
        <QRScanModal
          onImport={(imported) =>
            imported && imported.__isFamily ? onImportFamily(imported) : onCreateStack(imported)
          }
          onClose={() => setScanning(false)}
        />
      )}
      {assigningStack && (
        <div className="dm-modal-backdrop" onClick={() => setAssigningStackId(null)}>
          <div className="dm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dm-modal-head">
              <h3>{`Add "${assigningStack.name}" to family`}</h3>
              <IconBtn onClick={() => setAssigningStackId(null)}>
                <X size={18} />
              </IconBtn>
            </div>
            {families.length === 0 ? (
              <p className="dm-settings-hint">
                You don't have any families yet. Create one in Settings → Families first.
              </p>
            ) : (
              <div className="dm-family-pick-list">
                <button
                  type="button"
                  className={`dm-family-pick-row ${!assigningStack.familyId ? "dm-family-pick-row-active" : ""}`}
                  onClick={() => {
                    onSetStackFamily(assigningStack.id, null);
                    setAssigningStackId(null);
                  }}
                >
                  <span>No family</span>
                  {!assigningStack.familyId && <Check size={16} />}
                </button>
                {families.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`dm-family-pick-row ${assigningStack.familyId === f.id ? "dm-family-pick-row-active" : ""}`}
                    onClick={() => {
                      onSetStackFamily(assigningStack.id, f.id);
                      setAssigningStackId(null);
                    }}
                  >
                    <span className="dm-family-pick-row-label">
                      <AnimatedIcon id={f.emoji || "family"} size={18} />
                      {f.name}
                    </span>
                    {assigningStack.familyId === f.id && <Check size={16} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {confirmDeleteStack && (
        <div className="dm-modal-backdrop" onClick={() => setConfirmDeleteStackId(null)}>
          <div className="dm-modal dm-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dm-confirm-icon">
              <Trash2 size={24} />
            </div>
            <h3 className="dm-confirm-title">Delete this stack?</h3>
            <p className="dm-confirm-sub">{`"${confirmDeleteStack.name}" and all ${confirmDeleteStack.words.length} word${confirmDeleteStack.words.length === 1 ? "" : "s"} in it will be permanently deleted. This can't be undone.`}</p>
            <div className="dm-modal-actions">
              <button className="dm-btn-secondary" onClick={() => setConfirmDeleteStackId(null)}>
                Cancel
              </button>
              <button
                className="dm-btn-danger"
                onClick={() => {
                  onDeleteStack(confirmDeleteStack.id);
                  setConfirmDeleteStackId(null);
                }}
              >
                <Trash2 size={16} />
                {" Delete stack"}
              </button>
            </div>
          </div>
        </div>
      )}
      {confirmArchiveStack && (
        <div className="dm-modal-backdrop" onClick={() => setConfirmArchiveStackId(null)}>
          <div className="dm-modal dm-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dm-confirm-icon dm-confirm-icon-gold">
              <ArchiveIcon size={24} />
            </div>
            <h3 className="dm-confirm-title">Archive this stack?</h3>
            <p className="dm-confirm-sub">{`"${confirmArchiveStack.name}" will be hidden from Home, Games and Favorites. Nothing is deleted — you can restore it anytime from Settings.`}</p>
            <div className="dm-modal-actions">
              <button className="dm-btn-secondary" onClick={() => setConfirmArchiveStackId(null)}>
                Cancel
              </button>
              <button
                className="dm-btn-warning"
                onClick={() => {
                  onArchiveStack(confirmArchiveStack.id);
                  setConfirmArchiveStackId(null);
                }}
              >
                <ArchiveIcon size={16} />
                {" Archive stack"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
