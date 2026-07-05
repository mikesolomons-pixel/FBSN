// ============================================================
// FBSN feature flags
// ============================================================
// Single source of truth for turning app-wide features on / off.
// Flip a value here, refresh, and every page reacts.
//
// See rebuild-multiplayer.md at the repo root for the full path to
// re-enable multiplayer with a Supabase backend.
// ============================================================

(function () {
  window.FBSN_FLAGS = {
    // Multiplayer virtual sessions — host.html, join.html, test-harness.html,
    // realtime rooms/participants/votes in Supabase, "Host Virtual Session"
    // CTAs across the app. When false, the app runs in solo-only mode.
    multiplayer: false
  };

  var flags = window.FBSN_FLAGS;

  if (!flags.multiplayer) {
    // 1. Hide DOM elements marked as multiplayer-only.
    document.documentElement.classList.add('no-multiplayer');
    var style = document.createElement('style');
    style.textContent = '.no-multiplayer .multiplayer-only{display:none!important;}';
    (document.head || document.documentElement).appendChild(style);

    // 2. Bounce visitors who land directly on a multiplayer-only page.
    var page = window.location.pathname.split('/').pop().replace(/\.html$/, '');
    if (page === 'host' || page === 'join' || page === 'test-harness') {
      // Use replace so back button doesn't bring them back to the disabled page.
      window.location.replace('fbsn.html');
    }
  }
})();
