# mackhaymond.co — agent notes

Personal launchpad on one Cloudflare Worker. `/` is public; everything else is
behind Cloudflare Access (owner only). Logged-in visits to `/` redirect to
`/dash`; `/?public` shows the public page deliberately.

## This repo is PUBLIC

Never commit private hostnames, internal URLs, tunnel names, IPs, or secrets.
Anything matching `*.private.*` is gitignored for local scratch copies.

## Cataloging a new hosted thing

Other sessions are told (via the global CLAUDE.md) to come here whenever they
deploy or retire something with a URL.

- **Public project** (fine for anyone to see): add an `Entry` to
  `PUBLIC_CATALOG` in `src/catalog.ts` (`featured: true` to show it on `/`),
  then `npm run typecheck && npm run deploy`, commit, push.
- **Private tool / dashboard / admin surface**: KV only, never the repo. No
  redeploy needed:
  ```
  npm run catalog:pull     # KV key "catalog" -> catalog.private.json (gitignored)
  # edit catalog.private.json
  npm run catalog:push
  ```
  Groups in use: `Tools` (apps I log into), `Sites` (private/personal sites),
  `Admin` (third-party dashboards, `"monitor": false`).
- **Retired**: remove the entry the same way.
- **New repo or project folder** (GitHub or local): `npm run catalog:sync`.
  `scripts/sync-repos.mjs` scans GitHub (personal + orgs) and every git repo
  under `~` plus non-repo folders in `~/code` and `~/code/projects`, groups
  them (Repos, Local, Forks, Clones, Scratch, Coursework, Archive), and
  rewrites only `"source": "sync"` entries. To fix a synced entry's name,
  description, or group, add a hand-written entry with the same `path` or
  `repo`; it wins over the synced one.

The `Entry` type in `src/catalog.ts` is the schema for both. Every entry with
a `url` gets a status dot on `/dash` unless `"monitor": false`.

## Layout

- `src/index.ts`: routing and auth gate. Public paths: `/`, `/robots.txt`,
  and static assets in `public/`.
- `src/access.ts`: verifies the Access JWT (header or `CF_Authorization`
  cookie) and checks the email against `OWNER_EMAILS`.
- `src/render.ts`: both pages (Geist/Vercel styling, server-rendered). On
  `/dash`, Tools/Sites/Projects/Admin render as tiles and everything else as
  compact columns. Pins live in KV key `pins` (array of entry ids, written by
  `POST /api/pins`); recents and opened sections are per-device localStorage.
- Local dev: `.dev.vars` with `DEV=1` treats every request as the owner;
  seed local KV with `npx wrangler kv key put catalog --binding CATALOG --local --path catalog.private.json`.
