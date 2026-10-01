import { getSession } from "./access";
import { PUBLIC_CATALOG, type Entry } from "./catalog";
import { renderDash, renderHome, renderNotFound } from "./render";

// Paths anyone may see. Everything else requires the owner's Access session.
const PUBLIC_PATHS = new Set(["/", "/robots.txt"]);
const PROTECTED_ENTRY = "/dash"; // covered by the Access application, so visiting it triggers login

function html(body: string, { status = 200, private: priv = false, nonce = "" } = {}): Response {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": priv ? "private, no-store" : "public, max-age=0, must-revalidate",
      // The homepage varies on the login cookie (logged-in owners get redirected).
      vary: "cookie",
      "content-security-policy": `default-src 'self'; script-src ${nonce ? `'nonce-${nonce}'` : "'none'"}; style-src 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'`,
      "referrer-policy": "strict-origin-when-cross-origin",
      "x-content-type-options": "nosniff",
      "x-frame-options": "DENY",
      "permissions-policy": "camera=(), microphone=(), geolocation=()",
    },
  });
}

const catalog = async (env: Env) => [...(await privateCatalog(env)), ...PUBLIC_CATALOG];

function redirect(location: string, status = 302): Response {
  return new Response(null, { status, headers: { location, "cache-control": "no-store" } });
}

async function privateCatalog(env: Env): Promise<Entry[]> {
  const list = (await env.CATALOG.get<Entry[]>("catalog", "json")) ?? [];
  return list.map((e) => ({ ...e, private: true }));
}

// Probe every catalog URL for the status dots. Any HTTP response (including an Access redirect)
// counts as up; network errors and 5xx count as down.
async function status(entries: Entry[]): Promise<Record<string, { up: boolean; code: number; ms: number }>> {
  const out: Record<string, { up: boolean; code: number; ms: number }> = {};
  await Promise.all(
    entries
      .filter((e) => e.url && e.monitor !== false)
      .map(async (e) => {
        const t = Date.now();
        try {
          const res = await fetch(e.url!, { method: "HEAD", redirect: "manual", signal: AbortSignal.timeout(4000) });
          out[e.url!] = { up: res.status < 500, code: res.status, ms: Date.now() - t };
        } catch {
          out[e.url!] = { up: false, code: 0, ms: Date.now() - t };
        }
      }),
  );
  return out;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    if (url.hostname === "www.mackhaymond.co") {
      url.hostname = "mackhaymond.co";
      return redirect(url.toString(), 301);
    }
    if (req.method !== "GET" && req.method !== "HEAD") return new Response("Method not allowed", { status: 405 });

    const session = await getSession(req, env);

    if (PUBLIC_PATHS.has(url.pathname)) {
      if (url.pathname === "/robots.txt") return new Response("User-agent: *\nAllow: /$\nDisallow: /\n");
      // Logged in: the launchpad is home. `/?public` is the deliberate way back.
      if (session && !url.searchParams.has("public")) return redirect(PROTECTED_ENTRY);
      return html(renderHome(PUBLIC_CATALOG.filter((e) => e.featured), session));
    }

    if (!session) {
      if (!env.ACCESS_AUD) return new Response("Cloudflare Access is not configured", { status: 503 });
      // Access sits in front of /dash, so arriving there without a valid owner token means a
      // non-owner or a bypassed edge: refuse. Anything else private goes through /dash to log in.
      if (url.pathname === PROTECTED_ENTRY) return new Response("Forbidden", { status: 403 });
      return redirect(`${PROTECTED_ENTRY}?next=${encodeURIComponent(url.pathname + url.search)}`);
    }

    switch (url.pathname) {
      case "/dash": {
        const next = url.searchParams.get("next");
        if (next?.startsWith("/") && !next.startsWith("//")) return redirect(next);
        const nonce = crypto.randomUUID().replace(/-/g, "");
        return html(renderDash(await catalog(env), session, nonce), { private: true, nonce });
      }
      case "/api/status": {
        const body = JSON.stringify(await status(await catalog(env)));
        return new Response(body, { headers: { "content-type": "application/json", "cache-control": "private, max-age=60" } });
      }
      default:
        return html(renderNotFound(), { status: 404, private: true });
    }
  },
} satisfies ExportedHandler<Env>;
