// Side projects shown in the Projects section (standard theme) and the
// RPG item shop. Pure data - no React, no DOM.

export type ProjectStatus = 'live' | 'active' | 'stable' | 'deprecated';

export interface Project {
  id: string;
  name: string;
  tagline: string;
  description: string;
  highlights: string[];
  tech: string[];
  links: { live?: string; repo: string };
  status: ProjectStatus;
  /** How this project appears in the RPG item shop */
  rpg: { itemName: string; itemDescription: string };
}

export const projects: Project[] = [
  {
    id: 'blockade',
    name: 'Blockade',
    tagline: 'Is a freight train blocking the intersection?',
    description:
      'Detects freight trains blocking street crossings in SE Portland using public traffic cameras, and alerts before you leave the house. The state never archives its camera images, so the history this project builds exists nowhere else.',
    highlights: [
      'Watching 6 cameras every 30 seconds since Aug 2026',
      'Per-camera trained image classifier in production',
      'Full history of every blockage stored in Postgres',
    ],
    tech: ['Python', 'Kafka', 'Postgres', 'k3s'],
    links: { repo: 'https://github.com/anorum/trainspotter' },
    status: 'live',
    rpg: {
      itemName: 'BLOCKADE SCOPE',
      itemDescription:
        'Sees through steel. Reveals whether a freight train blocks the path ahead before you set out.',
    },
  },
  {
    id: 'sightread',
    name: 'Sightread',
    tagline: 'Piano sight-reading practice that listens back.',
    description:
      'Generates random but musically sensible sight-reading exercises for piano, from easy to brutal. Plug in a MIDI keyboard and it checks what you actually played, note by note.',
    highlights: [
      'Real sheet music notation rendered in the browser',
      'Live feedback from a real MIDI keyboard',
      'Same seed always generates the same exercise',
    ],
    tech: ['Astro', 'React', 'VexFlow', 'Web MIDI'],
    links: {
      live: 'https://sightread.alexnorum.com',
      repo: 'https://github.com/anorum/sight-reader',
    },
    status: 'live',
    rpg: {
      itemName: 'SIGHTREAD MATERIA',
      itemDescription:
        'Grants the bearer the ability to read ancient musical scripts at first sight. Judges every note played.',
    },
  },
  {
    id: 'smo-save-editor',
    name: 'SMO Save Editor',
    tagline: 'Rebuilt a lost Super Mario Odyssey save.',
    description:
      'My nephew lost his Super Mario Odyssey save, so I built a save editor to rebuild his moon collection. It grew into a complete editor: every moon in every kingdom, viewable and editable by its real name.',
    highlights: [
      'Every moon editable by its in-game name, with search',
      'Edits patch only the bytes it understands, the rest is untouched',
      'Repairs saves where stored counts have drifted from reality',
    ],
    tech: ['Python', 'binary formats'],
    links: { repo: 'https://github.com/anorum/mario_odyssey_save_editor' },
    status: 'stable',
    rpg: {
      itemName: 'ODYSSEY PATCHER',
      itemDescription:
        'Restores lost memories. Once used to return 500 power moons to a young adventurer.',
    },
  },
  {
    id: 'homelab',
    name: 'Homelab',
    tagline: 'The cluster in the closet that runs it all.',
    description:
      'A Kubernetes cluster running at home that hosts Blockade, app deploys, and whatever gets built next. Everything is declared in git and deploys itself.',
    highlights: [
      'k3s cluster with GitOps deploys via ArgoCD',
      'Runs the Blockade pipeline around the clock',
      'Every app and config lives in version control',
    ],
    tech: ['k3s', 'ArgoCD', 'Terraform'],
    links: { repo: 'https://github.com/anorum/homelab' },
    status: 'active',
    rpg: {
      itemName: 'HOMELAB CORE',
      itemDescription:
        'A humming power source hidden in a closet. Keeps every other artifact in this shop alive.',
    },
  },
  {
    id: 'mara-bot',
    name: 'mara-bot',
    tagline: 'A chatbot of my dog. She had opinions.',
    description:
      'A chatbot version of my dog Mara that lived on an earlier version of this website. Retired, but preserved for the record.',
    highlights: [],
    tech: ['Python'],
    links: { repo: 'https://github.com/anorum/mara-ai' },
    status: 'deprecated',
    rpg: {
      itemName: 'MARA-BOT (BROKEN)',
      itemDescription:
        'A faithful companion construct, now dormant. Still remembers a few good tricks. Cannot be repaired.',
    },
  },
];
