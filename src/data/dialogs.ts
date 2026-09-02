// Dialog scripts for interior NPCs and objects. Pure data - no React, no DOM.
// The reducer walks these; the island renders them.

import { creed } from './creed';
import { skillCategories } from './skills';
import { travelLocations, travelStats } from './travel';

export type DialogAction =
  /** `window` is a window id resolved by OverworldIsland, e.g. "shop" or "materia:Core" */
  | { type: 'openWindow'; window: string }
  /** start a boss battle in the frame */
  | { type: 'battle'; bossId: string }
  /** flip the random-encounter flag, then continue with another script */
  | { type: 'setEncounters'; on: boolean; then: string }
  | { type: 'end' };

export type DialogStep =
  | { kind: 'line'; speaker?: string; text: string }
  | {
      kind: 'choice';
      prompt: string;
      options: { label: string; action: DialogAction }[];
    }
  | { kind: 'action'; action: DialogAction };

export type DialogScript = DialogStep[];

const honestItems =
  skillCategories.find((c) => c.label === 'Honest levels')?.items ?? [];

const japanVisits = travelLocations.find((l) => l.country === 'Japan')?.visits ?? 0;

export const dialogs: Record<string, DialogScript> = {
  'house-mirror': [
    { kind: 'line', text: 'A familiar face looks back. Still level 99, somehow.' },
    { kind: 'action', action: { type: 'openWindow', window: 'status' } },
  ],

  'house-desk': [
    { kind: 'line', text: 'A tidy desk. Sheet music on a stand, a MIDI keyboard, two monitors.' },
    {
      kind: 'line',
      text: 'The notebook on top reads: fourteen years of data platforms. Simple systems where the right way is the easy way.',
    },
    { kind: 'line', text: 'The last page just says: build the paved road, then get out of the way.' },
  ],

  'house-mara': [
    { kind: 'line', speaker: 'MARA', text: 'Mara tilts her head at you.' },
    { kind: 'line', speaker: 'MARA', text: 'Woof.' },
    {
      kind: 'line',
      text: 'She had a chatbot once. It cannot be repaired. She seems fine about it.',
    },
    {
      kind: 'choice',
      prompt: 'Have Mara keep watch? Wild data leaves the fields alone while she is on duty.',
      options: [
        { label: 'KEEP WATCH', action: { type: 'setEncounters', on: false, then: 'mara-watch-on' } },
        { label: 'LET HER SLEEP', action: { type: 'setEncounters', on: true, then: 'mara-watch-off' } },
      ],
    },
  ],

  'mara-watch-on': [
    { kind: 'line', speaker: 'MARA', text: 'Mara keeps watch. The fields go quiet.' },
  ],

  'mara-watch-off': [
    { kind: 'line', speaker: 'MARA', text: 'Mara goes back to sleep. Wild data roams again.' },
  ],

  'intro-encounters': [
    { kind: 'line', text: 'Wild data roams these fields.' },
    { kind: 'line', text: 'Press E if you would rather walk in peace. Mara can also keep watch at the house.' },
  ],

  'hall-board': [
    { kind: 'line', text: 'Closed contracts, pinned neatly. Someone has finished a lot of quests.' },
    { kind: 'action', action: { type: 'openWindow', window: 'quests' } },
  ],

  'hall-receptionist': [
    { kind: 'line', speaker: 'RECEPTIONIST', text: 'Welcome to the guild hall.' },
    {
      kind: 'line',
      speaker: 'RECEPTIONIST',
      text: 'The ledger is public. Every contract closed, every reward accounted for.',
    },
    {
      kind: 'choice',
      prompt: 'See the quest log?',
      options: [
        { label: 'SHOW ME', action: { type: 'openWindow', window: 'quests' } },
        { label: 'LATER', action: { type: 'end' } },
      ],
    },
  ],

  'tower-lectern': [
    { kind: 'line', text: 'A heavy book lies open. The pages are worn at the same five places.' },
    ...creed.map((line) => ({ kind: 'line' as const, speaker: "ENGINEER'S CREED", text: line })),
  ],

  'tower-orb': [
    { kind: 'line', text: 'The orb hums with practiced commands.' },
    { kind: 'action', action: { type: 'openWindow', window: 'abilities' } },
  ],

  'dojo-shelf-core': [
    { kind: 'line', text: 'The core shelf. Worn smooth from daily use.' },
    { kind: 'action', action: { type: 'openWindow', window: 'materia:Core' } },
  ],

  'dojo-shelf-also': [
    { kind: 'line', text: 'Spares and specials. Reached for often enough.' },
    { kind: 'action', action: { type: 'openWindow', window: 'materia:Also' } },
  ],

  'dojo-shelf-ai': [
    { kind: 'line', text: 'Newer orbs. Still warm.' },
    { kind: 'action', action: { type: 'openWindow', window: 'materia:AI' } },
  ],

  'dojo-shelf-honest': [
    { kind: 'line', text: 'A small shelf, honestly labeled.' },
    { kind: 'action', action: { type: 'openWindow', window: 'materia:Honest levels' } },
  ],

  'dojo-sensei': [
    { kind: 'line', speaker: 'SENSEI', text: 'You want numbers? Mastery percentages? Little bars?' },
    { kind: 'line', speaker: 'SENSEI', text: 'Percentages lie.' },
    ...honestItems.map((item) => ({ kind: 'line' as const, speaker: 'SENSEI', text: item + '.' })),
    {
      kind: 'line',
      speaker: 'SENSEI',
      text: 'Everything else on these shelves gets used in production.',
    },
  ],

  'shop-keeper': [
    {
      kind: 'line',
      speaker: 'SHOPKEEPER',
      text: 'Welcome, traveler. Everything here was forged after hours.',
    },
    {
      kind: 'choice',
      prompt: 'What are you after?',
      options: [
        { label: 'BROWSE WARES', action: { type: 'openWindow', window: 'shop' } },
        { label: 'BUY ITEMS', action: { type: 'openWindow', window: 'shop:buy' } },
        { label: 'JUST LOOKING', action: { type: 'end' } },
      ],
    },
  ],

  'shop-crate': [
    {
      kind: 'line',
      text: 'Crates of spare parts and old project boxes. Something in here still works.',
    },
  ],

  'camp-fire': [
    { kind: 'line', text: 'The fire crackles. Off the clock at last.' },
    { kind: 'action', action: { type: 'openWindow', window: 'crafts' } },
  ],

  'camp-log': [
    {
      kind: 'line',
      text: 'A good sitting log, worn smooth. Sheet music and a paperback left on one end.',
    },
  ],

  'harbor-captain': [
    {
      kind: 'line',
      speaker: 'CAPTAIN',
      text: `${travelStats.totalCountries} countries. ${travelStats.totalVisits} voyages. The log does not lie.`,
    },
    {
      kind: 'line',
      speaker: 'CAPTAIN',
      text: `Japan, ${japanVisits} times. I stopped asking why. The answer is always the trains and the food.`,
    },
  ],

  'harbor-chart': [
    { kind: 'line', text: 'A chart of every voyage, inked by hand.' },
    { kind: 'action', action: { type: 'openWindow', window: 'travel-map' } },
  ],

  'arena-gatekeeper': [
    {
      kind: 'line',
      speaker: 'GATEKEEPER',
      text: 'Four bosses wait inside. Each one guards a real chapter of the career.',
    },
    { kind: 'line', speaker: 'GATEKEEPER', text: 'Win, and the record of what was actually shipped is yours.' },
    {
      kind: 'choice',
      prompt: 'Which one?',
      options: [
        { label: 'ON-PREM TITAN', action: { type: 'battle', bossId: 'on-prem-titan' } },
        { label: 'SPAGHETTI SQL HYDRA', action: { type: 'battle', bossId: 'sql-hydra' } },
        { label: 'LEGACY MONOLITH', action: { type: 'battle', bossId: 'legacy-monolith' } },
        { label: 'ROGUE AGENT', action: { type: 'battle', bossId: 'rogue-agent' } },
        { label: 'NOT YET', action: { type: 'end' } },
      ],
    },
  ],
};

export function getScript(id: string): DialogScript {
  return dialogs[id] ?? [{ kind: 'line', text: '...' }];
}
