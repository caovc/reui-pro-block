import { useState } from "react";

export const verveCalendarProviders = ["Google Calendar", "Microsoft Outlook", "CalDAV"] as const;
export type VerveCalendarDraft = {
  provider: (typeof verveCalendarProviders)[number];
  account: string;
  calendar: string;
};
/** This is an in-memory demo connection, with no OAuth, permissions or external requests. */
export function useVerveCalendarModel(profileEmail: string) {
  const [connection, setConnection] = useState<VerveCalendarDraft | null>(null);
  const [draft, setDraft] = useState<VerveCalendarDraft>({
    provider: "Google Calendar",
    account: profileEmail,
    calendar: "Work calendar",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof VerveCalendarDraft, string>>>({});
  const [notice, setNotice] = useState("");
  function begin() {
    setDraft(
      connection
        ? { ...connection }
        : { provider: "Google Calendar", account: profileEmail, calendar: "Work calendar" },
    );
    setErrors({});
  }
  function update<K extends keyof VerveCalendarDraft>(key: K, value: VerveCalendarDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }
  function save() {
    const next = {
      ...draft,
      account: draft.account.trim().toLowerCase(),
      calendar: draft.calendar.trim(),
    };
    const issues: typeof errors = {};
    if (!verveCalendarProviders.includes(next.provider))
      issues.provider = "Choose a calendar provider.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next.account))
      issues.account = "Enter a valid calendar account email.";
    if (!next.calendar || next.calendar.length > 120)
      issues.calendar = "Enter a calendar name of 1 to 120 characters.";
    setErrors(issues);
    if (Object.keys(issues).length) return false;
    setConnection(next);
    setNotice(
      `${next.provider} connected locally for ${next.account}. No external calendar was accessed or synced.`,
    );
    return true;
  }
  function disconnect() {
    setConnection(null);
    setNotice("Local calendar connection removed. No external account was changed.");
  }
  return { connection, draft, errors, notice, begin, update, save, disconnect };
}
export type VerveCalendarModel = ReturnType<typeof useVerveCalendarModel>;
