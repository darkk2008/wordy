/* components/stack-card/stack-card.jsx
 * StackCard: a stack tile on the home screen.
 */

import { AnimatedIcon } from "../common/common";
import { MoreOrClose, Trash2 } from "../icons/icons";
import { ArchiveIcon, PinIcon, UsersIcon } from "../icons/settings-icons";
import { SwipeableRow } from "../swipeable-row/swipeable-row";

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
      onClick: () => (activeFamily === "all" ? onTogglePinStack : onToggleFamilyPinStack)(s.id),
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
          <div
            className={`dm-stack-card ${isPinned ? "dm-stack-card-pinned" : ""} ${menuStackId === s.id || closingMenuId === s.id ? "dm-stack-card-menu-open" : ""}`}
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
                    (activeFamily === "all" ? onTogglePinStack : onToggleFamilyPinStack)(s.id);
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
            <div className="dm-stack-emoji">
              <AnimatedIcon id={s.emoji} size={30} />
            </div>
            <div className="dm-stack-name">{s.name}</div>
            <div className="dm-stack-meta">
              <span className="dm-stack-count">
                {`${s.words.length} ${s.words.length === 1 ? "word" : "words"}`}
              </span>
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
            </div>
          </div>
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
  gems: "Gems",
};
export function formatAdminDate(ts) {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleString();
  } catch (e) {
    return "—";
  }
}
