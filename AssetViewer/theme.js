const THEME_KEY = 'theme';
const THEME_OPTIONS = ['light', 'dark', 'system'];
let currentTheme = getStoredTheme();

applyTheme(currentTheme);

whenReady(() => {
  applyTheme(currentTheme);
  updateThemeIcon(currentTheme);
  initToggle();
});

window.addEventListener('storage', event => {
  if (event.key === THEME_KEY) {
    const next = event.newValue || 'system';
    currentTheme = next;
    applyTheme(next);
    updateThemeIcon(next);
    announceThemeChange(next);
  }
});

function initToggle() {
  const toggle = document.getElementById('themeToggle');
  if (!toggle || toggle.dataset.themeBound === 'true') {
    return;
  }

  toggle.dataset.themeBound = 'true';
  toggle.addEventListener('click', () => {
    const next = getNextTheme();
    setTheme(next);
  });
}

function getNextTheme() {
  const idx = THEME_OPTIONS.indexOf(currentTheme);
  const nextIndex = idx === -1 ? 0 : (idx + 1) % THEME_OPTIONS.length;
  return THEME_OPTIONS[nextIndex];
}

function setTheme(theme) {
  currentTheme = theme;
  saveTheme(theme);
  applyTheme(theme);
  updateThemeIcon(theme);
  announceThemeChange(theme);
}

function applyTheme(theme) {
  if (theme === 'system') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

function updateThemeIcon(theme) {
  const toggle = document.getElementById('themeToggle');
  if (!toggle) return;

  const icon = toggle.querySelector('.theme-icon');
  if (!icon) return;

  icon.textContent = theme === 'light' ? '☀️' : theme === 'dark' ? '🌙' : '💻';
}

function getStoredTheme() {
  try {
    return localStorage.getItem(THEME_KEY) || 'system';
  } catch (error) {
    console.warn('Unable to read theme preference', error);
    return 'system';
  }
}

function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (error) {
    console.warn('Unable to persist theme preference', error);
  }
}

function announceThemeChange(theme) {
  window.dispatchEvent(
    new CustomEvent('themechange', {
      detail: { theme }
    })
  );
}

function whenReady(callback) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback, { once: true });
  } else {
    callback();
  }
}

