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
    .admin-badge{position:fixed;bottom:12px;left:12px;z-index:10000;background:linear-gradient(135deg,#E07A5F,#D4A843);color:#fff;padding:.35rem .85rem;border-radius:20px;font-size:.7rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;box-shadow:0 2px 12px rgba(224,122,95,.4);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;cursor:default;display:flex;align-items:center;gap:.5rem}
    .admin-badge button{background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.3);color:#fff;padding:.2rem .5rem;border-radius:4px;font-size:.6rem;font-weight:600;cursor:pointer;font-family:inherit}
    .admin-badge button:hover{background:rgba(255,255,255,.35)}

    /* Admin login button (for non-admin users) */
    .admin-login-btn{position:fixed;bottom:12px;left:12px;z-index:10000;background:rgba(27,42,74,0.08);border:1px solid rgba(27,42,74,0.15);color:#5A6B8A;padding:.35rem .7rem;border-radius:16px;font-size:.65rem;font-weight:600;letter-spacing:.5px;cursor:pointer;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;transition:all .2s;display:flex;align-items:center;gap:.3rem}
    .admin-login-btn:hover{background:rgba(224,122,95,0.12);border-color:rgba(224,122,95,0.3);color:#E07A5F}
    .admin-login-btn svg{width:10px;height:10px;opacity:.6}

    /* Admin login popover */
    .admin-popover{position:fixed;bottom:44px;left:12px;z-index:10001;background:#fff;border-radius:12px;padding:1.25rem;box-shadow:0 8px 32px rgba(27,42,74,0.18);border:1px solid #E2E8F0;width:260px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:none}
    .admin-popover.open{display:block}
    .admin-popover h4{font-size:.8rem;font-weight:700;color:#1B2A4A;margin:0 0 .1rem 0}
    .admin-popover .ap-sub{font-size:.7rem;color:#5A6B8A;margin:0 0 .75rem 0}
    .admin-popover input{width:100%;padding:.55rem .75rem;border:1.5px solid #E2E8F0;border-radius:8px;font-size:.82rem;font-family:inherit;outline:none;box-sizing:border-box;transition:border-color .15s}
    .admin-popover input:focus{border-color:#E07A5F}
    .admin-popover .ap-error{color:#EF5350;font-size:.7rem;margin-top:.35rem;display:none}
    .admin-popover .ap-actions{display:flex;gap:.5rem;margin-top:.75rem}
    .admin-popover .ap-btn{flex:1;padding:.5rem;border-radius:8px;font-size:.78rem;font-weight:600;cursor:pointer;border:none;font-family:inherit;transition:all .15s}
    .admin-popover .ap-btn.primary{background:linear-gradient(135deg,#E07A5F,#D4A843);color:#fff}
    .admin-popover .ap-btn.primary:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(224,122,95,.3)}
    .admin-popover .ap-btn.cancel{background:#F5F7FA;color:#5A6B8A;border:1px solid #E2E8F0}
    .admin-popover .ap-btn.cancel:hover{background:#E2E8F0}

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
    badge.innerHTML = 'Admin Mode <button id="admin-console-link">Console</button> <button id="admin-logout">Logout</button>';
    document.body.appendChild(badge);
    document.getElementById('admin-console-link').onclick = function () {
      window.location.href = 'admin-console.html';
    };
    document.getElementById('admin-logout').onclick = function () {
      sessionStorage.removeItem('vct_admin');
      sessionStorage.removeItem('vct_auth');
      location.reload();
    };
  }

  /* ── Admin login button (for non-admins) ────────────────── */
  function addAdminLoginButton() {
    // Button
    const btn = document.createElement('button');
    btn.className = 'admin-login-btn';
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Admin';
    document.body.appendChild(btn);

    // Popover
    const pop = document.createElement('div');
    pop.className = 'admin-popover';
    pop.innerHTML = `
      <h4>Admin Login</h4>
      <p class="ap-sub">Enter admin password to enable editing</p>
      <input type="password" id="ap-pass" placeholder="Admin password" autocomplete="off">
      <div class="ap-error" id="ap-error">Incorrect admin password</div>
      <div class="ap-actions">
        <button class="ap-btn cancel" id="ap-cancel">Cancel</button>
        <button class="ap-btn primary" id="ap-submit">Login</button>
      </div>
    `;
    document.body.appendChild(pop);

    // Toggle popover
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      pop.classList.toggle('open');
      if (pop.classList.contains('open')) {
        const input = document.getElementById('ap-pass');
        input.value = '';
        document.getElementById('ap-error').style.display = 'none';
        setTimeout(() => input.focus(), 50);
      }
    });

    // Close on outside click
    document.addEventListener('click', function (e) {
      if (!pop.contains(e.target) && e.target !== btn) {
        pop.classList.remove('open');
      }
    });

    // Cancel
    document.getElementById('ap-cancel').addEventListener('click', function () {
      pop.classList.remove('open');
    });

    // Hash helper (same as auth.js)
    function simpleHash(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
      }
      return (hash >>> 0).toString(16);
    }

    // Submit
    function tryAdminLogin() {
      const input = document.getElementById('ap-pass');
      const hash = simpleHash(input.value);
      if (hash === ADMIN_HASH) {
        sessionStorage.setItem('vct_auth', 'b89ca00e');
        sessionStorage.setItem('vct_admin', ADMIN_HASH);
        // Remove login button and popover, activate admin mode
        btn.remove();
        pop.remove();
        document.body.classList.add('vct-admin');
        addAdminBadge();
        enableEditing();
        // Re-render resources if the function exists (to show delete buttons)
        if (window.VCTResources && window.VCTResources.refresh) {
          window.VCTResources.refresh();
        }
      } else {
        document.getElementById('ap-error').style.display = 'block';
        input.value = '';
        input.focus();
      }
    }

    document.getElementById('ap-submit').addEventListener('click', tryAdminLogin);
    document.getElementById('ap-pass').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') tryAdminLogin();
    });
  }

  /* ── Init ───────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    // Always load saved content (for all users)
    setTimeout(loadContent, 600);

    if (isAdmin()) {
      // Admin-only features
      document.body.classList.add('vct-admin');
      addAdminBadge();
      setTimeout(enableEditing, 800);
    } else {
      // Show admin login button for regular users
      addAdminLoginButton();
    }
  });

  // Expose for resources.js to check
  window.isVCTAdmin = function () {
    return sessionStorage.getItem('vct_admin') === ADMIN_HASH;
  };
})();
