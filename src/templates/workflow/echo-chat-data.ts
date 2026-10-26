import { useState } from "react";

export type EchoMessage = { role: string; text: string };
export type EchoChat = {
  id: string;
  title: string;
  period: "Today" | "Yesterday" | "Older";
  pinned: boolean;
  archived: boolean;
  messages: EchoMessage[];
  sharedUrl?: string;
  changed: string;
};
const titles = [
  "Stripe webhook 500s on charge.refunded",
  "Admin guide refresh",
  "Audit log export limits",
  "Rate limit the export endpoint",
  "Search returns stale titles after rename",
  "Retry budget for the events consumer",
  "Churn by plan tier",
  "Mobile onboarding revamp scope",
  "Why is p95 latency up on eu-west",
  "Compacting long transcripts",
  "Cursor pagination for the audit log",
  "Feature flag cleanup after 3.4",
  "Debounce on the search input",
  "Design review: the collapsed rail",
  "Keyboard traps in the command dialog",
  "Session timeout wording",
];
function seedMessages(title: string): EchoMessage[] {
  return [
    { role: "user", text: title },
    {
      role: "assistant",
      text: `Here is the saved workspace context for “${title}”.\n\n1. Confirm the expected behavior and reproduce the issue.\n2. Review the relevant changes and capture a small test case.\n3. Ship the fix with a rollback plan and monitor the outcome.\n\nThis is a local interactive preview; no AI service is connected.`,
    },
  ];
}
function initialChats(): EchoChat[] {
  const initial = titles.map((title, index): EchoChat => ({
    id: `echo-chat-${index + 1}`,
    title,
    period: index < 7 ? "Today" : index < 12 ? "Yesterday" : "Older",
    pinned: index < 3,
    archived: index >= 13,
    messages: seedMessages(title),
    changed: [
      "2m",
      "1h",
      "5h",
      "12m",
      "34m",
      "2h",
      "3h",
      "Yesterday",
      "Yesterday",
      "Yesterday",
      "Yesterday",
      "Yesterday",
      "Aug 22",
      "Aug 28",
      "Aug 26",
      "Aug 21",
    ][index],
  }));
  try {
    const query = new URLSearchParams(location.hash.split("?")[1]);
    const encoded = query.get("shared");
    if (!encoded) return initial;
    const data = JSON.parse(
      new TextDecoder().decode(Uint8Array.from(atob(encoded), (char) => char.charCodeAt(0))),
    );
    if (
      typeof data.id !== "string" ||
      typeof data.title !== "string" ||
      !Array.isArray(data.messages)
    )
      return initial;
    const messages = data.messages.filter(
      (message: EchoMessage) =>
        message &&
        typeof message.text === "string" &&
        (message.role === "user" || message.role === "assistant"),
    );
    const shared: EchoChat = {
      id: data.id.slice(0, 100),
      title: data.title.slice(0, 200),
      messages,
      pinned: false,
      archived: false,
      period: "Today",
      sharedUrl: location.href,
      changed: "Shared",
    };
    return [shared, ...initial.filter((chat) => chat.id !== shared.id)];
  } catch {
    return initial;
  }
}
function sharedId() {
  try {
    return new URLSearchParams(location.hash.split("?")[1]).get("chat");
  } catch {
    return null;
  }
}
export function useEchoChatHistory() {
  const [records, setRecords] = useState<EchoChat[]>(initialChats);
  const [activeId, setActiveId] = useState<string | null>(sharedId);
  const active = records.find((chat) => chat.id === activeId);
  function update(id: string, patch: Partial<EchoChat>) {
    setRecords((current) => current.map((chat) => (chat.id === id ? { ...chat, ...patch } : chat)));
  }
  function open(title: string) {
    const existing = records.find((chat) => chat.title === title);
    const chat = existing ?? {
      id: crypto.randomUUID(),
      title,
      period: "Today" as const,
      pinned: false,
      archived: false,
      messages: seedMessages(title),
      changed: "Now",
    };
    if (!existing) setRecords((current) => [chat, ...current]);
    setActiveId(chat.id);
    return chat;
  }
  function commit(title: string, messages: EchoMessage[]) {
    if (active) {
      update(active.id, { messages, changed: "Now" });
      return active.title;
    }
    let uniqueTitle = title;
    let suffix = 2;
    while (records.some((chat) => chat.title === uniqueTitle))
      uniqueTitle = `${title} (${suffix++})`;
    const chat: EchoChat = {
      id: crypto.randomUUID(),
      title: uniqueTitle,
      messages,
      changed: "Now",
      period: "Today",
      pinned: false,
      archived: false,
    };
    setRecords((current) => [chat, ...current]);
    setActiveId(chat.id);
    return uniqueTitle;
  }
  function rename(id: string, title: string) {
    const value = title.trim();
    if (
      !value ||
      records.some((chat) => chat.id !== id && chat.title.toLowerCase() === value.toLowerCase())
    )
      return false;
    update(id, { title: value });
    return true;
  }
  function share(id: string) {
    const chat = records.find((entry) => entry.id === id);
    if (!chat) return "";
    const payload = JSON.stringify({ id: chat.id, title: chat.title, messages: chat.messages });
    const encoded = btoa(
      Array.from(new TextEncoder().encode(payload), (byte) => String.fromCharCode(byte)).join(""),
    );
    const url = `${location.origin}${location.pathname}#/template-preview/echo?chat=${encodeURIComponent(chat.id)}&shared=${encodeURIComponent(encoded)}`;
    update(id, { sharedUrl: url });
    return url;
  }
  function remove(id: string) {
    setRecords((current) => current.filter((chat) => chat.id !== id));
    if (activeId === id) setActiveId(null);
  }
  function archive(id: string) {
    update(id, { archived: true, pinned: false });
    if (activeId === id) setActiveId(null);
  }
  function archiveAll() {
    setRecords((current) => current.map((chat) => ({ ...chat, archived: true, pinned: false })));
    setActiveId(null);
  }
  function removeAll() {
    setRecords([]);
    setActiveId(null);
  }
  function exportMarkdown() {
    return [
      "# Bricklane Chat export",
      ...records.map((chat) =>
        [
          `## ${chat.title}`,
          chat.archived ? "Archived conversation." : "",
          ...chat.messages.map(
            (message) => `### ${message.role === "user" ? "You" : "Assistant"}\n\n${message.text}`,
          ),
        ]
          .filter(Boolean)
          .join("\n\n"),
      ),
    ].join("\n\n");
  }
  return {
    records,
    active,
    activeId,
    setActiveId,
    open,
    commit,
    update,
    rename,
    share,
    remove,
    archive,
    archiveAll,
    removeAll,
    exportMarkdown,
  };
}
export type EchoChatHistory = ReturnType<typeof useEchoChatHistory>;
