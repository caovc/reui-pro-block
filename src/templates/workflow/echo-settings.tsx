import { Children, Fragment, useState, type ReactNode } from "react";
import {
  Bell,
  CreditCard,
  Database,
  Laptop,
  Monitor,
  Moon,
  Shield,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Sun,
  User,
} from "lucide-react";
import {
  SettingsFields,
  SettingsRow,
  SettingsChoice,
  type SettingsFieldDefinition,
} from "@/blocks/application/dialog-variants/workspace/settings-panel";
import { LocalAvatarUpload } from "@/blocks/application/dialog-variants/workspace/free/avatar-upload";
import {
  Frame,
  FrameHeader,
  FrameTitle,
  FrameDescription,
  FramePanel,
  FrameFooter,
} from "@/components/reui/frame";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertTitle, AlertDescription, AlertAction } from "@/components/reui/alert";
import { FieldError, FieldLabel, FieldGroup, FieldSeparator } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { setGlobalTheme, useGlobalTheme } from "@/components/site/global-theme-store";
import {
  echoAboutFields,
  echoBillingFields,
  echoModels,
  echoProfileDetails,
  echoProfileFields,
  echoSettingsSections,
  echoSettingsInitial,
  type EchoSettingsModel,
  type EchoSettingsSection,
} from "./echo-settings-data";
import type { EchoChatHistory } from "./echo-chat-data";
import "./echo-settings.css";

function SettingsCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Frame variant="ghost" className="echo-settings-card">
      <FramePanel className="echo-settings-card-panel">
        <FrameHeader>
          <FrameTitle>{title}</FrameTitle>
          <FrameDescription>{description}</FrameDescription>
        </FrameHeader>
        <FieldGroup className="echo-settings-card-fields">
          {Children.toArray(children).map((child, index) => (
            <Fragment key={index}>
              {index > 0 && <FieldSeparator />}
              {child}
            </Fragment>
          ))}
        </FieldGroup>
        {footer && <FrameFooter>{footer}</FrameFooter>}
      </FramePanel>
    </Frame>
  );
}
const sectionIcons = [SlidersHorizontal, Sparkles, User, Bell, Database, Shield, CreditCard];
type ConfirmAction = "archive" | "delete-chats" | "delete-account" | null;
export function EchoSettings({
  model,
  history,
  onDeleteAccount,
}: {
  model: EchoSettingsModel;
  history: EchoChatHistory;
  onDeleteAccount: () => void;
}) {
  const chats = history.records.filter((chat) => !chat.archived);
  const archived = history.records.filter((chat) => chat.archived);
  const shared = history.records.filter((chat) => chat.sharedUrl);
  const { section, setSection, draft, saved, errors, status, change, immediate, save, cancel } =
    model;
  const { theme } = useGlobalTheme();
  const [dialog, setDialog] = useState<
    "memories" | "links" | "archived" | "plan" | "payment" | null
  >(null);
  const [confirm, setConfirm] = useState<ConfirmAction>(null);
  const [password, setPassword] = useState({ current: "", next: "", confirm: "" });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const { paymentLast4, setPaymentLast4 } = model;
  const [paymentDraft, setPaymentDraft] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [nextPlan, setNextPlan] = useState("Pro");
  const fields = (definitions: SettingsFieldDefinition[], onChange = change) =>
    definitions.map((field) => (
      <SettingsFields
        key={field.id}
        fields={[
          {
            ...field,
            error: errors[field.id],
            badge:
              field.id === "email" &&
              saved.email === echoSettingsInitial.email &&
              draft.email === saved.email ? (
                <Badge variant="outline">Verified</Badge>
              ) : (
                field.badge
              ),
          },
        ]}
        value={draft}
        onValueChange={onChange}
        idPrefix="echo-settings"
      />
    ));
  const switchRow = (
    id: string,
    title: string,
    description: string,
    instant = false,
    badge?: ReactNode,
  ) => (
    <SettingsRow id={`echo-settings-${id}`} title={title} description={description} badge={badge}>
      <Switch
        id={`echo-settings-${id}`}
        aria-describedby={`echo-settings-${id}-description`}
        checked={Boolean(draft[id])}
        onCheckedChange={(value) => (instant ? immediate : change)(id, value)}
      />
    </SettingsRow>
  );
  function chooseSection(value: string) {
    setSection(value as EchoSettingsSection);
    model.setStatus("");
  }
  function footer(kind: "cancel" | "reset" = "cancel", label = "Save changes") {
    return (
      <>
        {kind === "reset" ? (
          <Button variant="outline" onClick={model.resetNotifications}>
            Reset
          </Button>
        ) : (
          <Button variant="outline" onClick={() => cancel()}>
            Cancel
          </Button>
        )}
        <Button onClick={() => save()}>{label}</Button>
      </>
    );
  }
  function updatePassword() {
    const next: Record<string, string> = {};
    if (!password.current) next.current = "Enter your current password.";
    if (password.next.length < 12) next.next = "Use at least 12 characters.";
    if (!password.confirm || password.confirm !== password.next)
      next.confirm = "Repeat the new password.";
    setPasswordErrors(next);
    if (!Object.keys(next).length) {
      setPassword({ current: "", next: "", confirm: "" });
      model.setStatus("Password updated in this local preview. No account service is connected.");
    }
  }
  function exportChats() {
    const url = URL.createObjectURL(
      new Blob([history.exportMarkdown()], { type: "text/markdown" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "bricklane-chats.md";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    model.setStatus("Chat export downloaded.");
  }
  const about = (
    <>
      <SettingsCard title="About you" description="What the assistant knows" footer={footer()}>
        {echoAboutFields.map((field) => {
          const id = `echo-settings-${field.id}`;
          const props = {
            id,
            value: String(draft[field.id]),
            onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
              change(field.id, event.target.value),
            "aria-describedby": `${id}-description`,
            maxLength: field.maxLength ?? 160,
            placeholder:
              field.id === "nickname"
                ? "shadcn"
                : field.id === "occupation"
                  ? "Platform engineer, billing team"
                  : "Short answers. Code first, explanation after, and only when it is not obvious.",
          };
          return (
            <SettingsRow key={field.id} id={id} title={field.label} description={field.description}>
              {field.type === "textarea" ? <Textarea {...props} /> : <Input {...props} />}
            </SettingsRow>
          );
        })}
      </SettingsCard>
      <SettingsCard title="Memory" description="What carries between chats">
        {switchRow(
          "memory",
          "Memory for new chats",
          "Where new chats start; the header toggle is per session.",
          true,
        )}
        <SettingsRow title="Saved memories" description={`${model.memories.length} things kept.`}>
          <Button variant="outline" onClick={() => setDialog("memories")}>
            Manage
          </Button>
        </SettingsRow>
      </SettingsCard>
    </>
  );
  const profile = (
    <>
      {model.profilePrompt && (
        <Alert variant="warning" className="echo-profile-notice">
          <User />
          <AlertTitle>Complete your profile.</AlertTitle>
          <AlertDescription>Keep your role and timezone current.</AlertDescription>
          <AlertAction>
            <Button variant="outline" size="sm" onClick={() => model.setProfilePrompt(false)}>
              Dismiss
            </Button>
            <Button
              size="sm"
              onClick={() => document.getElementById("echo-settings-name")?.focus()}
            >
              Update
            </Button>
          </AlertAction>
        </Alert>
      )}
      <SettingsCard title="My profile" description="Public account details" footer={footer()}>
        <SettingsRow title="Photo" description="Shown in comments and mentions.">
          <LocalAvatarUpload
            key={String(draft.avatar)}
            label="Upload profile image"
            defaultAvatar={String(draft.avatar || "")}
            onFileChange={(file) => {
              if (file?.file instanceof File) {
                const reader = new FileReader();
                reader.onload = () => change("avatar", String(reader.result));
                reader.readAsDataURL(file.file);
              }
            }}
            onDefaultRemove={() => change("avatar", "")}
          />
        </SettingsRow>
        {fields(echoProfileFields)}
        <SettingsRow
          title="Profile details"
          description="Public details shared across the workspace."
        >
          <div className="echo-settings-compound">{fields(echoProfileDetails.slice(0, 3))}</div>
        </SettingsRow>
        {fields(echoProfileDetails.slice(3))}
      </SettingsCard>
    </>
  );
  const notifications = (
    <>
      <SettingsCard title="Activity alerts" description="Desktop and badge">
        {switchRow("desktop", "Desktop notifications", "Show alerts for mentions and approvals.")}
        <SettingsRow title="Quiet hours" description="Hold non-urgent alerts outside your workday.">
          <div className="echo-settings-pair">
            {[
              {
                id: "quietStart",
                label: "Start",
                options: ["6:00 PM", "8:00 PM", "10:00 PM", "11:00 PM"],
              },
              {
                id: "quietEnd",
                label: "End",
                options: ["6:00 AM", "8:00 AM", "9:00 AM", "10:00 AM"],
              },
            ].map(({ id, label, options }) => (
              <div key={id}>
                <FieldLabel htmlFor={`echo-settings-${id}`}>{label}</FieldLabel>
                <SettingsChoice
                  id={`echo-settings-${id}`}
                  value={String(draft[id])}
                  options={options}
                  onChange={(value) => change(id, value)}
                />
              </div>
            ))}
          </div>
        </SettingsRow>
        {switchRow("unread", "Unread badge", "Display a badge when new activity arrives.")}
        {fields([
          {
            id: "dismiss",
            label: "Auto dismiss",
            description: "Choose how long alerts stay visible.",
            options: ["5 minutes", "10 minutes", "15 minutes", "30 minutes"],
          },
        ])}
      </SettingsCard>
      <SettingsCard
        title="Email updates"
        description="Inbox preferences"
        footer={footer("reset", "Save preferences")}
      >
        {switchRow("team", "Team communication", "Messages, approvals, and activity summaries.")}
        {switchRow(
          "announcements",
          "Product announcements",
          "Releases, improvements, and launches.",
        )}
        {switchRow("digest", "Weekly digest", "A recap of workspaces, mentions, and tasks.")}
        {fields([
          {
            id: "cadence",
            label: "Digest cadence",
            description: "Set how often summary emails arrive.",
            options: ["Daily summary", "Weekly digest", "Only mentions"],
          },
        ])}
      </SettingsCard>
    </>
  );
  const data = (
    <SettingsCard title="Data controls" description="Conversations and their data">
      <SettingsRow
        title="Shared links"
        description={
          shared.length
            ? `${shared.length} chat${shared.length === 1 ? " has" : "s have"} a link.`
            : "No chat has a link."
        }
      >
        <Button variant="outline" onClick={() => setDialog("links")}>
          Manage
        </Button>
      </SettingsRow>
      <SettingsRow
        title="Archived chats"
        description={`${archived.length} chats out of the sidebar.`}
      >
        <Button variant="outline" onClick={() => setDialog("archived")}>
          Manage
        </Button>
      </SettingsRow>
      <SettingsRow title="Archive all chats" description="Clears the sidebar; nothing is lost.">
        <Button variant="outline" onClick={() => setConfirm("archive")} disabled={!chats.length}>
          Archive all
        </Button>
      </SettingsRow>
      <SettingsRow title="Delete all chats" description="Every local chat, archived ones included.">
        <Button
          variant="outline"
          className="border-transparent bg-destructive/10 text-destructive"
          onClick={() => setConfirm("delete-chats")}
          disabled={!chats.length && !archived.length}
        >
          Delete all
        </Button>
      </SettingsRow>
      <SettingsRow title="Export data" description="One Markdown file of every chat.">
        <Button variant="outline" onClick={exportChats}>
          Export
        </Button>
      </SettingsRow>
    </SettingsCard>
  );
  const security = (
    <>
      <SettingsCard
        title="Change password"
        description="Access protection"
        footer={<Button onClick={updatePassword}>Update password</Button>}
      >
        <SettingsRow
          id="echo-password-current"
          title="Current password"
          description="Verify your identity before making changes."
          invalid={Boolean(passwordErrors.current)}
        >
          <Input
            id="echo-password-current"
            type="password"
            autoComplete="current-password"
            placeholder="Enter current password"
            value={password.current}
            aria-invalid={Boolean(passwordErrors.current)}
            aria-describedby={
              passwordErrors.current
                ? "echo-password-current-error"
                : "echo-password-current-description"
            }
            onChange={(event) =>
              setPassword((current) => ({ ...current, current: event.target.value }))
            }
          />
          {passwordErrors.current && (
            <FieldError id="echo-password-current-error">{passwordErrors.current}</FieldError>
          )}
        </SettingsRow>
        <SettingsRow
          title="New password"
          description="Use at least 12 characters and a unique phrase."
        >
          <div className="echo-password-fields">
            {[
              { id: "next", label: "New password", placeholder: "Create a new password" },
              { id: "confirm", label: "Confirm password", placeholder: "Confirm the new password" },
            ].map(({ id, label, placeholder }) => (
              <div key={id}>
                <FieldLabel htmlFor={`echo-password-${id}`}>{label}</FieldLabel>
                <Input
                  id={`echo-password-${id}`}
                  type="password"
                  autoComplete="new-password"
                  placeholder={placeholder}
                  value={password[id as "next" | "confirm"]}
                  aria-invalid={Boolean(passwordErrors[id])}
                  aria-describedby={passwordErrors[id] ? `echo-password-${id}-error` : undefined}
                  onChange={(event) =>
                    setPassword((current) => ({ ...current, [id]: event.target.value }))
                  }
                />
                {passwordErrors[id] && (
                  <FieldError id={`echo-password-${id}-error`}>{passwordErrors[id]}</FieldError>
                )}
              </div>
            ))}
          </div>
        </SettingsRow>
      </SettingsCard>
      <SettingsCard title="Two-step verification" description="Extra sign-in checks">
        {switchRow(
          "authenticator",
          "Authenticator app",
          "Use one-time codes from an app.",
          true,
          <Badge variant="outline">Recommended</Badge>,
        )}
        {fields(
          [
            {
              id: "phone",
              label: "Recovery phone",
              description: "Used if you lose access to your authenticator app.",
              prefix: "+1",
            },
            {
              id: "delivery",
              label: "Delivery method",
              description: "Choose how backup verification requests are delivered.",
              options: ["Authenticator first", "SMS fallback", "Email fallback"],
            },
          ],
          immediate,
        )}
        {switchRow("trusted", "Trusted devices", "Skip repeat prompts on known devices.", true)}
      </SettingsCard>
      <SettingsCard title="Active sessions" description="Signed-in devices">
        <SettingsRow
          title={
            <span className="echo-session-name">
              <Laptop />
              Chrome on macOS<Badge variant="outline">Current</Badge>
            </span>
          }
          description="San Francisco, CA. · Active now"
        >
          <Button variant="outline" disabled>
            This device
          </Button>
        </SettingsRow>
        {model.sessions.map((session, index) => (
          <SettingsRow
            key={session}
            title={
              <span className="echo-session-name">
                {index === 0 ? <Smartphone /> : <Laptop />}
                {session}
              </span>
            }
            description={
              index === 0 ? "San Francisco, CA. · 2 hours ago" : "New York, NY. · 3 days ago"
            }
          >
            <Button
              variant="outline"
              onClick={() =>
                model.setSessions((current) => current.filter((name) => name !== session))
              }
            >
              Revoke
            </Button>
          </SettingsRow>
        ))}
      </SettingsCard>
      <SettingsCard title="Delete account" description="Irreversible changes">
        <SettingsRow
          title="Close account"
          description="Permanently remove your local account, sessions, and recovery settings."
        >
          <div>
            <p className="mb-2 text-muted-foreground">This action cannot be undone.</p>
            <Button variant="destructive" onClick={() => setConfirm("delete-account")}>
              Delete account
            </Button>
          </div>
        </SettingsRow>
      </SettingsCard>
    </>
  );
  const billing = (
    <>
      <SettingsCard title="Plan and billing" description="Current subscription">
        {[
          {
            name: "Free",
            price: "$0",
            cadence: "forever, 1 workspace, Basic exports, Community support",
          },
          { name: "Pro", price: "$29", cadence: "per month, Unlimited workspaces, Advanced tools" },
          {
            name: "Team",
            price: "$79",
            cadence: "per month, Everything in Pro, SSO, Shared workspace",
          },
        ].map(({ name, price, cadence }) => (
          <SettingsRow
            key={name}
            title={
              <>
                {name}
                {model.plan === name && <Badge variant="outline">Current</Badge>}
              </>
            }
            description={
              <span className="echo-plan-description">
                <span>{price}</span> / {cadence}
              </span>
            }
          >
            <Button
              variant={model.plan === name ? "outline" : "ghost"}
              onClick={() => {
                setNextPlan(name);
                setDialog("plan");
              }}
            >
              {model.plan === name ? "Manage" : "Switch"}
            </Button>
          </SettingsRow>
        ))}
      </SettingsCard>
      <SettingsCard
        title="Billing details"
        description="Invoices and payments"
        footer={<Button onClick={() => save("Billing")}>Update billing</Button>}
      >
        {fields([
          { ...echoBillingFields[0], description: "Receives invoices and renewal notices." },
        ])}
        <SettingsRow
          title="Invoice profile"
          description="Business details used on receipts and tax forms."
        >
          <div className="echo-settings-compound">{fields(echoBillingFields.slice(1, 3))}</div>
        </SettingsRow>
        {fields([
          {
            ...echoBillingFields[3],
            description: "Optional number used for VAT or company invoices.",
          },
        ])}
        <SettingsRow title="Card on file" description="Used for monthly renewals.">
          <div className="echo-payment-control">
            <span>Visa ending in {paymentLast4}</span>
            <Button
              variant="outline"
              onClick={() => {
                setPaymentDraft("");
                setPaymentError("");
                setDialog("payment");
              }}
            >
              Update
            </Button>
          </div>
        </SettingsRow>
      </SettingsCard>
    </>
  );
  const panels: Record<EchoSettingsSection, ReactNode> = {
    General: (
      <SettingsCard title="General" description="Appearance and defaults">
        <SettingsRow title="Appearance" description="Light, dark, or your device.">
          <ToggleGroup
            type="single"
            value={theme.mode === "inherit" ? "system" : theme.mode}
            onValueChange={(value) =>
              value && setGlobalTheme({ ...theme, mode: value as typeof theme.mode })
            }
            aria-label="Appearance"
            className="echo-appearance"
          >
            {[
              { id: "light", label: "Light", icon: Sun },
              { id: "dark", label: "Dark", icon: Moon },
              { id: "system", label: "System", icon: Monitor },
            ].map(({ id, label, icon: Icon }) => (
              <ToggleGroupItem key={id} value={id} aria-label={label}>
                <Icon />
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </SettingsRow>
        {fields(
          [
            {
              id: "defaultModel",
              label: "Default model",
              description: "Used by every new chat.",
              options: echoModels,
            },
          ],
          immediate,
        )}
        {switchRow("dictation", "Dictation", "Microphone in the composer.", true)}
      </SettingsCard>
    ),
    Personalization: about,
    "My Profile": profile,
    Notifications: notifications,
    "Data controls": data,
    Security: security,
    Billing: billing,
  };
  return (
    <div className="echo-settings-scroller">
      <section className="echo-settings-content" aria-labelledby="echo-settings-heading">
        <header className="echo-settings-heading">
          <h1 id="echo-settings-heading">Account Settings</h1>
          <p>Preferences, profile, notifications, data and billing for this workspace.</p>
        </header>
        <Tabs value={section} onValueChange={chooseSection} className="echo-settings-tabs">
          <div className="echo-settings-rail-scroll">
            <TabsList aria-label="Account settings sections" className="echo-settings-rail">
              {echoSettingsSections.map((name, index) => {
                const Icon = sectionIcons[index];
                return (
                  <TabsTrigger key={name} value={name}>
                    <Icon />
                    {name}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>
          <div className="echo-settings-sections">
            {echoSettingsSections.map((name) => (
              <TabsContent key={name} value={name} className="echo-settings-section">
                {panels[name]}
              </TabsContent>
            ))}
            {status && (
              <p role="status" className="echo-settings-status">
                {status}
              </p>
            )}
          </div>
        </Tabs>
      </section>
      <Dialog open={dialog !== null} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent className="reui-reference echo-settings-dialog">
          <DialogHeader>
            <DialogTitle>
              {dialog === "memories"
                ? "Saved memories"
                : dialog === "links"
                  ? "Shared links"
                  : dialog === "archived"
                    ? "Archived chats"
                    : dialog === "plan"
                      ? `${nextPlan} plan`
                      : "Update payment method"}
            </DialogTitle>
            <DialogDescription>
              {dialog === "memories"
                ? "Used to personalise answers."
                : dialog === "links"
                  ? "Anyone with a link can open the chat."
                  : dialog === "archived"
                    ? "Out of the sidebar, still here."
                    : "Local preview only. No payment is processed."}
            </DialogDescription>
          </DialogHeader>
          {dialog === "memories" ? (
            <>
              <div className="echo-settings-dialog-list">
                {model.memories.map((memory, index) => (
                  <div key={memory}>
                    <div>
                      <p>{memory}</p>
                      <small>
                        Learned {["2h", "Yesterday", "Aug 28", "Aug 21", "Aug 14"][index % 5]}
                      </small>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        model.setMemories((current) => current.filter((text) => text !== memory))
                      }
                    >
                      Delete
                    </Button>
                  </div>
                ))}
                {!model.memories.length && <p>No saved memories.</p>}
              </div>
              <Button
                variant="outline"
                className="justify-self-end"
                disabled={!model.memories.length}
                onClick={() => model.setMemories([])}
              >
                Delete all
              </Button>
            </>
          ) : dialog === "links" ? (
            shared.length ? (
              <div className="echo-settings-dialog-list">
                {shared.map((chat) => (
                  <div key={chat.id}>
                    <div>
                      <p>{chat.title}</p>
                      <a
                        href={chat.sharedUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs underline"
                      >
                        Open local shared chat
                      </a>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => history.update(chat.id, { sharedUrl: undefined })}
                    >
                      Remove link
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={() =>
                    shared.forEach((chat) => history.update(chat.id, { sharedUrl: undefined }))
                  }
                >
                  Delete all links
                </Button>
              </div>
            ) : (
              <div className="py-8 text-center">
                <strong>No conversation has been shared yet</strong>
                <p className="mt-2 text-muted-foreground">Shared chat links appear here.</p>
                <Button variant="outline" className="mt-5" disabled>
                  Delete all links
                </Button>
              </div>
            )
          ) : dialog === "archived" ? (
            <div className="echo-settings-dialog-list">
              {archived.map((chat) => (
                <div key={chat.id}>
                  <p>{chat.title}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => history.update(chat.id, { archived: false })}
                  >
                    Restore
                  </Button>
                </div>
              ))}
              {!archived.length && <p>No archived chats.</p>}
            </div>
          ) : dialog === "plan" ? (
            <>
              <p>
                {nextPlan === model.plan
                  ? `Your current local plan is ${model.plan}.`
                  : `Switch this preview from ${model.plan} to ${nextPlan}.`}
              </p>
              <Button
                onClick={() => {
                  model.setPlan(nextPlan);
                  model.setStatus(`${nextPlan} plan selected locally. No payment was processed.`);
                  setDialog(null);
                }}
              >
                {nextPlan === model.plan ? "Done" : `Switch to ${nextPlan}`}
              </Button>
            </>
          ) : (
            <>
              <FieldLabel htmlFor="echo-payment-last4">Card last four digits</FieldLabel>
              <Input
                id="echo-payment-last4"
                inputMode="numeric"
                maxLength={4}
                value={paymentDraft}
                onChange={(event) => setPaymentDraft(event.target.value.replace(/\D/g, ""))}
                aria-invalid={Boolean(paymentError)}
              />
              {paymentError && <FieldError>{paymentError}</FieldError>}
              <Button
                onClick={() => {
                  if (paymentDraft.length !== 4) {
                    setPaymentError("Enter exactly four digits.");
                    return;
                  }
                  setPaymentLast4(paymentDraft);
                  setDialog(null);
                  model.setStatus("Local payment label updated. No card data was sent.");
                }}
              >
                Update local card
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog open={confirm !== null} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent className="reui-reference">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm === "archive"
                ? `Archive all ${chats.length} chats?`
                : confirm === "delete-chats"
                  ? `Delete all ${chats.length + archived.length} chats?`
                  : "Delete your local account?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "archive"
                ? "They leave the sidebar and stay in Archived chats, where you can restore any of them."
                : confirm === "delete-chats"
                  ? "Every local conversation will be removed, archived ones included. This cannot be undone."
                  : "Every local conversation, project and scheduled task goes with it. Export your data first if you want a copy. This preview does not delete an external account."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant={confirm === "archive" ? "default" : "destructive"}
              onClick={() => {
                if (confirm === "archive") {
                  history.archiveAll();
                } else if (confirm === "delete-chats") {
                  history.removeAll();
                } else {
                  onDeleteAccount();
                  model.clearAccount();
                }
                setConfirm(null);
              }}
            >
              {confirm === "archive"
                ? "Archive all"
                : confirm === "delete-chats"
                  ? "Delete all"
                  : "Delete local account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
