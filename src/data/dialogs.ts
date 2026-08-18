// Dialog scripts for interior NPCs and objects. Pure data - no React, no DOM.
// The reducer walks these; the island renders them.

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
};

export function getScript(id: string): DialogScript {
  return dialogs[id] ?? [{ kind: 'line', text: '...' }];
}
