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
  /** Set by the Worker for entries loaded from KV. */
  private?: boolean;
}

export const PUBLIC_CATALOG: Entry[] = [
  {
    name: "Sector-Relative Valuation",
    description: "Per-sector factor regressions across the Russell 1000, flagging names trading rich or cheap to sector fair value.",
    group: "Projects",
    url: "https://valuation.mackhaymond.co",
    repo: "https://github.com/mackhaymond/sector-relative-valuation",
    tags: ["Python", "Workers"],
    featured: true,
  },
  {
    name: "mack.link",
    description: "Personal URL shortener with click analytics, QR codes, and scheduled links, on one Worker and D1.",
    group: "Projects",
    url: "https://link.mackhaymond.co",
    repo: "https://github.com/mackhaymond/mack.link",
    tags: ["Workers", "D1", "React"],
    featured: true,
  },
  {
    name: "Awake",
    description: "macOS menu bar app that shows which process is keeping your Mac awake, plus timed keep-awake holds.",
    group: "Projects",
    repo: "https://github.com/mackhaymond/Awake",
    tags: ["Swift", "macOS"],
    featured: true,
  },
  {
    name: "macblock",
    description: "Local DNS sinkhole for macOS that blocks ads system-wide without breaking split DNS.",
    group: "Projects",
    repo: "https://github.com/mackhaymond/macblock",
    tags: ["Python", "macOS"],
    featured: true,
  },
  {
    name: "Bruin Alpha Investment",
    description: "Site for the UCLA investment club I co-founded.",
    group: "Projects",
    url: "https://www.bruinalphainvestment.com",
    tags: ["Next.js", "Sanity"],
    featured: true,
  },
  {
    name: "resume-template",
    description: "One-page Typst resume that binary-searches its own density to fill the page exactly.",
    group: "Projects",
    repo: "https://github.com/mackhaymond/resume-template",
    tags: ["Typst"],
    featured: true,
  },
];
