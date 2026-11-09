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
   visible height via window.visualViewport and exposes it as CSS
   custom properties, which .dm-modal-backdrop uses instead of relying on
   inset:0 alone.

   Keeping it calm while the keyboard slides (this used to make everything "swim"):
   - visualViewport fires resize/scroll many times per frame during the keyboard animation.
     The work is coalesced to one update per animation frame, and a CSS variable is only
     written when its (rounded) value really changed, so the page is not restyled for nothing.
   - The keyboard counts as open above 150px of shrink but only as closed again below 100px
     (hysteresis), so the dm-kb-open class cannot flap on and off in the middle of the slide. */
const KB_OPEN_PX = 150;
const KB_CLOSE_PX = 100;

export function initKeyboardViewport() {
  if (typeof window === "undefined" || !window.visualViewport) return;
  const vv = window.visualViewport;
  const root = document.documentElement;
  let lastH = null;
  let lastTop = null;
  let frame = 0;
  function sync() {
    frame = 0;
    const h = Math.round(vv.height);
    const top = Math.round(vv.offsetTop);
    if (h !== lastH) {
      lastH = h;
      root.style.setProperty("--vv-height", h + "px");
    }
    if (top !== lastTop) {
      lastTop = top;
      root.style.setProperty("--vv-offset-top", top + "px");
    }
    const shrink = window.innerHeight - vv.height;
    const zoomed = (vv.scale || 1) >= 1.05;
    const wasOpen = root.classList.contains("dm-kb-open");
    const open = !zoomed && (wasOpen ? shrink > KB_CLOSE_PX : shrink > KB_OPEN_PX);
    if (open !== wasOpen) root.classList.toggle("dm-kb-open", open);
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(sync);
  }
  sync();
  vv.addEventListener("resize", schedule);
  vv.addEventListener("scroll", schedule);
}

// True while the on-screen keyboard is up (as tracked above).
export function isKeyboardOpen() {
  return typeof document !== "undefined" && document.documentElement.classList.contains("dm-kb-open");
}
