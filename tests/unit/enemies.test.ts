import { describe, expect, it } from 'vitest';
import { enemies, enemyById, terrainPools, RARE_ENEMY_ID } from '../../src/data/enemies';
import { bosses, bossById } from '../../src/data/bosses';

describe('enemies', () => {
  it('has twelve enemies with unique ids and sprites', () => {
    expect(enemies.length).toBe(12);
    expect(new Set(enemies.map((e) => e.id)).size).toBe(12);
    for (const e of enemies) expect(e.spriteId).toBeTruthy();
  });
  it('every pool entry resolves and the rare enemy is not in a pool', () => {
    for (const pool of Object.values(terrainPools)) {
      for (const entry of pool) {
        expect(enemyById(entry.id)).toBeTruthy();
        expect(entry.id).not.toBe(RARE_ENEMY_ID);
      }
    }
    expect(enemyById(RARE_ENEMY_ID)?.name).toBe('PROD INCIDENT');
  });
  it('every enemy has at least one always rule', () => {
    for (const e of enemies) expect(e.ai.some((r) => r.when === 'always')).toBe(true);
  });
});

describe('bosses', () => {
  it('has the four bosses in difficulty order', () => {
    expect(bosses.map((b) => b.stars)).toEqual([1, 2, 3, 4]);
    expect(bossById('sql-hydra')?.heads).toBe(3);
    expect(bossById('legacy-monolith')?.countersPhysical).toBe(true);
    expect(bossById('rogue-agent')?.limitWeak).toBe(true);
  });
});
