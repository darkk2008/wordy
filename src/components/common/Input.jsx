/* components/common/Input.jsx
 * Drop-in <input>. Text-like inputs get autocorrect, autocapitalize, spellcheck and autocomplete
 * switched off by default (the app is a vocabulary trainer, so the browser's "helpful" fixes would
 * corrupt words). Checkbox, radio, range and file inputs are left untouched.
 *
 * This used to be a global patch of React.createElement; now it is a normal component.
 * Any prop you pass wins over the defaults.
 */

const TEXT_DEFAULTS = {
  autoCapitalize: "none",
  autoCorrect: "off",
  spellCheck: false,
  autoComplete: "off",
};
const PLAIN_TYPES = ["checkbox", "radio", "range", "file"];

export function Input(props) {
  const isPlain = PLAIN_TYPES.includes(props.type);
  return <input {...(isPlain ? null : TEXT_DEFAULTS)} {...props} />;
}
