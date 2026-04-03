(function() {
  const PASS_HASH = 'b89ca00e'; // simple hash of the password
  const STORAGE_KEY = 'vct_auth';

  function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return (hash >>> 0).toString(16);
  }

  // Check if already authenticated this session
  if (sessionStorage.getItem(STORAGE_KEY) === PASS_HASH) {
    return; // already authed
  }

  // Hide the page content
  document.documentElement.style.visibility = 'hidden';

  document.addEventListener('DOMContentLoaded', function() {
    document.body.style.visibility = 'hidden';

    // Create overlay
    var overlay = document.createElement('div');
    overlay.id = 'auth-overlay';
    overlay.innerHTML = `
      <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:linear-gradient(135deg,#1B2A4A 0%,#2C3E6B 50%,#006B5E 100%);display:flex;align-items:center;justify-content:center;z-index:999999;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <div style="background:white;border-radius:16px;padding:2.5rem;box-shadow:0 16px 48px rgba(0,0,0,0.3);text-align:center;max-width:380px;width:90%;">
          <h1 style="font-size:1.4rem;color:#1B2A4A;margin:0 0 0.25rem 0;">Value Creating Teams</h1>
          <p style="color:#5A6B8A;font-size:0.8rem;margin:0 0 1.5rem 0;">Enter password to continue</p>
          <input type="password" id="auth-pass" placeholder="Password" style="width:100%;padding:0.75rem 1rem;border:1.5px solid #E2E8F0;border-radius:8px;font-size:0.95rem;font-family:inherit;box-sizing:border-box;margin-bottom:0.75rem;outline:none;" autofocus>
          <div id="auth-error" style="color:#EF5350;font-size:0.8rem;margin-bottom:0.75rem;display:none;">Incorrect password</div>
          <button id="auth-btn" style="width:100%;padding:0.75rem;background:linear-gradient(135deg,#1B2A4A,#006B5E);color:white;border:none;border-radius:8px;font-size:0.95rem;font-weight:600;cursor:pointer;font-family:inherit;">Enter</button>
          <p style="color:#5A6B8A;font-size:0.65rem;margin:1rem 0 0 0;text-transform:uppercase;letter-spacing:2px;">Korn Ferry</p>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    document.documentElement.style.visibility = 'visible';
    overlay.style.visibility = 'visible';

    function tryAuth() {
      var input = document.getElementById('auth-pass');
      var hash = simpleHash(input.value);
      if (hash === PASS_HASH) {
        sessionStorage.setItem(STORAGE_KEY, PASS_HASH);
        overlay.remove();
        document.body.style.visibility = 'visible';
      } else {
        document.getElementById('auth-error').style.display = 'block';
        input.value = '';
        input.focus();
      }
    }

    document.getElementById('auth-btn').addEventListener('click', tryAuth);
    document.getElementById('auth-pass').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') tryAuth();
    });
  });
})();
