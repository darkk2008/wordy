/* services/admin-promo.js
 * Netlify backend calls: device registry, admin secret, promo codes.
 */

// --- Backend (Netlify Functions + Netlify Blobs) ----------------------
// Promo codes and the device count used to live only in this browser's
// localStorage, which meant a code created in the admin panel only ever
// existed on the device that created it, and "known devices" was not
// tracked at all. These now live server-side; see /netlify/functions/.
export const NETLIFY_FN_BASE = "/.netlify/functions";
const DEVICE_ID_KEY = "deutschmaster-device-id";
const ADMIN_SECRET_KEY = "deutschmaster-admin-secret";
export function getDeviceId() {
  try {
    const existing = window.localStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;
    const id =
      window.crypto && window.crypto.randomUUID
        ? window.crypto.randomUUID()
        : Date.now().toString(36) + Math.random().toString(36).slice(2);
    window.localStorage.setItem(DEVICE_ID_KEY, id);
    return id;
  } catch (e) {
    return "unknown-device";
  }
}
export function registerDevice() {
  try {
    fetch(`${NETLIFY_FN_BASE}/device-register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        deviceId: getDeviceId(),
      }),
    }).catch(function () {});
  } catch (e) {}
}
export async function fetchDevicesCount() {
  try {
    const res = await fetch(`${NETLIFY_FN_BASE}/devices-count`, {
      cache: "no-store",
      headers: { "x-admin-secret": getAdminSecret() },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.count === "number" ? data.count : null;
  } catch (e) {
    return null;
  }
}
let __dmAdminSecretMem = "";
export function getAdminSecret() {
  return __dmAdminSecretMem;
}
export function setAdminSecret(value) {
  __dmAdminSecretMem = String(value || "");
}
export async function adminPromoRequest(action, extra) {
  try {
    const res = await fetch(`${NETLIFY_FN_BASE}/promo-admin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": getAdminSecret(),
      },
      body: JSON.stringify(
        Object.assign(
          {
            action,
          },
          extra || {}
        )
      ),
    });
    const data = await res.json().catch(() => ({
      ok: false,
      message: "Bad response from server.",
    }));
    if (res.status === 401)
      return {
        ok: false,
        message: "Admin key rejected. Re-enter it below.",
        unauthorized: true,
      };
    return data;
  } catch (e) {
    return {
      ok: false,
      message: "Couldn't reach the server. Check your connection.",
    };
  }
}
async function adminListPromoCodes() {
  const result = await adminPromoRequest("list");
  return result.ok ? result.codes : [];
}
export async function adminCreatePromoCode(type, options) {
  return adminPromoRequest("create", {
    type,
    options,
  });
}
export async function adminDeletePromoCode(code) {
  return adminPromoRequest("delete", {
    code,
  });
}
export function isPromoCodeExpired(entry) {
  return !!(entry.expiresAt && entry.expiresAt < Date.now());
}
export function isPromoCodeExhausted(entry) {
  return (
    entry.type === "discount" &&
    typeof entry.maxUses === "number" &&
    (entry.usesCount || 0) >= entry.maxUses
  );
}
