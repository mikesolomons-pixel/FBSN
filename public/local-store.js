/**
 * FBSN local data store — replaces the Supabase-backed layer.
 *
 * Read-only data (beliefs / practices / resources) is loaded from
 * bundled JSON files under /data/.  Write-only data (clients / projects
 * / artifacts) is persisted to browser localStorage.
 *
 * Everything is exposed as window.dataStore.
 *
 * See rebuild-supabase.md at the repo root for the path to bring
 * a cloud backend back if you ever need multi-device sync or a
 * multiplayer virtual session.
 */
(function () {
  'use strict';

  var LS_PREFIX = 'fbsn:local:';

  /* ── Static JSON cache ─────────────────────────────────── */
  var staticCache = {};
  async function loadStatic(name) {
    if (staticCache[name]) return staticCache[name];
    try {
      var res = await fetch('data/' + name + '.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error(name + ' load ' + res.status);
      var data = await res.json();
      staticCache[name] = data;
      return data;
    } catch (e) {
      console.error('[local-store] failed to load ' + name + ':', e);
      return [];
    }
  }

  /* ── localStorage-backed collections ───────────────────── */
  function readColl(key) {
    try {
      var raw = localStorage.getItem(LS_PREFIX + key);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }
  function writeColl(key, rows) {
    try { localStorage.setItem(LS_PREFIX + key, JSON.stringify(rows)); }
    catch (e) { console.error('[local-store] write ' + key + ':', e); }
  }
  function uuid() {
    if (crypto && crypto.randomUUID) return crypto.randomUUID();
    // Fallback for older browsers.
    return 'x-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }
  function nowIso() { return new Date().toISOString(); }

  function makeLocalCollection(name) {
    return {
      async list() { return readColl(name); },
      async get(id) { return readColl(name).find(function (r) { return r.id === id; }) || null; },
      async filter(pred) { return readColl(name).filter(pred); },
      async add(row) {
        var rows = readColl(name);
        var record = Object.assign({ id: uuid(), created_at: nowIso(), updated_at: nowIso() }, row);
        rows.push(record);
        writeColl(name, rows);
        return record;
      },
      async update(id, patch) {
        var rows = readColl(name);
        var idx = rows.findIndex(function (r) { return r.id === id; });
        if (idx === -1) return null;
        rows[idx] = Object.assign({}, rows[idx], patch, { updated_at: nowIso() });
        writeColl(name, rows);
        return rows[idx];
      },
      async remove(id) {
        var rows = readColl(name);
        var next = rows.filter(function (r) { return r.id !== id; });
        writeColl(name, next);
        return true;
      },
      async clear() { writeColl(name, []); },
      async replaceAll(rows) { writeColl(name, rows || []); }
    };
  }

  /* Resources — bundled seed + local additions (localStorage) */
  var localResources = makeLocalCollection('resources-local');
  var resourcesApi = {
    list: async function () {
      var bundled = await loadStatic('resources');
      var mine = await localResources.list();
      return bundled.concat(mine);
    },
    add:    function (row)     { return localResources.add(row); },
    update: function (id, p)   { return localResources.update(id, p); },
    remove: function (id)      { return localResources.remove(id); },
    isBundled: async function (id) {
      var b = await loadStatic('resources');
      return b.some(function (r) { return r.id === id; });
    }
  };

  /* ── Public API ────────────────────────────────────────── */
  window.dataStore = {
    beliefs:   { list: function () { return loadStatic('beliefs'); } },
    practices: { list: function () { return loadStatic('practices'); } },
    resources: resourcesApi,
    clients:   makeLocalCollection('clients'),
    projects:  makeLocalCollection('projects'),
    artifacts: makeLocalCollection('artifacts'),

    // Bulk export/import for backup, since everything lives in localStorage.
    exportAll: function () {
      return {
        clients:            readColl('clients'),
        projects:           readColl('projects'),
        artifacts:          readColl('artifacts'),
        'resources-local':  readColl('resources-local'),
        exportedAt: nowIso()
      };
    },
    importAll: function (bundle) {
      if (!bundle || typeof bundle !== 'object') return false;
      if (Array.isArray(bundle.clients))            writeColl('clients',            bundle.clients);
      if (Array.isArray(bundle.projects))           writeColl('projects',           bundle.projects);
      if (Array.isArray(bundle.artifacts))          writeColl('artifacts',          bundle.artifacts);
      if (Array.isArray(bundle['resources-local'])) writeColl('resources-local',    bundle['resources-local']);
      return true;
    }
  };
})();
