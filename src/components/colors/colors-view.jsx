/* components/colors/colors-view.jsx
 * ColorsView: the "Colours" tab. Lists the colours with how many words each holds; opening one shows
 * its words with the exact same screen as a stack (StackView), the way Favorites does. The words
 * really live in their own stacks; a colour only tags them.
 */

import { useState } from "react";
import { WORD_COLORS, colorById, countByColor, withColor, wordsWithColor } from "../../core/word-colors";
import { AddWordsModal } from "../stack-view/add-words-modal";
import { StackView } from "../stack-view/stack-view";
import { applyVirtualEdits, orderWords } from "../stack-view/virtual-stack";
import "./colors.css";

export function ColorsView({ openColorId, onOpenColor, ...rest }) {
  if (colorById(openColorId)) {
    return <ColorGroup colorId={openColorId} onBack={() => onOpenColor(null)} {...rest} />;
  }
  const counts = countByColor(rest.stacks);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return (
    <div className="dm-view">
      <div className="dm-header">
        <div>
          <div className="dm-eyebrow">Group words across stacks</div>
          <h1 className="dm-h1">Colours</h1>
        </div>
      </div>
      <p className="dm-colors-hint">
        {total
          ? "Open a colour to see its words and play games with them."
          : "Give a word a colour from its ⋮ menu, or from the Mistakes list after a game. Every colour becomes a list you can study and play with."}
      </p>
      <div className="dm-colors-grid">
        {WORD_COLORS.map((c) => {
          const n = counts[c.id] || 0;
          return (
            <button
              key={c.id}
              type="button"
              className={`dm-color-tile${n ? "" : " dm-color-tile-empty"}`}
              style={{ "--sw": c.hex }}
              onClick={() => onOpenColor(c.id)}
            >
              <span className="dm-color-tile-bubble" />
              <span className="dm-color-tile-name">{c.name}</span>
              <span className="dm-color-tile-count">{`${n} word${n === 1 ? "" : "s"}`}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ColorGroup({
  colorId,
  stacks,
  onBack,
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
  const color = colorById(colorId);
  const [showAdd, setShowAdd] = useState(false);
  const [orderIds, setOrderIds] = useState(null); // set by the shuffle button
  const words = orderWords(wordsWithColor(stacks, colorId), orderIds);
  const candidates = [];
  stacks.forEach((s) =>
    s.words.forEach((w) => {
      if (w.color !== colorId) candidates.push({ w, stack: s });
    })
  );
  const stack = { id: `__color_${colorId}__`, name: color.name, emoji: "star", words };
  const handleUpdateStack = (next) => {
    applyVirtualEdits(words, next.words, onUpdateWord);
    setOrderIds(next.words.map((w) => w.id));
  };
  return (
    <>
      <StackView
        stack={stack}
        colorGroup={color}
        onBack={onBack}
        onUpdateStack={handleUpdateStack}
        onDeleteStack={() => {}}
        onSpeak={onSpeak}
        onOpenAI={onOpenAI}
        apiKey={apiKey}
        onDrillWord={onDrillWord}
        allStacks={stacks}
        onUpdateWord={onUpdateWord}
        onDeleteWord={onDeleteWord}
        onPlayGames={(st) => onPlayGames(st, color)}
        nativeLanguage={nativeLanguage}
        learningLanguage={learningLanguage}
        onOpenPremium={onOpenPremium}
        isPremium={isPremium}
        onAddClick={() => setShowAdd(true)}
      />
      {showAdd && (
        <AddWordsModal
          title={`Add to ${color.name}`}
          candidates={candidates}
          onClose={() => setShowAdd(false)}
          onPick={(stackId, wordId) => onUpdateWord(stackId, wordId, (w) => withColor(w, colorId))}
        />
      )}
    </>
  );
}
