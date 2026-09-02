// The joke character sheet for the RPG status screen. The numbers are a
// game gag on purpose; real career facts live in experience.ts.
// Pure data - no React, no DOM.

export interface MateriaSlot {
  color: 'green' | 'yellow' | 'red' | 'blue' | 'purple';
}

export interface EquipmentSlot {
  slot: string;
  name: string;
  materia: MateriaSlot[];
}

export const character = {
  name: 'ALEX',
  charClass: 'DATA PLATFORM ENGINEER',
  level: 99,
  hp: { current: 9999, max: 9999 },
  mp: { current: 999, max: 999 },
  attributes: [
    { label: 'STR', value: 95 },
    { label: 'VIT', value: 80 },
    { label: 'MAG', value: 99 },
    { label: 'SPR', value: 90 },
    { label: 'DEX', value: 85 },
    { label: 'LCK', value: 70 },
  ],
  limit: { level: 4, label: 'LV.4' },
  exp: 9999999,
  equipment: [
    {
      slot: 'WEAPON',
      name: 'TERRAFORM ENGINE',
      materia: [{ color: 'blue' }, { color: 'red' }, { color: 'yellow' }],
    },
    {
      slot: 'ARMOR',
      name: 'KUBERNETES CLUSTER',
      materia: [{ color: 'blue' }, { color: 'purple' }],
    },
    {
      slot: 'ACCESSORY',
      name: 'SNOWFLAKE CRYSTAL',
      materia: [{ color: 'green' }],
    },
  ] as EquipmentSlot[],
  limitBreak: {
    name: 'PLATFORM OMNISLASH',
    description:
      'Five hits in one turn: closes the access tickets, paves the road, kills the brittle cron, cuts the four-hour job to twenty minutes, and leaves a runbook behind.',
  },
  location: 'PORTLAND',
  party: 'MARA (LABRADOODLE)',
  contact: { label: 'SEND MESSAGE', href: 'https://www.linkedin.com/in/alex-norum/' },
};
