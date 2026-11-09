/* components/mini-stack/mini-stack.jsx
 * MiniStackView: a mini stack opens as a real stack screen (StackView) holding the pinned words.
 * Every stack (and Favorites) has one by default; it is created the first time a word is pinned.
 */

import { useState } from "react";
import { MINISTACK_ICON_IDS } from "../../core/icon-registry";
import { AddWordsModal } from "../stack-view/add-words-modal";
import { StackView } from "../stack-view/stack-view";
import { applyVirtualEdits, orderWords } from "../stack-view/virtual-stack";

export const FAVORITES_PARENT_ID = "__favorites__";

export function MiniStackView({
  stacks,
  parentId, // id of the stack this mini stack belongs to (or FAVORITES_PARENT_ID)
  miniStack,
  onBack,
  onToggleMiniStackWord,
  onClearMiniStack,
  onUpdateWord,
  onDeleteWord,
  onSpeak,
  apiKey,
  onOpenAI,
  onDrillWord,
  onPlayGames,
  nativeLanguage,
  learningLanguage,
  isPremium,
  onOpenPremium,
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [orderIds, setOrderIds] = useState(null); // set by the shuffle button
  const pinned = (miniStack && miniStack.words) || [];
  // Pinned words are copies; always show the current version of the word from its own stack.
  const resolve = (mw) => {
    const owner =
      stacks.find((s) => s.id === mw.stackId && s.words.some((w) => w.id === mw.id)) ||
      stacks.find((s) => s.words.some((w) => w.id === mw.id));
    if (!owner) return null;
    return { ...owner.words.find((w) => w.id === mw.id), stackId: owner.id, stackName: owner.name };
  };
  const words = orderWords(pinned.map(resolve).filter(Boolean), orderIds);
  const pinnedIds = new Set(pinned.map((w) => w.id));
  const candidates = [];
  stacks.forEach((s) => {
    if (parentId !== FAVORITES_PARENT_ID && s.id !== parentId) return;
    s.words.forEach((w) => {
      if (pinnedIds.has(w.id)) return;
      if (parentId === FAVORITES_PARENT_ID && !w.favorite) return;
      candidates.push({ w, stack: s });
    });
  });
  const stack = {
    id: "__mini__",
    name: "Mini stack",
    emoji: (miniStack && miniStack.emoji) || MINISTACK_ICON_IDS[0],
    words,
  };
  const handleUpdateStack = (next) => {
    applyVirtualEdits(words, next.words, onUpdateWord);
    setOrderIds(next.words.map((w) => w.id));
  };
  return (
    <>
      <StackView
        stack={stack}
        isMini
        onBack={onBack}
        onUpdateStack={handleUpdateStack}
        onDeleteStack={() => {}}
        onSpeak={onSpeak}
        onOpenAI={onOpenAI}
        apiKey={apiKey}
        onDrillWord={onDrillWord}
        miniStack={{ ...(miniStack || {}), words }}
        onToggleMiniStackWord={onToggleMiniStackWord}
        onClearMiniStack={onClearMiniStack}
        allStacks={stacks}
        onUpdateWord={onUpdateWord}
        onDeleteWord={onDeleteWord}
        onPlayGames={onPlayGames}
        nativeLanguage={nativeLanguage}
        learningLanguage={learningLanguage}
        onOpenPremium={onOpenPremium}
        isPremium={isPremium}
        onAddClick={() => setShowAdd(true)}
      />
      {showAdd && (
        <AddWordsModal
          title="Add words"
          candidates={candidates}
          onClose={() => setShowAdd(false)}
          onPick={(stackId, wordId) => {
            const owner = stacks.find((s) => s.id === stackId);
            const word = owner && owner.words.find((w) => w.id === wordId);
            if (word) onToggleMiniStackWord({ ...word, stackId });
          }}
        />
      )}
    </>
  );
}
