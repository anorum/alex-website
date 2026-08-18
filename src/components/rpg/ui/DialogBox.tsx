import type { DialogStep } from '../../../data/dialogs';
import './ff7-window.css';

interface DialogBoxProps {
  step: DialogStep;
  /** characters revealed so far (line steps) */
  revealed: number;
  choiceIndex: number;
  onAdvance: () => void;
  onChoose: (index: number) => void;
}

export default function DialogBox({ step, revealed, choiceIndex, onAdvance, onChoose }: DialogBoxProps) {
  if (step.kind === 'line') {
    const complete = revealed >= step.text.length;
    return (
      <div className="rpgw-dialog" role="status" onClick={onAdvance}>
        {step.speaker && <span className="rpgw-speaker">{step.speaker}</span>}
        <div className="rpgw-dialog-text">{step.text.slice(0, revealed)}</div>
        {complete && (
          <span className="rpgw-advance" aria-hidden="true">
            ▼
          </span>
        )}
      </div>
    );
  }

  if (step.kind === 'choice') {
    return (
      <div className="rpgw-dialog" role="status">
        <div className="rpgw-dialog-text">{step.prompt}</div>
        <div className="rpgw-choices">
          {step.options.map((opt, i) => (
            <button
              key={opt.label}
              type="button"
              className={`rpgw-choice ${i === choiceIndex ? 'selected' : ''}`}
              onClick={() => onChoose(i)}
            >
              <span className="rpgw-choice-cursor" aria-hidden="true">
                ▶
              </span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
