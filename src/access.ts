// Verifies the Cloudflare Access JWT. Access attaches it as a header on paths it protects; on the
// public homepage only the CF_Authorization cookie arrives, which is how `/` knows to send a
// logged-in owner straight to /dash. Checking here (not just trusting Access at the edge) means a
// misconfigured Access path can't expose anything private.

export interface Session {
  email: string;
}

interface Claims {
  aud: string | string[];
  iss: string;
  exp: number;
  email?: string;
}

const enc = new TextEncoder();
const dec = new TextDecoder();

function b64urlDecode(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4);
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

let certs: { team: string; at: number; keys: Map<string, CryptoKey> } | null = null;

async function signingKey(team: string, kid: string): Promise<CryptoKey | undefined> {
  const stale = !certs || certs.team !== team || Date.now() - certs.at > 3_600_000 || !certs.keys.has(kid);
  if (stale) {
    const res = await fetch(`https://${team}/cdn-cgi/access/certs`);
    if (!res.ok) throw new Error("could not fetch Cloudflare Access certs");
    const { keys } = await res.json<{ keys: (JsonWebKey & { kid: string })[] }>();
    const map = new Map<string, CryptoKey>();
    for (const k of keys) {
      map.set(k.kid, await crypto.subtle.importKey("jwk", k, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]));
    }
    certs = { team, at: Date.now(), keys: map };
  }
  return certs!.keys.get(kid);
}

function cookie(req: Request, name: string): string | undefined {
  for (const part of (req.headers.get("cookie") ?? "").split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
}

/** The owner's verified session, or null. Never throws: a bad token is just "not logged in". */
export async function getSession(req: Request, env: Env): Promise<Session | null> {
  if (env.DEV === "1") return { email: "dev@localhost" };
  const team = env.ACCESS_TEAM_DOMAIN;
  const aud = env.ACCESS_AUD;
  if (!team || !aud) return null; // fail closed until Access is configured
  const jwt = req.headers.get("cf-access-jwt-assertion") ?? cookie(req, "CF_Authorization");
  if (!jwt) return null;
  try {
    const [h, p, s] = jwt.split(".");
    const header = JSON.parse(dec.decode(b64urlDecode(h)));
    if (header.alg !== "RS256") return null;
    const key = await signingKey(team, header.kid);
    if (!key || !(await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64urlDecode(s), enc.encode(`${h}.${p}`)))) return null;
    const claims = JSON.parse(dec.decode(b64urlDecode(p))) as Claims;
    const auds = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (!auds.includes(aud) || claims.iss !== `https://${team}` || claims.exp * 1000 < Date.now()) return null;
    const owners = env.OWNER_EMAILS.split(",").map((e) => e.trim().toLowerCase());
    if (!claims.email || !owners.includes(claims.email.toLowerCase())) return null;
    return { email: claims.email };
  } catch {
    return null;
  }
}
