export interface WhatIDoItem {
  title: string;
  description: string;
  iconPath: string; // SVG path d attribute
  accentVar: string; // CSS variable name for the accent color
  inverted?: boolean; // render as the accent-filled card in the grid
}

export const whatIDo: WhatIDoItem[] = [
  {
    title: "Platform Engineering",
    description: "Tools people actually want to use. Good docs, clean interfaces, fewer Slack questions.",
    iconPath: "M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    accentVar: "--accent-color",
  },
  {
    title: "Data Architecture",
    description: "Designing systems that are simple to operate, easy to understand, and don't require hand-holding.",
    iconPath: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
    accentVar: "--secondary-color",
  },
  {
    title: "Team Leadership",
    description: "Grew engineers, removed blockers, and kept the right things simple. Led the team, still shipped.",
    iconPath: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
    accentVar: "--tertiary-color",
  },
  {
    title: "AI & Automation",
    description: "Building AI agents, MCP servers, and LLM-powered tools so the platform helps you help yourself.",
    iconPath: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
    accentVar: "--quaternary-color",
    inverted: true,
  },
];
