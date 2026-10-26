import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  initialIntegrations,
  initialMembers,
  initialWebhooks,
  type FlowlySettingsSection,
  type FlowlyIntegration,
  type FlowlyMember,
  type FlowlyWebhook,
} from "./flowly-settings-data";

export type SettingsDialog =
  | { kind: "member"; id: string; mode: "details" | "access" }
  | { kind: "invite" }
  | { kind: "integration"; id: string; tab: "overview" | "settings"; confirmDisconnect?: boolean }
  | { kind: "integration-create"; service?: string }
  | { kind: "webhook"; id: string; tab: "overview" | "settings"; confirmDelete?: boolean }
  | { kind: "webhook-create" }
  | { kind: "sessions" }
  | null;

export function useFlowlySettingsModel(initialSection: FlowlySettingsSection | null = null) {
  const [section, setActiveSection] = useState<FlowlySettingsSection | null>(initialSection);
  const [collapsed, setCollapsed] = useState(false);
  const [members, setMembers] = useState<FlowlyMember[]>(() => structuredClone(initialMembers));
  const [integrations, setIntegrations] = useState<FlowlyIntegration[]>(() =>
    structuredClone(initialIntegrations),
  );
  const [webhooks, setWebhooks] = useState<FlowlyWebhook[]>(() => structuredClone(initialWebhooks));
  const [dialog, setActiveDialog] = useState<SettingsDialog>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  function setDialog(next: SettingsDialog, trigger?: HTMLElement | null) {
    if (next && (!dialog || trigger))
      returnFocusRef.current =
        trigger ??
        document.querySelector<HTMLElement>('button[aria-haspopup="menu"][data-state="open"]') ??
        (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    setActiveDialog(next);
  }
  const [runsPaused, setRunsPaused] = useState(false);
  const [sessions, setSessions] = useState(3);
  const [resetRequest, setResetRequest] = useState<{ email: string; at: string } | null>(null);
  const [modelTests, setModelTests] = useState(0);
  function setSection(next: FlowlySettingsSection | null) {
    setActiveSection(next);
    setActiveDialog(null);
  }
  function updateMembers(next: FlowlyMember[], message: string) {
    const previous = members;
    setMembers(next);
    toast.success(message, {
      description: "Local demo only; no invitation or account request was sent.",
      action: { label: "Undo", onClick: () => setMembers(previous) },
    });
  }
  function updateIntegrations(next: FlowlyIntegration[], message: string) {
    const previous = integrations;
    setIntegrations(next);
    toast.success(message, {
      description: "Local demo only; no service connection was changed.",
      action: { label: "Undo", onClick: () => setIntegrations(previous) },
    });
  }
  function updateWebhooks(next: FlowlyWebhook[], message: string) {
    const previous = webhooks;
    setWebhooks(next);
    toast.success(message, {
      description: "Local demo only; no endpoint was contacted.",
      action: { label: "Undo", onClick: () => setWebhooks(previous) },
    });
  }
  return {
    section,
    setSection,
    collapsed,
    setCollapsed,
    members,
    integrations,
    webhooks,
    dialog,
    setDialog,
    returnFocusRef,
    updateMembers,
    updateIntegrations,
    updateWebhooks,
    runsPaused,
    setRunsPaused,
    sessions,
    setSessions,
    resetRequest,
    setResetRequest,
    modelTests,
    setModelTests,
  };
}
export type FlowlySettingsModel = ReturnType<typeof useFlowlySettingsModel>;

export function downloadSettingsCsv(name: string, rows: readonly Record<string, unknown>[]) {
  const keys = rows.length ? Object.keys(rows[0]) : ["status"];
  const cell = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const text = [
    keys.map(cell).join(","),
    ...rows.map((row) => keys.map((key) => cell(row[key])).join(",")),
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `bricklane-${name}.csv`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
