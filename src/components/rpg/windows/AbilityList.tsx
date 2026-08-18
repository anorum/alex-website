import { whatIDo } from '../../../data/whatido';
import Window, { type WindowContentProps } from '../ui/Window';

export default function AbilityList({ onClose }: WindowContentProps) {
  return (
    <Window title="COMMAND MENU" onClose={onClose}>
      {whatIDo.map((item) => (
        <div key={item.title} className="rpgq-quest">
          <div className="rpgq-head">
            <span className="rpgq-name">{item.rpg.commandName}</span>
            <span className="rpgq-status">{item.title.toUpperCase()}</span>
          </div>
          <p className="rpga-flavor">{item.rpg.flavor}</p>
          <p className="rpgq-desc">{item.description}</p>
        </div>
      ))}
    </Window>
  );
}
