/* behaviors/keyboard-activation.js
 * onKeyDown handler for non-<button> elements that act as buttons (role="button"):
 * Enter and Space trigger the element's click, like a real button does.
 */
export function activateOnKey(e) {
  if (e.target !== e.currentTarget) return;
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    e.currentTarget.click();
  }
}
