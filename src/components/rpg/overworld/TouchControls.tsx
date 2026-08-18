import type { Direction } from '../../../data/overworld';

interface TouchControlsProps {
  onDown: (dir: Direction) => void;
  onUp: (dir: Direction) => void;
  onInteract: () => void;
}

const PADS: { dir: Direction; label: string; area: string }[] = [
  { dir: 'up', label: '▲', area: 'up' },
  { dir: 'left', label: '◀', area: 'left' },
  { dir: 'right', label: '▶', area: 'right' },
  { dir: 'down', label: '▼', area: 'down' },
];

export default function TouchControls({ onDown, onUp, onInteract }: TouchControlsProps) {
  return (
    <div className="ow-touch">
      <div className="ow-dpad">
        {PADS.map((p) => (
          <button
            key={p.dir}
            type="button"
            className="ow-dpad-btn"
            style={{ gridArea: p.area }}
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
      <button type="button" className="ow-a-btn" aria-label="Interact" onClick={onInteract}>
        A
      </button>
    </div>
  );
}
