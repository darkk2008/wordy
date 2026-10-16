/* assets/inline-images.js
 * App images. They used to be base64 strings inside the JavaScript bundle (about 110 KB that every
 * visitor had to download before anything appeared); now they are normal files that load on demand
 * and are cached by the service worker.
 */
import APP_LOGO_SRC from "./app-logo.png";
import ONBOARDING_LOGO_SRC from "./onboarding-logo.jpg";

export { APP_LOGO_SRC, ONBOARDING_LOGO_SRC };
