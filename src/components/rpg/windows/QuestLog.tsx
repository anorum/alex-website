import { experience } from '../../../data/experience';
import Window, { type WindowContentProps } from '../ui/Window';

export default function QuestLog({ onClose }: WindowContentProps) {
  return (
    <Window title="QUEST LOG" onClose={onClose}>
      {experience.map((item) => (
        <div key={item.role + item.period} className="rpgq-quest">
          <div className="rpgq-head">
            <span className="rpgq-name">{item.role}</span>
            <span className="rpgq-status">COMPLETE</span>
          </div>
          <div className="rpgq-meta">
            {item.company} · {item.period}
          </div>
          <p className="rpgq-desc">{item.description}</p>
          {item.achievements.length > 0 && (
            <>
              <div className="rpgw-label">REWARDS</div>
              <ul className="rpgq-rewards">
                {item.achievements.map((a) => (
                  <li key={a}>
                    <span aria-hidden="true">▸</span> {a}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      ))}
    </Window>
  );
}
