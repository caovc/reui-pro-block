/** Bricklane-authored fixtures. Public Filespace audit establishes domains and
 * navigation shape, not mutation outcomes; the reducer below is a local demo.
 * No original portraits, document bytes, logos, or private source are used. */
export type DriveHeaderTarget =
  | {
      kind: "view";
      view: "My Drive" | "Shared With Me" | "Favourites" | "Bin" | "Recent";
    }
  | { kind: "folder"; name: string }
  | { kind: "file"; name: string }
  | {
      kind: "settings";
      section: "profile" | "workspace" | "team" | "billing";
      memberSlug?: string;
    };

/** Both callbacks are required: links must have a useful copyable destination,
 * while ordinary activation updates the actual host view or settings model.
 * A placeholder href plus a callback is not a complete routing integration. */
export type DriveHeaderNavigation = {
  href: (target: DriveHeaderTarget) => string;
  onNavigate: (target: DriveHeaderTarget) => void;
};

export type DriveHelpGuide = {
  id: string;
  group: "Working with files" | "Getting work back" | "Workspace";
  title: string;
  description: string;
  icon: "upload" | "share" | "star" | "trash" | "history" | "storage" | "people" | "workspace";
  target: DriveHeaderTarget;
  badge?: string;
};

export const driveHelpGuides: readonly DriveHelpGuide[] = [
  {
    id: "adding-files",
    group: "Working with files",
    title: "Adding files",
    description: "Upload a document or organize your files into folders.",
    icon: "upload",
    target: { kind: "view", view: "My Drive" },
  },
  {
    id: "sharing-access",
    group: "Working with files",
    title: "Sharing and access",
    description: "Find shared files and manage who can open them.",
    icon: "share",
    target: { kind: "view", view: "Shared With Me" },
  },
  {
    id: "favourites",
    group: "Working with files",
    title: "Favourites",
    description: "Keep important files close by starring them.",
    icon: "star",
    target: { kind: "view", view: "Favourites" },
  },
  {
    id: "restore-bin",
    group: "Getting work back",
    title: "Restoring from the Bin",
    description: "Review removed files and restore the ones you need.",
    icon: "trash",
    target: { kind: "view", view: "Bin" },
    badge: "30 days",
  },
  {
    id: "recent-change",
    group: "Getting work back",
    title: "Finding a recent change",
    description: "Browse the files that changed most recently.",
    icon: "history",
    target: { kind: "view", view: "Recent" },
  },
  {
    id: "storage-plan",
    group: "Workspace",
    title: "Storage and plan",
    description: "See storage usage, invoices, and your current plan.",
    icon: "storage",
    target: { kind: "settings", section: "billing" },
  },
  {
    id: "people-roles",
    group: "Workspace",
    title: "People and roles",
    description: "Review your team and their access roles.",
    icon: "people",
    target: { kind: "settings", section: "team" },
  },
  {
    id: "workspace-details",
    group: "Workspace",
    title: "Workspace details",
    description: "Update the name and preferences of your workspace.",
    icon: "workspace",
    target: { kind: "settings", section: "workspace" },
  },
];

export type DriveHeaderNotification = {
  id: string;
  kind:
    | "share"
    | "comment"
    | "access"
    | "attachment"
    | "joined"
    | "retention"
    | "device"
    | "mention"
    | "backup"
    | "payment"
    | "integration";
  actor?: string;
  actorSlug?: string;
  title: string;
  description: string;
  time: string;
  unread: boolean;
  target?: DriveHeaderTarget;
  targetLabel?: string;
};

export const driveHeaderNotifications: readonly DriveHeaderNotification[] = [
  {
    id: "folder-shared",
    kind: "share",
    actor: "Theo Park",
    actorSlug: "theo-park",
    title: "shared a folder with you",
    description: "Your team now has a place for reusable design files.",
    time: "5 minutes ago",
    unread: true,
    target: { kind: "folder", name: "Brand Library" },
    targetLabel: "Brand Library",
  },
  {
    id: "file-comment",
    kind: "comment",
    actor: "Sana Qureshi",
    actorSlug: "sana-qureshi",
    title: "commented on Q3 Studio Plan.pdf",
    description: "“The outline is ready for a final review.”",
    time: "18 minutes ago",
    unread: true,
  },
  {
    id: "access-request",
    kind: "access",
    actor: "Priya Patel",
    actorSlug: "priya-patel",
    title: "requested access",
    description: "Requested Edit access to Brand Library.",
    time: "32 minutes ago",
    unread: true,
  },
  {
    id: "file-attachment",
    kind: "attachment",
    actor: "Nora Vale",
    actorSlug: "nora-vale",
    title: "added a document",
    description: "An original sample agreement is ready to download.",
    time: "1 hour ago",
    unread: false,
  },
  {
    id: "people-joined",
    kind: "joined",
    title: "Two people joined your workspace",
    description: "Nora Vale and Theo Park are ready to collaborate.",
    time: "2 hours ago",
    unread: true,
    target: { kind: "settings", section: "team" },
    targetLabel: "View team",
  },
  {
    id: "bin-retention",
    kind: "retention",
    title: "A few files in the Bin need a review",
    description: "Removed files are retained for 30 days in this demo.",
    time: "Today",
    unread: false,
    target: { kind: "view", view: "Bin" },
    targetLabel: "Review trash",
  },
  {
    id: "new-device",
    kind: "device",
    title: "A new device signed in",
    description: "Chrome on macOS · Brooklyn, US · Demo session",
    time: "Today",
    unread: false,
  },
  {
    id: "file-mention",
    kind: "mention",
    actor: "Theo Park",
    actorSlug: "theo-park",
    title: "mentioned you in a comment",
    description: "“Can you check the delivery checklist before Friday?”",
    time: "Yesterday",
    unread: false,
  },
  {
    id: "backup-complete",
    kind: "backup",
    title: "Backup complete",
    description: "12 demo files were included in the scheduled snapshot.",
    time: "Yesterday",
    unread: false,
    target: { kind: "folder", name: "Studio Operations" },
    targetLabel: "Studio Operations",
  },
  {
    id: "payment-history",
    kind: "payment",
    title: "A billing receipt is available",
    description: "$24.00 · Historical demo receipt, not a new charge.",
    time: "2 days ago",
    unread: false,
    target: { kind: "settings", section: "billing" },
    targetLabel: "View billing",
  },
  {
    id: "integration-connected",
    kind: "integration",
    title: "Team chat connection is ready",
    description: "Demo connection · File activity can appear in your team channel.",
    time: "3 days ago",
    unread: false,
  },
];

export const driveNotificationAttachment = {
  name: "bricklane-sample-agreement.pdf",
  lines: [
    "Bricklane - original demonstration agreement",
    "Prepared for the fictional Bricklane studio.",
    "This document demonstrates a local file download.",
    "It creates no contract, payment, or remote account change.",
  ],
} as const;

export type DriveHeaderActivityState = {
  readIds: readonly string[];
  access: "pending" | "granted" | "denied";
  device: "pending" | "revoked" | "recognized";
};

export type DriveHeaderActivityAction =
  | { type: "read-all" }
  | { type: "read"; id: string }
  | { type: "access"; decision: "granted" | "denied" }
  | { type: "device"; decision: "revoked" | "recognized" };

export function createDriveHeaderActivity(): DriveHeaderActivityState {
  return {
    readIds: driveHeaderNotifications.filter((entry) => !entry.unread).map((entry) => entry.id),
    access: "pending",
    device: "pending",
  };
}

export function driveHeaderActivityReducer(
  state: DriveHeaderActivityState,
  action: DriveHeaderActivityAction,
): DriveHeaderActivityState {
  switch (action.type) {
    case "read-all":
      return { ...state, readIds: driveHeaderNotifications.map((entry) => entry.id) };
    case "read":
      return state.readIds.includes(action.id) ||
        !driveHeaderNotifications.some((entry) => entry.id === action.id)
        ? state
        : { ...state, readIds: [...state.readIds, action.id] };
    case "access":
      return state.access === "pending"
        ? {
            ...state,
            access: action.decision,
            readIds: Array.from(new Set([...state.readIds, "access-request"])),
          }
        : state;
    case "device":
      return state.device === "pending" ? { ...state, device: action.decision } : state;
  }
}
