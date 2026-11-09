/* components/stack-view/add-words-modal.jsx
 * The "+" picker of Favorites and mini stacks: search a list of words and tap one to add it.
 */

import { useState } from "react";
import { IconBtn } from "../common/common";
import { Plus, Search, X } from "../icons/icons";
import "./add-words-modal.css";

// candidates: [{ w, stack }] words that can still be added; onPick(stackId, wordId).
export function AddWordsModal({ title, candidates, onPick, onClose }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const rows = candidates.filter(
    ({ w }) => !q || `${w.de || ""} ${w.en || ""}`.toLowerCase().includes(q)
  );
  const shown = rows.slice(0, 80);
  return (
    <div className="dm-modal-backdrop" onClick={onClose}>
      <div className="dm-modal dm-fav-add-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dm-modal-head">
          <h3>{title}</h3>
          <IconBtn onClick={onClose}>
            <X size={18} />
          </IconBtn>
        </div>
        <div className="dm-fav-add-search">
          <Search size={16} />
          <input
            className="dm-input"
            placeholder="Search your words"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>
        <div className="dm-fav-add-list">
          {shown.length === 0 && <div className="dm-empty">No words to add.</div>}
          {shown.map(({ w, stack }) => (
            <button
              key={`${stack.id}-${w.id}`}
              type="button"
              className="dm-fav-add-row"
              onClick={() => onPick(stack.id, w.id)}
            >
              <span className="dm-fav-add-text">
                <span className="dm-fav-add-de">{w.de}</span>
                <span className="dm-fav-add-en">{w.en}</span>
              </span>
              <span className="dm-fav-add-stack">{stack.name}</span>
              <Plus size={18} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
