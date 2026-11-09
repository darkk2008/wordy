/* core/form-prompt-setting.js
 * "Translate form cards" (Settings > Guardrails). On: the prompt of a form card is the word's
 * meaning in the person's native language (сжигал). Off: it is the grammar label, untranslated
 * ("Past participle of verbrennen"). Module-level like uiTranslationLangCode, because the
 * form questions are built outside React (games, decks).
 */
export let translateFormPrompts = true;
export function setTranslateFormPrompts(val) {
  translateFormPrompts = val !== false;
}
