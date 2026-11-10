/* core/ui-language.js
 * The language of the app's own text (menus, buttons, hints) is a setting of its own. It is NOT the
 * native language: the native language is what AI translates words into (and what the filter labels,
 * the seed stacks and the form-card prompts use). Until an interface language is picked, the app text
 * simply follows the native language, which is how it worked before this setting existed.
 */

export const UI_LANG_KEY = "deutschmaster-ui-lang";

/* The picked interface language, or null when none was picked (= follow the native language). */
export function readUiLanguageChoice(validCodes) {
  try {
    const stored = window.localStorage.getItem(UI_LANG_KEY);
    return stored && validCodes.includes(stored) ? stored : null;
  } catch (e) {
    return null;
  }
}

export function saveUiLanguageChoice(code) {
  try {
    if (code) window.localStorage.setItem(UI_LANG_KEY, code);
    else window.localStorage.removeItem(UI_LANG_KEY);
  } catch (e) {}
}

export function resolveUiLanguage(choice, nativeLanguage) {
  return choice || nativeLanguage;
}
