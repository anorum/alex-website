import { describe, expect, it } from 'vitest';
import { createBattleState, battleReducer, livingEnemies, rootCommandsFor } from '../../src/components/rpg/battle/battleReducer';
import { chooseEnemyAction } from '../../src/components/rpg/battle/ai';
import { enemyById } from '../../src/data/enemies';
import { bossById } from '../../src/data/bosses';
import type { BattleState } from '../../src/components/rpg/battle/types';

function tick(s: BattleState, ms: number): BattleState {
  for (let t = 0; t < ms; t += 25) s = battleReducer(s, { type: 'TICK', dt: 25 });
  return s;
}

function randomFight(seed = 7) {
  return createBattleState({
    kind: 'random',
    enemies: [enemyById('flaky-test')!],
    level: 5,
    exp: 0,
    gil: 0,
    inventory: { coffee: 1 },
    seed,
  });
}

/** Advance until a party member is choosing a command. */
function untilSelect(s: BattleState): BattleState {
  for (let i = 0; i < 400 && s.phase !== 'select' && s.phase !== 'victory' && s.phase !== 'defeat'; i++) {
    s = battleReducer(s, { type: 'TICK', dt: 25 });
  }
  return s;
}

describe('battle reducer', () => {
  it('starts in intro then hands the first turn to the fastest combatant', () => {
    let s = randomFight();
    expect(s.phase).toBe('intro');
    s = untilSelect(s);
    expect(s.phase).toBe('select');
    expect(s.active).toBe('mara');
    expect(s.order.length).toBe(8);
  });

  it('attack goes through target selection and damages the enemy', () => {
    let s = untilSelect(randomFight());
    const before = livingEnemies(s)[0].hp;
    s = battleReducer(s, { type: 'MENU_CONFIRM' });
    expect(s.phase).toBe('target');
    s = battleReducer(s, { type: 'TARGET_CONFIRM' });
    expect(s.phase).toBe('resolving');
    s = tick(s, 2000);
    const after = s.combatants.find((c) => c.key === 'e1')!.hp;
    expect(after).toBeLessThanOrEqual(before);
  });

  it('RUN ends a random battle as fled', () => {
    let s = untilSelect(randomFight());
    const cmds = rootCommandsFor(s.combatants.find((c) => c.key === s.active)!, s);
    const runIndex = cmds.indexOf('RUN');
    expect(runIndex).toBeGreaterThan(-1);
    s = battleReducer(s, { type: 'MENU_SET_CURSOR', index: runIndex });
    s = battleReducer(s, { type: 'MENU_CONFIRM' });
    s = tick(s, 3000);
    expect(s.phase).toBe('fled');
    expect(s.result?.outcome).toBe('fled');
  });

  it('boss battles have no RUN and pay exp on victory', () => {
    let s = createBattleState({ kind: 'boss', enemies: [bossById('on-prem-titan')!], level: 30, exp: 0, gil: 0, inventory: {}, seed: 3, bossId: 'on-prem-titan' });
    s = untilSelect(s);
    const cmds = rootCommandsFor(s.combatants.find((c) => c.key === s.active)!, s);
    expect(cmds).not.toContain('RUN');
    for (let i = 0; i < 60 && s.phase !== 'victory'; i++) {
      s = untilSelect(s);
      if (s.phase !== 'select') break;
      s = battleReducer(s, { type: 'MENU_SET_CURSOR', index: 0 });
      s = battleReducer(s, { type: 'MENU_CONFIRM' });
      if (s.phase === 'target') s = battleReducer(s, { type: 'TARGET_CONFIRM' });
      s = tick(s, 4000);
    }
    expect(s.phase).toBe('victory');
    expect(s.result?.exp).toBe(400);
    expect(s.result?.bossId).toBe('on-prem-titan');
  });

  it('is deterministic for a seed', () => {
    const a = tick(untilSelect(randomFight(11)), 500);
    const b = tick(untilSelect(randomFight(11)), 500);
    expect(a).toEqual(b);
  });

  it('hydra spawns three heads', () => {
    const s = createBattleState({ kind: 'boss', enemies: [bossById('sql-hydra')!], level: 10, exp: 0, gil: 0, inventory: {}, seed: 1, bossId: 'sql-hydra' });
    expect(s.combatants.filter((c) => c.side === 'enemy').length).toBe(3);
  });
});

describe('enemy ai', () => {
  it('prefers hpBelow30 rules when hurt', () => {
    const s = createBattleState({ kind: 'random', enemies: [enemyById('prod-incident')!], level: 20, exp: 0, gil: 0, inventory: {}, seed: 5 });
    const enemy = s.combatants.find((c) => c.key === 'e1')!;
    enemy.hp = 10;
    const [action] = chooseEnemyAction(enemy, s);
    expect(action.type).toBe('heal');
  });
});
