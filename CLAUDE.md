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

- **Public project** (fine for anyone to see): add an entry to the public
  catalog in the repo, commit, push, deploy.
- **Private tool / dashboard / admin surface**: add it to the private catalog
  in KV, never the repo. No redeploy needed.

<!-- TODO: replace with exact file path, entry schema, KV namespace/key, and
the one-line commands once the Worker is built. -->

Entry fields (planned): `name`, `url`, `description`, `group`, `public`
(bool), optional `repo`, `status` check.
