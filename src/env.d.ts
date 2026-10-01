interface Env {
  CATALOG: KVNamespace;
  ASSETS: Fetcher;
  ACCESS_TEAM_DOMAIN: string;
  ACCESS_AUD: string;
  OWNER_EMAILS: string;
  /** "1" in .dev.vars only: treats every request as the owner for local development. */
  DEV?: string;
}
