/* components/stack-view/stack-view.jsx
 * StackView: the screen showing one stack's words.
 */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { shuffle } from "../../core/srs-and-seed-data";
import { withColor } from "../../core/word-colors";
import { FREE_FAVORITE_LIMIT } from "../../services/premium-status";
import { AnimatedIcon, IconBtn } from "../common/common";
import { FormsAudioToggle } from "../games/setup-controls";
import {
  Bot,
  CardsIcon,
  ChevronLeft,
  ChevronsDownUp,
  ChevronsUpDown,
  Columns2,
  Gamepad2,
  MenuOrClose,
  MiniStackBtnContent,
  Plus,
  QrCode,
  Share2,
  Shuffle,
  Star,
  Trash2,
  X,
} from "../icons/icons";
import { getLangAbbr } from "../language-settings/language-settings";
import { QRShareModal, QR_SHARING_ENABLED } from "../qr-share/qr-share";
import { FormPickModal } from "./form-pick-modal";
import { RenameStackModal } from "./rename-stack-modal";
import { dmListClickGuard } from "../swipeable-row/swipeable-row";
import { WordCard } from "../word-card/word-card";
import { FORM_TYPES } from "../word-forms/form-pick";
import { AllFormsModal, stripArticle } from "../word-forms/word-forms";
import { WordModal, buildShareHTML } from "../word-modal/word-modal";

// How long the FORMS filter must be held to open the "Choose form" menu.
const FORMS_HOLD_MS = 450;

export function StackView({
  stack,
  onBack,
  onUpdateStack,
  onDeleteStack,
  onSpeak,
  onOpenAI,
  apiKey,
  onDrillWord,
  miniStack,
  onOpenMiniStack,
  onToggleMiniStackWord,
  onClearMiniStack,
  allStacks,
  onUpdateWord,
  onDeleteWord,
  onPlayGames,
  nativeLanguage,
  learningLanguage,
  onOpenPremium,
  isPremium,
  isFavorites = false, // the virtual "Favorites" stack: words come from many stacks (each has .stackId)
  isMini = false, // a mini stack: also virtual, but without the AI / mini stack buttons
  colorGroup = null, // a colour (see core/word-colors): virtual like Favorites, words tagged with that colour
  onAddClick,
}) {
  const isVirtual = isFavorites || isMini || !!colorGroup;
  const stackIdOf = (w) => (isVirtual ? w.stackId : stack.id);
  const [menuOpen, setMenuOpen] = useState(false);
  const [displayMode, setDisplayMode] = useState("BOTH");
  // Form chosen for the FORMS filter per word type ({ noun, adj, verb }), from the menu that opens
  // when the FORMS filter is held. Lives only as long as this screen: leaving the stack and opening
  // it again starts from the default forms.
  const [formPicks, setFormPicks] = useState({});
  const [showFormPick, setShowFormPick] = useState(false);
  const hasFormPick = FORM_TYPES.some((t) => formPicks[t]);
  const formsHold = useRef({ timer: null, resetTimer: null, fired: false, x: 0, y: 0 });
  const stopFormsHold = () => {
    if (formsHold.current.timer) {
      clearTimeout(formsHold.current.timer);
      formsHold.current.timer = null;
    }
  };
  const startFormsHold = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const h = formsHold.current;
    stopFormsHold();
    if (h.resetTimer) clearTimeout(h.resetTimer);
    h.resetTimer = null;
    h.fired = false;
    h.x = e.clientX;
    h.y = e.clientY;
    h.timer = setTimeout(() => {
      h.timer = null;
      h.fired = true; // the click that ends this press must not also switch the filter
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        try {
          navigator.vibrate(12);
        } catch (err) {}
      }
      setShowFormPick(true);
    }, FORMS_HOLD_MS);
  };
  const moveFormsHold = (e) => {
    const h = formsHold.current;
    if (h.timer && Math.hypot(e.clientX - h.x, e.clientY - h.y) > 10) stopFormsHold();
  };
  const endFormsHold = () => {
    const h = formsHold.current;
    stopFormsHold();
    // the click of a long press comes right after the release; forget the press shortly after
    if (h.fired) {
      if (h.resetTimer) clearTimeout(h.resetTimer);
      h.resetTimer = setTimeout(() => {
        h.fired = false;
        h.resetTimer = null;
      }, 300);
    }
  };
  useEffect(
    () => () => {
      const h = formsHold.current;
      if (h.timer) clearTimeout(h.timer);
      if (h.resetTimer) clearTimeout(h.resetTimer);
    },
    []
  );
  const [query, setQuery] = useState("");
  const [modalWord, setModalWord] = useState(undefined);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const lastTitleTapRef = useRef(0);
  // Double click / double tap on the title opens the rename + icon modal (real stacks only).
  const onTitleClick = () => {
    if (isVirtual) return;
    const now = Date.now();
    if (now - lastTitleTapRef.current < 400) {
      lastTitleTapRef.current = 0;
      setShowRenameModal(true);
    } else {
      lastTitleTapRef.current = now;
    }
  };
  const [confirmClearMini, setConfirmClearMini] = useState(false);
  const [showForms, setShowForms] = useState(false);
  const [confirmDeleteStack, setConfirmDeleteStack] = useState(false);
  const [formsWord, setFormsWord] = useState(undefined);
  const [showQRModal, setShowQRModal] = useState(false);
  const [multiPickMode, setMultiPickMode] = useState(false);
  const [actionsCollapsed, setActionsCollapsed] = useState(() => {
    try {
      return localStorage.getItem("dm-card-actions-collapsed") === "1";
    } catch (e) {
      return false;
    }
  });
  const toggleAllActions = () => {
    setActionsCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem("dm-card-actions-collapsed", next ? "1" : "0");
      } catch (e) {}
      return next;
    });
  };
  // Desktop-only "two words per row" layout (the button is hidden on phones via CSS)
  const [wideMode, setWideMode] = useState(() => {
    try {
      return localStorage.getItem("dm-stack-wide") === "1";
    } catch (e) {
      return false;
    }
  });
  const listRef = useRef(null);
  const prevRects = useRef(null);
  const snapshotList = () => {
    const el = listRef.current;
    if (!el) return;
    prevRects.current = Array.from(el.children).map((c) => c.getBoundingClientRect());
  };
  const toggleWide = () => {
    snapshotList();
    setWideMode((w) => {
      const next = !w;
      try {
        localStorage.setItem("dm-stack-wide", next ? "1" : "0");
      } catch (e) {}
      return next;
    });
  };
  // FLIP: cards glide from their old position/size to the new one
  useLayoutEffect(() => {
    const el = listRef.current;
    const before = prevRects.current;
    prevRects.current = null;
    if (!el || !before) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    Array.from(el.children).forEach((child, i) => {
      const a = before[i];
      if (!a || !child.animate) return;
      const b = child.getBoundingClientRect();
      if (!b.width || !b.height) return;
      const dx = a.left - b.left;
      const dy = a.top - b.top;
      const sx = a.width / b.width;
      const sy = a.height / b.height;
      child.animate(
        [
          { transformOrigin: "top left", transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
          { transformOrigin: "top left", transform: "none" },
        ],
        { duration: 460, easing: "cubic-bezier(0.22, 1, 0.36, 1)", delay: Math.min(i, 8) * 12 }
      );
    });
  }, [wideMode]);
  const [pickedIds, setPickedIds] = useState(() => new Set());
  const enterMultiPick = (w) => {
    setMultiPickMode(true);
    setPickedIds(new Set([w.id]));
  };
  const togglePicked = (w) => {
    setPickedIds((prev) => {
      const next = new Set(prev);
      if (next.has(w.id)) next.delete(w.id);
      else next.add(w.id);
      return next;
    });
  };
  const cancelMultiPick = () => {
    setMultiPickMode(false);
    setPickedIds(new Set());
  };
  const addPickedToMiniStack = () => {
    const words = stack.words.filter((w) => pickedIds.has(w.id));
    words.forEach((w) => {
      const already = miniStack && miniStack.words.some((mw) => mw.id === w.id);
      if (!already && onToggleMiniStackWord)
        onToggleMiniStackWord({
          ...w,
          stackId: stackIdOf(w),
        });
    });
    cancelMultiPick();
  };
  const removePickedFromMiniStack = () => {
    const words = stack.words.filter((w) => pickedIds.has(w.id));
    words.forEach((w) => {
      const already = miniStack && miniStack.words.some((mw) => mw.id === w.id);
      if (already && onToggleMiniStackWord) onToggleMiniStackWord(w);
    });
    cancelMultiPick();
  };
  const allPickedInMiniStack =
    pickedIds.size > 0 &&
    !!miniStack &&
    stack.words
      .filter((w) => pickedIds.has(w.id))
      .every((w) => miniStack.words.some((mw) => mw.id === w.id));
  const deletePicked = () => {
    if (isFavorites) {
      // In Favorites "remove" only un-stars the words; they stay in their own stacks.
      stack.words
        .filter((w) => pickedIds.has(w.id))
        .forEach((w) =>
          onUpdateWord(w.stackId, w.id, (word) => ({
            ...word,
            favorite: false,
          }))
        );
      cancelMultiPick();
      return;
    }
    if (colorGroup) {
      // In a colour "remove" only takes the colour off; the words stay in their own stacks.
      stack.words
        .filter((w) => pickedIds.has(w.id))
        .forEach((w) => onUpdateWord(w.stackId, w.id, (word) => withColor(word, "")));
      cancelMultiPick();
      return;
    }
    if (isMini) {
      stack.words
        .filter((w) => pickedIds.has(w.id))
        .forEach((w) => onDeleteWord && onDeleteWord(w.stackId, w.id));
      cancelMultiPick();
      return;
    }
    onUpdateStack({
      ...stack,
      words: stack.words.filter((w) => !pickedIds.has(w.id)),
    });
    cancelMultiPick();
  };
  const isFormsMode = displayMode === "FORMS";
  const filtered = stack.words.filter((w) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return [w.de, w.en, w.plural, w.praeteritum, w.partizipII, w.komparativ, w.superlativ, w.level]
      .filter(Boolean)
      .some((f) => f.toLowerCase().includes(q));
  });
  const toggleFav = (id) => {
    const target = stack.words.find((w) => w.id === id);
    if (target && !target.favorite && !isPremium) {
      const totalFavorites = (allStacks || [stack]).reduce(
        (acc, st) => acc + st.words.filter((x) => x.favorite).length,
        0
      );
      if (totalFavorites >= FREE_FAVORITE_LIMIT) {
        onOpenPremium && onOpenPremium();
        return;
      }
    }
    onUpdateStack({
      ...stack,
      words: stack.words.map((w) =>
        w.id === id
          ? {
              ...w,
              favorite: !w.favorite,
            }
          : w
      ),
    });
  };
  const saveWord = (word) => {
    const exists = stack.words.some((w) => w.id === word.id);
    onUpdateStack({
      ...stack,
      words: exists
        ? stack.words.map((w) => (w.id === word.id ? word : w))
        : [...stack.words, word],
    });
    setModalWord(undefined);
    setShowAddModal(false);
  };
  const deleteWord = (id) => {
    if (isVirtual) {
      const target = stack.words.find((w) => w.id === id);
      if (target && onDeleteWord) onDeleteWord(target.stackId, id);
      setModalWord(undefined);
      return;
    }
    onUpdateStack({
      ...stack,
      words: stack.words.filter((w) => w.id !== id),
    });
    setModalWord(undefined);
  };
  const shuffleWords = () => {
    if (stack.words.length < 2) return;
    let next = shuffle(stack.words);
    // make sure the order actually changes
    for (let t = 0; t < 5 && next.every((w, i) => w.id === stack.words[i].id); t++) {
      next = shuffle(stack.words);
    }
    onUpdateStack({ ...stack, words: next });
  };
  const shareStack = async () => {
    const html = buildShareHTML(stack);
    const fileName = `${(stack.name || "stack").trim().replace(/[^a-z0-9]+/gi, "_")}.html`;
    const lines = stack.words
      .map((w) => {
        const de = w.article ? `${w.article} ${stripArticle(w.de || "")}` : w.de || "";
        return `${de} - ${w.en}`;
      })
      .join("\n");
    const fallbackText = `${stack.name}
${lines}`;
    let file = null;
    try {
      file = new File([html], fileName, {
        type: "text/html",
      });
    } catch (err) {
      file = null;
    }
    if (
      file &&
      navigator.canShare &&
      navigator.canShare({
        files: [file],
      })
    ) {
      try {
        await navigator.share({
          files: [file],
          title: stack.name,
          text: `Vocabulary: ${stack.name}`,
        });
        return;
      } catch (err) {
        if (err && err.name === "AbortError") return;
      }
    }
    if (navigator.share) {
      try {
        await navigator.share({
          title: stack.name,
          text: fallbackText,
        });
        return;
      } catch (err) {
        if (err && err.name === "AbortError") return;
      }
    }
    const blob = new Blob([html], {
      type: "text/html",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  return (
    <div
      className={`dm-view dm-stack-screen notranslate${wideMode ? " dm-stack-wide" : ""}`}
      translate="no"
      data-ui-ru="1"
    >
      <div className="dm-topbar">
        <IconBtn onClick={onBack} className="dm-topbar-fixed-btn">
          <ChevronLeft size={20} />
        </IconBtn>
        <IconBtn
          title={menuOpen ? "Hide options" : "More options"}
          active={menuOpen}
          className="dm-topbar-fixed-btn"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <MenuOrClose open={menuOpen} size={18} />
        </IconBtn>
        <div className="dm-topbar-morph">
          <div
            className={`dm-topbar-default ${menuOpen ? "dm-topbar-default-hidden" : ""}`}
            aria-hidden={menuOpen}
          >
            {!isMini && (
              <IconBtn title="AI Tutor" onClick={onOpenAI} className="dm-stackview-ai-btn">
                <Bot size={18} />
              </IconBtn>
            )}
            {!isMini && !colorGroup && (
              <IconBtn
                title={
                  miniStack && miniStack.words.length
                    ? `Mini stack · ${miniStack.words.length} word${miniStack.words.length === 1 ? "" : "s"}`
                    : "Mini stack"
                }
                active={!!(miniStack && miniStack.words.length)}
                className="dm-stack-title-ministack-btn"
                onClick={() => onOpenMiniStack && onOpenMiniStack()}
              >
                <MiniStackBtnContent miniStack={miniStack} />
              </IconBtn>
            )}
            <IconBtn title="Play games" onClick={() => onPlayGames && onPlayGames(stack)}>
              <Gamepad2 size={18} />
            </IconBtn>
            {isMini && (
              <IconBtn title="Remove all words" onClick={() => setConfirmClearMini(true)}>
                <Trash2 size={18} />
              </IconBtn>
            )}
          </div>
          <div
            className={`dm-topbar-extra ${menuOpen ? "dm-topbar-extra-open" : ""}`}
            aria-hidden={!menuOpen}
          >
            <FormsAudioToggle
              checked={showForms}
              onChange={setShowForms}
              audioMode={isFormsMode}
              title={
                isFormsMode
                  ? "Show/hide pronunciation for word forms"
                  : "Show/hide plural • comparative forms"
              }
            />
            <IconBtn title="Share stack" onClick={shareStack}>
              <Share2 size={18} />
            </IconBtn>
            <IconBtn title="Shuffle words" onClick={shuffleWords}>
              <Shuffle size={18} />
            </IconBtn>
            {QR_SHARING_ENABLED && (
              <IconBtn title="Sync to phone via QR" onClick={() => setShowQRModal(true)}>
                <QrCode size={18} />
              </IconBtn>
            )}
          </div>
        </div>
        {!isPremium && (
          <button
            type="button"
            className="dm-topbar-premium-btn"
            title="Upgrade to Premium"
            onClick={() => onOpenPremium && onOpenPremium()}
          >
            <Star size={19} />
            <span className="dm-topbar-premium-label-full">Premium</span>
            <span className="dm-topbar-premium-label-short">Pro</span>
          </button>
        )}
        <IconBtn
          className="dm-topbar-fixed-btn"
          title={
            isFavorites ? "Add favorites" : isMini ? "Add words" : colorGroup ? "Add words to this colour" : undefined
          }
          onClick={() => (onAddClick ? onAddClick() : setShowAddModal(true))}
        >
          <Plus size={20} />
        </IconBtn>
      </div>
      <div className="dm-stack-title-row">
        <span className="dm-stack-title-spacer" aria-hidden="true" />
        <div
          className={`dm-stack-title-main${isVirtual ? "" : " dm-stack-title-editable"}`}
          onClick={onTitleClick}
          onKeyDown={(e) => {
            if (!isVirtual && e.key === "Enter") setShowRenameModal(true);
          }}
          role={isVirtual ? undefined : "button"}
          tabIndex={isVirtual ? undefined : 0}
          title={isVirtual ? undefined : "Double-click to rename or change the icon"}
        >
          {colorGroup ? (
            <span className="dm-color-title-dot" style={{ "--sw": colorGroup.hex }} />
          ) : (
            <AnimatedIcon id={isFavorites ? "star" : stack.emoji} size={24} className="dm-stack-title-emoji" />
          )}
          <span className="dm-stack-title-name">{stack.name}</span>
        </div>
        <div className="dm-stack-title-tools">
          <button
            type="button"
            className={`dm-stack-actions-toggle dm-stack-wide-toggle${wideMode ? " is-on" : ""}`}
            title={wideMode ? "Back to one word per row" : "Two words per row"}
            aria-label={wideMode ? "Back to one word per row" : "Two words per row"}
            aria-pressed={wideMode}
            onClick={toggleWide}
          >
            <Columns2 size={18} />
          </button>
          <button
            type="button"
            className={`dm-stack-actions-toggle${actionsCollapsed ? " is-collapsed" : ""}`}
            title={actionsCollapsed ? "Show buttons on all cards" : "Hide buttons on all cards"}
            aria-label={actionsCollapsed ? "Show buttons on all cards" : "Hide buttons on all cards"}
            aria-pressed={actionsCollapsed}
            onClick={toggleAllActions}
          >
            {actionsCollapsed ? <ChevronsUpDown size={18} /> : <ChevronsDownUp size={18} />}
          </button>
        </div>
      </div>
      <div className="dm-segmented dm-display-toggle">
        {["GER", "ENG", "BOTH", "FORMS"].map((m) => {
          // The FORMS filter can be held (or right-clicked) to choose which form the cards show.
          const holdable = m === "FORMS";
          return (
            <button
              key={m}
              className={`dm-seg ${displayMode === m ? "dm-seg-active" : ""}${holdable ? " dm-seg-holdable" : ""}`}
              title={holdable ? "Hold to choose a form" : undefined}
              onClick={() => {
                if (holdable && formsHold.current.fired) {
                  formsHold.current.fired = false;
                  return;
                }
                setDisplayMode(m);
              }}
              onPointerDown={holdable ? startFormsHold : undefined}
              onPointerMove={holdable ? moveFormsHold : undefined}
              onPointerUp={holdable ? endFormsHold : undefined}
              onPointerCancel={holdable ? endFormsHold : undefined}
              onPointerLeave={holdable ? stopFormsHold : undefined}
              onContextMenu={
                holdable
                  ? (e) => {
                      e.preventDefault();
                      formsHold.current.fired = true;
                      setShowFormPick(true);
                    }
                  : undefined
              }
            >
              {m === "GER"
                ? getLangAbbr(learningLanguage)
                : m === "ENG"
                  ? getLangAbbr(nativeLanguage)
                  : m}
              {holdable && hasFormPick && <span className="dm-seg-dot" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
      <div
        className="dm-list"
        ref={listRef}
        style={
          multiPickMode
            ? {
                paddingBottom: 96,
              }
            : undefined
        }
        onClickCapture={dmListClickGuard}
      >
        {filtered.length === 0 &&
          (stack.words.length === 0 ? (
            <div className="dm-empty dm-empty-stack">
              <div className="dm-empty-stack-icon">
                <Plus size={26} />
              </div>
              <div className="dm-empty-stack-title">
                {isFavorites
                  ? "No favorites yet"
                  : isMini
                    ? "Mini stack is empty"
                    : colorGroup
                      ? `No ${colorGroup.name.toLowerCase()} words yet`
                      : "No words yet"}
              </div>
              <div className="dm-empty-stack-sub">
                {isFavorites
                  ? "Star words to collect them here."
                  : colorGroup
                    ? "Add words here, or colour them from their ⋮ menu or the Mistakes list after a game."
                    : isMini
                    ? "Add words with +, or swipe a word card down."
                    : "Add your first word to start practicing."}
              </div>
              <button
                className="dm-btn-primary dm-empty-stack-btn"
                onClick={() => (onAddClick ? onAddClick() : setShowAddModal(true))}
              >
                <Plus size={16} />
                {isFavorites ? "Add favorites" : isMini || colorGroup ? "Add words" : "Add a word"}
              </button>
            </div>
          ) : (
            <div className="dm-empty">No words match yet. Add one with the + button.</div>
          ))}
        {filtered.map((w, i) => (
          <WordCard
            key={w.id}
            w={w}
            index={i + 1}
            displayMode={displayMode}
            showForms={displayMode === "FORMS" ? true : showForms}
            formAudio={showForms}
            formPick={formPicks[w.type]}
            onToggleFav={toggleFav}
            onEdit={(word) => setModalWord(word)}
            onSpeak={onSpeak}
            onShowForms={(word) => setFormsWord(word)}
            onDrill={
              onDrillWord
                ? (word) =>
                    isVirtual
                      ? onDrillWord(
                          word,
                          word.stackId,
                          ((allStacks || []).find((st) => st.id === word.stackId) || {}).words
                        )
                      : onDrillWord(word, stack.id, stack.words)
                : undefined
            }
            onToggleMiniStack={
              colorGroup
                ? undefined
                : (word) =>
              onToggleMiniStackWord &&
              onToggleMiniStackWord({
                ...word,
                stackId: stackIdOf(word),
              })
            }
            isInMiniStack={!!(miniStack && miniStack.words.some((mw) => mw.id === w.id))}
            multiPickMode={multiPickMode}
            isPicked={pickedIds.has(w.id)}
            onTogglePicked={() => togglePicked(w)}
            onEnterMultiPick={() => enterMultiPick(w)}
            isPremium={isPremium}
            actionsCollapsed={actionsCollapsed}
          />
        ))}
      </div>
      {multiPickMode && (
        <div className="dm-multipick-bar">
          <div className="dm-multipick-count">{`${pickedIds.size} selected`}</div>
          <div className="dm-multipick-actions">
            <button type="button" className="dm-btn-secondary" onClick={cancelMultiPick}>
              <X size={16} />
              {" Cancel"}
            </button>
            {!colorGroup && (
              <button
                type="button"
                className="dm-btn-secondary"
                disabled={pickedIds.size === 0}
                onClick={allPickedInMiniStack ? removePickedFromMiniStack : addPickedToMiniStack}
              >
                <CardsIcon size={16} />
                {allPickedInMiniStack ? " Remove from mini stack" : " Add to mini stack"}
              </button>
            )}
            <button
              type="button"
              className="dm-btn-danger"
              disabled={pickedIds.size === 0}
              onClick={deletePicked}
            >
              {isFavorites ? <Star size={16} /> : <Trash2 size={16} />}
              {isFavorites ? " Unstar" : colorGroup ? " Remove colour" : " Delete"}
            </button>
          </div>
        </div>
      )}
      {modalWord !== undefined && (
        <WordModal
          initial={modalWord}
          onClose={() => setModalWord(undefined)}
          onSave={saveWord}
          onDelete={deleteWord}
          apiKey={apiKey}
          onOpenAI={onOpenAI}
          nativeLanguage={nativeLanguage}
        />
      )}
      {showRenameModal && !isVirtual && (
        <RenameStackModal
          stack={stack}
          onClose={() => setShowRenameModal(false)}
          onSave={({ name, emoji }) => {
            onUpdateStack({ ...stack, name, emoji });
            setShowRenameModal(false);
          }}
        />
      )}
      {showAddModal && (
        <WordModal
          initial={null}
          onClose={() => setShowAddModal(false)}
          onSave={saveWord}
          nativeLanguage={nativeLanguage}
          onDelete={() => {}}
          apiKey={apiKey}
          onOpenAI={onOpenAI}
        />
      )}
      {formsWord && (
        <AllFormsModal
          w={formsWord}
          onClose={() => setFormsWord(undefined)}
          isPremium={isPremium}
          onOpenPremium={onOpenPremium}
        />
      )}
      {showFormPick && (
        <FormPickModal
          words={stack.words}
          picks={formPicks}
          onPick={(type, pick) => {
            setFormPicks((prev) => {
              const next = { ...prev };
              if (pick) next[type] = pick;
              else delete next[type];
              return next;
            });
            setDisplayMode("FORMS");
          }}
          onReset={() => {
            setFormPicks({});
            setDisplayMode("FORMS");
          }}
          onClose={() => setShowFormPick(false)}
        />
      )}
      {showQRModal && <QRShareModal stack={stack} onClose={() => setShowQRModal(false)} />}
      {confirmClearMini && (
        <div className="dm-modal-backdrop" onClick={() => setConfirmClearMini(false)}>
          <div className="dm-modal dm-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dm-confirm-icon">
              <Trash2 size={24} />
            </div>
            <h3 className="dm-confirm-title">Remove all words?</h3>
            <p className="dm-confirm-sub">
              Every word will be taken out of this mini stack. The words themselves stay in their
              stacks.
            </p>
            <div className="dm-modal-actions">
              <button className="dm-btn-secondary" onClick={() => setConfirmClearMini(false)}>
                Cancel
              </button>
              <button
                className="dm-btn-danger"
                onClick={() => {
                  setConfirmClearMini(false);
                  onClearMiniStack && onClearMiniStack();
                }}
              >
                <Trash2 size={16} />
                {" Remove all"}
              </button>
            </div>
          </div>
        </div>
      )}
      {confirmDeleteStack && (
        <div className="dm-modal-backdrop" onClick={() => setConfirmDeleteStack(false)}>
          <div className="dm-modal dm-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dm-confirm-icon">
              <Trash2 size={24} />
            </div>
            <h3 className="dm-confirm-title">Delete this stack?</h3>
            <p className="dm-confirm-sub">{`"${stack.name}" and all ${stack.words.length} word${stack.words.length === 1 ? "" : "s"} in it will be permanently deleted. This can't be undone.`}</p>
            <div className="dm-modal-actions">
              <button className="dm-btn-secondary" onClick={() => setConfirmDeleteStack(false)}>
                Cancel
              </button>
              <button className="dm-btn-danger" onClick={() => onDeleteStack(stack.id)}>
                <Trash2 size={16} />
                {" Delete stack"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
