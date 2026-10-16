/* components/account/account.jsx
 * Sign-in / sign-up modal, change password, account settings.
 */

import { Fragment, useEffect, useState } from "react";
import { IconBtn } from "../common/common";
import { Input } from "../common/Input";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  Eye,
  EyeOff,
  KeyIcon,
  Loader2,
  UserIcon,
  X,
} from "../icons/icons";
import { LockIcon } from "../icons/settings-icons";

export function AuthModal({ mode, onClose, onSuccess }) {
  const [tab, setTab] = useState(mode || "signin");
  const lastId = (window.wwordyCloud && window.wwordyCloud.getLastId && window.wwordyCloud.getLastId()) || "";
  const [id, setId] = useState(mode === "signup" ? "" : lastId);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [touched, setTouched] = useState({});
  const cloudReady = !!(window.wwordyCloud && window.wwordyCloud.ready());
  const switchTab = (t) => {
    setTab(t);
    setError(null);
    setPassword("");
    setConfirmPassword("");
    setShowPw(false);
    setTouched({});
    // Sign-in form: bring back the last used ID (sign-up always starts empty).
    if (t === "signup") setId("");
    else if (!id) setId(lastId);
  };
  const touch = (k) => setTouched((t) => (t[k] ? t : { ...t, [k]: true }));
  const idTrim = id.trim();
  const idValid = /^[a-zA-Z0-9_.-]{3,24}$/.test(idTrim);
  const pwScore = (() => {
    let sc = 0;
    if (password.length >= 6) sc++;
    if (password.length >= 10) sc++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password)) sc++;
    if (/[^a-zA-Z0-9]/.test(password) && password.length >= 8) sc++;
    return password ? Math.max(1, sc) : 0;
  })();
  const pwLabel = ["", "Weak", "Okay", "Good", "Strong"][pwScore];
  const pwValid = password.length >= 6;
  const matches = confirmPassword.length > 0 && password === confirmPassword;
  const signupReady = idValid && pwValid && matches;
  const idHint = !idTrim
    ? "3–24 characters: letters, numbers, . _ -"
    : idValid
      ? "Looks good"
      : idTrim.length < 3
        ? "Too short — use at least 3 characters"
        : idTrim.length > 24
          ? "Too long — 24 characters max"
          : "Only letters, numbers, . _ - are allowed";
  const pwToggle = (
    <button
      type="button"
      className="dm-auth-eye"
      tabIndex={-1}
      aria-label={showPw ? "Hide password" : "Show password"}
      onClick={() => setShowPw((v) => !v)}
    >
      {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
    </button>
  );
  const field = (o) => (
    <div className="dm-auth-field">
      <label className="dm-auth-label" htmlFor={o.name}>
        {o.label}
      </label>
      <div className={`dm-auth-inputwrap ${o.state ? "dm-auth-inputwrap-" + o.state : ""}`}>
        <span className="dm-auth-inputicon">{o.icon}</span>
        <input
          id={o.name}
          name={o.name}
          className="dm-auth-input"
          type={o.secret && !showPw ? "password" : "text"}
          value={o.value}
          onChange={(e) => o.onChange(e.target.value)}
          onBlur={() => touch(o.name)}
          onKeyDown={o.onEnter ? (e) => e.key === "Enter" && o.onEnter() : undefined}
          placeholder={o.placeholder || ""}
          autoFocus={!!o.autoFocus}
          autoComplete={o.autoComplete}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
        {o.trailing}
      </div>
      {o.hint && (
        <div className={`dm-auth-hint ${o.state ? "dm-auth-hint-" + o.state : ""}`}>
          {o.state === "ok" && <Check size={12} />}
          {o.hint}
        </div>
      )}
    </div>
  );
  const submitSignUp = async () => {
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      const res = await window.wwordyCloud.signUp(id, password);
      onSuccess(res.id);
    } catch (e) {
      setError(e && e.message ? e.message : "Could not create account.");
    } finally {
      setBusy(false);
    }
  };
  const submitSignIn = async () => {
    setError(null);
    setBusy(true);
    try {
      const res = await window.wwordyCloud.signIn(id, password);
      onSuccess(res.id);
    } catch (e) {
      setError(e && e.message ? e.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  };
  const isSignup = tab === "signup";
  const idState = !idTrim ? "" : idValid ? "ok" : touched.id ? "bad" : "";
  return (
    <div className="dm-modal-backdrop" onClick={onClose}>
      <div className="dm-modal dm-auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dm-auth-top">
          <button type="button" className="dm-auth-close" aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
          <div className="dm-auth-hero">
            <h3 className="dm-auth-title">{isSignup ? "Create your account" : "Welcome back"}</h3>
            <p className="dm-auth-sub">
              {isSignup
                ? "Just an ID and a password. No email needed."
                : "Sign in to pick up right where you left off."}
            </p>
          </div>
        </div>
        {!cloudReady && (
          <div className="dm-autofill-error" style={{ margin: "0 20px 20px" }}>
            Cloud sync isn't set up for this app yet. Ask the app owner to connect a Supabase
            project.
          </div>
        )}
        {cloudReady && (
          <div className="dm-auth-body">
            <div className="dm-segmented dm-auth-tabs">
              <button
                type="button"
                className={`dm-seg ${tab === "signin" ? "dm-seg-active" : ""}`}
                onClick={() => switchTab("signin")}
              >
                Sign in
              </button>
              <button
                type="button"
                className={`dm-seg ${tab === "signup" ? "dm-seg-active" : ""}`}
                onClick={() => switchTab("signup")}
              >
                Sign up
              </button>
            </div>
            {isSignup && (
              <div className="dm-auth-form" key="signup">
                {field({
                  name: "id",
                  label: "Choose your ID",
                  icon: <UserIcon size={17} />,
                  value: id,
                  onChange: setId,
                  placeholder: "e.g. hans_23",
                  autoFocus: true,
                  autoComplete: "username",
                  state: idState,
                  hint: idState === "bad" ? idHint : "",
                  trailing:
                    idState === "ok" ? (
                      <span className="dm-auth-status dm-auth-status-ok">
                        <Check size={14} />
                      </span>
                    ) : null,
                })}
                {field({
                  name: "password",
                  label: "Password",
                  icon: <LockIcon size={17} />,
                  value: password,
                  onChange: setPassword,
                  secret: true,
                  autoComplete: "new-password",
                  placeholder: "At least 6 characters",
                  trailing: pwToggle,
                })}
                {password && (
                  <div className={`dm-auth-strength dm-auth-strength-${pwScore}`}>
                    <div className="dm-auth-strength-bars">
                      {[1, 2, 3, 4].map((n) => (
                        <span key={n} className={n <= pwScore ? "on" : ""} />
                      ))}
                    </div>
                    <span className="dm-auth-strength-label">{pwLabel || ""}</span>
                  </div>
                )}
                {field({
                  name: "confirm",
                  label: "Confirm password",
                  icon: <LockIcon size={17} />,
                  value: confirmPassword,
                  onChange: setConfirmPassword,
                  secret: true,
                  autoComplete: "new-password",
                  placeholder: "Repeat your password",
                  onEnter: () => signupReady && !busy && submitSignUp(),
                  state: !confirmPassword ? "" : matches ? "ok" : touched.confirm ? "bad" : "",
                  hint:
                    confirmPassword && !matches && touched.confirm ? "Passwords don’t match" : "",
                  trailing: matches ? (
                    <span className="dm-auth-status dm-auth-status-ok">
                      <Check size={14} />
                    </span>
                  ) : null,
                })}
                {error && (
                  <div className="dm-auth-error" role="alert">
                    {error}
                  </div>
                )}
                <button
                  type="button"
                  className="dm-btn-primary dm-auth-submit"
                  disabled={busy || !signupReady}
                  onClick={submitSignUp}
                >
                  {busy ? <Loader2 size={16} className="dm-autofill-spin" /> : null}
                  {busy ? "Creating account…" : "Create account"}
                  {!busy && <ArrowRight size={16} className="dm-auth-submit-arrow" />}
                </button>
                <p className="dm-auth-switch">
                  Already have an account?{" "}
                  <button type="button" onClick={() => switchTab("signin")}>
                    Sign in
                  </button>
                </p>
              </div>
            )}
            {!isSignup && (
              <div className="dm-auth-form" key="signin">
                {field({
                  name: "id",
                  label: "Your ID",
                  icon: <UserIcon size={17} />,
                  value: id,
                  onChange: setId,
                  placeholder: "e.g. hans_23",
                  autoFocus: !lastId,
                  autoComplete: "username",
                })}
                {field({
                  name: "password",
                  label: "Password",
                  icon: <LockIcon size={17} />,
                  value: password,
                  onChange: setPassword,
                  secret: true,
                  autoComplete: "current-password",
                  placeholder: "Your password",
                  autoFocus: !!lastId,
                  onEnter: () => id && password && !busy && submitSignIn(),
                  trailing: pwToggle,
                })}
                {error && (
                  <div className="dm-auth-error" role="alert">
                    {error}
                  </div>
                )}
                <button
                  type="button"
                  className="dm-btn-primary dm-auth-submit"
                  disabled={busy || !id || !password}
                  onClick={submitSignIn}
                >
                  {busy ? <Loader2 size={16} className="dm-autofill-spin" /> : null}
                  {busy ? "Signing in…" : "Sign in"}
                  {!busy && <ArrowRight size={16} className="dm-auth-submit-arrow" />}
                </button>
                <p className="dm-auth-switch">
                  New here?{" "}
                  <button type="button" onClick={() => switchTab("signup")}>
                    Create an account
                  </button>
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function formatAgo(ts, now) {
  if (!ts) return "Not synced yet";
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 10) return "Synced just now";
  if (s < 60) return `Synced ${s} s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `Synced ${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `Synced ${h} h ago`;
  return `Synced ${Math.round(h / 24)} d ago`;
}

function SyncStatusCard({ accountId, onSyncNow }) {
  const read = () =>
    (window.wwordyCloud && window.wwordyCloud.getSyncStatus && window.wwordyCloud.getSyncStatus()) || {
      state: "idle",
      lastSyncAt: 0,
      error: "",
    };
  const [status, setStatus] = useState(read);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const onStatus = (e) => setStatus(e.detail || read());
    window.addEventListener("wwordy-sync-status", onStatus);
    const tick = setInterval(() => setNow(Date.now()), 15000);
    return () => {
      window.removeEventListener("wwordy-sync-status", onStatus);
      clearInterval(tick);
    };
  }, []);
  const syncing = status.state === "syncing";
  const failed = status.state === "error";
  return (
    <div className={`dm-sync-card ${failed ? "dm-sync-card-error" : ""}`}>
      <div className="dm-sync-card-main">
        <span
          className={`dm-sync-dot ${syncing ? "dm-sync-dot-busy" : failed ? "dm-sync-dot-bad" : "dm-sync-dot-ok"}`}
          aria-hidden="true"
        />
        <div className="dm-sync-card-text">
          <div className="dm-sync-card-title">
            {syncing ? "Syncing\u2026" : failed ? "Sync failed" : formatAgo(status.lastSyncAt, now)}
          </div>
          <div className="dm-sync-card-sub">
            {failed ? status.error || "Check your connection and try again." : `Signed in as ${accountId}`}
          </div>
        </div>
      </div>
      <button type="button" className="dm-icon-action-btn" disabled={syncing} onClick={onSyncNow}>
        {syncing ? <Loader2 size={16} className="dm-autofill-spin" /> : null}
        {syncing ? " Syncing" : " Sync now"}
      </button>
    </div>
  );
}

function DeleteAccountModal({ accountId, onClose, onDeleted }) {
  const [typed, setTyped] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const ready = typed.trim() === accountId && password.length > 0;
  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      await onDeleted(password);
    } catch (e) {
      setError(e && e.message ? e.message : "Could not delete the account.");
      setBusy(false);
    }
  };
  return (
    <div className="dm-modal-backdrop" onClick={busy ? undefined : onClose}>
      <div className="dm-modal dm-confirm-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="dm-confirm-title">Delete account?</h3>
        <p className="dm-confirm-sub">
          This permanently removes <b>{accountId}</b> and its backup from the cloud, and the ID
          becomes free for anyone to take. Your stacks stay on this device, but they will no longer
          sync anywhere.
        </p>
        <label className="dm-label" htmlFor="del-id">
          Type your ID to confirm
        </label>
        <input
          id="del-id"
          className="dm-input"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={accountId}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoComplete="off"
        />
        <label className="dm-label" htmlFor="del-pw">
          Password
        </label>
        <input
          id="del-pw"
          className="dm-input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ready && !busy && submit()}
          autoComplete="current-password"
        />
        {error && <div className="dm-autofill-error">{error}</div>}
        <div className="dm-modal-actions">
          <button className="dm-btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="dm-btn-danger" onClick={submit} disabled={!ready || busy}>
            {busy ? "Deleting\u2026" : "Delete forever"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ChangePasswordModal({ accountId, onClose }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(null);
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setError(null);
    if (next !== confirm) {
      setError("New passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      await window.wwordyCloud.changePassword(accountId, current, next);
      setOk(true);
      setTimeout(onClose, 1200);
    } catch (e) {
      setError(e && e.message ? e.message : "Could not change password.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="dm-modal-backdrop" onClick={onClose}>
      <div className="dm-modal dm-auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dm-modal-head">
          <h3>Change password</h3>
          <IconBtn onClick={onClose}>
            <X size={18} />
          </IconBtn>
        </div>
        {ok ? (
          <p className="dm-settings-hint dm-import-ok">Password updated.</p>
        ) : (
          <>
            <label className="dm-label">Current password</label>
            <Input
              className="dm-input"
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              autoFocus
            />
            <label className="dm-label">New password</label>
            <Input
              className="dm-input"
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
            <label className="dm-label">Confirm new password</label>
            <Input
              className="dm-input"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            {error && <div className="dm-autofill-error">{error}</div>}
            <button
              type="button"
              className="dm-btn-primary"
              disabled={busy || !current || !next || !confirm}
              onClick={submit}
            >
              {busy ? "Updating…" : "Update password"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
export function AccountSettings({ onBack, account, onOpenAuth, onSignOut, onSyncNow, onDeleteAccount }) {
  const [showChangePw, setShowChangePw] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  if (!account || !account.id) {
    return (
      <div className="dm-view dm-settings-subview">
        <div className="dm-topbar">
          <IconBtn onClick={onBack}>
            <ChevronLeft size={20} />
          </IconBtn>
          <div className="dm-topbar-title">Account</div>
        </div>
        <div className="dm-header">
          <div>
            <div className="dm-eyebrow">SYNC ACROSS DEVICES</div>
            <h1 className="dm-h1">Account</h1>
          </div>
        </div>
        <p className="dm-settings-hint">
          Create an account with your own ID to back up your stacks and keep every device in sync
          automatically — no email or phone number needed.
        </p>
        <button
          type="button"
          className="dm-btn-primary dm-account-cta"
          onClick={() => onOpenAuth("signup")}
        >
          <UserIcon size={16} />
          {" Sign up"}
        </button>
        <button
          type="button"
          className="dm-btn-secondary dm-account-cta"
          onClick={() => onOpenAuth("signin")}
        >
          Sign in
        </button>
      </div>
    );
  }
  return (
    <div className="dm-view dm-settings-subview">
      <div className="dm-topbar">
        <IconBtn onClick={onBack}>
          <ChevronLeft size={20} />
        </IconBtn>
        <div className="dm-topbar-title">Account</div>
      </div>
      <div className="dm-header">
        <div>
          <div className="dm-eyebrow">SIGNED IN</div>
          <h1 className="dm-h1">{account.id}</h1>
        </div>
      </div>
      <p className="dm-settings-hint">
        Your stacks and words sync automatically to every device you sign in on.
      </p>
      <SyncStatusCard accountId={account.id} onSyncNow={onSyncNow} />
      <div className="dm-settings-row">
        <div>
          <div className="dm-settings-row-title">Change password</div>
          <div className="dm-settings-row-sub">Update your main sign-in password</div>
        </div>
        <button type="button" className="dm-icon-action-btn" onClick={() => setShowChangePw(true)}>
          <KeyIcon size={18} />
          {" Change"}
        </button>
      </div>
      <div className="dm-settings-row dm-settings-row-danger">
        <div>
          <div className="dm-settings-row-title">Sign out</div>
          <div className="dm-settings-row-sub">
            This device stops syncing until you sign in again.
          </div>
        </div>
        <button
          type="button"
          className="dm-icon-action-btn dm-icon-action-btn-danger"
          onClick={() => setConfirmSignOut(true)}
        >
          Sign out
        </button>
      </div>
      <div className="dm-settings-row dm-settings-row-danger">
        <div>
          <div className="dm-settings-row-title">Delete account</div>
          <div className="dm-settings-row-sub">
            Remove your ID and cloud backup for good. Stacks on this device are kept.
          </div>
        </div>
        <button
          type="button"
          className="dm-icon-action-btn dm-icon-action-btn-danger"
          onClick={() => setShowDelete(true)}
        >
          Delete
        </button>
      </div>
      {confirmSignOut && (
        <div className="dm-modal-backdrop" onClick={() => setConfirmSignOut(false)}>
          <div className="dm-modal dm-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="dm-confirm-title">Sign out?</h3>
            <p className="dm-confirm-sub">You can sign back in any time to get your stacks back.</p>
            <div className="dm-modal-actions">
              <button className="dm-btn-secondary" onClick={() => setConfirmSignOut(false)}>
                Cancel
              </button>
              <button
                className="dm-btn-danger"
                onClick={() => {
                  setConfirmSignOut(false);
                  onSignOut();
                }}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
      {showDelete && (
        <DeleteAccountModal
          accountId={account.id}
          onClose={() => setShowDelete(false)}
          onDeleted={async (pw) => {
            await onDeleteAccount(pw);
            setShowDelete(false);
          }}
        />
      )}
      {showChangePw && (
        <ChangePasswordModal accountId={account.id} onClose={() => setShowChangePw(false)} />
      )}
    </div>
  );
}
