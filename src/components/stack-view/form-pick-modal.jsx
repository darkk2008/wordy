/* components/stack-view/form-pick-modal.jsx
 * Opened by long-pressing the FORMS filter of a stack: choose which form the cards show instead of
 * the default one (noun: plural, adjective: comparative -> superlative, verb: past -> participle).
 * Picking a form applies it and closes the menu; "Back to default forms" clears every choice.
 */

import { useMemo, useRef, useState } from "react";
import { IconBtn } from "../common/common";
import { FORM_TYPES, FORM_TYPE_INFO, getFormOptions, samePick } from "../word-forms/form-pick";
import { Check, RotateCcw, X } from "../icons/icons";
import "./form-pick-modal.css";

export function FormPickModal({ words, picks, onPick, onReset, onClose }) {
  const [closing, setClosing] = useState(false);
  // The menu opens while the finger is still down on the FORMS filter. A click that ends that press
  // must not land on the backdrop (closing the menu at once) or on a form under the finger.
  const openedAt = useRef(Date.now());
  const tooEarly = () => Date.now() - openedAt.current < 350;
  const options = useMemo(() => getFormOptions(words), [words]);
  const types = FORM_TYPES.filter((t) => options[t]);
  const hasPick = FORM_TYPES.some((t) => picks && picks[t]);
  const closeWithAnim = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(onClose, 220);
  };
  return (
    <div
      className={`dm-modal-backdrop${closing ? " dm-modal-backdrop-closing" : ""}`}
      onClick={() => !tooEarly() && closeWithAnim()}
    >
      <div
        className={`dm-modal dm-formpick${closing ? " dm-modal-closing" : ""}`}
        role="dialog"
        aria-label="Choose form"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dm-modal-head">
          <h3>Choose form</h3>
          <IconBtn onClick={() => closeWithAnim()}>
            <X size={18} />
          </IconBtn>
        </div>
        <p className="dm-formpick-hint">
          The FORMS filter shows this form on the cards instead of the default one.
        </p>
        {types.length === 0 && (
          <div className="dm-formpick-empty">Add nouns, adjectives or verbs to choose their forms.</div>
        )}
        {types.map((type) => {
          const current = picks && picks[type];
          return (
            <section key={type} className="dm-formpick-type" data-type={type}>
              <div className="dm-formpick-type-title">{FORM_TYPE_INFO[type].title}</div>
              <button
                type="button"
                className={`dm-formpick-chip dm-formpick-default${current ? "" : " is-active"}`}
                aria-pressed={!current}
                onClick={() => {
                  if (tooEarly()) return;
                  onPick(type, null);
                  closeWithAnim();
                }}
              >
                {!current && <Check size={13} />}
                {`Default: ${FORM_TYPE_INFO[type].defaultText}`}
              </button>
              {options[type].map((group) => (
                <div key={group.title} className="dm-formpick-group">
                  {options[type].length > 1 && <div className="dm-formpick-group-title">{group.title}</div>}
                  <div className="dm-formpick-chips">
                    {group.items.map((it) => {
                      const active = samePick(current, it);
                      return (
                        <button
                          key={it.label}
                          type="button"
                          className={`dm-formpick-chip${active ? " is-active" : ""}`}
                          aria-pressed={active}
                          onClick={() => {
                            if (tooEarly()) return;
                            onPick(type, it);
                            closeWithAnim();
                          }}
                        >
                          {active && <Check size={13} />}
                          {it.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </section>
          );
        })}
        <div className="dm-modal-actions">
          <button
            type="button"
            className="dm-btn-secondary dm-formpick-reset"
            disabled={!hasPick}
            onClick={() => {
              if (tooEarly()) return;
              onReset();
              closeWithAnim();
            }}
          >
            <RotateCcw size={16} />
            {" Back to default forms"}
          </button>
        </div>
      </div>
    </div>
  );
}
