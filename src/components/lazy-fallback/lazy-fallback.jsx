/* components/lazy-fallback/lazy-fallback.jsx
 * Shown while an on-demand screen (settings, AI tutor, a game ...) is still being loaded, so a slow
 * first open never looks like nothing happened. It waits a moment before appearing, so a screen
 * that loads at once (the usual case, the chunks are warmed in advance) shows no flash at all.
 */

import { useEffect, useState } from "react";
import "./lazy-fallback.css";

export function LazyFallback({ delay = 140 }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  if (!show) return null;
  return (
    <div className="dm-lazy-fallback" role="status" aria-label="Loading">
      <span className="dm-lazy-fallback-spinner" />
    </div>
  );
}
