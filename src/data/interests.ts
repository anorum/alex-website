// Off-the-clock interests. Shared by the standard Off the Clock section
// and the RPG crafts panel. Pure data - no React, no DOM.

export interface Interest {
  title: string;
  description: string;
  /** heroicons-style SVG path for the RPG card icon */
  iconPath: string;
  /** InterestItemRPG color scheme */
  colorScheme: string;
}

export const interests: Interest[] = [
  {
    title: 'Piano',
    description: 'A few years in, taking lessons. Film scores, jazz standards, classical, some Ghibli.',
    iconPath: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3',
    colorScheme: 'blue',
  },
  {
    title: 'Running',
    description: "Mostly to clear my head. Sometimes to train. Always tracking something.",
    iconPath: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
    colorScheme: 'green',
  },
  {
    title: 'Golf',
    description: 'Trying to get better, tracking my misses, and regretting most 3-woods.',
    iconPath: 'M12 3v13m0 0l-4-2m4 2c0 2.21-1.79 4-4 4H8m4-17l6 3-6 3',
    colorScheme: 'yellow',
  },
  {
    title: 'Snowboarding',
    description: 'Winter weekends on the mountain.',
    iconPath: 'M3 21l18-18M7 21l-4-4m14-10l4-4M5 13l6 6m2-14l6 6',
    colorScheme: 'blue',
  },
  {
    title: 'Board games',
    description: 'The shelf keeps growing.',
    iconPath: 'M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z',
    colorScheme: 'purple',
  },
  {
    title: 'Reading',
    description: "Sci-fi, philosophy, and whatever's been on the nightstand too long.",
    iconPath: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    colorScheme: 'purple',
  },
  {
    title: 'Travel',
    description: "12 countries, 30 trips, 10 of them to Japan. See the map.",
    iconPath: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    colorScheme: 'yellow',
  },
  {
    title: 'Mara',
    description: 'A labradoodle. She had a chatbot once.',
    iconPath: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
    colorScheme: 'green',
  },
];
