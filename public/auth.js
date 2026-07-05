/**
 * FBSN local-only auth stub.
 *
 * The app used to authenticate via Supabase. In local-only mode there
 * is no server, no accounts, and no gating — every user is treated as
 * the single admin/facilitator.
 *
 * We keep the same window.VCTAuth / window.VCTUser surface so
 * downstream code that calls VCTAuth.isAdmin() or reads
 * window.VCTUser.role keeps working without changes.
 *
 * See rebuild-supabase.md at the repo root to bring real auth back.
 */
(function () {
  var user = {
    id: 'local',
    email: 'local@local',
    fullName: 'Facilitator',
    role: 'admin'
  };

  window.VCTUser = user;
  window.VCTAuth = {
    isLoggedIn: function () { return true; },
    isAdmin:    function () { return true; },
    getUser:    function () { return user; },
    logout:     function () { /* nothing to log out of */ }
  };
  window.isVCTAdmin = function () { return true; };

  // Mark body so any styles that scope to .vct-admin still apply.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      if (document.body) document.body.classList.add('vct-admin');
    });
  } else if (document.body) {
    document.body.classList.add('vct-admin');
  }
})();
