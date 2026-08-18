import {
  bosses,
  spells,
  items,
  playerBase,
  timing,
  damageVariance,
  type Boss,
} from '../../../data/battles';
import type {
  BattleState,
  BattleAction,
  TimedEvent,
  SfxKind,
  FloaterKind,
} from './types';

// mulberry32 step - RNG state lives in BattleState so replays are exact
function nextRng(state: number): [value: number, next: number] {
  const t = (state + 0x6d2b79f5) | 0;
  let r = Math.imul(t ^ (t >>> 15), 1 | t);
  r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
  return [((r ^ (r >>> 14)) >>> 0) / 4294967296, t];
}

export function createBattleState(boss: Boss, seed: number): BattleState {
  return {
    phase: 'intro',
    boss,
    clock: 0,
    rng: seed >>> 0 || 1,
    player: {
      hp: playerBase.maxHp,
      maxHp: playerBase.maxHp,
      mp: playerBase.maxMp,
      maxMp: playerBase.maxMp,
      atb: 0,
      limit: 0,
      buffed: false,
      itemUses: Object.fromEntries(items.map((i) => [i.id, i.uses])),
    },
    enemy: { hp: boss.maxHp, maxHp: boss.maxHp, atb: 0.35, nextAttack: 0 },
    menu: { open: 'root', cursor: 0 },
    queue: [
      { at: 250, type: 'message', text: boss.intro },
      { at: timing.introMs, type: 'end' },
    ],
    returnToCommand: false,
    message: '',
    floaters: [],
    floaterSeq: 0,
    shakeUntil: 0,
    enemyFlashUntil: 0,
    lastSfx: null,
    sfxSeq: 0,
  };
}

export function getBossById(id: string): Boss | undefined {
  return bosses.find((b) => b.id === id);
}

// Visible root commands, in display order
export const rootCommands = ['ATTACK', 'MATERIA', 'ITEM', 'LIMIT'] as const;

function clone(s: BattleState): BattleState {
  return {
    ...s,
    player: { ...s.player, itemUses: { ...s.player.itemUses } },
    enemy: { ...s.enemy },
    menu: { ...s.menu },
    queue: s.queue.slice(),
    floaters: s.floaters.slice(),
  };
}

function sfx(s: BattleState, kind: SfxKind) {
  s.sfxSeq += 1;
  s.lastSfx = { seq: s.sfxSeq, kind };
}

function addFloater(s: BattleState, target: 'player' | 'enemy', text: string, kind: FloaterKind) {
  s.floaterSeq += 1;
  s.floaters.push({ id: s.floaterSeq, target, text, kind, bornAt: s.clock });
}

function rollDamage(s: BattleState, base: number, buffed: boolean): number {
  const [r, next] = nextRng(s.rng);
  s.rng = next;
  const variance = 1 - damageVariance + 2 * damageVariance * r;
  const mult = buffed ? playerBase.buffMultiplier : 1;
  return Math.max(1, Math.round(base * variance * mult));
}

/** Queue a player action and enter the resolving phase. */
function startPlayerAction(s: BattleState, kind: 'attack' | 'limit' | { spell: number } | { item: number }) {
  const c = s.clock;
  const q: TimedEvent[] = [];
  const lead = timing.messageLeadMs;

  if (kind === 'attack') {
    q.push({ at: c, type: 'message', text: playerBase.attackLine });
    q.push({ at: c + lead, type: 'damage', target: 'enemy', amount: rollDamage(s, playerBase.attackPower, s.player.buffed), sfx: 'hit' });
    q.push({ at: c + lead + timing.settleMs, type: 'end' });
  } else if (kind === 'limit') {
    q.push({ at: c, type: 'message', text: playerBase.limit.line });
    q.push({ at: c + 100, type: 'sfx', sfx: 'limit' });
    for (let i = 0; i < playerBase.limit.hits; i++) {
      q.push({
        at: c + lead + i * timing.impactGapMs,
        type: 'damage',
        target: 'enemy',
        amount: rollDamage(s, playerBase.limit.powerPerHit, s.player.buffed),
        sfx: 'hit',
      });
    }
    q.push({ at: c + lead + playerBase.limit.hits * timing.impactGapMs + timing.settleMs, type: 'end' });
    s.player.limit = 0;
  } else if ('spell' in kind) {
    const spell = spells[kind.spell];
    s.player.mp -= spell.mpCost;
    q.push({ at: c, type: 'message', text: spell.line });
    if (spell.kind === 'buff') {
      q.push({ at: c + lead, type: 'buff' });
    } else {
      q.push({ at: c + lead, type: 'damage', target: 'enemy', amount: rollDamage(s, spell.power, s.player.buffed), sfx: 'hit' });
    }
    q.push({ at: c + lead + timing.settleMs, type: 'end' });
  } else {
    const item = items[kind.item];
    s.player.itemUses[item.id] -= 1;
    q.push({ at: c, type: 'message', text: item.line });
    q.push({ at: c + lead, type: 'heal', stat: item.effect === 'restore-mp' ? 'mp' : 'hp', amount: item.amount });
    q.push({ at: c + lead + timing.settleMs, type: 'end' });
  }

  s.queue = q;
  s.player.atb = 0;
  s.phase = 'resolving';
  s.returnToCommand = false;
  s.menu = { open: 'root', cursor: 0 };
}

function startEnemyAction(s: BattleState) {
  const c = s.clock;
  const attack = s.boss.attacks[s.enemy.nextAttack % s.boss.attacks.length];
  s.enemy.nextAttack += 1;
  s.returnToCommand = s.phase === 'command';
  s.queue = [
    { at: c, type: 'message', text: `${s.boss.name} uses ${attack.name}!` },
    { at: c + timing.messageLeadMs, type: 'damage', target: 'player', amount: rollDamage(s, attack.power, false), sfx: 'hurt' },
    { at: c + timing.messageLeadMs + timing.settleMs, type: 'end' },
  ];
  s.enemy.atb = 0;
  s.phase = 'resolving';
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
      case 'damage':
        if (ev.target === 'enemy') {
          s.enemy.hp = Math.max(0, s.enemy.hp - ev.amount);
          s.enemyFlashUntil = s.clock + timing.flashMs;
          addFloater(s, 'enemy', String(ev.amount), 'damage');
        } else {
          s.player.hp = Math.max(0, s.player.hp - ev.amount);
          s.shakeUntil = s.clock + timing.shakeMs;
          s.player.limit = Math.min(1, s.player.limit + ev.amount / playerBase.limitFillDamage);
          addFloater(s, 'player', String(ev.amount), 'damage');
        }
        sfx(s, ev.sfx);
        break;
      case 'heal':
        if (ev.stat === 'hp') {
          s.player.hp = Math.min(s.player.maxHp, s.player.hp + ev.amount);
          addFloater(s, 'player', `+${ev.amount}`, 'heal');
        } else {
          s.player.mp = Math.min(s.player.maxMp, s.player.mp + ev.amount);
          addFloater(s, 'player', `+${ev.amount} MP`, 'mp');
        }
        sfx(s, 'heal');
        break;
      case 'buff':
        s.player.buffed = true;
        addFloater(s, 'player', 'POWER UP!', 'buff');
        sfx(s, 'heal');
        break;
      case 'end': {
        if (s.phase === 'intro') {
          s.phase = 'idle';
          s.message = '';
          break;
        }
        if (s.enemy.hp <= 0) {
          s.queue = [
            { at: s.clock + 150, type: 'message', text: s.boss.defeatLine },
            { at: s.clock + timing.victoryDelayMs, type: 'sfx', sfx: 'victory' },
            { at: s.clock + timing.victoryDelayMs, type: 'finish', outcome: 'victory' },
          ];
          break;
        }
        if (s.player.hp <= 0) {
          s.queue = [
            { at: s.clock + 150, type: 'message', text: 'ALEX is down! Initiating rollback…' },
            { at: s.clock + timing.victoryDelayMs, type: 'sfx', sfx: 'defeat' },
            { at: s.clock + timing.victoryDelayMs, type: 'finish', outcome: 'defeat' },
          ];
          break;
        }
        s.message = '';
        if (s.returnToCommand || s.player.atb >= 1) {
          s.phase = 'command';
          s.menu = { open: 'root', cursor: 0 };
        } else {
          s.phase = 'idle';
        }
        s.returnToCommand = false;
        break;
      }
      case 'finish':
        s.phase = ev.outcome;
        s.queue = [];
        break;
    }
  }
}

export function battleReducer(state: BattleState, action: BattleAction): BattleState {
  if (state.phase === 'victory' || state.phase === 'defeat') {
    return state;
  }
  const s = clone(state);

  switch (action.type) {
    case 'TICK': {
      const dt = Math.min(action.dt, 50);
      s.clock += dt;
      s.floaters = s.floaters.filter((f) => s.clock - f.bornAt < timing.floaterMs);

      if (s.phase === 'intro' || s.phase === 'resolving') {
        processQueue(s);
      }

      if (s.phase === 'idle' || s.phase === 'command' || s.phase === 'resolving') {
        s.player.atb = Math.min(1, s.player.atb + dt / timing.playerAtbMs);
        s.enemy.atb = Math.min(1, s.enemy.atb + dt / s.boss.atbMs);
      }

      if ((s.phase === 'idle' || s.phase === 'command') && s.enemy.atb >= 1) {
        startEnemyAction(s);
      } else if (s.phase === 'idle' && s.player.atb >= 1) {
        s.phase = 'command';
        s.menu = { open: 'root', cursor: 0 };
      }
      return s;
    }

    case 'MENU_MOVE': {
      if (s.phase !== 'command') return state;
      const len = s.menu.open === 'root' ? rootCommands.length : s.menu.open === 'materia' ? spells.length : items.length;
      s.menu.cursor = (s.menu.cursor + action.delta + len) % len;
      sfx(s, 'cursor');
      return s;
    }

    case 'MENU_SET_CURSOR': {
      if (s.phase !== 'command') return state;
      s.menu.cursor = action.index;
      return s;
    }

    case 'MENU_OPEN': {
      if (s.phase !== 'command') return state;
      s.menu = { open: action.menu, cursor: 0 };
      sfx(s, 'confirm');
      return s;
    }

    case 'MENU_CANCEL': {
      if (s.phase !== 'command') return state;
      if (s.menu.open !== 'root') {
        s.menu = { open: 'root', cursor: 0 };
        sfx(s, 'cancel');
        return s;
      }
      return state;
    }

    case 'MENU_CONFIRM': {
      if (s.phase !== 'command') return state;
      const { open, cursor } = s.menu;

      if (open === 'root') {
        const cmd = rootCommands[cursor];
        if (cmd === 'ATTACK') {
          sfx(s, 'confirm');
          startPlayerAction(s, 'attack');
        } else if (cmd === 'MATERIA') {
          s.menu = { open: 'materia', cursor: 0 };
          sfx(s, 'confirm');
        } else if (cmd === 'ITEM') {
          s.menu = { open: 'item', cursor: 0 };
          sfx(s, 'confirm');
        } else if (cmd === 'LIMIT') {
          if (s.player.limit >= 1) {
            sfx(s, 'confirm');
            startPlayerAction(s, 'limit');
          } else {
            sfx(s, 'buzzer');
            s.message = 'LIMIT gauge is not full!';
          }
        }
        return s;
      }

      if (open === 'materia') {
        const spell = spells[cursor];
        if (s.player.mp >= spell.mpCost) {
          sfx(s, 'confirm');
          startPlayerAction(s, { spell: cursor });
        } else {
          sfx(s, 'buzzer');
          s.message = 'Not enough MP!';
        }
        return s;
      }

      // item submenu
      const item = items[cursor];
      if (s.player.itemUses[item.id] > 0) {
        sfx(s, 'confirm');
        startPlayerAction(s, { item: cursor });
      } else {
        sfx(s, 'buzzer');
        s.message = `No ${item.name} left!`;
      }
      return s;
    }

    default:
      return state;
  }
}
