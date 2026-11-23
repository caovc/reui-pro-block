export type FluxRunView = "Overview" | "All runs" | "Failures" | "Run tree";
const paths: Record<FluxRunView, string> = {
  Overview: "",
  "All runs": "/runs/all-runs",
  Failures: "/runs/failures",
  "Run tree": "/runs",
};

/** Recognizes only this template's observed run routes, preserving opaque preset queries. */
export function readFluxRunRoute(hash: string) {
  const value = hash.replace(/^#/, "");
  const queryAt = value.indexOf("?");
  const path = (queryAt < 0 ? value : value.slice(0, queryAt)).replace(/\/$/, "");
  const query = queryAt < 0 ? "" : value.slice(queryAt);
  const host = path.match(/^\/(?:templates|template-preview)\/([^/]+)(?=\/|$)/);
  const foreign = Boolean(host && host[1] !== "flux");
  const mount = host?.[1] === "flux" ? host[0] : "";
  const suffix = path.slice(mount.length);
  const view = foreign
    ? null
    : (Object.entries(paths).find(([, candidate]) => candidate === suffix)?.[0] as
        | FluxRunView
        | undefined);
  return {
    mount,
    query,
    view: view ?? null,
    owned: !foreign && (Boolean(mount) || view !== undefined),
  };
}

export function fluxRunHref(hash: string, view: FluxRunView) {
  const route = readFluxRunRoute(hash);
  if (!route.owned) return hash;
  return `#${route.mount}${paths[view]}${route.query}`;
}
