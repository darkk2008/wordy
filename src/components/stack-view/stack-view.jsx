/* components/stack-view/stack-view.jsx
 * StackView: the screen showing one stack's words.
 */

import { useLayoutEffect, useRef, useState } from "react";
import { shuffle } from "../../core/srs-and-seed-data";
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
import { MiniStackCreateModal, MiniStackManageModal } from "../mini-stack/mini-stack";
import { QRShareModal, QR_SHARING_ENABLED } from "../qr-share/qr-share";
import { dmListClickGuard } from "../swipeable-row/swipeable-row";
import { WordCard } from "../word-card/word-card";
import { AllFormsModal, stripArticle } from "../word-forms/word-forms";
import { WordModal, buildShareHTML } from "../word-modal/word-modal";

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
  onCreateMiniStack,
  onToggleMiniStackWord,
  onDeleteMiniStack,
  allStacks,
  onUpdateWord,
  onDeleteWord,
  onPlayGames,
  nativeLanguage,
  learningLanguage,
  onOpenPremium,
  isPremium,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [displayMode, setDisplayMode] = useState("BOTH");
  const [query, setQuery] = useState("");
  const [modalWord, setModalWord] = useState(undefined);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMiniStackCreate, setShowMiniStackCreate] = useState(false);
  const [showMiniStackManage, setShowMiniStackManage] = useState(false);
  const handleMiniStackClick = () => {
    if (!miniStack) {
      setShowMiniStackCreate(true);
      return;
    }
    setShowMiniStackManage(true);
  };
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
          stackId: stack.id,
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
            <IconBtn title="AI Tutor" onClick={onOpenAI} className="dm-stackview-ai-btn">
              <Bot size={18} />
            </IconBtn>
            <IconBtn
              title={
                miniStack
                  ? `Mini stack · ${miniStack.words.length} word${miniStack.words.length === 1 ? "" : "s"}`
                  : "Create mini stack"
              }
              active={!!miniStack}
              className="dm-stack-title-ministack-btn"
              onClick={handleMiniStackClick}
            >
              <MiniStackBtnContent miniStack={miniStack} />
            </IconBtn>
            <IconBtn title="Play games" onClick={() => onPlayGames && onPlayGames(stack)}>
              <Gamepad2 size={18} />
            </IconBtn>
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
        <IconBtn className="dm-topbar-fixed-btn" onClick={() => setShowAddModal(true)}>
          <Plus size={20} />
        </IconBtn>
      </div>
      <div className="dm-stack-title-row">
        <span className="dm-stack-title-spacer" aria-hidden="true" />
        <div className="dm-stack-title-main">
          <AnimatedIcon id={stack.emoji} size={24} className="dm-stack-title-emoji" />
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
        {["GER", "ENG", "BOTH", "FORMS"].map((m) => (
          <button
            key={m}
            className={`dm-seg ${displayMode === m ? "dm-seg-active" : ""}`}
            onClick={() => setDisplayMode(m)}
          >
            {m === "GER"
              ? getLangAbbr(learningLanguage)
              : m === "ENG"
                ? getLangAbbr(nativeLanguage)
                : m}
          </button>
        ))}
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
              <div className="dm-empty-stack-title">No words yet</div>
              <div className="dm-empty-stack-sub">Add your first word to start practicing.</div>
              <button
                className="dm-btn-primary dm-empty-stack-btn"
                onClick={() => setShowAddModal(true)}
              >
                <Plus size={16} />
                Add a word
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
            onToggleFav={toggleFav}
            onEdit={(word) => setModalWord(word)}
            onSpeak={onSpeak}
            onShowForms={(word) => setFormsWord(word)}
            onDrill={onDrillWord ? (word) => onDrillWord(word, stack.id, stack.words) : undefined}
            onToggleMiniStack={(word) =>
              onToggleMiniStackWord &&
              onToggleMiniStackWord({
                ...word,
                stackId: stack.id,
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
            <button
              type="button"
              className="dm-btn-secondary"
              disabled={pickedIds.size === 0}
              onClick={allPickedInMiniStack ? removePickedFromMiniStack : addPickedToMiniStack}
            >
              <CardsIcon size={16} />
              {allPickedInMiniStack ? " Remove from mini stack" : " Add to mini stack"}
            </button>
            <button
              type="button"
              className="dm-btn-danger"
              disabled={pickedIds.size === 0}
              onClick={deletePicked}
            >
              <Trash2 size={16} />
              {" Delete"}
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
      {showMiniStackCreate && (
        <MiniStackCreateModal
          onClose={() => setShowMiniStackCreate(false)}
          onCreate={(emoji) => {
            onCreateMiniStack && onCreateMiniStack(emoji);
            setShowMiniStackCreate(false);
          }}
        />
      )}
      {showMiniStackManage && miniStack && (
        <MiniStackManageModal
          miniStack={miniStack}
          onClose={() => setShowMiniStackManage(false)}
          onDeleteMiniStack={() => onDeleteMiniStack && onDeleteMiniStack()}
          onRemoveWord={(w) => onToggleMiniStackWord && onToggleMiniStackWord(w)}
          allStacks={allStacks || [stack]}
          onUpdateWord={onUpdateWord}
          onDeleteWord={onDeleteWord}
          onSpeak={onSpeak}
          apiKey={apiKey}
          onOpenAI={onOpenAI}
          nativeLanguage={nativeLanguage}
          learningLanguage={learningLanguage}
          isPremium={isPremium}
          onOpenPremium={onOpenPremium}
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
      {showQRModal && <QRShareModal stack={stack} onClose={() => setShowQRModal(false)} />}
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
