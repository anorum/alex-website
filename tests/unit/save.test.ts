import { beforeEach, describe, expect, it } from 'vitest';
import { defaultSave, loadSave, writeSave, SAVE_KEY } from '../../src/utils/rpg-save';

class MemoryStorage {
  private m = new Map<string, string>();
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
}

describe('rpg-save', () => {
  beforeEach(() => {
    (globalThis as { localStorage?: unknown }).localStorage = new MemoryStorage();
  });

  it('returns the default save when nothing is stored', () => {
    const s = loadSave();
    expect(s.v).toBe(1);
    expect(s.level).toBe(5);
    expect(s.encounters).toBe(true);
    expect(s.gil).toBe(0);
  });

  it('round-trips through localStorage', () => {
    const s = { ...defaultSave(), gil: 123, level: 7 };
    writeSave(s);
    expect(loadSave().gil).toBe(123);
    expect(loadSave().level).toBe(7);
  });

  it('migrates the old win list and sound flag, then removes them', () => {
    localStorage.setItem('rpg-battles-won', JSON.stringify(['on-prem-titan']));
    localStorage.setItem('rpg-sound', 'on');
    const s = loadSave();
    expect(s.bossesBeaten).toEqual(['on-prem-titan']);
    expect(s.sound).toBe(true);
    expect(localStorage.getItem('rpg-battles-won')).toBeNull();
    expect(localStorage.getItem(SAVE_KEY)).not.toBeNull();
  });

  it('falls back to defaults on corrupt data', () => {
    localStorage.setItem(SAVE_KEY, '{not json');
    expect(loadSave().level).toBe(5);
  });
});
