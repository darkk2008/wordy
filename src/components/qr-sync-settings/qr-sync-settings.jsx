/* components/qr-sync-settings/qr-sync-settings.jsx
 * Settings > Sync via QR: send a stack to another device as a QR code, or scan one.
 */

import { useState } from "react";
import { encodeFamilyForQR, encodeStackForQR } from "../../core/sharing-and-export";
import { IconBtn } from "../common/common";
import { CameraIcon, ChevronLeft, ChevronRight, QrCode } from "../icons/icons";
import { QRScanModal, QRSendModal } from "../qr-share/qr-share";

export function QRSyncSettings({ onBack, stacks, onCreateStack, onImportFamily }) {
  const [sending, setSending] = useState(null); // a stack, or "all"
  const [scanning, setScanning] = useState(false);
  const list = (stacks || []).filter((s) => s && s.words);
  return (
    <div className="dm-view dm-settings-subview">
      <div className="dm-topbar">
        <IconBtn onClick={onBack}>
          <ChevronLeft size={20} />
        </IconBtn>
        <div className="dm-topbar-title">Sync via QR</div>
      </div>
      <div className="dm-header">
        <div>
          <div className="dm-eyebrow">DEVICE TO DEVICE</div>
          <h1 className="dm-h1">Sync via QR</h1>
        </div>
      </div>
      <p className="dm-settings-hint">
        Move stacks to another phone or computer without an account. Show a code on one device and
        scan it with the other. Big stacks are sent as several codes in a row.
      </p>

      <div className="dm-settings-section-label">Receive on this device</div>
      <button type="button" className="dm-btn-primary dm-qrsync-scan" onClick={() => setScanning(true)}>
        <CameraIcon size={18} />
        {" Scan a code"}
      </button>

      <div className="dm-settings-section-label">Send to another device</div>
      {list.length === 0 && (
        <p className="dm-settings-hint">You have no stacks yet. Create one on Home first.</p>
      )}
      <div className="dm-qrsync-list">
        {list.length > 1 && (
          <button type="button" className="dm-qrsync-row" onClick={() => setSending("all")}>
            <span className="dm-qrsync-icon">
              <QrCode size={18} />
            </span>
            <span className="dm-qrsync-text">
              <span className="dm-qrsync-name">All stacks</span>
              <span className="dm-qrsync-sub">
                {`${list.length} stacks, ${list.reduce((n, s) => n + s.words.length, 0)} words`}
              </span>
            </span>
            <ChevronRight size={18} />
          </button>
        )}
        {list.map((s) => (
          <button key={s.id} type="button" className="dm-qrsync-row" onClick={() => setSending(s)}>
            <span className="dm-qrsync-icon">
              <QrCode size={18} />
            </span>
            <span className="dm-qrsync-text">
              <span className="dm-qrsync-name">{s.name}</span>
              <span className="dm-qrsync-sub">{`${s.words.length} word${s.words.length === 1 ? "" : "s"}`}</span>
            </span>
            <ChevronRight size={18} />
          </button>
        ))}
      </div>

      {sending && sending !== "all" && (
        <QRSendModal
          title="Send stack"
          name={sending.name}
          load={() => encodeStackForQR(sending)}
          onClose={() => setSending(null)}
        />
      )}
      {sending === "all" && (
        <QRSendModal
          title="Send all stacks"
          name="All stacks"
          load={() => encodeFamilyForQR("All stacks", list, "📚")}
          onClose={() => setSending(null)}
        />
      )}
      {scanning && (
        <QRScanModal
          onImport={(imported) =>
            imported && imported.__isFamily ? onImportFamily(imported) : onCreateStack(imported)
          }
          onClose={() => setScanning(false)}
        />
      )}
    </div>
  );
}
