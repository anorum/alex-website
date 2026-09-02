// Flavor for the RPG status screen: equipment, limit break, location.
// Level, HP, MP, and EXP come from the save and party growth tables.
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
      'Five hits on one target. Earth element. Fills from damage taken or from defending.',
  },
  location: 'PORTLAND',
  party: 'MARA (LABRADOODLE)',
  contact: { label: 'SEND MESSAGE', href: 'https://www.linkedin.com/in/alex-norum/' },
};
