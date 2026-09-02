// The single persisted RPG save. Read once into reducer state; written by
// the hook whenever state.save changes. Pure apart from the storage calls.

export const SAVE_KEY = 'rpg-save';
const LEGACY_WINS_KEY = 'rpg-battles-won';
const LEGACY_SOUND_KEY = 'rpg-sound';

export interface SaveData {
  v: 1;
  level: number;
  exp: number;
  gil: number;
  inventory: Record<string, number>;
  bossesBeaten: string[];
  encounters: boolean;
  sound: boolean;
  seenIntro: boolean;
}

export function defaultSave(): SaveData {
  return {
    v: 1,
    level: 5,
    exp: 0,
    gil: 0,
    inventory: { coffee: 2, runbook: 1 },
    bossesBeaten: [],
    encounters: true,
    sound: false,
    seenIntro: false,
  };
}

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function loadSave(): SaveData {
  const st = storage();
  if (!st) return defaultSave();
  const base = defaultSave();
  try {
    const raw = st.getItem(SAVE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SaveData>;
      return { ...base, ...parsed, inventory: { ...base.inventory, ...(parsed.inventory ?? {}) }, v: 1 };
    }
  } catch {
    // corrupt: fall through to a fresh save
  }
  // first load: migrate the two legacy flags, if present
  try {
    const wins = st.getItem(LEGACY_WINS_KEY);
    if (wins) base.bossesBeaten = JSON.parse(wins);
    base.sound = st.getItem(LEGACY_SOUND_KEY) === 'on';
    st.removeItem(LEGACY_WINS_KEY);
    st.removeItem(LEGACY_SOUND_KEY);
  } catch {
    // ignore legacy corruption
  }
  writeSave(base);
  return base;
}

export function writeSave(save: SaveData): void {
  const st = storage();
  if (!st) return;
  try {
    st.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    // private mode etc.
  }
}
