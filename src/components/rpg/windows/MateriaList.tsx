import { skillCategories } from '../../../data/skills';
import Window, { type WindowContentProps } from '../ui/Window';

const HONEST_LEVELS = 'Honest levels';

const ORB_BY_LABEL: Record<string, string> = {
  Core: 'green',
  Also: 'blue',
  AI: 'purple',
  [HONEST_LEVELS]: 'yellow',
};

interface MateriaListProps extends WindowContentProps {
  /** skill category label, e.g. "Core" */
  label: string;
}

export default function MateriaList({ label, onClose }: MateriaListProps) {
  const category = skillCategories.find((c) => c.label === label);
  if (!category) return null;

  const orb = ORB_BY_LABEL[label] ?? 'green';
  // Honest-levels entries are sentences; everything else is an orb list.
  const asSentences = label === HONEST_LEVELS;

  return (
    <Window title={`${label.toUpperCase()} MATERIA`} onClose={onClose}>
      {asSentences ? (
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
