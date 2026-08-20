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
  links: { live?: string; repo?: string };
  status: ProjectStatus;
  /** How this project appears in the RPG item shop */
  rpg: { itemName: string; itemDescription: string };
}

export const projects: Project[] = [
  {
    id: 'pdx-train',
    name: 'PDX Train',
    tagline: 'Is the train blocking the intersection?',
    description:
      'Portland freight trains park across SE crossings, so this tells me before I leave the house. ODOT camera frames run through a Kafka and Iceberg pipeline on my k3s cluster, with Postgres and Cloudflare serving the live board.',
    highlights: [
      'Watching 6 cameras every 30 seconds since Aug 2026',
      'Per-camera trained image classifier in production',
      'ODOT never archives its footage, so this history exists nowhere else',
    ],
    tech: ['Kafka', 'Iceberg', 'Postgres', 'k3s'],
    links: {
      live: 'https://pdxtrain.alexnorum.com',
      repo: 'https://github.com/anorum/trainspotter',
    },
    status: 'live',
    rpg: {
      itemName: 'PDX TRAIN SCOPE',
      itemDescription:
        'Sees through steel. Reveals whether a freight train blocks the path ahead before you set out.',
    },
  },
  {
    id: 'sightread',
    name: 'Sightread',
    tagline: 'Sight-reading practice for piano with a MIDI keyboard.',
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
    tagline: 'Not a showpiece. A place I break things.',
    description:
      'A k3s cluster (nodes swagman-1 and swagman-2) plus a Raspberry Pi 5 running Home Assistant. Tailscale and Cloudflare tunnels for access, Strimzi Kafka, MinIO, and Iceberg for the data side. It runs PDX Train around the clock and whatever gets built next.',
    highlights: [
      'GitOps deploys via ArgoCD, everything in version control',
      'Home Assistant with Zigbee and Lutron Caseta',
      'Runs the PDX Train pipeline around the clock',
    ],
    tech: ['k3s', 'ArgoCD', 'Strimzi', 'MinIO', 'Tailscale'],
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
    tagline: 'A chatbot of my dog.',
    description:
      'A chatbot version of my labradoodle Mara that lived on an earlier version of this website. Retired, but preserved for the record.',
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
