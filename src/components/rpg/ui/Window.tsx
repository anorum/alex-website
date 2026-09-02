import type { ReactNode } from 'react';
import type { SaveData } from '../../../utils/rpg-save';
import type { OverworldAction } from '../overworld/overworldReducer';
import { useWindowKeys } from './useWindowKeys';
import './ff7-window.css';

/** What every window in src/components/rpg/windows receives. */
export interface WindowContentProps {
  onClose: () => void;
  save: SaveData;
  dispatch: (action: OverworldAction) => void;
  /** e.g. "buy" from a window id like "shop:buy" */
  initialTab?: string;
}

interface WindowProps {
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** extra keyboard handling, e.g. cursor lists */
  onKey?: (e: KeyboardEvent) => boolean | void;
}

export default function Window({ title, onClose, children, onKey }: WindowProps) {
  useWindowKeys(onClose, onKey);
  return (
    <div className="rpgw-window" role="dialog" aria-label={title}>
      <div className="rpgw-header">
        <span>{title}</span>
        <button type="button" className="rpgw-close" onClick={onClose}>
          ✕ CLOSE
        </button>
      </div>
      <div className="rpgw-body">{children}</div>
      <div className="rpgw-footer">ESC TO CLOSE</div>
    </div>
  );
}
