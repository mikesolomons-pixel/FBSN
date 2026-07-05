/**
 * supabase-shim.js — tiny compatibility layer for the Supabase-style
 * query API on top of window.dataStore.
 *
 * Only used by code that hasn't been rewritten to call dataStore
 * directly (clients.html is the big one). All read/write goes to
 * browser localStorage. Realtime, auth, storage, and RPC are stubs.
 *
 * Everything is chainable and thenable so you can still write
 * `const { data, error } = await sb.from('X').select('*').eq(...)`.
 */
(function () {
  'use strict';

  function tableStore(name) {
    var s = window.dataStore;
    if (!s) return null;
    if (name === 'clients')      return s.clients;
    if (name === 'projects')     return s.projects;
    if (name === 'artifacts')    return s.artifacts;
    if (name === 'stage_tasks')  return (s.stageTasks = s.stageTasks || makeStore(s, 'stage-tasks'));
    return null;
  }

  // Late-init helper so we can add a "stage_tasks" collection to dataStore
  // even though local-store.js didn't ship one by default.
  function makeStore(ds) {
    // Piggyback on the existing add/update/remove pattern.
    var LS_KEY = 'fbsn:local:stage-tasks';
    function read() { try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch (e) { return []; } }
    function write(v) { try { localStorage.setItem(LS_KEY, JSON.stringify(v)); } catch (e) {} }
    function uid() { return (crypto && crypto.randomUUID) ? crypto.randomUUID() : 'x-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8); }
    return {
      list: async function () { return read(); },
      add: async function (row) {
        var rows = read();
        var rec = Object.assign({ id: uid(), created_at: new Date().toISOString() }, row);
        rows.push(rec); write(rows); return rec;
      },
      update: async function (id, patch) {
        var rows = read();
        var i = rows.findIndex(function (r) { return r.id === id; });
        if (i === -1) return null;
        rows[i] = Object.assign({}, rows[i], patch);
        write(rows); return rows[i];
      },
      remove: async function (id) { write(read().filter(function (r) { return r.id !== id; })); return true; }
    };
  }

  function applyFilters(rows, filters) {
    return rows.filter(function (r) {
      return filters.every(function (f) {
        if (f.op === 'eq') return r[f.col] === f.val;
        if (f.op === 'neq') return r[f.col] !== f.val;
        if (f.op === 'in') return f.val.indexOf(r[f.col]) !== -1;
        return true;
      });
    });
  }

  function selectQuery(table) {
    var filters = [];
    var orderCol = null;
    var orderAsc = true;
    var limitN = null;
    var mode = 'list'; // 'list' | 'single' | 'maybeSingle'

    async function exec() {
      var store = tableStore(table);
      if (!store) return { data: null, error: new Error('unknown table: ' + table) };
      var rows = applyFilters(await store.list(), filters);
      if (orderCol) {
        rows = rows.slice().sort(function (a, b) {
          var av = a[orderCol], bv = b[orderCol];
          if (av == null && bv == null) return 0;
          if (av == null) return orderAsc ? 1 : -1;
          if (bv == null) return orderAsc ? -1 : 1;
          if (av === bv) return 0;
          return orderAsc ? (av < bv ? -1 : 1) : (av > bv ? -1 : 1);
        });
      }
      if (limitN != null) rows = rows.slice(0, limitN);
      if (mode === 'single') {
        if (rows.length === 0) return { data: null, error: { message: 'no rows', code: 'PGRST116' } };
        return { data: rows[0], error: null };
      }
      if (mode === 'maybeSingle') {
        return { data: rows[0] || null, error: null };
      }
      return { data: rows, error: null };
    }

    var chain = {
      select: function () { return chain; },
      eq: function (col, val) { filters.push({ op: 'eq', col: col, val: val }); return chain; },
      neq: function (col, val) { filters.push({ op: 'neq', col: col, val: val }); return chain; },
      in: function (col, arr) { filters.push({ op: 'in', col: col, val: arr }); return chain; },
      order: function (col, opts) { orderCol = col; orderAsc = !(opts && opts.ascending === false); return chain; },
      limit: function (n) { limitN = n; return chain; },
      single: function () { mode = 'single'; return exec(); },
      maybeSingle: function () { mode = 'maybeSingle'; return exec(); },
      then: function (ok, err) { return exec().then(ok, err); }
    };
    return chain;
  }

  function insertOp(table, payload) {
    async function exec(withSelect, singleMode) {
      var store = tableStore(table);
      if (!store) return { data: null, error: new Error('unknown table: ' + table) };
      var rows = Array.isArray(payload) ? payload : [payload];
      var created = [];
      for (var i = 0; i < rows.length; i++) created.push(await store.add(rows[i]));
      if (withSelect && singleMode) return { data: created[0] || null, error: null };
      if (withSelect) return { data: created, error: null };
      return { data: null, error: null };
    }
    var withSelect = false;
    var chain = {
      select: function () {
        withSelect = true;
        return {
          single: function () { return exec(true, true); },
          then: function (ok, err) { return exec(true, false).then(ok, err); }
        };
      },
      then: function (ok, err) { return exec(withSelect, false).then(ok, err); }
    };
    return chain;
  }

  function updateOp(table, patch) {
    var filters = [];
    var withSelect = false;
    async function exec(singleMode) {
      var store = tableStore(table);
      if (!store) return { data: null, error: new Error('unknown table: ' + table) };
      var rows = applyFilters(await store.list(), filters);
      var updated = [];
      for (var i = 0; i < rows.length; i++) {
        var u = await store.update(rows[i].id, patch);
        if (u) updated.push(u);
      }
      if (withSelect && singleMode) return { data: updated[0] || null, error: null };
      if (withSelect) return { data: updated, error: null };
      return { data: null, error: null };
    }
    var chain = {
      eq: function (col, val) { filters.push({ op: 'eq', col: col, val: val }); return chain; },
      select: function () {
        withSelect = true;
        return {
          single: function () { return exec(true); },
          then: function (ok, err) { return exec(false).then(ok, err); }
        };
      },
      then: function (ok, err) { return exec(false).then(ok, err); }
    };
    return chain;
  }

  function deleteOp(table) {
    var filters = [];
    async function exec() {
      var store = tableStore(table);
      if (!store) return { data: null, error: new Error('unknown table: ' + table) };
      var rows = applyFilters(await store.list(), filters);
      for (var i = 0; i < rows.length; i++) await store.remove(rows[i].id);
      return { data: null, error: null };
    }
    var chain = {
      eq: function (col, val) { filters.push({ op: 'eq', col: col, val: val }); return chain; },
      then: function (ok, err) { return exec().then(ok, err); }
    };
    return chain;
  }

  function fromTable(table) {
    return {
      select: function () { return selectQuery(table); },
      insert: function (payload) { return insertOp(table, payload); },
      update: function (patch)   { return updateOp(table, patch); },
      delete: function ()        { return deleteOp(table); }
    };
  }

  window.supabaseClient = {
    from: fromTable,
    auth: {
      getSession: async function () { return { data: { session: { user: { id: 'local', email: 'local@local' } } }, error: null }; },
      getUser:    async function () { return { data: { user: { id: 'local', email: 'local@local' } }, error: null }; },
      signInWithPassword: async function () { return { data: null, error: { message: 'local-only build' } }; },
      signUp:     async function () { return { data: null, error: { message: 'local-only build' } }; },
      signOut:    async function () { return { error: null }; }
    },
    storage: {
      from: function () { return { upload: async function () { return { data: null, error: { message: 'no storage' } }; }, getPublicUrl: function () { return { data: { publicUrl: '' } }; } }; }
    },
    channel: function () {
      return { on: function () { return this; }, send: function () {}, subscribe: function () { return this; }, unsubscribe: function () {} };
    },
    rpc: async function () { return { data: null, error: { message: 'no rpc' } }; }
  };
})();
