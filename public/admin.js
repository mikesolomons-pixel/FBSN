/**
 * admin.js — small floating nav badge for the local-only build.
 *
 * The Supabase-backed "admin editing layer" (inline content overrides,
 * users, invite codes, etc.) has been removed. This file now only
 * renders a tiny badge with a Clients link so the facilitator can
 * reach their local client-tracking data from anywhere in the app.
 *
 * See rebuild-supabase.md for the path to bring the full editing
 * console back if you ever restore a backend.
 */
(function () {
  var style = document.createElement('style');
  style.textContent = [
    '.admin-badge{position:fixed;bottom:12px;left:12px;z-index:10000;background:linear-gradient(135deg,#E07A5F,#D4A843);color:#fff;padding:.35rem .85rem;border-radius:20px;font-size:.7rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;box-shadow:0 2px 12px rgba(224,122,95,.4);font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;display:flex;align-items:center;gap:.5rem}',
    '.admin-badge button{background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.3);color:#fff;padding:.2rem .5rem;border-radius:4px;font-size:.6rem;font-weight:600;cursor:pointer;font-family:inherit}',
    '.admin-badge button:hover{background:rgba(255,255,255,.35)}',
    /* Show resource-delete controls (used by resources.js) since every user is now an admin. */
    '.resource-delete{background:#EF5350;color:#fff;border:none;border-radius:4px;font-size:.6rem;font-weight:700;padding:.15rem .4rem;cursor:pointer;margin-left:auto;flex-shrink:0;opacity:.7;transition:opacity .15s}',
    '.resource-delete:hover{opacity:1}'
  ].join('');
  document.head.appendChild(style);

  function esc(s) {
    if (!s) return '';
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function addBadge() {
    // Don't add the badge on the clients page itself.
    var page = location.pathname.split('/').pop().replace(/\.html$/, '');
    if (page === 'clients') return;

    var badge = document.createElement('div');
    badge.className = 'admin-badge';
    badge.innerHTML = 'Facilitator <button id="admin-clients-link">Clients</button>';
    document.body.appendChild(badge);
    document.getElementById('admin-clients-link').onclick = function () {
      window.location.href = 'clients.html';
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addBadge);
  } else {
    addBadge();
  }
})();
