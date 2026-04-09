(function() {
  // Skip auth on login page
  if (window.location.pathname.endsWith('login.html')) return;

  // Hide page until auth check completes
  document.documentElement.style.visibility = 'hidden';

  async function checkAuth() {
    var sb = null;
    for (var i = 0; i < 30; i++) {
      if (window.supabaseClient) { sb = window.supabaseClient; break; }
      await new Promise(function(r) { setTimeout(r, 100); });
    }
    if (!sb) {
      window.location.href = 'login.html';
      return;
    }

    var result = await sb.auth.getSession();
    var session = result.data.session;
    if (!session) {
      window.location.href = 'login.html';
      return;
    }

    // Build user object locally — do NOT assign to window.VCTUser
    // until the profile (including role) has been fetched.
    var user = {
      id: session.user.id,
      email: session.user.email,
      fullName: session.user.user_metadata?.full_name || session.user.email,
      role: 'practitioner'
    };

    // Fetch profile to get role
    var profileResult = await sb.from('profiles').select('role, full_name').eq('id', session.user.id).single();
    if (profileResult.data) {
      user.role = profileResult.data.role;
      user.fullName = profileResult.data.full_name || user.fullName;
    } else if (profileResult.error) {
      console.warn('Profile fetch failed, defaulting to practitioner:', profileResult.error.message);
    }

    // NOW expose the fully-populated user object
    window.VCTUser = user;

    // Show the page
    document.documentElement.style.visibility = 'visible';
    if (document.body) document.body.style.visibility = 'visible';

    if (window.VCTUser.role === 'admin') {
      if (document.body) document.body.classList.add('vct-admin');
    }
  }

  // Expose helpers immediately
  window.VCTAuth = {
    isLoggedIn: function() { return !!window.VCTUser; },
    isAdmin: function() { return window.VCTUser?.role === 'admin'; },
    getUser: function() { return window.VCTUser; },
    logout: async function() {
      var sb = window.supabaseClient;
      if (sb) await sb.auth.signOut();
      window.VCTUser = null;
      window.location.href = 'login.html';
    }
  };
  window.isVCTAdmin = function() { return window.VCTUser?.role === 'admin'; };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAuth);
  } else {
    checkAuth();
  }
})();
