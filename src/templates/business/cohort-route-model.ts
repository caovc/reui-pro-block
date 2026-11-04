/** Bricklane route adapter for the existing Cohort demo state. */
const pagePaths: Record<string, string> = {
  Dashboard: "/dashboard",
  Approvals: "/approvals",
  People: "/people",
  Hiring: "/hiring/pipeline",
  "Time off": "/time/time-off",
  Timesheets: "/time/timesheets",
  Organisation: "/settings/organisation",
  Policies: "/settings/policies",
  "Approval flows": "/settings/approval-flows",
  Profile: "/settings/profile",
  Preferences: "/settings/preferences",
  Security: "/settings/security",
};

export interface CohortRoute {
  mount: string;
  query: string;
  page: string | null;
  department: string | null;
}

export function readCohortRoute(hash: string): CohortRoute {
  const clean = hash.replace(/^#/, "");
  const queryIndex = clean.indexOf("?");
  const path = (queryIndex < 0 ? clean : clean.slice(0, queryIndex)).replace(/\/$/, "");
  const query = queryIndex < 0 ? "" : clean.slice(queryIndex);
  const mount = path.match(/^\/(?:templates|template-preview)\/cohort(?=\/|$)/)?.[0] ?? "";
  const suffix = path.slice(mount.length);
  const params = new URLSearchParams(query);
  let page = Object.entries(pagePaths).find(([, route]) => route === suffix)?.[0] ?? null;
  if (!suffix) page = params.get("cohortView") === "calendar" ? "Time" : "Dashboard";
  return { mount, query, page, department: page === "People" ? params.get("department") : null };
}

function queryForPage(query: string, page: string, department?: string) {
  // Leave unrelated preset/theme bytes intact while replacing navigation filters.
  const entries = query
    .replace(/^\?/, "")
    .split("&")
    .filter(Boolean)
    .filter((entry) => {
      const key = new URLSearchParams(entry).keys().next().value ?? "";
      return !["department", "cohortView"].includes(key);
    });
  if (page === "People" && department) entries.push(`department=${encodeURIComponent(department)}`);
  // The existing local calendar view has no newly verified public route.
  if (page === "Time") entries.push("cohortView=calendar");
  return entries.length ? `?${entries.join("&")}` : "";
}

export function cohortPageHref(hash: string, page: string, department?: string): string {
  const { mount, query } = readCohortRoute(hash);
  const normalized = page === "Settings" ? "Organisation" : page === "Directory" ? "People" : page;
  return `#${mount}${pagePaths[normalized] ?? ""}${queryForPage(query, normalized, department)}`;
}
