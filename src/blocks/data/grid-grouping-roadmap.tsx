import { Badge } from "@/components/reui/badge";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  BookOpen,
  Bot,
  CalendarDays,
  CreditCard,
  Database,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { DomainGroupedGrid } from "./grid-advanced-group-model";
import { domainTextMatches } from "./grid-advanced-model-grid";
import {
  AddRecord,
  Button,
  Checkbox,
  GridFrame,
  GridSearch,
  Ring,
  RowMenu,
  TableOptions,
  TinyAvatar,
} from "./grid-advanced-shared";
import { cn } from "./grid-advanced-utils";

const stages = ["Backlog", "To Do", "In Progress", "Done"] as const;
type Stage = (typeof stages)[number];
type Signal = "Queued" | "At risk" | "On track" | "Blocked" | "Done";
type Task = {
  id: number;
  name: string;
  stage: Stage;
  owners: string[];
  category: string;
  due: string;
  progress: number | null;
  signal: Signal;
};
const taskNames = [
  "Draft first-run board tips",
  "Map invoice retries to health cards",
  "Guard archived pages",
  "Audit assistant fallback prompts for unsupported intents",
  "Scope vendor admin roles",
  "Define regional quiet hours for digest notifications",
  "Prototype mobile composer",
  "Connect revenue alerts to renewals",
  "Write handoff checklist for knowledge base imports",
  "Separate SSO exception review from the access queue",
  "Preview announcement routing",
  "Tune citation scoring for generated release notes",
  "Ship onboarding status badges",
  "Review swipe-to-archive recovery",
  "Show warehouse lag in ops dashboards",
  "Clarify webhook retry copy",
  "Publish renewal alert audit trail",
  "Launch knowledge import validator",
  "Release mobile undo affordance",
];
const taskOwners = [
  ["Rina Holt", "Noor Albright"],
  ["Vale Aksoy"],
  ["Noor Albright"],
  ["Sora Min", "Rina Holt"],
  ["Evren Blake", "Sora Min"],
  [],
  ["Mina Rowe"],
  ["Vale Aksoy", "Rina Holt"],
  ["Noor Albright", "Evren Blake"],
  ["Evren Blake", "Sora Min", "Vale Aksoy"],
  ["Rina Holt"],
  ["Sora Min", "Noor Albright"],
  ["Rina Holt", "Mina Rowe"],
  ["Mina Rowe", "Evren Blake"],
  [],
  ["Vale Aksoy", "Rina Holt"],
  ["Vale Aksoy", "Rina Holt"],
  ["Noor Albright", "Evren Blake"],
  ["Mina Rowe", "Sora Min"],
];
const categories = [
  "Adoption",
  "Revenue",
  "Knowledge",
  "AI Quality",
  "Access",
  "Messaging",
  "Mobile",
  "Revenue",
  "Workflow",
  "Access",
  "Messaging",
  "AI Quality",
  "Adoption",
  "Mobile",
  "Insights",
  "Reliability",
  "Revenue",
  "Knowledge",
  "Mobile",
];
const dates = [
  "2026-12-22",
  "2026-03-03",
  "2026-08-18",
  "2026-11-29",
  "2026-01-14",
  "2026-02-11",
  "2026-04-27",
  "2026-10-14",
  "2026-09-30",
  "2026-05-08",
  "2026-07-21",
  "2026-12-19",
  "2026-08-25",
  "2026-11-02",
  "2026-06-06",
  "2026-04-03",
  "2026-03-18",
  "2026-03-26",
  "2026-04-12",
];
const signals: Signal[] = [
  "Queued",
  "At risk",
  "Queued",
  "On track",
  "Blocked",
  "Queued",
  "On track",
  "At risk",
  "Queued",
  "Blocked",
  "On track",
  "On track",
  "On track",
  "At risk",
  "Blocked",
  "On track",
  "Done",
  "Done",
  "Done",
];
const progress = [18, 34, 12, 42, 9, null, 46, 58, 37, 29, 51, 76, 88, 67, 41, 82, 100, 100, 100];
const initialTasks: Task[] = taskNames.map((name, index) => ({
  id: index + 1,
  name,
  stage: stages[index < 6 ? 0 : index < 11 ? 1 : index < 16 ? 2 : 3],
  owners: taskOwners[index],
  category: categories[index],
  due: dates[index],
  progress: progress[index],
  signal: signals[index],
}));
const stageDescriptions = [
  "Ideas waiting for product shaping",
  "Scoped work ready for owners",
  "Active delivery with review signals",
  "Recently shipped and verified work",
];
const icons = {
  Adoption: Sparkles,
  Revenue: CreditCard,
  Knowledge: BookOpen,
  "AI Quality": Bot,
  Access: ShieldCheck,
  Messaging: Bell,
  Mobile: Smartphone,
  Workflow: BookOpen,
  Insights: Database,
  Reliability: Bell,
};
const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
});

function SignalBadge({ value }: { value: Signal }) {
  return (
    <Badge
      variant={
        value === "Blocked"
          ? "destructive-light"
          : value === "At risk"
            ? "warning-light"
            : value === "On track" || value === "Done"
              ? "success-light"
              : "secondary"
      }
      className="h-5 rounded-sm px-1.5 text-xs font-normal"
    >
      {value}
    </Badge>
  );
}

export default function Roadmap() {
  const [rows, setRows] = useState(initialTasks);
  const [query, setQuery] = useState("");
  const [signalFilter, setSignalFilter] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [compact, setCompact] = useState(false);
  const matches = (row: Task) => !signalFilter.length || signalFilter.includes(row.signal);
  const filtered = rows.filter((row) => domainTextMatches(row, query) && matches(row));
  return (
    <GridFrame
      title="Roadmap Queue"
      description="Track work by stage, owner, and signal."
      className="mt-8 max-sm:mt-12 max-sm:w-[calc(100%-72px)] rounded-none border-0 shadow-none [&_[data-slot=frame-panel]]:m-0! [&_[data-slot=frame-panel]>header]:bg-transparent [&_[data-slot=frame-panel]>header]:px-0 [&_[data-slot=frame-panel]>header]:pt-0 [&_[data-slot=frame-panel]>header]:pb-5 [&_h2]:text-xl [&_header_p]:mt-1 [&_header_p]:text-sm max-sm:[&_[data-slot=frame-panel]>header]:pb-[25px]"
      summary={
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {[
            ["Tasks", rows.length],
            ["Blocked", rows.filter((r) => r.signal === "Blocked").length],
            ["At risk", rows.filter((r) => r.signal === "At risk").length],
            ["Unassigned", rows.filter((r) => !r.owners.length).length],
          ].map(([label, count]) => (
            <span
              key={label}
              className="flex items-center gap-2 border-r pr-3 last:border-0 last:pr-0"
            >
              {label}
              <Badge
                variant={
                  label === "Blocked"
                    ? "destructive-light"
                    : label === "At risk"
                      ? "warning-light"
                      : "secondary"
                }
                className="rounded-sm px-1.5 text-xs font-normal"
              >
                {count}
              </Badge>
            </span>
          ))}
        </div>
      }
    >
      <div className="flex flex-wrap items-center gap-2 border-b px-3 py-3">
        <div className="w-full sm:w-96 [&>div]:w-full! [&>div]:max-w-none!">
          <GridSearch value={query} onChange={setQuery} placeholder="Search roadmap..." />
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Bell className="size-3.5" />
                Signals
                {signalFilter.length > 0 && (
                  <Badge variant="secondary">{signalFilter.length}</Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Signal</DropdownMenuLabel>
                {(["Blocked", "At risk", "On track", "Queued", "Done"] as Signal[]).map(
                  (signal) => (
                    <DropdownMenuCheckboxItem
                      key={signal}
                      checked={signalFilter.includes(signal)}
                      onSelect={(event) => event.preventDefault()}
                      onCheckedChange={(checked) =>
                        setSignalFilter((current) =>
                          checked
                            ? [...current, signal]
                            : current.filter((value) => value !== signal),
                        )
                      }
                    >
                      {signal}
                    </DropdownMenuCheckboxItem>
                  ),
                )}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <TableOptions
            columns={["Owner", "Category", "Due date", "Progress", "Signal"]}
            hidden={hidden}
            setHidden={setHidden}
            density={compact}
            setDensity={setCompact}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => setCollapsed(collapsed.length === stages.length ? [] : [...stages])}
          >
            {collapsed.length === stages.length ? "Expand groups" : "Collapse groups"}
          </Button>
          <AddRecord
            label="New task"
            title="New roadmap task"
            fields={[{ name: "name", label: "Task title" }]}
            onSave={(values) => {
              setRows((current) => [
                ...current,
                {
                  id: Math.max(0, ...current.map((row) => row.id)) + 1,
                  name: values.name,
                  stage: "Backlog",
                  owners: [],
                  category: "Adoption",
                  due: "2026-12-31",
                  progress: 0,
                  signal: "Queued",
                },
              ]);
            }}
          />
        </div>
      </div>
      {selected.length > 0 && (
        <div className="flex items-center gap-3 border-b bg-primary/5 px-3 py-2">
          <span>{selected.length} selected</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setRows((current) =>
                current.map((row) =>
                  selected.includes(String(row.id))
                    ? { ...row, stage: "Done", progress: 100, signal: "Done" }
                    : row,
                ),
              );
              setSelected([]);
            }}
          >
            Mark done
          </Button>
        </div>
      )}
      <DomainGroupedGrid
        groups={stages.map((stage, index) => ({
          id: stage,
          title: stage,
          description: stageDescriptions[index],
          children: rows.filter((row) => row.stage === stage),
        }))}
        getId={(row) => String(row.id)}
        search={query}
        filter={matches}
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        hidden={hidden}
        onHiddenChange={setHidden}
        selection={selected}
        onSelectionChange={setSelected}
        header="none"
        className={cn(
          "[&_tbody_tr[data-row-id^='group:']]:h-11",
          compact ? "[&_tbody_tr]:h-[33px] [&_tbody_td]:py-0.5" : "[&_tbody_tr]:h-[41px]",
        )}
        renderGroup={(group) => (
          <>
            <span
              className={cn(
                "size-2 shrink-0 rounded-full",
                group.id === "Done"
                  ? "bg-emerald-500"
                  : group.id === "In Progress"
                    ? "bg-sky-500"
                    : group.id === "To Do"
                      ? "bg-amber-500"
                      : "bg-neutral-400",
              )}
            />
            <span className="font-medium">{group.title}</span>
            <Badge variant="outline" className="h-5 rounded-sm px-1.5 font-normal">
              {filtered.filter((row) => row.stage === group.id).length}
            </Badge>
            <span className="ml-auto text-xs text-muted-foreground">{group.description}</span>
          </>
        )}
        fields={[
          {
            id: "name",
            title: "Task",
            value: (row) => row.name,
            size: 375,
            className: "px-3 py-1.5",
            render: (row, _index, gridRow) => {
              const Icon = icons[row.category as keyof typeof icons] || Sparkles;
              return (
                <div className="flex min-w-0 items-center gap-3 pl-9 max-sm:pl-8">
                  <span className="group/task relative flex size-7 shrink-0 items-center justify-center rounded-lg border">
                    <Icon
                      className={cn(
                        "size-3.5 group-hover/task:opacity-0",
                        gridRow.getIsSelected() && "opacity-0",
                      )}
                    />
                    <Checkbox
                      aria-label={`Select ${row.name}`}
                      checked={gridRow.getIsSelected()}
                      onCheckedChange={(checked) => gridRow.toggleSelected(!!checked)}
                      className={cn(
                        "absolute opacity-0 group-hover/task:opacity-100 focus-visible:opacity-100",
                        gridRow.getIsSelected() && "opacity-100",
                      )}
                    />
                  </span>
                  <span
                    className="min-w-0 truncate font-medium max-sm:max-w-[calc(100vw-192px)]"
                    title={row.name}
                  >
                    {row.name}
                  </span>
                </div>
              );
            },
          },
          {
            id: "owner",
            title: "Owner",
            value: (row) => row.owners.join(", "),
            size: 150,
            className: "px-3 py-1.5 text-right",
            render: (row) => (
              <div className="flex h-6 items-center justify-end -space-x-1.5">
                {row.owners.length ? (
                  row.owners.map((owner) => (
                    <span
                      key={owner}
                      className="inline-flex size-6 shrink-0 rounded-full border-2 border-background [&>span]:size-5"
                    >
                      <TinyAvatar name={owner} />
                    </span>
                  ))
                ) : (
                  <span
                    aria-label="Unassigned owner"
                    className="flex size-5 items-center justify-center rounded-full border bg-muted text-xs text-muted-foreground"
                  >
                    --
                  </span>
                )}
              </div>
            ),
          },
          {
            id: "category",
            title: "Category",
            value: (row) => row.category,
            size: 120,
            className: "px-3 py-1.5 text-center",
            render: (row) => (
              <Badge variant="outline" className="h-5 gap-1 rounded-sm px-1.5 text-xs font-normal">
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    ["Mobile", "Knowledge", "AI Quality"].includes(row.category)
                      ? "bg-violet-500"
                      : row.category === "Access"
                        ? "bg-rose-500"
                        : row.category === "Revenue" || row.category === "Reliability"
                          ? "bg-emerald-500"
                          : row.category === "Messaging"
                            ? "bg-amber-500"
                            : "bg-foreground",
                  )}
                />
                {row.category}
              </Badge>
            ),
          },
          {
            id: "due",
            title: "Due date",
            value: (row) => row.due,
            size: 115,
            className: "px-3 py-1.5 text-center",
            render: (row) => (
              <Badge variant="outline" className="h-5 gap-1 rounded-sm px-1.5 text-xs font-normal">
                <CalendarDays className="size-3 text-muted-foreground" />
                {dateFormat.format(new Date(`${row.due}T00:00:00Z`))}
              </Badge>
            ),
          },
          {
            id: "progress",
            title: "Progress",
            value: (row) => row.progress ?? -1,
            size: 105,
            className: "px-3 py-1.5 text-center",
            render: (row) =>
              row.progress === null ? (
                <span className="text-muted-foreground">-</span>
              ) : (
                <Ring value={row.progress} />
              ),
          },
          {
            id: "signal",
            title: "Signal",
            value: (row) => row.signal,
            size: 100,
            className: "px-3 py-1.5 text-center",
            render: (row) => <SignalBadge value={row.signal} />,
          },
          {
            id: "actions",
            title: "",
            value: (row) => row.id,
            size: 75,
            className: "px-3 py-1.5 text-right",
            render: (row) => (
              <RowMenu
                name={row.name}
                onDelete={() => {
                  setRows((current) => current.filter((task) => task.id !== row.id));
                  setSelected((current) => current.filter((id) => id !== String(row.id)));
                }}
              />
            ),
          },
        ]}
      />
      <div
        className="flex flex-wrap items-center justify-between gap-3 border-t py-3 text-xs"
        aria-label="Stage mix"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">Stage Mix</span>
          {stages.map((stage) => (
            <Badge
              key={stage}
              variant="outline"
              className="h-5 rounded-sm px-1.5 text-xs font-normal text-muted-foreground"
            >
              {stage}: {filtered.filter((row) => row.stage === stage).length}
            </Badge>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span>{filtered.length} visible</span>
          <span className="text-muted-foreground">of {rows.length} tasks</span>
          <Badge variant="secondary" className="h-5 rounded-sm px-1.5 text-xs font-normal">
            {signalFilter.length ? "Filtered tasks" : "All tasks"}
          </Badge>
        </div>
      </div>
    </GridFrame>
  );
}
