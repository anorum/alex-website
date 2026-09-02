import type { Direction } from '../../../data/overworld';

interface TouchControlsProps {
  onDown: (dir: Direction) => void;
  onUp: (dir: Direction) => void;
  onInteract: () => void;
  onCancel: () => void;
  /** show the B button (a dialog, window, or battle is open) */
  showCancel: boolean;
}

// Direction doubles as the d-pad grid-area name, see .ow-dpad in overworld.css
const PADS: { dir: Direction; label: string }[] = [
  { dir: 'up', label: '▲' },
  { dir: 'left', label: '◀' },
  { dir: 'right', label: '▶' },
  { dir: 'down', label: '▼' },
];

export default function TouchControls({
  onDown,
  onUp,
  onInteract,
  onCancel,
  showCancel,
}: TouchControlsProps) {
  return (
    <div className="ow-touch">
      <div className="ow-dpad">
        {PADS.map((p) => (
          <button
            key={p.dir}
            type="button"
            className="ow-dpad-btn"
            style={{ gridArea: p.dir }}
            aria-label={`Move ${p.dir}`}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              onDown(p.dir);
            }}
            onPointerUp={() => onUp(p.dir)}
            onPointerCancel={() => onUp(p.dir)}
            onContextMenu={(e) => e.preventDefault()}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="ow-ab">
        {showCancel && (
          <button type="button" className="ow-b-btn" aria-label="Cancel" onClick={onCancel}>
            B
          </button>
        )}
        <button type="button" className="ow-a-btn" aria-label="Interact" onClick={onInteract}>
          A
        </button>
      </div>
    </div>
  );
}
