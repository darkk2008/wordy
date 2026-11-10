/* core/form-prompt-setting.js
 * "Translate form cards" (Settings > Guardrails). On: the prompt of a form card is the word's
 * meaning in the person's native language (сжигал). Off: it is the grammar label, untranslated
 * ("Past participle of verbrennen"). Module-level like uiTranslationLangCode, because the
 * form questions are built outside React (games, decks).
 */
export let translateFormPrompts = true;
/* The language of the word meanings (w.en): the person's NATIVE language. The prompt is built from
 * that meaning (сжигал), so it must not follow the interface language, which can be a different one. */
export let nativeFormLangCode = "en";
export function setNativeFormLangCode(code) {
  nativeFormLangCode = code || "en";
}
export function setTranslateFormPrompts(val) {
  translateFormPrompts = val !== false;
}
