/**
 * resources.js — Dynamic resource management for VCT
 * Requires supabase-config.js to be loaded (sets window.supabaseClient)
 *
 * Usage on play pages:
 *   VCTResources.init(playNumber)
 *
 * Usage on homepage:
 *   VCTResources.initAll()
 */
(function () {
  /* ── Inject CSS ─────────────────────────────────────────── */
  const style = document.createElement('style');
  style.textContent = `
    .resources-section{margin-top:2rem}
    .resources-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:.75rem;margin-bottom:1.25rem}
    .resource-item{display:flex;align-items:flex-start;gap:.6rem;padding:.7rem .85rem;background:var(--card,#fff);border-radius:10px;box-shadow:0 1px 4px rgba(27,42,74,.06);border:1px solid var(--border,#E2E8F0)}
    .resource-icon{font-size:1rem;flex-shrink:0;margin-top:2px}
    .resource-info{min-width:0}
    .resource-title{font-weight:600;font-size:.82rem;color:var(--navy,#1B2A4A)}
    .resource-author{font-size:.75rem;color:var(--text-secondary,#5A6B8A)}
    .resource-type-badge{display:inline-block;font-size:.58rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:.1rem .4rem;border-radius:4px;color:#fff;margin-left:.4rem;vertical-align:middle}
    .resource-play-tag{display:inline-block;font-size:.58rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:.12rem .45rem;border-radius:4px;margin-right:.5rem;color:#fff}
    .add-resource-form{background:var(--card,#fff);border-radius:12px;padding:1.25rem;box-shadow:0 2px 8px rgba(27,42,74,.08);border:1px solid var(--border,#E2E8F0)}
    .add-resource-form h4{font-size:.85rem;font-weight:700;color:var(--navy,#1B2A4A);margin-bottom:.75rem}
    .add-resource-form .form-row{display:flex;gap:.5rem;margin-bottom:.5rem}
    .add-resource-form .form-row:last-child{margin-bottom:0}
    .add-resource-form input,.add-resource-form select{flex:1;padding:.5rem .7rem;border:1px solid var(--border,#E2E8F0);border-radius:8px;font-size:.82rem;font-family:inherit;outline:none;transition:border-color .15s}
    .add-resource-form input:focus,.add-resource-form select:focus{border-color:var(--teal,#00897B)}
    .add-resource-btn{padding:.5rem 1.1rem;border:none;border-radius:8px;background:var(--teal,#00897B);color:#fff;font-size:.82rem;font-weight:600;cursor:pointer;white-space:nowrap;transition:background .15s}
    .add-resource-btn:hover{background:var(--teal-dark,#006B5E)}
    .add-resource-btn:disabled{opacity:.5;cursor:default}
    .resources-empty{font-size:.85rem;color:var(--text-secondary,#5A6B8A);padding:1rem 0}
    .resources-play-group{margin-bottom:1.5rem}
    .resources-play-group h3{font-size:.95rem;font-weight:700;color:var(--navy,#1B2A4A);margin-bottom:.75rem;display:flex;align-items:center;gap:.5rem}
    .resources-play-group .play-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0}
    @media(max-width:600px){.add-resource-form .form-row{flex-direction:column}.resources-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  /* ── Colours ────────────────────────────────────────────── */
  const PLAY_COLORS = { 0: '#4A90D9', 1: '#00897B', 2: '#7C5CBF', 3: '#E07A5F', 4: '#D4A843', 5: '#1B2A4A' };
  const PLAY_NAMES  = { 0: 'All of VCT', 1: 'Sensemaking', 2: 'Imagining', 3: 'Navigating', 4: 'Collaborating', 5: 'Value Creating' };
  const TYPE_COLORS = { book: '#00897B', article: '#4A90D9', reference: '#7C5CBF', video: '#E07A5F', podcast: '#D4A843', tool: '#1B2A4A' };
  const TYPE_ICONS  = { book: '\u{1F4D6}', article: '\u{1F4C4}', reference: '\u{1F517}', video: '\u{1F3A5}', podcast: '\u{1F3A7}', tool: '\u{1F6E0}' };

  /* ── Supabase helper ────────────────────────────────────── */
  async function getClient() {
    for (let i = 0; i < 30; i++) {
      if (window.supabaseClient) return window.supabaseClient;
      await new Promise(r => setTimeout(r, 100));
    }
    return null;
  }

  async function fetchResources(play) {
    const sb = await getClient();
    if (!sb) return [];
    let q = sb.from('resources').select('*').order('created_at', { ascending: true });
    if (play) q = q.in('play', [play, 0]); // include play-specific + VCT-wide
    const { data, error } = await q;
    if (error) { console.warn('resources fetch error', error); return []; }
    return data || [];
  }

  async function addResource(resource) {
    const sb = await getClient();
    if (!sb) return null;
    const { data, error } = await sb.from('resources').insert([resource]).select();
    if (error) { console.error('resource insert error', error); return null; }
    return data?.[0];
  }

  async function deleteResource(id) {
    const sb = await getClient();
    if (!sb) return false;
    const { error } = await sb.from('resources').delete().eq('id', id);
    return !error;
  }

  /* ── Renderers ──────────────────────────────────────────── */
  function renderItem(r, opts) {
    const showPlay = opts && opts.showPlay;
    const icon = TYPE_ICONS[r.resource_type] || TYPE_ICONS.book;
    const typeBg = TYPE_COLORS[r.resource_type] || TYPE_COLORS.book;
    const playLabel = r.play === 0 ? 'VCT' : PLAY_NAMES[r.play];
    const playTag = showPlay
      ? `<span class="resource-play-tag" style="background:${PLAY_COLORS[r.play]}">${playLabel}</span>`
      : (r.play === 0 ? `<span class="resource-play-tag" style="background:${PLAY_COLORS[0]}">VCT</span>` : '');
    return `<div class="resource-item" data-id="${r.id}">
      <span class="resource-icon">${icon}</span>
      <div class="resource-info">
        ${playTag}<span class="resource-title">${esc(r.title)}</span>
        <span class="resource-type-badge" style="background:${typeBg}">${r.resource_type}</span>
        ${r.author ? `<br><span class="resource-author">${esc(r.author)}</span>` : ''}
      </div>
    </div>`;
  }

  function renderList(resources, container, opts) {
    if (!resources.length) {
      container.innerHTML = '<p class="resources-empty">No resources yet. Be the first to add one!</p>';
      return;
    }
    container.innerHTML = resources.map(r => renderItem(r, opts)).join('');
  }

  function renderGrouped(resources, container) {
    if (!resources.length) {
      container.innerHTML = '<p class="resources-empty">No resources yet.</p>';
      return;
    }
    const groups = {};
    resources.forEach(r => { (groups[r.play] = groups[r.play] || []).push(r); });
    const order = [0, 1, 2, 3, 4, 5]; // VCT-wide first, then plays
    container.innerHTML = order.filter(p => groups[p]).map(p => `
      <div class="resources-play-group">
        <h3><span class="play-dot" style="background:${PLAY_COLORS[p]}"></span> ${p === 0 ? 'Value Creating Teams (General)' : 'Play ' + p + ': ' + PLAY_NAMES[p]}</h3>
        <div class="resources-grid">${groups[p].map(r => renderItem(r, {})).join('')}</div>
      </div>
    `).join('');
  }

  function buildPlaySelect(currentPlay) {
    // currentPlay: number if on a play page (1-5), null if on homepage
    const options = [
      { value: 0, label: 'All of VCT (general)' },
      { value: 1, label: 'Play 1: Sensemaking' },
      { value: 2, label: 'Play 2: Imagining' },
      { value: 3, label: 'Play 3: Navigating' },
      { value: 4, label: 'Play 4: Collaborating' },
      { value: 5, label: 'Play 5: Value Creating' }
    ];
    const selected = currentPlay || 0;
    return `<select class="res-play">${options.map(o =>
      `<option value="${o.value}"${o.value === selected ? ' selected' : ''}>${o.label}</option>`
    ).join('')}</select>`;
  }

  function renderAddForm(container, play) {
    container.innerHTML = `
      <div class="add-resource-form">
        <h4>+ Add a Resource</h4>
        <div class="form-row">
          <input type="text" placeholder="Title" class="res-title" required>
          <input type="text" placeholder="Author (optional)" class="res-author">
        </div>
        <div class="form-row">
          <select class="res-type">
            <option value="book">Book</option>
            <option value="article">Article</option>
            <option value="reference">Reference</option>
            <option value="video">Video</option>
            <option value="podcast">Podcast</option>
            <option value="tool">Tool</option>
          </select>
          ${buildPlaySelect(play)}
          <button class="add-resource-btn">Add</button>
        </div>
      </div>`;
    const btn = container.querySelector('.add-resource-btn');
    btn.onclick = async function () {
      const title = container.querySelector('.res-title').value.trim();
      if (!title) return;
      btn.disabled = true;
      btn.textContent = 'Adding\u2026';
      const p = parseInt(container.querySelector('.res-play').value, 10);
      const result = await addResource({
        play: p,
        title: title,
        author: container.querySelector('.res-author').value.trim() || null,
        resource_type: container.querySelector('.res-type').value
      });
      btn.disabled = false;
      btn.textContent = 'Add';
      if (result) {
        container.querySelector('.res-title').value = '';
        container.querySelector('.res-author').value = '';
        if (container._refreshFn) container._refreshFn();
      }
    };
  }

  /* ── Public init for play pages ─────────────────────────── */
  async function init(play) {
    const listEl = document.getElementById('resources-list');
    const formEl = document.getElementById('resources-form');
    if (!listEl) return;

    async function refresh() {
      const resources = await fetchResources(play);
      renderList(resources, listEl, {});
    }

    await refresh();
    if (formEl) {
      renderAddForm(formEl, play);
      formEl._refreshFn = refresh;
    }
  }

  /* ── Public init for homepage (all resources) ───────────── */
  async function initAll() {
    const listEl = document.getElementById('all-resources-list');
    const formEl = document.getElementById('all-resources-form');
    if (!listEl) return;

    async function refresh() {
      const resources = await fetchResources();
      renderGrouped(resources, listEl);
    }

    await refresh();
    if (formEl) {
      renderAddForm(formEl, null);
      formEl._refreshFn = refresh;
    }
  }

  function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  window.VCTResources = { init, initAll, fetchResources, addResource, deleteResource };
})();
