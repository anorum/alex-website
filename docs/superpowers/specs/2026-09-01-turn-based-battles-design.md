# Turn-based battles with random encounters

Design spec for rebuilding the RPG mode's combat.
Approved in conversation on 2026-09-01.

## Goal

Replace the active-time battle window with a turn-based system that lives inside the world.
Walking the overworld triggers random encounters, Final Fantasy style, with an obvious switch to turn them off.
Battles gain strategic depth, a two-character party, persistent progression, and proper presentation.

## Non-goals

- No multiplayer, no server, no accounts. Everything persists in the browser.
- No changes to the standard theme. Standard visitors keep downloading zero RPG JavaScript.
- No skill levels or mastery percentages for real-world skills. Game levels are game levels.
- No em dashes in any copy. Game dialog may be dry; it never brags about Alex's real skills.

## Architecture

Battle becomes a fourth mode of the scene island: `walk | dialog | window | battle`.
The `#rpg-battle` section, its backdrop, the back bar, `switchRPGSection`, and the `entered` handoff are deleted.
`RPGContainer.astro` keeps only the overworld section, and the FF7 menu talks to the island through `gotoRPGScene` and a new `rpg:command` event (see Encounters).

The overworld reducer owns the outer state machine and delegates combat to a battle reducer:

```
OverworldState.mode === 'battle'
OverworldState.battle: BattleState | null
```

`TICK` forwards `dt` to the battle reducer while in battle mode.
When the battle reducer reports `phase === 'done'`, the overworld reducer applies the result to the save (EXP, gil, drops, boss flag) and returns to `walk` at the same tile, or fades to the house on defeat.

Modules:

| Module | Responsibility |
| --- | --- |
| `src/data/party.ts` | Alex and Mara: base stats, per-level growth tables, command lists, materia learn levels, limit breaks. |
| `src/data/enemies.ts` | Random-encounter enemies: stats, element weak/resist, sprite id, AI script, EXP and gil, drops, terrain pools. |
| `src/data/bosses.ts` | The four bosses rebuilt for the new engine (replaces `battles.ts`). Phases, AI scripts, achievement match. |
| `src/data/materia.ts` | Every spell and trick: element, power, MP cost, target, status effect, learn level, message line. |
| `src/data/items.ts` | Battle items and shop prices. |
| `src/utils/rpg-save.ts` | The single persisted save object, with load, save, and reset. |
| `src/components/rpg/battle/battleReducer.ts` | Pure turn-based combat reducer (rewritten). |
| `src/components/rpg/battle/turnQueue.ts` | CTB scheduling: time-to-act per combatant, next-eight preview. |
| `src/components/rpg/battle/BattleView.tsx` | Renders a `BattleState` inside `.ow-frame`. |
| `src/components/rpg/overworld/encounters.ts` | Step counter and terrain rolls, pure. |

The existing string-grid sprite helper, the deterministic mulberry32 RNG, the timed event queue for animations, the WebAudio synth, and the Playwright suite conventions all carry over.

## Combat engine

**Turn order.** Every combatant has `speed`.
Each keeps a `nextAct` counter; the lowest acts, then adds `TICK_BASE / speed` (rounded) to its counter.
The turn strip shows the next eight actors computed by simulating the counters forward without mutating state.
Haste halves the cost added after acting, slow doubles it, so the strip visibly reshuffles when a status lands.

**Phases.** `intro`, `select` (a party member is choosing), `target` (picking an enemy or ally), `resolving` (event queue playing), `enemyTurn` (AI decided, queue playing), `victory`, `defeat`, `fled`, `done`.
There are no timers in `select` or `target`. The clock only advances animation queues.

**Commands.** Alex: ATTACK, MATERIA, DEFEND, ITEM, LIMIT.
Mara: BITE, TRICKS (BARK, FETCH, and learned tricks), DEFEND, ITEM, LIMIT.
RUN appears for both in random encounters only and always succeeds.
DEFEND halves incoming damage until that character's next turn and adds a fixed amount to their limit gauge.

**Damage.** `base * variance(0.9 to 1.1) * elementMultiplier * buffs * defend`, minimum 1.
Element multiplier: 2.0 when the target is weak (shows "WEAK!"), 0.5 when it resists ("RESIST"), 0 when it absorbs (heals, "ABSORB").
Elements: fire, ice, lightning, earth, none.

**Statuses.** poison (loses 6% max HP at the start of each of its turns), slow, haste, silence (no MATERIA or TRICKS), attack down, defense down.
Statuses have turn counts and show as badges beside HP.
PATCH cures all statuses. Bosses shrug off slow and silence.

**Limit.** The gauge fills from damage taken and from DEFEND. At full it unlocks LIMIT for that character.
Alex: PLATFORM OMNISLASH, five hits on one target, earth element.
Mara: ZOOMIES, hits every enemy, no element.

**Enemy AI.** Each enemy has an ordered list of rules: `{ when: 'always' | 'hpBelow(0.3)' | 'allyDown' | 'turn(n)' | 'partyHasStatus(x)', do: action, weight }`.
On its turn the first matching rule group is collected and one action is picked by weight with the seeded RNG.
Bosses use the same rule shape with more rules and a phase change at an HP threshold (message, new rules).

**Multi-enemy.** One to three enemies. Targeting cursor moves between living enemies; multi-target materia hits all.
SPAGHETTI SQL HYDRA is three combatants sharing one "body": when all three heads are dead in the same round the boss dies, otherwise a dead head regrows at 40% HP at the start of the hydra's next turn.

## Roster

**Party.** Alex is the caster and tank (higher HP, MP, and materia). Mara is fast and physical (lower HP, higher speed, so she acts more often).
Both level together from the same EXP total.

**Alex materia by level.** SNOWFLAKE STORM (ice, 1), AIRFLOW GALE (lightning, 4), DBT TRANSFORM (attack up, self, 7), TERRAFORM QUAKE (earth, all enemies, 10), SCAN (reveals HP and weakness, 12), HASTE (16), ROLLBACK (heals one ally, 20), RUNBOOK RITUAL (cures statuses on the party, 25).

**Mara tricks by level.** BARK (attack down on one enemy, 25% chance of slow, 1), FETCH (adds a random item to the inventory, 3), GROWL (defense down, 9), LICK (heals one ally, 14), DIG (earth damage, 18).

**Random-encounter enemies.** Twelve with terrain pools:

| Enemy | Terrain | Notes |
| --- | --- | --- |
| FLAKY TEST | grass | weak, 30% dodge |
| NULL POINTER | grass | hard hit, low HP, weak to lightning |
| STALE CACHE | grass | slow, resists ice and lightning, weak to fire |
| OFF BY ONE | grass | always comes in pairs |
| DATA LAKE MONSTER | water edge | high HP, weak to fire, uses SLOW |
| SPAGHETTI CODE | forest | poisons |
| MERGE CONFLICT | forest | pairs that buff each other |
| DEAD LINK | forest | absorbs lightning |
| TIMEOUT | sand | hastes itself, flees after 3 turns |
| CRON GONE WRONG | sand | acts twice per turn, weak to earth |
| RACE CONDITION | sand | random target, high speed |
| PROD INCIDENT | rare, any | triple EXP and gil, drops a PAGER |

Each enemy has an original pixel sprite in the existing string-grid style.

**Bosses.** ON-PREM TITAN (earth attacks, slow, weak to lightning, phase 2 at 50%: RACK QUAKE hits both). SPAGHETTI SQL HYDRA (three heads, see Multi-enemy, weak to fire). LEGACY MONOLITH (counters physical attacks, weak to TERRAFORM QUAKE, phase 2 grants itself defense up). ROGUE AGENT (silences, hastes itself, no weakness, takes double damage from limit breaks).
Boss victory screens keep the real-career achievement rewards from `experience.ts`.
Bosses cannot be run from and remain selectable at the arena gatekeeper; beaten bosses show a checkmark.

## Progression

**Save shape** (`localStorage['rpg-save']`, versioned):

```
{ v: 1, level, exp, gil, inventory: { [itemId]: count }, bossesBeaten: string[],
  encounters: boolean, sound: boolean, seenIntro: boolean }
```

`rpg-battles-won` and `rpg-sound` migrate into it once and are deleted.
`rpg-ow` (position) stays separate because it is session-scoped.

**Levels.** 1 to 99. EXP to next level is `40 * level^1.6` rounded.
Per-level growth tables live in `party.ts`. Starting point: Alex LV 5, HP 320, MP 40, attack 22, speed 8; Mara HP 220, MP 16, attack 18, speed 12.
Level-ups apply after a battle on the results screen with a flash per level.

**Economy.** Random enemies pay EXP and gil from their table; bosses pay 8x an equivalent mob plus the achievement panel.
The Item Shop interior gains a BUY tab (COFFEE 60 gil, RUNBOOK 120, PATCH 90, PAGER 200) beside the existing project "wares".
The shopkeeper dialog offers BROWSE WARES / BUY ITEMS / LEAVE.

**Defeat.** No penalty. Fade to the house with full HP and MP, message "Rolled back to the last known-good deploy."

**Status sheet.** Reads the save: real LV, HP, MP, EXP to next, learned materia in the slots, gil, bosses beaten.
The limit break and equipment names stay as flavor.

## Encounters

`encounters.ts` exports `rollEncounter(state, rng)` called by the overworld reducer after each settled step on the world scene.
Rates per terrain: grass 1 in 14, forest 1 in 9, sand 1 in 20, water-edge grass 1 in 16, roads and door tiles never, interiors never.
A rolled encounter builds a group of one to three enemies from the terrain pool (weights in `enemies.ts`), with a 4% chance of PROD INCIDENT anywhere.
The roll is skipped when `save.encounters` is false.

**Toggle.** One flag, three doors:

1. FF7 MENU entry "ENCOUNTERS: ON" / "OFF" that flips and re-renders.
2. Key `E` on the world map, with the help line reading "E: ENCOUNTERS ON/OFF".
3. Mara's house dialog gains a choice: "Keep watch?" YES turns encounters off ("Mara keeps watch. The fields go quiet."), NO turns them on.

The menu and help line dispatch a `rpg:command` document event `{ command: 'toggle-encounters' }` that the island handles; the island writes the save and mirrors the value onto the menu label.

**First entry.** The first time the save is created, the world shows a one-time dialog: "Wild data roams these fields. Press E if you would rather walk in peace." Sets `seenIntro`.

## Presentation

- **Encounter start:** the frame swirls to black over 500 ms of game clock (a CSS mask animation on `.ow-fade` driven by the reducer's fade value) with the battle-start sting. Reduced motion cuts straight to black.
- **Battle layout inside `.ow-frame`:** enemies on the left third with an idle bob, party on the right with portraits, turn strip across the top (eight slots, portraits, active slot highlighted), message window under the strip, status panel and command window along the bottom in the `.rpgw-*` window style.
- **Feedback:** damage numbers pop and arc, WEAK! / RESIST / ABSORB / MISS callouts, enemy hit flash, death dissolve, party shake on hit, boss intro banner sliding in.
- **Results:** victory fanfare, results window with an EXP bar that fills and flashes on each level gained, gil count, item drops, then the boss achievement panel when relevant. A defeat window with the rollback message.
- Everything animates off the reducer clock so `?rpg-speed` and reduced motion keep working.

## Testing

The repo suite (`tests/e2e.mjs`) gains:

- A seeded random encounter: walk a fixed route at `?rpg-seed=N`, assert the swirl and battle mode start on a known step, win with a scripted command sequence, assert EXP and gil in the save.
- Encounters toggle from all three doors; a walk of 60 steps with encounters off never enters battle.
- Boss fight through the gatekeeper with the new engine; hydra head regrowth; victory achievement panel.
- Turn strip order for a known speed set; haste and slow reshuffle.
- Status sheet shows the real level after a win; shop BUY tab deducts gil.
- Defeat returns to the house with full HP.

Unit-level checks for the reducers (turn queue, damage math, AI rule selection) run in the same file against the imported modules with fixed seeds.
