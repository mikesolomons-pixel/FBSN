/**
 * practices.js — Dynamic practices management for VCT
 * Fetches practices and play_practices from Supabase,
 * exposes helpers for admin-console.html and (future) dynamic play pages.
 */
(function () {
  /* ── Supabase helper ───────────────────────────────────── */
  async function getClient() {
    for (let i = 0; i < 30; i++) {
      if (window.supabaseClient) return window.supabaseClient;
      await new Promise(r => setTimeout(r, 100));
    }
    return null;
  }

  /* ── CRUD: practices ──────────────────────────────────── */
  async function fetchPractices() {
    const sb = await getClient();
    if (!sb) return [];
    const { data, error } = await sb.from('practices').select('*').order('title');
    if (error) { console.warn('practices fetch error', error); return []; }
    return data || [];
  }

  async function createPractice(practice) {
    const sb = await getClient();
    if (!sb) return null;
    const { data, error } = await sb.from('practices').insert([practice]).select();
    if (error) { console.error('practice insert error', error); alert('Failed to create practice: ' + error.message); return null; }
    return data?.[0];
  }

  async function updatePractice(id, updates) {
    const sb = await getClient();
    if (!sb) return null;
    updates.updated_at = new Date().toISOString();
    const { data, error } = await sb.from('practices').update(updates).eq('id', id).select();
    if (error) { console.error('practice update error', error); alert('Failed to update practice: ' + error.message); return null; }
    return data?.[0];
  }

  async function deletePractice(id) {
    const sb = await getClient();
    if (!sb) return false;
    const { error } = await sb.from('practices').delete().eq('id', id);
    if (error) { console.error('practice delete error', error); alert('Failed to delete practice: ' + error.message); return false; }
    return true;
  }

  /* ── CRUD: play_practices junction ─────────────────────── */
  async function fetchPlayPractices() {
    const sb = await getClient();
    if (!sb) return [];
    const { data, error } = await sb.from('play_practices').select('*').order('sort_order');
    if (error) { console.warn('play_practices fetch error', error); return []; }
    return data || [];
  }

  async function assignPracticeToPlay(playNumber, practiceId, sortOrder) {
    const sb = await getClient();
    if (!sb) return null;
    const { data, error } = await sb.from('play_practices')
      .insert([{ play_number: playNumber, practice_id: practiceId, sort_order: sortOrder || 0 }])
      .select();
    if (error) { console.error('assign error', error); alert('Failed to assign: ' + error.message); return null; }
    return data?.[0];
  }

  async function unassignPracticeFromPlay(junctionId) {
    const sb = await getClient();
    if (!sb) return false;
    const { error } = await sb.from('play_practices').delete().eq('id', junctionId);
    if (error) { console.error('unassign error', error); return false; }
    return true;
  }

  async function updateSortOrder(junctionId, newOrder) {
    const sb = await getClient();
    if (!sb) return false;
    const { error } = await sb.from('play_practices').update({ sort_order: newOrder }).eq('id', junctionId);
    if (error) { console.error('sort order error', error); return false; }
    return true;
  }

  /* ── Play metadata ────────────────────────────────────── */
  const PLAY_NAMES = {
    1: 'Sensemaking',
    2: 'Imagining',
    3: 'Navigating',
    4: 'Collaborating',
    5: 'Value Creating'
  };
  const PLAY_COLORS = {
    1: '#00897B',
    2: '#7C5CBF',
    3: '#E07A5F',
    4: '#D4A843',
    5: '#1B2A4A'
  };

  /* ── HTML helpers ───────────────────────────────────────── */
  function esc(s) {
    if (!s) return '';
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  /* ── Dynamic practice card renderer for play pages ─────── */
  async function renderPlayPage(playNumber, containerId) {
    const container = document.getElementById(containerId || 'practices-container');
    if (!container) return;

    container.innerHTML = '<p style="font-size:.85rem;color:var(--text-secondary,#5A6B8A);padding:1rem 0;">Loading practices...</p>';

    const [allPractices, allJunctions] = await Promise.all([
      fetchPractices(),
      fetchPlayPractices()
    ]);

    // Get junctions for this play, sorted
    const junctions = allJunctions
      .filter(j => j.play_number === playNumber)
      .sort((a, b) => a.sort_order - b.sort_order);

    if (!junctions.length) {
      container.innerHTML = '<p style="font-size:.85rem;color:var(--text-secondary,#5A6B8A);padding:1rem 0;">No practices assigned to this play yet.</p>';
      return;
    }

    let html = '';
    junctions.forEach((junction, idx) => {
      const p = allPractices.find(x => x.id === junction.practice_id);
      if (!p) return;

      const num = idx + 1;
      const modes = Array.isArray(p.modes) ? p.modes : [];
      const outcomes = Array.isArray(p.outcomes) ? p.outcomes : [];
      const outputs = Array.isArray(p.outputs) ? p.outputs : [];
      const actionLinks = Array.isArray(p.action_links) ? p.action_links : [];
      const resId = p.resource_play_id || ('p-' + p.id);

      const statusClass = p.status === 'automated' ? 'available' : 'coming-soon';
      const statusLabel = p.status === 'automated' ? 'Automated' : 'Coming Soon';

      // Modes section
      let modesHtml = '';
      if (modes.length) {
        modesHtml = `<div class="practice-section">
          <h4 style="font-size:.8rem;font-weight:700;color:var(--navy);text-transform:uppercase;letter-spacing:1px;margin-bottom:.5rem;">How to Run It</h4>
          <div class="key-points">
            ${modes.map(m => `<div class="key-point"><div class="dot"></div><span><strong>${esc(m.label)}</strong> &mdash; ${esc(m.description)}</span></div>`).join('')}
          </div>
        </div>`;
      }

      // Outcomes section
      let outcomesHtml = '';
      if (outcomes.length) {
        outcomesHtml = `<div class="practice-section" style="margin-top:1rem;">
          <h4 style="font-size:.8rem;font-weight:700;color:var(--navy);text-transform:uppercase;letter-spacing:1px;margin-bottom:.5rem;">Outcomes</h4>
          <div class="key-points">
            ${outcomes.map(o => `<div class="key-point"><div class="dot"></div><span>${esc(o)}</span></div>`).join('')}
          </div>
        </div>`;
      }

      // Outputs section
      let outputsHtml = '';
      if (outputs.length) {
        outputsHtml = `<div class="practice-section" style="margin-top:1rem;">
          <h4 style="font-size:.8rem;font-weight:700;color:var(--navy);text-transform:uppercase;letter-spacing:1px;margin-bottom:.5rem;">Outputs</h4>
          <div class="key-points">
            ${outputs.map(o => `<div class="key-point"><div class="dot"></div><span>${esc(o)}</span></div>`).join('')}
          </div>
        </div>`;
      }

      // Action links
      let actionsHtml = '';
      if (actionLinks.length) {
        actionsHtml = actionLinks.map(l => {
          if (l.style === 'disabled' || !l.url) {
            return `<span class="action-btn disabled">${esc(l.label)}</span>`;
          }
          return `<a href="${esc(l.url)}" class="action-btn ${l.style || 'primary'}">${esc(l.label)}</a>`;
        }).join('\n          ');
      }

      // Description
      const descHtml = p.description
        ? `<p>${esc(p.description)}</p>`
        : '';

      html += `
      <div class="practice-card">
        <div class="practice-header">
          <div class="practice-number">Practice ${num}</div>
          <div class="practice-header-top">
            <h3>${esc(p.title)}</h3>
            <span class="status-badge ${statusClass}">${statusLabel}</span>
          </div>
          ${descHtml}
        </div>
        ${(modesHtml || outcomesHtml || outputsHtml) ? `<div class="practice-body">${modesHtml}${outcomesHtml}${outputsHtml}</div>` : ''}
        ${actionsHtml ? `<div class="practice-actions">${actionsHtml}</div>` : ''}
        <div class="practice-res-wrap" id="res-list-${resId}" style="margin:0 1.75rem 1.5rem;border-top:1px solid var(--border,#E2E8F0);padding-top:.75rem;"></div>
      </div>`;
    });

    container.innerHTML = html;

    // Init resources for each practice card
    if (window.VCTResources) {
      junctions.forEach(junction => {
        const p = allPractices.find(x => x.id === junction.practice_id);
        if (!p) return;
        const resId = p.resource_play_id || ('p-' + p.id);
        VCTResources.init(p.resource_play_id || 0, { listId: 'res-list-' + resId, compact: true });
      });
    }
  }

  /* ── Expose ────────────────────────────────────────────── */
  window.VCTPractices = {
    fetchPractices,
    createPractice,
    updatePractice,
    deletePractice,
    fetchPlayPractices,
    assignPracticeToPlay,
    unassignPracticeFromPlay,
    updateSortOrder,
    renderPlayPage,
    PLAY_NAMES,
    PLAY_COLORS
  };
})();
