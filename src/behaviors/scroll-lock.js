/* behaviors/scroll-lock.js
 * Scroll lock while modals/keyboard are open.
 */
import { isKeyboardOpen } from "./keyboard-viewport";

/* ---------- Real scroll lock for modals/keyboard ----------
   Plain `overflow: hidden` on body does NOT stop iOS Safari from
   scrolling the document once the keyboard is open (this is part of
   the same WebKit bug: the document becomes scrollable by the
   keyboard's height, which is also what drags fixed elements out of
   place). The reliable fix is to make body itself position:fixed
   while anything keyboard/modal-related is open, so there is no
   scrollable document at all. Re-evaluated on focus changes, DOM
   changes (modal open/close), and viewport resize (keyboard open/close).

   Taking the lock changes the page's layout, so doing it in the middle of the keyboard's
   slide made the whole screen jump. Therefore:
   - checks are coalesced to one per animation frame (the DOM observer used to run it for
     every single mutation, e.g. each typed character in a chat);
   - the keyboard state comes from keyboard-viewport (with hysteresis), not from a threshold
     that can be crossed back and forth while the keyboard is still moving. */
export function initScrollLock() {
  let savedScrollY = 0;
  let locked = false;
  let frame = 0;
  function blockingUIOpen() {
    return !!document.querySelector(
      ".dm-modal-backdrop, .dm-tr-stackpick-menu, .dm-dropdown-panel"
    );
  }
  function lockScroll() {
    if (locked) return;
    locked = true;
    savedScrollY = window.scrollY || window.pageYOffset || 0;
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.touchAction = "none";
    document.body.classList.add("dm-scroll-locked");
    document.body.style.position = "fixed";
    document.body.style.top = -savedScrollY + "px";
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    document.body.style.touchAction = "none";
  }
  function unlockScroll() {
    if (!locked) return;
    locked = false;
    document.documentElement.style.overflow = "";
    document.documentElement.style.touchAction = "";
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";
    document.body.style.touchAction = "";
    document.body.classList.remove("dm-scroll-locked");
    window.scrollTo(0, savedScrollY);
  }
  function evaluate() {
    frame = 0;
    if (blockingUIOpen() || isKeyboardOpen()) lockScroll();
    else unlockScroll();
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(evaluate);
  }
  document.addEventListener("focusin", schedule, true);
  document.addEventListener(
    "focusout",
    function () {
      setTimeout(schedule, 60);
    },
    true
  );
  if (window.visualViewport) window.visualViewport.addEventListener("resize", schedule);
  const scrollLockObserver = new MutationObserver(schedule);
  scrollLockObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
  evaluate();
}
