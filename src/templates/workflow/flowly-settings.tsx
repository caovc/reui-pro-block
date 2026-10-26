import { useEffect, useRef, useState } from "react";
import {
  Bot,
  Building2,
  ChevronRight,
  CreditCard,
  Download,
  KeyRound,
  Link,
  LogOut,
  Pause,
  Play,
  Plus,
  Puzzle,
  ScrollText,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  Webhook,
} from "lucide-react";
import { toast } from "sonner";
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import { CollapseHandle } from "@/blocks/application/shells/chrome";
import { FlowlyFormPage } from "./flowly-settings-fields";
import {
  FlowlyMembersPage,
  FlowlyMemberDrawer,
  FlowlyInviteDrawer,
} from "./flowly-settings-members";
import {
  FlowlyIntegrationsPage,
  FlowlyIntegrationDrawer,
  FlowlyIntegrationWizard,
} from "./flowly-settings-integrations";
import {
  FlowlyWebhooksPage,
  FlowlyWebhookDrawer,
  FlowlyWebhookCreate,
} from "./flowly-settings-webhooks";
import {
  settingsGroups,
  settingsTitles,
  settingsHeaderActions,
  settingsSummaries,
} from "./flowly-settings-data";
import { downloadSettingsCsv, type FlowlySettingsModel } from "./flowly-settings-model";
import "@/blocks/application/shells/shells.css";
import "./flowly-settings.css";

export type { FlowlySettingsModel } from "./flowly-settings-model";
export type { FlowlySettingsSection } from "./flowly-settings-data";
const sectionIcons = {
  general: Settings,
  members: Users,
  billing: CreditCard,
  execution: Play,
  "ai-models": Sparkles,
  integrations: Puzzle,
  webhooks: Webhook,
  "audit-log": ScrollText,
  profile: UserRound,
  security: ShieldCheck,
};

/** Actual free SidebarGroup/Menu composition; Navigation adapter forces close on mobile. */
export function FlowlySettingsNavigation({ model }: { model: FlowlySettingsModel }) {
  return (
    <div className="fs-navigation" aria-label="Settings navigation">
      <SidebarContent className="fs-navigation-content">
        {settingsGroups.map((group) => (
          <SidebarGroup key={group.label} className="fs-navigation-group">
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.sections.map((section) => {
                  const Icon = sectionIcons[section];
                  return (
                    <SidebarMenuItem key={section}>
                      <SidebarMenuButton
                        isActive={model.section === section}
                        aria-current={model.section === section ? "page" : undefined}
                        onClick={() => model.setSection(section)}
                      >
                        <Icon />
                        <span>{settingsTitles[section]}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="fs-navigation-footer">
        <FlowlySettingsSummary model={model} />
      </SidebarFooter>
    </div>
  );
}

export function FlowlySettingsSummary({ model }: { model: FlowlySettingsModel }) {
  const section = model.section ?? "general";
  const entry = settingsSummaries[section];
  const Icon = section === "general" ? Building2 : sectionIcons[section];
  let value = entry.value;
  let detail = entry.detail;
  let progress: number | undefined;
  if (section === "members") {
    value = `${model.members.length} of 10`;
    detail = `${Math.max(0, 10 - model.members.length)} seats left on the Pro plan, ${model.members.filter((member) => member.status === "Invited").length} invited.`;
  }
  if (section === "integrations") {
    const connected = model.integrations.filter((item) => item.status !== "Needs setup").length;
    value = `${connected} of ${model.integrations.length}`;
    detail = model.integrations.some((item) => item.status === "Needs setup")
      ? `${model.integrations
          .filter((item) => item.status === "Needs setup")
          .map((item) => item.name)
          .join(", ")} is not connected yet.`
      : "All integrations are connected in the local demo.";
    progress = (connected / Math.max(1, model.integrations.length)) * 100;
  }
  if (section === "execution" && model.runsPaused) {
    value = "Paused";
    detail = "New local demo runs wait in the queue until you resume.";
  }
  if (section === "security" && model.sessions === 1) {
    value = "Reviewed";
    detail = "1 local demo session remains. Other demo sessions were signed out.";
  }
  if (section === "ai-models") progress = 68;
  return (
    <section className="fs-summary">
      <div>
        <Icon />
        <strong>{entry.title}</strong>
        <Badge variant="outline" className={section === "integrations" ? "fs-purple" : ""}>
          {value}
        </Badge>
      </div>
      <p>{detail}</p>
      {progress !== undefined && (
        <Progress value={progress} aria-label={`${entry.title} progress`} />
      )}
    </section>
  );
}

export function FlowlySettingsBreadcrumb({ model }: { model: FlowlySettingsModel }) {
  return (
    <span className="fs-breadcrumb">
      <Button variant="ghost" size="sm" onClick={() => model.setSection(null)}>
        Settings
      </Button>
      {model.section && (
        <>
          <ChevronRight />
          <span>{settingsTitles[model.section]}</span>
        </>
      )}
    </span>
  );
}

export function FlowlySettingsHeaderAction({ model }: { model: FlowlySettingsModel }) {
  const [busySection, setBusySection] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const section = model.section;
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const busy = busySection === section;
  if (!section) return null;
  const Icon =
    section === "general"
      ? Link
      : section === "members" || section === "billing" || section === "audit-log"
        ? Download
        : section === "execution"
          ? model.runsPaused
            ? Play
            : Pause
          : section === "ai-models"
            ? Bot
            : section === "profile"
              ? KeyRound
              : section === "security"
                ? LogOut
                : Plus;
  async function action() {
    if (section === "general") {
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Workspace link copied");
      } catch {
        toast.error("Copy failed", { description: "Clipboard access was blocked." });
      }
      return;
    }
    if (section === "members") {
      downloadSettingsCsv(
        "members",
        model.members.map((member) => ({
          name: member.name,
          email: member.email,
          role: member.role,
          team: member.team,
          access: member.level,
          status: member.status,
          areas: member.areas.join("; "),
        })),
      );
      return;
    }
    if (section === "billing") {
      downloadSettingsCsv("invoices", [
        {
          invoice: "DEMO-2026-10",
          date: "2026-10-31",
          amount: "249.00",
          currency: "USD",
          status: "Local example",
        },
      ]);
      return;
    }
    if (section === "audit-log") {
      downloadSettingsCsv("audit-log", [
        {
          at: "2026-10-01T09:00:00Z",
          actor: "Nick Bold",
          event: "Demo workspace settings reviewed",
          source: "Local example",
        },
      ]);
      return;
    }
    if (section === "integrations") {
      model.setDialog({ kind: "integration-create" });
      return;
    }
    if (section === "webhooks") {
      model.setDialog({ kind: "webhook-create" });
      return;
    }
    if (section === "security") {
      model.setDialog({ kind: "sessions" });
      return;
    }
    if (section === "execution") {
      const previous = model.runsPaused;
      model.setRunsPaused(!previous);
      toast.success(previous ? "Demo runs resumed" : "Demo runs paused", {
        description: "Local preview only. No production runs were changed.",
        action: { label: "Undo", onClick: () => model.setRunsPaused(previous) },
      });
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    setBusySection(section);
    timer.current = setTimeout(() => {
      setBusySection(null);
      if (section === "profile") {
        const previous = model.resetRequest;
        model.setResetRequest({ email: "nick@brick.test", at: new Date().toISOString() });
        toast.success("Demo reset request recorded", {
          description: "No email was sent. This is a local password-reset example.",
          action: { label: "Undo", onClick: () => model.setResetRequest(previous) },
        });
      } else {
        model.setModelTests(model.modelTests + 1);
        toast.success("Demo model responded", {
          description: `Sample ${model.modelTests + 1}: 412 ms, 38 tokens. No external model was called.`,
        });
      }
    }, 650);
  }
  const label = busy
    ? section === "profile"
      ? "Sending"
      : "Testing"
    : section === "execution" && model.runsPaused
      ? "Resume All Runs"
      : settingsHeaderActions[section];
  return (
    <Button
      size="sm"
      className="fs-header-action"
      aria-label={label}
      disabled={busy}
      onClick={action}
    >
      <Icon />
      <span>{label}</span>
    </Button>
  );
}

export function FlowlySettingsBody({ model }: { model: FlowlySettingsModel }) {
  const section = model.section;
  return (
    <div className="fs-workspace" data-settings-section={section ?? "root"}>
      <div className="fs-secondary shell-reference" data-collapsed={model.collapsed}>
        <div hidden={model.collapsed}>
          <FlowlySettingsNavigation model={model} />
        </div>
        <CollapseHandle
          collapsed={model.collapsed}
          onToggle={() => model.setCollapsed(!model.collapsed)}
          label="inner sidebar"
        />
      </div>
      <div className="fs-page" key={section ?? "root"}>
        {section && <h1 className="sr-only">{settingsTitles[section]} Settings</h1>}
        {section === "members" ? (
          <FlowlyMembersPage model={model} />
        ) : section === "integrations" ? (
          <FlowlyIntegrationsPage model={model} />
        ) : section === "webhooks" ? (
          <FlowlyWebhooksPage model={model} />
        ) : section ? (
          <FlowlyFormPage section={section} />
        ) : null}
      </div>
      <FlowlySettingsDialogs model={model} />
    </div>
  );
}

function FlowlySettingsDialogs({ model }: { model: FlowlySettingsModel }) {
  const dialog = model.dialog;
  if (!dialog) return null;
  if (dialog.kind === "invite") return <FlowlyInviteDrawer model={model} />;
  if (dialog.kind === "member")
    return (
      <FlowlyMemberDrawer
        key={`${dialog.id}-${dialog.mode}`}
        model={model}
        id={dialog.id}
        mode={dialog.mode}
      />
    );
  if (dialog.kind === "integration-create")
    return (
      <FlowlyIntegrationWizard
        key={dialog.service ?? "new"}
        model={model}
        service={dialog.service}
      />
    );
  if (dialog.kind === "integration")
    return (
      <FlowlyIntegrationDrawer
        key={dialog.id}
        model={model}
        id={dialog.id}
        tab={dialog.tab}
        confirmDisconnect={dialog.confirmDisconnect}
      />
    );
  if (dialog.kind === "webhook-create") return <FlowlyWebhookCreate model={model} />;
  if (dialog.kind === "webhook")
    return (
      <FlowlyWebhookDrawer
        key={dialog.id}
        model={model}
        id={dialog.id}
        tab={dialog.tab}
        confirmDelete={dialog.confirmDelete}
      />
    );
  if (dialog.kind === "sessions")
    return (
      <AlertDialog
        open
        onOpenChange={(open) => {
          if (!open) model.setDialog(null);
        }}
      >
        <AlertDialogContent
          className="reui-reference"
          onCloseAutoFocus={(event) => {
            if (model.returnFocusRef.current?.isConnected) {
              event.preventDefault();
              model.returnFocusRef.current.focus();
            }
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Sign Out Everywhere?</AlertDialogTitle>
            <AlertDialogDescription>
              Every other local demo browser and device is signed out. This one stays signed in. No
              real account session is changed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const previous = model.sessions;
                model.setSessions(1);
                model.setDialog(null);
                toast.success("Other demo sessions signed out", {
                  description: "Your current local session stays signed in.",
                  action: { label: "Undo", onClick: () => model.setSessions(previous) },
                });
              }}
            >
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  return null;
}
