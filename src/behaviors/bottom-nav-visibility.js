/* behaviors/bottom-nav-visibility.js
 * Hides the bottom nav while a modal is open.
 */

/* ---------- Bottom nav visibility (companion to the scroll lock above) ----------
   See the `body.dm-modal-open` comment in the CSS: this replaces a
   `:has(.dm-modal-backdrop)` selector that could lag behind by a
   couple hundred ms on slower devices while a modal's contents were
   still mounting. Deliberately childList-only on the body-wide
   observer (no subtree attribute watching, which would re-run on
   every unrelated className change the app makes) — a backdrop's own
   "closing" class is instead watched with a tiny per-node observer
   attached only while that node exists, so the nav still reappears
   during the close animation without the broad watch being expensive. */
export function initBottomNavVisibility() {
  const watched = typeof WeakSet !== "undefined" ? new WeakSet() : null;
  function evaluateNav() {
    const backdrops = document.querySelectorAll(".dm-modal-backdrop");
    let open = false;
    for (let i = 0; i < backdrops.length; i++) {
      var b = backdrops[i];
      if (!b.classList.contains("dm-modal-backdrop-closing")) open = true;
      if (watched && !watched.has(b)) {
        watched.add(b);
        watchClosing(b);
      }
    }
    document.body.classList.toggle("dm-modal-open", open);
  }
  function watchClosing(node) {
    const closeObserver = new MutationObserver(function () {
      if (!node.isConnected) {
        closeObserver.disconnect();
        return;
      }
      evaluateNav();
    });
    closeObserver.observe(node, {
      attributes: true,
      attributeFilter: ["class"],
    });
  }
  const navObserver = new MutationObserver(evaluateNav);
  navObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
  evaluateNav();
}
