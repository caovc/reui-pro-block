import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  CreditCard,
  KeyRound,
  Link,
  Monitor,
  Settings,
  Shield,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import TechnicalPanel from "./technical";
import AccountPanel from "./account";
import { Brand, Head, Team, NewItem, SearchInput, toast } from "./shared";
import type { BlockProps, BlockMeta } from "@/data/types";
const connections = [
  ["Linear", "Project management", "Connected"],
  ["GitHub", "Code & repositories", "Connected"],
  ["Slack", "Messaging & notifications", "Connect"],
  ["Notion", "Documents & knowledge", "Connect"],
  ["Figma", "Design files & prototypes", "Connect"],
  ["Google Drive", "File storage", "Connect"],
];
function Pick({
  label,
  options = ["Select an option", "Option 1", "Option 2"],
  value,
}: {
  label: string;
  options?: string[];
  value?: string;
}) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Select defaultValue={value ?? options[0]}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  );
}
function TextField({
  label,
  placeholder,
  defaultValue,
  type = "text",
}: {
  label: string;
  placeholder?: string;
  defaultValue?: string;
  type?: string;
}) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Input type={type} placeholder={placeholder} defaultValue={defaultValue} aria-label={label} />
    </Field>
  );
}
function ToggleRow({
  title,
  description,
  checked = false,
}: {
  title: string;
  description: string;
  checked?: boolean;
}) {
  const [on, setOn] = useState(checked);
  return (
    <div className="flex items-center justify-between gap-8 py-4">
      <div>
        <label className="text-sm font-medium" htmlFor={title}>
          {title}
        </label>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <Switch id={title} checked={on} onCheckedChange={setOn} />
    </div>
  );
}
export function Connections({ compact = false }: { compact?: boolean }) {
  const [connected, setConnected] = useState(["Linear", "GitHub"]);
  const [q, setQ] = useState("");
  return (
    <div className="flex flex-col gap-5">
      <SearchInput value={q} onChange={setQ} placeholder="Search integrations…" />
      <div className={compact ? "flex flex-col gap-1" : "grid gap-4 sm:grid-cols-2"}>
        {connections
          .filter((c) => c[0].toLowerCase().includes(q.toLowerCase()))
          .map(([name, sub]) => (
            <Card key={name} className="gap-3 py-4 shadow-none">
              <CardHeader className="flex flex-row items-center gap-3 px-4">
                <Avatar className="rounded-xl">
                  <AvatarFallback className="rounded-xl font-bold">
                    {name.slice(0, 1)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-sm">{name}</CardTitle>
                  <CardDescription className="mt-1 text-xs">{sub}</CardDescription>
                </div>
                {compact && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setConnected((v) =>
                        v.includes(name) ? v.filter((n) => n !== name) : [...v, name],
                      );
                      toast.success("Integration updated");
                    }}
                  >
                    {connected.includes(name) ? "Disconnect" : "Connect"}
                  </Button>
                )}
              </CardHeader>
              {!compact && (
                <CardContent className="flex items-center justify-between px-4">
                  <Badge variant="outline">
                    {connected.includes(name) ? "Connected" : "Available"}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setConnected((v) =>
                        v.includes(name) ? v.filter((n) => n !== name) : [...v, name],
                      );
                      toast.success("Integration updated");
                    }}
                  >
                    {connected.includes(name) ? "Manage" : "Connect"}
                  </Button>
                </CardContent>
              )}
            </Card>
          ))}
      </div>
      {q && !connections.some((c) => c[0].toLowerCase().includes(q.toLowerCase())) && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No integrations match “{q}”.
        </p>
      )}
    </div>
  );
}
function SecuritySettings() {
  return (
    <div className="flex flex-col gap-4">
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Password & authentication</CardTitle>
          <CardDescription>Keep your account secure and control access.</CardDescription>
        </CardHeader>
        <CardContent>
          <ToggleRow
            title="Two-factor authentication"
            description="Add another layer of security to your account."
            checked
          />
          <Separator />
          <ToggleRow
            title="Single sign-on (SSO)"
            description="Require your team to sign in with an identity provider."
          />
          <Separator />
          <ToggleRow
            title="New sign-in alerts"
            description="Get notified when a new device accesses your account."
            checked
          />
        </CardContent>
      </Card>
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="flex items-center gap-3">
          <Monitor className="size-5" />
          <div>
            <p className="text-sm font-medium">Chrome on MacOS</p>
            <p className="mt-1 text-xs text-muted-foreground">
              San Francisco, US · Current session
            </p>
          </div>
        </div>
        <Badge variant="outline">Active now</Badge>
      </div>
      <FieldGroup>
        <TextField label="Current password" type="password" placeholder="••••••••" />
        <TextField label="New password" type="password" placeholder="At least 8 characters" />
      </FieldGroup>
    </div>
  );
}
function ApiKeys() {
  const [keys, setKeys] = useState(["Production API key", "Development API key"]);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium">API keys</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Create keys to securely access the API.
          </p>
        </div>
        <NewItem label="Create key" onCreate={(n) => setKeys([...keys, n])} />
      </div>
      {keys.map((k, i) => (
        <div
          key={k}
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"
        >
          <div className="flex items-center gap-3">
            <KeyRound className="size-4" />
            <div>
              <p className="text-sm font-medium">{k}</p>
              <code className="mt-1 block text-xs text-muted-foreground">
                sk_demo_••••••••••••{8341 + i}
              </code>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label={`Copy ${k}`}
              onClick={() => {
                navigator.clipboard?.writeText(`sk_demo_example_${i}`);
                toast.success("Demo key copied");
              }}
            >
              <Copy />
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label={`Delete ${k}`}
              onClick={() => {
                setKeys(keys.filter((n) => n !== k));
                toast("Key revoked");
              }}
            >
              <Trash2 />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
function NotificationSettings() {
  return (
    <>
      <h3 className="font-medium">Choose what you hear from us</h3>
      <p className="mt-1 text-sm text-muted-foreground">Manage how and when you receive updates.</p>
      <div className="mt-4 divide-y">
        <ToggleRow
          title="Email notifications"
          description="Important updates delivered to your inbox."
          checked
        />
        <ToggleRow
          title="Push notifications"
          description="Get timely notifications on your device."
          checked
        />
        <ToggleRow title="Team activity" description="Updates about projects you’re following." />
        <ToggleRow
          title="Weekly digest"
          description="A summary of everything that happened this week."
          checked
        />
        <ToggleRow
          title="Product announcements"
          description="New features, improvements and release notes."
        />
      </div>
    </>
  );
}
function Billing() {
  const [plan, setPlan] = useState("Pro");
  return (
    <div className="flex flex-col gap-5">
      <Card className="shadow-none">
        <CardHeader className="flex flex-row justify-between">
          <div>
            <CardTitle className="text-base">
              {plan} plan{" "}
              <Badge variant="secondary" className="ml-2">
                Monthly
              </Badge>
            </CardTitle>
            <CardDescription className="mt-2">For growing teams with big ideas.</CardDescription>
          </div>
          <p className="text-3xl font-semibold">
            $29
            <span className="text-xs font-normal text-muted-foreground">/month</span>
          </p>
        </CardHeader>
        <CardContent>
          <div className="mb-2 flex justify-between text-xs">
            <span>Team members</span>
            <span>8 of 12 seats</span>
          </div>
          <Progress value={67} />
          <div className="mt-5 flex justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setPlan(plan === "Pro" ? "Business" : "Pro");
                toast.success("Demo plan updated");
              }}
            >
              Change plan
            </Button>
          </div>
        </CardContent>
      </Card>
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="flex items-center gap-3">
          <CreditCard className="size-8" />
          <div>
            <p className="text-sm font-medium">Visa ending in 4242</p>
            <p className="mt-1 text-xs text-muted-foreground">Expires 06/2028</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            toast("Payment method editor opened", {
              description: "Demo card details are used for this preview.",
            })
          }
        >
          Edit
        </Button>
      </div>
      {["October 2026", "September 2026", "August 2026"].map((m) => (
        <div className="flex items-center justify-between border-b py-3 text-sm" key={m}>
          <span>{m}</span>
          <Badge variant="outline">Paid</Badge>
          <span>$29.00</span>
          <Button
            variant="link"
            size="sm"
            onClick={() => {
              const blob = new Blob([`Invoice ${m}\nAcme Pro subscription\nAmount: $29.00\nPaid`], {
                type: "text/plain",
              });
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = "invoice.txt";
              a.click();
              URL.revokeObjectURL(a.href);
            }}
          >
            Download
          </Button>
        </div>
      ))}
    </div>
  );
}
function ProfileFields() {
  return (
    <FieldGroup>
      <div className="flex items-center gap-4">
        <Avatar className="size-16">
          <AvatarFallback>AM</AvatarFallback>
        </Avatar>
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              toast("Photo upload selected", {
                description: "Your avatar initials are used in this demo.",
              })
            }
          >
            <Upload />
            Upload photo
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">JPG, GIF or PNG. 1MB max.</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="First name" defaultValue="Alex" />
        <TextField label="Last name" defaultValue="Morgan" />
      </div>
      <TextField label="Email address" type="email" defaultValue="alex@acme.com" />
      <Field>
        <FieldLabel>Bio</FieldLabel>
        <Textarea
          defaultValue="Product designer building thoughtful digital experiences."
          rows={3}
        />
        <FieldDescription>Write a short introduction to share with your team.</FieldDescription>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Pick label="Country" options={["United States", "United Kingdom", "Germany", "Canada"]} />
        <Pick
          label="Timezone"
          options={[
            "Pacific Time (UTC−08:00)",
            "Eastern Time (UTC−05:00)",
            "UTC",
            "China Standard Time (UTC+08:00)",
          ]}
        />
      </div>
    </FieldGroup>
  );
}
function BusinessForm({ block }: { block: BlockMeta }) {
  const name = block.name;
  return (
    <FieldGroup>
      {/Product/.test(name) ? (
        <>
          <TextField label="Product name" placeholder="e.g. Everyday Backpack" />
          <Field>
            <FieldLabel>Description</FieldLabel>
            <Textarea placeholder="Tell customers about your product…" rows={4} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Price" placeholder="0.00" type="number" />
            <TextField label="SKU" placeholder="SKU-001" />
          </div>
          <Pick label="Category" options={["Accessories", "Clothing", "Electronics", "Home"]} />
        </>
      ) : /Invoice/.test(name) ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Invoice number" defaultValue="INV-2026-1042" />
            <TextField label="Due date" type="date" defaultValue="2026-11-22" />
          </div>
          <TextField label="Bill to" placeholder="Customer or company name" />
          <TextField label="Customer email" type="email" placeholder="billing@company.com" />
          <div className="rounded-lg border p-4">
            <div className="mb-4 flex justify-between text-xs text-muted-foreground">
              <span>Item description</span>
              <span>Amount</span>
            </div>
            <div className="flex items-center justify-between">
              <Input aria-label="Line item" placeholder="Design services" className="mr-4" />
              <Input aria-label="Amount" type="number" placeholder="1200" className="w-24" />
            </div>
            <div className="mt-5 flex justify-between border-t pt-4 text-sm font-medium">
              <span>Total</span>
              <span>$1,200.00 USD</span>
            </div>
          </div>
        </>
      ) : /Deploy/.test(name) ? (
        <>
          <TextField label="Application name" placeholder="my-awesome-app" />
          <Pick label="Git repository" options={["acme/web-app", "acme/api", "acme/docs"]} />
          <Pick label="Framework preset" options={["Vite", "Next.js", "React", "Other"]} />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Build command" defaultValue="npm run build" />
            <TextField label="Output directory" defaultValue="dist" />
          </div>
          <TextField label="Environment variables" placeholder="KEY=value" />
        </>
      ) : /Verification/.test(name) ? (
        <>
          <TextField label="Legal business name" placeholder="Acme Inc." />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Registration number" placeholder="123456789" />
            <Pick
              label="Business type"
              options={["Corporation", "Limited liability company", "Sole proprietor"]}
            />
          </div>
          <TextField label="Business address" placeholder="123 Market Street" />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="City" placeholder="San Francisco" />
            <TextField label="Postal code" placeholder="94103" />
          </div>
          <Pick
            label="Country of registration"
            options={["United States", "United Kingdom", "Canada"]}
          />
        </>
      ) : /Ticket/.test(name) ? (
        <>
          <TextField label="Ticket title" defaultValue="Update onboarding flow" />
          <Field>
            <FieldLabel>Description</FieldLabel>
            <Textarea
              defaultValue="Improve the first-time experience for new workspace members."
              rows={4}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Pick label="Priority" options={["Medium", "High", "Urgent", "Low"]} />
            <Pick label="Status" options={["In progress", "Backlog", "In review", "Done"]} />
          </div>
          <Pick
            label="Assignee"
            options={["Olivia Rhye", "Phoenix Baker", "Lana Steiner", "Unassigned"]}
          />
        </>
      ) : /Invite|Role/.test(name) ? (
        <>
          <TextField label="Email address" type="email" placeholder="colleague@company.com" />
          <Pick label="Role" options={["Member", "Admin", "Viewer"]} />
          <Field>
            <FieldLabel>Message (optional)</FieldLabel>
            <Textarea placeholder="Welcome to the team!" />
          </Field>
          {["View projects", "Create and edit content", "Invite members", "Manage billing"].map(
            (p, i) => (
              <div className="flex items-center gap-2" key={p}>
                <Checkbox defaultChecked={i < 2} id={p} />
                <label htmlFor={p} className="text-sm">
                  {p}
                </label>
              </div>
            ),
          )}
        </>
      ) : (
        <ProfileFields />
      )}
    </FieldGroup>
  );
}
export function SettingsBlock({ block }: BlockProps) {
  const [section, setSection] = useState("General");
  const integration = /Integration|Connection|Connected|Import|App Connections/.test(block.name);
  const security = /Security|Privacy|Auth/.test(block.name);
  const api = /API|Webhook/.test(block.name);
  const notifications = /Notification|Digest/.test(block.name);
  const billing = /Billing/.test(block.name);
  const profile = block.category === "profile";
  const menu = ["General", "Profile", "Notifications", "Security", "Connections", "Billing"];
  const actual =
    section === "General"
      ? integration
        ? "Connections"
        : security
          ? "Security"
          : api
            ? "API"
            : notifications
              ? "Notifications"
              : billing
                ? "Billing"
                : profile
                  ? "Profile"
                  : "General"
      : section;
  return (
    <div className="mx-auto flex min-h-[570px] max-w-5xl flex-col gap-7 p-6 md:p-9">
      <Head
        title={profile ? "Account settings" : block.category === "form" ? block.name : "Settings"}
        description="Manage your account and workspace preferences."
        action=""
      />
      {block.category === "form" ? (
        <form
          className="mx-auto flex w-full max-w-2xl flex-col gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            toast.success("Changes saved");
          }}
        >
          {api ? <ApiKeys /> : security ? <SecuritySettings /> : <BusinessForm block={block} />}
          <Separator />
          <div className="flex justify-end gap-2">
            <Button type="reset" variant="outline">
              Reset
            </Button>
            <Button type="submit">Save changes</Button>
          </div>
        </form>
      ) : (
        <div className="grid gap-8 md:grid-cols-[180px_1fr]">
          <nav className="flex flex-wrap content-start gap-1 md:flex-col">
            {menu.map((m, i) => {
              const Icon = [Settings, Users, Bell, Shield, Link, CreditCard][i];
              return (
                <Button
                  className="justify-start"
                  key={m}
                  variant={actual === m ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setSection(m)}
                >
                  <Icon />
                  {m}
                </Button>
              );
            })}
          </nav>
          <form
            className="flex min-w-0 flex-col gap-6"
            onSubmit={(e) => {
              e.preventDefault();
              toast.success("Your preferences have been saved");
            }}
          >
            <div>
              <h3 className="text-base font-semibold">
                {section === "General" ? block.name : actual}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Update your {actual.toLowerCase()} information and preferences.
              </p>
            </div>
            <Separator />
            {section === "General" &&
            /Admin Permissions|Role Capabilities|Mailbox Accounts|Referral Rewards|Meeting Capture/.test(
              block.name,
            ) ? (
              <AccountPanel block={block} />
            ) : actual === "Connections" ? (
              <Connections />
            ) : actual === "Security" ? (
              <SecuritySettings />
            ) : actual === "Notifications" ? (
              <NotificationSettings />
            ) : actual === "API" ? (
              <ApiKeys />
            ) : actual === "Billing" ? (
              <Billing />
            ) : actual === "Profile" ? (
              <ProfileFields />
            ) : (
              <FieldGroup>
                <TextField label="Workspace name" defaultValue="Acme Workspace" />
                <TextField label="Workspace URL" defaultValue="acme.app/workspace" />
                <Field>
                  <FieldLabel>Workspace description</FieldLabel>
                  <Textarea defaultValue="A shared space for our team to plan, build and grow." />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Pick
                    label="Language"
                    options={[
                      "English (United States)",
                      "English (United Kingdom)",
                      "Deutsch",
                      "Français",
                    ]}
                  />
                  <Pick label="Start of week" options={["Monday", "Sunday", "Saturday"]} />
                </div>
                <ToggleRow
                  title="Public workspace"
                  description="Allow anyone with the link to view your workspace."
                />
              </FieldGroup>
            )}
            <Separator />
            <div className="flex justify-end gap-2">
              <Button variant="outline" type="reset">
                Cancel
              </Button>
              <Button type="submit">Save changes</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
export function WizardBlock({ block }: BlockProps) {
  const [step, setStep] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState(1);
  const [done, setDone] = useState(false);
  const isBilling = /Billing|Upgrade|Transfer/.test(block.name);
  const steps = isBilling
    ? ["Choose your plan", "Billing details", "Review & confirm"]
    : ["Workspace details", "Invite your team", "Connect your tools", "Ready to launch"];
  return (
    <div className="flex min-h-[620px] bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-muted/30 p-7 md:flex">
        <Brand />
        <h3 className="mt-12 text-lg font-semibold">Let’s get you set up</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          A few quick steps and you’re on your way.
        </p>
        <div className="mt-9 flex flex-col gap-7">
          {steps.map((s, i) => (
            <div className="flex items-center gap-3" key={s}>
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-xs ${i <= step ? "bg-foreground text-background" : "text-muted-foreground"}`}
              >
                {i < step ? <Check className="size-3" /> : i + 1}
              </span>
              <span className={`text-sm ${i === step ? "font-medium" : "text-muted-foreground"}`}>
                {s}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-auto pt-12 text-xs text-muted-foreground">Need help? support@acme.com</p>
      </aside>
      <div className="flex flex-1 items-center justify-center p-7">
        <div className="w-full max-w-lg">
          {done ? (
            <div className="flex flex-col items-center gap-5 py-16 text-center">
              <CheckCircle2 className="size-14" />
              <h2 className="text-2xl font-semibold">You’re all set!</h2>
              <p className="text-sm text-muted-foreground">
                Your workspace is ready. Great things start here.
              </p>
              <Button
                onClick={() => {
                  setStep(0);
                  setDone(false);
                }}
              >
                Start again
                <ArrowRight />
              </Button>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                Step {step + 1} of {steps.length}
              </p>
              <Progress className="my-4 h-1" value={((step + 1) / steps.length) * 100} />
              <h2 className="mt-7 text-2xl font-semibold tracking-tight">{steps[step]}</h2>
              <p className="mb-7 mt-2 text-sm text-muted-foreground">
                {step === 0
                  ? "Make this space your own. You can change these details later."
                  : step === 1
                    ? "Everything works better when you build together."
                    : "One last step before you start building."}
              </p>
              <form
                className="flex flex-col gap-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (step < steps.length - 1) {
                    setStep(step + 1);
                  } else {
                    setDone(true);
                  }
                }}
              >
                {isBilling ? (
                  step === 0 ? (
                    <div className="grid gap-3">
                      {["Starter · $0 / month", "Pro · $29 / month", "Business · $99 / month"].map(
                        (p, i) => (
                          <label
                            key={p}
                            className="flex cursor-pointer items-center gap-3 rounded-lg border p-5 text-sm"
                          >
                            <Checkbox
                              checked={selectedPlan === i}
                              onCheckedChange={() => setSelectedPlan(i)}
                              aria-label={p}
                            />
                            {p}
                            {i === 1 && (
                              <Badge variant="secondary" className="ml-auto">
                                Popular
                              </Badge>
                            )}
                          </label>
                        ),
                      )}
                    </div>
                  ) : step === 1 ? (
                    <FieldGroup>
                      <TextField label="Name on card" placeholder="Alex Morgan" />
                      <TextField label="Card number" placeholder="4242 4242 4242 4242" />
                      <div className="grid grid-cols-2 gap-4">
                        <TextField label="Expiry date" placeholder="MM / YY" />
                        <TextField label="CVC" placeholder="123" />
                      </div>
                    </FieldGroup>
                  ) : (
                    <Billing />
                  )
                ) : step === 0 ? (
                  <FieldGroup>
                    <TextField label="Workspace name" placeholder="Your company name" />
                    <Pick
                      label="What best describes your role?"
                      options={["Designer", "Developer", "Product manager", "Founder", "Other"]}
                    />
                    <Pick
                      label="Team size"
                      options={["1–10 people", "11–50 people", "51–200 people", "200+ people"]}
                    />
                  </FieldGroup>
                ) : step === 1 ? (
                  <FieldGroup>
                    <TextField
                      label="Team member email"
                      type="email"
                      placeholder="colleague@company.com"
                    />
                    <TextField
                      label="Team member email"
                      type="email"
                      placeholder="another@company.com"
                    />
                    <Pick label="Default role" options={["Member", "Admin", "Viewer"]} />
                  </FieldGroup>
                ) : step === 2 ? (
                  <Connections compact />
                ) : (
                  <div className="flex flex-col gap-4 rounded-lg border p-6">
                    {["Workspace configured", "Team invitations ready", "Tools connected"].map(
                      (t) => (
                        <div key={t} className="flex gap-3 text-sm">
                          <Check className="size-4" />
                          {t}
                        </div>
                      ),
                    )}
                  </div>
                )}
                <Separator />
                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(Math.max(0, step - 1))}
                    disabled={!step}
                  >
                    <ArrowLeft />
                    Back
                  </Button>
                  <Button type="submit">
                    {step === steps.length - 1 ? "Complete setup" : "Continue"}
                    <ArrowRight />
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
export function DialogBlock({ block }: BlockProps) {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState<string[]>([]);
  const isSheet = block.category === "sheet";
  const [search, setSearch] = useState("");
  const invite = /Invite/.test(block.name);
  const checklist = /Checklist/.test(block.name);
  const connect = /App|Connect|Connection|Template/.test(block.name);
  const cancel = /Cancel/.test(block.name);
  const content = (
    <div className="flex flex-col gap-6 py-4">
      {/Cron|Deploy|Rollout|Firewall|SLO|Error Budget|Data|Connection|Audit/.test(block.name) &&
      isSheet ? (
        <TechnicalPanel block={block} />
      ) : invite ? (
        <FieldGroup>
          <TextField label="Email addresses" placeholder="name@company.com, name@company.com" />
          <Pick label="Role" options={["Member", "Admin", "Viewer"]} />
          <Field>
            <FieldLabel>Personal message</FieldLabel>
            <Textarea placeholder="Let’s build something great together." />
          </Field>
          <div className="flex items-center gap-2 text-sm">
            <Team />
            <span className="text-muted-foreground">12 people are already on your team</span>
          </div>
        </FieldGroup>
      ) : checklist ? (
        <div className="flex flex-col gap-3">
          {[
            "Configure your workspace",
            "Invite team members",
            "Connect your integrations",
            "Publish your first project",
          ].map((t) => (
            <div key={t} className="flex items-center gap-3 rounded-lg border p-3">
              <Checkbox
                id={t}
                checked={checked.includes(t)}
                onCheckedChange={(v) =>
                  setChecked(v ? [...checked, t] : checked.filter((x) => x !== t))
                }
              />
              <label htmlFor={t} className="text-sm">
                {t}
              </label>
            </div>
          ))}
          <Progress value={(checked.length / 4) * 100} />
        </div>
      ) : connect ? (
        <Connections compact />
      ) : cancel ? (
        <FieldGroup>
          <p className="text-sm text-muted-foreground">
            We’re sorry to see you go. Help us understand how we can improve.
          </p>
          {[
            "It’s too expensive",
            "Missing features I need",
            "I’m not using it enough",
            "Other reason",
          ].map((t, i) => (
            <label key={t} className="flex items-center gap-3 rounded-lg border p-3 text-sm">
              <Checkbox defaultChecked={!i} aria-label={t} />
              {t}
            </label>
          ))}
          <Textarea placeholder="Anything else you’d like to share?" />
        </FieldGroup>
      ) : /Notification|Activity|Audit/.test(block.name) ? (
        <div className="flex flex-col gap-5">
          {[
            "Olivia assigned you a new task",
            "Your deployment is ready",
            "Phoenix commented on your project",
            "Weekly report is available",
          ].map((t, i) => (
            <div key={t} className="flex gap-3 border-b pb-4">
              <Avatar className="size-8">
                <AvatarFallback>{["OR", "AC", "PB", "AC"][i]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm">{t}</p>
                <p className="mt-1 text-xs text-muted-foreground">{i + 1} hours ago</p>
              </div>
            </div>
          ))}
        </div>
      ) : /Chat|Copilot/.test(block.name) ? (
        <>
          <div className="rounded-lg bg-muted p-4 text-sm leading-relaxed">
            Hi Alex! I can help you explore your workspace, summarize activity, and answer
            questions. What would you like to work on?
          </div>
          <Textarea
            placeholder="Ask a question…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </>
      ) : /Shortcut/.test(block.name) ? (
        <div className="flex flex-col gap-4">
          {[
            ["Open search", "⌘ K"],
            ["Create new item", "⌘ N"],
            ["Toggle sidebar", "⌘ B"],
            ["Go to settings", "⌘ ,"],
            ["Close dialog", "Esc"],
          ].map(([t, k]) => (
            <div key={t} className="flex justify-between text-sm">
              <span>{t}</span>
              <kbd className="rounded border bg-muted px-2 py-1 text-xs">{k}</kbd>
            </div>
          ))}
        </div>
      ) : /Settings|Customize/.test(block.name) ? (
        <NotificationSettings />
      ) : (
        <FieldGroup>
          <TextField
            label={/Duration/.test(block.name) ? "Duration (minutes)" : "Name"}
            placeholder={/Duration/.test(block.name) ? "30" : "Enter a name"}
            type={/Duration/.test(block.name) ? "number" : "text"}
          />
          <Field>
            <FieldLabel>Description</FieldLabel>
            <Textarea placeholder="Add more details…" rows={4} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Pick label="Status" options={["Active", "Draft", "Archived"]} />
            <Pick label="Visibility" options={["Private", "Team", "Public"]} />
          </div>
          <Pick label="Owner" options={["Alex Morgan", "Olivia Rhye", "Phoenix Baker"]} />
        </FieldGroup>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button
          onClick={() => {
            toast.success(
              invite
                ? "Invitations sent"
                : cancel
                  ? "Cancellation request recorded"
                  : /Chat|Copilot/.test(block.name)
                    ? "Demo assistant received your message"
                    : "Changes saved",
            );
            setOpen(false);
          }}
        >
          {invite
            ? "Send invitations"
            : cancel
              ? "Cancel plan"
              : checklist
                ? "Launch project"
                : /Chat|Copilot/.test(block.name)
                  ? "Send message"
                  : "Save changes"}
        </Button>
      </div>
    </div>
  );
  return (
    <div className="relative flex min-h-[620px] flex-col items-center justify-center gap-5 overflow-hidden bg-muted/25 p-6">
      <Card className="w-full max-w-lg shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">{block.name}</CardTitle>
          <CardDescription>Manage the details of your workspace.</CardDescription>
        </CardHeader>
        <CardContent>{content}</CardContent>
      </Card>
      {isSheet ? (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button>
              Open {block.name}
              <ChevronRight />
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
            <SheetHeader>
              <SheetTitle>{block.name}</SheetTitle>
              <SheetDescription>Manage the details of your workspace.</SheetDescription>
            </SheetHeader>
            <div className="px-6">{content}</div>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Open {block.name}</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{block.name}</DialogTitle>
              <DialogDescription>
                {invite
                  ? "Bring your team together in one place."
                  : cancel
                    ? "Before you go, tell us a little more."
                    : "Everything you need, right where you work."}
              </DialogDescription>
            </DialogHeader>
            {content}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
