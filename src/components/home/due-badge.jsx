/* components/home/due-badge.jsx
 * The "words due for review" row on Home: one slim line, a small gold dot, the count and a way in.
 * It renders nothing when no word is due. The whole row is one button.
 */
import { ChevronRight } from "../icons/icons";

export function DueBadge({ count, onClick }) {
  const n = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  if (n <= 0) return null;
  const text = `${n} word${n === 1 ? "" : "s"} due`;
  return (
    <button type="button" className="dm-due" onClick={onClick} aria-label={`Review: ${text}`}>
      <span className="dm-due-dot" aria-hidden="true" />
      <span className="dm-due-text">{text}</span>
      <span className="dm-due-go" aria-hidden="true">
        Review now
        <ChevronRight size={16} />
      </span>
    </button>
  );
}
