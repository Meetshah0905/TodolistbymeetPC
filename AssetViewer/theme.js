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

// "system" is resolved to an explicit light/dark value, because many styles are written
// as [data-theme="dark"] ... and would otherwise never apply for system-dark users.
function resolveTheme(theme) {
  if (theme !== 'system') return theme;
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', resolveTheme(theme));
}

if (window.matchMedia) {
  const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const onSystemChange = () => {
    if (currentTheme === 'system') applyTheme('system');
  };
  if (darkQuery.addEventListener) darkQuery.addEventListener('change', onSystemChange);
  else if (darkQuery.addListener) darkQuery.addListener(onSystemChange);
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

