import { describe, expect, it } from 'vitest';
import { terrainAt, rollEncounter } from '../../src/components/rpg/overworld/encounters';
import { worldLocations } from '../../src/data/overworld';

describe('encounters', () => {
  it('classifies terrain', () => {
    expect(terrainAt(11, 5)).toBe('grass'); // spawn
    expect(terrainAt(14, 3)).toBeNull(); // tree (not walkable)
    expect(terrainAt(7, 13)).toBe('sand');
    expect(terrainAt(4, 1)).toBe('forest'); // grass beside the northern trees
    for (const loc of worldLocations) expect(terrainAt(loc.door.x, loc.door.y)).toBeNull(); // door mats are safe
  });
  it('shore is grass next to water', () => {
    expect(terrainAt(1, 8)).toBe('shore');
  });
  it('rolls are seeded and land at roughly the configured rate', () => {
    let rng = 12345;
    let fights = 0;
    for (let i = 0; i < 2000; i++) {
      const r = rollEncounter(rng, 11, 5);
      rng = r.rng;
      if (r.group) fights++;
    }
    expect(fights).toBeGreaterThan(100);
    expect(fights).toBeLessThan(200);
    expect(rollEncounter(12345, 11, 5)).toEqual(rollEncounter(12345, 11, 5));
  });
  it('groups have one to three enemies', () => {
    let rng = 99;
    for (let i = 0; i < 300; i++) {
      const r = rollEncounter(rng, 11, 5);
      rng = r.rng;
      if (!r.group) continue;
      expect(r.group.length).toBeGreaterThanOrEqual(1);
      expect(r.group.length).toBeLessThanOrEqual(3);
    }
  });
});
