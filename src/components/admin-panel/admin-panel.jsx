/* components/admin-panel/admin-panel.jsx
 * Admin panel: stats, promo codes, devices.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { copyTextToClipboard } from "../../core/sharing-and-export";
import {
  adminCreatePromoCode,
  adminDeletePromoCode,
  adminPromoRequest,
  fetchDevicesCount,
  getAdminSecret,
  isPromoCodeExhausted,
  isPromoCodeExpired,
  setAdminSecret,
} from "../../services/admin-promo";
import { fetchOnlineCount, getAnalyticsSnapshot } from "../../services/analytics-presence";
import { grantPremium, loadPremiumStatus, revokePremium } from "../../services/premium-status";
import { IconBtn } from "../common/common";
import { Input } from "../common/Input";
import { Check, ChevronLeft, Eye, Sparkles, Trash2, X } from "../icons/icons";
import { BarChartIcon, CrownIcon, LockIcon, TagIcon, UsersIcon } from "../icons/settings-icons";
import { PROMO_TYPE_LABELS, formatAdminDate } from "../stack-card/stack-card";

function AdminStatCard({ icon, label, value, sub, tone }) {
  return (
    <div className={`dm-admin-stat-card ${tone ? `dm-admin-stat-card-${tone}` : ""}`}>
      <div className="dm-admin-stat-icon">{icon}</div>
      <div className="dm-admin-stat-body">
        <div className="dm-admin-stat-value">{value}</div>
        <div className="dm-admin-stat-label">
          {label}
          {tone === "online" && <span className="dm-admin-live-dot" />}
        </div>
        {sub && <div className="dm-admin-stat-sub">{sub}</div>}
      </div>
    </div>
  );
}
function AdminSectionHead({ icon, children }) {
  return (
    <div className="dm-admin-section-head">
      <span className="dm-admin-section-icon">{icon}</span>
      <div className="dm-settings-section-label">{children}</div>
    </div>
  );
}
const ADMIN_TABS = [
  {
    id: "overview",
    label: "Overview",
  },
  {
    id: "promo",
    label: "Promo codes",
  },
  {
    id: "premium",
    label: "Premium",
  },
];
// Top bar of the admin page: same glass dock as the stack screen, with a clear way back to the site.
function AdminPageBar({ onBack }) {
  return (
    <div className="dm-admin-page-bar">
      <IconBtn title="Back to site" onClick={onBack}>
        <ChevronLeft size={20} />
      </IconBtn>
      <button type="button" className="dm-admin-backsite" onClick={onBack}>
        Back to site
      </button>
      <span className="dm-admin-page-tag">Admin</span>
    </div>
  );
}

// The admin page. Nothing is shown until the admin key has been accepted by the server.
export function AdminPage({ onClose }) {
  const [authed, setAuthed] = useState(false);
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const unlock = async (e) => {
    e.preventDefault();
    if (!key.trim() || busy) return;
    setBusy(true);
    setError("");
    setAdminSecret(key.trim());
    const result = await adminPromoRequest("list");
    setBusy(false);
    if (result.ok) {
      setAuthed(true);
      return;
    }
    setAdminSecret("");
    setError(result.unauthorized ? "That admin key was not accepted." : result.message || "Couldn't check the key.");
  };
  if (authed) return <AdminPanel asPage onClose={onClose} />;
  return (
    <div className="dm-view dm-admin-page notranslate" translate="no">
      <AdminPageBar onBack={onClose} />
      <form className="dm-admin-gate" onSubmit={unlock}>
        <div className="dm-admin-head-icon">
          <LockIcon size={16} />
        </div>
        <h3>Admin access</h3>
        <p className="dm-admin-head-sub">Enter the admin key to continue.</p>
        <input
          id="dm-admin-key"
          className="dm-admin-gate-input"
          type="password"
          autoComplete="off"
          placeholder="Admin key"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          autoFocus
        />
        {error && <div className="dm-admin-gate-error">{error}</div>}
        <button type="submit" className="dm-btn-primary dm-admin-gate-btn" disabled={busy || !key.trim()}>
          {busy ? "Checking…" : "Unlock"}
        </button>
      </form>
    </div>
  );
}

export function AdminPanel({ onClose, stacks, families, streak, asPage }) {
  const ADMIN_TAB_ICONS = {
    overview: BarChartIcon,
    promo: TagIcon,
    premium: CrownIcon,
  };
  const [tab, setTab] = useState("overview");
  const [codes, setCodes] = useState([]);
  const [codesLoading, setCodesLoading] = useState(true);
  const [codesError, setCodesError] = useState("");
  const [adminSecretInput, setAdminSecretInput] = useState(() => getAdminSecret());
  const [premium, setPremium] = useState(() => loadPremiumStatus());
  const [newType, setNewType] = useState("monthly");
  const [copiedCode, setCopiedCode] = useState(null);
  const [copyFailedCode, setCopyFailedCode] = useState(null);
  const [analytics, setAnalytics] = useState(() => getAnalyticsSnapshot());
  const [onlineCount, setOnlineCount] = useState(null);
  const [devicesCount, setDevicesCount] = useState(null);
  const copyTimerRef = useRef(null);
  const codeInputRefs = useRef({});
  useEffect(
    () => () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    },
    []
  );
  useEffect(() => {
    const id = window.setInterval(() => setAnalytics(getAnalyticsSnapshot()), 3e3);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => {
    let cancelled = false;
    const poll = () => {
      fetchOnlineCount().then((n) => {
        if (!cancelled) setOnlineCount(n);
      });
    };
    poll();
    const id = window.setInterval(poll, 1e4);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);
  useEffect(() => {
    let cancelled = false;
    const poll = () => {
      fetchDevicesCount().then((n) => {
        if (!cancelled) setDevicesCount(n);
      });
    };
    poll();
    const id = window.setInterval(poll, 1e4);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);
  const refreshCodes = useCallback(async () => {
    setCodesLoading(true);
    const result = await adminPromoRequest("list");
    setCodesLoading(false);
    if (result.ok) {
      setCodes(result.codes);
      setCodesError("");
    } else {
      setCodesError(result.message || "Couldn't load promo codes.");
    }
  }, []);
  useEffect(() => {
    refreshCodes();
  }, [refreshCodes]);
  const usedCodesCount = codes.filter((c) => c.used).length;
  const handleSaveAdminSecret = () => {
    setAdminSecret(adminSecretInput.trim());
    refreshCodes();
  };
  const handleGenerate = async () => {
    const result = await adminCreatePromoCode(newType);
    if (!result.ok) {
      setCodesError(result.message || "Couldn't create the code.");
      return;
    }
    refreshCodes();
  };
  const handleDelete = async (code) => {
    const result = await adminDeletePromoCode(code);
    if (!result.ok) {
      setCodesError(result.message || "Couldn't delete the code.");
      return;
    }
    refreshCodes();
  };
  const handleCopy = async (code) => {
    const ok = await copyTextToClipboard(code);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    if (ok) {
      setCopiedCode(code);
      setCopyFailedCode(null);
    } else {
      setCopiedCode(null);
      setCopyFailedCode(code);
      const el = codeInputRefs.current[code];
      if (el) {
        el.focus();
        el.select();
      }
    }
    copyTimerRef.current = setTimeout(() => {
      setCopiedCode(null);
      setCopyFailedCode(null);
    }, 2200);
  };
  const handleGrantPremium = (type) => {
    setPremium(grantPremium(type));
    setAnalytics(getAnalyticsSnapshot());
  };
  const handleRevokePremium = () => setPremium(revokePremium());
  const overviewTab = (
    <>
      <div className="dm-admin-stat-grid">
        <AdminStatCard
          icon={<UsersIcon size={17} />}
          tone="online"
          label="Users online now"
          value={onlineCount === null ? "—" : String(onlineCount)}
          sub={onlineCount === null ? "checking presence service…" : "across all devices, live"}
        />
        <AdminStatCard
          icon={<UsersIcon size={17} />}
          label="Known devices"
          value={devicesCount === null ? "—" : String(devicesCount)}
          sub={devicesCount === null ? "checking server…" : "distinct devices, server-tracked"}
        />
        <AdminStatCard
          icon={<Eye size={17} />}
          label="App opens"
          value={String(analytics.opens)}
          sub={
            analytics.firstOpen ? `since ${formatAdminDate(analytics.firstOpen)}` : "no data yet"
          }
        />
        <AdminStatCard
          icon={<TagIcon size={17} />}
          label="Wanted Premium"
          value={String(analytics.intentTotal)}
          sub="clicks on a paid plan button"
        />
        <AdminStatCard
          icon={<CrownIcon size={17} />}
          label="Unlocked Premium"
          value={String(analytics.activations)}
          sub={"promo redemptions & grants here"}
        />
        <AdminStatCard
          icon={<TagIcon size={17} />}
          label="Promo codes redeemed"
          value={codesLoading ? "—" : `${usedCodesCount} / ${codes.length}`}
          sub="codes generated, all devices"
        />
      </div>
      <p className="dm-admin-scope-note">
        “Users online now” and “Known devices” are tracked server-side across every device. App
        opens, Premium-intent clicks, and this device’s Premium status are still local to this
        browser only.
      </p>
    </>
  );
  const promoTab = (
    <>
      <div className="dm-admin-section dm-admin-section-first">
        <AdminSectionHead icon={<LockIcon size={13} />}>Admin key</AdminSectionHead>
        <div className="dm-premium-promo-row">
          <div
            style={{
              flex: "1 1 auto",
              minWidth: 0,
            }}
          >
            <Input
              type="password"
              className="dm-input"
              value={adminSecretInput}
              onChange={(e) => setAdminSecretInput(e.target.value)}
              placeholder="Admin key"
            />
          </div>
          <button
            type="button"
            className="dm-btn-secondary"
            style={{
              flex: "0 0 auto",
            }}
            onClick={handleSaveAdminSecret}
          >
            <Check size={14} />
            {" Save & reload"}
          </button>
        </div>
        {codesError && (
          <p
            className="dm-settings-hint"
            style={{
              color: "var(--danger, #e5484d)",
            }}
          >
            {codesError}
          </p>
        )}
      </div>
      <div className="dm-admin-section">
        <AdminSectionHead icon={<Sparkles size={13} />}>Create promo code</AdminSectionHead>
        <div className="dm-admin-promo-create">
          <div className="dm-segmented">
            {["monthly", "yearly", "permanent"].map((t) => (
              <button
                key={t}
                type="button"
                className={`dm-seg ${newType === t ? "dm-seg-active" : ""}`}
                onClick={() => setNewType(t)}
              >
                {PROMO_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="dm-btn-primary"
            onClick={handleGenerate}
          >
            <TagIcon size={15} />
            {" Generate code"}
          </button>
        </div>
      </div>
      <div className="dm-admin-section">
        <AdminSectionHead
          icon={<TagIcon size={13} />}
        >{`Promo codes (${codes.length})`}</AdminSectionHead>
        {codesLoading ? (
          <p className="dm-settings-hint">Loading…</p>
        ) : codes.length === 0 ? (
          <p className="dm-settings-hint">No promo codes yet. Generate one above.</p>
        ) : (
          <div className="dm-admin-code-list">
            {codes.map((c) => {
              const discountDone =
                c.type === "discount" && (isPromoCodeExpired(c) || isPromoCodeExhausted(c));
              return (
                <div
                  key={c.code}
                  className={`dm-admin-code-row ${c.used || discountDone ? "dm-admin-code-row-used" : ""}`}
                >
                  <div className="dm-admin-code-main">
                    <Input
                      type="text"
                      readOnly
                      className="dm-admin-code-input"
                      value={c.code}
                      ref={(el) => {
                        if (el) codeInputRefs.current[c.code] = el;
                      }}
                      onFocus={(e) => e.target.select()}
                    />
                    <span className="dm-admin-code-type">
                      {c.type === "discount"
                        ? `${c.percent}% off`
                        : PROMO_TYPE_LABELS[c.type] || c.type}
                    </span>
                  </div>
                  <div className="dm-admin-code-meta">
                    {c.type === "discount"
                      ? [
                          `${c.usesCount || 0} / ${c.maxUses} used`,
                          c.expiresAt
                            ? ` · expires ${formatAdminDate(c.expiresAt)}`
                            : " · no expiry",
                          isPromoCodeExpired(c)
                            ? " · expired"
                            : isPromoCodeExhausted(c)
                              ? " · limit reached"
                              : "",
                        ].join("")
                      : c.used
                        ? `Used ${formatAdminDate(c.usedAt)}`
                        : `Created ${formatAdminDate(c.createdAt)}`}
                    {copyFailedCode === c.code && (
                      <span className="dm-admin-code-copy-error">
                        {" · Couldn't auto-copy — text is selected, press Ctrl/Cmd+C"}
                      </span>
                    )}
                  </div>
                  <div className="dm-admin-code-actions">
                    <button
                      type="button"
                      className={`dm-btn-secondary dm-admin-code-btn ${copyFailedCode === c.code ? "dm-admin-code-btn-error" : ""}`}
                      onClick={() => handleCopy(c.code)}
                    >
                      {copiedCode === c.code
                        ? "Copied!"
                        : copyFailedCode === c.code
                          ? "Retry copy"
                          : "Copy"}
                    </button>
                    <button
                      type="button"
                      className="dm-btn-danger dm-admin-code-btn"
                      onClick={() => handleDelete(c.code)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
  const premiumTab = (
    <>
      <div className="dm-admin-section dm-admin-section-first">
        <AdminSectionHead icon={<CrownIcon size={13} />}>
          Premium status (this device)
        </AdminSectionHead>
        <p className="dm-settings-hint">
          {premium.active
            ? `Active — ${PROMO_TYPE_LABELS[premium.type] || premium.type}${premium.expiresAt ? ` · expires ${formatAdminDate(premium.expiresAt)}` : " · never expires"}`
            : "Not active"}
        </p>
        <div className="dm-admin-grant-actions">
          <button
            type="button"
            className="dm-btn-secondary"
            onClick={() => handleGrantPremium("monthly")}
          >
            <CrownIcon size={13} />
            {" Grant monthly"}
          </button>
          <button
            type="button"
            className="dm-btn-secondary"
            onClick={() => handleGrantPremium("yearly")}
          >
            <CrownIcon size={13} />
            {" Grant yearly"}
          </button>
          <button
            type="button"
            className="dm-btn-secondary"
            onClick={() => handleGrantPremium("permanent")}
          >
            <CrownIcon size={13} />
            {" Grant permanent"}
          </button>
          {premium.active && (
            <button type="button" className="dm-btn-danger" onClick={handleRevokePremium}>
              <X size={13} />
              {" Revoke"}
            </button>
          )}
        </div>
      </div>
      <div className="dm-admin-section">
        <AdminSectionHead icon={<BarChartIcon size={13} />}>
          Premium funnel (this device)
        </AdminSectionHead>
        <div className="dm-admin-stat-grid dm-admin-stat-grid-compact">
          <AdminStatCard
            icon={<TagIcon size={16} />}
            label="Wanted Premium"
            value={String(analytics.intentTotal)}
            sub="paid-plan button clicks"
          />
          <AdminStatCard
            icon={<CrownIcon size={16} />}
            label="Unlocked Premium"
            value={String(analytics.activations)}
            sub="activations on this device"
          />
        </div>
      </div>
    </>
  );
  if (asPage) {
    return (
      <div className="dm-view dm-admin-page notranslate" translate="no">
        <AdminPageBar onBack={onClose} />
        <div className="dm-admin-page-title">
          <div className="dm-admin-head-icon">
            <LockIcon size={16} />
          </div>
          <div>
            <h3>Admin Panel</h3>
            <p className="dm-admin-head-sub">Promo codes, premium and analytics</p>
          </div>
        </div>
        <div className="dm-segmented dm-admin-tabs">
          {ADMIN_TABS.map((t) => {
            const TabIcon = ADMIN_TAB_ICONS[t.id];
            return (
              <button
                key={t.id}
                type="button"
                className={`dm-seg dm-admin-tab ${tab === t.id ? "dm-seg-active" : ""}`}
                onClick={() => setTab(t.id)}
              >
                <TabIcon size={14} className="dm-admin-tab-icon" />
                <span className="dm-admin-tab-label">{t.label}</span>
              </button>
            );
          })}
        </div>
        <div className="dm-admin-page-body">
          <div className="dm-admin-tab-panel" key={tab}>
            {tab === "overview" && overviewTab}
            {tab === "promo" && promoTab}
            {tab === "premium" && premiumTab}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="dm-modal-backdrop" onClick={onClose}>
      <div
        className="dm-modal dm-admin-modal dm-admin-modal-v2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dm-modal-head dm-admin-head">
          <div className="dm-admin-head-title">
            <div className="dm-admin-head-icon">
              <LockIcon size={16} />
            </div>
            <div>
              <h3>Admin Panel</h3>
              <p className="dm-admin-head-sub">Local tools · this-device analytics only</p>
            </div>
          </div>
          <IconBtn onClick={onClose}>
            <X size={18} />
          </IconBtn>
        </div>
        <div className="dm-segmented dm-admin-tabs">
          {ADMIN_TABS.map((t) => {
 const TabIcon = ADMIN_TAB_ICONS[t.id];
 return (
            <button
              key={t.id}
              type="button"
              className={`dm-seg dm-admin-tab ${tab === t.id ? "dm-seg-active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              <TabIcon size={14} className="dm-admin-tab-icon" />
              <span className="dm-admin-tab-label">{t.label}</span>
            </button>
          );
})}
        </div>
        <div className="dm-admin-body">
          {tab === "overview" && (
            <div className="dm-admin-tab-panel" key="overview">
              {overviewTab}
            </div>
          )}
          {tab === "promo" && (
            <div className="dm-admin-tab-panel" key="promo">
              {promoTab}
            </div>
          )}
          {tab === "premium" && (
            <div className="dm-admin-tab-panel" key="premium">
              {premiumTab}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
