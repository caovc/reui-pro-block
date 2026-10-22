import { useState } from "react";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Copy,
  FileText,
  Flame,
  Globe,
  MapPin,
  MessageSquare,
  Package,
  Settings,
  TrendingUp,
  UserRound,
  Video,
  Wallet,
} from "lucide-react";
import {
  Frame,
  FramePanel,
  FrameHeader,
  FrameTitle,
  FrameDescription,
} from "@/components/reui/frame";
import { IconTile } from "@/components/reui/icon-tile";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import portrait from "@/blocks/application/assets/schedule-priya-singh.jpg";
import {
  CardStage,
  FramedGrid,
  LocalLink,
  Avatars,
  CopyValue,
  Actions,
} from "./common";

export function InvestorProfile() {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [draft, setDraft] = useState({ company: "", amount: "", message: "" });
  return (
    <CardStage variant={3} narrow>
      <Frame>
        <FramePanel className="refined-investor flex flex-col gap-5 p-5">
          <div className="flex flex-row items-center gap-5">
            <Avatar className="size-20 rounded-md border-4 border-background shadow-sm">
              <AvatarImage
                src={portrait}
                alt="Mara Alves"
                className="rounded-sm"
              />
              <AvatarFallback className="rounded-sm">MA</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col gap-2">
              <FrameTitle>Mara Alves</FrameTitle>
              <Badge variant="success-light" size="sm" className="w-fit">
                <CheckCircle2 />
                Open to Proposals
              </Badge>
              <FrameDescription className="break-all">
                malves@reui-capital.io
              </FrameDescription>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 rounded-xl border bg-muted/30 py-3 text-center">
              {[
                ["87", "Deals"],
                ["$7.2M", "Avg. Ticket"],
                ["$415M", "Total Fund"],
              ].map(([value, label], i) => (
                <div className={i ? "border-l" : ""} key={label}>
                  <p className="font-medium">{value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
            <ul className="flex flex-col">
              {[
                {
                  name: "Northline Ventures",
                  value: "$7,840,000",
                  icon: BarChart3,
                },
                { name: "Bluepeak Capital", value: "$3,260,000", icon: Wallet },
                {
                  name: "Everfield Equity",
                  value: "$1,180,000",
                  icon: CircleDollarSign,
                },
              ].map(({ name, value, icon: Icon }, i) => (
                <li
                  className="flex items-center gap-3 border-b border-dashed py-2.5 last:border-b-0"
                  key={name}
                >
                  <IconTile
                    variant="solid"
                    size="sm"
                    className={
                      i === 1
                        ? "bg-info text-white"
                        : i === 2
                          ? "bg-warning text-white"
                          : "bg-invert text-invert-foreground"
                    }
                  >
                    <Icon />
                  </IconTile>
                  <span className="min-w-0 flex-1 text-sm">{name}</span>
                  <span className="text-sm">{value}</span>
                </li>
              ))}
            </ul>
            <Button
              variant="outline"
              className="h-10 w-full"
              onClick={() => setOpen(true)}
            >
              <MessageSquare />
              {saved ? "Review Funding Proposal" : "Send Funding Proposal"}
            </Button>
          </div>
        </FramePanel>
      </Frame>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Funding proposal</DialogTitle>
            <DialogDescription>
              Save a sample proposal locally for Mara Alves. This preview does
              not send email.
            </DialogDescription>
          </DialogHeader>
          <form
            className="flex flex-col gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              setDraft({
                company: String(data.get("company")),
                amount: String(data.get("amount")),
                message: String(data.get("message")),
              });
              setSaved(true);
              setOpen(false);
              toast.success("Proposal saved locally");
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="proposal-company">Company name</FieldLabel>
                <Input
                  id="proposal-company"
                  name="company"
                  defaultValue={draft.company}
                  required
                  placeholder="Your company"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="proposal-amount">
                  Funding requested
                </FieldLabel>
                <Input
                  id="proposal-amount"
                  name="amount"
                  defaultValue={draft.amount}
                  required
                  placeholder="$250,000"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="proposal-message">
                  Proposal summary
                </FieldLabel>
                <Textarea
                  id="proposal-message"
                  name="message"
                  defaultValue={draft.message}
                  required
                  placeholder="Tell us about your product and goals…"
                />
              </Field>
            </FieldGroup>
            <Button type="submit">Save proposal locally</Button>
          </form>
        </DialogContent>
      </Dialog>
    </CardStage>
  );
}

export function DetailFacts() {
  return (
    <CardStage variant={7}>
      <FramedGrid>
        {[
          {
            label: "Company",
            value: "ReUI Inc.",
            detail: "Amsterdam, NL",
            icon: Copy,
          },
          {
            label: "API Endpoint",
            value: "api.reui.io",
            detail: "Requests: 124k/day",
            icon: Globe,
          },
          {
            label: "Next Session",
            value: "26 Dec, 2025",
            detail: "RAI Amsterdam",
            icon: CalendarDays,
          },
          {
            label: "Social Profile",
            value: "@reui_io",
            detail: "2,468 Members",
            icon: UserRound,
          },
        ].map(({ label, value, detail, icon: Icon }, i) => (
          <FramePanel key={label} className="flex min-h-[130px] flex-col gap-8">
            <div className="flex flex-row items-center justify-between">
              <p className="text-sm text-muted-foreground">{label}</p>
              <Icon className="size-4 text-muted-foreground" />
            </div>
            <div className="flex items-end justify-between gap-2">
              <div className="min-w-0">
                <FrameTitle>
                  {i === 1 || i === 3 ? (
                    <LocalLink title={value}>{value}</LocalLink>
                  ) : (
                    value
                  )}
                </FrameTitle>
                <FrameDescription className="mt-1">{detail}</FrameDescription>
              </div>
              {i === 0 ? (
                <Flame className="size-5 shrink-0 text-[var(--chart-3)]" />
              ) : i === 1 ? (
                <Badge variant="secondary" className="px-1 text-[9px]">
                  Running
                </Badge>
              ) : i === 2 ? (
                <Avatars extra={1} />
              ) : null}
            </div>
          </FramePanel>
        ))}
      </FramedGrid>
    </CardStage>
  );
}

export function ApplicantRecord() {
  return (
    <CardStage variant={9}>
      <Frame>
        <FramePanel className="p-0">
          <div className="refined-record-strip">
            <div>
              <h3>Applied for</h3>
              <p>Business Analyst</p>
            </div>
            <div>
              <h3>Location</h3>
              <p>Amsterdam, NL</p>
            </div>
            <div>
              <h3>Mobile</h3>
              <p>
                <span>+31 6 9876 54 32</span>
                <CopyValue value="+31 6 9876 54 32" label="mobile" />
              </p>
            </div>
            <div>
              <h3>Email</h3>
              <p>
                <span>jeroen.doe@reui.io</span>
                <CopyValue value="jeroen.doe@reui.io" label="email" />
              </p>
            </div>
            <div className="refined-pattern">
              <h3>Skills</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: "Analysis", icon: TrendingUp },
                  { name: "Scrum", icon: Settings },
                  { name: "UX Research", icon: FileText },
                ].map(({ name, icon: Icon }) => (
                  <Badge
                    variant="secondary"
                    className="gap-1 px-1 text-[10px] font-normal"
                    key={name}
                  >
                    <Icon />
                    {name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </FramePanel>
      </Frame>
    </CardStage>
  );
}

export function DeliveryTracking() {
  const [open, setOpen] = useState(false);
  const [address, setAddress] = useState("Overtoom 135, 1054 HG Amsterdam");
  const [notes, setNotes] = useState(
    "Driver confirmed delivery at the main entrance; photo proof uploaded to the order.",
  );
  return (
    <CardStage variant={14}>
      <Frame className="mx-auto max-w-[528px]">
        <FrameHeader className="flex items-center justify-between gap-2 px-2 pb-2 pt-1 flex-row">
          <h2 className="flex items-center gap-2 text-sm font-medium">
            <IconTile variant="elevated">
              <Package />
            </IconTile>
            Delivery Details
          </h2>
          <Actions
            label="Delivery"
            onEdit={() => setOpen(true)}
            onCopy={async () => {
              try {
                await navigator.clipboard.writeText(
                  `${location.href}?tracking=NL-54321-AMST`,
                );
                toast.success("Tracking link copied");
              } catch {
                toast.error("Clipboard unavailable");
              }
            }}
          />
        </FrameHeader>
        <FramePanel className="flex flex-col gap-5 p-5">
          <div className="flex flex-col gap-5">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <span className="text-sm">{address}</span>
              <Badge variant="secondary" className="shrink-0 px-1 text-[9px]">
                Home
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground" />
              <span>37m 23s</span>
              <span className="text-muted-foreground">24m ago</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Package className="size-4 text-muted-foreground" />
              <span>#NL-54321-AMST</span>
              <span className="text-muted-foreground">Live Tracking</span>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium">Delivery Notes</h3>
              <p className="text-sm text-muted-foreground">{notes}</p>
            </div>
          </div>
        </FramePanel>
      </Frame>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit delivery details</DialogTitle>
            <DialogDescription>
              Update the sample delivery locally.
            </DialogDescription>
          </DialogHeader>
          <form
            className="flex flex-col gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              setAddress(String(data.get("address")));
              setNotes(String(data.get("notes")));
              setOpen(false);
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="delivery-address">Address</FieldLabel>
                <Input
                  id="delivery-address"
                  name="address"
                  required
                  defaultValue={address}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="delivery-notes">Delivery notes</FieldLabel>
                <Textarea
                  id="delivery-notes"
                  name="notes"
                  required
                  defaultValue={notes}
                />
              </Field>
            </FieldGroup>
            <Button>Save delivery</Button>
          </form>
        </DialogContent>
      </Dialog>
    </CardStage>
  );
}

type Meeting = {
  id: number;
  title: string;
  time: string;
  duration: string;
  description: string;
  type: string;
};
const meetings: Meeting[] = [
  {
    id: 1,
    title: "Apollo CRM - Sprint Planning",
    time: "09:00 AM CET",
    duration: "30 min",
    description:
      "Collaborative sprint planning to address blockers, assign tasks, and refine deliverables for the upcoming development phase.",
    type: "Client Meeting",
  },
  {
    id: 2,
    title: "Delta Finance - Budget Alignment",
    time: "11:30 AM CET",
    duration: "90 min",
    description:
      "Reviewing quarterly spend, adjusting forecasts, and aligning budgets across departments with finance and operations teams.",
    type: "Internal",
  },
];
export function MeetingCards() {
  const [items, setItems] = useState(meetings);
  const [editing, setEditing] = useState<Meeting | null>(null);
  const [joining, setJoining] = useState<Meeting | null>(null);
  return (
    <CardStage variant={15}>
      <div className="grid gap-5 md:grid-cols-2">
        {items.map((m) => (
          <Frame key={m.id} stacked>
            <FrameHeader className="flex h-8 items-center justify-between px-2 flex-row">
              <h2 className="text-sm font-medium">Meeting</h2>
              <Actions
                label={m.title}
                onEdit={() => setEditing(m)}
                onCopy={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      `${location.href}?meeting=${m.id}`,
                    );
                    toast.success("Meeting link copied");
                  } catch {
                    toast.error("Clipboard unavailable");
                  }
                }}
              />
            </FrameHeader>
            <FramePanel className="flex flex-col gap-4">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <FrameTitle>
                    <LocalLink title={m.title} description={m.description}>
                      {m.title}
                    </LocalLink>
                  </FrameTitle>
                  <Badge
                    variant="secondary"
                    className="shrink-0 px-1 text-[10px] font-normal"
                  >
                    {m.duration}
                  </Badge>
                </div>
                <FrameDescription>{m.time}</FrameDescription>
              </div>
              <div className="flex flex-col gap-3">
                <FrameDescription>{m.description}</FrameDescription>
                <div className="flex items-center gap-3">
                  <Avatars />
                  <Badge
                    variant="secondary"
                    className="px-1 text-[10px] font-normal"
                  >
                    {m.type}
                  </Badge>
                </div>
              </div>
            </FramePanel>
            <FramePanel fit className="p-3">
              <Button
                variant="link"
                className="h-auto p-0 text-xs font-normal text-foreground"
                onClick={() => setJoining(m)}
              >
                <Video className="text-[var(--chart-2)]" />
                Join Meeting
              </Button>
            </FramePanel>
          </Frame>
        ))}
      </div>
      <Dialog
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit meeting</DialogTitle>
            <DialogDescription>
              Changes apply to this local preview.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <form
              className="flex flex-col gap-5"
              onSubmit={(e) => {
                e.preventDefault();
                const data = new FormData(e.currentTarget);
                setItems(
                  items.map((m) =>
                    m.id === editing.id
                      ? {
                          ...m,
                          title: String(data.get("title")),
                          time: String(data.get("time")),
                          duration: String(data.get("duration")),
                        }
                      : m,
                  ),
                );
                setEditing(null);
              }}
            >
              <FieldGroup>
                {[
                  ["title", "Meeting title", editing.title],
                  ["time", "Start time", editing.time],
                  ["duration", "Duration", editing.duration],
                ].map(([name, label, value]) => (
                  <Field key={name}>
                    <FieldLabel htmlFor={`meeting-${name}`}>{label}</FieldLabel>
                    <Input
                      name={name}
                      id={`meeting-${name}`}
                      required
                      defaultValue={value}
                    />
                  </Field>
                ))}
              </FieldGroup>
              <Button>Save meeting</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!joining}
        onOpenChange={(open) => {
          if (!open) setJoining(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{joining?.title}</DialogTitle>
            <DialogDescription>
              Local meeting preview · {joining?.time} · {joining?.duration}
            </DialogDescription>
          </DialogHeader>
          <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-lg border bg-muted">
            <Video className="size-10 text-muted-foreground" />
            <p className="text-sm">Ready to join</p>
          </div>
          <p className="text-xs text-muted-foreground">
            No camera, microphone, or external meeting service is connected.
          </p>
          <Separator />
          <Button variant="outline" onClick={() => setJoining(null)}>
            Leave preview
          </Button>
        </DialogContent>
      </Dialog>
    </CardStage>
  );
}
