// Shared app shell: one navigation definition for every page.
// - Desktop: rewrites each page's [data-nav-menu] so all pages show the same links.
// - Mobile (<=768px): compact header, bottom tab bar and a "More" drawer.
// - Adds the account / cloud-sync button (handled by sync.js).
(function () {
  const PAGES = [
    { href: 'index.html', label: 'To-Do', long: 'To-Do List', icon: 'check' },
    { href: 'habit-tracker.html', label: 'Habits', long: 'Habit Tracker', icon: 'flame' },
    { href: 'day-planner.html', label: 'Planner', long: 'Day Planner', icon: 'clock' },
    { href: 'calendar.html', label: 'Calendar', long: 'Calendar View', icon: 'calendar' },
    { href: 'matrix.html', label: 'Matrix', long: 'Matrix View', icon: 'grid' },
    { href: 'goal-countdown.html', label: 'Goals', long: 'Goal Countdown', icon: 'target' },
    { href: 'motivation.html', label: 'Motivation', long: 'Motivation', icon: 'play' },
    { href: 'ambience.html', label: 'Ambience', long: 'Ambience', icon: 'music' }
  ];
  const TAB_PAGES = ['index.html', 'habit-tracker.html', 'day-planner.html', 'ambience.html'];

  const ICONS = {
    check: '<path d="M20 6 9 17l-5-5"/>',
    flame: '<path d="M12 22c4 0 7-3 7-7 0-4-3-6-4-9-1 2-2 3-4 3 0-2 0-4-1-6-3 3-5 7-5 12 0 4 3 7 7 7z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
    grid: '<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    play: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="m10 9 5 3-5 3z"/>',
    music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    more: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
    cloud: '<path d="M17.5 19a4.5 4.5 0 1 0-1.4-8.8A6 6 0 0 0 4.5 12.5 3.5 3.5 0 0 0 6 19z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>'
  };

  function icon(name) {
    return `<svg class="fl-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
  }

  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[ch]);
  }

  window.FL = Object.assign(window.FL || {}, { escapeHTML, icon });

  function currentPage() {
    const last = location.pathname.split('/').pop();
    return last && last.endsWith('.html') ? last : 'index.html';
  }

  function init() {
    if (document.body.dataset.flShell === 'ready') return;
    document.body.dataset.flShell = 'ready';
    document.body.classList.add('fl-has-shell');

    const page = currentPage();

    // 1. Same desktop links everywhere
    document.querySelectorAll('[data-nav-menu]').forEach(menu => {
      menu.innerHTML = PAGES.map(p => `
        <a href="${p.href}" class="btn-ghost fl-nav-link${p.href === page ? ' is-current' : ''}" title="${escapeHTML(p.long)}"
           ${p.href === page ? 'aria-current="page"' : ''}>${escapeHTML(p.label)}</a>`).join('');
    });

    // 2. Account button in the header (desktop + mobile)
    const actions = document.querySelector('.header-actions') ||
      document.querySelector('.header-right') ||
      document.querySelector('.header');
    if (actions) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn-ghost fl-account-btn';
      btn.setAttribute('data-fl-account', '');
      btn.setAttribute('aria-label', 'Account and cloud sync');
      btn.innerHTML = `${icon('cloud')}<span class="fl-account-label">Sync</span><span class="fl-sync-dot" data-fl-sync-dot></span>`;
      actions.appendChild(btn);
    }

    // 3. Mobile tab bar
    const tabbar = document.createElement('nav');
    tabbar.className = 'fl-tabbar';
    tabbar.setAttribute('aria-label', 'Main');
    tabbar.innerHTML = TAB_PAGES.map(href => {
      const p = PAGES.find(x => x.href === href);
      const active = href === page;
      return `<a href="${p.href}" class="fl-tab${active ? ' is-current' : ''}" ${active ? 'aria-current="page"' : ''}>
        ${icon(p.icon)}<span>${escapeHTML(p.label)}</span></a>`;
    }).join('') + `<button type="button" class="fl-tab${TAB_PAGES.includes(page) ? '' : ' is-current'}" data-fl-more aria-haspopup="dialog">
        ${icon('more')}<span>More</span></button>`;
    document.body.appendChild(tabbar);

    // 4. "More" drawer
    const drawer = document.createElement('div');
    drawer.className = 'fl-drawer';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');
    drawer.setAttribute('aria-label', 'All pages');
    drawer.hidden = true;
    const hasTheme = typeof window.setTheme === 'function' && document.getElementById('themeToggle');
    const hasClearAll = !!document.getElementById('clearAll');
    drawer.innerHTML = `
      <div class="fl-drawer-backdrop" data-fl-close></div>
      <div class="fl-drawer-sheet">
        <div class="fl-drawer-handle"></div>
        <div class="fl-drawer-head">
          <strong>Focus List</strong>
          <button type="button" class="fl-icon-btn" data-fl-close aria-label="Close">${icon('close')}</button>
        </div>
        <div class="fl-drawer-grid">
          ${PAGES.map(p => `<a href="${p.href}" class="fl-drawer-link${p.href === page ? ' is-current' : ''}">
            ${icon(p.icon)}<span>${escapeHTML(p.long)}</span></a>`).join('')}
        </div>
        <div class="fl-drawer-actions">
          <button type="button" class="fl-drawer-action" data-fl-account>${icon('cloud')}<span>Account &amp; sync</span><span class="fl-sync-dot" data-fl-sync-dot></span></button>
          ${hasTheme ? `<button type="button" class="fl-drawer-action" data-fl-theme>${icon('sun')}<span>Change theme</span></button>` : ''}
          ${hasClearAll ? `<button type="button" class="fl-drawer-action fl-danger" data-fl-clear>${icon('close')}<span>Clear all tasks</span></button>` : ''}
        </div>
      </div>`;
    document.body.appendChild(drawer);

    const openDrawer = () => {
      drawer.hidden = false;
      requestAnimationFrame(() => drawer.classList.add('is-open'));
      document.documentElement.classList.add('fl-lock-scroll');
    };
    const closeDrawer = () => {
      drawer.classList.remove('is-open');
      document.documentElement.classList.remove('fl-lock-scroll');
      setTimeout(() => { drawer.hidden = true; }, 220);
    };

    tabbar.querySelector('[data-fl-more]').addEventListener('click', openDrawer);
    drawer.addEventListener('click', e => {
      if (e.target.closest('[data-fl-close]')) closeDrawer();
      if (e.target.closest('[data-fl-theme]')) {
        document.getElementById('themeToggle')?.click();
      }
      if (e.target.closest('[data-fl-clear]')) {
        closeDrawer();
        document.getElementById('clearAll')?.click();
      }
      if (e.target.closest('[data-fl-account]')) closeDrawer();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !drawer.hidden) closeDrawer();
    });

    // Account buttons: sync.js may load later, so delegate.
    document.addEventListener('click', e => {
      const btn = e.target.closest('[data-fl-account]');
      if (!btn) return;
      if (window.FLSync && typeof window.FLSync.openAccount === 'function') {
        window.FLSync.openAccount();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Offline support + "Add to Home Screen" (see sw.js)
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(err => console.warn('Service worker not registered', err));
    });
  }
})();
