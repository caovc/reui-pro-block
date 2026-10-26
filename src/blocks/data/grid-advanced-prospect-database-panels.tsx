import { useState, type ReactNode } from "react";
import { Area, AreaChart, Bar, BarChart, Cell, YAxis } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import {
  ArrowLeftRight,
  Building2,
  Check,
  ChevronDown,
  Copy,
  Download,
  Ellipsis,
  FileText,
  ListPlus,
  Plus,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { Badge } from "@/components/reui/badge";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import { IconTile } from "@/components/reui/icon-tile";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field";
import {
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from "@/components/reui/timeline";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { demoAvatar } from "@/lib/demo-artwork";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { downloadCsv } from "./data-utils";
import {
  prospectFunding,
  prospectIndustries,
  prospectOwners,
  prospectStatuses,
  type Prospect,
  type ProspectList,
  type ProspectOwnerId,
  type ProspectStatus,
} from "./grid-advanced-prospect-database-data";
import {
  prospectGrowth,
  prospectHandoverPreview,
  prospectIntent,
  validateProspectDraft,
  type ProspectCommand,
} from "./grid-advanced-prospect-database-model";

export function ProspectOwnerAvatar({ ownerId }: { ownerId: ProspectOwnerId | null }) {
  const owner = prospectOwners.find((item) => item.id === ownerId);
  if (!owner)
    return (
      <span className="inline-flex size-5 items-center justify-center rounded-full border border-dashed text-muted-foreground">
        <Plus className="size-3" />
      </span>
    );
  return (
    <Avatar className="size-5">
      <AvatarImage src={demoAvatar(owner.name)} alt="" />
      <AvatarFallback className="text-[8px]">{owner.initials}</AvatarFallback>
    </Avatar>
  );
}

export function ProspectOwnerMenu({
  record,
  onChange,
}: {
  record: Prospect;
  onChange: (owner: ProspectOwnerId | null) => void;
}) {
  const owner = prospectOwners.find((item) => item.id === record.ownerId);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="prospect-inline-menu"
          aria-label={`Owner of ${record.name}: ${owner?.name ?? "unassigned"}. Change`}
        >
          <ProspectOwnerAvatar ownerId={record.ownerId} />
          <span>{owner?.short ?? "Assign"}</span>
          <ChevronDown className="size-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[204px]">
        <DropdownMenuLabel>Owner</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={record.ownerId ?? "unassigned"}
          onValueChange={(value) =>
            onChange(value === "unassigned" ? null : (value as ProspectOwnerId))
          }
        >
          {prospectOwners.map((item) => (
            <DropdownMenuRadioItem key={item.id} value={item.id}>
              <ProspectOwnerAvatar ownerId={item.id} />
              {item.name}
              {item.id === "mara" && (
                <span className="ml-auto text-xs text-muted-foreground">You</span>
              )}
            </DropdownMenuRadioItem>
          ))}
          <DropdownMenuRadioItem value="unassigned">
            <ProspectOwnerAvatar ownerId={null} />
            Unassigned
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ProspectStatusBadge({ status }: { status: ProspectStatus }) {
  const variants = {
    New: "warning-light",
    Researching: "focus-light",
    Contacted: "invert-light",
    Qualified: "success-light",
    Disqualified: "destructive-light",
  } as const;
  return (
    <Badge variant={variants[status]}>
      <span className="size-1.5 rounded-full bg-current" />
      {status}
    </Badge>
  );
}

export function ProspectStatusMenu({
  record,
  onChange,
}: {
  record: Prospect;
  onChange: (status: ProspectStatus) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="prospect-inline-menu"
          aria-label={`Status for ${record.name}: ${record.status}. Change`}
        >
          <ProspectStatusBadge status={record.status} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        <DropdownMenuLabel>Status</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={record.status}
          onValueChange={(value) => onChange(value as ProspectStatus)}
        >
          {prospectStatuses.map((status) => (
            <DropdownMenuRadioItem key={status} value={status}>
              <ProspectStatusBadge status={status} />
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ProspectListItems({
  ids,
  records,
  lists,
  onCommand,
  onCreate,
}: {
  ids: string[];
  records: Prospect[];
  lists: ProspectList[];
  onCommand: (command: ProspectCommand, message: string) => void;
  onCreate: () => void;
}) {
  const selected = records.filter((record) => ids.includes(record.id));
  return (
    <>
      <DropdownMenuLabel>Lists</DropdownMenuLabel>
      <DropdownMenuGroup>
        {lists.map((list) => {
          const saved =
            selected.length > 0 && selected.every((record) => record.listIds.includes(list.id));
          return (
            <DropdownMenuItem
              key={list.id}
              onSelect={() =>
                onCommand(
                  { type: "toggle-list", ids, listId: list.id },
                  saved ? `Removed from ${list.name}` : `Saved to ${list.name}`,
                )
              }
            >
              {list.name}
              {saved && (
                <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                  <Check className="size-3" />
                  Saved
                </span>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={onCreate}>
        <Plus />
        New list
      </DropdownMenuItem>
    </>
  );
}

export function ProspectHeadcount({
  record,
  large = false,
}: {
  record: Prospect;
  large?: boolean;
}) {
  const maximum = Math.max(
    1,
    ...record.headcount.filter((value): value is number => value !== null),
  );
  const points = record.headcount.map((count, month) => ({ month, count }));
  return (
    <ChartContainer
      config={{ count: { label: "People", color: "var(--color-muted-foreground)" } }}
      className={cn("prospect-headcount", large && "prospect-headcount-large")}
      initialDimension={{ width: large ? 480 : 32, height: large ? 64 : 16 }}
      role="img"
      aria-label={`Six-month headcount: ${record.headcount.map((value) => value ?? "not recorded").join(", ")}`}
    >
      {large ? (
        <AreaChart
          accessibilityLayer={false}
          data={points}
          margin={{ top: 4, right: 3, bottom: 0, left: 0 }}
        >
          <YAxis hide domain={["dataMin - 20", "dataMax + 20"]} />
          <Area
            dataKey="count"
            type="monotone"
            stroke="var(--color-blue-500)"
            strokeWidth={1.5}
            fill="var(--color-blue-500)"
            fillOpacity={0.12}
            connectNulls={false}
            isAnimationActive={false}
            dot={(props) =>
              props.index === points.length - 1 && props.payload.count !== null ? (
                <circle
                  key="latest"
                  cx={props.cx}
                  cy={props.cy}
                  r={2}
                  fill="var(--color-blue-500)"
                />
              ) : (
                <g key={props.index} />
              )
            }
          />
        </AreaChart>
      ) : (
        <BarChart
          accessibilityLayer={false}
          data={points}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          barCategoryGap={1}
        >
          <YAxis hide domain={[0, maximum]} />
          <Bar dataKey="count" radius={1} isAnimationActive={false}>
            {points.map((point) => (
              <Cell
                key={point.month}
                fill={point.month === 5 ? "var(--color-foreground)" : "var(--color-count)"}
                fillOpacity={point.month === 5 ? 0.75 : 0.45}
              />
            ))}
          </Bar>
        </BarChart>
      )}
    </ChartContainer>
  );
}

function DetailValue({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-5 py-1">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium tabular-nums">{children}</dd>
    </div>
  );
}

export function ProspectDetails({
  record,
  lists,
  records,
  onClose,
  onCloseAutoFocus,
  onEdit,
  onCommand,
  onCreateList,
}: {
  record: Prospect;
  records: Prospect[];
  lists: ProspectList[];
  onClose: () => void;
  onCloseAutoFocus: (event: Event) => void;
  onEdit: () => void;
  onCommand: (command: ProspectCommand, message: string) => void;
  onCreateList: () => void;
}) {
  const growth = prospectGrowth(record);
  const [deleteOpen, setDeleteOpen] = useState(false);
  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent className="prospect-database-sheet" onCloseAutoFocus={onCloseAutoFocus}>
        <SheetHeader className="px-5 py-3 pr-20">
          <div className="flex items-center gap-3">
            <IconTile size="sm">
              <Building2 />
            </IconTile>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <SheetTitle>{record.name}</SheetTitle>
                <ProspectStatusBadge status={record.status} />
              </div>
              <SheetDescription className="truncate">
                {record.domain} · {record.city}
              </SheetDescription>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="absolute right-12 top-3 size-7"
                aria-label="More actions"
              >
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Company</DropdownMenuLabel>
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={onEdit}>Edit</DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Assign owner</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="min-w-[204px]">
                    <DropdownMenuLabel>Owner</DropdownMenuLabel>
                    <DropdownMenuRadioGroup
                      value={record.ownerId ?? "unassigned"}
                      onValueChange={(value) => {
                        const ownerId = value === "unassigned" ? null : (value as ProspectOwnerId);
                        if (ownerId !== record.ownerId)
                          onCommand(
                            { type: "patch", ids: [record.id], patch: { ownerId } },
                            `${record.name} reassigned`,
                          );
                      }}
                    >
                      {prospectOwners.map((owner) => (
                        <DropdownMenuRadioItem key={owner.id} value={owner.id}>
                          <ProspectOwnerAvatar ownerId={owner.id} />
                          {owner.name}
                          {owner.id === "mara" && (
                            <span className="ml-auto text-xs text-muted-foreground">You</span>
                          )}
                        </DropdownMenuRadioItem>
                      ))}
                      <DropdownMenuRadioItem value="unassigned">
                        <ProspectOwnerAvatar ownerId={null} />
                        Unassigned
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuItem
                  onSelect={() =>
                    downloadCsv(`prospect-${record.name}`, [
                      {
                        Company: record.name,
                        Domain: record.domain,
                        Industry: record.industry,
                        City: record.city,
                        Country: record.country,
                        Employees: record.employees,
                        Intent: record.intent,
                        Contacts: record.contacts,
                        Owner:
                          prospectOwners.find((owner) => owner.id === record.ownerId)?.name ?? "",
                        Status: record.status,
                      },
                    ])
                  }
                >
                  <Download />
                  Export CSV
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onSelect={() => setDeleteOpen(true)}>
                <Trash2 />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SheetHeader>
        <Tabs defaultValue="overview" className="min-h-0 flex-1 gap-0">
          <div className="overflow-x-auto border-b px-5">
            <TabsList variant="line" className="h-10 w-max gap-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="contacts">
                Contacts<Badge variant="secondary">{record.people.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="signals">
                Signals<Badge variant="secondary">{record.signals.length}</Badge>
              </TabsTrigger>
            </TabsList>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            <TabsContent value="overview" className="space-y-4">
              <Frame dense spacing="sm">
                <FrameHeader>
                  <FrameTitle>Firmographics</FrameTitle>
                  <FrameDescription className="text-xs">Who they are and how big</FrameDescription>
                </FrameHeader>
                <FramePanel className="px-3 py-2">
                  <dl>
                    <DetailValue label="Industry">{record.industry}</DetailValue>
                    <DetailValue label="Headquarters">
                      {record.city}, {record.country}
                    </DetailValue>
                    <DetailValue label="Employees">{record.employees.toLocaleString()}</DetailValue>
                    <DetailValue label="Growth, 6 months">
                      {growth === null ? "Not recorded" : `${growth > 0 ? "+" : ""}${growth}%`}
                    </DetailValue>
                    <DetailValue label="Revenue">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                        notation: "compact",
                        maximumFractionDigits: 1,
                      }).format(record.revenue)}
                    </DetailValue>
                    <DetailValue label="Funding">{record.funding}</DetailValue>
                    <DetailValue label="Founded">{record.founded}</DetailValue>
                  </dl>
                </FramePanel>
              </Frame>
              <Frame dense spacing="sm">
                <FrameHeader>
                  <FrameTitle>Headcount</FrameTitle>
                  <FrameDescription className="text-xs">
                    Month-end team size over six months
                  </FrameDescription>
                </FrameHeader>
                <FramePanel className="p-3">
                  <ProspectHeadcount record={record} large />
                  <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
                    <span>Apr · {record.headcount[0]?.toLocaleString() ?? "Not recorded"}</span>
                    <span>Now · {record.employees.toLocaleString()}</span>
                  </div>
                </FramePanel>
              </Frame>
              <Frame dense spacing="sm">
                <FrameHeader>
                  <FrameTitle>Outreach</FrameTitle>
                  <FrameDescription className="text-xs">Where this account stands</FrameDescription>
                </FrameHeader>
                <FramePanel className="px-3 py-2">
                  <dl>
                    <DetailValue label="Owner">
                      <ProspectOwnerMenu
                        record={record}
                        onChange={(ownerId) =>
                          onCommand(
                            { type: "patch", ids: [record.id], patch: { ownerId } },
                            `${record.name} reassigned`,
                          )
                        }
                      />
                    </DetailValue>
                    <DetailValue label="Intent">
                      {record.intent} · {prospectIntent(record.intent)}
                    </DetailValue>
                    <DetailValue label="Contacts">{record.contacts} people</DetailValue>
                    <DetailValue label="Last activity">
                      {new Intl.DateTimeFormat("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        timeZone: "UTC",
                      }).format(new Date(`${record.lastActivity}T12:00:00Z`))}
                    </DetailValue>
                    <DetailValue label="Lists">
                      <span className="flex flex-wrap justify-end gap-1">
                        {lists
                          .filter((list) => record.listIds.includes(list.id))
                          .map((list) => (
                            <Badge key={list.id} variant="outline">
                              {list.name}
                            </Badge>
                          ))}
                      </span>
                    </DetailValue>
                  </dl>
                </FramePanel>
              </Frame>
            </TabsContent>
            <TabsContent value="contacts">
              <Frame dense spacing="sm">
                <FrameHeader>
                  <FrameTitle>Key Contacts</FrameTitle>
                  <FrameDescription className="text-xs">
                    {record.people.length} of {record.contacts} people
                  </FrameDescription>
                </FrameHeader>
                <FramePanel className="px-3 py-1.5">
                  {record.people.length ? (
                    record.people.map((person) => (
                      <div key={person.id} className="prospect-contact-row">
                        <Avatar className="size-8">
                          <AvatarImage src={demoAvatar(person.name)} alt="" />
                          <AvatarFallback>
                            {person.name
                              .split(" ")
                              .map((part) => part[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{person.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{person.role}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="icon-sm"
                          className="size-8"
                          aria-label={`Copy ${person.name}'s email`}
                          onClick={() => {
                            void navigator.clipboard.writeText(person.email).then(
                              () => toast.success("Email copied"),
                              () => toast.error("Could not copy email"),
                            );
                          }}
                        >
                          <Copy />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="py-8 text-center text-muted-foreground">
                      No contacts recorded yet.
                    </p>
                  )}
                </FramePanel>
              </Frame>
            </TabsContent>
            <TabsContent value="signals">
              <Frame dense spacing="sm">
                <FrameHeader>
                  <FrameTitle>Buying Signals</FrameTitle>
                  <FrameDescription className="text-xs">
                    Most recent account activity
                  </FrameDescription>
                </FrameHeader>
                <FramePanel className="p-4">
                  {record.signals.length ? (
                    <Timeline value={record.signals.length}>
                      {record.signals.map((signal, index) => (
                        <TimelineItem key={signal.id} step={index + 1}>
                          <TimelineIndicator className="flex size-5 items-center justify-center border bg-background [&>svg]:size-2.5">
                            {signal.kind === "pricing" ? (
                              <Sparkles />
                            ) : signal.kind === "research" ? (
                              <FileText />
                            ) : (
                              <Users />
                            )}
                          </TimelineIndicator>
                          <TimelineSeparator />
                          <TimelineHeader>
                            <TimelineTitle className="text-sm font-medium">
                              {signal.title}
                            </TimelineTitle>
                          </TimelineHeader>
                          <TimelineContent className="space-y-1">
                            <p>{signal.description}</p>
                            <TimelineDate dateTime={signal.date} className="mb-0 font-normal">
                              {new Intl.DateTimeFormat("en-GB", {
                                day: "numeric",
                                month: "short",
                                timeZone: "UTC",
                              }).format(new Date(`${signal.date}T12:00:00Z`))}
                            </TimelineDate>
                          </TimelineContent>
                        </TimelineItem>
                      ))}
                    </Timeline>
                  ) : (
                    <p className="py-8 text-center text-muted-foreground">
                      No signals recorded yet.
                    </p>
                  )}
                </FramePanel>
              </Frame>
            </TabsContent>
          </div>
        </Tabs>
        <div className="flex flex-wrap items-center gap-2 border-t px-5 py-3">
          <Select
            value={record.status}
            onValueChange={(value) => {
              if (value !== record.status)
                onCommand(
                  { type: "patch", ids: [record.id], patch: { status: value as ProspectStatus } },
                  `${record.name} status updated`,
                );
            }}
          >
            <SelectTrigger aria-label="Status" className="h-8 w-40 shrink-0">
              <SelectValue>
                <Badge variant="outline" className="gap-1 font-normal">
                  <span
                    className={cn(
                      "prospect-status-dot",
                      `prospect-status-${record.status.toLocaleLowerCase()}`,
                    )}
                  />
                  {record.status}
                </Badge>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {prospectStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  <ProspectStatusBadge status={status} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex-1" />
          <Button variant="outline" onClick={onEdit}>
            Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default">
                <ListPlus />
                Save to List
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <ProspectListItems
                ids={[record.id]}
                records={records}
                lists={lists}
                onCommand={onCommand}
                onCreate={onCreateList}
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {record.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                It leaves the database with its contacts, signals and lists. You can undo it
                straight after.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() => {
                  onCommand({ type: "remove", ids: [record.id] }, `${record.name} deleted`);
                  onClose();
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
}

function OptionSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger aria-label={label} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

function newProspect(): Prospect {
  return {
    id: crypto.randomUUID(),
    name: "",
    domain: "",
    industry: "Software",
    city: "",
    country: "",
    employees: 0,
    headcount: [null, null, null, null, null, 0],
    intent: 0,
    contacts: 0,
    ownerId: "mara",
    status: "New",
    funding: "Seed",
    revenue: 0,
    founded: 2026,
    lastActivity: "2026-10-26",
    listIds: [],
    people: [],
    signals: [],
  };
}

export function ProspectEditor({
  record,
  records,
  onClose,
  onCloseAutoFocus,
  onSave,
  onDelete,
}: {
  record: Prospect | null;
  records: Prospect[];
  onClose: () => void;
  onCloseAutoFocus: (event: Event) => void;
  onSave: (record: Prospect) => void;
  onDelete: (record: Prospect) => void;
}) {
  const [draft, setDraft] = useState<Prospect>(() =>
    record
      ? structuredClone(record)
      : {
          ...newProspect(),
          city: records[0]?.city ?? "Rotterdam",
          country: records[0]?.country ?? "Netherlands",
        },
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const headquarters = Array.from(
    new Map(
      [...records, draft].map(({ city, country }) => [
        JSON.stringify([city, country]),
        { city, country },
      ]),
    ).entries(),
    ([value, { city, country }]) => ({ value, label: `${city}, ${country}` }),
  );
  const update = <K extends keyof Prospect>(key: K, value: Prospect[K]) =>
    setDraft((previous) => ({ ...previous, [key]: value }));
  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent className="prospect-database-sheet" onCloseAutoFocus={onCloseAutoFocus}>
        <SheetHeader className="border-b p-5 pr-12">
          <SheetTitle>{record ? "Edit Company" : "Add Company"}</SheetTitle>
          <SheetDescription>
            Start with a company domain. Contacts are matched on it.
          </SheetDescription>
        </SheetHeader>
        <form
          className="flex min-h-0 flex-1 flex-col"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            const next = validateProspectDraft(draft, records);
            setErrors(next);
            if (!Object.keys(next).length) onSave(draft);
          }}
        >
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="prospect-company-name">Company Name</FieldLabel>
              <Input
                id="prospect-company-name"
                value={draft.name}
                autoComplete="organization"
                aria-invalid={!!errors.name}
                onChange={(event) => update("name", event.target.value)}
              />
              {errors.name && <FieldError>{errors.name}</FieldError>}
            </Field>
            <Field data-invalid={!!errors.domain}>
              <FieldLabel htmlFor="prospect-company-domain">Domain</FieldLabel>
              <Input
                id="prospect-company-domain"
                value={draft.domain}
                placeholder="company.example"
                aria-invalid={!!errors.domain}
                onChange={(event) => update("domain", event.target.value)}
              />
              <FieldDescription>Contacts matched on it</FieldDescription>
              {errors.domain && <FieldError>{errors.domain}</FieldError>}
            </Field>
            <div className="grid grid-cols-2 gap-x-4 gap-y-7">
              <OptionSelect
                label="Industry"
                value={draft.industry}
                options={prospectIndustries.map((value) => ({ value, label: value }))}
                onChange={(value) => update("industry", value as Prospect["industry"])}
              />
              <OptionSelect
                label="Headquarters"
                value={JSON.stringify([draft.city, draft.country])}
                options={headquarters}
                onChange={(value) => {
                  const [city, country] = JSON.parse(value) as [string, string];
                  setDraft((previous) => ({ ...previous, city, country }));
                }}
              />
              <Field data-invalid={!!errors.employees}>
                <FieldLabel htmlFor="prospect-employees">Employees</FieldLabel>
                <NumberField
                  id="prospect-employees"
                  min={0}
                  max={100000000}
                  step={1}
                  value={draft.employees}
                  onValueChange={(value) => {
                    if (value !== null)
                      setDraft((previous) => ({
                        ...previous,
                        employees: value,
                        headcount: [
                          ...previous.headcount.slice(0, 5),
                          value,
                        ] as Prospect["headcount"],
                      }));
                  }}
                >
                  <NumberFieldGroup>
                    <NumberFieldDecrement aria-label="Decrease employees" />
                    <NumberFieldInput
                      aria-label="Employees"
                      className="text-left"
                      aria-invalid={!!errors.employees}
                    />
                    <NumberFieldIncrement aria-label="Increase employees" />
                  </NumberFieldGroup>
                </NumberField>
                {errors.employees && <FieldError>{errors.employees}</FieldError>}
              </Field>
              <OptionSelect
                label="Funding"
                value={draft.funding}
                options={prospectFunding.map((value) => ({ value, label: value }))}
                onChange={(value) => update("funding", value as Prospect["funding"])}
              />
              <OptionSelect
                label="Owner"
                value={draft.ownerId ?? "unassigned"}
                options={[
                  ...prospectOwners.map((owner) => ({ value: owner.id, label: owner.name })),
                  { value: "unassigned", label: "Unassigned" },
                ]}
                onChange={(value) =>
                  update("ownerId", value === "unassigned" ? null : (value as ProspectOwnerId))
                }
              />
              <OptionSelect
                label="Status"
                value={draft.status}
                options={prospectStatuses.map((value) => ({ value, label: value }))}
                onChange={(value) => update("status", value as ProspectStatus)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 border-t px-5 py-3">
            {record && (
              <Button
                variant="ghost"
                type="button"
                className="text-destructive"
                onClick={() => onDelete(record)}
              >
                Delete
              </Button>
            )}
            <div className="flex-1" />
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{record ? "Save Changes" : "Add Company"}</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export function ProspectHandover({
  records,
  onClose,
  onCommit,
}: {
  records: Prospect[];
  onClose: () => void;
  onCommit: (from: ProspectOwnerId, to: ProspectOwnerId, count: number) => void;
}) {
  const [from, setFrom] = useState<ProspectOwnerId>("mara");
  const [to, setTo] = useState<ProspectOwnerId>("kian");
  const preview = prospectHandoverPreview(records, from, to);
  const fromOwner = prospectOwners.find((owner) => owner.id === from)!;
  const moving = records.filter((record) => preview.eligibleIds.includes(record.id));
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="prospect-handover-dialog gap-4 p-4">
        <DialogHeader>
          <DialogTitle>Hand Over Accounts</DialogTitle>
          <DialogDescription>
            Open accounts move to a teammate; closed ones stay as history.
          </DialogDescription>
        </DialogHeader>
        <div className="relative grid gap-1.5">
          {(["From", "To"] as const).map((label) => {
            const source = label === "From";
            const ownerId = source ? from : to;
            const owned = source ? preview.owned : preview.recipientOwned;
            const count = source
              ? preview.eligibleIds.length
              : preview.recipientOwned + preview.eligibleIds.length;
            return (
              <div key={label} className="space-y-3 rounded-xl bg-muted/40 p-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{label}</span>
                  <span>Owns {owned}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <Select
                    value={ownerId}
                    onValueChange={(value) => (source ? setFrom : setTo)(value as ProspectOwnerId)}
                  >
                    <SelectTrigger aria-label={label} className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {prospectOwners.map((owner) => (
                        <SelectItem key={owner.id} value={owner.id}>
                          <ProspectOwnerAvatar ownerId={owner.id} />
                          {owner.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="text-right tabular-nums">
                    <p className="text-2xl leading-7 font-semibold">{count}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {source
                        ? `${preview.contacts} contacts`
                        : `+${preview.eligibleIds.length} incoming`}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          <Button
            variant="outline"
            size="icon-sm"
            className="absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background"
            aria-label="Swap account owners"
            onClick={() => {
              setFrom(to);
              setTo(from);
            }}
          >
            <ArrowLeftRight className="rotate-90" />
          </Button>
        </div>
        <div className="space-y-4 text-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium">{preview.highIntent} High Intent</p>
              <p className="text-xs text-muted-foreground">Worth a call first</p>
            </div>
            <div className="flex max-w-28 flex-wrap justify-end gap-0.5" aria-hidden="true">
              {moving.map((record) => (
                <span
                  key={record.id}
                  className={cn("size-2 rounded-full", {
                    "bg-emerald-500": prospectIntent(record.intent) === "high",
                    "bg-amber-400": prospectIntent(record.intent) === "medium",
                    "bg-rose-500": prospectIntent(record.intent) === "low",
                  })}
                />
              ))}
            </div>
          </div>
          <dl className="space-y-2 [&>div]:py-0">
            <DetailValue label="Mid conversation">
              {preview.conversations} {preview.conversations === 1 ? "account" : "accounts"}
            </DetailValue>
            <DetailValue label={`Stays with ${fromOwner.name}`}>
              {preview.retained} closed accounts
            </DetailValue>
            <DetailValue label="Status and lists">Kept as they are</DetailValue>
          </dl>
        </div>
        <DialogFooter className="-mx-4 -mb-4 border-t bg-muted/30 p-4">
          <Button
            className="w-full"
            disabled={!preview.eligibleIds.length || from === to}
            onClick={() => onCommit(from, to, preview.eligibleIds.length)}
          >
            <ArrowLeftRight />
            Hand Over {preview.eligibleIds.length} Accounts
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ProspectCreateList({
  lists,
  onClose,
  onCreate,
}: {
  lists: ProspectList[];
  onClose: () => void;
  onCreate: (list: ProspectList) => void;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>New list</DialogTitle>
          <DialogDescription>Create a list and save the chosen accounts to it.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const clean = name.trim();
            if (!clean) {
              setError("Enter a list name.");
              return;
            }
            if (lists.some((list) => list.name.toLocaleLowerCase() === clean.toLocaleLowerCase())) {
              setError("A list with this name already exists.");
              return;
            }
            onCreate({ id: crypto.randomUUID(), name: clean });
          }}
        >
          <Field data-invalid={!!error}>
            <FieldLabel htmlFor="prospect-list-name">List name</FieldLabel>
            <Input
              id="prospect-list-name"
              value={name}
              aria-invalid={!!error}
              onChange={(event) => {
                setName(event.target.value);
                setError("");
              }}
            />
            {error && <FieldError>{error}</FieldError>}
          </Field>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Create list</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
