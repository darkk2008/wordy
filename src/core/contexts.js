/* core/contexts.js
 * React contexts shared across the app.
 */

import { createContext } from "react";

export const HideArticlesContext = createContext(false);
export const StickyFiltersContext = createContext(true);
