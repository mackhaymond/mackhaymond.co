// Server-rendered HTML for both surfaces. Design: Vercel/Geist (tokens lifted from vercel.com's
// live CSS). Everything interpolated into markup goes through esc().

import type { Session } from "./access";
import type { Entry } from "./catalog";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** "link.mackhaymond.co/admin", "github.com/mackhaymond/Awake", or "~/code/projects/corne" */
function host(e: Entry): string {
  if (!e.url && !e.repo) return e.path ?? "";
  const u = new URL(e.url ?? e.repo!);
  return (u.hostname + u.pathname).replace(/\/$/, "");
}
const href = (e: Entry) => e.url ?? e.repo;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const when = (iso?: string) => (iso ? `${MONTHS[+iso.slice(5, 7) - 1]} ${iso.slice(0, 4)}` : "");

// Dashboard section order; unlisted groups go after "Local". Collapsed ones open while searching.
const GROUP_ORDER = ["Tools", "Sites", "Projects", "Admin", "Repos", "Local"];
const COLLAPSED = new Set(["Forks", "Clones", "Scratch", "Coursework", "Archive"]);
const TAIL = ["Forks", "Clones", "Scratch", "Coursework", "Archive"];
const rank = (g: string) => (GROUP_ORDER.includes(g) ? GROUP_ORDER.indexOf(g) : TAIL.includes(g) ? 100 + TAIL.indexOf(g) : 50);

// ---------------------------------------------------------------- shared

const TOKENS = `
@font-face{font-family:"Geist";src:url(/fonts/Geist-Variable.woff2) format("woff2");font-weight:100 900;font-display:swap}
@font-face{font-family:"Geist Mono";src:url(/fonts/GeistMono-Variable.woff2) format("woff2");font-weight:100 900;font-display:swap}
:root{color-scheme:light dark;
--bg-100:#fff;--bg-200:#fafafa;
--gray-100:#f2f2f2;--gray-200:#ebebeb;--gray-500:#c9c9c9;--gray-600:#a8a8a8;--gray-700:#8f8f8f;--gray-900:#4d4d4d;--gray-1000:#171717;
--alpha-100:#0000000d;--alpha-400:#00000014;--alpha-500:#00000036;--alpha-600:#0000003d;
--accent:#0070f7;--ring-c:#0070f7;--green:#28a948;--amber:#ffb200;--red:#fc0035;--amber-bg:#fff6e1;--amber-fg:#a64f00;--red-bg:#ffeef0;--red-fg:#d60020;
--fg:var(--gray-1000);--fg-muted:var(--gray-900);--fg-faint:var(--gray-700);
--border:var(--alpha-400);--border-hover:var(--alpha-500);--hover:var(--alpha-100);
--grid-line:#00000010;--shadow-sm:0 0 0 1px var(--border),0 2px 2px #0000000a;
--ring:0 0 0 2px var(--page),0 0 0 4px var(--ring-c);
--r-sm:6px;--r-md:8px;--r-lg:12px;--r-full:9999px;
--sans:"Geist",ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
--mono:"Geist Mono",ui-monospace,SFMono-Regular,Menlo,monospace;
--ease:cubic-bezier(.2,0,0,1);--swift:cubic-bezier(.175,.885,.32,1.1);--t-fast:120ms;--t:180ms}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){
--bg-100:#0a0a0a;--bg-200:#000;--page:#000;
--gray-100:#1a1a1a;--gray-200:#1f1f1f;--gray-500:#454545;--gray-600:#878787;--gray-700:#8f8f8f;--gray-900:#a0a0a0;--gray-1000:#ededed;
--alpha-100:#ffffff12;--alpha-400:#ffffff24;--alpha-500:#ffffff3d;--alpha-600:#ffffff82;
--accent:#0071f6;--ring-c:#50a8ff;--green:#00ab3e;--red:#f13242;--amber-bg:#291800;--amber-fg:#ff9900;--red-bg:#330a11;--red-fg:#ff5e63;--grid-line:#ffffff0f;--shadow-sm:0 0 0 1px var(--border)}}
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--page);color:var(--fg);font:400 14px/20px var(--sans);-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
a{color:inherit;text-decoration:none}
::selection{background:color-mix(in srgb,var(--accent) 22%,transparent)}
:focus-visible{outline:none;box-shadow:var(--ring);border-radius:var(--r-sm)}
.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.skip{position:absolute;left:16px;top:-48px;z-index:20;padding:8px 12px;background:var(--fg);color:var(--page);border-radius:var(--r-sm);font-weight:500}
.skip:focus{top:12px}
.wrap{margin:0 auto;padding:0 24px}
svg{flex:none}
[hidden]{display:none!important}
.mark{width:24px;height:24px;border-radius:var(--r-sm);background:var(--fg);color:var(--page);display:grid;place-items:center;font:600 10px/1 var(--mono);letter-spacing:.02em}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;height:32px;padding:0 12px;border:0;border-radius:var(--r-sm);background:none;font:500 14px/20px var(--sans);white-space:nowrap;cursor:pointer;transition:background var(--t-fast) var(--ease),color var(--t-fast) var(--ease),box-shadow var(--t-fast) var(--ease),opacity var(--t-fast) var(--ease)}
.btn-lg{height:40px;padding:0 16px}
.btn-primary{background:var(--fg);color:var(--page)}
.btn-primary:hover{opacity:.88}
.btn-secondary{background:var(--bg-100);color:var(--fg);box-shadow:var(--shadow-sm)}
.btn-secondary:hover{background:var(--gray-100)}
.btn-ghost{color:var(--fg-muted)}
.btn-ghost:hover{background:var(--hover);color:var(--fg)}
.btn:focus-visible{box-shadow:var(--ring)}
.mono{font-family:var(--mono);font-size:12px}
@media (max-width:639px){.wrap{padding:0 16px}}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{transition-duration:.01ms!important;animation:none!important}}
`;


const CHEVRON = `<svg class="chev" width="12" height="12" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const EMAIL = "mackhaymond@ucla.edu";

function page(o: { title: string; head?: string; css: string; body: string; pageBg: string }): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(o.title)}</title>
<link rel="preload" href="/fonts/Geist-Variable.woff2" as="font" type="font/woff2" crossorigin>
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)">
${o.head ?? ""}
<style>:root{--page:${o.pageBg}}${TOKENS}${o.css}</style>
</head>
<body>
${o.body}
</body>
</html>`;
}

// ---------------------------------------------------------------- public homepage

// A personal page, not a landing page: one reading column, a label rail on wide screens, plain
// links. Geist and the Vercel neutrals from TOKENS; --faint is darkened from gray-700 so small
// text passes AA.
const HOME_CSS = `
:root{--faint:#666}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){--page:#0a0a0a;--faint:#8f8f8f}}
body{font:400 15px/1.6 var(--sans);-webkit-font-smoothing:auto;-moz-osx-font-smoothing:auto;text-rendering:optimizeLegibility}
@media (prefers-color-scheme:dark){body{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}}
::selection{background:var(--fg);color:var(--page)}
a{text-decoration-line:underline;text-decoration-color:var(--alpha-500);text-decoration-thickness:1px;text-underline-offset:.22em;transition:text-decoration-color var(--t-fast) var(--ease),color var(--t-fast) var(--ease)}
a:hover{text-decoration-color:currentColor}
:focus-visible{box-shadow:none;outline:2px solid var(--fg);outline-offset:3px;border-radius:2px}
.page{max-width:820px;margin:0 auto;padding:0 24px}
.top{display:flex;justify-content:flex-end;padding-top:20px}
.login{height:30px;padding:0 12px;font-size:13px;text-decoration:none;color:var(--fg-muted);box-shadow:0 0 0 1px var(--border)}
.login:hover{color:var(--fg);box-shadow:0 0 0 1px var(--border-hover)}
.login:focus-visible{outline-offset:2px;border-radius:var(--r-sm);box-shadow:0 0 0 1px var(--border)}
header.intro{padding:clamp(40px,10vw,104px) 0 0}
h1{margin:0;font-size:clamp(28px,4.2vw,34px);line-height:1.1;font-weight:600;letter-spacing:-.025em}
.meta{margin:10px 0 0;font:400 13px/20px var(--mono);color:var(--faint);letter-spacing:-.01em}
.lede{margin:28px 0 0;max-width:32em;font-size:clamp(18px,2.2vw,20px);line-height:1.5;letter-spacing:-.011em;text-wrap:pretty}
.contact{display:flex;flex-wrap:wrap;gap:4px 20px;margin:20px 0 0;padding:0;list-style:none;color:var(--fg-muted)}
.contact a:hover{color:var(--fg)}
h2{margin:0 0 12px;font-size:13px;line-height:20px;font-weight:500;color:var(--faint)}
.work{list-style:none;margin:0;padding:0;border-bottom:1px solid var(--border)}
.work li{border-top:1px solid var(--border)}
.work a{display:grid;grid-template-columns:1fr auto;gap:2px 24px;margin:0 -12px;padding:16px 12px 18px;border-radius:4px;text-decoration:none}
.work a:focus-visible{outline-offset:-2px}
.work h3{margin:0;font-size:15px;line-height:24px;font-weight:500;letter-spacing:-.01em}
.work h3 span{text-decoration:underline;text-decoration-color:transparent;text-decoration-thickness:1px;text-underline-offset:.22em;transition:text-decoration-color var(--t-fast) var(--ease)}
.work a:hover h3 span{text-decoration-color:currentColor}
.work p{grid-column:1;margin:0;color:var(--fg-muted);max-width:52ch;text-wrap:pretty}
.stack{grid-column:2;grid-row:1;align-self:baseline;font:400 12px/24px var(--mono);color:var(--faint);white-space:nowrap}
main.page{padding-bottom:clamp(80px,12vw,128px)}
@media (min-width:760px){
  .page{display:grid;grid-template-columns:148px minmax(0,1fr);column-gap:40px}
  .page>*{grid-column:2}
  .page>h2{grid-column:1;margin-bottom:0;padding-top:18px;align-self:start}
  .sec-start{margin-top:104px}
}
@media (max-width:759px){h2.sec-start{margin-top:clamp(64px,10vw,104px)}}
@media (max-width:479px){
  .page{padding-left:20px;padding-right:20px}
  .work a{grid-template-columns:1fr;padding-top:14px;padding-bottom:16px}
  .stack{grid-column:1;grid-row:auto;order:3;line-height:20px;margin-top:6px}
}
`;

export function renderHome(featured: Entry[], session: { email: string } | null): string {
  const rows = featured
    .map(
      (e) => `<li><a href="${esc(href(e) ?? "#")}">
        <h3><span>${esc(e.name)}</span></h3>
        <span class="stack">${esc((e.tags ?? []).join(" · "))}</span>
        <p>${esc(e.description)}</p>
      </a></li>`,
    )
    .join("");

  return page({
    title: "Mack Haymond",
    pageBg: "var(--bg-100)",
    head: `<meta name="description" content="Mack Haymond studies CS and Math/Econ at UCLA and works part-time in the middle office at Hartree Partners. This page lists things he's built.">`,
    css: HOME_CSS,
    body: `<a class="skip" href="#main">Skip to content</a>
<main id="main" class="page">
  <nav class="top" aria-label="Account"><a class="btn login" href="/dash">${session ? "Dashboard" : "Log in"}</a></nav>
  <header class="intro">
    <h1>Mack Haymond</h1>
    <p class="meta">UCLA ’29 · CS + Math/Econ</p>
    <p class="lede">I work in the middle office at Hartree Partners, mostly on P&amp;L attribution. I also write software, usually tools I wanted for myself.</p>
    <ul class="contact">
      <li><a href="https://github.com/mackhaymond">GitHub</a></li>
      <li><a href="https://www.linkedin.com/in/mackhaymond">LinkedIn</a></li>
      <li><a href="mailto:${EMAIL}">${EMAIL}</a></li>
    </ul>
  </header>
  <h2 id="work" class="sec-start">Projects</h2>
  <div class="sec-start">
    <ul class="work" aria-labelledby="work">${rows}</ul>
  </div>
</main>`,
  });
}

// ---------------------------------------------------------------- dashboard

// One item markup everywhere; the container decides how it looks: .tiles (things I launch),
// .compact (repos and folders, dense columns), .results (search, a command-palette list).
// Pinned / Recent / Results hold clones of the server-rendered originals in #groups.

const STAR = `<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.75l1.93 3.91 4.32.63-3.13 3.05.74 4.3L8 11.61l-3.86 2.03.74-4.3L1.75 6.29l4.32-.63L8 1.75z" fill="var(--star-fill,none)" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>`;
const REPO = `<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M5.5 4 2 8l3.5 4M10.5 4 14 8l-3.5 4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const COPY_SM = `<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><rect x="5.25" y="5.25" width="8" height="8" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M10.75 3.25v-.5a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h.5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`;

const TILE_GROUPS = new Set(["Tools", "Sites", "Projects", "Admin"]);

/** Stable id for pins and recents. */
export const entryId = (e: Entry) => e.url ?? e.repo ?? e.path ?? e.name;
const slug = (g: string) => g.toLowerCase().replace(/[^a-z0-9]+/g, "-");

const DASH_CSS = `
.wrap{max-width:1080px}
.top .wrap{display:flex;align-items:center;justify-content:space-between;height:52px;font-size:13px;color:var(--fg-muted)}
.top a{display:inline-flex;align-items:center;gap:6px;border-radius:4px;transition:color var(--t-fast)}
.top a:hover{color:var(--fg)}
.bar{position:sticky;top:0;z-index:9;padding:8px 0 12px;background:color-mix(in srgb,var(--page) 90%,transparent);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.search{position:relative;display:flex;align-items:center}
.search>svg{position:absolute;left:14px;color:var(--fg-muted);pointer-events:none}
.search input{width:100%;height:44px;padding:0 14px 0 42px;border:0;border-radius:10px;background:var(--bg-100);box-shadow:0 0 0 1px var(--border);color:var(--fg);font:400 15px/20px var(--sans);transition:box-shadow var(--t-fast) var(--ease)}
.search input::placeholder{color:var(--fg-faint)}
.search input:hover{box-shadow:0 0 0 1px var(--border-hover)}
.search input:focus{outline:none;box-shadow:0 0 0 1px var(--alpha-600),var(--ring)}
.search input::-webkit-search-cancel-button{display:none}
#alert{display:flex;flex-wrap:wrap;gap:4px 14px;margin:10px 2px 0;font-size:13px;color:var(--fg-muted)}
#alert span{display:inline-flex;align-items:center;gap:6px}
.sec{margin-top:28px;scroll-margin-top:80px}
.sec-h{display:flex;align-items:baseline;gap:8px;margin:0 0 10px 2px}
h2{margin:0;font-size:13px;line-height:20px;font-weight:500;color:var(--fg-muted)}
.count{font:400 12px/20px var(--mono);color:var(--fg-faint)}
summary.sec-h{cursor:pointer;list-style:none;width:max-content;border-radius:var(--r-sm);padding-right:6px}
summary.sec-h::-webkit-details-marker{display:none}
summary.sec-h:hover h2{color:var(--fg)}
.chev{align-self:center;color:var(--fg-faint);transition:transform var(--t-fast) var(--ease)}
details[open]>summary .chev{transform:rotate(90deg)}
details.sec:not([open]){margin-top:14px}
details.sec:not([open])+details.sec:not([open]){margin-top:6px}

.items{list-style:none;margin:0;padding:0}
.items li{position:relative}
.it{display:block;color:inherit;border-radius:8px;transition:background var(--t-fast) var(--ease),box-shadow var(--t-fast) var(--ease)}
div.it{cursor:pointer}
.it:focus-visible{outline:none;box-shadow:var(--ring)}
.t1{display:flex;align-items:center;gap:8px;min-width:0}
.name{min-width:0;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.host{display:block;font:400 12px/16px var(--mono);color:var(--fg-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.desc{display:block;font-size:13px;line-height:18px;color:var(--fg-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.meta{margin-left:auto;padding-left:8px;flex:none;font:400 11px/16px var(--mono);color:var(--fg-faint);white-space:nowrap}
.grp{display:none}
li.copied .meta::before{content:"copied ";color:var(--green)}
.badge{display:inline-flex;align-items:center;height:18px;padding:0 7px;border-radius:var(--r-full);font:500 11px/16px var(--sans)}
.badge.degraded{background:var(--amber-bg);color:var(--amber-fg)}
.badge.down{background:var(--red-bg);color:var(--red-fg)}
.dot{display:none;flex:none;width:7px;height:7px;border-radius:50%}
.dot.degraded,.dot.down{display:block}
.dot.degraded{background:var(--amber)}
.dot.down{background:var(--red);animation:pulse 2s var(--ease) infinite}
@keyframes pulse{50%{opacity:.4}}
.acts{position:absolute;display:none;gap:2px}
.act{display:grid;place-items:center;width:26px;height:26px;border:0;border-radius:var(--r-sm);background:var(--bg-100);color:var(--fg-muted);cursor:pointer;transition:background var(--t-fast),color var(--t-fast)}
.act:hover{background:var(--gray-100);color:var(--fg)}
.act:focus-visible{box-shadow:var(--ring)}
li.pinned .act.pin{color:var(--fg);--star-fill:currentColor}
@media (hover:hover){.items li:hover .acts,.items li:focus-within .acts{display:flex}.items li:hover .meta,.items li:focus-within .meta{visibility:hidden}}

.tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:8px}
.tiles .it{height:100%;padding:12px 14px 13px;background:var(--bg-100);box-shadow:0 0 0 1px var(--border)}
.tiles .it:hover,.tiles .it.active{box-shadow:0 0 0 1px var(--border-hover);background:color-mix(in srgb,var(--bg-100),var(--fg) 3%)}
.tiles .host{margin-top:2px}
.tiles .desc{margin-top:6px;white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.tiles .acts{top:8px;right:8px}

.compact{columns:3 240px;column-gap:28px}
.compact li{break-inside:avoid}
.compact .it{margin:0 -8px;padding:5px 8px}
.compact .it:hover,.compact .it.active{background:var(--hover)}
.compact .name{font-weight:400}
.compact .host,.compact .desc{display:none}
.compact .acts{top:50%;right:-6px;transform:translateY(-50%)}
.compact .act{width:24px;height:24px}

.results .it{display:grid;grid-template-columns:minmax(0,300px) minmax(0,1fr);column-gap:24px;align-items:center;padding:8px 12px}
.results .it:hover,.results .it.active{background:var(--hover)}
.results .t1{grid-column:1}
.results .host{grid-column:1}
.results .desc{grid-column:2;grid-row:1/3}
.results .grp{display:inline;margin-left:auto;padding-left:8px;font:400 11px/16px var(--mono);color:var(--fg-faint);white-space:nowrap}
.results .grp+.meta{margin-left:0}
.results .acts{top:50%;right:8px;transform:translateY(-50%)}
.results li:hover .grp{visibility:hidden}

.empty{margin:24px 0 40px;padding:40px 16px;border:1px dashed var(--alpha-500);border-radius:var(--r-lg);text-align:center;color:var(--fg-muted)}
.empty p{margin:0 0 12px}
.empty b{color:var(--fg);font-weight:500}
main{padding-bottom:64px}
@media (max-width:719px){.results .it{grid-template-columns:minmax(0,1fr)}.results .desc{display:none}}
@media (max-width:639px){.tiles{grid-template-columns:repeat(auto-fill,minmax(150px,1fr))}.tiles .desc{display:none}}
`;

const DASH_JS = `
const $=s=>document.querySelector(s),q=$("#q"),M=$("#main"),G=$("#groups"),R=$("#results"),live=$("#live");
const store={get(k,d){try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};
const ORIG=[...G.querySelectorAll("li[data-id]")],byId=new Map(ORIG.map(li=>[li.dataset.id,li]));
let pins=new Set(PINS.filter(id=>byId.has(id))),recent=store.get("mh.recent",[]).filter(id=>byId.has(id));
const PRI={Tools:12,Sites:10,Projects:10,Admin:8,Repos:6,Local:4,Scratch:-10,Coursework:-10,Archive:-15};

const clone=li=>{const c=li.cloneNode(true);c.dataset.clone="";c.hidden=false;c.querySelector(".it").classList.remove("active");return c};
function fill(sec,ids){sec.querySelector("ul").replaceChildren(...ids.map(id=>clone(byId.get(id))))}
function sections(){
  ORIG.forEach(li=>li.classList.toggle("pinned",pins.has(li.dataset.id)));
  // A pinned tile moves up to Pinned instead of showing twice.
  G.querySelectorAll(".tiles").forEach(ul=>{
    let c=0;for(const li of ul.children){li.hidden=pins.has(li.dataset.id);c+=!li.hidden}
    ul.closest(".sec").hidden=!c;
  });
  fill($("#pinned"),[...pins]);
  fill($("#recent"),recent.filter(id=>!pins.has(id)).slice(0,8));
  if(!q.value){$("#pinned").hidden=!pins.size;$("#recent").hidden=!$("#recent li")}
}
sections();

const items=()=>[...M.querySelectorAll("li:not([hidden]) > .it")].filter(r=>r.offsetParent);
let active=null;
const setActive=r=>{active?.classList.remove("active");active=r;r?.classList.add("active")};

const words=s=>s.split(/[^a-z0-9]+/).filter(Boolean);
function subseq(s,w){let i=0;for(const c of s)if(c===w[i])i++;return i===w.length}
function score(li,terms){
  const n=li.dataset.n,h=li.dataset.h,k=li.dataset.k;let s=0;
  for(const w of terms){
    if(n===w)s+=120;else if(n.startsWith(w))s+=100;else if(words(n).some(p=>p.startsWith(w)))s+=70;
    else if(n.includes(w))s+=50;else if(h.includes(w))s+=25;else if(k.includes(w))s+=8;
    else if(w.length>1&&subseq(n,w))s+=4;else return -1;
  }
  return s+(PRI[li.dataset.g]??0)+(pins.has(li.dataset.id)?15:0)+(recent.includes(li.dataset.id)?10:0);
}
function search(){
  const t=q.value.trim().toLowerCase().split(" ").filter(Boolean),on=t.length>0;
  G.hidden=on;$("#pinned").hidden=on||!pins.size;$("#recent").hidden=on||!$("#recent li");
  if(!on){R.hidden=true;$("#empty").hidden=true;setActive(null);live.textContent="";return}
  const hits=ORIG.map(li=>[score(li,t),li]).filter(([s])=>s>=0).sort((a,b)=>b[0]-a[0]).slice(0,60);
  R.querySelector("ul").replaceChildren(...hits.map(([,li])=>clone(li)));
  R.hidden=!hits.length;
  $("#empty").hidden=!!hits.length;$("#eq").textContent="“"+q.value.trim()+"”";
  setActive(document.activeElement===q?items()[0]:null);
  live.textContent=hits.length+(hits.length===1?" result":" results");
}
q.addEventListener("input",search);
q.addEventListener("focus",()=>q.value&&setActive(items()[0]));
q.addEventListener("blur",()=>setActive(null));
const clear=()=>{q.value="";search()};

function remember(id){recent=[id,...recent.filter(x=>x!==id)].slice(0,12);store.set("mh.recent",recent)}
function copy(li,text){navigator.clipboard.writeText(text).then(()=>{li.classList.add("copied");live.textContent="Copied "+text;setTimeout(()=>li.classList.remove("copied"),1500)})}
async function togglePin(id){
  const on=!pins.has(id);on?pins.add(id):pins.delete(id);sections();if(q.value)search();
  live.textContent=on?"Pinned":"Unpinned";
  try{const r=await fetch("/api/pins",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({id,pinned:on})});if(!r.ok)throw 0}
  catch{on?pins.delete(id):pins.add(id);sections();live.textContent="Could not save pin"}
}
M.addEventListener("click",e=>{
  const li=e.target.closest("li[data-id]");if(!li)return;const id=li.dataset.id;
  const pin=e.target.closest("[data-pin]"),cp=e.target.closest("[data-copy]");
  if(pin){e.preventDefault();togglePin(id);return}
  if(cp){e.preventDefault();copy(li,cp.dataset.copy);remember(id);return}
  if(e.target.closest("a"))remember(id);
});
M.addEventListener("keydown",e=>{
  if(e.target===q)return;
  const rs=items(),i=rs.indexOf(document.activeElement);if(i<0)return;
  const li=rs[i].closest("li");
  if(e.key==="ArrowDown"||e.key==="ArrowRight"){e.preventDefault();rs[Math.min(i+1,rs.length-1)].focus()}
  else if(e.key==="ArrowUp"||e.key==="ArrowLeft"){e.preventDefault();i?rs[i-1].focus():q.focus()}
  else if(e.key==="Escape"){q.focus()}
  else if(e.key==="Enter"&&rs[i].dataset.copy!==undefined){e.preventDefault();rs[i].click()}
  else if(e.key==="p"){e.preventDefault();togglePin(li.dataset.id)}
  else if(e.key==="c"&&li.dataset.path){e.preventDefault();copy(li,li.dataset.path)}
  else if(e.key.length===1&&!e.metaKey&&!e.ctrlKey&&e.key!==" "){q.focus()}
});
q.addEventListener("keydown",e=>{
  if(e.key==="ArrowDown"){const r=items()[0];if(r){e.preventDefault();r.focus()}}
  else if(e.key==="Enter"){const r=active||items()[0];if(r){e.preventDefault();(e.metaKey||e.ctrlKey)&&r.href?(remember(r.closest("li").dataset.id),window.open(r.href,"_blank","noopener")):r.click()}}
  else if(e.key==="Escape"){if(q.value)clear();else q.blur()}
});
document.addEventListener("keydown",e=>{
  const typing=/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
  if((e.key==="k"&&(e.metaKey||e.ctrlKey))||(e.key==="/"&&!typing)){e.preventDefault();q.focus();q.select()}
});

// Collapsed sections remember being opened, per device.
const opened=new Set(store.get("mh.open",[]));
G.querySelectorAll("details[data-g]").forEach(d=>{
  if(opened.has(d.dataset.g))d.open=true;
  d.addEventListener("toggle",()=>{d.open?opened.add(d.dataset.g):opened.delete(d.dataset.g);store.set("mh.open",[...opened])});
});

// Status: dots everywhere; a line under search only when something is wrong.
const LBL={up:"Up",degraded:"Slow",down:"Down"};
fetch("/api/status").then(r=>r.json()).then(st=>{
  const bad=new Map();
  M.querySelectorAll("li[data-url]").forEach(li=>{
    const s=st[li.dataset.url];if(!s)return;
    const k=!s.up?"down":s.ms>2500?"degraded":"up";
    const d=li.querySelector(".dot");d.className="dot "+k;d.title=LBL[k]+(s.code?" · HTTP "+s.code:"")+" · "+s.ms+"ms";
    d.querySelector(".sr-only").textContent=LBL[k]+": ";
    if(k!=="up"){li.querySelector(".meta").innerHTML='<span class="badge '+k+'">'+LBL[k]+"</span>";bad.set(li.dataset.n,[k,li.querySelector(".name").textContent])}
    li.dataset.k+=" "+(k==="up"?"up":k+" "+LBL[k].toLowerCase());
  });
  const a=$("#alert");a.innerHTML=[...bad.values()].map(([k,n])=>'<span><span class="dot '+k+'"></span>'+n+" is "+LBL[k].toLowerCase()+"</span>").join("");a.hidden=!bad.size;
}).catch(()=>{});
`;

function item(e: Entry): string {
  const monitored = !!e.url && e.monitor !== false;
  const link = href(e);
  const h = host(e);
  const key = [e.name, h, e.path, e.description, e.group, ...(e.tags ?? []), e.private ? "private" : "public"].join(" ").toLowerCase();
  // Local-only folders/repos have nothing to link to; clicking copies the path.
  const open = link
    ? `<a class="it" href="${esc(link)}" title="${esc(e.description || h)}">`
    : `<div class="it" tabindex="0" role="button" data-copy="${esc(e.path ?? "")}" title="Copy ${esc(e.path ?? "")}">`;
  const acts = [
    e.url && e.repo ? `<a class="act" href="${esc(e.repo)}" title="Repository" aria-label="Repository">${REPO}</a>` : "",
    link && e.path ? `<button class="act" type="button" data-copy="${esc(e.path)}" title="Copy path (c)" aria-label="Copy path">${COPY_SM}</button>` : "",
    `<button class="act pin" type="button" data-pin title="Pin (p)" aria-label="Pin">${STAR}</button>`,
  ].join("");
  const data = [
    `data-id="${esc(entryId(e))}"`,
    `data-n="${esc(e.name.toLowerCase())}"`,
    `data-h="${esc(h.toLowerCase())}"`,
    `data-g="${esc(e.group)}"`,
    `data-k="${esc(key)}"`,
    monitored ? `data-url="${esc(e.url!)}"` : "",
    e.path ? `data-path="${esc(e.path)}"` : "",
  ].join(" ");
  // Hidden unless the status check finds it down or slow.
  const dot = monitored ? `<span class="dot"><span class="sr-only"></span></span>` : "";
  return `<li ${data}>${open}<span class="t1">${dot}<span class="name">${esc(e.name)}</span><span class="grp">${esc(e.group)}</span><span class="meta">${when(e.updated)}</span></span><span class="host">${esc(h)}</span><span class="desc">${esc(e.description)}</span>${link ? "</a>" : "</div>"}<span class="acts">${acts}</span></li>`;
}

const shell = (id: string, title: string, kind: string) =>
  `<section class="sec" id="${id}" aria-labelledby="${id}-h" hidden><div class="sec-h"><h2 id="${id}-h">${title}</h2></div><ul class="items ${kind}"></ul></section>`;

export function renderDash(entries: Entry[], session: Session, nonce: string, pins: string[]): string {
  const groups = [...new Set(entries.map((e) => e.group))].sort((a, b) => rank(a) - rank(b));
  const sections = groups
    .map((g) => {
      const list = entries.filter((e) => e.group === g);
      const id = `sec-${slug(g)}`;
      // Counts only where they say something: on collapsed sections.
      const head = `<h2 id="${id}-h">${esc(g)}</h2>${COLLAPSED.has(g) ? `<span class="count">${list.length}</span>` : ""}`;
      const ul = `<ul class="items ${TILE_GROUPS.has(g) ? "tiles" : "compact"}">${list.map(item).join("")}</ul>`;
      return COLLAPSED.has(g)
        ? `<details class="sec" id="${id}" data-g="${esc(g)}"><summary class="sec-h">${CHEVRON}${head}</summary>${ul}</details>`
        : `<section class="sec" id="${id}" aria-labelledby="${id}-h"><div class="sec-h">${head}</div>${ul}</section>`;
    })
    .join("");
  const pinsJson = JSON.stringify(pins).replace(/</g, "\\u003c");

  return page({
    title: "Launchpad",
    pageBg: "var(--bg-100)",
    head: `<meta name="robots" content="noindex">`,
    css: DASH_CSS,
    body: `<a class="skip" href="#q">Skip to search</a>
<header class="top"><div class="wrap">
  <a href="/?public" title="Public homepage">← mackhaymond.co</a>
  <a href="/cdn-cgi/access/logout" title="Signed in as ${esc(session.email)}">Log out</a>
</div></header>
<main class="wrap" id="main">
  <div class="bar">
    <div class="search" role="search">
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.75" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="m10.5 10.5 3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      <label class="sr-only" for="q">Search</label>
      <input id="q" type="search" placeholder="Search ${entries.length} things…" autocomplete="off" spellcheck="false" aria-controls="main" autofocus>
    </div>
    <p id="alert" role="status" hidden></p>
  </div>
  <p class="sr-only" id="live" aria-live="polite"></p>
  <section class="sec" id="results" aria-label="Search results" hidden><ul class="items results"></ul></section>
  ${shell("pinned", "Pinned", "tiles")}
  ${shell("recent", "Recent", "tiles")}
  <div id="groups">${sections}</div>
  <div class="empty" id="empty" hidden><p>Nothing matches <b id="eq"></b>.</p></div>
</main>
<script nonce="${nonce}">const PINS=${pinsJson};${DASH_JS}</script>`,
  });
}

export function renderNotFound(): string {
  return page({
    title: "Not found · mackhaymond.co",
    pageBg: "var(--bg-100)",
    css: `.nf{min-height:100vh;display:grid;place-content:center;gap:16px;text-align:center}.nf h1{margin:0;font-size:24px;letter-spacing:-.96px}.nf p{margin:0;color:var(--fg-muted)}`,
    body: `<main class="nf"><h1>404</h1><p>Nothing here.</p><p><a class="btn btn-secondary" href="/dash">Launchpad</a></p></main>`,
  });
}
