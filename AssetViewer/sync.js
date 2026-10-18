// Focus List cloud sync + account screen.
//
// The app keeps working exactly as before on localStorage. This file adds:
//   1. Accounts: Google, email (magic link / 6-digit code) or username + secret key.
//   2. Sync: tracked localStorage keys are uploaded as one snapshot per account and
//      merged on every device (3-way merge, so edits on two devices are combined
//      instead of one overwriting the other).
//   3. Backup: download / restore all data as a JSON file (works without an account).
//
// Server side: supabase/schema.sql. Settings: supabase-config.js.
(function () {
  if (window.FLSync) return;

  const CFG = window.FL_SUPABASE || {};
  const CONFIGURED = !!(CFG.url && CFG.anonKey);
  const API = CONFIGURED ? CFG.url.replace(/\/+$/, '') : '';
  const SDK_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js';
  const AUTH_STORAGE_KEY = 'fl-auth';

  const STATE_KEY = 'fl_sync_state_v1';  // account + version + timestamps
  const BASE_KEY = 'fl_sync_base_v1';    // snapshot of data at the last synced version
  const MTIME_KEY = 'fl_sync_mtime_v1';  // last local edit time per key (conflict tie-break)

  // How often to ask the server for changes. Each check is tiny, but Supabase's free plan
  // meters download traffic, so idle tabs check rarely; opening/returning to the app checks sooner.
  const PULL_INTERVAL = 2 * 60 * 1000;
  const IDLE_PULL_INTERVAL = 5 * 60 * 1000;
  const PUSH_DEBOUNCE = 2500;

  // Which localStorage keys belong to the user's data
  const TRACKED_EXACT = new Set([
    'focuslist_tasks_v1', 'focuslist.goalCountdown', 'celebratedDates', 'theme', 'fl_ambience',
    'durWork', 'durShort', 'durLong', 'roundsLong', 'autoNext', 'soundOn'
  ]);
  const TRACKED_PREFIX = ['habits_', 'availableHours_'];
  // Keys whose change needs no page refresh
  const COSMETIC_KEYS = new Set(['theme', 'fl_ambience']);

  function isTracked(key) {
    if (typeof key !== 'string') return false;
    return TRACKED_EXACT.has(key) || TRACKED_PREFIX.some(p => key.startsWith(p));
  }

  // ---------------------------------------------------------------------------
  // Raw storage access (bypasses the change tracking below)
  // ---------------------------------------------------------------------------
  const proto = Storage.prototype;
  const rawGet = proto.getItem;
  const rawSet = proto.setItem;
  const rawRemove = proto.removeItem;
  let ls = null;
  try { ls = window.localStorage; } catch (e) { ls = null; }

  function lsGet(key) {
    try { return ls ? rawGet.call(ls, key) : null; } catch (e) { return null; }
  }
  function lsSet(key, value) {
    try { if (ls) rawSet.call(ls, key, value); return true; } catch (e) { return false; }
  }
  function lsRemove(key) {
    try { if (ls) rawRemove.call(ls, key); } catch (e) { }
  }
  function readJSON(key, fallback) {
    try {
      const v = JSON.parse(lsGet(key) || 'null');
      return v && typeof v === 'object' ? v : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function writeJSON(key, value) {
    return lsSet(key, JSON.stringify(value));
  }

  const readState = () => readJSON(STATE_KEY, {});
  const writeState = s => writeJSON(STATE_KEY, s);
  const readBase = () => readJSON(BASE_KEY, {});
  const readMtimes = () => readJSON(MTIME_KEY, {});

  function readLocal() {
    const out = {};
    if (!ls) return out;
    for (let i = 0; i < ls.length; i++) {
      const key = ls.key(i);
      if (isTracked(key)) out[key] = rawGet.call(ls, key);
    }
    return out;
  }

  // ---------------------------------------------------------------------------
  // Change tracking: every page writes through localStorage.setItem, so wrapping
  // it lets us notice edits (to schedule an upload) without touching page code.
  // ---------------------------------------------------------------------------
  let applyingRemote = false;

  function noteLocalChange(key) {
    const mtimes = readMtimes();
    mtimes[key] = Date.now();
    writeJSON(MTIME_KEY, mtimes);
    scheduleSync(PUSH_DEBOUNCE);
  }

  proto.setItem = function (key, value) {
    const watch = this === ls && !applyingRemote && isTracked(key);
    const before = watch ? rawGet.call(this, key) : null;
    rawSet.call(this, key, value);
    if (watch && before !== String(value)) noteLocalChange(key);
  };

  proto.removeItem = function (key) {
    const watch = this === ls && !applyingRemote && isTracked(key);
    const before = watch ? rawGet.call(this, key) : null;
    rawRemove.call(this, key);
    if (watch && before !== null) noteLocalChange(key);
  };

  // ---------------------------------------------------------------------------
  // Merge
  // ---------------------------------------------------------------------------
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const isObj = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  const isIdArray = a => Array.isArray(a) && a.every(x => isObj(x) && x.id !== undefined && x.id !== null);

  function parse(value) {
    if (value === undefined || value === null) return undefined;
    try { return JSON.parse(value); } catch (e) { return value; }
  }

  // Three-way merge of two edited versions (l = this device, r = cloud) of b.
  function mergeValue(b, l, r, preferLocal) {
    if (same(l, r)) return l;
    if (b !== undefined && same(l, b)) return r;
    if (b !== undefined && same(r, b)) return l;

    if (isIdArray(l) && isIdArray(r) && (b === undefined || isIdArray(b))) {
      return mergeIdArrays(b || [], l, r, preferLocal);
    }
    if (isObj(l) && isObj(r)) {
      const bo = isObj(b) ? b : {};
      const out = {};
      const keys = new Set([...Object.keys(l), ...Object.keys(r), ...Object.keys(bo)]);
      keys.forEach(k => {
        const lv = l[k], rv = r[k], bv = bo[k];
        if (lv === undefined && rv === undefined) return;
        if (lv === undefined) {
          if (bv !== undefined && same(rv, bv)) return; // deleted here, untouched in cloud
          out[k] = rv;
          return;
        }
        if (rv === undefined) {
          if (bv !== undefined && same(lv, bv)) return; // deleted in cloud, untouched here
          out[k] = lv;
          return;
        }
        out[k] = mergeValue(bv, lv, rv, preferLocal);
      });
      return out;
    }
    return preferLocal ? l : r;
  }

  // Lists of items with ids (tasks, habits, goals): combine by id
  function mergeIdArrays(b, l, r, preferLocal) {
    const byId = arr => new Map(arr.map(x => [String(x.id), x]));
    const bm = byId(b), lm = byId(l), rm = byId(r);
    const order = preferLocal ? [...l, ...r] : [...r, ...l];
    const seen = new Set();
    const out = [];
    order.forEach(item => {
      const id = String(item.id);
      if (seen.has(id)) return;
      seen.add(id);
      const lv = lm.get(id), rv = rm.get(id), bv = bm.get(id);
      if (lv && rv) out.push(mergeValue(bv, lv, rv, preferLocal));
      else if (lv) { if (!(bv && same(lv, bv))) out.push(lv); }  // else: deleted in cloud
      else if (rv) { if (!(bv && same(rv, bv))) out.push(rv); }  // else: deleted here
    });
    return out;
  }

  // First sync of a device: the same habit added separately on two devices
  // should become one habit, not two.
  function alignHabitIds(local, remote) {
    if (!isObj(local) || !isObj(remote) || !Array.isArray(local.habits) || !Array.isArray(remote.habits)) return remote;
    const byName = new Map(local.habits.map(h => [String(h.name || '').trim().toLowerCase(), h.id]));
    const copy = JSON.parse(JSON.stringify(remote));
    copy.habits.forEach(h => {
      const localId = byName.get(String(h.name || '').trim().toLowerCase());
      if (localId !== undefined && localId !== h.id) {
        if (copy.habitData && copy.habitData[h.id]) {
          copy.habitData[localId] = Object.assign({}, copy.habitData[h.id], copy.habitData[localId] || {});
          delete copy.habitData[h.id];
        }
        h.id = localId;
      }
    });
    return copy;
  }

  // Returns the merged string value for one key (undefined = key removed)
  function mergeKey(key, B, L, R, mtimeL, mtimeR) {
    if (L === R) return L;
    if (R === B) return L;
    if (L === B) return R;

    // Edited on both sides
    const firstLink = B === undefined;
    if (L === undefined) return R; // keep data rather than lose it
    if (R === undefined) return L;

    let b = parse(B), l = parse(L), r = parse(R);
    const structured = (isObj(l) || Array.isArray(l)) && (isObj(r) || Array.isArray(r));
    if (structured) {
      if (firstLink && key.startsWith('habits_')) r = alignHabitIds(l, r);
      const preferLocal = (mtimeL || 0) >= (mtimeR || 0);
      return JSON.stringify(mergeValue(b, l, r, preferLocal));
    }
    // Simple setting: on a brand-new device the account wins, otherwise the latest edit
    if (firstLink) return R;
    return (mtimeL || 0) > (mtimeR || 0) ? L : R;
  }

  function mergeAll(base, local, remoteData, localMtimes, remoteMtimes) {
    const keys = new Set([...Object.keys(base), ...Object.keys(local), ...Object.keys(remoteData)]);
    const merged = {};
    keys.forEach(key => {
      if (!isTracked(key)) return;
      const value = mergeKey(key, base[key], local[key], remoteData[key], localMtimes[key], remoteMtimes[key]);
      if (value !== undefined && value !== null) merged[key] = value;
    });
    return merged;
  }

  // Write merged values into localStorage and let the open page refresh
  function applyToLocal(merged, local) {
    const changed = [];
    applyingRemote = true;
    try {
      Object.keys(merged).forEach(key => {
        if (local[key] !== merged[key]) {
          lsSet(key, merged[key]);
          changed.push({ key, oldValue: local[key] ?? null, newValue: merged[key] });
        }
      });
      Object.keys(local).forEach(key => {
        if (!(key in merged)) {
          lsRemove(key);
          changed.push({ key, oldValue: local[key], newValue: null });
        }
      });
    } finally {
      applyingRemote = false;
    }

    changed.forEach(c => {
      try {
        window.dispatchEvent(new StorageEvent('storage', {
          key: c.key, oldValue: c.oldValue, newValue: c.newValue, storageArea: ls, url: location.href
        }));
      } catch (e) { }
    });
    if (changed.some(c => c.key === 'theme') && typeof window.setTheme === 'function') {
      try { window.setTheme(lsGet('theme') || 'system'); } catch (e) { }
    }
    return changed;
  }

  function refreshPageAfter(changed) {
    if (!changed.length) return;
    if (window.__flLiveSync) return; // page re-renders itself from the storage events
    if (changed.every(c => COSMETIC_KEYS.has(c.key))) return;
    const active = document.activeElement;
    const editing = active && (active.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName));
    if (!editing && !document.querySelector('.fl-modal:not([hidden])')) {
      location.reload();
    } else {
      toast('Updated from your other device.', 'Refresh', () => location.reload(), 10000);
    }
  }

  // ---------------------------------------------------------------------------
  // Server calls (PostgREST RPC)
  // ---------------------------------------------------------------------------
  let sb = null;          // supabase-js client (Google/email accounts only)
  let sdkPromise = null;

  async function accessToken() {
    if (!sb) return null;
    const { data } = await sb.auth.getSession();
    return data && data.session ? data.session.access_token : null;
  }

  async function rpc(fn, args, opts) {
    const headers = { 'Content-Type': 'application/json', apikey: CFG.anonKey };
    const token = (opts && opts.useAuth) ? await accessToken() : null;
    headers.Authorization = `Bearer ${token || CFG.anonKey}`;
    const body = JSON.stringify(args || {});
    const res = await fetch(`${API}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers,
      body,
      keepalive: !!(opts && opts.keepalive) && body.length < 60000
    });
    if (!res.ok) {
      let detail = '';
      try { detail = (await res.json()).message || ''; } catch (e) { }
      const err = new Error(detail || `Server error ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return res.json();
  }

  function account() {
    return readState().account || null;
  }

  function pullCall(since) {
    const acc = account();
    if (acc.type === 'key') return rpc('fl_key_pull', { p_token: acc.token, p_since: since });
    return rpc('fl_pull', { p_since: since }, { useAuth: true });
  }

  function pushCall(payload, base, keepalive) {
    const acc = account();
    if (acc.type === 'key') return rpc('fl_key_push', { p_token: acc.token, p_payload: payload, p_base: base }, { keepalive });
    return rpc('fl_push', { p_payload: payload, p_base: base }, { useAuth: true, keepalive });
  }

  function buildPayload(data) {
    const mtimes = readMtimes();
    const mtime = {};
    Object.keys(data).forEach(k => { if (mtimes[k]) mtime[k] = mtimes[k]; });
    return JSON.stringify({ v: 1, app: 'focuslist', savedAt: Date.now(), data, mtime });
  }

  function decodePayload(text) {
    const obj = JSON.parse(text);
    if (!isObj(obj) || !isObj(obj.data)) throw new Error('Unreadable cloud data');
    const data = {};
    Object.keys(obj.data).forEach(k => {
      if (isTracked(k) && typeof obj.data[k] === 'string') data[k] = obj.data[k];
    });
    return { data, mtime: isObj(obj.mtime) ? obj.mtime : {} };
  }

  // ---------------------------------------------------------------------------
  // Sync loop
  // ---------------------------------------------------------------------------
  let syncTimer = null;
  let running = false;
  let rerun = false;
  let status = 'off';
  let lastError = '';

  function setStatus(next, error) {
    status = next;
    lastError = error || '';
    document.querySelectorAll('[data-fl-sync-dot]').forEach(dot => { dot.dataset.state = next; });
    renderModal();
  }

  function scheduleSync(delay) {
    if (!account()) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => syncNow(), delay);
  }

  function withLock(fn) {
    if (navigator.locks && navigator.locks.request) {
      return navigator.locks.request('fl-sync', fn);
    }
    return fn();
  }

  async function syncNow(options) {
    const opts = options || {};
    if (!account() || !CONFIGURED) return;
    if (running) { rerun = true; return; }
    if (navigator.onLine === false) { setStatus('offline'); return; }
    running = true;
    setStatus('syncing');
    let changedKeys = [];
    try {
      await withLock(async () => {
        for (let attempt = 0; attempt < 4; attempt++) {
          const st = readState();
          if (!st.account) return;
          const base = readBase();
          const local = readLocal();
          const version = st.version || 0;
          const dirty = !same(sortKeys(local), sortKeys(base)) || !st.version;
          const due = opts.forcePull || attempt > 0 || !st.lastPull || Date.now() - st.lastPull > PULL_INTERVAL;

          let remote = null;
          let remoteVersion = version;
          if (due) {
            const res = await pullCall(attempt > 0 ? -1 : version);
            if (!res.ok) throw serverError(res);
            st.lastPull = Date.now();
            remoteVersion = res.version || 0;
            if (typeof res.payload === 'string' && res.payload) remote = decodePayload(res.payload);
          }

          let merged = local;
          let nextBase = base;
          if (remote) {
            merged = mergeAll(base, local, remote.data, readMtimes(), remote.mtime);
            changedKeys = changedKeys.concat(applyToLocal(merged, local));
            nextBase = remote.data;
          }

          const needPush = remote ? !same(sortKeys(merged), sortKeys(remote.data)) : (dirty && Object.keys(merged).length > 0);
          if (!needPush) {
            st.version = remoteVersion;
            st.lastSyncAt = Date.now();
            writeState(st);
            writeJSON(BASE_KEY, nextBase);
            return;
          }

          const res = await pushCall(buildPayload(merged), remoteVersion);
          if (res.ok) {
            st.version = res.version;
            st.lastSyncAt = Date.now();
            writeState(st);
            writeJSON(BASE_KEY, merged);
            return;
          }
          if (res.error !== 'conflict') throw serverError(res);
          // Another device saved first: pull its data, merge again, retry
          writeState(st);
        }
        throw new Error('Could not finish syncing, will retry shortly');
      });
      setStatus('synced');
    } catch (err) {
      handleSyncError(err);
    } finally {
      running = false;
      refreshPageAfter(changedKeys);
      if (rerun) {
        rerun = false;
        scheduleSync(500);
      }
    }
  }

  function sortKeys(obj) {
    const out = {};
    Object.keys(obj).sort().forEach(k => { out[k] = obj[k]; });
    return out;
  }

  function serverError(res) {
    const err = new Error(res.error || 'sync_failed');
    err.code = res.error;
    return err;
  }

  function handleSyncError(err) {
    if (err && (err.code === 'session_expired' || err.code === 'not_signed_in' || err.status === 401)) {
      setStatus('error', 'You were signed out. Please sign in again to keep syncing.');
      clearAccount(false);
      toast('Cloud sync paused: please sign in again.', 'Sign in', openAccount, 12000);
      return;
    }
    if (err && err.code === 'too_large') {
      setStatus('error', 'Your data is too large to sync (over 1.5 MB). Download a backup and remove old tasks.');
      return;
    }
    if (navigator.onLine === false || (err && err.name === 'TypeError')) {
      setStatus('offline', 'Offline: changes are saved on this device and will sync when you are back online.');
      return;
    }
    console.warn('[sync]', err);
    setStatus('error', (err && err.message) || 'Sync failed');
    scheduleSync(30000);
  }

  // Last-chance upload when the tab is hidden or closed
  function flushOnHide() {
    const st = readState();
    if (!st.account || !CONFIGURED || running) return;
    const local = readLocal();
    if (same(sortKeys(local), sortKeys(readBase())) || !st.version) return;
    pushCall(buildPayload(local), st.version, true).then(res => {
      if (res && res.ok) {
        const s = readState();
        s.version = res.version;
        s.lastSyncAt = Date.now();
        writeState(s);
        writeJSON(BASE_KEY, local);
      }
    }).catch(() => { });
  }

  // ---------------------------------------------------------------------------
  // Accounts
  // ---------------------------------------------------------------------------
  function setAccount(acc) {
    const prev = readState().account;
    const sameAccount = prev && acc && prev.type === acc.type && prev.id === acc.id;
    const st = sameAccount ? readState() : {};
    st.account = acc;
    writeState(st);
    if (!sameAccount) {
      // New account on this device: merge everything (nothing counts as "deleted")
      writeJSON(BASE_KEY, {});
    }
  }

  function clearAccount(alsoClearData) {
    writeState({});
    lsRemove(BASE_KEY);
    lsRemove(MTIME_KEY);
    if (alsoClearData) {
      applyingRemote = true;
      Object.keys(readLocal()).forEach(lsRemove);
      applyingRemote = false;
    }
    setStatus('off');
  }

  function loadSdk() {
    if (!CONFIGURED) return Promise.reject(new Error('Cloud sync is not configured'));
    if (sdkPromise) return sdkPromise;
    sdkPromise = new Promise((resolve, reject) => {
      const done = () => {
        try {
          sb = window.supabase.createClient(API, CFG.anonKey, {
            auth: {
              persistSession: true,
              autoRefreshToken: true,
              detectSessionInUrl: true,
              flowType: 'implicit',
              storageKey: AUTH_STORAGE_KEY
            }
          });
          sb.auth.onAuthStateChange((event, session) => onAuthChange(event, session));
          resolve(sb);
        } catch (e) {
          reject(e);
        }
      };
      if (window.supabase && window.supabase.createClient) return done();
      const s = document.createElement('script');
      s.src = SDK_URL;
      s.async = true;
      s.onload = done;
      s.onerror = () => {
        sdkPromise = null;
        reject(new Error('Could not load the sign-in library. Check your connection.'));
      };
      document.head.appendChild(s);
    });
    return sdkPromise;
  }

  function onAuthChange(event, session) {
    const acc = account();
    if (session && session.user) {
      const user = session.user;
      const next = {
        type: 'auth',
        id: user.id,
        label: user.email || (user.user_metadata && user.user_metadata.full_name) || 'Google account',
        provider: (user.app_metadata && user.app_metadata.provider) || 'email'
      };
      const isNew = !acc || acc.type !== 'auth' || acc.id !== user.id;
      if (isNew) {
        setAccount(next);
        modalView = 'main';
        renderModal();
        toast(`Signed in as ${next.label}. Syncing your data…`);
        syncNow({ forcePull: true });
      }
      // Remove #access_token=... from the address bar after a Google/email sign-in
      if (location.hash && /access_token|refresh_token|error_description/.test(location.hash)) {
        history.replaceState(null, '', location.pathname + location.search);
      }
    } else if (event === 'SIGNED_OUT' && acc && acc.type === 'auth') {
      clearAccount(false);
    }
  }

  async function signInGoogle() {
    await loadSdk();
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: location.origin + location.pathname }
    });
    if (error) throw error;
  }

  async function sendEmailCode(email) {
    await loadSdk();
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: location.origin + location.pathname, shouldCreateUser: true }
    });
    if (error) throw error;
  }

  async function verifyEmailCode(email, code) {
    await loadSdk();
    const { error } = await sb.auth.verifyOtp({ email, token: code, type: 'email' });
    if (error) throw error;
  }

  async function keyRegister(username, key) {
    const res = await rpc('fl_key_register', { p_username: username, p_key: key });
    if (!res.ok) throw serverError(res);
    setAccount({ type: 'key', id: res.username, label: res.username, token: res.token });
    await syncNow({ forcePull: true });
  }

  async function keyLogin(username, key) {
    const res = await rpc('fl_key_login', { p_username: username, p_key: key });
    if (!res.ok) throw serverError(res);
    setAccount({ type: 'key', id: res.username, label: res.username, token: res.token });
    await syncNow({ forcePull: true });
  }

  async function signOut(alsoClearData) {
    const acc = account();
    // Upload anything not yet synced before leaving
    try { await syncNow(); } catch (e) { }
    try {
      if (acc && acc.type === 'key') await rpc('fl_key_logout', { p_token: acc.token });
      if (acc && acc.type === 'auth') { await loadSdk(); await sb.auth.signOut(); }
    } catch (e) { }
    clearAccount(alsoClearData);
    if (alsoClearData) location.reload();
  }

  async function deleteCloudData() {
    const acc = account();
    if (!acc) return;
    const res = acc.type === 'key'
      ? await rpc('fl_key_delete', { p_token: acc.token })
      : await rpc('fl_delete_my_data', {}, { useAuth: true });
    if (!res.ok) throw serverError(res);
    if (acc.type === 'auth') { try { await sb.auth.signOut(); } catch (e) { } }
    clearAccount(false);
  }

  // ---------------------------------------------------------------------------
  // Backup file
  // ---------------------------------------------------------------------------
  function downloadBackup() {
    const data = readLocal();
    const blob = new Blob([JSON.stringify({ app: 'focuslist', v: 1, exportedAt: new Date().toISOString(), data }, null, 2)],
      { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `focus-list-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  function restoreBackup(file) {
    return file.text().then(text => {
      const obj = JSON.parse(text);
      const data = obj && isObj(obj.data) ? obj.data : null;
      if (!data) throw new Error('This file is not a Focus List backup.');
      const keys = Object.keys(data).filter(k => isTracked(k) && typeof data[k] === 'string');
      if (!keys.length) throw new Error('The backup file contains no data.');
      keys.forEach(k => localStorage.setItem(k, data[k])); // tracked: will sync if signed in
      return keys.length;
    });
  }

  // ---------------------------------------------------------------------------
  // UI: toast + account modal
  // ---------------------------------------------------------------------------
  const esc = s => String(s ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[ch]);

  function toast(message, actionLabel, action, duration) {
    let wrap = document.querySelector('.fl-toast-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'fl-toast-wrap';
      wrap.setAttribute('role', 'status');
      wrap.setAttribute('aria-live', 'polite');
      document.body.appendChild(wrap);
    }
    const el = document.createElement('div');
    el.className = 'fl-toast';
    el.innerHTML = `<span>${esc(message)}</span>${actionLabel ? `<button type="button">${esc(actionLabel)}</button>` : ''}`;
    if (actionLabel) {
      el.querySelector('button').addEventListener('click', () => { el.remove(); action(); });
    }
    wrap.appendChild(el);
    setTimeout(() => el.remove(), duration || 4000);
  }

  let modal = null;
  let modalView = 'main';   // main | email-code | key-created
  let authTab = 'google';   // google | email | key
  let pendingEmail = '';
  let createdKey = null;
  let busy = false;
  let message = null;       // { kind, text }

  const ERROR_TEXT = {
    bad_credentials: 'Wrong username or secret key.',
    username_taken: 'That username is taken. Try another one.',
    bad_username: 'Username: 3–32 characters, letters, numbers, dot, dash or underscore.',
    weak_key: 'The secret key must be at least 10 characters.',
    locked: 'Too many wrong attempts. Try again in 15 minutes.',
    session_expired: 'Your session ended. Please sign in again.'
  };

  function friendlyError(err) {
    if (err && err.code && ERROR_TEXT[err.code]) return ERROR_TEXT[err.code];
    const text = (err && err.message) || 'Something went wrong. Please try again.';
    if (/rate limit|too many/i.test(text)) return 'Too many requests. Please wait a minute and try again.';
    if (/Failed to fetch|NetworkError|Load failed/i.test(text)) return 'No connection. Check your internet and try again.';
    if (/Token has expired|invalid/i.test(text) && modalView === 'email-code') return 'That code is wrong or expired. Request a new one.';
    return text;
  }

  function generateKey() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = new Uint8Array(20);
    crypto.getRandomValues(bytes);
    const chars = Array.from(bytes, b => alphabet[b % alphabet.length]).join('');
    return chars.match(/.{5}/g).join('-');
  }

  function statusText() {
    const st = readState();
    if (status === 'syncing') return 'Syncing…';
    if (status === 'error') return lastError || 'Sync problem';
    if (status === 'offline') return lastError || 'Offline: will sync when you reconnect.';
    if (st.lastSyncAt) {
      const mins = Math.round((Date.now() - st.lastSyncAt) / 60000);
      return `Synced ${mins <= 0 ? 'just now' : mins === 1 ? '1 minute ago' : mins < 60 ? `${mins} minutes ago` : new Date(st.lastSyncAt).toLocaleString()}`;
    }
    return 'Not synced yet';
  }

  function ensureModal() {
    if (modal) return modal;
    modal = document.createElement('div');
    modal.className = 'fl-modal';
    modal.hidden = true;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Account and sync');
    modal.innerHTML = '<div class="fl-modal-backdrop" data-fl-dismiss></div><div class="fl-modal-card"></div>';
    document.body.appendChild(modal);

    modal.addEventListener('click', onModalClick);
    modal.addEventListener('submit', onModalSubmit);
    modal.addEventListener('change', e => {
      if (e.target.matches('[data-restore-file]') && e.target.files[0]) {
        const file = e.target.files[0];
        if (!confirm('Restore this backup? Matching data on this device will be replaced by the backup.')) return;
        restoreBackup(file)
          .then(n => {
            message = { kind: 'ok', text: `Restored ${n} items. Reloading…` };
            renderModal();
            setTimeout(() => location.reload(), 900);
          })
          .catch(err => { message = { kind: 'error', text: friendlyError(err) }; renderModal(); });
      }
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && modal && !modal.hidden) closeAccount();
    });
    return modal;
  }

  function openAccount() {
    ensureModal();
    message = null;
    if (!account() && modalView === 'key-created') modalView = 'main';
    modal.hidden = false;
    document.documentElement.classList.add('fl-lock-scroll');
    renderModal();
    const first = modal.querySelector('input, button.fl-btn-primary, button.fl-btn');
    if (first && window.matchMedia('(hover: hover)').matches) first.focus();
    // Warm up the sign-in library so Google/email buttons respond instantly
    if (CONFIGURED && !account()) loadSdk().catch(() => { });
  }

  function closeAccount() {
    if (!modal) return;
    modal.hidden = true;
    // Don't leave a typed secret key sitting in the page
    modal.querySelectorAll('input[name="key"]').forEach(i => { i.value = ''; i.type = 'password'; });
    document.documentElement.classList.remove('fl-lock-scroll');
    if (modalView === 'key-created') modalView = 'main';
  }

  function renderModal() {
    if (!modal || modal.hidden) return;
    const card = modal.querySelector('.fl-modal-card');
    const acc = account();
    let html = `<button type="button" class="fl-icon-btn fl-close-x" data-fl-dismiss aria-label="Close">✕</button>`;

    if (modalView === 'key-created' && acc && createdKey) {
      html += `
        <h2>Save your secret key</h2>
        <p class="fl-muted">This key is the <strong>only</strong> way to open your data on another phone or computer. We can't recover it if you lose it.</p>
        <div class="fl-section">
          <div class="fl-muted">Username</div>
          <div class="fl-keybox">${esc(acc.label)}</div>
          <div class="fl-muted">Secret key</div>
          <div class="fl-keybox">${esc(createdKey)}</div>
          <div class="fl-row">
            <button type="button" class="fl-btn" data-action="copy-key">Copy both</button>
            <button type="button" class="fl-btn" data-action="download-key">Save as file</button>
          </div>
          <button type="button" class="fl-btn fl-btn-primary" data-action="key-saved">I saved it</button>
        </div>`;
    } else if (acc) {
      html += `
        <h2>Your account</h2>
        <p class="fl-muted">Signed in as <strong>${esc(acc.label)}</strong>${acc.type === 'key' ? ' (username)' : ''}. Your tasks, habits, goals and settings sync automatically to every device where you sign in.</p>
        <div class="fl-section">
          <div class="fl-status-line"><span class="fl-sync-dot" data-state="${esc(status)}"></span><span>${esc(statusText())}</span></div>
          <button type="button" class="fl-btn fl-btn-primary" data-action="sync-now" ${busy || status === 'syncing' ? 'disabled' : ''}>Sync now</button>
        </div>
        ${messageHtml()}
        ${backupHtml()}
        <div class="fl-section">
          <h3>Sign out</h3>
          <p class="fl-muted">On a shared or public computer, also remove the data from this device.</p>
          <div class="fl-row">
            <button type="button" class="fl-btn" data-action="signout">Sign out</button>
            <button type="button" class="fl-btn fl-btn-danger" data-action="signout-clear">Sign out &amp; clear device</button>
          </div>
          <button type="button" class="fl-btn fl-btn-danger" data-action="delete-cloud" style="font-weight:500">Delete my cloud data</button>
        </div>`;
    } else if (!CONFIGURED) {
      html += `
        <h2>Keep your data safe</h2>
        <p class="fl-muted">Your data is saved in this browser only. Clearing browser data, switching browser or changing phone will not bring it along. Download a backup regularly, and restore it on any device.</p>
        ${messageHtml()}
        ${backupHtml()}
        <div class="fl-section">
          <h3>Cloud sync</h3>
          <p class="fl-muted">Account sync is not switched on for this site yet. (Site owner: add your Supabase URL and key to <code>supabase-config.js</code>, see DEPLOY_GUIDE.md.)</p>
        </div>`;
    } else if (modalView === 'email-code') {
      html += `
        <h2>Check your email</h2>
        <p class="fl-muted">We sent a sign-in email to <strong>${esc(pendingEmail)}</strong>. Tap the link in it, or type the 6-digit code here.</p>
        <form class="fl-section" data-form="email-code">
          <input class="fl-field" name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6,10}" maxlength="10" placeholder="123456" required aria-label="Code from email">
          <button class="fl-btn fl-btn-primary" type="submit" ${busy ? 'disabled' : ''}>${busy ? 'Checking…' : 'Sign in'}</button>
          <button class="fl-btn" type="button" data-action="email-back">Use a different email</button>
        </form>
        ${messageHtml()}
        <p class="fl-muted" style="margin-top:.75rem">No email? Check spam/promotions, or wait a minute and send again.</p>`;
    } else {
      const methods = [
        CFG.enableGoogle !== false && ['google', 'Google'],
        CFG.enableEmail !== false && ['email', 'Email'],
        CFG.enableUsername !== false && ['key', 'Username']
      ].filter(Boolean);
      if (!methods.some(m => m[0] === authTab)) authTab = methods[0] ? methods[0][0] : 'google';
      html += `
        <h2>Sync across your devices</h2>
        <p class="fl-muted">Free. Sign in once and your tasks, habits and goals follow you to any phone, tablet or computer. Data on this device is kept and merged into your account.</p>
        <div class="fl-section">
          ${methods.length > 1 ? `<div class="fl-tabs" role="tablist">${methods.map(([id, label]) =>
            `<button type="button" role="tab" aria-selected="${authTab === id}" data-tab="${id}">${label}</button>`).join('')}</div>` : ''}
          ${authTab === 'google' ? `
            <button type="button" class="fl-btn fl-btn-google" data-action="google" ${busy ? 'disabled' : ''}>
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
              Continue with Google
            </button>
            <p class="fl-muted">Fastest option. Nothing to remember.</p>` : ''}
          ${authTab === 'email' ? `
            <form data-form="email" style="display:grid;gap:.6rem">
              <input class="fl-field" type="email" name="email" autocomplete="email" placeholder="you@example.com" required aria-label="Email address" value="${esc(pendingEmail)}">
              <button class="fl-btn fl-btn-primary" type="submit" ${busy ? 'disabled' : ''}>${busy ? 'Sending…' : 'Email me a sign-in code'}</button>
            </form>
            <p class="fl-muted">No password. We email you a link and a code each time you sign in on a new device.</p>` : ''}
          ${authTab === 'key' ? `
            <form data-form="key" style="display:grid;gap:.6rem">
              <input class="fl-field" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="Username" required aria-label="Username" maxlength="32">
              <input class="fl-field" name="key" type="password" autocomplete="current-password" placeholder="Secret key (10+ characters)" required aria-label="Secret key" minlength="10" maxlength="200">
              <div class="fl-row">
                <button class="fl-btn fl-btn-primary" type="submit" data-mode="login" ${busy ? 'disabled' : ''}>Sign in</button>
                <button class="fl-btn" type="submit" data-mode="register" ${busy ? 'disabled' : ''}>Create account</button>
              </div>
              <button class="fl-btn" type="button" data-action="gen-key">Generate a strong key for me</button>
            </form>
            <p class="fl-muted">No email needed. Pick a username and a secret key; use them to open your data anywhere. <strong>A lost key cannot be recovered.</strong></p>` : ''}
        </div>
        ${messageHtml()}
        ${backupHtml()}`;
    }

    // Re-rendering must not wipe what the user is typing (e.g. after an error message)
    const kept = {};
    card.querySelectorAll('form[data-form] input').forEach(i => {
      kept[`${i.form.dataset.form}:${i.name}`] = { value: i.value, type: i.type };
    });
    card.innerHTML = html;
    card.querySelectorAll('form[data-form] input').forEach(i => {
      const k = kept[`${i.form.dataset.form}:${i.name}`];
      if (k && !i.value) {
        i.value = k.value;
        if (i.name === 'key') i.type = k.type;
      }
    });
  }

  function messageHtml() {
    return message ? `<div class="fl-msg" data-kind="${esc(message.kind)}" role="alert" style="margin-top:.75rem">${esc(message.text)}</div>` : '';
  }

  function backupHtml() {
    return `
      <div class="fl-section">
        <h3>Backup file</h3>
        <div class="fl-row">
          <button type="button" class="fl-btn" data-action="backup">Download backup</button>
          <label class="fl-btn" style="position:relative">Restore backup
            <input type="file" accept="application/json,.json" data-restore-file style="position:absolute;inset:0;opacity:0;cursor:pointer">
          </label>
        </div>
      </div>`;
  }

  async function run(fn) {
    if (busy) return;
    busy = true;
    message = null;
    renderModal();
    try {
      await fn();
    } catch (err) {
      message = { kind: 'error', text: friendlyError(err) };
    } finally {
      busy = false;
      renderModal();
    }
  }

  function onModalClick(e) {
    if (e.target.closest('[data-fl-dismiss]')) return closeAccount();
    const tab = e.target.closest('[data-tab]');
    if (tab) {
      authTab = tab.dataset.tab;
      message = null;
      return renderModal();
    }
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const acc = account();

    if (action === 'google') return run(signInGoogle);
    if (action === 'email-back') { modalView = 'main'; message = null; return renderModal(); }
    if (action === 'gen-key') {
      const input = modal.querySelector('input[name="key"]');
      input.type = 'text';
      input.value = generateKey();
      message = { kind: 'ok', text: 'Key generated. Pick a username and tap "Create account". You will be asked to save it.' };
      return renderModal();
    }
    if (action === 'sync-now') return run(() => syncNow({ forcePull: true }));
    if (action === 'backup') return downloadBackup();
    if (action === 'copy-key' && acc) {
      const text = `Focus List\nUsername: ${acc.label}\nSecret key: ${createdKey}`;
      navigator.clipboard?.writeText(text).then(() => toast('Copied. Paste it somewhere safe.'), () => toast('Copy failed. Write it down instead.'));
      return;
    }
    if (action === 'download-key' && acc) {
      const blob = new Blob([`Focus List account\n\nUsername: ${acc.label}\nSecret key: ${createdKey}\n\nKeep this file private. Anyone with it can open your data.\n`], { type: 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'focus-list-secret-key.txt';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      return;
    }
    if (action === 'key-saved') { modalView = 'main'; createdKey = null; return renderModal(); }
    if (action === 'signout') return run(() => signOut(false));
    if (action === 'signout-clear') {
      if (!confirm('Sign out and remove all Focus List data from this device? Your cloud copy stays safe.')) return;
      return run(() => signOut(true));
    }
    if (action === 'delete-cloud') {
      if (!confirm('Permanently delete your cloud data? Data on this device is kept. This cannot be undone.')) return;
      return run(async () => {
        await deleteCloudData();
        message = { kind: 'ok', text: 'Your cloud data was deleted and you are signed out.' };
      });
    }
  }

  function onModalSubmit(e) {
    const form = e.target.closest('form[data-form]');
    if (!form) return;
    e.preventDefault();
    const kind = form.dataset.form;
    const data = new FormData(form);

    if (kind === 'email') {
      const email = String(data.get('email') || '').trim();
      return run(async () => {
        await sendEmailCode(email);
        pendingEmail = email;
        modalView = 'email-code';
      });
    }
    if (kind === 'email-code') {
      const code = String(data.get('code') || '').replace(/\s/g, '');
      return run(async () => {
        await verifyEmailCode(pendingEmail, code);
        modalView = 'main';
      });
    }
    if (kind === 'key') {
      const mode = (e.submitter && e.submitter.dataset.mode) || 'login';
      const username = String(data.get('username') || '').trim().toLowerCase();
      const key = String(data.get('key') || '');
      if (mode === 'register') {
        if (!/^[a-z0-9][a-z0-9_.-]{2,31}$/.test(username)) {
          message = { kind: 'error', text: ERROR_TEXT.bad_username };
          return renderModal();
        }
        if (key.length < 10) {
          message = { kind: 'error', text: ERROR_TEXT.weak_key };
          return renderModal();
        }
        return run(async () => {
          await keyRegister(username, key);
          createdKey = key;
          modalView = 'key-created';
        });
      }
      return run(async () => {
        await keyLogin(username, key);
        toast(`Signed in as ${username}. Your data is syncing.`);
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Start-up
  // ---------------------------------------------------------------------------
  function start() {
    const acc = account();
    setStatus(acc ? (navigator.onLine === false ? 'offline' : 'synced') : 'off');

    if (CONFIGURED) {
      const returningFromAuth = /access_token|error_description|refresh_token/.test(location.hash) || /[?&]code=/.test(location.search);
      if (returningFromAuth || (acc && acc.type === 'auth') || lsGet(AUTH_STORAGE_KEY)) {
        loadSdk().catch(err => {
          console.warn('[sync]', err);
          if (acc) setStatus('offline', 'Could not reach the sign-in service. Your changes are kept on this device.');
        });
        if (/error_description/.test(location.hash)) {
          const params = new URLSearchParams(location.hash.slice(1));
          toast(`Sign-in failed: ${params.get('error_description') || 'please try again'}`, null, null, 8000);
          history.replaceState(null, '', location.pathname + location.search);
        }
      }
      if (acc) setTimeout(() => syncNow(), acc.type === 'auth' ? 1200 : 400);
    }

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flushOnHide();
      else if (account()) syncNow();
    });
    window.addEventListener('pagehide', flushOnHide);
    window.addEventListener('online', () => { if (account()) syncNow({ forcePull: true }); });
    window.addEventListener('offline', () => { if (account()) setStatus('offline', 'Offline: changes are saved on this device.'); });
    setInterval(() => {
      if (account() && document.visibilityState === 'visible') syncNow();
    }, IDLE_PULL_INTERVAL);

    // Another tab signed in/out or finished a sync
    window.addEventListener('storage', e => {
      if (e.key === STATE_KEY) setStatus(account() ? 'synced' : 'off');
    });

    // Gentle nudge for people who have data but no account and no recent backup
    if (!acc && CONFIGURED) {
      const local = readLocal();
      const hasData = (parse(local.focuslist_tasks_v1) || []).length > 2 ||
        Object.keys(local).some(k => k.startsWith('habits_'));
      const lastNudge = Number(lsGet('fl_sync_nudge') || 0);
      if (hasData && Date.now() - lastNudge > 3 * 24 * 3600 * 1000) {
        setTimeout(() => {
          lsSet('fl_sync_nudge', String(Date.now()));
          toast('Your data lives only in this browser. Sign in (free) to keep it safe on every device.', 'Set up', openAccount, 9000);
        }, 4000);
      }
    }
  }

  window.FLSync = { openAccount, closeAccount, syncNow, toast, downloadBackup, status: () => status, account };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
