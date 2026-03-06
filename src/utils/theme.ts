export type Theme = 'standard' | 'rpg';

export function getTheme(): Theme {
  if (typeof window === 'undefined') return 'standard';
  return (localStorage.getItem('site-theme') as Theme) || 'standard';
}

export function setTheme(theme: Theme): void {
  if (typeof window === 'undefined') return;

  document.documentElement.classList.forEach(cls => {
    if (cls.startsWith('theme-')) document.documentElement.classList.remove(cls);
  });
  document.documentElement.classList.add(`theme-${theme}`);
  localStorage.setItem('site-theme', theme);
  document.dispatchEvent(new CustomEvent('theme:change', { detail: { theme } }));
}

export function getDarkMode(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('color-theme') === 'dark' ||
    (!localStorage.getItem('color-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
}

export function setDarkMode(dark: boolean): void {
  if (typeof window === 'undefined') return;
  if (dark) {
    document.documentElement.classList.add('dark');
    localStorage.setItem('color-theme', 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('color-theme', 'light');
  }
  document.dispatchEvent(new CustomEvent('theme:change', { detail: { dark } }));
}

export function onThemeChange(callback: (e: CustomEvent) => void): () => void {
  const handler = callback as EventListener;
  document.addEventListener('theme:change', handler);
  return () => document.removeEventListener('theme:change', handler);
}
