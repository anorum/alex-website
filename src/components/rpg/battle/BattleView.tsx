// Renders a BattleState inside the scene frame. All timing comes from the
// reducer clock; this component only maps state to markup.

import { useRef, type ReactElement } from 'react';
import { items } from '../../../data/items';
import { experience } from '../../../data/experience';
import { bossById } from '../../../data/bosses';
import { expForLevel } from '../../../data/party';
import {
  availableMateria, combatant, livingEnemies, partyMembers, rootCommandsFor, targetPool,
} from './battleReducer';
import { EnemySprite, PartySprite } from './EnemySprites';
import type { BattleAction, BattleState, Combatant } from './types';
import meImage from '../../../assets/me.jpeg';
import './battle.css';

interface BattleViewProps {
  state: BattleState;
  dispatch: (action: BattleAction) => void;
  reducedMotion: boolean;
}

const EXP_BAR_MS = 900;

const STATUS_LABEL: Record<string, string> = {
  poison: 'PSN',
  slow: 'SLOW',
  haste: 'HASTE',
  silence: 'SIL',
  atkDown: 'ATK-',
  defDown: 'DEF-',
  atkUp: 'ATK+',
};

function spriteFor(c: Combatant): ReactElement {
  if (c.side === 'party') return <PartySprite id={c.defId as 'alex' | 'mara'} />;
  const def = bossById(c.defId);
  return <EnemySprite spriteId={def?.spriteId ?? spriteIdFor(c.defId)} name={c.name} />;
}

function spriteIdFor(defId: string): string {
  // enemy sprite ids are stored on the def; the reducer only keeps defId
  return ENEMY_SPRITE[defId] ?? 'flaky';
}

const ENEMY_SPRITE: Record<string, string> = {
  'flaky-test': 'flaky', 'null-pointer': 'nullptr', 'stale-cache': 'cache', 'off-by-one': 'offbyone',
  'data-lake-monster': 'lake', 'spaghetti-code': 'spaghetti', 'merge-conflict': 'merge', 'dead-link': 'deadlink',
  timeout: 'timeout', 'cron-gone-wrong': 'cron', 'race-condition': 'race', 'prod-incident': 'incident',
};

function TurnStrip({ state }: { state: BattleState }) {
  return (
    <div className="rpgb-window rpgb-strip" aria-label="Turn order">
      <span className="rpgb-strip-label">NEXT</span>
      {state.order.map((key, i) => {
        const c = state.combatants.find((x) => x.key === key);
        if (!c) return null;
        return (
          <span key={`${key}-${i}`} className={`rpgb-strip-slot${i === 0 ? ' rpgb-now' : ''}`} title={c.name}>
            {spriteFor(c)}
          </span>
        );
      })}
    </div>
  );
}

function Card({ c, state, dispatch, index }: { c: Combatant; state: BattleState; dispatch: BattleViewProps['dispatch']; index: number }) {
  const flashing = state.clock < (state.flashUntil[c.key] ?? 0);
  const pool = state.phase === 'target' ? targetPool(state) : [];
  const targetIndex = pool.findIndex((t) => t.key === c.key);
  const targetable = targetIndex >= 0;
  const targeted = targetable && targetIndex === state.menu.targetCursor;
  const acting = state.active === c.key && (state.phase === 'select' || state.phase === 'target');
  const isBoss = !!bossById(c.defId);
  const showHp = c.side === 'enemy' && (isBoss || state.scanned.includes(c.key));
  const classes = [
    'rpgb-card',
    c.side === 'party' ? 'rpgb-party-card' : 'rpgb-enemy-card',
    flashing ? 'rpgb-flashing' : '',
    !c.alive ? 'rpgb-dead' : '',
    acting ? 'rpgb-acting' : '',
    targetable ? 'rpgb-targetable' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      data-combatant={c.key}
      data-index={index}
      onClick={() => {
        if (!targetable) return;
        dispatch({ type: 'TARGET_SET', index: targetIndex });
        dispatch({ type: 'TARGET_CONFIRM' });
      }}
      onMouseEnter={() => targetable && dispatch({ type: 'TARGET_SET', index: targetIndex })}
    >
      {targeted && <span className="rpgb-target-cursor" aria-hidden="true">▶</span>}
      <div className="rpgb-card-sprite">
        {c.side === 'party' && c.defId === 'alex' ? (
          <img src={meImage.src} alt="Alex" style={{ width: '100%', imageRendering: 'pixelated', border: '2px solid var(--ff7-border)' }} />
        ) : (
          spriteFor(c)
        )}
      </div>
      {c.side === 'enemy' && <span className="rpgb-card-name">{c.name}</span>}
      {showHp && (
        <div className="rpgb-mini-bar" aria-label={`${c.name} HP`}>
          <div style={{ width: `${(c.hp / c.maxHp) * 100}%` }} />
        </div>
      )}
      {state.floaters.filter((f) => f.targetKey === c.key).map((f) => (
        <span key={f.id} className={`rpgb-floater${f.kind !== 'damage' ? ` rpgb-${f.kind}` : ''}`}>{f.text}</span>
      ))}
      {state.callouts.filter((f) => f.targetKey === c.key).map((f) => (
        <span key={f.id} className="rpgb-callout">{f.text}</span>
      ))}
    </div>
  );
}

function StatusRows({ state }: { state: BattleState }) {
  return (
    <div className="rpgb-window rpgb-status" data-testid="party-status">
      {partyMembers(state).map((p) => {
        const hpPct = (p.hp / p.maxHp) * 100;
        const hpClass = hpPct <= 20 ? ' rpgb-critical' : hpPct <= 45 ? ' rpgb-low' : '';
        return (
          <div key={p.key} className={`rpgb-stat-row${state.active === p.key ? ' rpgb-active-row' : ''}${p.alive ? '' : ' rpgb-down'}`}>
            <span className="rpgb-stat-name">{p.name}</span>
            <span className="rpgb-stat-cell">
              <span>HP {p.hp}/{p.maxHp}</span>
              <span className={`rpgb-bar rpgb-bar-hp${hpClass}`}><span className="rpgb-bar-fill" style={{ width: `${hpPct}%`, display: 'block' }} /></span>
            </span>
            <span className="rpgb-stat-cell">
              <span>MP {p.mp}/{p.maxMp}</span>
              <span className="rpgb-bar rpgb-bar-mp"><span className="rpgb-bar-fill" style={{ width: `${(p.mp / p.maxMp) * 100}%`, display: 'block' }} /></span>
            </span>
            <span className="rpgb-stat-cell">
              <span>LIMIT</span>
              <span className={`rpgb-bar rpgb-bar-limit${p.limit >= 1 ? ' rpgb-ready' : ''}`}><span className="rpgb-bar-fill" style={{ width: `${p.limit * 100}%`, display: 'block' }} /></span>
              {p.statuses.length > 0 && (
                <span className="rpgb-badges">
                  {p.statuses.map((s) => (
                    <span key={s.id} className={`rpgb-badge${s.id === 'haste' || s.id === 'atkUp' ? ' rpgb-badge-good' : ''}`}>{STATUS_LABEL[s.id]}</span>
                  ))}
                </span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Commands({ state, dispatch }: { state: BattleState; dispatch: BattleViewProps['dispatch'] }) {
  const active = state.active ? combatant(state, state.active) : null;
  const selecting = state.phase === 'select' && active?.side === 'party';
  const { open, cursor } = state.menu;

  if (!selecting || !active) {
    const hint = state.phase === 'target'
      ? 'Choose a target'
      : state.phase === 'intro'
        ? ''
        : 'Waiting...';
    return (
      <div className="rpgb-window rpgb-commands" data-testid="command-menu">
        <div className="rpgb-waiting">{hint}</div>
      </div>
    );
  }

  const pick = (index: number) => {
    dispatch({ type: 'MENU_SET_CURSOR', index });
    dispatch({ type: 'MENU_CONFIRM' });
  };
  const back = <button type="button" className="rpgb-cmd rpgb-cmd-back" onClick={() => dispatch({ type: 'MENU_CANCEL' })}>◀ BACK</button>;

  if (open === 'materia') {
    return (
      <div className="rpgb-window rpgb-commands" data-testid="command-menu">
        {availableMateria(state, active).map((m, i) => (
          <button key={m.id} type="button" className={`rpgb-cmd${cursor === i ? ' rpgb-focused' : ''}`} aria-disabled={active.mp < m.mpCost}
            onMouseEnter={() => dispatch({ type: 'MENU_SET_CURSOR', index: i })} onClick={() => pick(i)}>
            <span>{m.name}</span>
            <span className="rpgb-cmd-cost">{m.mpCost} MP</span>
          </button>
        ))}
        {back}
      </div>
    );
  }

  if (open === 'item') {
    return (
      <div className="rpgb-window rpgb-commands" data-testid="command-menu">
        {items.map((item, i) => (
          <button key={item.id} type="button" className={`rpgb-cmd${cursor === i ? ' rpgb-focused' : ''}`} aria-disabled={(state.inventory[item.id] ?? 0) <= 0}
            onMouseEnter={() => dispatch({ type: 'MENU_SET_CURSOR', index: i })} onClick={() => pick(i)}>
            <span>{item.name}</span>
            <span className="rpgb-cmd-cost">×{state.inventory[item.id] ?? 0}</span>
          </button>
        ))}
        {back}
      </div>
    );
  }

  return (
    <div className="rpgb-window rpgb-commands" data-testid="command-menu">
      {rootCommandsFor(active, state).map((cmd, i) => {
        const limitLocked = cmd === 'LIMIT' && active.limit < 1;
        return (
          <button key={cmd} type="button" className={`rpgb-cmd${cursor === i ? ' rpgb-focused' : ''}`} aria-disabled={limitLocked}
            data-cmd={cmd} onMouseEnter={() => dispatch({ type: 'MENU_SET_CURSOR', index: i })} onClick={() => pick(i)}>
            <span>{cmd}</span>
            {limitLocked && <span className="rpgb-cmd-cost">CHARGING</span>}
          </button>
        );
      })}
    </div>
  );
}

function ResultWindow({ state, dispatch }: { state: BattleState; dispatch: BattleViewProps['dispatch'] }) {
  const shownAt = useRef(state.clock);
  const r = state.result;
  if (!r) return null;
  const t = Math.min(1, (state.clock - shownAt.current) / EXP_BAR_MS);
  const boss = r.bossId ? bossById(r.bossId) : undefined;
  const era = boss
    ? experience.find((e) => e.company === boss.experienceMatch.company && (!boss.experienceMatch.period || e.period === boss.experienceMatch.period))
    : undefined;

  // EXP bar fills from the pre-battle fraction to the post-battle fraction of the current level
  const startExp = state.exp;
  const endExp = state.exp + r.exp;
  const shownExp = Math.round(startExp + (endExp - startExp) * t);
  const levelNow = r.levelsGained > 0 && t >= 1 ? r.newLevel : state.level;
  const lo = expForLevel(levelNow);
  const hi = expForLevel(levelNow + 1);
  const pct = Math.max(0, Math.min(100, ((shownExp - lo) / (hi - lo)) * 100));

  if (r.outcome === 'victory') {
    return (
      <div className="rpgb-window rpgb-result" data-testid="victory-panel">
        <h3 className="rpgb-result-title">VICTORY</h3>
        <div className="rpgb-result-tally">
          <div>EXP <span>{r.exp}</span></div>
          <div>GIL <span>{r.gil}</span></div>
          {r.drops.length > 0 && <div>FOUND <span>{r.drops.map((d) => items.find((i) => i.id === d)?.name ?? d).join(', ')}</span></div>}
        </div>
        <div className="rpgb-exp">
          <span>LV {levelNow}</span>
          <span className="rpgb-bar rpgb-bar-mp"><span className="rpgb-bar-fill" style={{ width: `${pct}%`, display: 'block' }} /></span>
          <span>{Math.max(0, hi - shownExp)} NEXT</span>
        </div>
        {t >= 1 && r.levelsGained > 0 && (
          <div className="rpgb-levelup" data-testid="level-up">LEVEL UP. LV {r.newLevel}</div>
        )}
        {era && (
          <>
            <div className="rpgb-quest-header">REWARD - REAL-WORLD ACHIEVEMENTS</div>
            <div className="rpgb-quest-role">{era.role} · {era.company} · {era.period}</div>
            <ul className="rpgb-achievements" data-testid="victory-achievements">
              {era.achievements.map((a) => <li key={a}>{a}</li>)}
            </ul>
          </>
        )}
        <div className="rpgb-result-actions">
          <button type="button" className="rpgb-result-btn" data-testid="result-continue" onClick={() => dispatch({ type: 'RESULT_CONTINUE' })}>CONTINUE ▶</button>
        </div>
      </div>
    );
  }

  return (
    <div className="rpgb-window rpgb-result" data-testid={r.outcome === 'defeat' ? 'defeat-panel' : 'fled-panel'}>
      <h3 className="rpgb-result-title">{r.outcome === 'defeat' ? 'ROLLED BACK' : 'GOT AWAY'}</h3>
      <p className="rpgb-result-note">
        {r.outcome === 'defeat' ? 'Rolled back to the last known-good deploy. Nothing was lost.' : 'Nobody followed.'}
      </p>
      <div className="rpgb-result-actions">
        <button type="button" className="rpgb-result-btn" data-testid="result-continue" onClick={() => dispatch({ type: 'RESULT_CONTINUE' })}>CONTINUE ▶</button>
      </div>
    </div>
  );
}

export default function BattleView({ state, dispatch }: BattleViewProps) {
  const shaking = state.clock < state.shakeUntil;
  const enemies = state.combatants.filter((c) => c.side === 'enemy');
  const fallback = state.bossId ? `${bossById(state.bossId)?.name} - ${bossById(state.bossId)?.era}` : livingEnemies(state).map((e) => e.name).join(', ');

  return (
    <div className="rpgb" data-testid="battle-view" data-phase={state.phase} data-kind={state.kind}>
      <TurnStrip state={state} />
      <div className={`rpgb-field${shaking ? ' rpgb-shaking' : ''}`}>
        <div className="rpgb-enemies">
          {enemies.map((c, i) => <Card key={c.key} c={c} state={state} dispatch={dispatch} index={i} />)}
        </div>
        <div className="rpgb-party">
          {partyMembers(state).map((c, i) => <Card key={c.key} c={c} state={state} dispatch={dispatch} index={i} />)}
        </div>
      </div>
      <div className="rpgb-window rpgb-message" aria-live="polite" data-testid="battle-message">
        {state.message || fallback}
      </div>
      <div className="rpgb-bottom">
        <StatusRows state={state} />
        <Commands state={state} dispatch={dispatch} />
      </div>
      {state.result && <ResultWindow state={state} dispatch={dispatch} />}
    </div>
  );
}

