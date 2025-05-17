// Theme context management for multiple themes
// This extends the existing dark/light mode functionality to support multiple theme styles

// Available themes
export const THEMES = {
  STANDARD: 'standard',
  RPG: 'rpg',
  TERMINAL: 'terminal' // Reserved for future use
};

// Initialize theme from localStorage or default to standard
export function initTheme() {
  if (typeof window !== 'undefined') {
    // Get stored theme or default to standard
    const storedTheme = localStorage.getItem('site-theme') || THEMES.STANDARD;
    
    // Apply theme class to html element
    document.documentElement.classList.forEach(className => {
      if (className.startsWith('theme-')) {
        document.documentElement.classList.remove(className);
      }
    });
    
    document.documentElement.classList.add(`theme-${storedTheme}`);
    
    return storedTheme;
  }
  return THEMES.STANDARD;
}

// Set theme and save to localStorage
export function setTheme(theme) {
  if (typeof window !== 'undefined') {
    // Remove any existing theme classes
    document.documentElement.classList.forEach(className => {
      if (className.startsWith('theme-')) {
        document.documentElement.classList.remove(className);
      }
    });
    
    // Add new theme class
    document.documentElement.classList.add(`theme-${theme}`);
    
    // Save to localStorage
    localStorage.setItem('site-theme', theme);
    
    // Log for debugging
    console.log(`Theme set to: ${theme}`);
    console.log(`HTML classes: ${document.documentElement.classList}`);
    
    return theme;
  }
  return theme;
}

// Get current theme
export function getTheme() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('site-theme') || THEMES.STANDARD;
  }
  return THEMES.STANDARD;
}
