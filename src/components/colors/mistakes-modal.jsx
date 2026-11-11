/* components/colors/mistakes-modal.jsx
 * MistakesModal: opened from the game results screen. Every word the player got wrong is shown as
 * a word card (word + translation) with two icon buttons: star it, or put it in a colour. The colour
 * button opens a small picker modal with the colours.
 */

import { useState } from "react";
import { IconBtn } from "../common/common";
import { Check, PaletteIcon, Star, X } from "../icons/icons";
import { WORD_COLORS, colorById } from "../../core/word-colors";
import "./colors.css";

// words: [{ id, de, en, color, favorite, _stackId }]
// onSetColor(stackId, wordId, colorId | "") and onToggleFav(stackId, wordId)
export function MistakesModal({ words, onSetColor, onToggleFav, onClose }) {
  const [pickId, setPickId] = useState(null); // the word whose colour picker is open
  const pickWord = pickId ? words.find((w) => w.id === pickId) : null;
  return (
    <div className="dm-modal-backdrop" onClick={onClose}>
      <div className="dm-modal dm-mistakes-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dm-modal-head">
          <h3>{`Mistakes (${words.length})`}</h3>
          <IconBtn title="Close" onClick={onClose}>
            <X size={18} />
          </IconBtn>
        </div>
        <div className="dm-mistakes-list">
          {words.map((w) => {
            const c = colorById(w.color);
            return (
              <div key={w.id} className="dm-mcard" style={c ? { "--sw": c.hex } : undefined}>
                <div className="dm-mcard-text">
                  <span className="dm-mcard-de">{w.de}</span>
                  <span className="dm-mcard-en">{w.en}</span>
                </div>
                <div className="dm-mcard-actions">
                  <button
                    type="button"
                    className={`dm-mcard-btn${w.favorite ? " dm-mcard-btn-fav" : ""}`}
                    title={w.favorite ? "Remove from favorites" : "Add to favorites"}
                    aria-label={w.favorite ? "Remove from favorites" : "Add to favorites"}
                    aria-pressed={!!w.favorite}
                    onClick={() => onToggleFav && onToggleFav(w._stackId, w.id)}
                  >
                    <Star size={18} fill={w.favorite ? "#FFB020" : "none"} />
                  </button>
                  <button
                    type="button"
                    className={`dm-mcard-btn${c ? " dm-mcard-btn-colored" : ""}`}
                    title={c ? `Colour: ${c.name}` : "Add to a colour"}
                    aria-label={c ? `Colour: ${c.name}. Change colour` : "Add to a colour"}
                    aria-haspopup="dialog"
                    onClick={() => setPickId(w.id)}
                  >
                    <PaletteIcon size={18} />
                    {c && <span className="dm-mcard-btn-dot" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="dm-modal-actions">
          <button type="button" className="dm-btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
      {pickWord && (
        <div
          className="dm-modal-backdrop dm-colorpick-backdrop"
          onClick={(e) => {
            e.stopPropagation();
            setPickId(null);
          }}
        >
          <div
            className="dm-modal dm-colorpick"
            role="dialog"
            aria-label={`Choose a colour for ${pickWord.de}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dm-modal-head">
              <h3>Choose a colour</h3>
              <IconBtn title="Close" onClick={() => setPickId(null)}>
                <X size={18} />
              </IconBtn>
            </div>
            <div className="dm-colorpick-word">
              <b>{pickWord.de}</b>
              <span>{pickWord.en}</span>
            </div>
            <div className="dm-colorpick-grid">
              {WORD_COLORS.map((c) => {
                const on = pickWord.color === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    className={`dm-colorpick-opt${on ? " dm-colorpick-opt-on" : ""}`}
                    style={{ "--sw": c.hex }}
                    aria-pressed={on}
                    onClick={() => {
                      onSetColor(pickWord._stackId, pickWord.id, c.id);
                      setPickId(null);
                    }}
                  >
                    <span className="dm-colorpick-dot">
                      {on && <Check size={20} strokeWidth={3} />}
                    </span>
                    <span className="dm-colorpick-name">{c.name}</span>
                  </button>
                );
              })}
            </div>
            {pickWord.color && (
              <button
                type="button"
                className="dm-btn-secondary dm-colorpick-clear"
                onClick={() => {
                  onSetColor(pickWord._stackId, pickWord.id, "");
                  setPickId(null);
                }}
              >
                Remove colour
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
