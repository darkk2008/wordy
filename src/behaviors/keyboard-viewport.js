/* behaviors/keyboard-viewport.js
 * iOS on-screen-keyboard viewport fallback.
 */

/* ---------- Keyboard viewport fallback ----------
   iOS Safari has a long-standing bug (still present as of iOS 26) where
   position:fixed elements don't track the visual viewport when the
   on-screen keyboard opens/closes: the fixed element keeps its old
   (taller) size, leaving a gap between it and the keyboard that shows
   the page background through. `interactive-widget=resizes-content` in
   the viewport meta tag fixes this on newer browsers; this is a JS
   fallback for versions that don't yet honor it. It tracks the actual
   visible height via window.visualViewport and exposes it as a CSS
   custom property, which .dm-modal-backdrop uses instead of relying on
   inset:0 alone. */
export function initKeyboardViewport() {
  if (typeof window === "undefined" || !window.visualViewport) return;
  const vv = window.visualViewport;
  function syncViewport() {
    document.documentElement.style.setProperty("--vv-height", vv.height + "px");
    document.documentElement.style.setProperty("--vv-offset-top", vv.offsetTop + "px");
    const shrink = window.innerHeight - vv.height;
    const kbOpen = shrink > 150 && (vv.scale || 1) < 1.05;
    document.documentElement.classList.toggle("dm-kb-open", kbOpen);
  }
  syncViewport();
  vv.addEventListener("resize", syncViewport);
  vv.addEventListener("scroll", syncViewport);
}
