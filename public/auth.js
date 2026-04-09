(function() {
  // Skip auth on login page
  if (window.location.pathname.endsWith('login.html')) return;

  // Legacy password hashes (fallback while Supabase auth is being set up)
  var PASS_HASH = 'b89ca00e';
  var ADMIN_HASH = '6c221976';

  // If already authed via legacy, skip
  if (sessionStorage.getItem('vct_auth') === PASS_HASH || sessionStorage.getItem('vct_admin') === ADMIN_HASH) {
    // Set up legacy VCTUser/VCTAuth for compatibility
    var isAdm = sessionStorage.getItem('vct_admin') === ADMIN_HASH;
    window.VCTUser = { id: 'legacy', email: '', fullName: 'Admin', role: isAdm ? 'admin' : 'practitioner' };
    window.VCTAuth = {
      isLoggedIn: function() { return true; },
      isAdmin: function() { return isAdm; },
      getUser: function() { return window.VCTUser; },
      logout: async function() {
        sessionStorage.removeItem('vct_auth');
        sessionStorage.removeItem('vct_admin');
        var sb = window.supabaseClient;
        if (sb) await sb.auth.signOut();
        window.VCTUser = null;
        window.location.href = 'login.html';
      }
    };
    window.isVCTAdmin = function() { return isAdm; };
    if (isAdm) {
      document.addEventListener('DOMContentLoaded', function() {
        document.body.classList.add('vct-admin');
      });
    }
    return;
  }

  // Hide page until auth check completes
  document.documentElement.style.visibility = 'hidden';

  async function checkAuth() {
    // Try Supabase auth first
    var sb = null;
    for (var i = 0; i < 30; i++) {
      if (window.supabaseClient) { sb = window.supabaseClient; break; }
      await new Promise(function(r) { setTimeout(r, 100); });
    }

    if (sb) {
      try {
        var result = await sb.auth.getSession();
        var session = result.data.session;
        if (session) {
          // Supabase auth succeeded
          window.VCTUser = {
            id: session.user.id,
            email: session.user.email,
            fullName: session.user.user_metadata?.full_name || session.user.email,
            role: null
          };

          // Fetch profile to get role
          var profileResult = await sb.from('profiles').select('role, full_name').eq('id', session.user.id).single();
          if (profileResult.data) {
            window.VCTUser.role = profileResult.data.role;
            window.VCTUser.fullName = profileResult.data.full_name || window.VCTUser.fullName;
          }

          // Show the page
          document.documentElement.style.visibility = 'visible';
          if (document.body) document.body.style.visibility = 'visible';

          if (window.VCTUser.role === 'admin') {
            if (document.body) document.body.classList.add('vct-admin');
          }
          return; // done
        }
      } catch(e) {
        console.warn('Supabase auth check failed:', e);
      }
    }

    // Supabase auth failed or no session — show password fallback
    showPasswordFallback();
  }

  function showPasswordFallback() {
    document.documentElement.style.visibility = 'visible';

    var overlay = document.createElement('div');
    overlay.id = 'auth-overlay';
    overlay.innerHTML = '<div style="position:fixed;top:0;left:0;width:100%;height:100%;background:linear-gradient(135deg,#1B2A4A 0%,#2C3E6B 50%,#006B5E 100%);display:flex;align-items:center;justify-content:center;z-index:999999;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">'
      + '<div style="background:white;border-radius:16px;padding:2.5rem;box-shadow:0 16px 48px rgba(0,0,0,0.3);text-align:center;max-width:380px;width:90%;">'
      + '<h1 style="font-size:1.4rem;color:#1B2A4A;margin:0 0 0.25rem 0;">Value Creating Teams</h1>'
      + '<p style="color:#5A6B8A;font-size:0.8rem;margin:0 0 0.75rem 0;">Sign in to continue</p>'
      + '<a href="login.html" style="display:block;padding:0.75rem;background:linear-gradient(135deg,#1B2A4A,#006B5E);color:white;border:none;border-radius:8px;font-size:0.9rem;font-weight:600;text-decoration:none;margin-bottom:0.75rem;">Sign In with Email</a>'
      + '<div style="display:flex;align-items:center;gap:0.5rem;margin:0.75rem 0;"><div style="flex:1;height:1px;background:#E2E8F0;"></div><span style="font-size:0.7rem;color:#9AA5B8;">or use password</span><div style="flex:1;height:1px;background:#E2E8F0;"></div></div>'
      + '<input type="password" id="auth-pass" placeholder="Password" style="width:100%;padding:0.75rem 1rem;border:1.5px solid #E2E8F0;border-radius:8px;font-size:0.95rem;font-family:inherit;box-sizing:border-box;margin-bottom:0.75rem;outline:none;">'
      + '<div id="auth-error" style="color:#EF5350;font-size:0.8rem;margin-bottom:0.75rem;display:none;">Incorrect password</div>'
      + '<button id="auth-btn" style="width:100%;padding:0.75rem;background:#E07A5F;color:white;border:none;border-radius:8px;font-size:0.9rem;font-weight:600;cursor:pointer;font-family:inherit;">Enter</button>'
      + '</div></div>';

    if (document.body) {
      document.body.style.visibility = 'hidden';
      document.body.appendChild(overlay);
      document.body.style.visibility = 'visible';
    } else {
      document.addEventListener('DOMContentLoaded', function() {
        document.body.style.visibility = 'hidden';
        document.body.appendChild(overlay);
        document.body.style.visibility = 'visible';
      });
    }

    function wireEvents() {
      var btn = document.getElementById('auth-btn');
      var input = document.getElementById('auth-pass');
      if (!btn || !input) {
        setTimeout(wireEvents, 50);
        return;
      }

      function simpleHash(str) {
        var hash = 0;
        for (var i = 0; i < str.length; i++) {
          var c = str.charCodeAt(i);
          hash = ((hash << 5) - hash) + c;
          hash |= 0;
        }
        return (hash >>> 0).toString(16);
      }

      function tryAuth() {
        var hash = simpleHash(input.value);
        if (hash === ADMIN_HASH) {
          sessionStorage.setItem('vct_auth', PASS_HASH);
          sessionStorage.setItem('vct_admin', ADMIN_HASH);
          window.VCTUser = { id: 'legacy', email: '', fullName: 'Admin', role: 'admin' };
          overlay.remove();
          document.body.style.visibility = 'visible';
          document.body.classList.add('vct-admin');
        } else if (hash === PASS_HASH) {
          sessionStorage.setItem('vct_auth', PASS_HASH);
          window.VCTUser = { id: 'legacy', email: '', fullName: 'User', role: 'practitioner' };
          overlay.remove();
          document.body.style.visibility = 'visible';
        } else {
          document.getElementById('auth-error').style.display = 'block';
          input.value = '';
          input.focus();
        }
      }

      btn.addEventListener('click', tryAuth);
      input.addEventListener('keydown', function(e) { if (e.key === 'Enter') tryAuth(); });
      input.focus();
    }
    wireEvents();
  }

  // Expose helpers immediately (before async check completes)
  window.VCTAuth = {
    isLoggedIn: function() { return !!window.VCTUser; },
    isAdmin: function() { return window.VCTUser?.role === 'admin'; },
    getUser: function() { return window.VCTUser; },
    logout: async function() {
      sessionStorage.removeItem('vct_auth');
      sessionStorage.removeItem('vct_admin');
      var sb = window.supabaseClient;
      if (sb) await sb.auth.signOut();
      window.VCTUser = null;
      window.location.href = 'login.html';
    }
  };
  window.isVCTAdmin = function() { return window.VCTUser?.role === 'admin'; };

  // Run auth check
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAuth);
  } else {
    checkAuth();
  }
})();
