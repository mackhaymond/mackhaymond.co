// The PUBLIC half of the launchpad catalog. Everything here is visible to anyone (and lives in a
// public repo). Private tools, admin panels, and internal hostnames go in the KV catalog instead:
// `npm run catalog:pull`, edit catalog.private.json, `npm run catalog:push`.

export interface Entry {
  name: string;
  description: string;
  /** Section heading on /dash, e.g. "Projects", "Tools", "Infra". */
  group: string;
  /** Live URL. Gets a status dot on /dash. */
  url?: string;
  repo?: string;
  /** Short stack labels. */
  tags?: string[];
  /** Set false to skip the status probe (e.g. third-party dashboards). */
  monitor?: boolean;
  /** Show on the public homepage (public entries only). */
  featured?: boolean;
  /** Private repo / private tool. KV entries default to true. */
  private?: boolean;
  /** Local checkout, e.g. "~/code/projects/vlt". Rows with only a path copy it on click. */
  path?: string;
  /** ISO date of last activity (repos). */
  updated?: string;
  /** "sync" for entries owned by scripts/sync-repos.mjs. */
  source?: string;
}

export const PUBLIC_CATALOG: Entry[] = [
  {
    name: "Sector-Relative Valuation",
    description: "Ridge regressions fit within each GICS sector to estimate a fair P/E for every Russell 1000 stock. Refreshed monthly.",
    group: "Projects",
    url: "https://valuation.mackhaymond.co",
    repo: "https://github.com/mackhaymond/sector-relative-valuation",
    tags: ["Python", "Workers"],
    featured: true,
  },
  {
    name: "Bruin Alpha Investment",
    description: "The UCLA investment club I co-founded. I direct its trading committee and built the site, which officers edit in Sanity.",
    group: "Projects",
    url: "https://www.bruinalphainvestment.com",
    repo: "https://github.com/bruinalphainvestment/bai-website",
    tags: ["Next.js", "Sanity"],
    featured: true,
  },
  {
    name: "mack.link",
    description: "I kept hitting free-tier caps on URL shorteners, so I wrote my own. One Cloudflare Worker and a D1 database.",
    group: "Projects",
    url: "https://link.mackhaymond.co",
    repo: "https://github.com/mackhaymond/mack.link",
    tags: ["Workers", "D1", "React"],
    featured: true,
  },
  {
    name: "macblock",
    description: "A Pi-hole that runs on your Mac instead of a separate box. Blocks ads in DNS and leaves VPN split DNS alone.",
    group: "Projects",
    repo: "https://github.com/mackhaymond/macblock",
    tags: ["Python", "macOS"],
    featured: true,
  },
  {
    name: "Awake",
    description: "Menu bar app that shows what's keeping your Mac awake, down to which terminal or tool started each caffeinate.",
    group: "Projects",
    repo: "https://github.com/mackhaymond/Awake",
    tags: ["Swift", "macOS"],
    featured: true,
  },
  {
    name: "resume-template",
    description: "A one-page Typst resume that binary-searches its own spacing at compile time until the page is exactly full.",
    group: "Projects",
    repo: "https://github.com/mackhaymond/resume-template",
    tags: ["Typst"],
    featured: true,
  },
];
