/* ===== wwordy Cloud Sync (Supabase) — edit here =====
   1) Create a free project at https://supabase.com
   2) In the SQL editor, run the setup script provided alongside this file
      (supabase-setup.sql, then supabase-delete-account.sql) - it creates the tables/functions this needs.
   3) In Authentication > Providers > Email, turn OFF "Confirm email"
      (accounts here use a made-up address behind the scenes, so there is
      no real inbox to confirm from).
   4) Paste your project's URL and anon public key below (Project Settings > API). */
window.SUPABASE_CONFIG = {
  url: "https://cdnwkqidxgeluxxoheoo.supabase.co",
  anonKey: "sb_publishable_spV56yK2wRuDitapAVZO4g_E2SJrC08",
};

window.wwordyCloud = (function () {
  var client = null;
  var channel = null;

  function ready() {
    return !!(
      window.SUPABASE_CONFIG &&
      window.SUPABASE_CONFIG.url &&
      window.SUPABASE_CONFIG.anonKey &&
      window.SUPABASE_CONFIG.url.indexOf("YOUR-PROJECT") === -1 &&
      window.supabase &&
      window.supabase.createClient
    );
  }

  function getClient() {
    if (!ready()) return null;
    if (!client) {
      client = window.supabase.createClient(
        window.SUPABASE_CONFIG.url,
        window.SUPABASE_CONFIG.anonKey,
        {
          auth: { persistSession: true, autoRefreshToken: true },
        }
      );
    }
    return client;
  }

  // Accounts use a self-chosen ID, never an email/phone. Supabase Auth still
  // needs *an* email internally, so we derive a private, made-up one from the
  // ID — it is never shown to the user and nothing is ever sent to it.
  function idToFakeEmail(id) {
    // Supabase checks that the domain has real mail servers (MX records),
    // even though "Confirm email" being off means nothing is ever sent.
    // gmail.com is used purely because it reliably resolves.
    return "wordify+" + String(id).trim().toLowerCase() + "@gmail.com";
  }

  function getDeviceId() {
    try {
      var k = "wordify-device-id";
      var v = window.localStorage.getItem(k);
      if (!v) {
        v = "dev-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
        window.localStorage.setItem(k, v);
      }
      return v;
    } catch (e) {
      return "dev-unknown";
    }
  }

  // ---- Sync status (shown on the Account screen) ----
  var LAST_SYNC_KEY = "wordify-last-sync";
  var LAST_ID_KEY = "wordify-last-id";
  var syncState = { state: "idle", lastSyncAt: 0, error: "" };
  try {
    syncState.lastSyncAt = Number(window.localStorage.getItem(LAST_SYNC_KEY)) || 0;
  } catch (e) {}
  function setSync(patch) {
    for (var k in patch) syncState[k] = patch[k];
    if (patch.lastSyncAt) {
      try {
        window.localStorage.setItem(LAST_SYNC_KEY, String(patch.lastSyncAt));
      } catch (e) {}
    }
    try {
      window.dispatchEvent(new CustomEvent("wwordy-sync-status", { detail: getSyncStatus() }));
    } catch (e) {}
  }
  function getSyncStatus() {
    return { state: syncState.state, lastSyncAt: syncState.lastSyncAt, error: syncState.error };
  }
  function getLastId() {
    try {
      return window.localStorage.getItem(LAST_ID_KEY) || "";
    } catch (e) {
      return "";
    }
  }
  function rememberId(id) {
    try {
      window.localStorage.setItem(LAST_ID_KEY, String(id || ""));
    } catch (e) {}
  }
  function forgetId() {
    try {
      window.localStorage.removeItem(LAST_ID_KEY);
      window.localStorage.removeItem(LAST_SYNC_KEY);
    } catch (e) {}
    syncState.lastSyncAt = 0;
  }

  async function idAvailable(id) {
    var c = getClient();
    if (!c) throw new Error("Cloud sync isn't set up yet.");
    var res = await c.rpc("id_available", { p_id: id });
    if (res.error) throw new Error(res.error.message || "Could not check that ID.");
    return !!res.data;
  }

  async function signUp(id, password) {
    var c = getClient();
    if (!c) throw new Error("Cloud sync isn't set up yet.");
    id = String(id || "").trim();
    if (!/^[a-zA-Z0-9_.-]{3,24}$/.test(id))
      throw new Error("ID must be 3\u201324 characters: letters, numbers, . _ -");
    if (!password || password.length < 6)
      throw new Error("Password must be at least 6 characters.");
    var available = await idAvailable(id);
    if (!available) throw new Error("That ID is already taken.");
    var signUpRes = await c.auth.signUp({ email: idToFakeEmail(id), password: password });
    if (signUpRes.error) throw new Error(signUpRes.error.message || "Could not create account.");
    if (!signUpRes.data || !signUpRes.data.session) {
      throw new Error(
        'Account created, but the project still requires email confirmation. Turn off "Confirm email" in Supabase Auth settings.'
      );
    }
    var reg = await c.rpc("register_security", { p_public_id: id });
    if (reg.error) {
      throw new Error(reg.error.message || "Could not save your ID.");
    }
    rememberId(id);
    return { id: id };
  }

  async function signIn(id, password) {
    var c = getClient();
    if (!c) throw new Error("Cloud sync isn't set up yet.");
    id = String(id || "").trim();
    var lookup = await c.rpc("id_to_email", { p_id: id });
    if (lookup.error || !lookup.data) throw new Error("No account found with that ID.");
    var signInRes = await c.auth.signInWithPassword({ email: lookup.data, password: password });
    if (signInRes.error) throw new Error("Incorrect ID or password.");
    rememberId(id);
    return { id: id };
  }

  async function signOut() {
    var c = getClient();
    if (channel && c) {
      try {
        c.removeChannel(channel);
      } catch (e) {}
      channel = null;
    }
    if (c) await c.auth.signOut();
  }

  async function getSessionId() {
    var c = getClient();
    if (!c) return null;
    var res = await c.auth.getSession();
    return res.data && res.data.session ? res.data.session.user.id : null;
  }

  async function getMyPublicId() {
    var c = getClient();
    if (!c) return null;
    var uid = await getSessionId();
    if (!uid) return null;
    var res = await c.from("user_security").select("public_id").eq("user_id", uid).maybeSingle();
    if (res.error || !res.data) return null;
    return res.data.public_id;
  }

  async function pushData(payload) {
    var c = getClient();
    if (!c) return false;
    var uid = await getSessionId();
    if (!uid) return false;
    setSync({ state: "syncing", error: "" });
    try {
      var res = await c.from("user_data").upsert({
        user_id: uid,
        payload: payload,
        updated_at: new Date().toISOString(),
        updated_by_device: getDeviceId(),
      });
      if (res && res.error) throw new Error(res.error.message || "Sync failed.");
      setSync({ state: "idle", lastSyncAt: Date.now(), error: "" });
      return true;
    } catch (e) {
      setSync({
        state: "error",
        error:
          typeof navigator !== "undefined" && navigator.onLine === false
            ? "You're offline."
            : (e && e.message) || "Sync failed.",
      });
      return false;
    }
  }

  async function pullData() {
    var c = getClient();
    if (!c) return null;
    var uid = await getSessionId();
    if (!uid) return null;
    var res = await c
      .from("user_data")
      .select("payload,updated_by_device")
      .eq("user_id", uid)
      .maybeSingle();
    if (res.error || !res.data) return null;
    setSync({ state: "idle", lastSyncAt: Date.now(), error: "" });
    return res.data;
  }

  function subscribe(onRemoteChange) {
    var c = getClient();
    if (!c) return function () {};
    getSessionId().then(function (uid) {
      if (!uid) return;
      channel = c
        .channel("user_data_" + uid)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "user_data", filter: "user_id=eq." + uid },
          function (payload) {
            var row = payload.new;
            if (!row) return;
            if (row.updated_by_device === getDeviceId()) return;
            setSync({ state: "idle", lastSyncAt: Date.now(), error: "" });
            onRemoteChange(row.payload);
          }
        )
        .subscribe();
    });
    return function () {
      if (channel && c) {
        try {
          c.removeChannel(channel);
        } catch (e) {}
        channel = null;
      }
    };
  }

  async function changePassword(id, currentPassword, newPassword) {
    var c = getClient();
    if (!c) throw new Error("Cloud sync isn't set up yet.");
    if (!newPassword || newPassword.length < 6)
      throw new Error("New password must be at least 6 characters.");
    var reAuth = await c.auth.signInWithPassword({
      email: idToFakeEmail(id),
      password: currentPassword,
    });
    if (reAuth.error) throw new Error("Current password is incorrect.");
    var res = await c.auth.updateUser({ password: newPassword });
    if (res.error) throw new Error(res.error.message || "Could not update password.");
  }

  // Deletes the signed-in account and its cloud data. Needs the delete_my_account() SQL function
  // (see supabase-delete-account.sql); without it only the cloud data rows can be removed.
  async function deleteAccount(id, password) {
    var c = getClient();
    if (!c) throw new Error("Cloud sync isn't set up yet.");
    var uidBefore = await getSessionId();
    if (!uidBefore) throw new Error("You're not signed in.");
    var reAuth = await c.auth.signInWithPassword({
      email: idToFakeEmail(id),
      password: password,
    });
    if (reAuth.error) throw new Error("Password is incorrect.");
    var res = await c.rpc("delete_my_account");
    if (res.error) {
      var missing = /could not find|does not exist|not found/i.test(res.error.message || "");
      if (!missing) throw new Error(res.error.message || "Could not delete the account.");
      // Fallback when the SQL function was not installed: remove what the policies allow.
      var d1 = await c.from("user_data").delete().eq("user_id", uidBefore);
      var d2 = await c.from("user_security").delete().eq("user_id", uidBefore);
      if (d1.error && d2.error)
        throw new Error(
          "Account deletion isn't set up on the server yet. Ask the app owner to run supabase-delete-account.sql."
        );
    }
    await signOut();
    forgetId();
  }

  return {
    ready: ready,
    signUp: signUp,
    signIn: signIn,
    signOut: signOut,
    getSessionId: getSessionId,
    getMyPublicId: getMyPublicId,
    pushData: pushData,
    pullData: pullData,
    subscribe: subscribe,
    changePassword: changePassword,
    deleteAccount: deleteAccount,
    getSyncStatus: getSyncStatus,
    getLastId: getLastId,
  };
})();
