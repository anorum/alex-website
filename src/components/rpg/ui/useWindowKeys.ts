import { useEffect } from 'react';
import { ff7MenuIsOpen } from '../../../utils/rpg-menu';

/** Window-scoped keys: Escape/x close; optional handler gets everything else.
 *  Skips while the FF7 nav menu is open (it owns its own keys). */
export function useWindowKeys(
  onClose: () => void,
  onKey?: (e: KeyboardEvent) => boolean | void
) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (ff7MenuIsOpen()) return;
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
