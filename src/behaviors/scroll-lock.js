/* behaviors/scroll-lock.js
 * Scroll lock while modals/keyboard are open.
 */

/* ---------- Real scroll lock for modals/keyboard ----------
   Plain `overflow: hidden` on body does NOT stop iOS Safari from
   scrolling the document once the keyboard is open (this is part of
   the same WebKit bug: the document becomes scrollable by the
   keyboard's height, which is also what drags fixed elements out of
   place). The reliable fix is to make body itself position:fixed
   while anything keyboard/modal-related is open, so there is no
   scrollable document at all. Re-evaluated on focus changes, DOM
   changes (modal open/close), and viewport resize (keyboard open/close). */
export function initScrollLock() {
  let savedScrollY = 0;
  let locked = false;
  function blockingUIOpen() {
    return !!document.querySelector(
      ".dm-modal-backdrop, .dm-tr-stackpick-menu, .dm-dropdown-panel"
    );
  }
  function keyboardOpen() {
    return !!(
      window.visualViewport &&
      window.innerHeight - window.visualViewport.height > 150 &&
      (window.visualViewport.scale || 1) < 1.05
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
    if (blockingUIOpen() || keyboardOpen()) lockScroll();
    else unlockScroll();
  }
  document.addEventListener("focusin", evaluate, true);
  document.addEventListener(
    "focusout",
    function () {
      setTimeout(evaluate, 60);
    },
    true
  );
  if (window.visualViewport) window.visualViewport.addEventListener("resize", evaluate);
  const scrollLockObserver = new MutationObserver(evaluate);
  scrollLockObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
  evaluate();
}
