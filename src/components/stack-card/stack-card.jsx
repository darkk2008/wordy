/* components/stack-card/stack-card.jsx
 * StackCard: a stack tile on the home screen. StackTile / StackGrid are the shared tile and grid that
 * Home, Archived stacks and Families all use, so a stack looks the same everywhere.
 */

import { resolveIconId } from "../../core/icon-registry";
import { AnimatedIcon } from "../common/common";
import { MoreOrClose, Trash2 } from "../icons/icons";
import { ArchiveIcon, PinIcon, UsersIcon } from "../icons/settings-icons";
import { SwipeableRow } from "../swipeable-row/swipeable-row";

/* ---- Presentation helpers (visual only: derived from the stack's icon and word count) ---- */

/* Which look the Home stack tiles use. "minimal" (flat, typographic) or "cards" (taped flashcards).
   Both are pure CSS in stack-card-v2.css; this is the only switch. */
export const STACK_LOOK = "minimal";

const STACK_TONES = {
  sprout: "green",
  tree: "green",
  family: "green",
  bolt: "gold",
  target: "gold",
  crown: "gold",
  orbit: "gold",
  puzzle: "gold",
  star: "gold",
  book: "violet",
  home: "violet",
  gem: "violet",
  school: "orange",
  nest: "orange",
  food: "red",
  heart: "red",
};
export function stackTone(icon) {
  return STACK_TONES[resolveIconId(icon)] || "cyan";
}
/* how many "cards" peek out beneath the tile: a thicker deck means more words */
export function stackDepth(wordCount) {
  if (wordCount >= 10) return 2;
  if (wordCount >= 1) return 1;
  return 0;
}

/* The inside of a stack tile: cover art, icon jewel, name and meta.
   Normally it reads everything from the stack `s`. Other lists that want the same tile (families)
   pass icon / name / count / unit / extra instead. */
export function StackFace({
  s,
  isPinned,
  familyName,
  icon,
  name,
  count,
  unit,
  extra,
}) {
  const n = count != null ? count : s.words.length;
  const [one, many] = unit || ["word", "words"];
  return (
    <>
      <div className="dm-stack-cover" aria-hidden="true" data-count={n}>
        <span className="dm-stack-art" />
      </div>
      <div className="dm-stack-emoji">
<<<<<<< HEAD
        <AnimatedIcon id={s.emoji} size={28} />
=======
        <AnimatedIcon id={icon != null ? icon : s.emoji} size={28} />
>>>>>>> d73b746 (Fix premium grant and sync, unify stack tiles, new stack picker in Games)
        {isPinned && (
          <span className="dm-stack-pin-icon-badge" title="Pinned">
            <PinIcon size={11} />
          </span>
        )}
      </div>
      <div className="dm-stack-body">
        <div className="dm-stack-name">{name != null ? name : s.name}</div>
        <div className="dm-stack-meta">
          <span className="dm-stack-count">
            <b className="dm-stack-num">{n}</b>
            {n === 1 ? ` ${one}` : ` ${many}`}
          </span>
          {familyName && (
            <span className="dm-stack-family-badge" title={familyName}>
              {familyName}
            </span>
          )}
          {extra}
        </div>
      </div>
    </>
  );
}

/* The tile itself: the card, plus the layers of the "deck" behind it.
   Must sit inside a `.dm-stack-grid.dm-stack-grid-v2` grid (see StackGrid) for the look to apply. */
export function StackTile({
  s,
  isPinned,
  familyName,
  icon,
  name,
  count,
  unit,
  extra,
  className = "",
  children,
  ...rest
}) {
  const n = count != null ? count : s.words.length;
  return (
    <div
      className="dm-stack-deck"
      data-tone={stackTone(icon != null ? icon : s.emoji)}
      data-depth={stackDepth(n)}
    >
      <span className="dm-stack-layer dm-stack-layer-1" aria-hidden="true" />
      <span className="dm-stack-layer dm-stack-layer-2" aria-hidden="true" />
      <div className={`dm-stack-card dm-sc ${className}`} {...rest}>
        {children}
        <StackFace
          s={s}
          isPinned={isPinned}
          familyName={familyName}
          icon={icon}
          name={name}
          count={count}
          unit={unit}
          extra={extra}
        />
      </div>
    </div>
  );
}

<<<<<<< HEAD
// The inside of a stack tile (icon, name, one-line meta) in the classic look. The Archive and Settings
// screens render it, so every stack there looks the same. (Home uses StackTile/StackFace above.)
export function StackCardBody({ iconId, name, countText, isPinned, familyName, extra }) {
  return (
    <>
      <div className="dm-stack-emoji">
        <AnimatedIcon id={iconId} size={30} />
      </div>
      <div className="dm-stack-name">{name}</div>
      <div className="dm-stack-meta">
        <span className="dm-stack-count">{countText}</span>
        {isPinned && (
          <span className="dm-stack-pin-icon-badge" title="Pinned">
            <PinIcon size={11} />
          </span>
        )}
        {familyName && (
          <span className="dm-stack-family-badge" title={familyName}>
            {familyName}
          </span>
        )}
        {extra}
      </div>
    </>
  );
}
export const wordCountText = (n) => `${n} ${n === 1 ? "word" : "words"}`;
=======
/* The grid every list of stack tiles lives in: Home, Archived stacks, Families. */
export function StackGrid({ className = "", children, ...rest }) {
  return (
    <div
      className={`dm-stack-grid dm-stack-grid-v2 ${className}`}
      data-look={STACK_LOOK}
      {...rest}
    >
      {children}
    </div>
  );
}
>>>>>>> d73b746 (Fix premium grant and sync, unify stack tiles, new stack picker in Games)

export function StackCard({
  s,
  isPinned,
  isEntering,
  activeFamily,
  familyName,
  menuStackId,
  closingMenuId,
  setMenuStackId,
  setClosingMenuId,
  closeStackMenu,
  onOpenStack,
  setAssigningStackId,
  onTogglePinStack,
  onToggleFamilyPinStack,
  onRequestDeleteStack,
  onRequestArchiveStack,
  setCardRef,
}) {
  const swipeActions = [
    {
      key: "pin",
      label:
        activeFamily === "all"
          ? s.pinned
            ? "Unpin"
            : "Pin"
          : s.familyPinned
            ? "Unpin from family"
            : "Pin in family",
      tone: "gold",
      active: isPinned,
      icon: <PinIcon size={18} />,
      onClick: () =>
        (activeFamily === "all" ? onTogglePinStack : onToggleFamilyPinStack)(
          s.id,
        ),
    },
    {
      key: "family",
      label: "Add to family",
      tone: "cyan",
      icon: <UsersIcon size={18} />,
      onClick: () => setAssigningStackId(s.id),
    },
  ];
  const leftActions = [
    {
      key: "delete",
      label: "Delete stack",
      tone: "red",
      icon: <Trash2 size={18} />,
      onClick: () => onRequestDeleteStack(s.id),
    },
    {
      key: "archive",
      label: "Archive",
      tone: "cyan",
      icon: <ArchiveIcon size={18} />,
      onClick: () => onRequestArchiveStack(s.id),
    },
  ];
  const menuOpen = menuStackId === s.id || closingMenuId === s.id;
  return (
    <div
      className={`dm-stack-cell dm-stack-cell-visible ${isEntering ? "dm-stack-cell-entering" : ""} ${menuOpen ? "dm-swipe-elevated" : ""}`}
      ref={(node) => setCardRef(s.id, node)}
    >
      <div className="dm-stack-cell-inner">
        <SwipeableRow
          actions={swipeActions}
          leftActions={leftActions}
          actionsColumn
          forceElevated={menuOpen}
        >
          <StackTile
            s={s}
            isPinned={isPinned}
            familyName={familyName}
            className={`${isPinned ? "dm-stack-card-pinned" : ""} ${menuStackId === s.id || closingMenuId === s.id ? "dm-stack-card-menu-open" : ""}`}
            role="button"
            tabIndex={0}
            onClick={() => onOpenStack(s.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onOpenStack(s.id);
            }}
          >
            <button
              type="button"
              className="dm-stack-dots"
              title="Stack options"
              onTouchStart={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                if (menuStackId === s.id) {
                  closeStackMenu(s.id);
                } else {
                  setClosingMenuId(null);
                  setMenuStackId(s.id);
                }
              }}
            >
              <MoreOrClose open={menuStackId === s.id} size={16} />
            </button>
            {(menuStackId === s.id || closingMenuId === s.id) && (
              <div
                className={`dm-dots-menu ${menuStackId === s.id ? "" : "dm-dots-menu-closing"}`}
                onClick={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="dm-dots-menu-item"
                  onClick={() => {
                    setAssigningStackId(s.id);
                    closeStackMenu(s.id);
                  }}
                >
                  <span className="dm-dots-menu-icon">
                    <UsersIcon size={15} />
                  </span>
                  <span className="dm-dots-menu-item-label">Add to family</span>
                </button>
                <button
                  type="button"
                  className="dm-dots-menu-item"
                  onClick={() => {
                    (activeFamily === "all"
                      ? onTogglePinStack
                      : onToggleFamilyPinStack)(s.id);
                    closeStackMenu(s.id);
                  }}
                >
                  <span className="dm-dots-menu-icon dm-dots-menu-icon-gold">
                    <PinIcon size={15} />
                  </span>
                  <span className="dm-dots-menu-item-label">
                    {activeFamily === "all"
                      ? s.pinned
                        ? "Unpin"
                        : "Pin"
                      : s.familyPinned
                        ? "Unpin from family"
                        : "Pin in family"}
                  </span>
                </button>
                <button
                  type="button"
                  className="dm-dots-menu-item"
                  onClick={() => {
                    onRequestArchiveStack(s.id);
                    closeStackMenu(s.id);
                  }}
                >
                  <span className="dm-dots-menu-icon">
                    <ArchiveIcon size={15} />
                  </span>
                  <span className="dm-dots-menu-item-label">Archive</span>
                </button>
                <div className="dm-dots-menu-divider" />
                <button
                  type="button"
                  className="dm-dots-menu-item dm-dots-menu-item-danger"
                  onClick={() => {
                    onRequestDeleteStack(s.id);
                    closeStackMenu(s.id);
                  }}
                >
                  <span className="dm-dots-menu-icon dm-dots-menu-icon-red">
                    <Trash2 size={15} />
                  </span>
                  <span className="dm-dots-menu-item-label">Delete</span>
                </button>
              </div>
            )}
          </StackTile>
        </SwipeableRow>
      </div>
    </div>
  );
}
export const PROMO_TYPE_LABELS = {
  monthly: "Monthly",
  yearly: "Yearly",
  permanent: "Permanent",
  discount: "Discount",
};
export function formatAdminDate(ts) {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleString();
  } catch (e) {
    return "—";
  }
}
