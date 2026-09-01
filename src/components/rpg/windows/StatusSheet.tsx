import { character } from '../../../data/character';
import Window, { type WindowContentProps } from '../ui/Window';
import meImage from '../../../assets/me.jpeg';

const highlight = { color: 'var(--ff7-text-highlight)' };

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="rpgw-bar">
      <div className="rpgw-bar-fill" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

export default function StatusSheet({ onClose }: WindowContentProps) {
  const c = character;
  return (
    <Window title="CHARACTER DATA" onClose={onClose}>
      <div className="rpgs-head">
        <img className="rpgw-portrait" src={meImage.src} alt="Alex" />
        <div>
          <div style={{ ...highlight, fontWeight: 'bold' }}>{c.name}</div>
          <div>{c.charClass}</div>
          <div style={highlight}>LV {c.level}</div>
        </div>
      </div>

      <div className="rpgw-divider" />

      <div className="rpgw-statrow">
        <span className="rpgw-statrow-label">HP</span>
        <span>
          {c.hp.current}/{c.hp.max}
        </span>
        <Bar pct={(c.hp.current / c.hp.max) * 100} color="var(--ff7-hp-color, #00ff00)" />
      </div>
      <div className="rpgw-statrow">
        <span className="rpgw-statrow-label">MP</span>
        <span>
          {c.mp.current}/{c.mp.max}
        </span>
        <Bar pct={(c.mp.current / c.mp.max) * 100} color="var(--ff7-mp-color, #00ffff)" />
      </div>
      <div className="rpgw-statrow">
        <span className="rpgw-statrow-label">LIMIT</span>
        <span>{c.limit.label}</span>
        <Bar pct={100} color="#ff9d2f" />
      </div>

      <div className="rpgs-attrs">
        {c.attributes.map((a) => (
          <div key={a.label}>
            <span className="rpgw-statrow-label">{a.label}</span> {a.value}
          </div>
        ))}
        <div>
          <span className="rpgw-statrow-label">EXP</span> {c.exp}
        </div>
      </div>

      <div className="rpgw-divider" />

      <div className="rpgw-label">EQUIPMENT</div>
      {c.equipment.map((eq) => (
        <div key={eq.slot} className="rpgs-equip">
          <span>{eq.slot}</span>
          <span style={highlight}>{eq.name}</span>
          <span className="rpgs-orbs">
            {eq.materia.map((m, i) => (
              <span key={i} className={`rpgw-orb rpgw-orb-${m.color}`} />
            ))}
          </span>
        </div>
      ))}

      <div className="rpgw-divider" />

      <div className="rpgw-label">LIMIT BREAK</div>
      <div style={{ ...highlight, margin: '0.25rem 0' }}>{c.limitBreak.name}</div>
      <div style={{ fontStyle: 'italic', fontSize: '10px' }}>{c.limitBreak.description}</div>

      <div className="rpgw-divider" />

      <div className="rpgs-equip">
        <span>LOCATION</span>
        <span style={highlight}>{c.location}</span>
      </div>
      <div className="rpgs-equip">
        <span>PARTY</span>
        <span style={highlight}>{c.party}</span>
      </div>

      <div style={{ marginTop: '0.75rem' }}>
        <a
          className="rpgs-contact"
          href={c.contact.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          ▶ {c.contact.label}
        </a>
      </div>
    </Window>
  );
}
