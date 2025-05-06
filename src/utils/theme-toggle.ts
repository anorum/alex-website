document.addEventListener("DOMContentLoaded", () => {
    const themeToggle = document.getElementById('theme-toggle');
    const html = document.documentElement;
  
    themeToggle.addEventListener('click', () => {
      if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        localStorage.setItem('color-theme', 'light');
      } else {
        html.classList.add('dark');
        localStorage.setItem('color-theme', 'dark');
      }
    });
  
    // Set initial mode based on localStorage
    if (
      localStorage.getItem('color-theme') === 'dark' ||
      (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  });