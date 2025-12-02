// Shared header interactions (mobile nav toggle)
(function () {
  function initHeader() {
    const navToggle = document.querySelector('[data-nav-toggle]');
    const navMenu = document.querySelector('[data-nav-menu]');
    const navOverlay = document.querySelector('[data-nav-overlay]');

    if (!navToggle || !navMenu) {
      return;
    }

    const body = document.body;

    function closeNav() {
      body.classList.remove('nav-open');
      navToggle.setAttribute('aria-expanded', 'false');
      if (navOverlay) {
        navOverlay.setAttribute('aria-hidden', 'true');
      }
      body.style.removeProperty('overflow');
    }

    navToggle.addEventListener('click', () => {
      const isOpen = !body.classList.contains('nav-open');
      body.classList.toggle('nav-open', isOpen);
      navToggle.setAttribute('aria-expanded', String(isOpen));
      if (navOverlay) {
        navOverlay.setAttribute('aria-hidden', String(!isOpen));
      }
      if (isOpen) {
        body.style.overflow = 'hidden';
      } else {
        body.style.removeProperty('overflow');
      }
    });

    navMenu.addEventListener(
      'click',
      event => {
        const target = event.target;
        if (target && target.tagName === 'A') {
          closeNav();
        }
      },
      { passive: true }
    );

    if (navOverlay) {
      navOverlay.addEventListener(
        'click',
        closeNav,
        { passive: true }
      );
    }

    window.addEventListener(
      'resize',
      () => {
        if (window.innerWidth > 768 && body.classList.contains('nav-open')) {
          closeNav();
        }
      },
      { passive: true }
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeader);
  } else {
    initHeader();
  }
})();

