import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { setGlobalTheme, useGlobalTheme } from "@/components/site/global-theme-store";
import { StrataAuth } from "./strata-auth";
import { StrataShell } from "./strata-shell";
import { StrataOverview } from "./strata-overview";
import { useStrataJobsModel } from "./strata-jobs-model";
import { StrataServices } from "./strata-services";
import { useStrataServicesModel } from "./strata-services-model";
import { StrataLogs } from "./strata-logs";
import { useStrataLogsModel } from "./strata-logs-model";
import { StrataMonitors } from "./strata-monitors";
import { useStrataMonitorsModel } from "./strata-monitors-model";
import { StrataReleases } from "./strata-releases";
import { StrataReleaseBoard } from "./strata-release-board";
import { useStrataReleasesModel } from "./strata-releases-model";
import { StrataCalendar } from "./strata-calendar";
import { strataCalendarPresetForRoute, useStrataCalendarModel } from "./strata-calendar-model";
import { StrataSources } from "./strata-sources";
import { useStrataSourcesModel } from "./strata-sources-model";
import { StrataSettings } from "./strata-settings";
import {
  useStrataSettingsModel,
  readStrataSettingsTab,
  type StrataSettingsTab,
} from "./strata-settings-model";
import { useStrataSettingsApiModel } from "./strata-settings-api-model";
import { useStrataSettingsSecurityModel } from "./strata-settings-security-model";
import { useStrataSettingsBillingModel } from "./strata-settings-billing-model";
import { StrataWorkspaceForm } from "./strata-workspace-form";
import { useStrataWorkspacesModel } from "./strata-workspaces-model";
import { readStrataRoute, strataOverviewHref, useStrataRoute } from "./strata-routing";
import type { StrataEnvironmentFilter, StrataPageProps, StrataRoute } from "./strata-domain";

const accountTabs: Record<string, StrataSettingsTab> = {
  Profile: "profile",
  General: "general",
  "API keys": "api-keys",
  Security: "security",
  Billing: "billing",
};
const landingRoutes: Record<string, StrataRoute> = {
  Overview: "/",
  Services: "/services",
  Monitors: "/monitors",
  Logs: "/logs",
};

/** Independent local observability demo; no monitoring or identity service is contacted. */
export default function Strata() {
  const router = useStrataRoute();
  const jobs = useStrataJobsModel();
  const services = useStrataServicesModel();
  const logs = useStrataLogsModel();
  const monitors = useStrataMonitorsModel();
  const releases = useStrataReleasesModel();
  const calendar = useStrataCalendarModel();
  const sources = useStrataSourcesModel();
  const settings = useStrataSettingsModel();
  const apiModel = useStrataSettingsApiModel();
  const securityModel = useStrataSettingsSecurityModel();
  const billingModel = useStrataSettingsBillingModel();
  const workspaces = useStrataWorkspacesModel();
  const { theme, dark } = useGlobalTheme();
  const workspaceTrigger = useRef<HTMLButtonElement>(null);
  const accountTrigger = useRef<HTMLButtonElement>(null);
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [environments, setEnvironments] = useState<
    Partial<Record<StrataRoute, StrataEnvironmentFilter>>
  >({});
  const [pinnedRoutes, setPinnedRoutes] = useState<StrataRoute[]>([
    "/services/checkout-api",
    "/monitors/api-acme-com",
    "/logs/errors-payments",
    "/calendar/on-call-payments",
  ]);
  const togglePin = (path: StrataRoute) =>
    setPinnedRoutes((current) =>
      current.includes(path) ? current.filter((item) => item !== path) : [...current, path],
    );
  const navigate = router.navigate;
  const route = router.route;
  const props: StrataPageProps = {
    environment: (route && environments[route]) || "all",
    onEnvironmentChange: (environment) => {
      if (route) setEnvironments((current) => ({ ...current, [route]: environment }));
    },
    onNavigate: navigate,
    pinnedRoutes,
    onTogglePin: togglePin,
  };
  const themeMode =
    theme.mode === "light" || theme.mode === "dark" || theme.mode === "system"
      ? theme.mode
      : dark
        ? "dark"
        : "light";
  const colorTheme = themeMode[0].toUpperCase() + themeMode.slice(1);
  const settingsModel = {
    ...settings,
    general: { ...settings.general, colorTheme },
  };
  const settingsTab = readStrataSettingsTab(readStrataRoute(window.location.hash)?.query ?? "");

  if (!route)
    return (
      <div className="grid min-h-dvh place-content-center justify-items-center gap-4 p-6">
        <h1 className="text-xl font-semibold">Page not found</h1>
        <Button asChild>
          <a href={strataOverviewHref(window.location.hash)}>Back to Overview</a>
        </Button>
      </div>
    );

  if (route === "/sign-in" || route === "/sign-up")
    return (
      <StrataAuth
        key={route}
        mode={route === "/sign-in" ? "sign-in" : "sign-up"}
        href={router.href}
        onNavigate={navigate}
        onContinue={() => {
          toast.info("Demo workspace opened. Authentication is not connected.");
          navigate(landingRoutes[settings.general.landing] ?? "/");
        }}
      />
    );

  const content =
    route === "/" ? (
      <StrataOverview {...props} model={jobs} />
    ) : route === "/services" || route === "/services/checkout-api" ? (
      <StrataServices
        {...props}
        model={services}
        presetServiceId={route === "/services/checkout-api" ? "checkout-api" : undefined}
      />
    ) : route === "/logs" || route === "/logs/errors-payments" ? (
      <StrataLogs
        {...props}
        model={logs}
        preset={route === "/logs/errors-payments" ? "errors-payments" : "default"}
      />
    ) : route === "/monitors" || route === "/monitors/api-acme-com" ? (
      <StrataMonitors
        {...props}
        model={monitors}
        preset={route === "/monitors/api-acme-com" ? "api-acme-com" : undefined}
      />
    ) : route === "/deployments" ? (
      <StrataReleases {...props} model={releases} />
    ) : route === "/deployments/board" ? (
      <StrataReleaseBoard {...props} model={releases} />
    ) : route === "/calendar" || route === "/calendar/on-call-payments" ? (
      <StrataCalendar {...props} model={calendar} preset={strataCalendarPresetForRoute(route)} />
    ) : route === "/sources" ? (
      <StrataSources {...props} model={sources} />
    ) : (
      <StrataSettings
        tab={settingsTab}
        onTabChange={router.settingsTab}
        model={settingsModel}
        apiModel={apiModel}
        securityModel={securityModel}
        billingModel={billingModel}
      />
    );
  return (
    <>
      <StrataShell
        route={route}
        href={router.href}
        onNavigate={navigate}
        workspace={workspaces.selectedIndex}
        workspaceOptions={workspaces.workspaces}
        onWorkspaceChange={workspaces.select}
        workspaceTriggerRef={workspaceTrigger}
        onCreateWorkspace={() => setCreateWorkspaceOpen(true)}
        accountTriggerRef={accountTrigger}
        account={{
          name: settings.savedProfile.name,
          email: settings.savedProfile.email,
          description: `${settings.savedProfile.team} workspace`,
          avatar: settings.savedProfile.photo,
        }}
        onAccountAction={(action) => {
          if (action === "Sign Out") setSignOutOpen(true);
          else if (accountTabs[action]) router.settingsTab(accountTabs[action]);
        }}
        themeMode={themeMode}
        onThemeChange={(mode) => {
          settings.changeGeneral("colorTheme", mode[0].toUpperCase() + mode.slice(1));
          setGlobalTheme({ ...theme, mode });
        }}
        pinnedRoutes={pinnedRoutes}
        onTogglePin={togglePin}
      >
        {content}
      </StrataShell>
      <StrataWorkspaceForm
        open={createWorkspaceOpen}
        onOpenChange={setCreateWorkspaceOpen}
        onCreate={workspaces.create}
        ownerName={settings.savedProfile.name}
        returnFocusRef={workspaceTrigger}
      />
      <AlertDialog open={signOutOpen} onOpenChange={setSignOutOpen}>
        <AlertDialogContent
          onCloseAutoFocus={(event) => {
            const trigger = accountTrigger.current;
            if (trigger?.isConnected && trigger.getClientRects().length) {
              event.preventDefault();
              trigger.focus({ preventScroll: true });
            }
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out?</AlertDialogTitle>
            <AlertDialogDescription>
              You will need to sign in again to reach your workspaces.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate("/sign-in")}>Sign out</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
