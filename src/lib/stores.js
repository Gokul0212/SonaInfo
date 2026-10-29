import { writable } from 'svelte/store';

function createThemeStore() {
  const { subscribe, set } = writable('light');

  return {
    subscribe,
    init: () => {
      if (typeof window !== 'undefined') {
        const savedTheme = localStorage.getItem('sonainfo_theme') || 'light';
        set(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
        document.documentElement.setAttribute('data-bs-theme', savedTheme);
        if (document.body) {
          document.body.setAttribute('data-theme', savedTheme);
          document.body.setAttribute('data-bs-theme', savedTheme);
        }
      }
    },
    toggle: () => {
      if (typeof window !== 'undefined') {
        const current = localStorage.getItem('sonainfo_theme') || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        set(next);
        localStorage.setItem('sonainfo_theme', next);
        document.documentElement.setAttribute('data-theme', next);
        document.documentElement.setAttribute('data-bs-theme', next);
        if (document.body) {
          document.body.setAttribute('data-theme', next);
          document.body.setAttribute('data-bs-theme', next);
        }
      }
    },
    setTheme: (theme) => {
      if (typeof window !== 'undefined') {
        set(theme);
        localStorage.setItem('sonainfo_theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.setAttribute('data-bs-theme', theme);
        if (document.body) {
          document.body.setAttribute('data-theme', theme);
          document.body.setAttribute('data-bs-theme', theme);
        }
      }
    }
  };
}

export const theme = createThemeStore();

// Format Date Utility
export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}
