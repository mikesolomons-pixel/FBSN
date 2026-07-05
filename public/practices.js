/**
 * practices.js — Renders practices + beliefs for the play pages and
 * homepage. Reads from window.dataStore (bundled JSON in local-only
 * build). CRUD helpers are kept as no-ops so callers don't crash.
 *
 * The old flat "practices" and "play_practices" tables are replaced
 * by a single practices array where each row carries its own
 * play_number + sort_order.
 */
(function () {
  'use strict';

  async function store() {
    for (var i = 0; i < 30; i++) {
      if (window.dataStore) return window.dataStore;
      await new Promise(function (r) { setTimeout(r, 50); });
    }
    return null;
  }

  /* ── Practices ─────────────────────────────────────────── */
  async function fetchPractices() {
    var ds = await store();
    if (!ds) return [];
    return ds.practices.list();
  }

  // The old junction table is embedded in each practice row now.
  async function fetchPlayPractices() {
    var rows = await fetchPractices();
    // Fake the old shape: { id, play_number, practice_id, sort_order }
    return rows.map(function (p) {
      return {
        id: 'j-' + p.id,
        play_number: p.play_number,
        practice_id: p.id,
        sort_order: p.sort_order || 0
      };
    });
  }

  function readOnlyWarn() {
    console.warn('[practices] this build is local-only; edits to bundled practices are not supported.');
    return null;
  }
  var createPractice = readOnlyWarn;
  var updatePractice = readOnlyWarn;
  var deletePractice = readOnlyWarn;
  var assignPracticeToPlay = readOnlyWarn;
  var unassignPracticeFromPlay = readOnlyWarn;
  var updateSortOrder = readOnlyWarn;

  /* ── Beliefs ───────────────────────────────────────────── */
  async function fetchBeliefs() {
    var ds = await store();
    if (!ds) return [];
    return ds.beliefs.list();
  }
  var createBelief = readOnlyWarn;
  var updateBelief = readOnlyWarn;
  var deleteBelief = readOnlyWarn;

  /* ── Metadata ──────────────────────────────────────────── */
  var PLAY_NAMES = { 1: 'Sensemaking', 2: 'Imagining', 3: 'Navigating', 4: 'Collaborating', 5: 'Value Creating' };
  var PLAY_COLORS = { 1: '#00897B', 2: '#7C5CBF', 3: '#E07A5F', 4: '#D4A843', 5: '#1B2A4A' };

  function esc(s) {
    if (!s) return '';
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  /* ── Play-page practices renderer ──────────────────────── */
  async function renderPlayPage(playNumber, containerId) {
    var container = document.getElementById(containerId || 'practices-container');
    if (!container) return;
    container.innerHTML = '<p style="font-size:.85rem;color:var(--text-secondary,#5A6B8A);padding:1rem 0;">Loading practices...</p>';

    var all = await fetchPractices();
    var forPlay = all
      .filter(function (p) { return p.play_number === playNumber; })
      .sort(function (a, b) { return (a.sort_order || 0) - (b.sort_order || 0); });

    if (!forPlay.length) {
      container.innerHTML = '<p style="font-size:.85rem;color:var(--text-secondary,#5A6B8A);padding:1rem 0;">No practices assigned to this play yet.</p>';
      return;
    }

    var html = '';
    forPlay.forEach(function (p, idx) {
      var num = idx + 1;
      var modes = Array.isArray(p.modes) ? p.modes : [];
      var outcomes = Array.isArray(p.outcomes) ? p.outcomes : [];
      var outputs = Array.isArray(p.outputs) ? p.outputs : [];
      var actionLinks = Array.isArray(p.action_links) ? p.action_links : [];
      var resId = p.resource_play_id || ('p-' + p.id);
      var statusClass = p.status === 'automated' ? 'available' : 'coming-soon';
      var statusLabel = p.status === 'automated' ? 'Automated' : 'Coming Soon';

      var modesHtml = '';
      if (modes.length) {
        modesHtml = '<div class="practice-section">' +
          '<h4 style="font-size:.8rem;font-weight:700;color:var(--navy);text-transform:uppercase;letter-spacing:1px;margin-bottom:.5rem;">How to Run It</h4>' +
          '<div class="key-points">' +
          modes.map(function (m) { return '<div class="key-point"><div class="dot"></div><span><strong>' + esc(m.label) + '</strong> &mdash; ' + esc(m.description) + '</span></div>'; }).join('') +
          '</div></div>';
      }
      var outcomesHtml = '';
      if (outcomes.length) {
        outcomesHtml = '<div class="practice-section" style="margin-top:1rem;">' +
          '<h4 style="font-size:.8rem;font-weight:700;color:var(--navy);text-transform:uppercase;letter-spacing:1px;margin-bottom:.5rem;">Outcomes</h4>' +
          '<div class="key-points">' +
          outcomes.map(function (o) { return '<div class="key-point"><div class="dot"></div><span>' + esc(o) + '</span></div>'; }).join('') +
          '</div></div>';
      }
      var outputsHtml = '';
      if (outputs.length) {
        outputsHtml = '<div class="practice-section" style="margin-top:1rem;">' +
          '<h4 style="font-size:.8rem;font-weight:700;color:var(--navy);text-transform:uppercase;letter-spacing:1px;margin-bottom:.5rem;">Outputs</h4>' +
          '<div class="key-points">' +
          outputs.map(function (o) { return '<div class="key-point"><div class="dot"></div><span>' + esc(o) + '</span></div>'; }).join('') +
          '</div></div>';
      }
      var actionsHtml = '';
      if (actionLinks.length) {
        actionsHtml = actionLinks.map(function (l) {
          if (l.style === 'disabled' || !l.url) return '<span class="action-btn disabled">' + esc(l.label) + '</span>';
          return '<a href="' + esc(l.url) + '" class="action-btn ' + (l.style || 'primary') + '">' + esc(l.label) + '</a>';
        }).join('\n          ');
      }
      var descHtml = p.description ? '<p>' + esc(p.description) + '</p>' : '';

      html += '<div class="practice-card">' +
        '<div class="practice-header">' +
          '<div class="practice-number">Practice ' + num + '</div>' +
          '<div class="practice-header-top">' +
            '<h3>' + esc(p.title) + '</h3>' +
            '<span class="status-badge ' + statusClass + '">' + statusLabel + '</span>' +
          '</div>' + descHtml +
        '</div>' +
        ((modesHtml || outcomesHtml || outputsHtml) ? '<div class="practice-body">' + modesHtml + outcomesHtml + outputsHtml + '</div>' : '') +
        (actionsHtml ? '<div class="practice-actions">' + actionsHtml + '</div>' : '') +
        '<div class="practice-res-wrap" id="res-list-' + resId + '" style="margin:0 1.75rem 1.5rem;border-top:1px solid var(--border,#E2E8F0);padding-top:.75rem;"></div>' +
        '</div>';
    });

    container.innerHTML = html;

    // Init resources for each practice card
    if (window.VCTResources) {
      forPlay.forEach(function (p) {
        var resId = p.resource_play_id || ('p-' + p.id);
        window.VCTResources.init(p.resource_play_id || 0, { listId: 'res-list-' + resId, compact: true });
      });
    }
  }

  /* ── Beliefs renderer ──────────────────────────────────── */
  async function renderBeliefs(containerId) {
    var container = document.getElementById(containerId || 'beliefs-container');
    if (!container) return;
    var beliefs = await fetchBeliefs();
    if (!beliefs.length) {
      container.innerHTML = '<p style="font-size:.85rem;color:var(--text-secondary,#5A6B8A);padding:1rem 0;">No principles added yet.</p>';
      return;
    }
    container.innerHTML = beliefs.map(function (b, idx) {
      return '<div class="big-idea-card"><div class="bi-num">' + (idx + 1) + '</div><div><h4>' + esc(b.title) + '</h4><p>' + esc(b.description) + '</p></div></div>';
    }).join('');
  }

  window.VCTPractices = {
    fetchPractices: fetchPractices,
    createPractice: createPractice,
    updatePractice: updatePractice,
    deletePractice: deletePractice,
    fetchPlayPractices: fetchPlayPractices,
    assignPracticeToPlay: assignPracticeToPlay,
    unassignPracticeFromPlay: unassignPracticeFromPlay,
    updateSortOrder: updateSortOrder,
    renderPlayPage: renderPlayPage,
    fetchBeliefs: fetchBeliefs,
    createBelief: createBelief,
    updateBelief: updateBelief,
    deleteBelief: deleteBelief,
    renderBeliefs: renderBeliefs,
    PLAY_NAMES: PLAY_NAMES,
    PLAY_COLORS: PLAY_COLORS
  };
})();
