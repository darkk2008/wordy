/* components/mini-stack/mini-stack.jsx
 * Mini-stack create and manage modals.
 */

import { useState } from "react";
import { MINISTACK_ICON_IDS } from "../../core/icon-registry";
import { IconBtn } from "../common/common";
import {
  CardsIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  MiniStackIcon,
  Trash2,
  X,
} from "../icons/icons";
import { getLangAbbr } from "../language-settings/language-settings";
import { dmListClickGuard } from "../swipeable-row/swipeable-row";
import { WordCard } from "../word-card/word-card";
import { AllFormsModal } from "../word-forms/word-forms";
import { WordModal } from "../word-modal/word-modal";

export function MiniStackCreateModal({ onClose, onCreate }) {
  const emoji = MINISTACK_ICON_IDS[0];
  return (
    <div className="dm-modal-backdrop" onClick={onClose}>
      <div className="dm-modal dm-ministack-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dm-modal-head">
          <h3>Create mini stack</h3>
          <IconBtn onClick={onClose}>
            <X size={18} />
          </IconBtn>
        </div>
        <div className="dm-ministack-hero dm-ministack-hero-create">
          <span className="dm-ministack-hero-glow" />
          <MiniStackIcon size={34} />
        </div>
        <p
          className="dm-confirm-sub"
          style={{
            textAlign: "center",
          }}
        >
          Swipe any word card down to pin it here. Every stack, and Favorites, has its own mini
          stack.
        </p>
        <div className="dm-modal-actions">
          <button className="dm-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="dm-btn-primary" onClick={() => onCreate(emoji)}>
            <Check size={16} />
            {" Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
export function MiniStackManageModal({
  miniStack,
  onClose,
  onDeleteMiniStack,
  onRemoveWord,
  allStacks,
  onUpdateWord,
  onDeleteWord,
  onSpeak,
  apiKey,
  onOpenAI,
  nativeLanguage,
  learningLanguage,
  isPremium,
  onOpenPremium,
}) {
  const [view, setView] = useState("menu");
  const [displayMode, setDisplayMode] = useState("BOTH");
  const [showForms, setShowForms] = useState(false);
  const [formsWord, setFormsWord] = useState(undefined);
  const [modalWord, setModalWord] = useState(undefined);
  const isFormsMode = displayMode === "FORMS";
  const resolveStackId = (word) => {
    if (word.stackId) return word.stackId;
    const owner = (allStacks || []).find((s) => s.words.some((sw) => sw.id === word.id));
    return owner ? owner.id : null;
  };
  return (
    <div className="dm-modal-backdrop" onClick={onClose}>
      <div
        className={`dm-modal dm-confirm-modal dm-ministack-modal${view === "review" ? " dm-ministack-modal-review" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dm-modal-head">
          {view === "review" ? (
            <IconBtn onClick={() => setView("menu")}>
              <ChevronLeft size={18} />
            </IconBtn>
          ) : null}
          <h3>{view === "review" ? "Mini Stack" : "Mini stack"}</h3>
          <IconBtn onClick={onClose}>
            <X size={18} />
          </IconBtn>
        </div>
        {view === "menu" && (
          <>
            <div className="dm-ministack-hero">
              <span className="dm-ministack-hero-glow" />
              <MiniStackIcon size={30} />
            </div>
            <p
              className="dm-confirm-sub"
              style={{
                textAlign: "center",
                marginTop: -6,
              }}
            >
              {miniStack.words.length === 0
                ? "No words pinned yet"
                : `${miniStack.words.length} word${miniStack.words.length === 1 ? "" : "s"} pinned`}
            </p>
            <div className="dm-ministack-menu">
              <button className="dm-ministack-menu-row" onClick={() => setView("review")}>
                <span className="dm-ministack-menu-icon">
                  <Eye size={16} />
                </span>
                <span className="dm-ministack-menu-text">
                  <span>Review</span>
                </span>
                <ChevronRight size={16} className="dm-ministack-menu-chev" />
              </button>
              <button
                className="dm-ministack-menu-row dm-ministack-menu-row-danger"
                onClick={() => setView("confirmDelete")}
              >
                <span className="dm-ministack-menu-icon dm-ministack-menu-icon-danger">
                  <Trash2 size={16} />
                </span>
                <span className="dm-ministack-menu-text">
                  <span>Delete mini stack</span>
                </span>
                <ChevronRight size={16} className="dm-ministack-menu-chev" />
              </button>
            </div>
          </>
        )}
        {view === "confirmDelete" && (
          <>
            <div className="dm-confirm-icon">
              <Trash2 size={24} />
            </div>
            <p className="dm-confirm-sub">
              This will remove your mini stack and its pinned words. This can't be undone.
            </p>
            <div className="dm-modal-actions">
              <button className="dm-btn-secondary" onClick={() => setView("menu")}>
                Cancel
              </button>
              <button
                className="dm-btn-danger"
                onClick={() => {
                  onDeleteMiniStack();
                  onClose();
                }}
              >
                <Trash2 size={16} />
                {" Delete"}
              </button>
            </div>
          </>
        )}
        {view === "review" && (
          <>
            <div
              className="dm-segmented dm-display-toggle"
            >
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
            {miniStack.words.length === 0 ? (
              <div className="dm-ministack-words-empty">
                <CardsIcon size={26} />
                <p className="dm-confirm-sub">
                  No words in this mini stack yet. Swipe a word card down to add one.
                </p>
              </div>
            ) : (
              <div className="dm-list dm-ministack-review-list" onClickCapture={dmListClickGuard}>
                {miniStack.words.map((w, i) => {
                  const stackId = resolveStackId(w);
                  return (
                    <WordCard
                      key={w.id}
                      w={w}
                      index={i + 1}
                      displayMode={displayMode}
                      showForms={isFormsMode ? true : showForms}
                      formAudio={showForms}
                      onToggleFav={(id) =>
                        stackId &&
                        onUpdateWord &&
                        onUpdateWord(stackId, id, (word) => ({
                          ...word,
                          favorite: !word.favorite,
                        }))
                      }
                      onEdit={(word) => setModalWord(word)}
                      onSpeak={onSpeak}
                      onShowForms={(word) => setFormsWord(word)}
                      onToggleMiniStack={() => onRemoveWord(w)}
                      isInMiniStack
                      minimalActions
                      isPremium={isPremium}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
      {modalWord !== undefined && (
        <WordModal
          initial={modalWord}
          onClose={() => setModalWord(undefined)}
          onSave={(word) => {
            const stackId = resolveStackId(modalWord);
            if (stackId && onUpdateWord) onUpdateWord(stackId, word.id, () => word);
            setModalWord(undefined);
          }}
          onDelete={(id) => {
            const stackId = resolveStackId(modalWord);
            if (stackId && onDeleteWord) onDeleteWord(stackId, id);
            onRemoveWord(modalWord);
            setModalWord(undefined);
          }}
          apiKey={apiKey}
          onOpenAI={onOpenAI}
        />
      )}
      {formsWord && (
        <AllFormsModal
          w={formsWord}
          onClose={() => setFormsWord(undefined)}
          mini
          isPremium={isPremium}
          onOpenPremium={onOpenPremium}
        />
      )}
    </div>
  );
}
