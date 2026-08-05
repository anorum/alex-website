import type { Boss } from '../../../data/battles';

export type BattlePhase = 'intro' | 'idle' | 'command' | 'resolving' | 'victory' | 'defeat';

export type MenuId = 'root' | 'materia' | 'item';

export type SfxKind =
  | 'cursor'
  | 'confirm'
  | 'cancel'
  | 'hit'
  | 'hurt'
  | 'heal'
  | 'limit'
  | 'victory'
  | 'defeat'
  | 'buzzer';

export type FloaterKind = 'damage' | 'heal' | 'mp' | 'buff';

export interface Floater {
  id: number;
  target: 'player' | 'enemy';
  text: string;
  kind: FloaterKind;
  bornAt: number;
}

export type TimedEvent =
  | { at: number; type: 'message'; text: string }
  | { at: number; type: 'damage'; target: 'player' | 'enemy'; amount: number; sfx: SfxKind }
  | { at: number; type: 'heal'; stat: 'hp' | 'mp'; amount: number }
  | { at: number; type: 'buff' }
  | { at: number; type: 'sfx'; sfx: SfxKind }
  | { at: number; type: 'end' }
  | { at: number; type: 'finish'; outcome: 'victory' | 'defeat' };

export interface FighterState {
  hp: number;
  maxHp: number;
  atb: number; // 0..1
}

export interface PlayerState extends FighterState {
  mp: number;
  maxMp: number;
  limit: number; // 0..1
  buffed: boolean;
  itemUses: Record<string, number>;
}

export interface MenuState {
  open: MenuId;
  cursor: number;
}

export interface BattleState {
  phase: BattlePhase;
  boss: Boss;
  clock: number;
  rng: number;
  player: PlayerState;
  enemy: FighterState & { nextAttack: number };
  menu: MenuState;
  queue: TimedEvent[];
  /** phase to return to after a resolution that interrupted the command menu */
  returnToCommand: boolean;
  message: string;
  floaters: Floater[];
  floaterSeq: number;
  shakeUntil: number; // battlefield shake (player hit)
  enemyFlashUntil: number; // enemy sprite flash (enemy hit)
  lastSfx: { seq: number; kind: SfxKind } | null;
  sfxSeq: number;
}

export type BattleAction =
  | { type: 'TICK'; dt: number }
  | { type: 'MENU_MOVE'; delta: number }
  | { type: 'MENU_SET_CURSOR'; index: number }
  | { type: 'MENU_CONFIRM' }
  | { type: 'MENU_CANCEL' }
  | { type: 'MENU_OPEN'; menu: MenuId };
