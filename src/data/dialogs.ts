// Dialog scripts for interior NPCs and objects. Pure data - no React, no DOM.
// The reducer walks these; the island renders them.

import { creed, creedCoda } from './creed';
import { skillCategories } from './skills';

export type WindowId = string;

export type DialogAction =
  | { type: 'openWindow'; window: WindowId }
  | { type: 'battle' }
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
      kind: 'line',
      speaker: 'RECEPTIONIST',
      text: 'Between us: the guild is open to new quests.',
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
    { kind: 'line', text: creedCoda },
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
    { kind: 'line', speaker: 'SENSEI', text: 'Percentages lie. A bar chart never shipped anything.' },
    ...honestItems.map((item) => ({ kind: 'line' as const, speaker: 'SENSEI', text: item + '.' })),
    {
      kind: 'line',
      speaker: 'SENSEI',
      text: 'Everything else on these shelves gets used in production. That is the only level that matters.',
    },
  ],
};

export function getScript(id: string): DialogScript {
  return dialogs[id] ?? [{ kind: 'line', text: '...' }];
}
