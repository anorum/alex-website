// Enemy decision making: the first matching rule group wins, one action is
// drawn by weight with the seeded rng. Pure.

import { enemyById, type AiAction, type AiCondition, type AiRule } from '../../../data/enemies';
import { bossById } from '../../../data/bosses';
import { nextRng } from './damage';
import type { BattleState, Combatant } from './types';

const CONDITION_PRIORITY: AiCondition[] = ['hpBelow30', 'allyDown', 'turn3', 'partyPoisoned', 'always'];

function rulesFor(enemy: Combatant, state: BattleState): AiRule[] {
  const boss = bossById(enemy.defId);
  if (boss) {
    if (boss.phase2 && state.phase2Done) return boss.phase2.ai;
    return boss.ai;
  }
  return enemyById(enemy.defId)?.ai ?? [];
}

function holds(cond: AiCondition, enemy: Combatant, state: BattleState): boolean {
  switch (cond) {
    case 'always':
      return true;
    case 'hpBelow30':
      return enemy.hp < enemy.maxHp * 0.3;
    case 'allyDown':
      return state.combatants.some((c) => c.side === 'enemy' && c.key !== enemy.key && !c.alive);
    case 'turn3':
      return enemy.turnsTaken >= 2;
    case 'partyPoisoned':
      return state.combatants.some((c) => c.side === 'party' && c.statuses.some((s) => s.id === 'poison'));
  }
}

export function chooseEnemyAction(enemy: Combatant, state: BattleState): [AiAction, number] {
  const rules = rulesFor(enemy, state);
  let rng = state.rng;
  for (const cond of CONDITION_PRIORITY) {
    const group = rules.filter((r) => r.when === cond && holds(cond, enemy, state));
    if (group.length === 0) continue;
    const total = group.reduce((sum, r) => sum + r.weight, 0);
    const [r, next] = nextRng(rng);
    rng = next;
    let pick = r * total;
    for (const rule of group) {
      pick -= rule.weight;
      if (pick <= 0) return [rule.do, rng];
    }
    return [group[group.length - 1].do, rng];
  }
  return [{ type: 'wait', name: 'does nothing' }, rng];
}
