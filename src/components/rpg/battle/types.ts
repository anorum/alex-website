// Battle state for the turn-based engine. Pure data types - no React.

import type { Element, StatusId } from '../../../data/materia';

export interface StatusInst {
  id: StatusId;
  /** remaining turns of the affected combatant */
  turns: number;
}

export interface Combatant {
  /** unique within the battle: 'alex', 'mara', 'e1', 'e2', 'e3' */
  key: string;
  side: 'party' | 'enemy';
  name: string;
  /** party member id or enemy/boss def id */
  defId: string;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  atk: number;
  def: number;
  spd: number;
  statuses: StatusInst[];
  /** 0..1 limit gauge (party only) */
  limit: number;
  defending: boolean;
  /** CTB counter: lowest acts next */
  nextAct: number;
  alive: boolean;
  dodge: number;
  weak: Element[];
  resist: Element[];
  absorb: Element[];
  immune: StatusId[];
  actsTwice: boolean;
  turnsTaken: number;
}

export type BattlePhase =
  | 'intro'
  | 'select'
  | 'target'
  | 'resolving'
  | 'victory'
  | 'defeat'
  | 'fled'
  | 'done';

export type SfxKind =
  | 'cursor' | 'confirm' | 'cancel' | 'buzzer' | 'hit' | 'hurt' | 'heal'
  | 'limit' | 'victory' | 'defeat' | 'weak' | 'miss' | 'levelup' | 'encounter';

export type FloaterKind = 'damage' | 'heal' | 'mp' | 'buff' | 'miss' | 'status';

export interface Floater {
  id: number;
  targetKey: string;
  text: string;
  kind: FloaterKind;
  bornAt: number;
}

export type CalloutKind = 'WEAK!' | 'RESIST' | 'ABSORB' | 'MISS' | 'COUNTER' | 'CRITICAL';

export interface Callout {
  id: number;
  targetKey: string;
  text: CalloutKind;
  bornAt: number;
}

export type TimedEvent =
  | { at: number; type: 'message'; text: string }
  | { at: number; type: 'sfx'; sfx: SfxKind }
  | { at: number; type: 'damage'; targetKey: string; amount: number; callout?: CalloutKind; sfx: SfxKind }
  | { at: number; type: 'miss'; targetKey: string }
  | { at: number; type: 'heal'; targetKey: string; stat: 'hp' | 'mp'; amount: number }
  | { at: number; type: 'status'; targetKey: string; status: StatusInst | null; text: string }
  | { at: number; type: 'cure'; targetKey: string }
  | { at: number; type: 'scan'; targetKey: string }
  | { at: number; type: 'fetch'; itemId: string }
  | { at: number; type: 'flee'; key: string }
  | { at: number; type: 'regrow'; key: string }
  | { at: number; type: 'phase2' }
  | { at: number; type: 'end' }
  | { at: number; type: 'finish'; outcome: 'victory' | 'defeat' | 'fled' };

export type MenuId = 'root' | 'materia' | 'item';

export interface BattleMenu {
  open: MenuId;
  cursor: number;
  /** command chosen, waiting for a target */
  pending: { kind: 'attack' } | { kind: 'materia'; id: string } | { kind: 'item'; id: string } | { kind: 'limit' } | null;
  targetCursor: number;
}

export interface BattleResult {
  outcome: 'victory' | 'defeat' | 'fled';
  exp: number;
  gil: number;
  drops: string[];
  levelsGained: number;
  newLevel: number;
  bossId?: string;
}

export interface BattleState {
  kind: 'random' | 'boss';
  bossId?: string;
  phase: BattlePhase;
  clock: number;
  rng: number;
  combatants: Combatant[];
  /** key of the combatant whose turn it is */
  active: string | null;
  /** next actors, computed on each turn start */
  order: string[];
  menu: BattleMenu;
  queue: TimedEvent[];
  message: string;
  floaters: Floater[];
  callouts: Callout[];
  seq: number;
  shakeUntil: number;
  flashUntil: Record<string, number>;
  /** keys revealed by SCAN */
  scanned: string[];
  /** inventory in play; written back to the save on finish */
  inventory: Record<string, number>;
  /** level at battle start, for the results screen */
  level: number;
  exp: number;
  gil: number;
  phase2Done: boolean;
  lastSfx: { seq: number; kind: SfxKind } | null;
  result: BattleResult | null;
}

export type BattleAction =
  | { type: 'TICK'; dt: number }
  | { type: 'MENU_MOVE'; delta: number }
  | { type: 'MENU_SET_CURSOR'; index: number }
  | { type: 'MENU_CONFIRM' }
  | { type: 'MENU_CANCEL' }
  | { type: 'TARGET_MOVE'; delta: number }
  | { type: 'TARGET_SET'; index: number }
  | { type: 'TARGET_CONFIRM' }
  | { type: 'RESULT_CONTINUE' };
