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
    a.resource-title:hover{color:var(--teal,#00897B)}
    .resource-author{font-size:.75rem;color:var(--text-secondary,#5A6B8A)}
    .resource-note{font-size:.72rem;color:var(--text-secondary,#5A6B8A);line-height:1.4;margin-top:.3rem;font-style:italic;opacity:.85}
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
  const PLAY_COLORS = { 0: '#4A90D9', 1: '#00897B', 2: '#7C5CBF', 3: '#E07A5F', 4: '#D4A843', 5: '#1B2A4A', 11: '#00897B', 12: '#E07A5F', 13: '#1B2A4A' };
  const PLAY_NAMES  = { 0: 'All of VCT', 1: 'Sensemaking', 2: 'Imagining', 3: 'Navigating', 4: 'Collaborating', 5: 'Value Creating', 11: 'FBSN Practice', 12: 'Cynefin Practice', 13: 'Calibration' };
  const TYPE_COLORS = { book: '#00897B', article: '#4A90D9', reference: '#7C5CBF', video: '#E07A5F', podcast: '#D4A843', tool: '#1B2A4A', powerpoint: '#C4451C' };
  const TYPE_ICONS  = { book: '\u{1F4D6}', article: '\u{1F4C4}', reference: '\u{1F517}', video: '\u{1F3A5}', podcast: '\u{1F3A7}', tool: '\u{1F6E0}', powerpoint: '\u{1F4CA}' };

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
      // Practices (11+) only show their own; plays (1-5) also show VCT-wide (0)
      if (play >= 11) q = q.eq('play', play);
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
    if (error) { console.error('resource insert error', error); return null; }
    return data?.[0];
  }

  async function uploadFile(file) {
    const sb = await getClient();
    if (!sb) return null;
    const ext = file.name.split('.').pop();
    const path = `resources/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
    const { data, error } = await sb.storage.from('resources').upload(path, file, { upsert: false });
    if (error) { console.error('file upload error', error); return null; }
    const { data: urlData } = sb.storage.from('resources').getPublicUrl(path);
    return urlData?.publicUrl || null;
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
    const titleHtml = r.url
      ? `<a href="${esc(r.url)}" target="_blank" rel="noopener" class="resource-title" style="text-decoration:none;color:var(--navy,#1B2A4A);">${esc(r.title)}<span style="font-size:.7rem;opacity:.5;margin-left:.3rem;">&#8599;</span></a>`
      : `<span class="resource-title">${esc(r.title)}</span>`;
    const deleteBtn = `<button class="resource-delete" data-delete-id="${r.id}" title="Delete resource">&times;</button>`;
    return `<div class="resource-item" data-id="${r.id}">
      <span class="resource-icon">${icon}</span>
      <div class="resource-info">
        ${playTag}${titleHtml}
        <span class="resource-type-badge" style="background:${typeBg}">${r.resource_type}</span>
        ${r.author ? `<br><span class="resource-author">${esc(r.author)}</span>` : ''}
        ${r.description ? `<div class="resource-note">${esc(r.description)}</div>` : ''}
      </div>
      ${deleteBtn}
    </div>`;
  }

  function renderList(resources, container, opts) {
    if (!resources.length) {
      container.innerHTML = '<p class="resources-empty">No resources yet. Be the first to add one!</p>';
      return;
    }
    container.innerHTML = resources.map(r => renderItem(r, opts)).join('');
    wireDeleteButtons(container);
  }

  function renderGrouped(resources, container) {
    if (!resources.length) {
      container.innerHTML = '<p class="resources-empty">No resources yet.</p>';
      return;
    }
    const groups = {};
    resources.forEach(r => { (groups[r.play] = groups[r.play] || []).push(r); });
    const order = [0, 1, 2, 3, 4, 5, 11, 12, 13]; // VCT-wide, plays, then practices
    container.innerHTML = order.filter(p => groups[p]).map(p => {
      let heading;
      if (p === 0) heading = 'Value Creating Teams (General)';
      else if (p >= 11) heading = PLAY_NAMES[p];
      else heading = 'Play ' + p + ': ' + PLAY_NAMES[p];
      return `<div class="resources-play-group">
        <h3><span class="play-dot" style="background:${PLAY_COLORS[p]}"></span> ${heading}</h3>
        <div class="resources-grid">${groups[p].map(r => renderItem(r, {})).join('')}</div>
      </div>`;
    }).join('');
    wireDeleteButtons(container);
  }

  function buildPlaySelect(currentPlay) {
    // currentPlay: number if on a play/practice page, null if on homepage
    const options = [
      { value: 0, label: 'All of VCT (general)' },
      { value: 1, label: 'Play 1: Sensemaking' },
      { value: 2, label: 'Play 2: Imagining' },
      { value: 3, label: 'Play 3: Navigating' },
      { value: 4, label: 'Play 4: Collaborating' },
      { value: 5, label: 'Play 5: Value Creating' },
      { value: 11, label: 'FBSN Practice' },
      { value: 12, label: 'Cynefin Practice' },
      { value: 13, label: 'Calibration' }
    ];
    const selected = currentPlay || 0;
    return `<select class="res-play">${options.map(o =>
      `<option value="${o.value}"${o.value === selected ? ' selected' : ''}>${o.label}</option>`
    ).join('')}</select>`;
  }

  function renderAddForm(container, play) {
    // On a specific play/practice page, lock to that play (no dropdown).
    // On homepage (play=null), show the full dropdown.
    const playInput = play != null
      ? `<input type="hidden" class="res-play" value="${play}">`
      : buildPlaySelect(null);

    container.innerHTML = `
      <div class="add-resource-form">
        <h4>+ Add a Resource</h4>
        <div class="form-row">
          <input type="text" placeholder="Title" class="res-title" required>
          <input type="text" placeholder="Author (optional)" class="res-author">
        </div>
        <div class="form-row" style="align-items:center">
          <input type="url" placeholder="URL — paste a link, or upload a file below" class="res-url" style="flex:1;">
          <label class="res-file-label" style="display:flex;align-items:center;gap:.35rem;padding:.45rem .8rem;border:1px solid var(--border,#E2E8F0);border-radius:8px;font-size:.78rem;color:var(--text-secondary,#5A6B8A);cursor:pointer;white-space:nowrap;transition:border-color .15s">
            <span style="font-size:1rem">\u{1F4CE}</span> Upload file
            <input type="file" class="res-file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg,.gif,.mp4,.mp3" style="display:none">
          </label>
        </div>
        <div class="res-file-info" style="display:none;font-size:.75rem;color:var(--teal,#00897B);padding:.25rem 0;display:flex;align-items:center;gap:.5rem"></div>
        <div class="form-row">
          <input type="text" placeholder="What makes this interesting? (optional)" class="res-desc" style="flex:1;">
        </div>
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
          <button class="add-resource-btn">Add</button>
        </div>
      </div>`;

    const fileInput = container.querySelector('.res-file');
    const fileInfo = container.querySelector('.res-file-info');
    const urlInput = container.querySelector('.res-url');

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
          urlInput.placeholder = 'URL — paste a link, or upload a file below';
        };
      }
    };

    const btn = container.querySelector('.add-resource-btn');
    btn.onclick = async function () {
      const title = container.querySelector('.res-title').value.trim();
      if (!title) return;
      btn.disabled = true;
      btn.textContent = 'Adding\u2026';

      // Upload file if selected
      let url = urlInput.value.trim() || null;
      const file = fileInput.files[0];
      if (file) {
        btn.textContent = 'Uploading\u2026';
        url = await uploadFile(file);
        if (!url) {
          btn.disabled = false;
          btn.textContent = 'Add';
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
        description: container.querySelector('.res-desc').value.trim() || null
      });
      btn.disabled = false;
      btn.textContent = 'Add';
      if (result) {
        container.querySelector('.res-title').value = '';
        container.querySelector('.res-author').value = '';
        urlInput.value = '';
        urlInput.disabled = false;
        urlInput.placeholder = 'URL — paste a link, or upload a file below';
        container.querySelector('.res-desc').value = '';
        fileInput.value = '';
        fileInfo.style.display = 'none';
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

  function wireDeleteButtons(container) {
    container.querySelectorAll('.resource-delete').forEach(btn => {
      btn.onclick = async function (e) {
        e.stopPropagation();
        const id = btn.getAttribute('data-delete-id');
        if (!confirm('Delete this resource?')) return;
        btn.textContent = '\u2026';
        const ok = await deleteResource(id);
        if (ok) {
          const item = btn.closest('.resource-item');
          if (item) item.remove();
        }
      };
    });
  }

  function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  window.VCTResources = { init, initAll, fetchResources, addResource, deleteResource };
})();
