/* components/colors/color-swatches.jsx
 * ColorSwatches: a row of colour dots. Tap one to give a word that colour, tap it again to clear it.
 * ColorDot: the small dot shown on a word card.
 */

import { WORD_COLORS, colorById } from "../../core/word-colors";
import { Check } from "../icons/icons";
import "./colors.css";

export function ColorSwatches({ value, onChange, size = "md", label = "Word colour" }) {
  return (
    <div className={`dm-swatches dm-swatches-${size}`} role="radiogroup" aria-label={label}>
      {WORD_COLORS.map((c) => {
        const on = value === c.id;
        return (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={c.name}
            title={on ? `${c.name} (tap to remove)` : c.name}
            className={`dm-swatch${on ? " dm-swatch-on" : ""}`}
            style={{ "--sw": c.hex }}
            onClick={() => onChange(on ? "" : c.id)}
          >
            {on && <Check size={size === "sm" ? 12 : 15} strokeWidth={3} />}
          </button>
        );
      })}
    </div>
  );
}

export function ColorDot({ id, size = 10 }) {
  const c = colorById(id);
  if (!c) return null;
  return (
    <span
      className="dm-color-dot"
      title={c.name}
      aria-label={`Colour: ${c.name}`}
      style={{ "--sw": c.hex, width: size, height: size }}
    />
  );
}
