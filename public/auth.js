(function() {
  // Skip auth on login page
  if (window.location.pathname.endsWith('login.html')) return;

  // Hide page until auth check completes
  document.documentElement.style.visibility = 'hidden';

  // Wait for supabaseClient to be available (set by supabase-config.js which loads as module)
  async function checkAuth() {
    let sb = null;
    for (let i = 0; i < 30; i++) {
      if (window.supabaseClient) { sb = window.supabaseClient; break; }
      await new Promise(r => setTimeout(r, 100));
    }
    if (!sb) {
      // Supabase not available, redirect to login
      window.location.href = 'login.html';
      return;
    }

    const { data: { session } } = await sb.auth.getSession();
    if (!session) {
      window.location.href = 'login.html';
      return;
    }

    // User is authenticated — store user info globally
    window.VCTUser = {
      id: session.user.id,
      email: session.user.email,
      fullName: session.user.user_metadata?.full_name || session.user.email,
      role: null // Will be fetched from profiles table
    };

    // Fetch profile to get role
    const { data: profile } = await sb.from('profiles').select('role, full_name').eq('id', session.user.id).single();
    if (profile) {
      window.VCTUser.role = profile.role;
      window.VCTUser.fullName = profile.full_name || window.VCTUser.fullName;
    }

    // Show the page
    document.documentElement.style.visibility = 'visible';
    document.body && (document.body.style.visibility = 'visible');

    // Add admin class if admin
    if (window.VCTUser.role === 'admin') {
      document.body?.classList.add('vct-admin');
    }
  }

  // Also expose helper functions
  window.VCTAuth = {
    isLoggedIn: function() { return !!window.VCTUser; },
    isAdmin: function() { return window.VCTUser?.role === 'admin'; },
    getUser: function() { return window.VCTUser; },
    logout: async function() {
      const sb = window.supabaseClient;
      if (sb) await sb.auth.signOut();
      window.VCTUser = null;
      window.location.href = 'login.html';
    }
  };

  // Legacy compatibility
  window.isVCTAdmin = function() {
    return window.VCTUser?.role === 'admin';
  };

  // Run auth check
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAuth);
  } else {
    checkAuth();
  }
})();
