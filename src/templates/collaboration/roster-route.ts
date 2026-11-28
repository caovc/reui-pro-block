import { useSyncExternalStore } from "react";

// Keep the existing template mount and theme query while exposing the observed
// public Time destinations as independent routes in Bricklane's hash router.
const pagePaths: Record<string, string> = {
  Dashboard: "",
  Approvals: "/approvals",
  People: "/people/directory",
  Import: "/people/import",
  Hiring: "/hiring",
  "Time off": "/time/time-off",
  Timesheets: "/time/timesheets",
  Time: "/time/calendar",
  Organisation: "/settings/organisation",
  Policies: "/settings/policies",
  "Approval flows": "/settings/approval-flows",
  Profile: "/settings/profile",
  Preferences: "/settings/preferences",
};

function subscribe(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  window.addEventListener("popstate", onChange);
  return () => {
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener("popstate", onChange);
  };
}
const readHash = () => window.location.hash;

export function readRosterRoute(hash: string) {
  const [path, ...query] = hash.replace(/^#/, "").split("?");
  const mount = path.match(/^\/(?:templates|template-preview)\/roster(?=\/|$)/)?.[0] || "";
  const suffix = path.slice(mount.length).replace(/\/$/, "");
  const page = Object.entries(pagePaths).find(([, route]) => route === suffix)?.[0] || "Dashboard";
  return { mount, query: query.length ? `?${query.join("?")}` : "", page };
}

export function rosterPageHref(hash: string, page: string) {
  const { mount, query } = readRosterRoute(hash);
  const normalized =
    page === "Team calendar"
      ? "Time"
      : page === "Settings"
        ? "Organisation"
        : page === "Directory"
          ? "People"
          : page;
  return `#${mount}${pagePaths[normalized] || ""}${query}`;
}

export function useRosterRoute() {
  const hash = useSyncExternalStore(subscribe, readHash, () => "");
  return {
    view: readRosterRoute(hash).page,
    navigate(page: string) {
      const next = rosterPageHref(window.location.hash, page);
      if (window.location.hash !== next) window.location.hash = next;
    },
  };
}
