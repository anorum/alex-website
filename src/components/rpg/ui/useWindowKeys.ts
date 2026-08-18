import { useEffect } from 'react';

/** Window-scoped keys: Escape/x close; optional handler gets everything else.
 *  Skips while the FF7 nav menu is open (it owns its own keys). */
export function useWindowKeys(
  onClose: () => void,
  onKey?: (e: KeyboardEvent) => boolean | void
) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const nav = document.getElementById('ff7-nav');
      if (nav && !nav.classList.contains('hidden')) return;
      if (e.key === 'Escape' || e.key === 'x') {
        onClose();
        e.preventDefault();
        return;
      }
      if (onKey && onKey(e)) e.preventDefault();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, onKey]);
}
