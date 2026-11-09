/* components/stack-view/rename-stack-modal.jsx
 * Small modal opened by double-clicking the stack title: change the stack's name and icon.
 */

import { useState } from "react";
import { ICON_IDS } from "../../core/icon-registry";
import { AnimatedIcon, IconBtn } from "../common/common";
import { Input } from "../common/Input";
import { Check, X } from "../icons/icons";

export function RenameStackModal({ stack, onSave, onClose }) {
  const [name, setName] = useState(stack.name || "");
  const [emoji, setEmoji] = useState(stack.emoji || ICON_IDS[0]);
  const [closing, setClosing] = useState(false);
  const canSave = name.trim().length > 0;
  const closeWithAnim = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(onClose, 220);
  };
  const submit = () => {
    if (!canSave) return;
    onSave({ name: name.trim().slice(0, 80), emoji });
  };
  return (
    <div
      className={`dm-modal-backdrop${closing ? " dm-modal-backdrop-closing" : ""}`}
      onClick={closeWithAnim}
    >
      <div
        className={`dm-modal${closing ? " dm-modal-closing" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dm-modal-head">
          <h3>Edit stack</h3>
          <IconBtn onClick={closeWithAnim}>
            <X size={18} />
          </IconBtn>
        </div>
        <label className="dm-label">Name</label>
        <Input
          className="dm-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. B1 Grammar"
          maxLength={80}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            else if (e.key === "Escape") closeWithAnim();
          }}
        />
        <label className="dm-label">Icon</label>
        <div className="dm-emoji-row">
          {ICON_IDS.map((em) => (
            <button
              key={em}
              type="button"
              className={`dm-emoji-pick ${emoji === em ? "dm-emoji-pick-active" : ""}`}
              onClick={() => setEmoji(em)}
            >
              <AnimatedIcon id={em} size={24} />
            </button>
          ))}
        </div>
        <div className="dm-modal-actions">
          <button type="button" className="dm-btn-primary" disabled={!canSave} onClick={submit}>
            <Check size={16} />
            {" Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
