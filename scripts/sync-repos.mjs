#!/usr/bin/env node
// Catalogs every repo: GitHub (personal + orgs) and every git repo on this machine.
// Rewrites only the entries it owns ("source": "sync") in catalog.private.json, leaving
// hand-written entries alone. Run via `npm run catalog:sync` (pulls KV first, pushes after).

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, join } from "node:path";

const HOME = homedir();
const FILE = "catalog.private.json";
const OWNER = "mackhaymond";
const STALE_DAYS = 365;

// Dot-directories are skipped (plugins, caches, tool state) except these.
const DOT_ALLOW = [".config/nvim", ".local/share/chezmoi", ".cookiecutters"];
const SKIP = new Set(["node_modules"]);
const HOME_SKIP = new Set(["Library", "Applications", "Movies", "Music", "Pictures", "go"]); // ~/go is GOPATH
const MAX_DEPTH = 4;

// Class assignments, labs, and tutorials.
const COURSEWORK = /^(cs\d|cs-?\d|.*-cs3\d|brain-dead|apcsp|csa$|datalab|lab_\d|phys|math\d|ECON|solow|in_class|.*lab(-handout)?$|lab_\d|m3(_|$)|.*koans|.*_tut$|.*tutorial|.*getting-started|rsa$|vigenere|word-arranger|arrays-cs|major-analysis|sof_ma|.*cheatsheet|.*midterm|.*final)/i;

const sh = (cmd, args, opts = {}) => {
  try {
    return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], ...opts }).trim();
  } catch {
    return "";
  }
};

// ---------------------------------------------------------------- GitHub

function githubRepos() {
  const owners = [OWNER, ...sh("gh", ["api", "user/orgs", "--jq", ".[].login"]).split("\n").filter(Boolean)];
  const fields = "name,nameWithOwner,description,visibility,url,pushedAt,isArchived,isFork,primaryLanguage,homepageUrl";
  return owners.flatMap((o) => JSON.parse(sh("gh", ["repo", "list", o, "--limit", "500", "--json", fields]) || "[]"));
}

// ---------------------------------------------------------------- local

function findRepos(dir, depth = 0, rel = "") {
  if (depth > MAX_DEPTH) return [];
  if (existsSync(join(dir, ".git")) && statSync(join(dir, ".git")).isDirectory()) return [dir];
  let names;
  try {
    names = readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  return names
    .filter((d) => d.isDirectory() && !d.isSymbolicLink() && !SKIP.has(d.name) && !(depth === 0 && HOME_SKIP.has(d.name)))
    .filter((d) => {
      const r = rel ? `${rel}/${d.name}` : d.name;
      if (!r.split("/").some((p) => p.startsWith("."))) return true;
      return DOT_ALLOW.some((a) => a === r || a.startsWith(r + "/") || r.startsWith(a + "/"));
    })
    .flatMap((d) => findRepos(join(dir, d.name), depth + 1, rel ? `${rel}/${d.name}` : d.name));
}

/** "owner/name" from any GitHub remote URL form. */
function ghSlug(remote) {
  const m = remote.match(/github\.com[:/]([^/]+\/[^/]+?)(\.git)?$/i);
  return m ? m[1].toLowerCase() : null;
}

function localDescription(dir) {
  try {
    const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
    if (pkg.description) return pkg.description;
  } catch {}
  for (const f of ["README.md", "readme.md", "README", "README.txt"]) {
    try {
      const line = readFileSync(join(dir, f), "utf8")
        .split("\n")
        .map((l) => l.replace(/<[^>]+>/g, "").replace(/\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)|!\[[^\]]*\]\([^)]*\)/g, "").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/[*_`>#]/g, "").trim())
        .find((l) => l.length > 25 && !/^(=|-|\||!|badge|build|license|owner:|install|run |to run|first,|this is a next\.js|open http|to start your|your goal is|due:)|create-next-app|bootstrapped|localhost|that part is up to|start editing|auto-updates|playwright is configured/i.test(l));
      if (line) return line.length > 140 ? line.slice(0, 137) + "…" : line;
    } catch {}
  }
  return "";
}

function localRepo(dir) {
  const remote = sh("git", ["-C", dir, "remote", "get-url", "origin"]);
  return {
    dir,
    path: dir.replace(HOME, "~"),
    remote,
    slug: remote ? ghSlug(remote) : null,
    last: sh("git", ["-C", dir, "log", "-1", "--format=%cI"]),
    description: localDescription(dir),
  };
}

// ---------------------------------------------------------------- merge

const daysAgo = (iso) => (iso ? (Date.now() - Date.parse(iso)) / 864e5 : Infinity);
const month = (iso) => (iso ? iso.slice(0, 7) : "");
const latest = (...isos) => isos.filter(Boolean).sort().at(-1) ?? "";

// Throwaway language/tool experiments.
const SCRATCH = /test$|^test|tut$|^scratch|^hello$|^target$|^go$|^processing$|^project$|^proj_\d|^app$|^general$|^starbank$|KMP$/i;

function group(name, last, archived) {
  if (COURSEWORK.test(name)) return "Coursework";
  if (SCRATCH.test(name)) return "Scratch";
  if (archived || daysAgo(last) > STALE_DAYS) return "Archive";
  return null;
}

const gh = githubRepos();
const locals = findRepos(HOME).map(localRepo);
const localBySlug = new Map(locals.filter((l) => l.slug).map((l) => [l.slug, l]));
const mine = new Set(gh.map((r) => r.nameWithOwner.toLowerCase()));

const entries = [];

for (const r of gh) {
  const local = localBySlug.get(r.nameWithOwner.toLowerCase());
  const last = latest(r.pushedAt, local?.last);
  const tags = [r.primaryLanguage?.name, r.visibility.toLowerCase(), r.isFork && "fork", r.isArchived && "archived", local ? "local" : "remote only", month(last)].filter(Boolean);
  entries.push({
    name: r.nameWithOwner.startsWith(OWNER + "/") ? r.name : r.nameWithOwner,
    description: r.description || local?.description || "",
    group: group(r.name, last, r.isArchived) ?? (r.isFork ? "Forks" : "Repos"),
    repo: r.url,
    ...(local && { path: local.path }),
    tags,
    private: r.visibility !== "PUBLIC",
    updated: last,
    source: "sync",
  });
}

for (const l of locals) {
  if (l.slug && mine.has(l.slug)) continue; // already listed from GitHub
  const name = basename(l.dir);
  const remoteKind = !l.remote ? "no remote" : l.slug ? "clone" : "other remote";
  entries.push({
    name,
    description: l.description,
    group: group(name, l.last, false) ?? (l.slug ? "Clones" : "Local"),
    ...(l.slug && { repo: `https://github.com/${l.slug}` }),
    path: l.path,
    tags: ["local", remoteKind, month(l.last)].filter(Boolean),
    private: true,
    updated: l.last,
    source: "sync",
  });
}

// Project folders that aren't git repos: immediate children of the project roots that hold no
// repo themselves. Near-empty scratch dirs are skipped.
const FOLDER_ROOTS = [join(HOME, "code"), join(HOME, "code", "projects")];
for (const root of FOLDER_ROOTS) {
  for (const d of readdirSync(root, { withFileTypes: true })) {
    const dir = join(root, d.name);
    if (!d.isDirectory() || d.name.startsWith(".") || FOLDER_ROOTS.includes(dir)) continue;
    if (locals.some((l) => l.dir === dir || l.dir.startsWith(dir + "/"))) continue;
    const kids = readdirSync(dir).filter((n) => !n.startsWith("."));
    if (kids.length < 2) continue;
    // No reliable date: mtimes were reset when these folders were bulk-copied.
    entries.push({
      name: d.name,
      description: localDescription(dir),
      group: COURSEWORK.test(d.name) ? "Coursework" : SCRATCH.test(d.name) ? "Scratch" : "Local",
      path: dir.replace(HOME, "~"),
      tags: ["local", "folder", "not a repo"],
      private: true,
      updated: "",
      source: "sync",
    });
  }
}

entries.sort((a, b) => (b.updated || "").localeCompare(a.updated || ""));

const existing = existsSync(FILE) ? JSON.parse(readFileSync(FILE, "utf8")) : [];
const manual = existing.filter((e) => e.source !== "sync");
// A hand-written entry with the same path or repo wins over the synced one.
const claimed = new Set(manual.flatMap((e) => [e.path, e.repo]).filter(Boolean));
const synced = entries.filter((e) => !claimed.has(e.path) && !claimed.has(e.repo));
const out = [...manual, ...synced];
writeFileSync(FILE, "[\n" + out.map((e) => "  " + JSON.stringify(e)).join(",\n") + "\n]\n");

const counts = Object.entries(synced.reduce((m, e) => ((m[e.group] = (m[e.group] ?? 0) + 1), m), {}));
console.log(`${gh.length} GitHub repos, ${locals.length} local repos -> ${synced.length} synced entries (+${manual.length} manual)`);
console.log(counts.map(([g, n]) => `  ${g}: ${n}`).join("\n"));
