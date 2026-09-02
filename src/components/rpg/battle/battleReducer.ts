// Pure turn-based battle reducer. No timers in select/target: the clock only
// drives animation queues. Randomness comes from state.rng (mulberry32).

import { party, statsAt, learnedMateria, levelFromExp, type PartyMemberDef } from '../../../data/party';
import { materiaById, type MateriaDef, type StatusId } from '../../../data/materia';
import { items, itemById } from '../../../data/items';
import { enemies, type EnemyDef, type AiAction } from '../../../data/enemies';
import { bossById } from '../../../data/bosses';
import { actCost, previewOrder, nextActor } from './turnQueue';
import { nextRng, physicalDamage, magicDamage, elementMultiplier } from './damage';
import { chooseEnemyAction } from './ai';
import type {
  BattleState, BattleAction, Combatant, SfxKind, FloaterKind, CalloutKind, StatusInst,
} from './types';

export const timing = {
  introMs: 1400,
  messageLeadMs: 600,
  impactGapMs: 420,
  settleMs: 500,
  floaterMs: 900,
  calloutMs: 1100,
  shakeMs: 320,
  flashMs: 200,
  resultDelayMs: 900,
  statusTickMs: 700,
};

export const LIMIT_FILL_DAMAGE = 260;
export const DEFEND_LIMIT_GAIN = 0.15;
export const POISON_FRACTION = 0.06;

export interface BattleSetup {
  kind: 'random' | 'boss';
  bossId?: string;
  enemies: EnemyDef[];
  level: number;
  exp: number;
  gil: number;
  inventory: Record<string, number>;
  seed: number;
}

function partyCombatant(def: PartyMemberDef, level: number): Combatant {
  const s = statsAt(def, level);
  return {
    key: def.id, side: 'party', name: def.name, defId: def.id,
    hp: s.hp, maxHp: s.hp, mp: s.mp, maxMp: s.mp, atk: s.atk, def: s.def, spd: s.spd,
    statuses: [], limit: 0, defending: false, nextAct: 0, alive: true,
    dodge: 0, weak: [], resist: [], absorb: [], immune: [], actsTwice: false, turnsTaken: 0,
  };
}

function enemyCombatant(def: EnemyDef, key: string, nameSuffix = ''): Combatant {
  const boss = bossById(def.id);
  return {
    key, side: 'enemy', name: def.name + nameSuffix, defId: def.id,
    hp: def.hp, maxHp: def.hp, mp: 0, maxMp: 0, atk: def.atk, def: def.def, spd: def.spd,
    statuses: [], limit: 0, defending: false, nextAct: 0, alive: true,
    dodge: def.dodge, weak: def.weak, resist: def.resist, absorb: def.absorb,
    immune: boss?.immune ?? [], actsTwice: def.actsTwice, turnsTaken: 0,
  };
}

export function createBattleState(setup: BattleSetup): BattleState {
  const combatants: Combatant[] = party.map((p) => partyCombatant(p, setup.level));
  let n = 1;
  for (const def of setup.enemies) {
    const boss = bossById(def.id);
    if (boss?.heads) {
      for (let h = 0; h < boss.heads; h++) combatants.push(enemyCombatant(def, `e${n++}`, ` ${['A', 'B', 'C'][h]}`));
    } else {
      combatants.push(enemyCombatant(def, `e${n++}`));
      if (def.pair) combatants.push(enemyCombatant(def, `e${n++}`, ' B'));
    }
  }
  const enemyCount = combatants.filter((c) => c.side === 'enemy').length;
  let intro: string;
  if (setup.kind === 'boss' && setup.bossId) {
    intro = bossById(setup.bossId)!.intro;
  } else if (enemyCount > 1) {
    intro = `${setup.enemies[0].name} and company appear.`;
  } else {
    intro = `${setup.enemies[0].name} appears.`;
  }
  return {
    kind: setup.kind,
    bossId: setup.bossId,
    phase: 'intro',
    clock: 0,
    rng: setup.seed >>> 0 || 1,
    combatants,
    active: null,
    order: previewOrder(combatants),
    menu: { open: 'root', cursor: 0, pending: null, targetCursor: 0 },
    queue: [
      { at: 200, type: 'sfx', sfx: 'encounter' },
      { at: 250, type: 'message', text: intro },
      { at: timing.introMs, type: 'end' },
    ],
    message: '',
    floaters: [],
    callouts: [],
    seq: 0,
    shakeUntil: 0,
    flashUntil: {},
    scanned: [],
    inventory: { ...setup.inventory },
    level: setup.level,
    exp: setup.exp,
    gil: setup.gil,
    phase2Done: false,
    lastSfx: null,
    result: null,
  };
}

// ---------- selectors ----------

export function livingEnemies(s: BattleState): Combatant[] {
  return s.combatants.filter((c) => c.side === 'enemy' && c.alive);
}

export function partyMembers(s: BattleState): Combatant[] {
  return s.combatants.filter((c) => c.side === 'party');
}

export function combatant(s: BattleState, key: string): Combatant {
  return s.combatants.find((c) => c.key === key)!;
}

export function memberDef(c: Combatant): PartyMemberDef {
  return party.find((p) => p.id === c.defId)!;
}

export type RootCommand = 'ATTACK' | 'BITE' | 'MATERIA' | 'TRICKS' | 'DEFEND' | 'ITEM' | 'LIMIT' | 'RUN';

export function rootCommandsFor(c: Combatant, s: BattleState): RootCommand[] {
  const def = memberDef(c);
  const cmds: RootCommand[] = [def.attackName as RootCommand, def.materiaCommand, 'DEFEND', 'ITEM', 'LIMIT'];
  if (s.kind === 'random') cmds.push('RUN');
  return cmds;
}

export function availableMateria(s: BattleState, c: Combatant): MateriaDef[] {
  return learnedMateria(memberDef(c), s.level);
}

export function menuLengthFor(s: BattleState): number {
  const c = s.active ? combatant(s, s.active) : null;
  if (!c) return 1;
  if (s.menu.open === 'root') return rootCommandsFor(c, s).length;
  if (s.menu.open === 'materia') return availableMateria(s, c).length;
  return items.length;
}

/** Who the pending command can target: enemies for attacks, party for heals. */
export function targetPool(s: BattleState): Combatant[] {
  const p = s.menu.pending;
  const allies = partyMembers(s).filter((c) => c.alive);
  if (!p) return livingEnemies(s);
  if (p.kind === 'materia') {
    const m = materiaById(p.id)!;
    return m.target === 'ally' ? allies : livingEnemies(s);
  }
  if (p.kind === 'item') return allies;
  return livingEnemies(s);
}

function hasStatus(c: Combatant, id: StatusId): boolean {
  return c.statuses.some((st) => st.id === id);
}

// ---------- helpers that mutate a cloned state ----------

function clone(s: BattleState): BattleState {
  return {
    ...s,
    combatants: s.combatants.map((c) => ({ ...c, statuses: c.statuses.map((st) => ({ ...st })) })),
    menu: { ...s.menu },
    queue: s.queue.slice(),
    floaters: s.floaters.slice(),
    callouts: s.callouts.slice(),
    flashUntil: { ...s.flashUntil },
    scanned: s.scanned.slice(),
    inventory: { ...s.inventory },
  };
}

function sfx(s: BattleState, kind: SfxKind) {
  s.seq += 1;
  s.lastSfx = { seq: s.seq, kind };
}

function floater(s: BattleState, targetKey: string, text: string, kind: FloaterKind) {
  s.seq += 1;
  s.floaters.push({ id: s.seq, targetKey, text, kind, bornAt: s.clock });
}

function callout(s: BattleState, targetKey: string, text: CalloutKind) {
  s.seq += 1;
  s.callouts.push({ id: s.seq, targetKey, text, bornAt: s.clock });
}

function roll(s: BattleState): number {
  const [r, next] = nextRng(s.rng);
  s.rng = next;
  return r;
}

function applyStatus(target: Combatant, st: StatusInst): boolean {
  if (target.immune.includes(st.id)) return false;
  const existing = target.statuses.find((x) => x.id === st.id);
  if (existing) existing.turns = Math.max(existing.turns, st.turns);
  else target.statuses.push({ ...st });
  // opposing statuses cancel
  if (st.id === 'haste') target.statuses = target.statuses.filter((x) => x.id !== 'slow');
  if (st.id === 'slow') target.statuses = target.statuses.filter((x) => x.id !== 'haste');
  return true;
}

function randomTarget(s: BattleState, side: 'party' | 'enemy', mode: 'random' | 'weakest' = 'random'): Combatant | null {
  const pool = s.combatants.filter((c) => c.side === side && c.alive);
  if (pool.length === 0) return null;
  if (mode === 'weakest') return pool.slice().sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
  return pool[Math.floor(roll(s) * pool.length)];
}

// ---------- action queuing ----------

/** Closes out the acting combatant's turn: the queue drains, then beginTurn runs. */
function endOfAction(s: BattleState, at: number) {
  s.queue.push({ at, type: 'end' });
  s.phase = 'resolving';
}

function queuePhysical(s: BattleState, attacker: Combatant, target: Combatant, powerScale: number, at: number) {
  if (target.dodge > 0 && roll(s) < target.dodge) {
    s.queue.push({ at, type: 'miss', targetKey: target.key });
    return;
  }
  const [amount, next] = physicalDamage(attacker, target, powerScale, s.rng);
  s.rng = next;
  s.queue.push({ at, type: 'damage', targetKey: target.key, amount, sfx: attacker.side === 'party' ? 'hit' : 'hurt' });
}

/** The callout shown for an element multiplier, if any. */
function elementCallout(mult: number): CalloutKind | undefined {
  if (mult === 2) return 'WEAK!';
  if (mult === 0.5) return 'RESIST';
  if (mult === 0) return 'ABSORB';
  return undefined;
}

function queueMagic(s: BattleState, caster: Combatant, target: Combatant, m: MateriaDef, at: number) {
  const [amount, next] = magicDamage(caster, target, m.power, m.element, s.rng);
  s.rng = next;
  const mult = elementMultiplier(target, m.element);
  const co = elementCallout(mult);
  if (mult === 0) {
    s.queue.push({ at, type: 'heal', targetKey: target.key, stat: 'hp', amount: Math.round(m.power / 2) });
    s.queue.push({ at, type: 'damage', targetKey: target.key, amount: 0, callout: co, sfx: 'heal' });
  } else {
    s.queue.push({ at, type: 'damage', targetKey: target.key, amount, callout: co, sfx: 'hit' });
  }
}

function startPartyAction(s: BattleState, actor: Combatant, targetKey: string | null) {
  const c = s.clock;
  const lead = timing.messageLeadMs;
  const pending = s.menu.pending!;
  const def = memberDef(actor);
  s.queue = [];

  if (pending.kind === 'attack') {
    const target = combatant(s, targetKey!);
    s.queue.push({ at: c, type: 'message', text: def.attackLine });
    queuePhysical(s, actor, target, 1, c + lead);
    const boss = bossById(target.defId);
    if (boss?.countersPhysical) {
      s.queue.push({ at: c + lead + timing.impactGapMs, type: 'message', text: `${target.name} counters.` });
      const [amount, next] = physicalDamage(target, actor, 0.7, s.rng);
      s.rng = next;
      s.queue.push({ at: c + lead + timing.impactGapMs * 2, type: 'damage', targetKey: actor.key, amount, callout: 'COUNTER', sfx: 'hurt' });
      endOfAction(s, c + lead + timing.impactGapMs * 2 + timing.settleMs);
      return;
    }
    endOfAction(s, c + lead + timing.settleMs);
    return;
  }

  if (pending.kind === 'limit') {
    const lim = def.limit;
    s.queue.push({ at: c, type: 'message', text: lim.line });
    s.queue.push({ at: c + 80, type: 'sfx', sfx: 'limit' });
    const targets = lim.target === 'enemies' ? livingEnemies(s) : [combatant(s, targetKey!)];
    let at = c + lead;
    for (let h = 0; h < lim.hits; h++) {
      for (const t of targets) {
        const [amount, next] = magicDamage(actor, t, lim.powerPerHit, lim.element, s.rng);
        s.rng = next;
        const boss = bossById(t.defId);
        const scaled = boss?.limitWeak ? amount * 2 : amount;
        s.queue.push({ at, type: 'damage', targetKey: t.key, amount: scaled, callout: boss?.limitWeak ? 'CRITICAL' : undefined, sfx: 'hit' });
      }
      at += timing.impactGapMs;
    }
    actor.limit = 0;
    endOfAction(s, at + timing.settleMs);
    return;
  }

  if (pending.kind === 'materia') {
    const m = materiaById(pending.id)!;
    actor.mp -= m.mpCost;
    s.queue.push({ at: c, type: 'message', text: m.line });
    const at = c + lead;
    switch (m.kind) {
      case 'damage': {
        const targets = m.target === 'enemies' ? livingEnemies(s) : [combatant(s, targetKey!)];
        for (const t of targets) queueMagic(s, actor, t, m, at);
        break;
      }
      case 'heal':
        s.queue.push({ at, type: 'heal', targetKey: targetKey!, stat: 'hp', amount: m.power });
        break;
      case 'status':
        if (m.status) {
          const t = m.target === 'self' ? actor : combatant(s, targetKey!);
          const lands = roll(s) < m.status.chance && !t.immune.includes(m.status.id);
          s.queue.push({ at, type: 'status', targetKey: t.key, status: lands ? { id: m.status.id, turns: m.status.turns } : null, text: lands ? m.status.id.toUpperCase() : 'NO EFFECT' });
        }
        break;
      case 'cure':
        for (const p of partyMembers(s)) s.queue.push({ at, type: 'cure', targetKey: p.key });
        break;
      case 'scan':
        s.queue.push({ at, type: 'scan', targetKey: targetKey! });
        break;
      case 'fetch': {
        const pool = ['coffee', 'coffee', 'runbook', 'patch', 'pager'];
        s.queue.push({ at, type: 'fetch', itemId: pool[Math.floor(roll(s) * pool.length)] });
        break;
      }
    }
    endOfAction(s, at + timing.settleMs);
    return;
  }

  // item
  const item = itemById(pending.id)!;
  s.inventory[item.id] = (s.inventory[item.id] ?? 1) - 1;
  s.queue.push({ at: c, type: 'message', text: `${actor.name} ${item.line}` });
  const at = c + lead;
  if (item.effect === 'hp') s.queue.push({ at, type: 'heal', targetKey: targetKey!, stat: 'hp', amount: item.amount });
  else if (item.effect === 'mp') s.queue.push({ at, type: 'heal', targetKey: targetKey!, stat: 'mp', amount: item.amount });
  else if (item.effect === 'cure') s.queue.push({ at, type: 'cure', targetKey: targetKey! });
  else if (item.effect === 'escape') {
    s.queue.push({ at, type: 'finish', outcome: 'fled' });
    s.phase = 'resolving';
    return;
  }
  endOfAction(s, at + timing.settleMs);
}

/** Who an enemy status move lands on. */
function statusTargets(s: BattleState, enemy: Combatant, target: 'random' | 'self' | 'allies'): Combatant[] {
  if (target === 'self') return [enemy];
  if (target === 'allies') return s.combatants.filter((x) => x.side === 'enemy' && x.alive);
  return [randomTarget(s, 'party')].filter((x): x is Combatant => !!x);
}

/** Queues one enemy action starting at `at`; returns the clock of its last beat. */
function queueEnemyAction(s: BattleState, enemy: Combatant, a: AiAction, at: number): number {
  const lead = timing.messageLeadMs;
  const announce = () => s.queue.push({ at, type: 'message' as const, text: `${enemy.name} uses ${a.name}.` });

  switch (a.type) {
    case 'attack': {
      const t = randomTarget(s, 'party', a.target);
      if (!t) return at;
      announce();
      const [base, next] = physicalDamage(enemy, t, a.power / 12, s.rng);
      s.rng = next;
      const mult = elementMultiplier(t, a.element);
      s.queue.push({ at: at + lead, type: 'damage', targetKey: t.key, amount: Math.round(base * mult), sfx: 'hurt' });
      return at + lead;
    }
    case 'attackAll': {
      announce();
      let hitAt = at + lead;
      for (const p of partyMembers(s).filter((p) => p.alive)) {
        const [base, next] = physicalDamage(enemy, p, a.power / 12, s.rng);
        s.rng = next;
        s.queue.push({ at: hitAt, type: 'damage', targetKey: p.key, amount: base, sfx: 'hurt' });
        hitAt += timing.impactGapMs / 2;
      }
      return hitAt;
    }
    case 'status': {
      announce();
      for (const t of statusTargets(s, enemy, a.target)) {
        const lands = roll(s) < a.chance && !t.immune.includes(a.status);
        s.queue.push({ at: at + lead, type: 'status', targetKey: t.key, status: lands ? { id: a.status, turns: a.turns } : null, text: lands ? a.status.toUpperCase() : 'NO EFFECT' });
      }
      return at + lead;
    }
    case 'heal':
      announce();
      s.queue.push({ at: at + lead, type: 'heal', targetKey: enemy.key, stat: 'hp', amount: a.amount });
      return at + lead;
    case 'flee':
      s.queue.push({ at, type: 'message', text: `${enemy.name} ${a.name.toLowerCase()}.` });
      s.queue.push({ at: at + lead, type: 'flee', key: enemy.key });
      return at + lead;
    case 'wait':
      s.queue.push({ at, type: 'message', text: `${enemy.name} ${a.name}.` });
      return at + lead / 2;
  }
}

function startEnemyAction(s: BattleState, enemy: Combatant) {
  const [action, rng] = chooseEnemyAction(enemy, s);
  s.rng = rng;
  s.queue = [];
  let at = queueEnemyAction(s, enemy, action, s.clock);
  if (enemy.actsTwice && enemy.alive) {
    const [second, rng2] = chooseEnemyAction(enemy, s);
    s.rng = rng2;
    at = queueEnemyAction(s, enemy, second, at + timing.impactGapMs);
  }
  s.queue.push({ at: at + timing.settleMs, type: 'end' });
  s.phase = 'resolving';
}

// ---------- turn flow ----------

function tickStatuses(s: BattleState, c: Combatant) {
  // poison bites at the start of the combatant's turn
  if (hasStatus(c, 'poison') && c.alive) {
    const dmg = Math.max(1, Math.round(c.maxHp * POISON_FRACTION));
    c.hp = Math.max(0, c.hp - dmg);
    floater(s, c.key, String(dmg), 'damage');
    if (c.hp === 0) c.alive = false;
  }
  for (const st of c.statuses) st.turns -= 1;
  c.statuses = c.statuses.filter((st) => st.turns > 0);
}

function beginTurn(s: BattleState) {
  const next = nextActor(s.combatants);
  if (!next) return;
  s.active = next.key;
  next.defending = false;
  tickStatuses(s, next);
  next.turnsTaken += 1;
  next.nextAct += actCost(next);
  s.order = [next.key, ...previewOrder(s.combatants, 7)];
  if (!next.alive) {
    // died to poison on its own turn
    endOfAction(s, s.clock + timing.statusTickMs);
    return;
  }
  if (next.side === 'party') {
    s.phase = 'select';
    // the menu is only visible during select, so this is the one place it resets
    s.menu = { open: 'root', cursor: 0, pending: null, targetCursor: 0 };
    s.message = '';
  } else {
    startEnemyAction(s, next);
  }
}

function checkOutcome(s: BattleState): boolean {
  const enemiesDead = livingEnemies(s).length === 0;
  const partyDead = partyMembers(s).every((p) => !p.alive);
  if (enemiesDead) {
    const bossLine = s.bossId ? bossById(s.bossId)!.defeatLine : 'Battle over.';
    s.queue = [
      { at: s.clock + 150, type: 'message', text: bossLine },
      { at: s.clock + timing.resultDelayMs, type: 'sfx', sfx: 'victory' },
      { at: s.clock + timing.resultDelayMs, type: 'finish', outcome: 'victory' },
    ];
    s.phase = 'resolving';
    return true;
  }
  if (partyDead) {
    s.queue = [
      { at: s.clock + 150, type: 'message', text: 'The party is down.' },
      { at: s.clock + timing.resultDelayMs, type: 'sfx', sfx: 'defeat' },
      { at: s.clock + timing.resultDelayMs, type: 'finish', outcome: 'defeat' },
    ];
    s.phase = 'resolving';
    return true;
  }
  return false;
}

function finish(s: BattleState, outcome: 'victory' | 'defeat' | 'fled') {
  s.phase = outcome;
  s.queue = [];
  let exp = 0;
  let gil = 0;
  const drops: string[] = [];
  if (outcome === 'victory') {
    const seen = new Set<string>();
    for (const e of s.combatants.filter((c) => c.side === 'enemy')) {
      const boss = bossById(e.defId);
      const def = boss ?? enemies.find((x) => x.id === e.defId);
      if (!def) continue;
      if (boss && seen.has(boss.id)) continue; // hydra heads count once
      seen.add(e.defId);
      exp += def.exp;
      gil += def.gil;
      if (def.drop && roll(s) < def.drop.chance) drops.push(def.drop.itemId);
    }
  }
  const newExp = s.exp + exp;
  const newLevel = levelFromExp(newExp);
  for (const d of drops) s.inventory[d] = (s.inventory[d] ?? 0) + 1;
  s.result = { outcome, exp, gil, drops, levelsGained: Math.max(0, newLevel - s.level), newLevel, bossId: s.bossId };
}

function processQueue(s: BattleState) {
  while (s.queue.length > 0 && s.queue[0].at <= s.clock) {
    const ev = s.queue.shift()!;
    switch (ev.type) {
      case 'message':
        s.message = ev.text;
        break;
      case 'sfx':
        sfx(s, ev.sfx);
        break;
      case 'miss':
        callout(s, ev.targetKey, 'MISS');
        sfx(s, 'miss');
        break;
      case 'damage': {
        const t = combatant(s, ev.targetKey);
        if (ev.amount > 0) {
          t.hp = Math.max(0, t.hp - ev.amount);
          floater(s, t.key, String(ev.amount), 'damage');
          if (t.side === 'party') {
            s.shakeUntil = s.clock + timing.shakeMs;
            t.limit = Math.min(1, t.limit + ev.amount / LIMIT_FILL_DAMAGE);
          } else {
            s.flashUntil[t.key] = s.clock + timing.flashMs;
          }
          if (t.hp === 0) t.alive = false;
        }
        if (ev.callout) {
          callout(s, t.key, ev.callout);
          if (ev.callout === 'WEAK!') sfx(s, 'weak');
        }
        sfx(s, ev.sfx);
        const boss = s.bossId ? bossById(s.bossId) : undefined;
        if (boss?.phase2 && !s.phase2Done && t.side === 'enemy' && t.hp > 0 && t.hp < t.maxHp * boss.phase2.hpBelow) {
          s.phase2Done = true;
          s.queue.unshift({ at: s.clock, type: 'phase2' });
        }
        break;
      }
      case 'phase2': {
        const boss = bossById(s.bossId!)!;
        s.message = boss.phase2!.message;
        break;
      }
      case 'heal': {
        const t = combatant(s, ev.targetKey);
        if (ev.stat === 'hp') {
          t.hp = Math.min(t.maxHp, t.hp + ev.amount);
          floater(s, t.key, `+${ev.amount}`, 'heal');
        } else {
          t.mp = Math.min(t.maxMp, t.mp + ev.amount);
          floater(s, t.key, `+${ev.amount} MP`, 'mp');
        }
        sfx(s, 'heal');
        break;
      }
      case 'status': {
        const t = combatant(s, ev.targetKey);
        if (ev.status) {
          applyStatus(t, ev.status);
          floater(s, t.key, ev.text, 'status');
          sfx(s, ev.status.id === 'haste' || ev.status.id === 'atkUp' ? 'heal' : 'hurt');
        } else {
          floater(s, t.key, ev.text, 'miss');
          sfx(s, 'buzzer');
        }
        break;
      }
      case 'cure': {
        const t = combatant(s, ev.targetKey);
        t.statuses = [];
        floater(s, t.key, 'CLEAR', 'buff');
        sfx(s, 'heal');
        break;
      }
      case 'scan': {
        if (!s.scanned.includes(ev.targetKey)) s.scanned.push(ev.targetKey);
        const t = combatant(s, ev.targetKey);
        const weak = t.weak.length ? t.weak.join(', ').toUpperCase() : 'nothing';
        s.message = `${t.name}: HP ${t.hp}/${t.maxHp}. Weak to ${weak}.`;
        sfx(s, 'confirm');
        break;
      }
      case 'fetch': {
        s.inventory[ev.itemId] = (s.inventory[ev.itemId] ?? 0) + 1;
        const item = itemById(ev.itemId)!;
        s.message = `MARA found a ${item.name}.`;
        floater(s, 'mara', item.name, 'buff');
        sfx(s, 'heal');
        break;
      }
      case 'flee': {
        const t = combatant(s, ev.key);
        t.alive = false;
        t.hp = 0;
        floater(s, t.key, 'GONE', 'miss');
        break;
      }
      case 'regrow': {
        const t = combatant(s, ev.key);
        t.alive = true;
        t.hp = Math.round(t.maxHp * 0.4);
        floater(s, t.key, 'REGROWS', 'status');
        sfx(s, 'buzzer');
        break;
      }
      case 'end': {
        if (s.phase === 'intro') {
          s.phase = 'resolving';
          s.message = '';
          beginTurn(s);
          break;
        }
        // hydra: a dead head regrows at the start of the hydra's next turn
        // unless every head died in this same round
        const boss = s.bossId ? bossById(s.bossId) : undefined;
        if (boss?.heads) {
          const heads = s.combatants.filter((c) => c.side === 'enemy');
          const dead = heads.filter((h) => !h.alive);
          const activeHead = s.active ? combatant(s, s.active) : null;
          if (dead.length > 0 && dead.length < heads.length && activeHead?.side === 'enemy') {
            s.queue.unshift({ at: s.clock, type: 'regrow', key: dead[0].key });
            s.queue.push({ at: s.clock + timing.settleMs, type: 'end' });
            break;
          }
        }
        if (checkOutcome(s)) break;
        s.message = '';
        beginTurn(s);
        break;
      }
      case 'finish':
        finish(s, ev.outcome);
        break;
    }
  }
}

// ---------- reducer ----------

export function battleReducer(state: BattleState, action: BattleAction): BattleState {
  if (state.phase === 'done') return state;
  const s = clone(state);

  switch (action.type) {
    case 'TICK': {
      const dt = Math.min(action.dt, 50);
      s.clock += dt;
      if (s.phase === 'victory' || s.phase === 'defeat' || s.phase === 'fled') return s;
      s.floaters = s.floaters.filter((f) => s.clock - f.bornAt < timing.floaterMs);
      s.callouts = s.callouts.filter((f) => s.clock - f.bornAt < timing.calloutMs);
      if (s.phase === 'intro' || s.phase === 'resolving') processQueue(s);
      return s;
    }

    case 'MENU_MOVE': {
      if (s.phase !== 'select') return state;
      const len = menuLengthFor(s);
      s.menu.cursor = (s.menu.cursor + action.delta + len) % len;
      sfx(s, 'cursor');
      return s;
    }

    case 'MENU_SET_CURSOR': {
      if (s.phase !== 'select') return state;
      s.menu.cursor = action.index;
      return s;
    }

    case 'MENU_CANCEL': {
      if (s.phase === 'target') {
        s.phase = 'select';
        s.menu.pending = null;
        sfx(s, 'cancel');
        return s;
      }
      if (s.phase !== 'select' || s.menu.open === 'root') return state;
      s.menu = { ...s.menu, open: 'root', cursor: 0, pending: null };
      sfx(s, 'cancel');
      return s;
    }

    case 'MENU_CONFIRM': {
      if (s.phase !== 'select' || !s.active) return state;
      const actor = combatant(s, s.active);
      const { open, cursor } = s.menu;

      if (open === 'root') {
        const cmd = rootCommandsFor(actor, s)[cursor];
        if (cmd === 'ATTACK' || cmd === 'BITE') {
          s.menu.pending = { kind: 'attack' };
          s.phase = 'target';
          s.menu.targetCursor = 0;
          sfx(s, 'confirm');
        } else if (cmd === 'MATERIA' || cmd === 'TRICKS') {
          if (hasStatus(actor, 'silence')) {
            sfx(s, 'buzzer');
            s.message = `${actor.name} is silenced.`;
          } else {
            s.menu = { ...s.menu, open: 'materia', cursor: 0 };
            sfx(s, 'confirm');
          }
        } else if (cmd === 'DEFEND') {
          actor.defending = true;
          actor.limit = Math.min(1, actor.limit + DEFEND_LIMIT_GAIN);
          sfx(s, 'confirm');
          s.queue = [{ at: s.clock, type: 'message', text: `${actor.name} defends.` }];
          endOfAction(s, s.clock + timing.settleMs);
        } else if (cmd === 'ITEM') {
          s.menu = { ...s.menu, open: 'item', cursor: 0 };
          sfx(s, 'confirm');
        } else if (cmd === 'LIMIT') {
          if (actor.limit >= 1) {
            s.menu.pending = { kind: 'limit' };
            sfx(s, 'confirm');
            if (memberDef(actor).limit.target === 'enemies') startPartyAction(s, actor, null);
            else {
              s.phase = 'target';
              s.menu.targetCursor = 0;
            }
          } else {
            sfx(s, 'buzzer');
            s.message = 'LIMIT gauge is not full.';
          }
        } else if (cmd === 'RUN') {
          sfx(s, 'confirm');
          s.queue = [
            { at: s.clock, type: 'message', text: 'The party runs.' },
            { at: s.clock + timing.settleMs, type: 'finish', outcome: 'fled' },
          ];
          s.phase = 'resolving';
        }
        return s;
      }

      if (open === 'materia') {
        const m = availableMateria(s, actor)[cursor];
        if (!m) return state;
        if (actor.mp < m.mpCost) {
          sfx(s, 'buzzer');
          s.message = 'Not enough MP.';
          return s;
        }
        s.menu.pending = { kind: 'materia', id: m.id };
        sfx(s, 'confirm');
        if (m.target === 'enemy' || m.target === 'ally') {
          s.phase = 'target';
          s.menu.targetCursor = 0;
        } else {
          startPartyAction(s, actor, null);
        }
        return s;
      }

      // item submenu
      const item = items[cursor];
      if (!item) return state;
      if ((s.inventory[item.id] ?? 0) <= 0) {
        sfx(s, 'buzzer');
        s.message = `No ${item.name} left.`;
        return s;
      }
      s.menu.pending = { kind: 'item', id: item.id };
      sfx(s, 'confirm');
      if (item.effect === 'escape') {
        if (s.kind === 'boss') {
          sfx(s, 'buzzer');
          s.message = 'No answer. You cannot escape a boss.';
          s.menu.pending = null;
          return s;
        }
        startPartyAction(s, actor, null);
      } else {
        s.phase = 'target';
        s.menu.targetCursor = 0;
      }
      return s;
    }

    case 'TARGET_MOVE': {
      if (s.phase !== 'target') return state;
      const pool = targetPool(s);
      s.menu.targetCursor = (s.menu.targetCursor + action.delta + pool.length) % pool.length;
      sfx(s, 'cursor');
      return s;
    }

    case 'TARGET_SET': {
      if (s.phase !== 'target') return state;
      s.menu.targetCursor = action.index;
      return s;
    }

    case 'TARGET_CONFIRM': {
      if (s.phase !== 'target' || !s.active) return state;
      const pool = targetPool(s);
      const target = pool[s.menu.targetCursor] ?? pool[0];
      if (!target) return state;
      sfx(s, 'confirm');
      startPartyAction(s, combatant(s, s.active), target.key);
      return s;
    }

    case 'RESULT_CONTINUE': {
      if (s.phase !== 'victory' && s.phase !== 'defeat' && s.phase !== 'fled') return state;
      s.phase = 'done';
      return s;
    }

    default:
      return state;
  }
}
