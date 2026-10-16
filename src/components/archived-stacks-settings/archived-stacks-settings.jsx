/* components/archived-stacks-settings/archived-stacks-settings.jsx
 * Archived stacks screen.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatedIcon, IconBtn } from "../common/common";
import { ChevronLeft, Gamepad2, MoreOrClose, RotateCcw } from "../icons/icons";
import { SwipeableRow, dmListClickGuard } from "../swipeable-row/swipeable-row";

export function ArchivedStacksSettings({
  onBack,
  archivedStacks,
  onUnarchiveStack,
  onPlayArchivedStack,
  onOpenStack,
}) {
  const list = archivedStacks || [];
  const [menuStackId, setMenuStackId] = useState(null);
  const [closingMenuId, setClosingMenuId] = useState(null);
  const [confirmRestoreStackId, setConfirmRestoreStackId] = useState(null);
  const menuCloseTimerRef = useRef(null);
  const closeStackMenu = useCallback((id) => {
    if (menuCloseTimerRef.current) clearTimeout(menuCloseTimerRef.current);
    setMenuStackId((cur) => (cur === id ? null : cur));
    setClosingMenuId(id);
    menuCloseTimerRef.current = setTimeout(() => {
      setClosingMenuId((cur) => (cur === id ? null : cur));
    }, 160);
  }, []);
  useEffect(
    () => () => {
      if (menuCloseTimerRef.current) clearTimeout(menuCloseTimerRef.current);
    },
    []
  );
  useEffect(() => {
    if (!menuStackId) return;
    const handler = (e) => {
      if (
        e.target.closest &&
        (e.target.closest(".dm-stack-dots") || e.target.closest(".dm-dots-menu"))
      )
        return;
      e.preventDefault();
      e.stopPropagation();
      closeStackMenu(menuStackId);
    };
    const keyHandler = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeStackMenu(menuStackId);
      }
    };
    document.addEventListener("click", handler, true);
    document.addEventListener("keydown", keyHandler, true);
    return () => {
      document.removeEventListener("click", handler, true);
      document.removeEventListener("keydown", keyHandler, true);
    };
  }, [menuStackId, closeStackMenu]);
  const confirmRestoreStack = list.find((s) => s.id === confirmRestoreStackId) || null;
  return (
    <div className="dm-view dm-settings-subview">
      <div className="dm-topbar">
        <IconBtn onClick={onBack}>
          <ChevronLeft size={20} />
        </IconBtn>
        <div className="dm-topbar-title">Archived Stacks</div>
      </div>
      <p className="dm-settings-hint">
        Archived stacks are hidden from Home, Games and Favorites, but nothing is deleted. Tap a
        stack to review its words, or restore it to bring it back to its default place.
      </p>
      {list.length === 0 ? (
        <div className="dm-empty">No archived stacks yet.</div>
      ) : (
        <div className="dm-stack-grid" onClickCapture={dmListClickGuard}>
          {list.map((s) => {
            const menuOpen = menuStackId === s.id || closingMenuId === s.id;
            const leftActions = [
              {
                key: "play",
                label: "Play games",
                tone: "cyan",
                icon: <Gamepad2 size={18} />,
                onClick: () => onPlayArchivedStack && onPlayArchivedStack(s.id),
              },
            ];
            const rightActions = [
              {
                key: "restore",
                label: "Restore",
                tone: "gold",
                icon: <RotateCcw size={18} />,
                onClick: () => setConfirmRestoreStackId(s.id),
              },
            ];
            return (
              <div key={s.id} className="dm-stack-cell dm-stack-cell-visible">
                <div className="dm-stack-cell-inner">
                  <SwipeableRow
                    actions={rightActions}
                    leftActions={leftActions}
                    actionsColumn
                    forceElevated={menuOpen}
                  >
                    <div
                      className={`dm-stack-card ${menuOpen ? "dm-stack-card-menu-open" : ""}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => onOpenStack && onOpenStack(s.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && onOpenStack) onOpenStack(s.id);
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
                      {menuOpen && (
                        <div
                          className={`dm-dots-menu ${menuStackId === s.id ? "" : "dm-dots-menu-closing"}`}
                          onClick={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          {s.words.length > 0 && onPlayArchivedStack && (
                            <button
                              type="button"
                              className="dm-dots-menu-item"
                              onClick={() => {
                                onPlayArchivedStack(s.id);
                                closeStackMenu(s.id);
                              }}
                            >
                              <span className="dm-dots-menu-icon dm-dots-menu-icon-green">
                                <Gamepad2 size={15} />
                              </span>
                              <span className="dm-dots-menu-item-label">Play games</span>
                            </button>
                          )}
                          <button
                            type="button"
                            className="dm-dots-menu-item"
                            onClick={() => {
                              setConfirmRestoreStackId(s.id);
                              closeStackMenu(s.id);
                            }}
                          >
                            <span className="dm-dots-menu-icon dm-dots-menu-icon-gold">
                              <RotateCcw size={15} />
                            </span>
                            <span className="dm-dots-menu-item-label">Restore</span>
                          </button>
                        </div>
                      )}
                      <div className="dm-stack-emoji">
                        <AnimatedIcon id={s.emoji} size={30} />
                      </div>
                      <div className="dm-stack-name">{s.name}</div>
                      <div className="dm-stack-count">
                        {s.words.length}
                        {" word"}
                        {s.words.length === 1 ? "" : "s"}
                      </div>
                    </div>
                  </SwipeableRow>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {confirmRestoreStack && (
        <div className="dm-modal-backdrop" onClick={() => setConfirmRestoreStackId(null)}>
          <div className="dm-modal dm-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dm-confirm-icon dm-confirm-icon-gold">
              <RotateCcw size={24} />
            </div>
            <h3 className="dm-confirm-title">Restore this stack?</h3>
            <p className="dm-confirm-sub">{`"${confirmRestoreStack.name}" will be brought back to Home, Games and Favorites.`}</p>
            <div className="dm-modal-actions">
              <button className="dm-btn-secondary" onClick={() => setConfirmRestoreStackId(null)}>
                Cancel
              </button>
              <button
                className="dm-btn-warning"
                onClick={() => {
                  onUnarchiveStack(confirmRestoreStack.id);
                  setConfirmRestoreStackId(null);
                }}
              >
                <RotateCcw size={16} />
                {" Restore stack"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
