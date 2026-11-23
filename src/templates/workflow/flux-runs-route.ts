import { useCallback, useEffect, useState } from "react";
import { fluxRunHref, readFluxRunRoute, type FluxRunView } from "./flux-runs-route-model";

const isRunView = (view: string): view is FluxRunView => view === "All runs" || view === "Failures";

/** The remaining Flux views retain their existing session-local navigation contract. */
export function useFluxRunRoute() {
  const [view, setView] = useState<string>(
    () => readFluxRunRoute(window.location.hash).view ?? "Overview",
  );
  useEffect(() => {
    const sync = () => setView(readFluxRunRoute(window.location.hash).view ?? "Overview");
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("popstate", sync);
    };
  }, []);
  const navigate = useCallback((requested: string) => {
    const next = requested === "Runs" ? "All runs" : requested;
    const current = readFluxRunRoute(window.location.hash);
    if (isRunView(next)) {
      const href = fluxRunHref(window.location.hash, next);
      if (href !== window.location.hash) window.location.hash = href;
    } else if (current.view === "All runs" || current.view === "Failures") {
      // Clear an owned run suffix while retaining this existing non-run view locally.
      window.history.pushState(
        window.history.state,
        "",
        fluxRunHref(window.location.hash, "Overview"),
      );
    }
    setView(next);
  }, []);
  return { view, navigate, href: (next: FluxRunView) => fluxRunHref(window.location.hash, next) };
}
