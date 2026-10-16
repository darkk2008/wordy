/* components/data-settings/data-settings.jsx
 * Backup, import/export and reset settings.
 */

import { useRef, useState } from "react";
import { todayStr } from "../../core/constants";
import { IconBtn } from "../common/common";
import { Input } from "../common/Input";
import { ChevronLeft, Download, Trash2, Upload } from "../icons/icons";

export function DataSettings({
  onBack,
  stacks,
  families,
  streak,
  bestStreak,
  todayReviews,
  onImportAll,
  onResetAll,
}) {
  const [importError, setImportError] = useState(null);
  const [importOk, setImportOk] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileInputRef = useRef(null);
  const totalWords = (stacks || []).reduce((s, st) => s + st.words.length, 0);
  const exportAll = () => {
    const payload = {
      stacks: stacks || [],
      families: families || [],
      streak: streak || 1,
      bestStreak: bestStreak || streak || 1,
      lastActive: todayStr(),
      todayReviews: {
        date: todayStr(),
        count: todayReviews || 0,
      },
    };
    const content = JSON.stringify(payload, null, 2);
    const blob = new Blob([content], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wwordy-backup-${todayStr()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1e3);
  };
  const openImportPicker = () => {
    setImportError(null);
    setImportOk(null);
    fileInputRef.current && fileInputRef.current.click();
  };
  const handleImportFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (e.target) e.target.value = "";
    if (!file) return;
    try {
      if (file.size > 8 * 1024 * 1024) throw new Error("This file is too large to import.");
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data || !Array.isArray(data.stacks))
        throw new Error("This file doesn't look like a wwordy backup.");
      setImportError(null);
      onImportAll(data);
      setImportOk(
        `Restored ${data.stacks.length} stack${data.stacks.length === 1 ? "" : "s"} and ${(data.families || []).length} famil${(data.families || []).length === 1 ? "y" : "ies"}.`
      );
    } catch (err) {
      setImportOk(null);
      setImportError(err && err.message ? err.message : "Could not read this file.");
    }
  };
  return (
    <div className="dm-view dm-settings-subview">
      <div className="dm-topbar">
        <IconBtn onClick={onBack}>
          <ChevronLeft size={20} />
        </IconBtn>
        <div className="dm-topbar-title">{"Data & Backup"}</div>
      </div>
      <Input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        style={{
          display: "none",
        }}
        onChange={handleImportFile}
      />
      <p className="dm-settings-hint">
        Everything lives on this device. Export a backup to keep it safe, or move it to another
        phone.
      </p>
      <div className="dm-settings-row">
        <div>
          <div className="dm-settings-row-title">Export all data</div>
          <div className="dm-settings-row-sub">{`${(stacks || []).length} stacks, ${(families || []).length} families, ${totalWords} words`}</div>
        </div>
        <button type="button" className="dm-icon-action-btn" onClick={exportAll}>
          <Download size={18} />
          {" Export"}
        </button>
      </div>
      <div className="dm-settings-row">
        <div>
          <div className="dm-settings-row-title">Import from backup</div>
          <div className="dm-settings-row-sub">
            Replaces everything currently in the app with the file's contents.
          </div>
        </div>
        <button type="button" className="dm-icon-action-btn" onClick={openImportPicker}>
          <Upload size={18} />
          {" Import"}
        </button>
      </div>
      {importOk && <p className="dm-settings-hint dm-import-ok">{importOk}</p>}
      {importError && <p className="dm-settings-hint dm-import-error">{importError}</p>}
      <div className="dm-settings-row dm-settings-row-danger">
        <div>
          <div className="dm-settings-row-title">Reset all data</div>
          <div className="dm-settings-row-sub">
            Deletes every stack, family, and streak. This can't be undone.
          </div>
        </div>
        <button
          type="button"
          className="dm-icon-action-btn dm-icon-action-btn-danger"
          onClick={() => setConfirmReset(true)}
        >
          <Trash2 size={18} />
          {" Reset"}
        </button>
      </div>
      {confirmReset && (
        <div className="dm-modal-backdrop" onClick={() => setConfirmReset(false)}>
          <div className="dm-modal dm-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dm-confirm-icon">
              <Trash2 size={24} />
            </div>
            <h3 className="dm-confirm-title">Reset all data?</h3>
            <p className="dm-confirm-sub">
              All stacks, families, words and your streak will be permanently deleted. Consider
              exporting a backup first.
            </p>
            <div className="dm-modal-actions">
              <button className="dm-btn-secondary" onClick={() => setConfirmReset(false)}>
                Cancel
              </button>
              <button
                className="dm-btn-danger"
                onClick={() => {
                  onResetAll();
                  setConfirmReset(false);
                }}
              >
                <Trash2 size={16} />
                {" Reset everything"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
