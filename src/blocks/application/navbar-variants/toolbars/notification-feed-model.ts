import { useState } from "react";
import { notifications } from "./data";
import type { NotificationFilter, NotificationsFeedItem } from "./notifications";

export type NotificationsFeedModel = {
  readIds: readonly string[];
  dismissedIds: readonly string[];
  filter: NotificationFilter;
  invitation: string | null;
  actionResults: Readonly<Record<string, string>>;
  markAllRead: () => void;
  toggleRead: (id: string) => void;
  dismiss: (id: string) => void;
  setFilter: (filter: NotificationFilter) => void;
  respondToInvitation: (id: string, response: "Accepted" | "Declined") => void;
  performLocalAction: (id: string, action: string) => void;
};

// The parent may retain this local model across Sidebar remounts.
export function useNotificationsFeedModel(
  items: readonly NotificationsFeedItem[] = notifications,
): NotificationsFeedModel {
  const [readIds, setReadIds] = useState(() =>
    items.filter((item) => !item.unread).map((item) => item.id),
  );
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [invitation, setInvitation] = useState<string | null>(null);
  const [actionResults, setActionResults] = useState<Record<string, string>>({});

  const markRead = (id: string) => {
    setReadIds((current) => [...new Set([...current, id])]);
  };

  return {
    readIds,
    dismissedIds,
    filter,
    invitation,
    actionResults,
    markAllRead: () => setReadIds(items.map((item) => item.id)),
    toggleRead: (id) => {
      setReadIds((current) =>
        current.includes(id) ? current.filter((readId) => readId !== id) : [...current, id],
      );
    },
    dismiss: (id) => {
      setDismissedIds((current) => [...new Set([...current, id])]);
    },
    setFilter,
    respondToInvitation: (id, response) => {
      setInvitation(response);
      markRead(id);
    },
    performLocalAction: (id, action) => {
      setActionResults((current) => ({
        ...current,
        [id]: `${action} selected locally; no remote action was performed.`,
      }));
      markRead(id);
    },
  };
}
