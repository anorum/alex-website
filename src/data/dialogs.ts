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
    { kind: 'line', text: 'A mirror. The reflection looks about right.' },
    { kind: 'action', action: { type: 'openWindow', window: 'status' } },
  ],

  'house-desk': [
    { kind: 'line', text: 'A tidy desk. Sheet music on a stand, a MIDI keyboard, two monitors.' },
    {
      kind: 'line',
      text: 'The notebook on top reads: fourteen years of data platforms. Simple systems where the right way is the easy way.',
    },
    { kind: 'line', text: 'The last page repeats one line: build the paved road, then get out of the way.' },
  ],

  'house-mara': [
    { kind: 'line', speaker: 'MARA', text: 'Mara tilts her head at you.' },
    { kind: 'line', speaker: 'MARA', text: 'Woof.' },
    {
      kind: 'line',
      text: 'She had a chatbot once. It does not run anymore. She does not seem to mind.',
    },
    {
      kind: 'choice',
      prompt: 'Have Mara keep watch? Random battles stop while she is on duty.',
      options: [
        { label: 'KEEP WATCH', action: { type: 'setEncounters', on: false, then: 'mara-watch-on' } },
        { label: 'LET HER SLEEP', action: { type: 'setEncounters', on: true, then: 'mara-watch-off' } },
      ],
    },
  ],

  'mara-watch-on': [
    { kind: 'line', speaker: 'MARA', text: 'Mara keeps watch. Random battles are off.' },
  ],

  'mara-watch-off': [
    { kind: 'line', speaker: 'MARA', text: 'Mara goes back to sleep. Random battles are back on.' },
  ],

  'intro-encounters': [
    { kind: 'line', text: 'There are random battles out here.' },
    { kind: 'line', text: 'Press E to turn them off, or ask Mara at the house to keep watch.' },
  ],

  'hall-board': [
    { kind: 'line', text: 'A board of closed contracts. Every job so far, in order.' },
    { kind: 'action', action: { type: 'openWindow', window: 'quests' } },
  ],

  'hall-receptionist': [
    { kind: 'line', speaker: 'RECEPTIONIST', text: 'Welcome to the guild hall.' },
    {
      kind: 'line',
      speaker: 'RECEPTIONIST',
      text: 'The ledger is public. Each contract lists what came out of it.',
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
    { kind: 'line', text: 'A heavy book, open. Five rules, one per page.' },
    ...creed.map((line) => ({ kind: 'line' as const, speaker: "ENGINEER'S CREED", text: line })),
  ],

  'tower-orb': [
    { kind: 'line', text: 'An orb. Touch it to see the command list.' },
    { kind: 'action', action: { type: 'openWindow', window: 'abilities' } },
  ],

  'dojo-shelf-core': [
    { kind: 'line', text: 'The core shelf. The tools used most days.' },
    { kind: 'action', action: { type: 'openWindow', window: 'materia:Core' } },
  ],

  'dojo-shelf-also': [
    { kind: 'line', text: 'The second shelf. Used less often, still in the bag.' },
    { kind: 'action', action: { type: 'openWindow', window: 'materia:Also' } },
  ],

  'dojo-shelf-ai': [
    { kind: 'line', text: 'The newer shelf. AI tooling.' },
    { kind: 'action', action: { type: 'openWindow', window: 'materia:AI' } },
  ],

  'dojo-shelf-honest': [
    { kind: 'line', text: 'A small shelf with an honest label.' },
    { kind: 'action', action: { type: 'openWindow', window: 'materia:Honest levels' } },
  ],

  'dojo-sensei': [
    { kind: 'line', speaker: 'SENSEI', text: 'No skill levels here.' },
    { kind: 'line', speaker: 'SENSEI', text: 'Percentages on a resume are made up.' },
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
      text: 'Welcome. Everything here was built on nights and weekends.',
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
      text: 'Crates of spare parts and old project boxes.',
    },
  ],

  'camp-fire': [
    { kind: 'line', text: 'A campfire. This is the off-the-clock part.' },
    { kind: 'action', action: { type: 'openWindow', window: 'crafts' } },
  ],

  'camp-log': [
    {
      kind: 'line',
      text: 'A log for sitting. Sheet music and a paperback on one end.',
    },
  ],

  'harbor-captain': [
    {
      kind: 'line',
      speaker: 'CAPTAIN',
      text: `${travelStats.totalCountries} countries and ${travelStats.totalVisits} trips in the log.`,
    },
    {
      kind: 'line',
      speaker: 'CAPTAIN',
      text: `Japan ${japanVisits} times. Mostly for the trains and the food.`,
    },
  ],

  'harbor-chart': [
    { kind: 'line', text: 'A chart of every trip.' },
    { kind: 'action', action: { type: 'openWindow', window: 'travel-map' } },
  ],

  'arena-gatekeeper': [
    {
      kind: 'line',
      speaker: 'GATEKEEPER',
      text: 'Four bosses inside. Each one is tied to a real job.',
    },
    { kind: 'line', speaker: 'GATEKEEPER', text: 'Beat one and you get the list of what shipped there.' },
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
