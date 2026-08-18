import { worldLocations } from '../../../data/overworld';

interface LocationPromptProps {
  /** location id the player is standing on, or null */
  doorId: string | null;
  onEnter: () => void;
}

export default function LocationPrompt({ doorId, onEnter }: LocationPromptProps) {
  const loc = worldLocations.find((l) => l.id === doorId);
  if (!loc) return null;
  return (
    <div className="ow-prompt" role="status">
      <button type="button" className="ow-prompt-btn" onClick={onEnter}>
        <span className="ow-prompt-cursor" aria-hidden="true">▶</span>
        ENTER {loc.name}
      </button>
      <span className="ow-prompt-hint">{loc.hint} · press Enter</span>
    </div>
  );
}
