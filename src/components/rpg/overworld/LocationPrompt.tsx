import type { Prompt } from './overworldReducer';

interface LocationPromptProps {
  prompt: Prompt | null;
  onEnter: () => void;
}

export default function LocationPrompt({ prompt, onEnter }: LocationPromptProps) {
  if (!prompt) return null;
  return (
    <div className="ow-prompt" role="status">
      <button type="button" className="ow-prompt-btn" onClick={onEnter}>
        <span className="ow-prompt-cursor" aria-hidden="true">▶</span>
        {prompt.label}
      </button>
      {prompt.hint && <span className="ow-prompt-hint">{prompt.hint} · press Enter</span>}
    </div>
  );
}
