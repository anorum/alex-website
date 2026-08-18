import { interests } from '../../../data/interests';
import Window from '../ui/Window';

export default function CraftsWindow({ onClose }: { onClose: () => void }) {
  return (
    <Window title="OFF THE CLOCK" onClose={onClose}>
      <ul className="rpgc-grid" role="list">
        {interests.map((item) => (
          <li key={item.title} className="rpgc-item">
            <span className="rpgc-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.iconPath} />
              </svg>
            </span>
            <span>
              <span className="rpgq-name">{item.title.toUpperCase()}</span>
              <p className="rpgq-desc">{item.description}</p>
            </span>
          </li>
        ))}
      </ul>
    </Window>
  );
}
