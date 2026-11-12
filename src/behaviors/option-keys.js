/* behaviors/option-keys.js
 * Keyboard choosing for the games that show answer buttons (multiple choice, word rain, true/false,
 * cases, ...): Arrow Down / Arrow Up move a highlight through the options (wrapping round), and Enter
 * picks the highlighted one. The highlight is real focus, so Enter is the browser's own button
 * activation and the games' existing "already answered" guards still apply.
 * On true/false, which has two buttons side by side, Left / Right work too.
 *
 * Pass a value that changes with every question (e.g. the question index): the highlight is cleared
 * then, so a new question never starts with an option already selected.
 */
import { useEffect } from "react";

const OPTION_SELECTOR = ".dm-game-play .dm-options .dm-option, .dm-game-play .dm-tf-buttons .dm-tf-btn";

function enabledOptions() {
  return Array.from(document.querySelectorAll(OPTION_SELECTOR)).filter(
    (el) => !el.disabled && el.offsetParent !== null
  );
}

export function useOptionKeys(resetKey) {
  useEffect(() => {
    const active = document.activeElement;
    if (active && active.matches && active.matches(OPTION_SELECTOR)) active.blur();
  }, [resetKey]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.defaultPrevented || e.isComposing || e.altKey || e.ctrlKey || e.metaKey) return;
      const t = e.target;
      if (t && t.closest && t.closest("input, textarea, select, [contenteditable='true']")) return;
      const options = enabledOptions();
      if (!options.length) return;
      const horizontal = options[0].classList.contains("dm-tf-btn");
      let step = 0;
      if (e.key === "ArrowDown" || (horizontal && e.key === "ArrowRight")) step = 1;
      else if (e.key === "ArrowUp" || (horizontal && e.key === "ArrowLeft")) step = -1;
      if (!step) return;
      e.preventDefault(); // keep the page from scrolling
      const cur = options.indexOf(document.activeElement);
      const next = cur === -1 ? (step === 1 ? 0 : options.length - 1) : (cur + step + options.length) % options.length;
      options[next].focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
