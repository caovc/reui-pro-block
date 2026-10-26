import type { SettingsFieldDefinition } from "@/blocks/application/dialog-variants/workspace/settings-panel";

export const lucentInitialPreferences = {
  projectName: "Delivery Console",
  apiEndpoint: "api.bricklane.example",
  weekStart: "Monday",
  accent: "#64748b",
  region: "United States",
  currency: "USD · US Dollar",
  dateFormat: "MM/DD/YYYY",
  shortcuts: true,
  spellcheck: true,
  compact: false,
  reduceMotion: false,
};

export const lucentInitialOrigins = [
  "https://console.bricklane.example",
  "https://api.bricklane.example",
  "https://status.bricklane.example",
];

export const lucentGeneralFields: readonly SettingsFieldDefinition[] = [
  {
    id: "projectName",
    label: "Project name",
    description: "The display name for this workspace across the console.",
  },
  {
    id: "apiEndpoint",
    label: "API endpoint",
    description: "Set the base URL for your project API.",
    prefix: "https://",
  },
  {
    id: "weekStart",
    label: "Start of week",
    description: "Choose which day marks the start of your week.",
    options: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
  },
];

export const lucentRegions = [
  "United States",
  "European Union",
  "United Kingdom",
  "Japan",
  "Australia",
] as const;

export const lucentCurrencies = [
  "USD · US Dollar",
  "EUR · Euro",
  "GBP · British Pound",
  "JPY · Japanese Yen",
] as const;

export const lucentDateFormats = ["MM/DD/YYYY", "DD/MM/YYYY", "YYYY/MM/DD"] as const;

export const lucentAccentColors = [
  { value: "#64748b", label: "Slate" },
  { value: "#f43f5e", label: "Rose" },
  { value: "#f97316", label: "Orange" },
  { value: "#8b5cf6", label: "Violet" },
  { value: "#10b981", label: "Emerald" },
  { value: "#0ea5e9", label: "Sky" },
];

export const lucentInterfacePreferences = [
  {
    id: "shortcuts",
    title: "Enable keyboard shortcuts.",
    description: "Use shortcuts to speed up your workflow.",
  },
  {
    id: "spellcheck",
    title: "Auto spell-check.",
    description: "Highlight spelling errors in text fields.",
  },
  {
    id: "compact",
    title: "Compact Mode.",
    description: "Reduce spacing for a denser interface layout.",
  },
  {
    id: "reduceMotion",
    title: "Reduce animations.",
    description: "Minimize motion effects throughout the UI.",
  },
] as const;

export const lucentInitialNotifications = {
  delivery: "In-app and pager",
  digest: "Hourly",
  quietHours: "22:00 to 07:00",
  critical: true,
  grouped: true,
  watching: "Services I own",
  environments: "Production only",
  flagChanges: false,
  certificateExpiry: true,
};

export type LucentNotificationValues = typeof lucentInitialNotifications;

type NotificationRule = {
  id: keyof LucentNotificationValues;
  label: string;
  description: string;
  options?: readonly string[];
  badge?: { label: string; tone: "green" | "blue" | "purple" | "orange" };
};

export const lucentNotificationGroups: readonly {
  id: string;
  title: string;
  rules: readonly NotificationRule[];
}[] = [
  {
    id: "delivery",
    title: "Alert delivery",
    rules: [
      {
        id: "delivery",
        label: "Where alerts arrive",
        description: "Choose the channel critical events are sent to.",
        options: ["In-app only", "In-app and email", "In-app and pager", "All channels"],
      },
      {
        id: "digest",
        label: "Digest cadence",
        description: "How often non-critical events are batched.",
        options: ["Immediately", "Hourly", "Twice daily"],
      },
      {
        id: "quietHours",
        label: "Quiet hours",
        description: "Hold non-critical alerts outside working hours.",
        options: [
          "Off",
          "20:00 to 08:00",
          "22:00 to 07:00",
          "Weekends too",
          "Follow the roster",
          "Follow my calendar",
          "Custom window",
        ],
      },
      {
        id: "critical",
        label: "Page on critical",
        description: "Break through quiet hours for a failed production deploy.",
        badge: { label: "Recommended", tone: "green" },
      },
      {
        id: "grouped",
        label: "Group by service",
        description: "Collapse repeated events from the same service.",
        badge: { label: "Feed", tone: "blue" },
      },
    ],
  },
  {
    id: "subscriptions",
    title: "Subscriptions",
    rules: [
      {
        id: "watching",
        label: "What you are watching",
        description: "Limit the feed to the services you own.",
        options: ["Everything", "Services I own", "Services I am on-call for"],
        badge: { label: "Personal", tone: "purple" },
      },
      {
        id: "environments",
        label: "Environments",
        description: "Which environments generate notifications.",
        options: ["Production only", "Production and staging"],
      },
      {
        id: "flagChanges",
        label: "Feature flag changes",
        description: "Notify when a flag reaches a new rollout stage.",
        badge: { label: "Noisy", tone: "orange" },
      },
      {
        id: "certificateExpiry",
        label: "Certificate expiry",
        description: "Warn ahead of every managed certificate renewal.",
      },
    ],
  },
];
