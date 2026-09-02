import { describe, expect, it } from 'vitest';
import { party, statsAt, expForLevel, levelFromExp, learnedMateria } from '../../src/data/party';
import { materia, materiaById } from '../../src/data/materia';
import { items, itemById } from '../../src/data/items';

describe('party', () => {
  it('has alex and mara', () => {
    expect(party.map((p) => p.id)).toEqual(['alex', 'mara']);
  });

  it('stats grow with level and mara is faster', () => {
    const [alex, mara] = party;
    expect(statsAt(alex, 5)).toEqual({ hp: 320, mp: 40, atk: 22, def: 12, spd: 8 });
    expect(statsAt(alex, 6).hp).toBeGreaterThan(320);
    expect(statsAt(mara, 5).spd).toBeGreaterThan(statsAt(alex, 5).spd);
  });

  it('exp curve is monotonic and levelFromExp inverts it', () => {
    expect(expForLevel(1)).toBe(0);
    expect(expForLevel(6)).toBeGreaterThan(expForLevel(5));
    expect(levelFromExp(expForLevel(9))).toBe(9);
    expect(levelFromExp(expForLevel(9) - 1)).toBe(8);
    expect(levelFromExp(1e9)).toBe(99);
  });

  it('learnsets unlock by level', () => {
    const [alex, mara] = party;
    expect(learnedMateria(alex, 5).map((m) => m.id)).toEqual(['snowflake-storm', 'airflow-gale']);
    expect(learnedMateria(alex, 10).map((m) => m.id)).toContain('terraform-quake');
    expect(learnedMateria(mara, 1).map((m) => m.id)).toEqual(['bark']);
  });
});

describe('materia and items', () => {
  it('every learnset entry resolves', () => {
    for (const m of party) for (const l of m.learnset) expect(materiaById(l.materiaId)).toBeTruthy();
  });
  it('items have prices', () => {
    expect(items.length).toBe(4);
    expect(itemById('pager')?.price).toBe(200);
  });
  it('materia have owners and lines', () => {
    for (const m of materia) {
      expect(['alex', 'mara']).toContain(m.owner);
      expect(m.line).toMatch(/[A-Z]/);
    }
  });
});
