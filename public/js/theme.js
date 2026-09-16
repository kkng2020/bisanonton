/**
 * BISA NONTON - Theme Manager (Permanent Dark Mode)
 */

(function () {
  const THEME_KEY = 'bisa_nonton_theme';

  // Kunci tema secara permanen ke 'dark'
  document.documentElement.setAttribute('data-theme', 'dark');
  localStorage.setItem(THEME_KEY, 'dark');

  document.addEventListener('DOMContentLoaded', () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    // Sembunyikan toggle buttons jika masih ada di DOM
    const toggleBtns = document.querySelectorAll('.theme-toggle-btn');
    toggleBtns.forEach(btn => {
      btn.style.display = 'none';
    });
  });
})();

