/* components/families-settings/families-settings.jsx
 * Families (stack groups) management screen.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FAMILY_ICON_IDS, parseFamilyImportText } from "../../core/icon-registry";
import {
  buildFamilyShareHTML,
  downloadTextAsFile,
  safeFileBase,
} from "../../core/sharing-and-export";
import { FREE_FAMILY_LIMIT } from "../../services/premium-status";
import { AnimatedIcon, IconBtn } from "../common/common";
import { Input } from "../common/Input";
import {
  Check,
  ChevronLeft,
  Gamepad2,
  MoreOrClose,
  Pencil,
  Plus,
  QrCode,
  Share2,
  Trash2,
  Upload,
  X,
} from "../icons/icons";
import { FamilyQRShareModal, QR_SHARING_ENABLED } from "../qr-share/qr-share";

export function FamiliesSettings({
  onBack,
  families,
  stacks,
  onCreateFamily,
  onRenameFamily,
  onDeleteFamily,
  onSetFamilyEmoji,
  onImportFamily,
  onOpenStack,
  onPlayFamilyGames,
  isPremium,
  onOpenPremium,
}) {
  const familyLimitReached = !isPremium && families.length >= FREE_FAMILY_LIMIT;
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [newEmoji, setNewEmoji] = useState(FAMILY_ICON_IDS[0]);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmoji, setEditEmoji] = useState(FAMILY_ICON_IDS[0]);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [qrFamilyId, setQrFamilyId] = useState(null);
  const [importError, setImportError] = useState(null);
  const [viewingFamilyId, setViewingFamilyId] = useState(null);
  const [menuFamilyId, setMenuFamilyId] = useState(null);
  const [closingMenuId, setClosingMenuId] = useState(null);
  const menuCloseTimerRef = useRef(null);
  const fileInputRef = useRef(null);
  const closeFamilyMenu = useCallback((id) => {
    if (menuCloseTimerRef.current) clearTimeout(menuCloseTimerRef.current);
    setMenuFamilyId((cur) => (cur === id ? null : cur));
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
    if (!menuFamilyId) return;
    const handler = (e) => {
      if (
        e.target.closest &&
        (e.target.closest(".dm-stack-dots") || e.target.closest(".dm-dots-menu"))
      )
        return;
      e.preventDefault();
      e.stopPropagation();
      closeFamilyMenu(menuFamilyId);
    };
    const keyHandler = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeFamilyMenu(menuFamilyId);
      }
    };
    document.addEventListener("click", handler, true);
    document.addEventListener("keydown", keyHandler, true);
    return () => {
      document.removeEventListener("click", handler, true);
      document.removeEventListener("keydown", keyHandler, true);
    };
  }, [menuFamilyId, closeFamilyMenu]);
  const confirmDeleteFamily = families.find((f) => f.id === confirmDeleteId);
  const qrFamily = families.find((f) => f.id === qrFamilyId);
  const editingFamily = families.find((f) => f.id === editingId);
  const viewingFamily = families.find((f) => f.id === viewingFamilyId);
  const shareFamilyHTML = async (f) => {
    const famStacks = (stacks || []).filter((s) => s.familyId === f.id);
    const html = buildFamilyShareHTML(f.name, f.emoji, famStacks);
    const fileName = `${safeFileBase(f.name)}_family.html`;
    let file = null;
    try {
      file = new File([html], fileName, {
        type: "text/html",
      });
    } catch (err) {
      file = null;
    }
    if (
      file &&
      navigator.canShare &&
      navigator.canShare({
        files: [file],
      })
    ) {
      try {
        await navigator.share({
          files: [file],
          title: f.name,
          text: `Vocabulary family: ${f.name}`,
        });
        return;
      } catch (err) {
        if (err && err.name === "AbortError") return;
      }
    }
    downloadTextAsFile(fileName, html, "text/html");
  };
  const openImportPicker = () => {
    if (familyLimitReached) {
      onOpenPremium && onOpenPremium();
      return;
    }
    setImportError(null);
    if (fileInputRef.current) fileInputRef.current.click();
  };
  const handleImportFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (e.target) e.target.value = "";
    if (!file) return;
    try {
      if (file.size > 8 * 1024 * 1024) throw new Error("This file is too large to import.");
      const text = await file.text();
      const imported = parseFamilyImportText(text);
      setImportError(null);
      if (onImportFamily) onImportFamily(imported);
    } catch (err) {
      setImportError(err && err.message ? err.message : "Could not import this file.");
    }
  };
  const familyStats = useMemo(() => {
    const now = Date.now();
    const map = {};
    families.forEach((f) => {
      const famStacks = (stacks || []).filter((s) => s.familyId === f.id);
      let words = 0,
        mastered = 0,
        due = 0;
      famStacks.forEach((s) =>
        s.words.forEach((w) => {
          words++;
          if (w.srs && w.srs.level >= 5) mastered++;
          if (w.srs && w.srs.next <= now) due++;
        })
      );
      map[f.id] = {
        stackCount: famStacks.length,
        words,
        mastered,
        due,
        progress: words ? Math.round((mastered / words) * 100) : 0,
      };
    });
    return map;
  }, [families, stacks]);
  if (viewingFamily) {
    const vst = familyStats[viewingFamily.id] || {
      stackCount: 0,
      words: 0,
      mastered: 0,
      due: 0,
      progress: 0,
    };
    const famStacks = (stacks || []).filter((s) => s.familyId === viewingFamily.id);
    return (
      <div className="dm-view dm-settings-subview">
        <div className="dm-topbar">
          <IconBtn onClick={() => setViewingFamilyId(null)}>
            <ChevronLeft size={20} />
          </IconBtn>
          <div className="dm-topbar-title">{viewingFamily.name}</div>
          {QR_SHARING_ENABLED && vst.stackCount > 0 && (
            <IconBtn title="Share family via QR" onClick={() => setQrFamilyId(viewingFamily.id)}>
              <QrCode size={20} />
            </IconBtn>
          )}
          {vst.stackCount > 0 && (
            <IconBtn
              title="Share family as file (.html)"
              onClick={() => shareFamilyHTML(viewingFamily)}
            >
              <Share2 size={20} />
            </IconBtn>
          )}
        </div>
        <div className="dm-family-settings-stats dm-family-view-stats">
          <span>
            {vst.stackCount}
            {" stack"}
            {vst.stackCount === 1 ? "" : "s"}
          </span>
          <span className="dm-family-settings-dot" />
          <span>
            {vst.words}
            {" word"}
            {vst.words === 1 ? "" : "s"}
          </span>
          <span className="dm-family-settings-dot" />
          <span>{vst.progress}% mastered</span>
          {vst.due > 0 && (
            <span className="dm-family-settings-due">
              {vst.due}
              {" due"}
            </span>
          )}
        </div>
        {famStacks.length === 0 ? (
          <div className="dm-empty">No stacks in this family yet.</div>
        ) : (
          <div className="dm-stack-grid">
            {famStacks.map((s) => (
              <div
                key={s.id}
                className="dm-stack-card"
                role="button"
                tabIndex={0}
                onClick={() => onOpenStack && onOpenStack(s.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && onOpenStack) onOpenStack(s.id);
                }}
              >
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
            ))}
          </div>
        )}
        {qrFamily && (
          <FamilyQRShareModal
            familyName={qrFamily.name}
            familyEmoji={qrFamily.emoji}
            stacks={(stacks || []).filter((s) => s.familyId === qrFamily.id)}
            onClose={() => setQrFamilyId(null)}
          />
        )}
      </div>
    );
  }
  return (
    <div className="dm-view dm-settings-subview">
      <div className="dm-topbar">
        <IconBtn onClick={onBack}>
          <ChevronLeft size={20} />
        </IconBtn>
        <div className="dm-topbar-title">Families</div>
        <IconBtn title="Import family from file" onClick={openImportPicker}>
          <Upload size={20} />
        </IconBtn>
        <IconBtn
          title={familyLimitReached ? "Upgrade to Premium for more families" : "New family"}
          onClick={() => (familyLimitReached ? onOpenPremium && onOpenPremium() : setAdding(true))}
        >
          <Plus size={20} />
        </IconBtn>
      </div>
      <Input
        ref={fileInputRef}
        type="file"
        accept=".json,.html,application/json,text/html"
        style={{
          display: "none",
        }}
        onChange={handleImportFile}
      />
      <p className="dm-settings-hint">
        Group your stacks into families, then filter by family on the Home screen. Tap a family to
        see its stacks. Share a family via QR, or download it as a file when a QR code isn't
        practical.
      </p>
      {importError && <p className="dm-settings-hint dm-import-error">{importError}</p>}
      {families.length === 0 && (
        <div className="dm-empty">No families yet. Tap + to create one.</div>
      )}
      <div className="dm-stack-grid">
        {families.map((f) => {
          const st = familyStats[f.id] || {
            stackCount: 0,
            words: 0,
            mastered: 0,
            due: 0,
            progress: 0,
          };
          const menuOpen = menuFamilyId === f.id || closingMenuId === f.id;
          return (
            <div
              key={f.id}
              className={`dm-stack-card dm-family-grid-card ${menuOpen ? "dm-family-grid-card-menu-open" : ""}`}
              role="button"
              tabIndex={0}
              onClick={() => setViewingFamilyId(f.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setViewingFamilyId(f.id);
              }}
            >
              <button
                type="button"
                className="dm-stack-dots"
                title="Family options"
                onClick={(e) => {
                  e.stopPropagation();
                  if (menuFamilyId === f.id) {
                    closeFamilyMenu(f.id);
                  } else {
                    setClosingMenuId(null);
                    setMenuFamilyId(f.id);
                  }
                }}
              >
                <MoreOrClose open={menuFamilyId === f.id} size={16} />
              </button>
              {(menuFamilyId === f.id || closingMenuId === f.id) && (
                <div
                  className={`dm-dots-menu ${menuFamilyId === f.id ? "" : "dm-dots-menu-closing"}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {st.words > 0 && onPlayFamilyGames && (
                    <button
                      type="button"
                      className="dm-dots-menu-item"
                      onClick={() => {
                        onPlayFamilyGames(f.id);
                        closeFamilyMenu(f.id);
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
                      setEditingId(f.id);
                      setEditName(f.name);
                      setEditEmoji(f.emoji || "family");
                      closeFamilyMenu(f.id);
                    }}
                  >
                    <span className="dm-dots-menu-icon">
                      <Pencil size={15} />
                    </span>
                    <span className="dm-dots-menu-item-label">Rename</span>
                  </button>
                  {QR_SHARING_ENABLED && st.stackCount > 0 && (
                    <button
                      type="button"
                      className="dm-dots-menu-item"
                      onClick={() => {
                        setQrFamilyId(f.id);
                        closeFamilyMenu(f.id);
                      }}
                    >
                      <span className="dm-dots-menu-icon">
                        <QrCode size={15} />
                      </span>
                      <span className="dm-dots-menu-item-label">Share via QR</span>
                    </button>
                  )}
                  {st.stackCount > 0 && (
                    <button
                      type="button"
                      className="dm-dots-menu-item"
                      onClick={() => {
                        shareFamilyHTML(f);
                        closeFamilyMenu(f.id);
                      }}
                    >
                      <span className="dm-dots-menu-icon">
                        <Share2 size={15} />
                      </span>
                      <span className="dm-dots-menu-item-label">Share as file</span>
                    </button>
                  )}
                  <div className="dm-dots-menu-divider" />
                  <button
                    type="button"
                    className="dm-dots-menu-item dm-dots-menu-item-danger"
                    onClick={() => {
                      setConfirmDeleteId(f.id);
                      closeFamilyMenu(f.id);
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
                <AnimatedIcon id={f.emoji || "family"} size={30} />
              </div>
              <div className="dm-stack-name">{f.name}</div>
              <div className="dm-stack-count">
                {st.stackCount}
                {" stack"}
                {st.stackCount === 1 ? "" : "s"}
              </div>
              {st.due > 0 && (
                <div className="dm-stack-family-badge dm-family-due-badge" title={`${st.due} due`}>
                  {st.due}
                  {" due"}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {adding && (
        <div className="dm-modal-backdrop" onClick={() => setAdding(false)}>
          <div className="dm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dm-modal-head">
              <h3>New family</h3>
              <IconBtn onClick={() => setAdding(false)}>
                <X size={18} />
              </IconBtn>
            </div>
            <label className="dm-label">Name</label>
            <Input
              className="dm-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Travel words"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim()) {
                  onCreateFamily(name.trim(), newEmoji);
                  setName("");
                  setNewEmoji(FAMILY_ICON_IDS[0]);
                  setAdding(false);
                } else if (e.key === "Escape") {
                  setAdding(false);
                }
              }}
            />
            <label className="dm-label">Icon</label>
            <div className="dm-emoji-row">
              {FAMILY_ICON_IDS.map((em) => (
                <button
                  key={em}
                  type="button"
                  className={`dm-emoji-pick ${newEmoji === em ? "dm-emoji-pick-active" : ""}`}
                  onClick={() => setNewEmoji(em)}
                >
                  <AnimatedIcon id={em} size={24} />
                </button>
              ))}
            </div>
            <div className="dm-modal-actions">
              <button
                className="dm-btn-primary"
                disabled={!name.trim()}
                onClick={() => {
                  onCreateFamily(name.trim(), newEmoji);
                  setName("");
                  setNewEmoji(FAMILY_ICON_IDS[0]);
                  setAdding(false);
                }}
              >
                <Check size={16} />
                {" Create"}
              </button>
            </div>
          </div>
        </div>
      )}
      {editingFamily && (
        <div className="dm-modal-backdrop" onClick={() => setEditingId(null)}>
          <div className="dm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dm-modal-head">
              <h3>Rename family</h3>
              <IconBtn onClick={() => setEditingId(null)}>
                <X size={18} />
              </IconBtn>
            </div>
            <label className="dm-label">Name</label>
            <Input
              className="dm-input"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              autoFocus
              placeholder="Family name"
              onKeyDown={(e) => {
                if (e.key === "Enter" && editName.trim()) {
                  if (editName.trim()) onRenameFamily(editingFamily.id, editName.trim());
                  if (onSetFamilyEmoji) onSetFamilyEmoji(editingFamily.id, editEmoji);
                  setEditingId(null);
                } else if (e.key === "Escape") {
                  setEditingId(null);
                }
              }}
            />
            <label className="dm-label">Icon</label>
            <div className="dm-emoji-row">
              {FAMILY_ICON_IDS.map((em) => (
                <button
                  key={em}
                  type="button"
                  className={`dm-emoji-pick ${editEmoji === em ? "dm-emoji-pick-active" : ""}`}
                  onClick={() => setEditEmoji(em)}
                >
                  <AnimatedIcon id={em} size={24} />
                </button>
              ))}
            </div>
            <div className="dm-modal-actions">
              <button
                className="dm-btn-primary"
                disabled={!editName.trim()}
                onClick={() => {
                  if (editName.trim()) onRenameFamily(editingFamily.id, editName.trim());
                  if (onSetFamilyEmoji) onSetFamilyEmoji(editingFamily.id, editEmoji);
                  setEditingId(null);
                }}
              >
                <Check size={16} />
                {" Save"}
              </button>
            </div>
          </div>
        </div>
      )}
      {confirmDeleteFamily && (
        <div className="dm-modal-backdrop" onClick={() => setConfirmDeleteId(null)}>
          <div className="dm-modal dm-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dm-confirm-icon">
              <Trash2 size={24} />
            </div>
            <h3 className="dm-confirm-title">Delete this family?</h3>
            <p className="dm-confirm-sub">{`"${confirmDeleteFamily.name}" will be removed. Stacks in it won't be deleted, they'll just be unassigned.`}</p>
            <div className="dm-modal-actions">
              <button className="dm-btn-secondary" onClick={() => setConfirmDeleteId(null)}>
                Cancel
              </button>
              <button
                className="dm-btn-danger"
                onClick={() => {
                  onDeleteFamily(confirmDeleteFamily.id);
                  setConfirmDeleteId(null);
                }}
              >
                <Trash2 size={16} />
                {" Delete family"}
              </button>
            </div>
          </div>
        </div>
      )}
      {qrFamily && (
        <FamilyQRShareModal
          familyName={qrFamily.name}
          familyEmoji={qrFamily.emoji}
          stacks={(stacks || []).filter((s) => s.familyId === qrFamily.id)}
          onClose={() => setQrFamilyId(null)}
        />
      )}
    </div>
  );
}
