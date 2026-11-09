/* components/favorites/favorites.jsx
 * FavoritesView: the starred words from every stack, shown with the exact same screen as a
 * stack (StackView): same top bar, title row, display toggle and word cards. It is a thin
 * wrapper that turns the starred words into a virtual "Favorites" stack and maps StackView's
 * edits back onto the stacks the words really live in.
 */

import { useState } from "react";
import { AddWordsModal } from "../stack-view/add-words-modal";
import { StackView } from "../stack-view/stack-view";
import { applyVirtualEdits, orderWords } from "../stack-view/virtual-stack";

export function FavoritesView({
  stacks,
  onBack,
  onUpdateWord,
  onDeleteWord,
  onSpeak,
  apiKey,
  onOpenAI,
  onDrillWord,
  onPlayGames,
  miniStack,
  onOpenMiniStack,
  onToggleMiniStackWord,
  nativeLanguage,
  learningLanguage,
  isPremium,
  onOpenPremium,
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [orderIds, setOrderIds] = useState(null); // set by the shuffle button
  let words = [];
  const candidates = [];
  stacks.forEach((s) =>
    s.words.forEach((w) => {
      if (w.favorite) words.push({ ...w, stackId: s.id, stackName: s.name });
      else candidates.push({ w, stack: s });
    })
  );
  words = orderWords(words, orderIds);
  const stack = { id: "__favorites__", name: "Favorites", emoji: "star", words };
  const handleUpdateStack = (next) => {
    applyVirtualEdits(words, next.words, onUpdateWord);
    setOrderIds(next.words.map((w) => w.id));
  };
  return (
    <>
      <StackView
        stack={stack}
        isFavorites
        onBack={onBack}
        onUpdateStack={handleUpdateStack}
        onDeleteStack={() => {}}
        onSpeak={onSpeak}
        onOpenAI={onOpenAI}
        apiKey={apiKey}
        onDrillWord={onDrillWord}
        miniStack={miniStack}
        onOpenMiniStack={onOpenMiniStack}
        onToggleMiniStackWord={onToggleMiniStackWord}
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
          title="Add favorites"
          candidates={candidates}
          onClose={() => setShowAdd(false)}
          onPick={(stackId, wordId) =>
            onUpdateWord(stackId, wordId, (w) => ({ ...w, favorite: true }))
          }
        />
      )}
    </>
  );
}
