/* behaviors/modal-exit.js
 * Gives every modal a closing transition (and keeps modal motion calm around the keyboard).
 *
 * Most modals are mounted only while they are open ({open && <div className="dm-modal-backdrop">}),
 * so React removes them from the DOM at once and they used to vanish without any animation
 * (the entrance animation always played; only the word modal animated out by itself).
 *
 * When a backdrop leaves the DOM, this puts a non-interactive copy of it back in the same place,
 * plays the existing closing animation on it (fade the backdrop, slide the sheet down) and removes
 * it again. One behavior covers every current and future modal, and nothing in React changes.
 * Modals that already animate out on their own (they carry the -closing classes) are skipped.
 *
 * Keyboard: a sheet that slides while the keyboard also moves makes the whole screen look like it
 * is swimming. A modal that appears with a text field focused (autoFocus) or while the keyboard is
 * already up gets .dm-modal-kb (fade only, no slide), and a modal that closes while the keyboard is
 * up leaves with a fade only (.dm-modal-ghost-fade).
 */
import { isKeyboardOpen } from "./keyboard-viewport";

const EXIT_MS = 240;
const isTextField = (el) =>
  !!el &&
  (el.tagName === "TEXTAREA" ||
    el.isContentEditable ||
    (el.tagName === "INPUT" && !/^(checkbox|radio|button|submit|range|color|file)$/i.test(el.type)));

export function initModalExit() {
  if (typeof MutationObserver === "undefined" || typeof document === "undefined") return;
  const reducedMotion = () =>
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const ghostOf = (node, parent, nextSibling) => {
    const ghost = node.cloneNode(true);
    ghost.classList.add("dm-modal-backdrop-closing", "dm-modal-ghost");
    ghost.classList.remove("dm-modal-kb");
    if (isKeyboardOpen()) ghost.classList.add("dm-modal-ghost-fade");
    ghost.setAttribute("aria-hidden", "true");
    ghost.removeAttribute("id");
    const sheet = ghost.querySelector(".dm-modal");
    if (sheet) sheet.classList.add("dm-modal-closing");
    ghost
      .querySelectorAll("button, input, textarea, select, a, [tabindex]")
      .forEach((el) => el.setAttribute("tabindex", "-1"));
    const ref = nextSibling && nextSibling.parentNode === parent ? nextSibling : null;
    parent.insertBefore(ghost, ref);
    setTimeout(() => ghost.remove(), EXIT_MS + 40);
  };

  const markKeyboardModal = (node) => {
    if (!node.classList.contains("dm-modal-backdrop") || node.classList.contains("dm-modal-ghost"))
      return;
    if (isKeyboardOpen() || (node.contains(document.activeElement) && isTextField(document.activeElement)))
      node.classList.add("dm-modal-kb");
  };
  const observer = new MutationObserver((records) => {
    records.forEach((rec) => {
      rec.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) markKeyboardModal(node);
      });
    });
    if (document.hidden || reducedMotion()) return;
    records.forEach((rec) => {
      if (!rec.removedNodes.length || !rec.target.isConnected) return;
      rec.removedNodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        if (!node.classList.contains("dm-modal-backdrop")) return;
        if (node.classList.contains("dm-modal-ghost")) return; // our own copy leaving
        if (node.classList.contains("dm-modal-backdrop-closing")) return; // already animated out
        if (node.querySelector(".dm-modal-closing")) return;
        ghostOf(node, rec.target, rec.nextSibling);
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
