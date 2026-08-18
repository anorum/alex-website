import { skillCategories } from '../../../data/skills';
import Window from '../ui/Window';

const ORB_BY_LABEL: Record<string, string> = {
  Core: 'green',
  Also: 'blue',
  AI: 'purple',
  'Honest levels': 'yellow',
};

export default function MateriaList({ label, onClose }: { label: string; onClose: () => void }) {
  const category = skillCategories.find((c) => c.label === label);
  const orb = ORB_BY_LABEL[label] ?? 'green';
  if (!category) return null;

  // Honest-levels entries are sentences; everything else is an orb list.
  const sentences = label === 'Honest levels';

  return (
    <Window title={`${label.toUpperCase()} MATERIA`} onClose={onClose}>
      {sentences ? (
        category.items.map((item) => (
          <p key={item} className="rpgq-desc" style={{ marginBottom: '0.5rem' }}>
            {item}.
          </p>
        ))
      ) : (
        <ul className="rpgm-list">
          {category.items.map((item) => (
            <li key={item}>
              <span className={`rpgw-orb rpgw-orb-${orb}`} aria-hidden="true" /> {item}
            </li>
          ))}
        </ul>
      )}
      <div className="rpgw-divider" />
      <p className="rpga-flavor">No levels. No mastery bars. It ships or it does not.</p>
    </Window>
  );
}
