/* Hides the Google-Translate banner and keeps body/html top offsets sane. Runs before the app. */
(function () {
  function killGoogTranslateBanner() {
    document
      .querySelectorAll(
        ".goog-te-banner-frame, iframe.goog-te-banner-frame, .skiptranslate iframe, .goog-te-ftab, .goog-te-ftab-float"
      )
      .forEach(function (el) {
        el.style.setProperty("display", "none", "important");
        el.style.setProperty("visibility", "hidden", "important");
        var wrap = el.parentElement;
        if (wrap && wrap.classList.contains("skiptranslate")) {
          wrap.style.setProperty("display", "none", "important");
        }
      });
    // Don't touch body.style.top while the modal/keyboard scroll-lock is
    // active (position:fixed + a negative top offset) — that offset is
    // intentional and resetting it to 0px here is what causes the page to
    // visually jump to the top whenever a modal/table is open.
    var scrollLockActive = document.body && document.body.style.position === "fixed";
    if (!scrollLockActive) {
      if (document.body && document.body.style.top && document.body.style.top !== "0px") {
        document.body.style.setProperty("top", "0px", "important");
      }
      if (document.documentElement.style.top && document.documentElement.style.top !== "0px") {
        document.documentElement.style.setProperty("top", "0px", "important");
      }
    }
  }
  var observer = new MutationObserver(killGoogTranslateBanner);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["style", "class"],
  });
  killGoogTranslateBanner();
  window.addEventListener("load", killGoogTranslateBanner);
  setInterval(killGoogTranslateBanner, 500);
})();
