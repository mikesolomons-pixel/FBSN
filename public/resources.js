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
    .resources-empty{font-size:.8rem;color:var(--text-secondary,#5A6B8A);padding:.35rem 0}
    .resource-edit{display:none;background:#E07A5F;color:#fff;border:none;border-radius:4px;font-size:.55rem;font-weight:700;padding:.15rem .4rem;cursor:pointer;flex-shrink:0;opacity:.7;transition:opacity .15s;text-transform:uppercase;letter-spacing:.5px}
    .resource-edit:hover{opacity:1}
    body.vct-admin .resource-edit{display:block}
    .resource-admin-btns{display:flex;flex-direction:column;gap:.25rem;margin-left:auto;flex-shrink:0}
    .resource-edit-form{padding:.75rem;background:var(--card,#fff);border-radius:10px;border:2px solid #E07A5F;margin-bottom:.5rem}
    .resource-edit-form .ref-row{display:flex;gap:.4rem;margin-bottom:.4rem}
    .resource-edit-form .ref-row:last-child{margin-bottom:0}
    .resource-edit-form input,.resource-edit-form select{flex:1;padding:.4rem .6rem;border:1px solid var(--border,#E2E8F0);border-radius:6px;font-size:.78rem;font-family:inherit;outline:none}
    .resource-edit-form input:focus,.resource-edit-form select:focus{border-color:#E07A5F}
    .ref-save{padding:.35rem .8rem;border:none;border-radius:6px;background:#E07A5F;color:#fff;font-size:.75rem;font-weight:600;cursor:pointer}
    .ref-save:hover{background:#c9664a}
    .ref-cancel{padding:.35rem .8rem;border:1px solid var(--border,#E2E8F0);border-radius:6px;background:transparent;color:var(--text-secondary,#5A6B8A);font-size:.75rem;cursor:pointer}
    .resources-play-group{margin-bottom:1.5rem}
    .resources-play-group h3{font-size:.95rem;font-weight:700;color:var(--navy,#1B2A4A);margin-bottom:.75rem;display:flex;align-items:center;gap:.5rem}
    .resources-play-group .play-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0}
    .add-resource-toggle{display:flex;align-items:center;gap:.4rem;padding:.5rem 0;cursor:pointer;font-size:.8rem;font-weight:600;color:var(--teal,#00897B);border:none;background:none;font-family:inherit}
    .add-resource-toggle:hover{color:var(--teal-dark,#006B5E)}
    .add-resource-toggle .toggle-arrow{transition:transform .2s;font-size:.65rem}
    .add-resource-toggle.open .toggle-arrow{transform:rotate(90deg)}
    .add-resource-form-wrap{display:none;overflow:hidden}
    .add-resource-form-wrap.open{display:block}
    @media(max-width:600px){.add-resource-form .form-row{flex-direction:column}.resources-grid{grid-template-columns:1fr}}
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
      // Practices (100+) only show their own; plays (1-5) also show VCT-wide (0)
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
    const adminBtns = `<div class="resource-admin-btns">
      <button class="resource-edit" data-edit-id="${r.id}" title="Edit resource">Edit</button>
      <button class="resource-delete" data-delete-id="${r.id}" title="Delete resource">&times;</button>
    </div>`;
    // Store resource data as data attributes for edit form
    return `<div class="resource-item" data-id="${r.id}" data-title="${esc(r.title)}" data-author="${esc(r.author || '')}" data-url="${esc(r.url || '')}" data-desc="${esc(r.description || '')}" data-type="${r.resource_type}" data-play="${r.play}">
      <span class="resource-icon">${icon}</span>
      <div class="resource-info">
        ${playTag}${titleHtml}
        <span class="resource-type-badge" style="background:${typeBg}">${r.resource_type}</span>
        ${r.author ? `<br><span class="resource-author">${esc(r.author)}</span>` : ''}
        ${r.description ? `<div class="resource-note">${esc(r.description)}</div>` : ''}
      </div>
      ${adminBtns}
    </div>`;
  }

  function renderList(resources, container, opts, refreshFn) {
    if (!resources.length) {
      container.innerHTML = '<p class="resources-empty">No resources yet. Be the first to add one!</p>';
      return;
    }
    container.innerHTML = resources.map(r => renderItem(r, opts)).join('');
    wireButtons(container, refreshFn);
  }

  function renderGrouped(resources, container) {
    if (!resources.length) {
      container.innerHTML = '<p class="resources-empty">No resources yet.</p>';
      return;
    }
    const groups = {};
    resources.forEach(r => { (groups[r.play] = groups[r.play] || []).push(r); });
    const order = [0, 1, 101, 102, 103, 2, 201, 202, 203, 204, 3, 301, 302, 303, 4, 401, 402, 403, 5, 501, 502, 503];
    container.innerHTML = order.filter(p => groups[p]).map(p => {
      let heading;
      if (p === 0) heading = 'Value Creating Teams (General)';
      else if (p >= 100) heading = PLAY_NAMES[p];
      else heading = 'Play ' + p + ': ' + PLAY_NAMES[p];
      return `<div class="resources-play-group">
        <h3><span class="play-dot" style="background:${PLAY_COLORS[p]}"></span> ${heading}</h3>
        <div class="resources-grid">${groups[p].map(r => renderItem(r, {})).join('')}</div>
      </div>`;
    }).join('');
    wireButtons(container);
  }

  function buildPlaySelect(currentPlay) {
    // Only used on homepage — play/practice pages use hidden input
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
    // On a specific play/practice page, lock to that play (no dropdown).
    // On homepage (play=null), show the full dropdown.
    const playInput = play != null
      ? `<input type="hidden" class="res-play" value="${play}">`
      : buildPlaySelect(null);

    container.innerHTML = `
      <button class="add-resource-toggle" onclick="this.classList.toggle('open');this.nextElementSibling.classList.toggle('open')">
        <span class="toggle-arrow">&#9654;</span> Add a Resource
      </button>
      <div class="add-resource-form-wrap">
      <div class="add-resource-form">
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
          prList.innerHTML = '<div class="resources-grid">' + resources.map(r => renderItem(r, {})).join('') + '</div>';
          wireButtons(prList, refresh);
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
      renderList(resources, listEl, {}, refresh);
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

  function wireButtons(container, refreshFn) {
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
    container.querySelectorAll('.resource-edit').forEach(btn => {
      btn.onclick = function (e) {
        e.stopPropagation();
        const item = btn.closest('.resource-item');
        if (!item) return;
        const id = item.getAttribute('data-id');
        const typeOptions = ['book','article','reference','video','podcast','powerpoint','tool'].map(t =>
          `<option value="${t}"${t === item.getAttribute('data-type') ? ' selected' : ''}>${t.charAt(0).toUpperCase() + t.slice(1)}</option>`
        ).join('');
        const form = document.createElement('div');
        form.className = 'resource-edit-form';
        form.innerHTML = `
          <div class="ref-row"><input type="text" class="ref-title" value="${item.getAttribute('data-title')}" placeholder="Title"></div>
          <div class="ref-row"><input type="text" class="ref-author" value="${item.getAttribute('data-author')}" placeholder="Author (optional)"></div>
          <div class="ref-row"><input type="url" class="ref-url" value="${item.getAttribute('data-url')}" placeholder="URL (optional)"></div>
          <div class="ref-row"><input type="text" class="ref-desc" value="${item.getAttribute('data-desc')}" placeholder="Description (optional)"></div>
          <div class="ref-row"><select class="ref-type">${typeOptions}</select><button class="ref-save">Save</button><button class="ref-cancel">Cancel</button></div>`;
        item.style.display = 'none';
        item.parentNode.insertBefore(form, item);
        form.querySelector('.ref-cancel').onclick = function () {
          item.style.display = '';
          form.remove();
        };
        form.querySelector('.ref-save').onclick = async function () {
          const title = form.querySelector('.ref-title').value.trim();
          if (!title) return;
          const saveBtn = form.querySelector('.ref-save');
          saveBtn.disabled = true;
          saveBtn.textContent = 'Saving\u2026';
          const result = await updateResource(id, {
            title: title,
            author: form.querySelector('.ref-author').value.trim() || null,
            url: form.querySelector('.ref-url').value.trim() || null,
            description: form.querySelector('.ref-desc').value.trim() || null,
            resource_type: form.querySelector('.ref-type').value
          });
          if (result && refreshFn) {
            form.remove();
            refreshFn();
          } else {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save';
          }
        };
      };
    });
  }

  function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  window.VCTResources = { init, initAll, fetchResources, addResource, updateResource, deleteResource };
})();
