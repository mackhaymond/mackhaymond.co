# mackhaymond.co

Personal launchpad on Cloudflare Workers.

- `/` — public homepage (name, featured projects, links, log in)
- `/dash` and everything else — private launchpad of everything I host, behind Cloudflare Access (me only)
- Once logged in, `/` redirects to `/dash`; the public page is only reachable deliberately via `/?public`

The Worker verifies the Access JWT itself (defense in depth), and private entries are never sent to unauthenticated visitors.

Status: scaffolding — research + design in progress.
