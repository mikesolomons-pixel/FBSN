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

    /* Filter bar */
    .res-filterbar{
      background:var(--card,#fff);border:1px solid var(--border,#E2E8F0);
      border-radius:14px;padding:1rem 1.2rem;margin-bottom:1.25rem;
      display:flex;gap:.75rem;flex-wrap:wrap;align-items:center;
      box-shadow:0 2px 8px rgba(27,42,74,.05);
    }
    .res-search{
      flex:1;min-width:220px;position:relative;
    }
    .res-search input{
      width:100%;padding:.6rem .9rem .6rem 2.2rem;border:1px solid var(--border,#E2E8F0);
      border-radius:9px;font-size:.88rem;font-family:inherit;outline:none;
      background:var(--bg,#F5F7FA);transition:border-color .15s, background .15s;
    }
    .res-search input:focus{border-color:var(--teal,#00897B);background:#fff;}
    .res-search::before{
      content:'\\1F50D';position:absolute;left:.75rem;top:50%;transform:translateY(-50%);
      font-size:.85rem;opacity:.5;pointer-events:none;
    }
    .res-filter-group{display:flex;gap:.4rem;flex-wrap:wrap}
    .res-filter-chip{
      padding:.45rem .85rem;border:1px solid var(--border,#E2E8F0);
      border-radius:20px;background:var(--bg,#F5F7FA);font-size:.75rem;font-weight:600;
      color:var(--text-secondary,#5A6B8A);cursor:pointer;transition:all .15s;
      font-family:inherit;white-space:nowrap;
    }
    .res-filter-chip:hover{border-color:var(--teal,#00897B);color:var(--teal,#00897B)}
    .res-filter-chip.active{background:var(--navy,#1B2A4A);border-color:var(--navy,#1B2A4A);color:#fff}
    .res-filter-label{
      font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;
      color:var(--text-secondary,#5A6B8A);margin-right:.3rem;align-self:center;
    }
    .res-view-toggle{display:flex;gap:.25rem;margin-left:auto}
    .res-view-btn{
      padding:.4rem .6rem;border:1px solid var(--border,#E2E8F0);background:#fff;
      border-radius:7px;cursor:pointer;font-size:.85rem;color:var(--text-secondary,#5A6B8A);
      transition:all .15s;font-family:inherit;
    }
    .res-view-btn.active{background:var(--navy,#1B2A4A);border-color:var(--navy,#1B2A4A);color:#fff}

    /* Card grid */
    .resources-grid{
      display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));
      gap:1rem;margin-bottom:1.25rem;
    }

    /* Resource card with thumbnail */
    .resource-card{
      background:var(--card,#fff);border:1px solid var(--border,#E2E8F0);
      border-radius:14px;overflow:hidden;display:flex;flex-direction:column;
      box-shadow:0 2px 8px rgba(27,42,74,.06);
      transition:transform .2s, box-shadow .2s, border-color .2s;
      text-decoration:none;color:var(--text,#1B2A4A);
      position:relative;
    }
    .resource-card:hover{
      transform:translateY(-3px);
      box-shadow:0 10px 28px rgba(27,42,74,.12);
      border-color:var(--teal,#00897B);
    }
    .resource-thumb{
      width:100%;aspect-ratio:16/9;background:linear-gradient(135deg,#F5F7FA 0%,#E2E8F0 100%);
      position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;
    }
    .resource-thumb img{
      width:100%;height:100%;object-fit:cover;display:block;
      transition:transform .3s;
    }
    .resource-card:hover .resource-thumb img{transform:scale(1.03)}
    .resource-thumb-fallback{
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      gap:.4rem;color:rgba(27,42,74,.4);
    }
    .resource-thumb-fallback .tf-icon{font-size:2.2rem}
    .resource-thumb-fallback .tf-label{
      font-size:.6rem;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;
    }
    .resource-type-chip{
      position:absolute;top:.6rem;left:.6rem;
      padding:.25rem .6rem;border-radius:20px;font-size:.58rem;font-weight:700;
      text-transform:uppercase;letter-spacing:.8px;color:#fff;
      backdrop-filter:blur(4px);box-shadow:0 2px 8px rgba(0,0,0,.15);
    }
    .resource-play-chip{
      position:absolute;top:.6rem;right:.6rem;
      padding:.25rem .6rem;border-radius:20px;font-size:.58rem;font-weight:700;
      text-transform:uppercase;letter-spacing:.8px;color:#fff;
      backdrop-filter:blur(4px);box-shadow:0 2px 8px rgba(0,0,0,.15);
    }
    .resource-body{
      padding:.9rem 1rem 1rem;display:flex;flex-direction:column;flex:1;gap:.35rem;
    }
    .resource-card-title{
      font-size:.92rem;font-weight:700;color:var(--navy,#1B2A4A);line-height:1.35;
      display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
    }
    .resource-card-author{
      font-size:.75rem;color:var(--text-secondary,#5A6B8A);
      display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden;
    }
    .resource-card-desc{
      font-size:.72rem;color:var(--text-secondary,#5A6B8A);line-height:1.5;
      margin-top:.25rem;font-style:italic;
      display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
    }
    .resource-card-link{
      margin-top:auto;padding-top:.5rem;font-size:.72rem;font-weight:600;
      color:var(--teal,#00897B);display:flex;align-items:center;gap:.3rem;
    }

    /* Admin controls on card */
    .resource-admin-controls{
      position:absolute;top:.5rem;right:.5rem;display:none;gap:.25rem;z-index:2;
    }
    .resource-card:hover .resource-admin-controls{display:none}
    body.vct-admin .resource-card .resource-admin-controls{display:flex}
    body.vct-admin .resource-card .resource-play-chip{display:none}
    .ra-btn{
      width:28px;height:28px;border-radius:7px;border:none;cursor:pointer;
      background:rgba(255,255,255,.95);color:var(--navy,#1B2A4A);font-size:.8rem;
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 2px 8px rgba(0,0,0,.15);transition:all .15s;
    }
    .ra-btn:hover{transform:scale(1.08)}
    .ra-btn.danger:hover{background:#EF5350;color:#fff}

    /* Grouped view */
    .resources-play-group{margin-bottom:2rem}
    .resources-play-group-header{
      display:flex;align-items:center;gap:.6rem;margin-bottom:.9rem;
      padding-bottom:.5rem;border-bottom:2px solid var(--border,#E2E8F0);
    }
    .resources-play-group-header .play-dot{
      width:14px;height:14px;border-radius:50%;flex-shrink:0;
    }
    .resources-play-group-header h3{
      font-size:1rem;font-weight:700;color:var(--navy,#1B2A4A);margin:0;
    }
    .resources-play-group-header .group-count{
      margin-left:auto;font-size:.72rem;color:var(--text-secondary,#5A6B8A);
      padding:.2rem .6rem;background:var(--bg,#F5F7FA);border-radius:10px;font-weight:600;
    }
    .resources-empty{
      text-align:center;padding:3rem 1rem;color:var(--text-secondary,#5A6B8A);
      font-size:.85rem;background:var(--card,#fff);border-radius:12px;
      border:1px dashed var(--border,#E2E8F0);
    }
    .resources-empty .re-icon{font-size:2.5rem;margin-bottom:.5rem;opacity:.4}

    /* Add form */
    .add-resource-toggle{
      display:inline-flex;align-items:center;gap:.5rem;padding:.7rem 1.1rem;cursor:pointer;
      font-size:.85rem;font-weight:600;color:#fff;background:var(--teal,#00897B);
      border:none;border-radius:10px;font-family:inherit;transition:background .15s;
    }
    .add-resource-toggle:hover{background:var(--teal-dark,#006B5E)}
    .add-resource-toggle .toggle-arrow{transition:transform .2s;font-size:.7rem}
    .add-resource-toggle.open .toggle-arrow{transform:rotate(90deg)}
    .add-resource-form-wrap{display:none;margin-top:1rem}
    .add-resource-form-wrap.open{display:block}
    .add-resource-form{
      background:var(--card,#fff);border-radius:14px;padding:1.5rem;
      box-shadow:0 2px 8px rgba(27,42,74,.08);border:1px solid var(--border,#E2E8F0);
    }
    .add-resource-form h4{
      font-size:.88rem;font-weight:700;color:var(--navy,#1B2A4A);
      margin-bottom:1rem;padding-bottom:.5rem;border-bottom:1px solid var(--border,#E2E8F0);
    }
    .add-resource-form .form-row{display:flex;gap:.6rem;margin-bottom:.65rem}
    .add-resource-form .form-row:last-child{margin-bottom:0}
    .add-resource-form label.field-label{
      display:block;font-size:.7rem;font-weight:700;text-transform:uppercase;
      letter-spacing:.8px;color:var(--text-secondary,#5A6B8A);margin-bottom:.35rem;
    }
    .add-resource-form input,.add-resource-form select,.add-resource-form textarea{
      flex:1;padding:.6rem .8rem;border:1px solid var(--border,#E2E8F0);
      border-radius:9px;font-size:.85rem;font-family:inherit;outline:none;
      background:var(--bg,#F5F7FA);transition:border-color .15s, background .15s;
    }
    .add-resource-form input:focus,.add-resource-form select:focus,.add-resource-form textarea:focus{
      border-color:var(--teal,#00897B);background:#fff;
    }
    .add-resource-btn{
      padding:.7rem 1.4rem;border:none;border-radius:9px;background:var(--teal,#00897B);
      color:#fff;font-size:.85rem;font-weight:600;cursor:pointer;white-space:nowrap;
      transition:background .15s;font-family:inherit;
    }
    .add-resource-btn:hover{background:var(--teal-dark,#006B5E)}
    .add-resource-btn:disabled{opacity:.5;cursor:default}

    /* Edit modal */
    .res-edit-overlay{
      position:fixed;inset:0;background:rgba(27,42,74,.5);z-index:1000;
      display:none;align-items:center;justify-content:center;backdrop-filter:blur(3px);
    }
    .res-edit-overlay.show{display:flex}
    .res-edit-modal{
      background:#fff;border-radius:16px;padding:1.5rem;max-width:500px;width:90%;
      max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.3);
    }
    .res-edit-modal h3{
      font-size:1.05rem;font-weight:700;color:var(--navy,#1B2A4A);margin-bottom:1rem;
    }
    .res-edit-modal .form-row{display:flex;gap:.5rem;margin-bottom:.6rem}
    .res-edit-modal input,.res-edit-modal select,.res-edit-modal textarea{
      flex:1;padding:.55rem .75rem;border:1px solid var(--border,#E2E8F0);
      border-radius:8px;font-size:.85rem;font-family:inherit;outline:none;background:var(--bg,#F5F7FA);
    }
    .res-edit-modal input:focus,.res-edit-modal select:focus,.res-edit-modal textarea:focus{
      border-color:var(--teal,#00897B);background:#fff;
    }
    .res-edit-actions{display:flex;gap:.5rem;justify-content:flex-end;margin-top:1rem}
    .res-edit-actions button{
      padding:.55rem 1.2rem;border-radius:8px;font-size:.82rem;font-weight:600;
      cursor:pointer;border:none;font-family:inherit;
    }
    .res-edit-save{background:var(--teal,#00897B);color:#fff}
    .res-edit-save:hover{background:var(--teal-dark,#006B5E)}
    .res-edit-cancel{background:var(--bg,#F5F7FA);color:var(--text-secondary,#5A6B8A);border:1px solid var(--border,#E2E8F0)}
    .res-edit-cancel:hover{background:#fff}

    /* Compact mode (inside practice cards) */
    .pr-list .resources-grid{grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:.75rem}
    .pr-list .resource-thumb{aspect-ratio:16/10}
    .pr-list .resource-card-title{font-size:.82rem}

    @media(max-width:700px){
      .resources-grid{grid-template-columns:1fr 1fr}
      .res-filterbar{padding:.85rem}
      .res-view-toggle{margin-left:0}
    }
    @media(max-width:480px){
      .resources-grid{grid-template-columns:1fr}
    }
  `;
  document.head.appendChild(style);

  /* ── Colours ────────────────────────────────────────────── */
  const PLAY_COLORS = {
    0: '#4A90D9', 1: '#00897B', 2: '#7C5CBF', 3: '#E07A5F', 4: '#D4A843', 5: '#1B2A4A',
    101: '#00897B', 102: '#00897B', 103: '#00897B',
    201: '#7C5CBF', 202: '#7C5CBF', 203: '#7C5CBF', 204: '#7C5CBF',
    301: '#E07A5F', 302: '#E07A5F', 303: '#E07A5F',
    401: '#D4A843', 402: '#D4A843', 403: '#D4A843',
    501: '#1B2A4A', 502: '#1B2A4A', 503: '#1B2A4A'
  };
  const PLAY_NAMES = {
    0: 'All of VCT', 1: 'Sensemaking', 2: 'Imagining', 3: 'Navigating', 4: 'Collaborating', 5: 'Value Creating',
    101: 'FBSN Exercise', 102: 'Three Horizons Scanning', 103: 'Assumption Mapping',
    201: 'Future Visioning', 202: 'Strategic Ambition Setting', 203: 'Backcasting', 204: 'The Future Backwards',
    301: 'Cynefin Navigator', 302: 'Safe-to-Fail Experiments', 303: 'Decision Architecture',
    401: 'Team Operating System', 402: 'Trust & Candor Protocol', 403: 'Collaborative Reflection',
    501: 'Value Creation Cycle', 502: 'Impact Assessment', 503: 'Portfolio of Bets'
  };
  const TYPE_COLORS = { book: '#00897B', article: '#4A90D9', reference: '#7C5CBF', video: '#E07A5F', podcast: '#D4A843', tool: '#1B2A4A', powerpoint: '#C4451C' };
  const TYPE_ICONS  = { book: '\u{1F4D6}', article: '\u{1F4C4}', reference: '\u{1F517}', video: '\u{1F3A5}', podcast: '\u{1F3A7}', tool: '\u{1F6E0}', powerpoint: '\u{1F4CA}' };
  const TYPE_LABELS = { book: 'Book', article: 'Article', reference: 'Reference', video: 'Video', podcast: 'Podcast', tool: 'Tool', powerpoint: 'PowerPoint' };

  /* ── State ──────────────────────────────────────────────── */
  const state = {
    allResources: [],
    filterType: 'all',
    filterPlay: 'all',
    search: '',
    viewMode: 'grouped' // or 'grid'
  };

  /* ── Thumbnail helper ───────────────────────────────────── */
  function getThumbnailUrl(resource) {
    // 1. Explicit thumbnail uploaded
    if (resource.thumbnail_url) return resource.thumbnail_url;
    // 2. Auto-screenshot via thum.io for URL-based resources (free, no key)
    // Skip file uploads from our own Supabase bucket
    if (resource.url && !resource.url.includes('supabase.co/storage')) {
      // Strip protocol for thum.io
      const clean = resource.url.replace(/^https?:\/\//, '');
      return `https://image.thum.io/get/width/480/noanimate/https://${clean}`;
    }
    return null;
  }

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
    if (play) {
      if (play >= 100) q = q.eq('play', play);
      else q = q.in('play', [play, 0]);
    }
    const { data, error } = await q;
    if (error) { console.warn('resources fetch error', error); return []; }
    return data || [];
  }

  async function addResource(resource) {
    const sb = await getClient();
    if (!sb) return null;
    const { data, error } = await sb.from('resources').insert([resource]).select();
    if (error) { console.error('resource insert error', error); alert('Failed to save resource: ' + error.message); return null; }
    return data?.[0];
  }

  async function uploadFile(file, bucket) {
    const sb = await getClient();
    if (!sb) return null;
    const ext = file.name.split('.').pop();
    const path = `${bucket || 'resources'}/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
    const { data, error } = await sb.storage.from('resources').upload(path, file, { upsert: false });
    if (error) { console.error('file upload error', error); return null; }
    const { data: urlData } = sb.storage.from('resources').getPublicUrl(path);
    return urlData?.publicUrl || null;
  }

  async function updateResource(id, updates) {
    const sb = await getClient();
    if (!sb) return null;
    const { data, error } = await sb.from('resources').update(updates).eq('id', id).select();
    if (error) { console.error('resource update error', error); alert('Failed to update: ' + error.message); return null; }
    return data?.[0];
  }

  async function deleteResource(id) {
    const sb = await getClient();
    if (!sb) return false;
    const { error } = await sb.from('resources').delete().eq('id', id);
    return !error;
  }

  /* ── Card renderer ──────────────────────────────────────── */
  function renderCard(r) {
    const icon = TYPE_ICONS[r.resource_type] || TYPE_ICONS.book;
    const typeBg = TYPE_COLORS[r.resource_type] || TYPE_COLORS.book;
    const typeLabel = TYPE_LABELS[r.resource_type] || r.resource_type;
    const playLabel = r.play === 0 ? 'VCT' : (PLAY_NAMES[r.play] || '');
    const playBg = PLAY_COLORS[r.play] || '#999';
    const thumb = getThumbnailUrl(r);

    const thumbHTML = thumb
      ? `<img src="${esc(thumb)}" alt="" loading="lazy" onerror="this.parentNode.innerHTML='<div class=\\'resource-thumb-fallback\\'><div class=\\'tf-icon\\'>${icon}</div><div class=\\'tf-label\\'>${typeLabel}</div></div>'">`
      : `<div class="resource-thumb-fallback"><div class="tf-icon">${icon}</div><div class="tf-label">${esc(typeLabel)}</div></div>`;

    const clickWrap = r.url ? 'a' : 'div';
    const clickAttrs = r.url ? `href="${esc(r.url)}" target="_blank" rel="noopener"` : '';

    return `<${clickWrap} ${clickAttrs} class="resource-card" data-id="${r.id}" data-type="${r.resource_type}" data-play="${r.play}" data-title="${esc(r.title)}" data-author="${esc(r.author || '')}" data-url="${esc(r.url || '')}" data-desc="${esc(r.description || '')}" data-thumbnail="${esc(r.thumbnail_url || '')}">
      <div class="resource-thumb">
        ${thumbHTML}
        <span class="resource-type-chip" style="background:${typeBg}">${esc(typeLabel)}</span>
        <span class="resource-play-chip" style="background:${playBg}">${esc(playLabel)}</span>
        <div class="resource-admin-controls">
          <button class="ra-btn" data-edit-id="${r.id}" title="Edit" onclick="event.preventDefault();event.stopPropagation();">&#9998;</button>
          <button class="ra-btn danger" data-delete-id="${r.id}" title="Delete" onclick="event.preventDefault();event.stopPropagation();">&times;</button>
        </div>
      </div>
      <div class="resource-body">
        <div class="resource-card-title">${esc(r.title)}</div>
        ${r.author ? `<div class="resource-card-author">${esc(r.author)}</div>` : ''}
        ${r.description ? `<div class="resource-card-desc">${esc(r.description)}</div>` : ''}
        ${r.url ? `<div class="resource-card-link">Open &rarr;</div>` : ''}
      </div>
    </${clickWrap}>`;
  }

  /* ── Filter helpers ─────────────────────────────────────── */
  function applyFilters(resources) {
    return resources.filter(r => {
      if (state.filterType !== 'all' && r.resource_type !== state.filterType) return false;
      if (state.filterPlay !== 'all') {
        const p = parseInt(state.filterPlay, 10);
        if (r.play !== p) return false;
      }
      if (state.search) {
        const q = state.search.toLowerCase();
        const hay = ((r.title || '') + ' ' + (r.author || '') + ' ' + (r.description || '')).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function renderFilterBar(container) {
    const types = ['all', 'book', 'article', 'reference', 'video', 'podcast', 'powerpoint', 'tool'];
    const plays = [
      { value: 'all', label: 'All Plays' },
      { value: '0', label: 'VCT General' },
      { value: '1', label: 'Sensemaking' },
      { value: '2', label: 'Imagining' },
      { value: '3', label: 'Navigating' },
      { value: '4', label: 'Collaborating' },
      { value: '5', label: 'Value Creating' }
    ];

    const bar = document.createElement('div');
    bar.className = 'res-filterbar';
    bar.innerHTML = `
      <div class="res-search">
        <input type="search" placeholder="Search resources..." id="res-search-input">
      </div>
      <div class="res-filter-group">
        <span class="res-filter-label">Type</span>
        ${types.map(t => `<button class="res-filter-chip${t === state.filterType ? ' active' : ''}" data-filter-type="${t}">${t === 'all' ? 'All' : TYPE_LABELS[t]}</button>`).join('')}
      </div>
      <div class="res-filter-group">
        <span class="res-filter-label">Play</span>
        <select class="res-filter-chip" id="res-play-select" style="padding:.45rem .85rem;">
          ${plays.map(p => `<option value="${p.value}"${p.value === state.filterPlay ? ' selected' : ''}>${p.label}</option>`).join('')}
        </select>
      </div>
      <div class="res-view-toggle">
        <button class="res-view-btn${state.viewMode === 'grouped' ? ' active' : ''}" data-view="grouped" title="Grouped by play">&#9776;</button>
        <button class="res-view-btn${state.viewMode === 'grid' ? ' active' : ''}" data-view="grid" title="All in grid">&#9638;</button>
      </div>
    `;
    container.appendChild(bar);

    // Wire search
    bar.querySelector('#res-search-input').oninput = function (e) {
      state.search = e.target.value.trim();
      renderResults();
    };

    // Wire type chips
    bar.querySelectorAll('[data-filter-type]').forEach(btn => {
      btn.onclick = function () {
        state.filterType = btn.getAttribute('data-filter-type');
        bar.querySelectorAll('[data-filter-type]').forEach(b => b.classList.toggle('active', b === btn));
        renderResults();
      };
    });

    // Wire play select
    bar.querySelector('#res-play-select').onchange = function (e) {
      state.filterPlay = e.target.value;
      renderResults();
    };

    // Wire view toggle
    bar.querySelectorAll('[data-view]').forEach(btn => {
      btn.onclick = function () {
        state.viewMode = btn.getAttribute('data-view');
        bar.querySelectorAll('[data-view]').forEach(b => b.classList.toggle('active', b === btn));
        renderResults();
      };
    });
  }

  function renderResults() {
    const resultsEl = document.getElementById('res-results');
    if (!resultsEl) return;
    const filtered = applyFilters(state.allResources);

    if (filtered.length === 0) {
      resultsEl.innerHTML = `<div class="resources-empty"><div class="re-icon">&#128269;</div>No resources match your filters.</div>`;
      return;
    }

    if (state.viewMode === 'grid') {
      resultsEl.innerHTML = `<div class="resources-grid">${filtered.map(renderCard).join('')}</div>`;
    } else {
      // Grouped view
      const groups = {};
      filtered.forEach(r => { (groups[r.play] = groups[r.play] || []).push(r); });
      const order = [0, 1, 101, 102, 103, 2, 201, 202, 203, 204, 3, 301, 302, 303, 4, 401, 402, 403, 5, 501, 502, 503];
      resultsEl.innerHTML = order.filter(p => groups[p]).map(p => {
        let heading;
        if (p === 0) heading = 'Value Creating Teams (General)';
        else if (p >= 100) heading = PLAY_NAMES[p];
        else heading = 'Play ' + p + ': ' + PLAY_NAMES[p];
        return `<div class="resources-play-group">
          <div class="resources-play-group-header">
            <span class="play-dot" style="background:${PLAY_COLORS[p]}"></span>
            <h3>${esc(heading)}</h3>
            <span class="group-count">${groups[p].length} resource${groups[p].length === 1 ? '' : 's'}</span>
          </div>
          <div class="resources-grid">${groups[p].map(renderCard).join('')}</div>
        </div>`;
      }).join('');
    }

    wireCardButtons(resultsEl);
  }

  function wireCardButtons(container) {
    container.querySelectorAll('[data-delete-id]').forEach(btn => {
      btn.onclick = async function (e) {
        e.preventDefault();
        e.stopPropagation();
        const id = btn.getAttribute('data-delete-id');
        if (!confirm('Delete this resource?')) return;
        const ok = await deleteResource(id);
        if (ok) {
          state.allResources = state.allResources.filter(r => r.id !== id);
          renderResults();
        }
      };
    });
    container.querySelectorAll('[data-edit-id]').forEach(btn => {
      btn.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        const card = btn.closest('.resource-card');
        if (!card) return;
        openEditModal({
          id: card.getAttribute('data-id'),
          title: card.getAttribute('data-title'),
          author: card.getAttribute('data-author'),
          url: card.getAttribute('data-url'),
          description: card.getAttribute('data-desc'),
          resource_type: card.getAttribute('data-type'),
          play: parseInt(card.getAttribute('data-play'), 10),
          thumbnail_url: card.getAttribute('data-thumbnail')
        });
      };
    });
  }

  /* ── Edit modal ─────────────────────────────────────────── */
  function openEditModal(r) {
    let overlay = document.getElementById('res-edit-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'res-edit-overlay';
      overlay.className = 'res-edit-overlay';
      document.body.appendChild(overlay);
    }
    const typeOptions = Object.keys(TYPE_LABELS).map(t =>
      `<option value="${t}"${t === r.resource_type ? ' selected' : ''}>${TYPE_LABELS[t]}</option>`
    ).join('');
    const playOptions = [
      { v: 0, l: 'VCT General' }, { v: 1, l: 'Play 1: Sensemaking' }, { v: 2, l: 'Play 2: Imagining' },
      { v: 3, l: 'Play 3: Navigating' }, { v: 4, l: 'Play 4: Collaborating' }, { v: 5, l: 'Play 5: Value Creating' }
    ].map(p => `<option value="${p.v}"${p.v === r.play ? ' selected' : ''}>${p.l}</option>`).join('');

    overlay.innerHTML = `
      <div class="res-edit-modal">
        <h3>Edit Resource</h3>
        <label class="field-label" style="display:block;font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#5A6B8A;margin-bottom:.3rem;">Title</label>
        <div class="form-row"><input type="text" class="re-title" value="${esc(r.title)}" placeholder="Title"></div>
        <label class="field-label" style="display:block;font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#5A6B8A;margin-bottom:.3rem;">Author</label>
        <div class="form-row"><input type="text" class="re-author" value="${esc(r.author || '')}" placeholder="Author"></div>
        <label class="field-label" style="display:block;font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#5A6B8A;margin-bottom:.3rem;">URL</label>
        <div class="form-row"><input type="url" class="re-url" value="${esc(r.url || '')}" placeholder="URL"></div>
        <label class="field-label" style="display:block;font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#5A6B8A;margin-bottom:.3rem;">Description</label>
        <div class="form-row"><input type="text" class="re-desc" value="${esc(r.description || '')}" placeholder="What makes this interesting?"></div>
        <label class="field-label" style="display:block;font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#5A6B8A;margin-bottom:.3rem;">Custom Thumbnail (optional)</label>
        <div class="form-row" style="align-items:center;gap:.5rem">
          <input type="url" class="re-thumb" value="${esc(r.thumbnail_url || '')}" placeholder="Thumbnail image URL">
          <label style="display:flex;align-items:center;gap:.3rem;padding:.45rem .7rem;border:1px solid #E2E8F0;border-radius:8px;font-size:.72rem;cursor:pointer;white-space:nowrap;background:#F5F7FA">
            <span>\u{1F4F7}</span> Upload
            <input type="file" class="re-thumb-file" accept="image/*" style="display:none">
          </label>
        </div>
        <div class="form-row"><select class="re-type">${typeOptions}</select><select class="re-play">${playOptions}</select></div>
        <div class="res-edit-actions">
          <button class="res-edit-cancel">Cancel</button>
          <button class="res-edit-save">Save</button>
        </div>
      </div>`;
    overlay.classList.add('show');

    const modal = overlay.querySelector('.res-edit-modal');
    const thumbFile = modal.querySelector('.re-thumb-file');
    const thumbInput = modal.querySelector('.re-thumb');
    thumbFile.onchange = async function () {
      const f = thumbFile.files[0];
      if (!f) return;
      thumbInput.value = 'Uploading...';
      thumbInput.disabled = true;
      const url = await uploadFile(f, 'thumbnails');
      thumbInput.disabled = false;
      thumbInput.value = url || '';
    };

    modal.querySelector('.res-edit-cancel').onclick = () => overlay.classList.remove('show');
    overlay.onclick = (e) => { if (e.target === overlay) overlay.classList.remove('show'); };

    modal.querySelector('.res-edit-save').onclick = async function () {
      const title = modal.querySelector('.re-title').value.trim();
      if (!title) return;
      const saveBtn = modal.querySelector('.res-edit-save');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';
      const result = await updateResource(r.id, {
        title,
        author: modal.querySelector('.re-author').value.trim() || null,
        url: modal.querySelector('.re-url').value.trim() || null,
        description: modal.querySelector('.re-desc').value.trim() || null,
        resource_type: modal.querySelector('.re-type').value,
        play: parseInt(modal.querySelector('.re-play').value, 10),
        thumbnail_url: modal.querySelector('.re-thumb').value.trim() || null
      });
      if (result) {
        const idx = state.allResources.findIndex(x => x.id === r.id);
        if (idx >= 0) state.allResources[idx] = result;
        overlay.classList.remove('show');
        renderResults();
      } else {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save';
      }
    };
  }

  /* ── Add form ───────────────────────────────────────────── */
  function buildPlaySelect(currentPlay) {
    const options = [
      { value: 0, label: 'VCT General' },
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
    const playInput = play != null
      ? `<input type="hidden" class="res-play" value="${play}">`
      : buildPlaySelect(null);

    container.innerHTML = `
      <button class="add-resource-toggle" onclick="this.classList.toggle('open');this.nextElementSibling.classList.toggle('open')">
        <span class="toggle-arrow">&#9654;</span> Add a Resource
      </button>
      <div class="add-resource-form-wrap">
        <div class="add-resource-form">
          <h4>New Resource</h4>
          <label class="field-label">Title & Author</label>
          <div class="form-row">
            <input type="text" placeholder="Title" class="res-title" required>
            <input type="text" placeholder="Author (optional)" class="res-author">
          </div>
          <label class="field-label">Link or File</label>
          <div class="form-row" style="align-items:center">
            <input type="url" placeholder="Paste a URL (e.g. https://...)" class="res-url" style="flex:1;">
            <label class="res-file-label" style="display:flex;align-items:center;gap:.35rem;padding:.55rem .85rem;border:1px solid var(--border,#E2E8F0);border-radius:9px;font-size:.78rem;color:var(--text-secondary,#5A6B8A);cursor:pointer;white-space:nowrap;background:var(--bg,#F5F7FA)">
              <span style="font-size:1rem">\u{1F4CE}</span> Upload file
              <input type="file" class="res-file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg,.gif,.mp4,.mp3" style="display:none">
            </label>
          </div>
          <div class="res-file-info" style="display:none;font-size:.75rem;color:var(--teal,#00897B);padding:.25rem 0;display:flex;align-items:center;gap:.5rem"></div>
          <label class="field-label">Description (optional)</label>
          <div class="form-row">
            <input type="text" placeholder="What makes this interesting?" class="res-desc" style="flex:1;">
          </div>
          <label class="field-label">Thumbnail Image (optional — auto-generated for URLs)</label>
          <div class="form-row" style="align-items:center">
            <input type="url" placeholder="Custom thumbnail URL" class="res-thumb" style="flex:1;">
            <label style="display:flex;align-items:center;gap:.35rem;padding:.55rem .85rem;border:1px solid var(--border,#E2E8F0);border-radius:9px;font-size:.78rem;color:var(--text-secondary,#5A6B8A);cursor:pointer;white-space:nowrap;background:var(--bg,#F5F7FA)">
              <span>\u{1F4F7}</span> Upload image
              <input type="file" class="res-thumb-file" accept="image/*" style="display:none">
            </label>
          </div>
          <label class="field-label">Type & Play</label>
          <div class="form-row">
            <select class="res-type">
              <option value="book">Book</option>
              <option value="article">Article</option>
              <option value="reference">Reference</option>
              <option value="video">Video</option>
              <option value="podcast">Podcast</option>
              <option value="powerpoint">PowerPoint</option>
              <option value="tool">Tool</option>
            </select>
            ${playInput}
            <button class="add-resource-btn">Add Resource</button>
          </div>
        </div>
      </div>`;

    const fileInput = container.querySelector('.res-file');
    const fileInfo = container.querySelector('.res-file-info');
    const urlInput = container.querySelector('.res-url');
    const thumbFile = container.querySelector('.res-thumb-file');
    const thumbInput = container.querySelector('.res-thumb');

    fileInput.onchange = function () {
      const file = fileInput.files[0];
      if (file) {
        const sizeMB = (file.size / 1024 / 1024).toFixed(1);
        fileInfo.style.display = 'flex';
        fileInfo.innerHTML = '\u{1F4CE} <strong>' + esc(file.name) + '</strong> (' + sizeMB + ' MB) <span class="res-file-remove" style="color:#C62828;cursor:pointer;font-size:.85rem" title="Remove">&times;</span>';
        urlInput.value = '';
        urlInput.disabled = true;
        urlInput.placeholder = 'File selected — will upload on Add';
        fileInfo.querySelector('.res-file-remove').onclick = function () {
          fileInput.value = '';
          fileInfo.style.display = 'none';
          urlInput.disabled = false;
          urlInput.placeholder = 'Paste a URL (e.g. https://...)';
        };
      }
    };

    thumbFile.onchange = async function () {
      const f = thumbFile.files[0];
      if (!f) return;
      thumbInput.value = 'Uploading...';
      thumbInput.disabled = true;
      const url = await uploadFile(f, 'thumbnails');
      thumbInput.disabled = false;
      thumbInput.value = url || '';
    };

    const btn = container.querySelector('.add-resource-btn');
    btn.onclick = async function () {
      const title = container.querySelector('.res-title').value.trim();
      if (!title) return;
      btn.disabled = true;
      btn.textContent = 'Adding...';

      let url = urlInput.value.trim() || null;
      const file = fileInput.files[0];
      if (file) {
        btn.textContent = 'Uploading...';
        url = await uploadFile(file);
        if (!url) {
          btn.disabled = false;
          btn.textContent = 'Add Resource';
          alert('File upload failed. Check that the "resources" storage bucket exists in Supabase.');
          return;
        }
      }

      const p = parseInt(container.querySelector('.res-play').value, 10);
      const result = await addResource({
        play: p,
        title: title,
        author: container.querySelector('.res-author').value.trim() || null,
        resource_type: container.querySelector('.res-type').value,
        url: url,
        description: container.querySelector('.res-desc').value.trim() || null,
        thumbnail_url: thumbInput.value.trim() || null
      });
      btn.disabled = false;
      btn.textContent = 'Add Resource';
      if (result) {
        container.querySelector('.res-title').value = '';
        container.querySelector('.res-author').value = '';
        urlInput.value = '';
        urlInput.disabled = false;
        urlInput.placeholder = 'Paste a URL (e.g. https://...)';
        container.querySelector('.res-desc').value = '';
        thumbInput.value = '';
        fileInput.value = '';
        fileInfo.style.display = 'none';
        if (container._refreshFn) container._refreshFn();
      }
    };
  }

  /* ── Public init for play/practice pages ─────────────────── */
  async function init(play, opts) {
    opts = opts || {};
    const listEl = document.getElementById(opts.listId || 'resources-list');
    const formEl = document.getElementById(opts.formId || 'resources-form');
    if (!listEl) return;

    // Compact mode: inline resources inside a practice card
    if (opts.compact) {
      listEl.innerHTML = `
        <h4 style="font-size:.75rem;font-weight:700;color:var(--text-secondary,#5A6B8A);text-transform:uppercase;letter-spacing:.5px;margin:0 0 .5rem">Practice Resources</h4>
        <div class="pr-list"></div>
        <div class="pr-form"></div>`;

      const prList = listEl.querySelector('.pr-list');
      const prForm = listEl.querySelector('.pr-form');

      async function refresh() {
        const resources = await fetchResources(play);
        if (resources.length) {
          prList.innerHTML = '<div class="resources-grid">' + resources.map(renderCard).join('') + '</div>';
          wireCardButtons(prList);
        } else {
          prList.innerHTML = '<p class="resources-empty">No resources yet.</p>';
        }
      }

      await refresh();
      renderAddForm(prForm, play);
      prForm._refreshFn = refresh;
      return;
    }

    async function refresh() {
      const resources = await fetchResources(play);
      listEl.innerHTML = `<div class="resources-grid">${resources.map(renderCard).join('')}</div>`;
      wireCardButtons(listEl);
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

    // Build the filter bar + results container
    listEl.innerHTML = '';
    renderFilterBar(listEl);
    const resultsEl = document.createElement('div');
    resultsEl.id = 'res-results';
    listEl.appendChild(resultsEl);

    async function refresh() {
      state.allResources = await fetchResources();
      renderResults();
    }

    await refresh();
    if (formEl) {
      renderAddForm(formEl, null);
      formEl._refreshFn = refresh;
    }
  }

  function esc(s) { if (s == null) return ''; const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  window.VCTResources = { init, initAll, fetchResources, addResource, updateResource, deleteResource };
})();
