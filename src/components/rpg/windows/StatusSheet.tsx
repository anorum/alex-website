import { character } from '../../../data/character';
import { party, statsAt, expForLevel, learnedMateria } from '../../../data/party';
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

export default function StatusSheet({ onClose, save }: WindowContentProps) {
  const c = character;
  const [alexDef, maraDef] = party;
  const alex = statsAt(alexDef, save.level);
  const mara = statsAt(maraDef, save.level);
  const nextAt = expForLevel(save.level + 1);
  const prevAt = expForLevel(save.level);
  const expPct = save.level >= 99 ? 100 : ((save.exp - prevAt) / Math.max(1, nextAt - prevAt)) * 100;
  const alexMateria = learnedMateria(alexDef, save.level);
  const maraMateria = learnedMateria(maraDef, save.level);

  return (
    <Window title="CHARACTER DATA" onClose={onClose}>
      <div className="rpgs-head">
        <img className="rpgw-portrait" src={meImage.src} alt="Alex" />
        <div>
          <div style={{ ...highlight, fontWeight: 'bold' }}>{c.name}</div>
          <div>{c.charClass}</div>
          <div style={highlight} data-testid="status-level">LV {save.level}</div>
        </div>
      </div>

      <div className="rpgw-divider" />

      <div className="rpgw-statrow">
        <span className="rpgw-statrow-label">HP</span>
        <span>{alex.hp}/{alex.hp}</span>
        <Bar pct={100} color="var(--ff7-hp-color, #00ff00)" />
      </div>
      <div className="rpgw-statrow">
        <span className="rpgw-statrow-label">MP</span>
        <span>{alex.mp}/{alex.mp}</span>
        <Bar pct={100} color="var(--ff7-mp-color, #00ffff)" />
      </div>
      <div className="rpgw-statrow">
        <span className="rpgw-statrow-label">EXP</span>
        <span>{save.level >= 99 ? 'MAX' : `${nextAt - save.exp} NEXT`}</span>
        <Bar pct={expPct} color="#ff9d2f" />
      </div>

      <div className="rpgs-attrs">
        <div><span className="rpgw-statrow-label">ATK</span> {alex.atk}</div>
        <div><span className="rpgw-statrow-label">DEF</span> {alex.def}</div>
        <div><span className="rpgw-statrow-label">SPD</span> {alex.spd}</div>
        <div><span className="rpgw-statrow-label">GIL</span> {save.gil}</div>
        <div><span className="rpgw-statrow-label">BOSSES</span> {save.bossesBeaten.length}/4</div>
        <div><span className="rpgw-statrow-label">TOTAL EXP</span> {save.exp}</div>
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

      <div className="rpgw-label">MATERIA</div>
      <ul className="rpgm-list" style={{ marginTop: '0.375rem' }}>
        {alexMateria.map((m) => (
          <li key={m.id}><span className="rpgw-orb rpgw-orb-green" aria-hidden="true" /> {m.name}</li>
        ))}
      </ul>

      <div className="rpgw-divider" />

      <div className="rpgw-label">LIMIT BREAK</div>
      <div style={{ ...highlight, margin: '0.25rem 0' }}>{c.limitBreak.name}</div>
      <div style={{ fontStyle: 'italic', fontSize: '10px' }}>{c.limitBreak.description}</div>

      <div className="rpgw-divider" />

      <div className="rpgw-label">PARTY</div>
      <div className="rpgs-equip">
        <span>{c.party}</span>
        <span style={highlight}>LV {save.level} · HP {mara.hp} · SPD {mara.spd}</span>
      </div>
      <ul className="rpgm-list" style={{ marginTop: '0.375rem' }}>
        {maraMateria.map((m) => (
          <li key={m.id}><span className="rpgw-orb rpgw-orb-yellow" aria-hidden="true" /> {m.name}</li>
        ))}
      </ul>

      <div className="rpgw-divider" />

      <div className="rpgs-equip">
        <span>LOCATION</span>
        <span style={highlight}>{c.location}</span>
      </div>

      <div style={{ marginTop: '0.75rem' }}>
        <a className="rpgs-contact" href={c.contact.href} target="_blank" rel="noopener noreferrer">
          ▶ {c.contact.label}
        </a>
      </div>
    </Window>
  );
}
