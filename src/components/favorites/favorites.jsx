/* components/favorites/favorites.jsx
 * FavoritesView.
 */

import { useState } from "react";
import { IconBtn } from "../common/common";
import { FormsAudioToggle } from "../games/setup-controls";
import { Bot, MiniStackBtnContent } from "../icons/icons";
import { getLangAbbr } from "../language-settings/language-settings";
import { MiniStackCreateModal, MiniStackManageModal } from "../mini-stack/mini-stack";
import { dmListClickGuard } from "../swipeable-row/swipeable-row";
import { WordCard } from "../word-card/word-card";
import { AllFormsModal } from "../word-forms/word-forms";
import { WordModal } from "../word-modal/word-modal";

export function FavoritesView({
  stacks,
  onUpdateWord,
  onDeleteWord,
  onSpeak,
  apiKey,
  onOpenAI,
  onDrillWord,
  miniStack,
  onCreateMiniStack,
  onToggleMiniStackWord,
  onDeleteMiniStack,
  nativeLanguage,
  learningLanguage,
  isPremium,
  onOpenPremium,
}) {
  const [formsWord, setFormsWord] = useState(undefined);
  const [modalWord, setModalWord] = useState(undefined);
  const [displayMode, setDisplayMode] = useState("BOTH");
  const [showForms, setShowForms] = useState(false);
  const [showMiniStackCreate, setShowMiniStackCreate] = useState(false);
  const [showMiniStackManage, setShowMiniStackManage] = useState(false);
  const handleMiniStackClick = () => {
    if (!miniStack) {
      setShowMiniStackCreate(true);
      return;
    }
    setShowMiniStackManage(true);
  };
  const favWords = [];
  stacks.forEach((s) =>
    s.words.forEach((w) => {
      if (w.favorite)
        favWords.push({
          ...w,
          stackId: s.id,
          stackName: s.name,
        });
    })
  );
  const isFormsMode = displayMode === "FORMS";
  return (
    <div className="dm-view">
      <div className="dm-header">
        <div>
          <div className="dm-eyebrow">Quick revision</div>
          <h1 className="dm-h1">Favorites</h1>
        </div>
        <div className="dm-header-actions">
          {favWords.length > 0 && (
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
          )}
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
          <IconBtn title="AI Tutor" onClick={onOpenAI}>
            <Bot size={20} />
          </IconBtn>
        </div>
      </div>
      {favWords.length > 0 && (
        <div className="dm-display-toggle-row">
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
        </div>
      )}
      <div className="dm-list" onClickCapture={dmListClickGuard}>
        {favWords.length === 0 && <div className="dm-empty">Star words to collect them here.</div>}
        {favWords.map((w) => (
          <WordCard
            key={w.id}
            w={w}
            displayMode={displayMode}
            showForms={isFormsMode ? true : showForms}
            formAudio={showForms}
            onToggleFav={(id) =>
              onUpdateWord(w.stackId, id, (word) => ({
                ...word,
                favorite: !word.favorite,
              }))
            }
            onEdit={(word) => setModalWord(word)}
            onSpeak={onSpeak}
            onShowForms={(word) => setFormsWord(word)}
            onDrill={
              onDrillWord
                ? (word) =>
                    onDrillWord(
                      word,
                      w.stackId,
                      (stacks.find((s) => s.id === w.stackId) || {}).words
                    )
                : undefined
            }
            onToggleMiniStack={onToggleMiniStackWord}
            isInMiniStack={!!(miniStack && miniStack.words.some((mw) => mw.id === w.id))}
            isPremium={isPremium}
          />
        ))}
      </div>
      {modalWord !== undefined && (
        <WordModal
          initial={modalWord}
          onClose={() => setModalWord(undefined)}
          onSave={(word) => {
            onUpdateWord(modalWord.stackId, word.id, () => word);
            setModalWord(undefined);
          }}
          onDelete={(id) => {
            onDeleteWord(modalWord.stackId, id);
            setModalWord(undefined);
          }}
          apiKey={apiKey}
          onOpenAI={onOpenAI}
          nativeLanguage={nativeLanguage}
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
          allStacks={stacks}
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
    </div>
  );
}
