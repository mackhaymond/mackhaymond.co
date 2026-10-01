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

// Dashboard section order; unlisted groups go after "Admin". Collapsed ones open while searching.
const GROUP_ORDER = ["Tools", "Sites", "Projects", "Repos", "Local", "Admin"];
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

const ARROW = `<svg class="arrow" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 11.5l7-7M5.5 4.5h6v6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const LOCK = `<svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`;

const COPY = `<svg class="arrow" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><rect x="5.25" y="5.25" width="8" height="8" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M10.75 3.25v-.5a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h.5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`;
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
.all{display:inline-block;margin-top:16px;font-size:13px;color:var(--fg-muted)}
.all:hover{color:var(--fg)}
.work{list-style:none;margin:0;padding:0;border-bottom:1px solid var(--border)}
.work li{border-top:1px solid var(--border)}
.work a{display:grid;grid-template-columns:1fr auto;gap:2px 24px;margin:0 -12px;padding:16px 12px 18px;border-radius:4px;text-decoration:none}
.work a:focus-visible{outline-offset:-2px}
.work h3{margin:0;font-size:15px;line-height:24px;font-weight:500;letter-spacing:-.01em}
.work h3 span{text-decoration:underline;text-decoration-color:transparent;text-decoration-thickness:1px;text-underline-offset:.22em;transition:text-decoration-color var(--t-fast) var(--ease)}
.work a:hover h3 span{text-decoration-color:currentColor}
.work p{grid-column:1;margin:0;color:var(--fg-muted);max-width:52ch;text-wrap:pretty}
.stack{grid-column:2;grid-row:1;align-self:baseline;font:400 12px/24px var(--mono);color:var(--faint);white-space:nowrap}
footer{max-width:820px;margin:clamp(80px,12vw,128px) auto 0;padding:0 24px}
footer>div{padding:20px 0 40px;border-top:1px solid var(--border);font-size:13px;line-height:20px;color:var(--faint)}
@media (min-width:760px){
  .page{display:grid;grid-template-columns:148px minmax(0,1fr);column-gap:40px}
  .page>*{grid-column:2}
  .page>h2{grid-column:1;margin-bottom:0;padding-top:18px;align-self:start}
  .sec-start{margin-top:104px}
}
@media (max-width:759px){h2.sec-start{margin-top:clamp(64px,10vw,104px)}}
@media (max-width:479px){
  .page,footer{padding:0 20px}
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
    <a class="all" href="https://github.com/mackhaymond?tab=repositories">More on GitHub</a>
  </div>
</main>
<footer><div>© ${new Date().getFullYear()} Mack Haymond</div></footer>`,
  });
}

// ---------------------------------------------------------------- dashboard

const DASH_CSS = `
.wrap{max-width:1080px}
.top{position:sticky;top:0;z-index:10;background:color-mix(in srgb,var(--bg-100) 82%,transparent);backdrop-filter:saturate(180%) blur(8px);-webkit-backdrop-filter:saturate(180%) blur(8px);border-bottom:1px solid var(--border)}
.top .wrap{height:56px;display:flex;align-items:center;justify-content:space-between;gap:12px}
.crumbs{display:flex;align-items:center;gap:10px;min-width:0;font-weight:500}
.crumbs .sl{color:var(--gray-500);font-weight:300;font-size:20px}
.crumbs .muted{color:var(--fg-muted)}
.top-r{display:flex;align-items:center;gap:8px}
.avatar{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:var(--gray-100);box-shadow:0 0 0 1px var(--border);font:500 11px/1 var(--mono);color:var(--fg-muted);text-transform:uppercase}
.btn .short{display:none}
.head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;padding:40px 0 20px;flex-wrap:wrap}
h1{margin:0;font-size:24px;line-height:32px;font-weight:600;letter-spacing:-.96px}
.summary{display:flex;flex-wrap:wrap;gap:4px 14px;margin:6px 0 0;padding:0;list-style:none;font-size:13px;line-height:18px;color:var(--fg-muted);font-feature-settings:"tnum"}
.summary li{display:inline-flex;align-items:center;gap:6px}
.summary .dot.down{animation:none}
.checked{font:400 12px/16px var(--mono);color:var(--fg-muted)}
.search{position:relative;display:flex;align-items:center}
.search>svg{position:absolute;left:12px;color:var(--fg-muted);pointer-events:none}
.search input{width:100%;height:40px;padding:0 64px 0 38px;border:0;border-radius:var(--r-md);background:var(--bg-100);box-shadow:var(--shadow-sm);color:var(--fg);font:400 14px/20px var(--sans);transition:box-shadow var(--t-fast) var(--ease)}
.search input::placeholder{color:var(--fg-faint)}
.search input:hover{box-shadow:0 0 0 1px var(--border-hover)}
.search input:focus{outline:none;box-shadow:0 0 0 1px var(--alpha-600),var(--ring)}
.search input::-webkit-search-cancel-button{display:none}
.search .kbds{position:absolute;right:10px;display:flex;gap:4px;pointer-events:none}
kbd{display:inline-grid;place-items:center;min-width:20px;height:20px;padding:0 5px;border-radius:4px;background:var(--bg-200);box-shadow:0 0 0 1px var(--border);font:500 11px/1 var(--mono);color:var(--fg-muted)}
.groups{padding:24px 0 8px}
.group{margin-bottom:32px}
.g-h{display:flex;align-items:center;gap:8px;margin:0 0 10px 2px}
h2{margin:0;font-size:14px;line-height:20px;font-weight:600;letter-spacing:-.28px}
.count{min-width:20px;height:18px;padding:0 6px;border-radius:var(--r-full);background:var(--gray-100);font:500 11px/18px var(--mono);color:var(--fg-muted);text-align:center}
.list{list-style:none;margin:0;padding:0;background:var(--bg-100);border-radius:var(--r-lg);box-shadow:var(--shadow-sm);overflow:hidden}
.list li+li{border-top:1px solid var(--border)}
.row{display:grid;grid-template-columns:8px minmax(0,230px) minmax(0,1fr) auto 16px;align-items:center;column-gap:16px;min-height:52px;padding:8px 16px;transition:background var(--t-fast) var(--ease)}
.row:hover,.row.active{background:var(--hover)}
.row:focus-visible{border-radius:0;box-shadow:inset 0 0 0 2px var(--ring-c)}
.id{display:flex;flex-direction:column;min-width:0}
.name{font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.host{font:400 12px/16px var(--mono);color:var(--fg-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.desc{font-size:13px;line-height:18px;color:var(--fg-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.badges{display:flex;gap:6px}
.badge{display:inline-flex;align-items:center;height:20px;padding:0 8px;border-radius:var(--r-full);font-size:12px;line-height:16px;font-weight:500}
.badge.degraded{background:var(--amber-bg);color:var(--amber-fg)}
.badge.down{background:var(--red-bg);color:var(--red-fg)}
.lock{display:inline-block;vertical-align:-1px;margin-left:6px;color:var(--fg-muted)}
.when{font:400 12px/16px var(--mono);color:var(--fg-faint);white-space:nowrap}
div.row{cursor:pointer}
div.row.copied .when::after{content:" · copied";color:var(--green)}
summary.g-h{cursor:pointer;list-style:none;width:max-content;border-radius:var(--r-sm);padding-right:6px}
summary.g-h::-webkit-details-marker{display:none}
summary.g-h:hover h2{color:var(--fg-muted)}
.chev{color:var(--fg-muted);transition:transform var(--t-fast) var(--ease)}
details[open]>summary .chev{transform:rotate(90deg)}
details.group:not([open]){margin-bottom:16px}
.row .arrow{color:var(--fg-faint);transition:transform var(--t) var(--swift),color var(--t-fast)}
.row:hover .arrow{transform:translate(2px,-2px);color:var(--fg)}
.enter{display:none}
.row.active .enter{display:inline-grid}
.row.active .arrow{display:none}
.dot{width:8px;height:8px;border-radius:50%;background:none;box-shadow:inset 0 0 0 1.5px var(--gray-600)}
.dot.up{background:var(--green);box-shadow:0 0 0 3px color-mix(in srgb,var(--green) 18%,transparent)}
.dot.degraded{background:var(--amber);box-shadow:0 0 0 3px color-mix(in srgb,var(--amber) 22%,transparent)}
.dot.down{background:var(--red);box-shadow:0 0 0 3px color-mix(in srgb,var(--red) 20%,transparent);animation:pulse 2s var(--ease) infinite}
.dot.checking{animation:pulse 1.2s var(--ease) infinite}
@keyframes pulse{50%{opacity:.45}}
.empty{margin:8px 0 40px;padding:40px 16px;border:1px dashed var(--alpha-500);border-radius:var(--r-lg);text-align:center;color:var(--fg-muted)}
.empty p{margin:0 0 12px}
.empty b{color:var(--fg);font-weight:500}
footer{border-top:1px solid var(--border);margin-top:24px}
footer .wrap{display:flex;justify-content:space-between;gap:12px 24px;flex-wrap:wrap;padding-top:20px;padding-bottom:28px;font-size:13px;line-height:18px;color:var(--fg-muted)}
.keys{display:flex;flex-wrap:wrap;gap:6px 16px}
.keys span{display:inline-flex;align-items:center;gap:6px}
footer a{border-radius:4px}
footer a:hover{color:var(--fg)}
@media (max-width:719px){
.row{grid-template-columns:8px minmax(0,1fr) auto 16px;row-gap:2px;align-items:start;padding:10px 14px}
.row>.dot{margin-top:6px}
.row>.arrow,.row>.enter{margin-top:2px}
.desc{grid-column:2/-1;grid-row:2;white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.badges{grid-column:3;grid-row:1}}
@media (max-width:639px){.head{padding:28px 0 16px}}
@media (max-width:479px){.btn .long{display:none}.btn .short{display:inline}.crumbs .muted,.crumbs .sl.first{display:none}.search .kbds,.checked{display:none}.search input{padding-right:12px}.keys{display:none}}
`;

// Filtering, keyboard nav, and status dots. Rows are server-rendered; this only enhances them.
const DASH_JS = `
const $=s=>document.querySelector(s),q=$("#q"),G=$("#groups"),live=$("#live");
const mac=/Mac|iP(hone|ad)/.test(navigator.platform||navigator.userAgent);
const setHint=()=>{const k1=$("#k1"),k2=$("#k2");if(q.value){k1.textContent="esc";k2.hidden=true}else{k1.textContent=mac?"⌘":"Ctrl";k2.hidden=false}};
setHint();
const rows=()=>[...G.querySelectorAll("li:not([hidden]) .row")].filter(r=>r.offsetParent);
let active=null;
const setActive=r=>{active?.classList.remove("active");active=r;r?.classList.add("active")};
function filter(){
  const t=q.value.trim().toLowerCase().split(/\\s+/).filter(Boolean);let total=0;
  G.querySelectorAll(".group").forEach(sec=>{
    let c=0;sec.querySelectorAll("li").forEach(li=>{const ok=t.every(w=>li.dataset.k.includes(w));li.hidden=!ok;c+=ok});
    sec.hidden=!c;sec.querySelector(".count").textContent=c;total+=c;
    if(sec.hasAttribute("data-collapsed"))sec.open=t.length>0;
  });
  $("#empty").hidden=!!total;$("#eq").textContent="\\u201c"+q.value.trim()+"\\u201d";
  setActive(t.length&&document.activeElement===q?rows()[0]:null);
  live.textContent=t.length?total+(total===1?" service":" services")+" found":"";
  setHint();
}
q.addEventListener("input",filter);
q.addEventListener("focus",()=>q.value&&setActive(rows()[0]));
q.addEventListener("blur",()=>setActive(null));
q.addEventListener("keydown",e=>{
  if(e.key==="ArrowDown"){const r=rows()[0];if(r){e.preventDefault();r.focus()}}
  else if(e.key==="Enter"){const r=active||rows()[0];if(r){e.preventDefault();(e.metaKey||e.ctrlKey)&&r.href?window.open(r.href,"_blank","noopener"):r.click()}}
  else if(e.key==="Escape"){if(q.value){q.value="";filter()}else q.blur()}
});
G.addEventListener("keydown",e=>{
  const rs=rows(),i=rs.indexOf(document.activeElement);if(i<0)return;
  if(e.key==="ArrowDown"){e.preventDefault();rs[Math.min(i+1,rs.length-1)].focus()}
  else if(e.key==="ArrowUp"){e.preventDefault();i?rs[i-1].focus():q.focus()}
  else if(e.key==="Escape"){q.focus()}
  else if(e.key==="Enter"&&rs[i].dataset.copy!==undefined){e.preventDefault();rs[i].click()}
  else if(e.key.length===1&&!e.metaKey&&!e.ctrlKey&&e.key!==" "){q.focus()}
});
document.addEventListener("keydown",e=>{
  const typing=/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
  if((e.key==="k"&&(e.metaKey||e.ctrlKey))||(e.key==="/"&&!typing)){e.preventDefault();q.focus();q.select()}
});
$("#clear").addEventListener("click",()=>{q.value="";filter();q.focus()});
G.addEventListener("click",e=>{
  const r=e.target.closest("[data-copy]");if(!r)return;
  navigator.clipboard.writeText(r.dataset.copy).then(()=>{r.classList.add("copied");live.textContent="Copied "+r.dataset.copy;setTimeout(()=>r.classList.remove("copied"),1500)});
});

const LBL={up:"Operational",degraded:"Degraded",down:"Down"};
fetch("/api/status").then(r=>r.json()).then(st=>{
  const n={up:0,degraded:0,down:0};
  G.querySelectorAll("li[data-url]").forEach(li=>{
    const s=st[li.dataset.url];if(!s)return;
    const k=!s.up?"down":s.ms>2500?"degraded":"up";n[k]++;
    const d=li.querySelector(".dot");d.className="dot "+k;d.title=LBL[k]+(s.code?" \\u00b7 HTTP "+s.code:"")+" \\u00b7 "+s.ms+"ms";
    d.querySelector(".sr-only").textContent=LBL[k]+": ";
    li.querySelector(".badges").innerHTML=k==="up"?"":'<span class="badge '+k+'" aria-hidden="true">'+LBL[k]+"</span>";
    li.dataset.k+=" "+k;
  });
  const parts=[["up","operational"],["degraded","degraded"],["down","down"]].filter(([k])=>n[k]);
  $("#summary").innerHTML=parts.map(([k,l])=>'<li><span class="dot '+k+'" aria-hidden="true"></span>'+n[k]+" "+l+"</li>").join("")+"<li>"+G.querySelectorAll("li[data-k]").length+" services</li>";
  $("#checked").textContent="Checked just now";
}).catch(()=>{$("#checked").textContent="Status unavailable"});
`;

function row(e: Entry): string {
  const monitored = !!e.url && e.monitor !== false;
  const link = href(e);
  const key = [e.name, host(e), e.path, e.description, e.group, ...(e.tags ?? []), e.private ? "private" : "public"].join(" ").toLowerCase();
  // Local-only folders/repos have nothing to link to; clicking copies the path.
  const open = link
    ? `<a class="row" href="${esc(link)}"${e.path ? ` title="${esc(e.path)}"` : ""}>`
    : `<div class="row" tabindex="0" role="button" data-copy="${esc(e.path ?? "")}" title="Copy path">`;
  const icon = link ? ARROW : COPY;
  return `<li data-k="${esc(key)}"${monitored ? ` data-url="${esc(e.url!)}"` : ""}>${open}
<span class="dot${monitored ? " checking" : ""}" title="${monitored ? "Checking…" : "Not monitored"}"><span class="sr-only">${monitored ? "Checking" : "Not monitored"}: </span></span>
<span class="id"><span class="name">${esc(e.name)}${e.private && link ? `<span class="lock" title="Private">${LOCK}<span class="sr-only"> (private)</span></span>` : ""}</span><span class="host">${esc(host(e))}</span></span>
<span class="desc">${esc(e.description)}</span><span class="badges">${e.updated ? `<span class="when">${when(e.updated)}</span>` : ""}</span>${icon}<kbd class="enter" aria-hidden="true">↵</kbd>${link ? "</a>" : "</div>"}</li>`;
}

export function renderDash(entries: Entry[], session: Session, nonce: string): string {
  const groups = [...new Set(entries.map((e) => e.group))].sort((a, b) => rank(a) - rank(b));
  const sections = groups
    .map((g, i) => {
      const items = entries.filter((e) => e.group === g);
      const head = `<h2 id="g${i}">${esc(g)}</h2><span class="count">${items.length}</span>`;
      const list = `<ul class="list">${items.map(row).join("")}</ul>`;
      return COLLAPSED.has(g)
        ? `<details class="group" data-collapsed aria-labelledby="g${i}"><summary class="g-h">${CHEVRON}${head}</summary>${list}</details>`
        : `<section class="group" aria-labelledby="g${i}"><div class="g-h">${head}</div>${list}</section>`;
    })
    .join("");

  return page({
    title: "Launchpad · mackhaymond.co",
    pageBg: "var(--bg-200)",
    head: `<meta name="robots" content="noindex">`,
    css: DASH_CSS,
    body: `<a class="skip" href="#q">Skip to search</a>
<header class="top"><div class="wrap">
  <div class="crumbs"><span class="mark" aria-hidden="true">MH</span><span class="sl first" aria-hidden="true">/</span><span class="muted">mackhaymond.co</span><span class="sl" aria-hidden="true">/</span><span>dash</span></div>
  <nav class="top-r" aria-label="Account">
    <a class="btn btn-ghost" href="/?public"><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M12.5 8h-9M7 4.5 3.5 8 7 11.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="long">Public homepage</span><span class="short">Homepage</span></a>
    <span class="avatar" title="Signed in as ${esc(session.email)}" role="img" aria-label="Signed in as ${esc(session.email)}">${esc(session.email[0] ?? "?")}</span>
  </nav>
</div></header>
<main class="wrap" id="main">
  <div class="head">
    <div><h1>Launchpad</h1><ul class="summary" id="summary" aria-label="Service status summary"><li>${entries.length} services</li></ul></div>
    <span class="checked" id="checked">Checking…</span>
  </div>
  <div class="search" role="search">
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.75" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="m10.5 10.5 3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
    <label class="sr-only" for="q">Filter services</label>
    <input id="q" type="search" placeholder="Search services, hosts, repos…" autocomplete="off" spellcheck="false" aria-describedby="hint" aria-controls="groups" autofocus>
    <span class="kbds" id="hint" aria-hidden="true"><kbd id="k1">⌘</kbd><kbd id="k2">K</kbd></span>
  </div>
  <p class="sr-only" id="live" aria-live="polite"></p>
  <div class="groups" id="groups">${sections}</div>
  <div class="empty" id="empty" hidden><p>No services match <b id="eq"></b></p><button class="btn btn-secondary" type="button" id="clear">Clear search</button></div>
</main>
<footer><div class="wrap">
  <div class="keys" aria-hidden="true"><span><kbd>/</kbd> search</span><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>↵</kbd> open</span><span><kbd>esc</kbd> clear</span></div>
  <a href="/cdn-cgi/access/logout">Log out</a>
</div></footer>
<script nonce="${nonce}">${DASH_JS}</script>`,
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
