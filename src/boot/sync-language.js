/* Syncs <html lang>/dir with the saved native language before the app mounts (avoids RTL flash). */
(function () {
  // Sync <html lang>/dir to the saved native language before the app mounts,
  // so screen readers/fonts get the right language immediately and RTL
  // languages (e.g. Arabic) don't flash as left-to-right on first paint.
  try {
    var savedLang = window.localStorage.getItem("deutschmaster-native-lang");
    if (savedLang) {
      document.documentElement.lang = savedLang;
      document.documentElement.dir = savedLang === "ar" ? "rtl" : "ltr";
    }
  } catch (e) {}
})();
