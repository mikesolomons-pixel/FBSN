/**
 * admin.js — Admin editing layer for VCT
 * Loaded on every page. Only activates when admin is logged in.
 *
 * Features:
 *  - Inline text editing on any element with [data-editable]
 *  - Persists edits to Supabase `content` table
 *  - Loads saved overrides on page load
 *  - Adds admin toolbar badge
 */
(function () {
  const ADMIN_HASH = '6c221976';

  function isAdmin() {
    return sessionStorage.getItem('vct_admin') === ADMIN_HASH;
  }

  /* ── Inject admin CSS ──────────────────────────────────── */
  const style = document.createElement('style');
  style.textContent = `
    /* Admin toolbar */
    .admin-badge{position:fixed;top:12px;right:12px;z-index:10000;background:linear-gradient(135deg,#E07A5F,#D4A843);color:#fff;padding:.35rem .85rem;border-radius:20px;font-size:.7rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;box-shadow:0 2px 12px rgba(224,122,95,.4);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;cursor:default;display:flex;align-items:center;gap:.5rem}
    .admin-badge button{background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.3);color:#fff;padding:.2rem .5rem;border-radius:4px;font-size:.6rem;font-weight:600;cursor:pointer;font-family:inherit}
    .admin-badge button:hover{background:rgba(255,255,255,.35)}

    /* Editable elements */
    body.vct-admin [data-editable]{position:relative;transition:outline .15s}
    body.vct-admin [data-editable]:hover{outline:2px dashed rgba(224,122,95,.5);outline-offset:3px;cursor:text}
    body.vct-admin [data-editable]:focus{outline:2px solid #E07A5F;outline-offset:3px;background:rgba(224,122,95,.04);border-radius:4px}
    body.vct-admin [data-editable]::after{content:'\\270E';position:absolute;top:-6px;right:-6px;width:18px;height:18px;background:#E07A5F;color:#fff;border-radius:50%;font-size:.65rem;display:none;align-items:center;justify-content:center;line-height:1;pointer-events:none}
    body.vct-admin [data-editable]:hover::after{display:flex}

    /* Resource delete button */
    .resource-delete{display:none;background:#EF5350;color:#fff;border:none;border-radius:4px;font-size:.6rem;font-weight:700;padding:.15rem .4rem;cursor:pointer;margin-left:auto;flex-shrink:0;opacity:.7;transition:opacity .15s}
    .resource-delete:hover{opacity:1}
    body.vct-admin .resource-delete{display:block}

    /* Saving indicator */
    .admin-saving{position:fixed;bottom:16px;right:16px;background:#1B2A4A;color:#fff;padding:.5rem 1rem;border-radius:8px;font-size:.75rem;font-weight:600;z-index:10001;opacity:0;transition:opacity .3s;pointer-events:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
    .admin-saving.show{opacity:1}
  `;
  document.head.appendChild(style);

  /* ── Supabase helper ───────────────────────────────────── */
  async function getClient() {
    for (let i = 0; i < 30; i++) {
      if (window.supabaseClient) return window.supabaseClient;
      await new Promise(r => setTimeout(r, 100));
    }
    return null;
  }

  /* ── Saving indicator ──────────────────────────────────── */
  let saveIndicator;
  function showSaving(msg) {
    if (!saveIndicator) {
      saveIndicator = document.createElement('div');
      saveIndicator.className = 'admin-saving';
      document.body.appendChild(saveIndicator);
    }
    saveIndicator.textContent = msg || 'Saving\u2026';
    saveIndicator.classList.add('show');
    clearTimeout(saveIndicator._t);
    saveIndicator._t = setTimeout(() => saveIndicator.classList.remove('show'), 2000);
  }

  /* ── Content persistence ───────────────────────────────── */
  function getPageKey() {
    return location.pathname.replace(/^\//, '').replace(/\.html$/, '') || 'index';
  }

  async function loadContent() {
    const sb = await getClient();
    if (!sb) return;
    const page = getPageKey();
    const { data } = await sb.from('content').select('*').eq('page', page);
    if (!data) return;
    data.forEach(row => {
      const el = document.querySelector(`[data-editable="${row.key}"]`);
      if (el) el.innerHTML = row.value;
    });
  }

  async function saveContent(key, value) {
    const sb = await getClient();
    if (!sb) return;
    const page = getPageKey();
    showSaving('Saving\u2026');
    // Upsert: try update first, then insert
    const { data: existing } = await sb.from('content')
      .select('id').eq('page', page).eq('key', key).limit(1);
    if (existing && existing.length > 0) {
      await sb.from('content').update({ value }).eq('id', existing[0].id);
    } else {
      await sb.from('content').insert([{ page, key, value }]);
    }
    showSaving('Saved!');
  }

  /* ── Make all [data-editable] elements editable ────────── */
  function enableEditing() {
    document.querySelectorAll('[data-editable]').forEach(el => {
      el.setAttribute('contenteditable', 'true');
      el.setAttribute('spellcheck', 'true');

      let saveTimeout;
      el.addEventListener('input', function () {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
          saveContent(el.getAttribute('data-editable'), el.innerHTML);
        }, 800); // debounce 800ms
      });

      el.addEventListener('keydown', function (e) {
        // Prevent Enter from creating new block elements in single-line fields
        if (e.key === 'Enter' && !el.matches('p, div, .description-card, .section-content')) {
          e.preventDefault();
        }
      });
    });
  }

  /* ── Admin toolbar ─────────────────────────────────────── */
  function addAdminBadge() {
    const badge = document.createElement('div');
    badge.className = 'admin-badge';
    badge.innerHTML = 'Admin Mode <button id="admin-logout">Logout</button>';
    document.body.appendChild(badge);
    document.getElementById('admin-logout').onclick = function () {
      sessionStorage.removeItem('vct_admin');
      sessionStorage.removeItem('vct_auth');
      location.reload();
    };
  }

  /* ── Init ───────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    // Always load saved content (for all users)
    setTimeout(loadContent, 600);

    // Admin-only features
    if (!isAdmin()) return;
    document.body.classList.add('vct-admin');
    addAdminBadge();
    // Wait a tick for content to load, then enable editing
    setTimeout(enableEditing, 800);
  });

  // Expose for resources.js to check
  window.isVCTAdmin = function () {
    return sessionStorage.getItem('vct_admin') === ADMIN_HASH;
  };
})();
