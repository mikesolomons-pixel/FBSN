/**
 * tutorial.js — Guided product tour for VCT
 * Call VCTTutorial.start() to launch.
 * Adds a floating "Take a Tour" button if not dismissed.
 */
(function () {

  /* ── Inject CSS ─────────────────────────────────────────── */
  const css = document.createElement('style');
  css.textContent = `
    /* Overlay */
    .tour-overlay{position:fixed;inset:0;z-index:20000;pointer-events:none}
    .tour-overlay.active{pointer-events:auto}

    /* Backdrop with cutout */
    .tour-backdrop{position:fixed;inset:0;z-index:20001;transition:opacity .3s}
    .tour-backdrop.active{opacity:1}

    /* Spotlight cutout — we use box-shadow for the darkening effect */
    .tour-spotlight{position:fixed;z-index:20002;border-radius:12px;transition:all .35s cubic-bezier(.4,0,.2,1);pointer-events:none;box-shadow:0 0 0 9999px rgba(27,42,74,.65)}

    /* Tooltip */
    .tour-tooltip{position:fixed;z-index:20003;background:#fff;border-radius:16px;padding:1.75rem;max-width:420px;width:90vw;box-shadow:0 12px 48px rgba(27,42,74,.2);transition:all .35s cubic-bezier(.4,0,.2,1);opacity:0;transform:translateY(12px)}
    .tour-tooltip.visible{opacity:1;transform:translateY(0)}
    .tour-tooltip::before{content:'';position:absolute;width:14px;height:14px;background:#fff;transform:rotate(45deg);box-shadow:-2px -2px 4px rgba(27,42,74,.06)}
    .tour-tooltip.arrow-top::before{top:-7px;left:2rem}
    .tour-tooltip.arrow-bottom::before{bottom:-7px;left:2rem}
    .tour-tooltip.arrow-left::before{left:-7px;top:2rem}

    /* Tooltip content */
    .tour-step-badge{display:inline-block;font-size:.6rem;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#fff;background:linear-gradient(135deg,#1B2A4A,#00897B);padding:.2rem .6rem;border-radius:4px;margin-bottom:.75rem}
    .tour-title{font-size:1.1rem;font-weight:700;color:#1B2A4A;margin-bottom:.5rem;line-height:1.3}
    .tour-body{font-size:.88rem;color:#5A6B8A;line-height:1.65;margin-bottom:1.25rem}
    .tour-body strong{color:#1B2A4A;font-weight:600}
    .tour-body ul{margin:.5rem 0 0 1.1rem;padding:0}
    .tour-body li{margin-bottom:.3rem}
    .tour-body a{color:#00897B;font-weight:600;text-decoration:none}
    .tour-body a:hover{text-decoration:underline}

    /* Use case pills */
    .tour-use-cases{display:flex;gap:.5rem;flex-wrap:wrap;margin:.75rem 0}
    .tour-uc{display:flex;align-items:center;gap:.4rem;padding:.4rem .75rem;border-radius:8px;font-size:.78rem;font-weight:600}
    .tour-uc.learn{background:#E0F2F1;color:#006B5E}
    .tour-uc.run{background:#FDF0EC;color:#C4451C}
    .tour-uc.bd{background:#E3F2FD;color:#1565C0}

    /* Controls */
    .tour-controls{display:flex;align-items:center;gap:.5rem}
    .tour-dots{display:flex;gap:.35rem;flex:1}
    .tour-dot{width:8px;height:8px;border-radius:50%;background:#E2E8F0;transition:all .2s}
    .tour-dot.active{background:#00897B;width:20px;border-radius:4px}
    .tour-dot.done{background:#4DB6AC}
    .tour-btn{padding:.5rem 1.1rem;border-radius:8px;font-size:.82rem;font-weight:600;cursor:pointer;border:none;font-family:inherit;transition:all .15s}
    .tour-btn-primary{background:#00897B;color:#fff}
    .tour-btn-primary:hover{background:#006B5E;transform:translateY(-1px)}
    .tour-btn-ghost{background:transparent;color:#5A6B8A}
    .tour-btn-ghost:hover{background:#F5F7FA}

    /* Take a Tour floating button */
    .tour-trigger{position:fixed;bottom:12px;right:12px;z-index:9999;background:linear-gradient(135deg,#1B2A4A,#00897B);color:#fff;border:none;padding:.55rem 1.1rem;border-radius:24px;font-size:.78rem;font-weight:700;cursor:pointer;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;box-shadow:0 4px 16px rgba(27,42,74,.25);transition:all .2s;display:flex;align-items:center;gap:.4rem;letter-spacing:.3px}
    .tour-trigger:hover{transform:translateY(-2px);box-shadow:0 6px 24px rgba(27,42,74,.35)}
    .tour-trigger svg{width:14px;height:14px}

    /* Welcome modal (step 0) */
    .tour-welcome{position:fixed;inset:0;z-index:20005;display:flex;align-items:center;justify-content:center;background:rgba(27,42,74,.6);opacity:0;transition:opacity .3s}
    .tour-welcome.active{opacity:1}
    .tour-welcome-card{background:#fff;border-radius:20px;padding:2.5rem;max-width:520px;width:90vw;box-shadow:0 20px 60px rgba(27,42,74,.25);text-align:center;transform:scale(.95);transition:transform .3s}
    .tour-welcome.active .tour-welcome-card{transform:scale(1)}
    .tour-welcome-badge{display:inline-block;padding:.3rem .8rem;background:linear-gradient(135deg,#E07A5F,#D4A843);color:#fff;border-radius:20px;font-size:.65rem;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:1rem}
    .tour-welcome h2{font-size:1.5rem;font-weight:800;color:#1B2A4A;margin-bottom:.5rem}
    .tour-welcome p{font-size:.9rem;color:#5A6B8A;line-height:1.65;margin-bottom:1.25rem}
    .tour-welcome-uses{display:flex;flex-direction:column;gap:.6rem;text-align:left;margin:1.25rem 0 1.5rem;padding:1.25rem;background:#F5F7FA;border-radius:12px}
    .tour-wu-item{display:flex;align-items:flex-start;gap:.75rem;font-size:.85rem;color:#1B2A4A;line-height:1.5}
    .tour-wu-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:1rem}
    .tour-wu-item:nth-child(1) .tour-wu-icon{background:#E0F2F1;color:#006B5E}
    .tour-wu-item:nth-child(2) .tour-wu-icon{background:#FDF0EC;color:#C4451C}
    .tour-wu-item:nth-child(3) .tour-wu-icon{background:#E3F2FD;color:#1565C0}
    .tour-wu-label{font-weight:700}
    .tour-wu-desc{color:#5A6B8A;font-size:.82rem}
    .tour-welcome-actions{display:flex;gap:.75rem;justify-content:center}
    .tour-welcome-start{padding:.7rem 2rem;background:linear-gradient(135deg,#1B2A4A,#00897B);color:#fff;border:none;border-radius:10px;font-size:.9rem;font-weight:700;cursor:pointer;font-family:inherit;transition:all .15s}
    .tour-welcome-start:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,137,123,.3)}
    .tour-welcome-skip{padding:.7rem 1.5rem;background:transparent;border:1px solid #E2E8F0;color:#5A6B8A;border-radius:10px;font-size:.85rem;cursor:pointer;font-family:inherit}
    .tour-welcome-skip:hover{background:#F5F7FA}

    @media(max-width:600px){
      .tour-tooltip{max-width:calc(100vw - 2rem);padding:1.25rem}
      .tour-welcome-card{padding:1.5rem}
      .tour-trigger{bottom:60px}
    }
  `;
  document.head.appendChild(css);

  /* ── Tour steps ─────────────────────────────────────────── */
  const STEPS = [
    {
      target: '.hero',
      title: 'Welcome to Value Creating Teams',
      body: 'This is the home base. From here you can access the five plays, explore practices, and find resources. Each section is designed to support how you <strong>learn</strong>, <strong>deliver</strong>, and <strong>grow</strong> VCT engagements.',
      position: 'bottom'
    },
    {
      target: '.lifecycle',
      title: 'The Client Engagement Lifecycle',
      body: 'Every VCT engagement follows three phases: <strong>Calibration</strong> (understanding the team), <strong>Designing Scaffolding</strong> (building structure), and <strong>Ongoing Practice</strong> (building capability). Click into Calibration to see its full workflow.',
      position: 'bottom'
    },
    {
      target: '.cycle-container',
      targetFallback: '.plays-mobile',
      title: 'The Five Plays',
      body: 'The core of VCT. Five interconnected plays that teams cycle through repeatedly:<ul><li><strong>Sensemaking</strong> &mdash; Where are we now?</li><li><strong>Imagining</strong> &mdash; Where could we go?</li><li><strong>Navigating</strong> &mdash; How do we move through complexity?</li><li><strong>Collaborating</strong> &mdash; How do we work together?</li><li><strong>Value Creating</strong> &mdash; Are we creating real impact?</li></ul>Click any play to see its practices, resources, and tools.',
      position: 'bottom'
    },
    {
      target: '.cycle-card[href="play1-sensemaking.html"]',
      targetFallback: '.play-card.play-1',
      title: 'Play 1: Sensemaking &mdash; Start Here',
      body: 'Sensemaking is where most engagements begin. It contains the <strong>FBSN Exercise</strong> (Facts, Beliefs, Signals, Noise) and <strong>Assumption Mapping</strong> &mdash; both fully automated tools you can run right now.<br><br>Click into Play 1 to explore the practices and try them out.',
      position: 'bottom'
    },
    {
      target: '.quick-launch, .ql-btn-primary',
      targetFallback: null,
      title: 'Quick Launch',
      body: 'Jump straight into a practice from here. The <strong>FBSN Exercise</strong> is the flagship tool &mdash; try the built-in Netflix example to learn the method, or start a blank session to run it with a real team.',
      position: 'top',
      skip: function () { return !document.querySelector('.quick-launch'); }
    },
    {
      target: '.big-ideas',
      title: 'Principles & Beliefs',
      body: 'The intellectual foundation behind VCT. These principles guide how practitioners approach engagements &mdash; from <em>"Leadership is a Team Sport"</em> to <em>"Conflict is Data, Not Dysfunction."</em> These are evolving and editable by admins.',
      position: 'top'
    },
    {
      target: '#all-resources-list',
      title: 'Resources Library',
      body: 'Books, articles, videos, and tools curated for VCT practitioners. Resources are organized by play and practice. Anyone can add resources &mdash; admins can also edit and delete.',
      position: 'top'
    }
  ];

  /* ── State ──────────────────────────────────────────────── */
  let currentStep = -1;
  let overlay, spotlight, tooltip;
  let isActive = false;

  /* ── Create DOM elements ────────────────────────────────── */
  function createElements() {
    if (overlay) return;

    overlay = document.createElement('div');
    overlay.className = 'tour-overlay';

    spotlight = document.createElement('div');
    spotlight.className = 'tour-spotlight';

    tooltip = document.createElement('div');
    tooltip.className = 'tour-tooltip';

    overlay.appendChild(spotlight);
    overlay.appendChild(tooltip);
    document.body.appendChild(overlay);

    // Close on overlay click (outside tooltip)
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) end();
    });
  }

  /* ── Position helpers ───────────────────────────────────── */
  function getTarget(step) {
    let el = document.querySelector(step.target);
    if (!el && step.targetFallback) el = document.querySelector(step.targetFallback);
    return el;
  }

  function positionSpotlight(el) {
    if (!el) {
      spotlight.style.opacity = '0';
      return;
    }
    const r = el.getBoundingClientRect();
    const pad = 8;
    spotlight.style.opacity = '1';
    spotlight.style.top = (r.top - pad) + 'px';
    spotlight.style.left = (r.left - pad) + 'px';
    spotlight.style.width = (r.width + pad * 2) + 'px';
    spotlight.style.height = (r.height + pad * 2) + 'px';
  }

  function positionTooltip(el, position) {
    const r = el ? el.getBoundingClientRect() : { top: window.innerHeight / 2, left: window.innerWidth / 2, width: 0, height: 0, bottom: window.innerHeight / 2 };
    const tw = Math.min(420, window.innerWidth * 0.9);

    tooltip.classList.remove('arrow-top', 'arrow-bottom', 'arrow-left');

    let top, left;

    if (position === 'bottom') {
      top = r.bottom + 16;
      left = Math.max(16, Math.min(r.left, window.innerWidth - tw - 16));
      tooltip.classList.add('arrow-top');
    } else if (position === 'top') {
      // Estimate tooltip height
      tooltip.style.visibility = 'hidden';
      tooltip.style.display = 'block';
      const th = tooltip.offsetHeight || 200;
      tooltip.style.visibility = '';
      top = r.top - th - 16;
      left = Math.max(16, Math.min(r.left, window.innerWidth - tw - 16));
      tooltip.classList.add('arrow-bottom');
    } else {
      top = r.top;
      left = r.right + 16;
      tooltip.classList.add('arrow-left');
    }

    // Keep on screen
    if (top < 16) top = r.bottom + 16;
    if (top + 200 > window.innerHeight) top = Math.max(16, r.top - 220);

    tooltip.style.top = top + 'px';
    tooltip.style.left = left + 'px';
  }

  /* ── Render step ────────────────────────────────────────── */
  function showStep(idx) {
    // Skip steps that shouldn't show
    while (idx < STEPS.length && STEPS[idx].skip && STEPS[idx].skip()) {
      idx++;
    }
    if (idx >= STEPS.length) { end(); return; }

    currentStep = idx;
    const step = STEPS[idx];
    const el = getTarget(step);

    // Scroll element into view
    if (el) {
      const r = el.getBoundingClientRect();
      if (r.top < 80 || r.bottom > window.innerHeight - 80) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Wait for scroll
        setTimeout(function () { positionAll(el, step); }, 400);
        return;
      }
    }
    positionAll(el, step);
  }

  function positionAll(el, step) {
    positionSpotlight(el);

    // Build tooltip content
    const dots = STEPS.filter(s => !s.skip || !s.skip()).map(function (s, i) {
      const realIdx = STEPS.indexOf(s);
      let cls = 'tour-dot';
      if (realIdx === currentStep) cls += ' active';
      else if (realIdx < currentStep) cls += ' done';
      return '<span class="' + cls + '"></span>';
    }).join('');

    const isLast = currentStep === STEPS.length - 1 ||
      (currentStep === STEPS.length - 2 && STEPS[STEPS.length - 1].skip && STEPS[STEPS.length - 1].skip());

    tooltip.innerHTML = `
      <div class="tour-step-badge">Step ${currentStep + 1} of ${STEPS.length}</div>
      <div class="tour-title">${step.title}</div>
      <div class="tour-body">${step.body}</div>
      <div class="tour-controls">
        <div class="tour-dots">${dots}</div>
        ${currentStep > 0 ? '<button class="tour-btn tour-btn-ghost" id="tour-prev">Back</button>' : '<button class="tour-btn tour-btn-ghost" id="tour-end">Skip</button>'}
        <button class="tour-btn tour-btn-primary" id="tour-next">${isLast ? 'Finish' : 'Next'}</button>
      </div>`;

    positionTooltip(el, step.position);

    // Animate in
    tooltip.classList.remove('visible');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        tooltip.classList.add('visible');
      });
    });

    // Wire buttons
    const nextBtn = document.getElementById('tour-next');
    const prevBtn = document.getElementById('tour-prev');
    const endBtn = document.getElementById('tour-end');

    if (nextBtn) nextBtn.onclick = function () {
      if (isLast) end();
      else showStep(currentStep + 1);
    };
    if (prevBtn) prevBtn.onclick = function () { showStep(currentStep - 1); };
    if (endBtn) endBtn.onclick = end;
  }

  /* ── Welcome modal ──────────────────────────────────────── */
  function showWelcome() {
    const modal = document.createElement('div');
    modal.className = 'tour-welcome';
    modal.innerHTML = `
      <div class="tour-welcome-card">
        <div class="tour-welcome-badge">Prototype &bull; Work in Progress</div>
        <h2>Welcome to Value Creating Teams</h2>
        <p>This platform is a living prototype &mdash; actively being built and refined. It's designed to support Korn Ferry practitioners in three ways:</p>
        <div class="tour-welcome-uses">
          <div class="tour-wu-item">
            <div class="tour-wu-icon">&#x1F393;</div>
            <div>
              <div class="tour-wu-label">Learn</div>
              <div class="tour-wu-desc">Explore the VCT framework, understand the five plays, study the practices, and build your facilitation confidence before going live with a client.</div>
            </div>
          </div>
          <div class="tour-wu-item">
            <div class="tour-wu-icon">&#x1F3AF;</div>
            <div>
              <div class="tour-wu-label">Deliver</div>
              <div class="tour-wu-desc">Run automated practices like FBSN and Assumption Mapping directly with client teams &mdash; in the room, virtually, or as pre-work.</div>
            </div>
          </div>
          <div class="tour-wu-item">
            <div class="tour-wu-icon">&#x1F4BC;</div>
            <div>
              <div class="tour-wu-label">Business Development</div>
              <div class="tour-wu-desc">Walk prospects through the platform to show what a VCT engagement looks like &mdash; concrete, interactive, and differentiated from typical team offsites.</div>
            </div>
          </div>
        </div>
        <p style="font-size:.82rem;color:#5A6B8A;">Take a quick tour to see how the platform works, or jump straight in.</p>
        <div class="tour-welcome-actions">
          <button class="tour-welcome-skip" id="tour-welcome-skip">Skip for now</button>
          <button class="tour-welcome-start" id="tour-welcome-start">Take the Tour &#8594;</button>
        </div>
      </div>`;
    document.body.appendChild(modal);

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        modal.classList.add('active');
      });
    });

    document.getElementById('tour-welcome-start').onclick = function () {
      modal.classList.remove('active');
      setTimeout(function () { modal.remove(); startWalkthrough(); }, 300);
    };
    document.getElementById('tour-welcome-skip').onclick = function () {
      modal.classList.remove('active');
      setTimeout(function () { modal.remove(); }, 300);
      sessionStorage.setItem('vct_tour_dismissed', '1');
    };

    // Close on backdrop click
    modal.addEventListener('click', function (e) {
      if (e.target === modal) {
        modal.classList.remove('active');
        setTimeout(function () { modal.remove(); }, 300);
      }
    });
  }

  /* ── Start / End ────────────────────────────────────────── */
  function startWalkthrough() {
    createElements();
    isActive = true;
    overlay.classList.add('active');
    currentStep = -1;
    showStep(0);
    // Hide trigger button during tour
    const trigger = document.querySelector('.tour-trigger');
    if (trigger) trigger.style.display = 'none';
  }

  function start() {
    showWelcome();
  }

  function end() {
    isActive = false;
    if (overlay) overlay.classList.remove('active');
    if (tooltip) { tooltip.classList.remove('visible'); tooltip.innerHTML = ''; }
    if (spotlight) spotlight.style.opacity = '0';
    sessionStorage.setItem('vct_tour_dismissed', '1');
    // Show trigger button again
    const trigger = document.querySelector('.tour-trigger');
    if (trigger) trigger.style.display = '';
  }

  /* ── Handle resize ──────────────────────────────────────── */
  window.addEventListener('resize', function () {
    if (!isActive || currentStep < 0) return;
    const step = STEPS[currentStep];
    const el = getTarget(step);
    positionSpotlight(el);
    positionTooltip(el, step.position);
  });

  /* ── Floating trigger button ────────────────────────────── */
  function addTriggerButton() {
    const btn = document.createElement('button');
    btn.className = 'tour-trigger';
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Take a Tour';
    btn.onclick = start;
    document.body.appendChild(btn);
  }

  /* ── Init ───────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    // Only show on homepage
    const isHome = location.pathname === '/' || location.pathname.endsWith('index.html') || location.pathname === '';
    if (!isHome) return;

    addTriggerButton();

    // Auto-show on first visit
    if (!sessionStorage.getItem('vct_tour_dismissed')) {
      setTimeout(start, 1200);
    }
  });

  /* ── Expose ─────────────────────────────────────────────── */
  window.VCTTutorial = { start: start };

})();
