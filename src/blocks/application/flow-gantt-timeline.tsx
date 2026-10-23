import GanttDetails, { hydrateGanttDetailFixtures } from "./flow-gantt-details";
import { IconPlaceholder } from "@/components/reui/icon-placeholder";
import {
  Gantt,
  useGanttNavigation,
  useGanttSelection,
  type GanttColumn,
} from "@/components/reui/gantt/gantt";
import { GanttView } from "@/components/reui/gantt/gantt-view";
import {
  GanttNav,
  GanttNavToday,
  GanttNavPrev,
  GanttNavNext,
  GanttScaleSwitcher,
  GanttTitle,
} from "@/components/reui/gantt/gantt-nav";
import type {
  GanttResource,
  GanttEvent,
  GanttProposedUpdate,
} from "@/components/reui/gantt/gantt-types";
import { ContextMenuItem, ContextMenuSeparator } from "@/components/ui/context-menu";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { MiniAvatar } from "./flow-gantt-avatars";
import { FGSelect } from "./flow-gantt-select";
import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  Funnel,
  ListChecks,
  LockKeyhole,
  MoreHorizontal,
  Bot,
  TriangleAlert,
  Check,
  Wrench,
  ShieldCheck,
  Plus,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type { BlockProps } from "@/data/types";
import { colors, ganttSeed } from "./flow-gantt-timeline-data";
import type { Bar, Resource } from "./flow-gantt-timeline-data";
import "./flow-gantt-refined.css";
const fmtTime = (minutes: number, short = false) => {
  const h = Math.floor(minutes / 60),
    m = minutes % 60;
  return short
    ? `${h % 12 || 12}${m ? ":" + String(m).padStart(2, "0") : ""}${h >= 12 ? "pm" : "am"}`
    : `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};
const bookingPeople: Record<string, string[]> = {
  "Checkout Audit": ["Sana Qureshi", "Nora Vale"],
  "Design System": ["Nora Vale"],
  "Onboarding Flow": ["Mira Stone", "Theo Park"],
  "Billing Rewrite": ["Leo Grant", "Alex Johnson"],
  "Launch Review": ["Mira Stone"],
  "Search Rollout": ["Alex Johnson", "Priya Patel", "Theo Park"],
  "Event Pipeline": ["Priya Patel"],
  "Ledger Sync": ["Leo Grant"],
  "Cache Tuning": [],
  "Pricing Study": ["DO", "Mira Stone"],
  "Churn Model": ["Sana Qureshi"],
};
const predecessors = (bar: Bar) => bar.dependencies ?? (bar.dependency ? [bar.dependency] : []);
const statusColor = (s?: string) =>
  s === "Failed"
    ? "#f43f5e"
    : s === "Succeeded" || s === "Done"
      ? "#00b887"
      : s === "Running"
        ? "#0ea5e9"
        : s === "Waiting" || s === "In Review"
          ? "#f59e0b"
          : s === "In Progress"
            ? "#3b82f6"
            : "#bbb";
const dateLabel = (base: number, offset: number, long = false) =>
  new Date(base + offset * 86400000).toLocaleDateString("en-US", {
    month: long ? "long" : "short",
    day: "numeric",
    ...(long ? { weekday: "long", year: "numeric" } : {}),
  });
function Status({ value, project = false }: { value?: string; project?: boolean }) {
  if (!value) return null;
  return (
    <span
      className={`fg-task-status ${project ? "fg-project-status" : ""}`}
      style={
        project
          ? {
              color:
                value === "Done"
                  ? "#006d54"
                  : value === "In Progress"
                    ? "#6423d7"
                    : value === "In Review"
                      ? "#a85200"
                      : undefined,
              background:
                value === "Done"
                  ? "#e6faf3"
                  : value === "In Progress"
                    ? "#f3eaff"
                    : value === "In Review"
                      ? "#fff5df"
                      : "var(--background)",
              borderColor:
                value === "Done"
                  ? "#bbf0dd"
                  : value === "In Progress"
                    ? "#dfccff"
                    : value === "In Review"
                      ? "#ffe7aa"
                      : "var(--border)",
            }
          : undefined
      }
    >
      {!project && <i style={{ background: statusColor(value) }} />}
      {value}
    </span>
  );
}
function SharedTaskFocus({ event }: { event?: GanttEvent<Bar> }) {
  const { goTo } = useGanttNavigation(),
    { selectEvent } = useGanttSelection();
  const applied = useRef<string | null>(null);
  useEffect(() => {
    if (!event || applied.current === event.id) return;
    applied.current = event.id;
    goTo(new Date((event.start.getTime() + event.end.getTime()) / 2));
    selectEvent(`${event.id}::${event.start.toISOString()}`);
  }, [event, goTo, selectEvent]);
  return null;
}
function GanttEditorShell({
  variant,
  open,
  onClose,
  children,
}: {
  variant: number;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const close = (value: boolean) => {
    if (!value) onClose();
  };
  if (variant === 0)
    return (
      <Dialog open={open} onOpenChange={close}>
        <DialogContent className="fg-portal fg-gantt-modal fg-task-modal">{children}</DialogContent>
      </Dialog>
    );
  return (
    <Sheet open={open} onOpenChange={close}>
      <SheetContent
        className={`fg-portal fg-gantt-modal fg-gantt-sheet ${variant === 3 ? "fg-booking-editor" : ""}`}
      >
        {children}
      </SheetContent>
    </Sheet>
  );
}
export default function GanttTimeline({ block }: BlockProps) {
  const v = block.index;
  const [data, setData] = useState(() => hydrateGanttDetailFixtures(v, ganttSeed(v)));
  const [draft, setDraft] = useState<Bar | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [stageDefinitions, setStageDefinitions] = useState<Record<string, Bar>>(() =>
    Object.fromEntries([...data.bars].reverse().map((bar) => [bar.row, bar])),
  );
  const detailBar =
    data.bars.find((bar) => bar.id === detailId) ??
    Object.values(stageDefinitions).find((bar) => bar.id === detailId);
  const sharedTaskId = new URLSearchParams(location.search).get("ganttTask");
  const [anchor, setAnchor] = useState(() =>
    v === 1 ? (ganttSeed(v).bars.find((b) => b.id === sharedTaskId)?.day ?? 0) : 0,
  );
  const [navigationCenter, setNavigationCenter] = useState<Date | null>(null);
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [dependencyQuery, setDependencyQuery] = useState("");
  const [inline, setInline] = useState<string | null>(null);
  const [pane, setPane] = useState([520, 640, 480, 488][v]);
  const [newItem, setNewItem] = useState(false);
  const [draftGroup, setDraftGroup] = useState("");
  const [draftAssignees, setDraftAssignees] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterSquad, setFilterSquad] = useState("All");
  const [filterStage, setFilterStage] = useState("All");
  const [assigneeFilter, setAssigneeFilter] = useState<string[]>([]);
  const [availableJobTypes, setAvailableJobTypes] = useState([
    "Install",
    "Repair",
    "Inspection",
    "Emergency",
  ]);
  const [jobTypeColors, setJobTypeColors] = useState<Record<string, string>>({
    Install: colors[0],
    Repair: colors[4],
    Inspection: colors[2],
    Emergency: colors[6],
  });
  const [typeDialog, setTypeDialog] = useState(false),
    [typeName, setTypeName] = useState(""),
    [typeColor, setTypeColor] = useState(colors[0]);
  const [jobTypes, setJobTypes] = useState(["Repair", "Inspection", "Install", "Emergency"]);
  const [enforce, setEnforce] = useState(true);
  const [critical, setCritical] = useState(true);
  const [showRetries, setShowRetries] = useState(true);
  const [filterStages, setFilterStages] = useState<string[]>([]),
    [filterSquads, setFilterSquads] = useState<string[]>([]);
  const [settingsTab, setSettingsTab] = useState("View"),
    [separators, setSeparators] = useState(true),
    [rollups, setRollups] = useState(true),
    [hints, setHints] = useState(true);
  const base = Date.UTC(2026, v === 3 ? 7 : 6, 1);
  const dayMode = v === 1 || v === 2;
  const step = v === 1 ? 30 : v === 2 ? 5 : 1;
  const max = dayMode ? 1440 : 62;
  const groups = data.rows.filter((r) => r.group && !r.parent);
  const matching = (r: Resource) => {
    if (v === 3 && filterSquads.length && !filterSquads.includes(r.group ? r.id : (r.parent ?? "")))
      return false;
    if (filterSquad !== "All" && r.id !== filterSquad && r.parent !== filterSquad) return false;
    if (
      v === 0 &&
      assigneeFilter.length &&
      !(r.assignees ?? []).some((a) => assigneeFilter.includes(a)) &&
      !r.group
    )
      return false;
    return true;
  };
  const rowBars = (id: string, bars = data.bars) =>
    bars.filter(
      (b) =>
        b.row === id &&
        (v !== 1 || jobTypes.includes(b.jobType ?? "Repair")) &&
        (v !== 3 ||
          ((filterStage === "All" || b.stage === filterStage) &&
            (!filterStages.length || filterStages.includes(b.stage ?? "")))) &&
        (v !== 1 || (b.day ?? 0) === anchor),
    );
  const descendant = (r: Resource, parent: string): boolean =>
    r.parent === parent ||
    (!!r.parent &&
      descendant(
        data.rows.find((p) => p.id === r.parent)!,
        parent,
      ));
  function validate(next: Bar, bars: Bar[]) {
    if (!next.title.trim()) return "Enter a title.";
    if (next.end <= next.start) return "End must be after start.";
    if (next.start < 0 || next.end > max)
      return "This change is outside the visible scheduling range.";
    if (next.locked) {
      const old = bars.find((b) => b.id === next.id);
      if (old && (next.start !== old.start || next.end !== old.end || next.row !== old.row))
        return "This item is fixed and cannot be moved.";
    }
    if (v === 1 && (next.start < 480 || next.end > 1080))
      return "Visits must stay within depot opening hours, 8am–6pm.";
    if (v === 3) {
      const cap = data.rows.find((r) => r.id === next.row)?.capacity ?? 100;
      for (let day = next.start; day < next.end; day++) {
        const load =
          (next.load ?? 0) +
          bars
            .filter(
              (b) => b.id !== next.id && b.row === next.row && b.start < day + 1 && b.end > day,
            )
            .reduce((s, b) => s + (b.load ?? 0), 0);
        if (load > cap) return `Over capacity on Aug ${day + 1}: ${load}% of ${cap}% available.`;
      }
    }
    if (v === 0 || v === 2) {
      const reaches = (id: string, seen = new Set<string>()): boolean => {
        if (id === next.id) return true;
        if (seen.has(id)) return false;
        seen.add(id);
        const bar = bars.find((b) => b.id === id);
        return !!bar && predecessors(bar).some((p) => reaches(p, seen));
      };
      for (const id of predecessors(next)) {
        if (reaches(id)) return "This dependency would create a cycle.";
        const predecessor = bars.find((b) => b.id === id);
        if (enforce && predecessor && next.start < predecessor.end)
          return `Must start after ${predecessor.title} ends.`;
      }
    }
    return "";
  }
  function apply(next: Bar, before = data.bars, fromForm = false) {
    if (fromForm) next = { ...next, unscheduled: false };
    const message = validate(next, before);
    if (message) {
      setError(message);
      return false;
    }
    let bars = before.some((b) => b.id === next.id)
      ? before.map((b) => (b.id === next.id ? next : b))
      : [...before, next];
    if (v === 2 && enforce) {
      for (let k = 0; k < bars.length; k++)
        bars = bars.map((b) => {
          const p = bars.find((p) => p.id === b.dependency);
          if (!p || b.start >= p.end) return b;
          if (b.locked) return b;
          return { ...b, start: p.end, end: p.end + (b.end - b.start) };
        });
      if (
        bars.some((b) => b.end > 1440) ||
        bars.some((b) => {
          const p = bars.find((p) => p.id === b.dependency);
          return b.locked && p && b.start < p.end;
        })
      ) {
        setError("A fixed downstream stage or playbook cutoff prevents this move.");
        return false;
      }
    }
    let rows = data.rows;
    if (v === 0) {
      if (fromForm && newItem && !before.some((b) => b.id === next.id)) {
        const row: Resource = {
          id: next.row,
          name: next.title,
          parent: draftGroup || "bugs",
          status: next.status,
          due: dateLabel(base, next.end - 1),
          assignees: draftAssignees,
        };
        const last = rows.reduce(
          (n, r, i) => (r.id === row.parent || descendant(r, row.parent!) ? i : n),
          0,
        );
        rows = [...rows.slice(0, last + 1), row, ...rows.slice(last + 1)];
      } else
        rows = rows.map((r) =>
          r.id === next.row
            ? {
                ...r,
                name: next.title,
                status: next.status,
                due: dateLabel(base, next.end - 1),
                assignees: fromForm ? draftAssignees : r.assignees,
              }
            : r,
        );
    }
    if (v === 2 && fromForm)
      setStageDefinitions((current) => ({ ...current, [next.row]: { ...next } }));
    setData({ rows, bars });
    setError("");
    return true;
  }
  function clearStage(rowId: string) {
    const definition = rowBars(rowId)[0];
    if (definition) setStageDefinitions((current) => ({ ...current, [rowId]: { ...definition } }));
    setData((current) => ({ ...current, bars: current.bars.filter((bar) => bar.row !== rowId) }));
  }
  function showDetails(bar: Bar) {
    setDetailId(bar.id);
  }
  function duplicateBooking(bar: Bar) {
    const copy = {
      ...bar,
      id: `copy_${Date.now()}`,
      title: `${bar.title} Copy`,
      start: bar.end,
      end: bar.end + (bar.end - bar.start),
    };
    const message = validate(copy, data.bars);
    if (message) {
      toast.error(message);
      return;
    }
    if (apply(copy)) {
      setDetailId(null);
      toast.success("Booking duplicated", {
        description: `${copy.title} starts ${dateLabel(base, copy.start)}`,
      });
    }
  }
  function edit(b: Bar) {
    setNewItem(false);
    setError("");
    setDraft({ ...b });
    const row = data.rows.find((r) => r.id === b.row);
    setDraftGroup(row?.parent ?? groups[0]?.id ?? "");
    setDraftAssignees(row?.assignees ?? []);
  }
  function add(row?: Resource) {
    setNewItem(true);
    setError("");
    const id = `new_${Date.now()}`,
      resource =
        row && !row.group
          ? row
          : v === 2
            ? data.rows.find((r) => r.id === "notify")!
            : data.rows.find((r) => !r.group)!;
    setDraftGroup(row?.group ? row.id : (row?.parent ?? groups[0]?.id ?? ""));
    setDraftAssignees([]);
    setDraft({
      id,
      row: v === 0 ? id : resource.id,
      title: v === 2 ? "Notify Customer" : "",
      start: v === 1 ? 480 : v === 2 ? 720 : v === 3 ? 7 : 18,
      end: v === 1 ? 510 : v === 2 ? 750 : v === 3 ? 10 : 21,
      progress: 0,
      status: v === 0 ? "To Do" : v === 1 ? "Scheduled" : v === 2 ? "Queued" : "Tentative",
      color: colors[0],
      load: v === 3 ? 30 : 20,
      company: "",
      stage: v === 3 ? "Design" : "Discovery",
      priority: v === 3 ? "Medium" : "Normal",
      note: "",
      jobType: "Repair",
      day: anchor,
    });
  }
  function remove(id: string) {
    setData((d) => ({
      ...d,
      bars: d.bars
        .filter((b) => b.id !== id)
        .map((b) => ({
          ...b,
          dependency: b.dependency === id ? undefined : b.dependency,
          dependencies: b.dependencies?.filter((p) => p !== id),
        })),
    }));
    setDeleteId(null);
    setDraft(null);
    toast.success(v === 3 ? "Booking cancelled" : "Item removed");
  }
  function retry(b: Bar) {
    const latest = Math.max(b.end, ...rowBars(b.row).map((v) => v.end));
    const next = {
      ...b,
      id: `retry_${b.id}_${data.bars.length}`,
      start: latest,
      end: latest + (b.end - b.start),
      status: "Queued",
      progress: 0,
      color: "#a1a1aa",
      dependency: data.bars.some((bar) => bar.id === b.id) ? b.id : b.dependency,
    };
    if (apply(next)) toast.success("Retry scheduled");
    else toast.error(error);
  }
  const progress = (r: Resource) =>
    v === 2
      ? ({ refund: 60, contract: 25, sweep: 50, evaluation: 100 }[r.id] ?? 0)
      : v === 3
        ? ({ experience: 81, platform: 77, insights: 61 }[r.id] ?? 0)
        : r.id === "bugs"
          ? 49
          : r.id === "mobile"
            ? 27
            : 21;
  const peakLoad = (r: Resource) =>
    Math.max(
      0,
      ...Array.from({ length: 31 }, (_, day) =>
        rowBars(r.id)
          .filter((b) => b.start <= day && b.end > day)
          .reduce((s, b) => s + (b.load ?? 0), 0),
      ),
    );
  const dateField = (label: string, key: "start" | "end") =>
    draft && (
      <label>
        {label}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="fg-button fg-date-input">
              <CalendarDays />
              {dateLabel(base, draft[key] - (key === "end" ? 1 : 0))}, 2026
            </Button>
          </PopoverTrigger>
          <PopoverContent className="fg-portal w-auto p-0">
            <Calendar
              mode="single"
              defaultMonth={new Date(base)}
              selected={new Date(base + (draft[key] - (key === "end" ? 1 : 0)) * 86400000)}
              onSelect={(date) => {
                if (date)
                  setDraft({
                    ...draft,
                    [key]:
                      Math.round(
                        (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - base) /
                          86400000,
                      ) + (key === "end" ? 1 : 0),
                  });
              }}
            />
          </PopoverContent>
        </Popover>
      </label>
    );
  const origin = base + (v === 1 ? 18 : v === 2 ? 21 : 0) * 86400000;
  const dateFrom = (offset: number, day = 0) =>
    new Date(origin + day * 86400000 + offset * (dayMode ? 60000 : 86400000));
  const fromProposal = (proposal: GanttProposedUpdate<Bar>): Bar => {
    const rawStart = (proposal.start.getTime() - origin) / (dayMode ? 60000 : 86400000),
      rawEnd = (proposal.end.getTime() - origin) / (dayMode ? 60000 : 86400000);
    const day = v === 1 ? Math.floor(rawStart / 1440) : 0;
    return {
      ...proposal.event.data!,
      row: proposal.resourceId ?? proposal.event.data!.row,
      start: rawStart - day * 1440,
      end: rawEnd - day * 1440,
      day,
    };
  };
  const buildResources = (parent?: string): GanttResource[] =>
    data.rows
      .filter((r) => r.parent === parent && matching(r))
      .map((r) => ({
        id: r.id,
        title: r.name,
        children: r.group ? buildResources(r.id) : undefined,
      }));
  const resources = buildResources();
  const events: GanttEvent<Bar>[] = data.bars
    .filter(
      (b) =>
        !b.unscheduled &&
        rowBars(b.row).some((x) => x.id === b.id) &&
        (!(v === 2 && !showRetries) || b.id === rowBars(b.row).at(-1)?.id),
    )
    .map((b) => ({
      id: b.id,
      title: b.title,
      resourceId: b.row,
      start: dateFrom(b.start, b.day ?? 0),
      end: dateFrom(b.end, b.day ?? 0),
      color: b.color,
      progress: v === 3 ? undefined : b.progress,
      draggable: !b.locked,
      resizable: !b.locked,
      dependencies: predecessors(b),
      data: b,
    }));
  const sharedEvent = events.find((event) => event.id === sharedTaskId);
  function rowActions(resource: GanttResource) {
    const row = data.rows.find((item) => item.id === resource.id)!;
    const bar = rowBars(resource.id)[0] ?? (v === 2 ? stageDefinitions[resource.id] : undefined);
    if (v === 0 && !row.group)
      return (
        <>
          <DropdownMenuItem onSelect={() => bar && edit(bar)}>Edit Task</DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Assignee</DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="fg-portal">
              {[
                ["IM", "Ines Marchetti"],
                ["TL", "Tomas Lindqvist"],
                ["HB", "Hanna Berg"],
                ["DC", "DC"],
              ].map(([id, name]) => (
                <DropdownMenuCheckboxItem
                  key={id}
                  checked={row.assignees?.includes(id)}
                  onCheckedChange={(checked) =>
                    setData((current) => ({
                      ...current,
                      rows: current.rows.map((item) =>
                        item.id === row.id
                          ? {
                              ...item,
                              assignees: checked
                                ? [...(item.assignees ?? []), id]
                                : (item.assignees ?? []).filter((value) => value !== id),
                            }
                          : item,
                      ),
                    }))
                  }
                >
                  <MiniAvatar name={id} />
                  {name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Status</DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="fg-portal">
              <DropdownMenuRadioGroup
                value={row.status}
                onValueChange={(status) =>
                  setData((current) => ({
                    ...current,
                    rows: current.rows.map((item) =>
                      item.id === row.id ? { ...item, status } : item,
                    ),
                    bars: current.bars.map((item) =>
                      item.row === row.id
                        ? { ...item, status, progress: status === "Done" ? 100 : item.progress }
                        : item,
                    ),
                  }))
                }
              >
                {["To Do", "In Progress", "In Review", "Done"].map((status) => (
                  <DropdownMenuRadioItem key={status} value={status}>
                    {status}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Priority</DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="fg-portal">
              <DropdownMenuRadioGroup
                value={bar?.priority ?? "Normal"}
                onValueChange={(priority) =>
                  setData((current) => ({
                    ...current,
                    bars: current.bars.map((item) =>
                      item.row === row.id ? { ...item, priority } : item,
                    ),
                  }))
                }
              >
                {["Low", "Normal", "High", "Urgent"].map((priority) => (
                  <DropdownMenuRadioItem key={priority} value={priority}>
                    {priority}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => bar && setDeleteId(bar.id)}>
            Delete Task
          </DropdownMenuItem>
        </>
      );
    if (v === 2)
      return (
        <>
          <DropdownMenuItem onSelect={() => bar && showDetails(bar)}>Open Stage</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => bar && retry(bar)}>Re-run Stage</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => clearStage(row.id)}>Clear Stage</DropdownMenuItem>
        </>
      );
    return (
      <>
        <DropdownMenuItem onSelect={() => (bar ? edit(bar) : add(row))}>
          {row.group ? "Add Task" : v === 1 ? "Edit Job" : "Edit Booking"}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => add(row)}>
          Add {v === 1 ? "Job" : v === 3 ? "Booking" : "Task"}
        </DropdownMenuItem>
      </>
    );
  }
  const officialColumns: GanttColumn[] = (
    v === 0
      ? [
          {
            id: "status",
            title: "Status",
            width: 96,
            render: ({ resource }) => (
              <Status value={data.rows.find((r) => r.id === resource.id)?.status} project />
            ),
          },
          {
            id: "assignee",
            title: "Assignee",
            width: 72,
            render: ({ resource }) => (
              <span className="fg-row-avatars">
                {data.rows.find((r) => r.id === resource.id)?.assignees?.length ? (
                  data.rows
                    .find((r) => r.id === resource.id)
                    ?.assignees?.map((n) => <MiniAvatar key={n} name={n} />)
                ) : data.rows.find((r) => r.id === resource.id)?.group ? null : (
                  <span className="fg-empty-avatar" aria-label="Unassigned" />
                )}
              </span>
            ),
          },
          {
            id: "due",
            title: "Due date",
            width: 96,
            render: ({ resource }) => {
              const row = data.rows.find((r) => r.id === resource.id)!,
                bar = data.bars.find((b) => b.row === row.id);
              return (
                <span
                  className={bar && bar.end - 1 < 18 && row.status !== "Done" ? "fg-overdue" : ""}
                >
                  {row.due}
                </span>
              );
            },
          },
        ]
      : v === 1
        ? [
            {
              id: "shift",
              title: "Shift",
              width: 104,
              render: ({ resource, isGroup }) =>
                isGroup ? null : <small>{data.rows.find((r) => r.id === resource.id)?.meta}</small>,
            },
            {
              id: "booked",
              title: "Booked",
              width: 144,
              render: ({ resource, isGroup }) => {
                const row = data.rows.find((r) => r.id === resource.id)!;
                const bars = isGroup
                  ? data.rows.filter((r) => r.parent === row.id).flatMap((r) => rowBars(r.id))
                  : rowBars(row.id);
                const minutes = bars.reduce((sum, b) => sum + b.end - b.start, 0);
                return (
                  <span className="fg-booked-cell">
                    <i>
                      <b
                        style={{
                          width: `${Math.min(100, (minutes / (isGroup ? 1800 : 540)) * 100)}%`,
                        }}
                      />
                    </i>
                    {[
                      Math.floor(minutes / 60) ? `${Math.floor(minutes / 60)}h` : "",
                      minutes % 60 ? `${minutes % 60}m` : "",
                    ]
                      .filter(Boolean)
                      .join(" ") || "0m"}
                  </span>
                );
              },
            },
            {
              id: "free",
              title: "Next Free",
              width: 120,
              render: ({ resource, isGroup }) =>
                isGroup
                  ? `${data.rows.filter((r) => r.parent === resource.id).flatMap((r) => rowBars(r.id)).length} jobs`
                  : (() => {
                      const bars = rowBars(resource.id);
                      if (!bars.length) return "Open";
                      const shift = data.rows
                        .find((row) => row.id === resource.id)
                        ?.meta?.match(/^(\d+)(?::(\d+))?(am|pm)/);
                      let cursor = shift
                        ? ((Number(shift[1]) % 12) + (shift[3] === "pm" ? 12 : 0)) * 60 +
                          Number(shift[2] ?? 0)
                        : 480;
                      for (const bar of [...bars].sort((a, b) => a.start - b.start)) {
                        if (bar.start > cursor) break;
                        cursor = Math.max(cursor, bar.end);
                      }
                      return fmtTime(cursor, true);
                    })(),
            },
          ]
        : v === 2
          ? [
              {
                id: "status",
                title: "Status",
                width: 128,
                render: ({ resource }) => (
                  <Status value={data.rows.find((r) => r.id === resource.id)?.status} />
                ),
              },
              {
                id: "slack",
                title: "Slack",
                width: 64,
                render: ({ resource }) => (
                  <span
                    className={
                      ["0m", "Blocked"].includes(
                        data.rows.find((r) => r.id === resource.id)?.slack ?? "",
                      )
                        ? "text-red-500"
                        : ""
                    }
                  >
                    {data.rows.find((r) => r.id === resource.id)?.slack}
                  </span>
                ),
              },
            ]
          : [
              {
                id: "role",
                title: "Role",
                width: 132,
                render: ({ resource, isGroup }) => {
                  const r = data.rows.find((r) => r.id === resource.id)!;
                  return <small>{isGroup ? r.meta : r.role}</small>;
                },
              },
              {
                id: "load",
                title: "Load",
                width: 96,
                align: "end",
                render: ({ resource, isGroup }) => {
                  const r = data.rows.find((r) => r.id === resource.id)!;
                  const members = isGroup ? data.rows.filter((x) => x.parent === r.id) : [r];
                  const load = members.reduce((sum, x) => sum + peakLoad(x), 0),
                    capacity = members.reduce((sum, x) => sum + (x.capacity ?? 100), 0);
                  return (
                    <span
                      className={`fg-load-chip ${load > capacity ? "fg-overload" : load === capacity ? "fg-at-capacity" : ""}`}
                    >
                      {load}/{capacity}
                    </span>
                  );
                },
              },
            ]
  ) as GanttColumn[];
  return (
    <div className="fg-gantt reui-reference" data-gantt-variant={block.id}>
      <Gantt<Bar>
        className={`fg-gantt-card fg-official-gantt ${separators ? "" : "fg-hide-row-lines"}`}
        resources={resources}
        events={events}
        timeZone="UTC"
        i18n={{
          labels: {
            resources: v === 0 ? "Name" : v === 1 ? "Technician" : v === 2 ? "Stage" : "Resources",
          },
        }}
        defaultDate={new Date(base + (v === 1 ? 18 : v === 2 ? 21 : v === 3 ? 7 : 18) * 86400000)}
        defaultScale={dayMode ? "day" : "month"}
        onDateChange={(date) => {
          setAnchor(
            Math.floor((date.getTime() - base) / 86400000) - (v === 1 ? 18 : v === 2 ? 21 : 0),
          );
          setNavigationCenter(date);
        }}
        canReorderResource={(proposal) => proposal.resourceId !== "perf"}
        onResourceReorder={
          v === 0
            ? (proposal) => {
                const flat: Resource[] = [];
                const walk = (items: GanttResource[], parent?: string) =>
                  items.forEach((item) => {
                    const r = data.rows.find((r) => r.id === item.id)!;
                    flat.push({ ...r, parent });
                    if (item.children) walk(item.children, item.id);
                  });
                walk(proposal.resources);
                setData({ ...data, rows: flat });
              }
            : undefined
        }
        initialCenter={
          navigationCenter ??
          (sharedEvent
            ? new Date((sharedEvent.start.getTime() + sharedEvent.end.getTime()) / 2)
            : new Date(
                base +
                  (v === 1
                    ? 18.5
                    : v === 2
                      ? 21 + 11 / 24
                      : v === 3
                        ? window.innerWidth < 600
                          ? 7
                          : 7.2
                        : 18.5) *
                    86400000,
              ))
        }
        interval={v === 1 ? 30 : 60}
        snapDuration={dayMode ? step : undefined}
        treePanel={{
          width: pane,
          nameColumnWidth: [216, 272, 256, 208][v],
          minWidth: 240,
          maxWidth: 900,
        }}
        metrics={{
          laneHeight: v === 3 ? 3 : 1.25,
          laneGap: v === 3 ? 0.375 : 0,
          rowPadding: v === 3 ? 0.25 : 0.625,
          minRowHeight: v === 3 ? 3.5 : 2.5,
          unitWidths: { day: v === 1 ? 3 : 6, month: 4, week: 6, quarter: 1.5, year: 0.5 },
        }}
        columns={[
          ...officialColumns.filter((c) => !hiddenColumns.includes(c.id)),
          {
            id: "actions",
            title: "",
            width: v === 3 ? 52 : v === 2 ? 32 : 0,
            render: ({ resource }) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="fg-row-action" aria-label={`Actions for ${resource.title}`}>
                    <MoreHorizontal />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="fg-portal">
                  {rowActions(resource)}
                </DropdownMenuContent>
              </DropdownMenu>
            ),
          },
        ]}
        columnsMenu={
          v === 1 ? undefined : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="fg-column-menu" aria-label="Columns">
                  {v === 0 ? <Plus /> : <Settings2 />}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="fg-portal">
                {officialColumns.map((c) => (
                  <DropdownMenuItem
                    key={c.id}
                    onSelect={(e) => {
                      e.preventDefault();
                      setHiddenColumns((h) =>
                        h.includes(c.id) ? h.filter((x) => x !== c.id) : [...h, c.id],
                      );
                    }}
                  >
                    <Checkbox checked={!hiddenColumns.includes(c.id)} />
                    {c.title}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        }
        rowCheckboxes={v === 0 || v === 1}
        summaryBars={v !== 1 && rollups}
        dependencyLines={v === 0 || (v === 2 && critical)}
        barLabel={v === 0 ? "outside" : "inside"}
        timelineLines={{ vertical: true, horizontal: separators }}
        displayScheduleHint={hints}
        nowIndicator={false}
        offDays={true}
        displayCreateTaskHint={v === 0}
        onCreateTask={({ parentId }) => add(data.rows.find((r) => r.id === parentId))}
        onSlotClick={(slot) => {
          add(data.rows.find((r) => r.id === slot.resourceId));
          const offset = (slot.date.getTime() - origin) / (dayMode ? 60000 : 86400000);
          setDraft((d) =>
            d
              ? {
                  ...d,
                  start: dayMode ? offset % 1440 : Math.floor(offset),
                  end: dayMode ? (offset % 1440) + 30 : Math.floor(offset) + 1,
                  day: dayMode ? Math.floor(offset / 1440) : undefined,
                }
              : null,
          );
        }}
        onEventDoubleClick={(occ) => {
          if (occ.event.data) {
            if (v === 0) edit(occ.event.data);
            else showDetails(occ.event.data);
          }
        }}
        onEventClick={(occ) => {
          if (occ.event.data) {
            if (v === 0) edit(occ.event.data);
            else showDetails(occ.event.data);
          }
        }}
        canDropEvent={(proposal) => !validate(fromProposal(proposal), data.bars)}
        enforceCanDrop
        onEventUpdate={(proposal) => apply(fromProposal(proposal))}
        renderResourceLabel={({ resource, isGroup }) => {
          const row = data.rows.find((r) => r.id === resource.id)!;
          const hasClash = (id: string) =>
            rowBars(id).some((b, _, bars) =>
              bars.some((other) => other.id !== b.id && other.start < b.end && other.end > b.start),
            );
          const clash = isGroup
            ? data.rows.filter((r) => r.parent === row.id).some((r) => hasClash(r.id))
            : hasClash(row.id);
          return (
            <span
              className={`fg-official-resource ${v === 0 && !isGroup ? "fg-project-task-resource" : ""}`}
              data-resource-row={row.id}
            >
              {!isGroup &&
                (v === 2 ? (
                  row.meta === "Gate" ? (
                    <ShieldCheck className="fg-stage-icon" />
                  ) : ["intake", "parse", "notify", "enrich", "summarize"].includes(row.id) ? (
                    <Bot className="fg-stage-icon" />
                  ) : (
                    <Wrench className="fg-stage-icon" />
                  )
                ) : v === 0 ? (
                  <i
                    className={`fg-status-dot ${row.status === "To Do" ? "fg-status-todo" : ""}`}
                    style={{
                      background: row.status === "To Do" ? "transparent" : statusColor(row.status),
                    }}
                  />
                ) : (
                  <MiniAvatar name={row.name} />
                ))}
              <span>
                <span>
                  {isGroup &&
                    v === 0 &&
                    (row.parent ? (
                      <i
                        className="fg-status-dot mr-2"
                        style={{ background: statusColor(row.status) }}
                      />
                    ) : (
                      <ListChecks className="inline size-3.5 mr-2" />
                    ))}
                  {inline === row.id ? (
                    <input
                      autoFocus
                      aria-label={`Rename ${row.name}`}
                      defaultValue={row.name}
                      onBlur={(e) => {
                        const name = e.target.value.trim();
                        if (name)
                          setData((d) => ({
                            ...d,
                            rows: d.rows.map((r) => (r.id === row.id ? { ...r, name } : r)),
                            bars: d.bars.map((b) => (b.row === row.id ? { ...b, title: name } : b)),
                          }));
                        setInline(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                        if (e.key === "Escape") setInline(null);
                      }}
                    />
                  ) : (
                    <span onDoubleClick={() => v === 0 && setInline(row.id)}>{row.name}</span>
                  )}
                  {v === 3 && isGroup && (
                    <small className="fg-group-count">
                      {data.rows.filter((r) => r.parent === row.id).length}
                    </small>
                  )}
                </span>
                {v === 3 && !isGroup && <small>{row.role}</small>}
              </span>
              {row.meta && ((isGroup && v === 1) || v === 2) && (
                <small
                  className={
                    v === 2 ? "fg-official-stage-id" : v === 1 && isGroup ? "fg-tech-zone" : ""
                  }
                >
                  {row.meta}
                </small>
              )}
              {v === 1 && !isGroup && row.role && (
                <small className="fg-tech-role">· {row.role}</small>
              )}
              {v === 1 && clash && <span className="fg-clash">Clash</span>}
              {row.id === "perf" && <LockKeyhole className="size-3" />}
              {isGroup && v === 0 && (
                <span
                  className="fg-list-progress"
                  style={{ "--completion": `${progress(row)}%` } as React.CSSProperties}
                  aria-label={`${progress(row)}% complete`}
                />
              )}
            </span>
          );
        }}
        renderSummary={
          v === 3
            ? ({ progress }) => (
                <span className="fg-capacity-rollup">
                  <i style={{ width: `${progress ?? 0}%` }} />
                  <small>{progress}%</small>
                </span>
              )
            : undefined
        }
        classNames={{ event: v === 3 ? "fg-official-capacity-bar" : undefined }}
        getSummaryProgress={({ resource }) =>
          progress(data.rows.find((r) => r.id === resource.id)!)
        }
        renderEvent={
          v === 0
            ? undefined
            : ({ occurrence }) => {
                const b = occurrence.event.data!;
                return (
                  <span
                    data-gantt-bar={b.id}
                    className={v === 3 ? "fg-official-booking" : "fg-official-event"}
                  >
                    {v === 3 ? (
                      <>
                        <span className="fg-booking-title">
                          {(b.status === "At Risk" || b.title === "Billing Rewrite") && (
                            <TriangleAlert className="fg-booking-alert" />
                          )}
                          {(b.status === "Complete" || b.status === "Delivered") && (
                            <Check className="fg-booking-done" />
                          )}
                          <span className="fg-booking-name">{b.title}</span>
                          <span className="fg-booking-people">
                            {(
                              b.collaborators ??
                              bookingPeople[b.title] ?? [
                                data.rows.find((r) => r.id === b.row)?.name ?? "",
                              ]
                            ).map((name) => (
                              <MiniAvatar key={name} name={name} />
                            ))}
                          </span>
                        </span>
                        <span className="fg-booking-meta">
                          <span className="fg-booking-company">{b.company}</span>
                          <span>•</span>
                          <span>Aug {b.start + 1}</span>
                          <span className="fg-booking-tags">
                            {b.stage && <span className="fg-stage-label">{b.stage}</span>}
                            {b.priority && (
                              <span
                                className={`fg-priority fg-priority-${b.priority.toLowerCase()}`}
                              >
                                {b.priority}
                              </span>
                            )}
                          </span>
                        </span>
                      </>
                    ) : (
                      <>
                        <span>
                          {v === 2 && (
                            <IconPlaceholder
                              lucide={
                                b.status === "Succeeded"
                                  ? "CheckIcon"
                                  : b.status === "Running"
                                    ? "ActivityIcon"
                                    : b.status === "Failed"
                                      ? "CircleXIcon"
                                      : b.status === "Waiting"
                                        ? "ClockIcon"
                                        : "CircleIcon"
                              }
                              className="fg-stage-state-icon"
                            />
                          )}
                          {b.locked && <LockKeyhole className="inline size-3 mr-1" />}
                          {b.title}
                        </span>
                        {v === 1 && <small>{fmtTime(b.start, true)}</small>}
                        {v === 2 && b.title === "Parse Batch" && b.status === "Running" && (
                          <small>Shard 3 of 3</small>
                        )}
                      </>
                    )}
                  </span>
                );
              }
        }
        renderEventMenu={({ occurrence }) => {
          const bar = occurrence.event.data!;
          return (
            <>
              <ContextMenuItem
                onSelect={() => {
                  if (v < 2) edit(bar);
                  else showDetails(bar);
                }}
              >
                {["Edit Task", "Edit Job", "Open Stage", "Open Booking"][v]}
              </ContextMenuItem>
              {v === 2 && (
                <>
                  <ContextMenuItem onSelect={() => retry(bar)}>Re-run</ContextMenuItem>
                  <ContextMenuItem
                    onSelect={() => {
                      void navigator.clipboard.writeText(bar.id);
                      toast.success("Run ID copied");
                    }}
                  >
                    Copy Run ID
                  </ContextMenuItem>
                </>
              )}
              {v === 0 && (
                <ContextMenuItem
                  onSelect={() => {
                    const target = new URL(location.href);
                    target.searchParams.set("ganttTask", bar.id);
                    void navigator.clipboard.writeText(target.href);
                    toast.success("Link copied");
                  }}
                >
                  Copy Task Link
                </ContextMenuItem>
              )}
              {v === 0 && (
                <>
                  <ContextMenuSeparator />
                  <ContextMenuItem
                    onSelect={() =>
                      setData((current) => ({
                        ...current,
                        bars: current.bars.map((item) =>
                          item.id === bar.id ? { ...item, unscheduled: true } : item,
                        ),
                        rows: current.rows.map((row) =>
                          row.id === bar.row ? { ...row, due: undefined } : row,
                        ),
                      }))
                    }
                  >
                    Unschedule
                  </ContextMenuItem>
                </>
              )}
              <ContextMenuSeparator />
              <ContextMenuItem onSelect={() => setDeleteId(bar.id)}>
                {["Delete Task", "Cancel Job", "Clear Execution", "Cancel Booking"][v]}
              </ContextMenuItem>
            </>
          );
        }}
        renderResourceMenu={({ resource }) => (
          <>
            <ContextMenuItem onSelect={() => add(data.rows.find((r) => r.id === resource.id))}>
              Add {v === 1 ? "job" : v === 3 ? "booking" : "task"}
            </ContextMenuItem>
            {v === 2 && (
              <>
                <ContextMenuItem
                  onSelect={() => {
                    const b = rowBars(resource.id).at(-1);
                    if (b) retry(b);
                  }}
                >
                  Re-run stage
                </ContextMenuItem>
                <ContextMenuItem onSelect={() => clearStage(resource.id)}>
                  Clear stage
                </ContextMenuItem>
              </>
            )}
          </>
        )}
      >
        <GanttNav className="fg-gantt-header">
          <GanttNavToday className="fg-button" />
          {!dayMode && <GanttScaleSwitcher className="fg-button" />}
          <div className="fg-nav-pair">
            <GanttNavPrev className="fg-icon" />
            <GanttNavNext className="fg-icon" />
          </div>
          <GanttTitle />
          <div className="fg-actions">
            {v === 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="fg-button fg-assignee-filter"
                    aria-label="Filter by assignee"
                  >
                    {["IM", "TL", "HB", "DC"].map((n) => (
                      <MiniAvatar key={n} name={n} />
                    ))}
                    <span>+1</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="fg-portal w-56">
                  <p className="font-medium mb-3">Assignees</p>
                  {["IM", "TL", "HB", "DC"].map((a) => (
                    <label className="flex items-center gap-2 mb-2" key={a}>
                      <Checkbox
                        checked={assigneeFilter.includes(a)}
                        onCheckedChange={(checked) =>
                          setAssigneeFilter((old) =>
                            checked ? [...old, a] : old.filter((v) => v !== a),
                          )
                        }
                      />
                      {a}
                    </label>
                  ))}
                  <Button variant="ghost" onClick={() => setAssigneeFilter([])}>
                    Clear filter
                  </Button>
                </PopoverContent>
              </Popover>
            )}
            {v === 1 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="fg-button fg-job-types-button"
                    aria-label="Job Types"
                  >
                    <span className="fg-job-colors">
                      {["#3b82f6", "#f59e0b", "#06b6d4", "#f43f5e"].map((c) => (
                        <i key={c} style={{ background: c }} />
                      ))}
                    </span>
                    <span className="fg-job-types-label">Job Types</span>
                    <ChevronDown />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="fg-portal w-56">
                  <p className="mb-3 font-medium">Show job types</p>
                  {availableJobTypes.map((t) => (
                    <label className="flex items-center gap-3 mb-3" key={t}>
                      <Checkbox
                        checked={jobTypes.includes(t)}
                        onCheckedChange={(on) =>
                          setJobTypes((s) => (on ? [...s, t] : s.filter((v) => v !== t)))
                        }
                      />
                      {t}
                    </label>
                  ))}
                  <Button
                    variant="ghost"
                    className="fg-button w-full justify-start border-t rounded-none"
                    onClick={() => {
                      setTypeName("");
                      setTypeDialog(true);
                    }}
                  >
                    <Plus />
                    New job type
                  </Button>
                </PopoverContent>
              </Popover>
            )}
            {v === 2 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="fg-button fg-gantt-settings-button"
                    aria-label="Settings"
                  >
                    <Settings2 />
                    <span className="fg-gantt-settings-label">Settings</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="fg-portal w-72">
                  <div className="fg-settings-tabs">
                    {["View", "Filters", "Board"].map((t) => (
                      <button
                        key={t}
                        aria-pressed={settingsTab === t}
                        onClick={() => setSettingsTab(t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  {settingsTab === "View" ? (
                    <>
                      <div className="fg-detail-title">Board</div>
                      {[
                        ["Critical Path", critical, setCritical],
                        ["Placement Hints", hints, setHints],
                        ["Row Separators", separators, setSeparators],
                        ["Playbook Rollups", rollups, setRollups],
                      ].map(([label, on, set]) => (
                        <label className="fg-setting-line" key={label as string}>
                          {label as string}
                          <Switch
                            checked={on as boolean}
                            onCheckedChange={set as (on: boolean) => void}
                          />
                        </label>
                      ))}
                      <div className="fg-detail-title mt-5">Layout</div>
                      <label className="fg-setting-line">
                        Tree Panel
                        <FGSelect
                          value={pane > 300 ? "Full" : "Compact"}
                          onChange={(e) => setPane(e.target.value === "Full" ? 480 : 280)}
                        >
                          <option>Full</option>
                          <option>Compact</option>
                        </FGSelect>
                      </label>
                    </>
                  ) : settingsTab === "Board" ? (
                    <>
                      {[
                        ["Enforce dependencies", enforce, setEnforce],
                        ["Show retry lanes", showRetries, setShowRetries],
                      ].map(([label, on, set]) => (
                        <label className="fg-setting-line" key={label as string}>
                          {label as string}
                          <Switch
                            checked={on as boolean}
                            onCheckedChange={set as (on: boolean) => void}
                          />
                        </label>
                      ))}
                    </>
                  ) : (
                    <label className="fg-setting-line">
                      Show all stages
                      <Switch checked={showRetries} onCheckedChange={setShowRetries} />
                    </label>
                  )}
                </PopoverContent>
              </Popover>
            )}
            {v === 3 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="fg-button">
                    <Funnel />
                    Filter
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="fg-portal fg-gantt-filters w-72">
                  <div className="flex justify-between items-center">
                    <strong>Filters</strong>
                    <button
                      onClick={() => {
                        setFilterSquads([]);
                        setFilterStages([]);
                        setFilterSquad("All");
                        setFilterStage("All");
                      }}
                    >
                      Clear
                    </button>
                  </div>
                  <p className="fg-filter-title">Workstream</p>
                  {["Discovery", "Design", "Build", "Launch"].map((t) => (
                    <label className="fg-filter-checkbox" key={t}>
                      <Checkbox
                        checked={filterStages.includes(t)}
                        onCheckedChange={(on) =>
                          setFilterStages((s) => (on ? [...s, t] : s.filter((v) => v !== t)))
                        }
                      />
                      {t}
                      <span>{data.bars.filter((b) => b.stage === t).length}</span>
                    </label>
                  ))}
                  <p className="fg-filter-title">Squad</p>
                  {groups.map((g) => (
                    <label className="fg-filter-checkbox" key={g.id}>
                      <Checkbox
                        checked={filterSquads.includes(g.id)}
                        onCheckedChange={(on) =>
                          setFilterSquads((s) => (on ? [...s, g.id] : s.filter((v) => v !== g.id)))
                        }
                      />
                      {g.name}
                      <span>
                        {
                          data.bars.filter(
                            (b) => data.rows.find((r) => r.id === b.row)?.parent === g.id,
                          ).length
                        }
                      </span>
                    </label>
                  ))}
                </PopoverContent>
              </Popover>
            )}
            <Button
              className="fg-button fg-schedule-create"
              aria-label={["Add Task", "Book Job", "New Stage", "New Booking"][v]}
              onClick={() => add()}
            >
              <Plus />
              <span className="fg-schedule-create-label">
                {["Add Task", "Book Job", "New Stage", "New Booking"][v]}
              </span>
            </Button>
            {v === 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="fg-icon fg-create-more" aria-label="More create options">
                    <ChevronDown />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="fg-portal">
                  <DropdownMenuItem onSelect={() => add()}>
                    <Plus />
                    Add task
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      const id = `group_${Date.now()}`;
                      setData({
                        ...data,
                        rows: [...data.rows, { id, name: "New list", group: true }],
                      });
                    }}
                  >
                    <ListChecks />
                    Add list
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </GanttNav>
        <SharedTaskFocus event={sharedEvent} />
        <GanttView key={pane} className="fg-official-gantt-view" />
      </Gantt>
      <Sheet
        open={!!detailBar && v > 0}
        onOpenChange={(open) => {
          if (!open) setDetailId(null);
        }}
      >
        {detailBar && v > 0 && (
          <GanttDetails
            variant={v as 1 | 2 | 3}
            bar={detailBar}
            resource={data.rows.find((row) => row.id === detailBar.row)}
            resources={data.rows}
            bars={data.bars}
            onEdit={() => {
              setDetailId(null);
              edit(detailBar);
            }}
            onRerun={() => {
              retry(detailBar);
              setDetailId(null);
            }}
            onDuplicate={() => duplicateBooking(detailBar)}
            onCancelBooking={() => setDeleteId(detailBar.id)}
          />
        )}
      </Sheet>
      <GanttEditorShell variant={v} open={!!draft} onClose={() => setDraft(null)}>
        <DialogHeader>
          <DialogTitle>
            {newItem
              ? ["New Task", "New Job", "New Stage", "New Booking"][v]
              : v === 0
                ? "Edit Task"
                : v === 1
                  ? "Edit Job"
                  : draft?.title}
          </DialogTitle>
          <DialogDescription className={v === 0 ? "" : "sr-only"}>
            {
              [
                newItem
                  ? "Fill in the details for the new task."
                  : "Update the task details below.",
                "Book a visit into a technician's day.",
                "Schedule a stage into a playbook.",
                "Book work against resource capacity.",
              ][v]
            }
          </DialogDescription>
        </DialogHeader>
        {draft && (
          <form
            className="fg-gantt-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (apply(draft, data.bars, true)) {
                setDraft(null);
                toast.success("Changes saved");
              }
            }}
          >
            <div className="fg-gantt-form-body">
              <label htmlFor="fg-gantt-title">
                {v === 1 ? "Customer" : "Title"}
                <input
                  id="fg-gantt-title"
                  placeholder={
                    v === 1 ? "Harbor Dental" : v === 0 ? "Task title" : "Capture Refund"
                  }
                  required
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                />
              </label>
              {v === 0 ? (
                <>
                  {newItem && (
                    <>
                      <label>
                        List
                        <FGSelect
                          aria-label="List"
                          value={draftGroup}
                          onChange={(e) => setDraftGroup(e.target.value)}
                        >
                          {groups.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                        </FGSelect>
                      </label>
                    </>
                  )}
                  <label>
                    Status
                    <FGSelect
                      aria-label="Status"
                      value={draft.status}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          status: e.target.value,
                          progress: e.target.value === "Done" ? 100 : draft.progress,
                        })
                      }
                    >
                      {["To Do", "In Progress", "In Review", "Done"].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </FGSelect>
                  </label>
                  <label>
                    Priority
                    <FGSelect
                      aria-label="Priority"
                      value={draft.priority ?? "Normal"}
                      onChange={(e) => setDraft({ ...draft, priority: e.target.value })}
                    >
                      {["Low", "Normal", "High", "Urgent"].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </FGSelect>
                  </label>
                  <label>
                    Assignee
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="fg-button fg-date-input">
                          {draftAssignees.length ? (
                            draftAssignees.join(", ")
                          ) : (
                            <span className="fg-muted">Add assignees...</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="fg-portal w-60">
                        {["IM", "TL", "HB", "DC"].map((a) => (
                          <label className="flex items-center gap-3 mb-2" key={a}>
                            <Checkbox
                              checked={draftAssignees.includes(a)}
                              onCheckedChange={(on) =>
                                setDraftAssignees((s) =>
                                  on ? [...s, a] : s.filter((v) => v !== a),
                                )
                              }
                            />
                            {a}
                          </label>
                        ))}
                      </PopoverContent>
                    </Popover>
                  </label>
                  <label>
                    Depends on
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="fg-button fg-date-input"
                          aria-label="Depends on"
                        >
                          {predecessors(draft).length ? (
                            predecessors(draft)
                              .map((id) => data.bars.find((b) => b.id === id)?.title)
                              .join(", ")
                          ) : (
                            <span className="fg-muted">Add predecessors...</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="fg-portal w-80 p-0" align="start">
                        <Input
                          className="border-0 rounded-none shadow-none"
                          aria-label="Search predecessors"
                          placeholder="Search tasks..."
                          value={dependencyQuery}
                          onChange={(e) => setDependencyQuery(e.target.value)}
                        />
                        <div className="max-h-64 overflow-y-auto p-2">
                          {data.bars
                            .filter(
                              (b) =>
                                b.id !== draft.id &&
                                b.title.toLowerCase().includes(dependencyQuery.toLowerCase()),
                            )
                            .map((b) => (
                              <label
                                key={b.id}
                                className="flex items-center gap-2 rounded px-2 py-2 hover:bg-muted"
                              >
                                <Checkbox
                                  checked={predecessors(draft).includes(b.id)}
                                  onCheckedChange={(checked) =>
                                    setDraft({
                                      ...draft,
                                      dependency: undefined,
                                      dependencies: checked
                                        ? [...predecessors(draft), b.id]
                                        : predecessors(draft).filter((id) => id !== b.id),
                                    })
                                  }
                                />
                                {b.title}
                              </label>
                            ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </label>
                  <div className="fg-form-two">
                    {dateField("Start", "start")}
                    {dateField("Due", "end")}
                  </div>
                  <div className="fg-color-pick">
                    <span>Color</span>
                    {colors.map((c) => (
                      <button
                        key={c}
                        type="button"
                        aria-label={`Color ${c}`}
                        aria-pressed={draft.color === c}
                        style={{ background: c }}
                        onClick={() => setDraft({ ...draft, color: c })}
                      />
                    ))}
                  </div>
                </>
              ) : v === 3 ? (
                <>
                  <label>
                    Client
                    <input
                      placeholder="Northwind Retail"
                      value={draft.company ?? ""}
                      onChange={(e) => setDraft({ ...draft, company: e.target.value })}
                    />
                  </label>
                  <label>
                    Assignee
                    <FGSelect
                      aria-label="Assignee"
                      value={draft.row}
                      onChange={(e) => setDraft({ ...draft, row: e.target.value })}
                    >
                      {data.rows
                        .filter((r) => !r.group)
                        .map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                    </FGSelect>
                  </label>
                  <div className="fg-form-two">
                    {(["start", "end"] as const).map((key) => (
                      <label key={key}>
                        {key === "start" ? "Start" : "Last Day"}
                        <input
                          type="date"
                          value={new Date(base + (draft[key] - (key === "end" ? 1 : 0)) * 86400000)
                            .toISOString()
                            .slice(0, 10)}
                          onChange={(e) => {
                            if (e.target.value)
                              setDraft({
                                ...draft,
                                [key]:
                                  Math.round(
                                    (Date.parse(e.target.value + "T00:00:00Z") - base) / 86400000,
                                  ) + (key === "end" ? 1 : 0),
                              });
                          }}
                        />
                      </label>
                    ))}
                  </div>
                  <label>
                    Workstream
                    <FGSelect
                      aria-label="Workstream"
                      value={draft.stage ?? "Design"}
                      onChange={(e) => setDraft({ ...draft, stage: e.target.value })}
                    >
                      {["Discovery", "Design", "Build", "Launch"].map((stage) => (
                        <option key={stage}>{stage}</option>
                      ))}
                    </FGSelect>
                  </label>
                  <label>
                    Load
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={draft.load ?? 30}
                      onChange={(e) => setDraft({ ...draft, load: Number(e.target.value) })}
                    />
                  </label>
                  <label>
                    Priority
                    <FGSelect
                      aria-label="Priority"
                      value={draft.priority ?? "Medium"}
                      onChange={(e) => setDraft({ ...draft, priority: e.target.value })}
                    >
                      {["Low", "Medium", "High"].map((priority) => (
                        <option key={priority}>{priority}</option>
                      ))}
                    </FGSelect>
                  </label>
                  <label>
                    Stage
                    <FGSelect
                      aria-label="Stage"
                      value={draft.status === "To Do" ? "Tentative" : draft.status}
                      onChange={(e) => setDraft({ ...draft, status: e.target.value })}
                    >
                      {["Tentative", "Confirmed", "At Risk", "Delivered", "Cancelled"].map(
                        (status) => (
                          <option key={status}>{status}</option>
                        ),
                      )}
                    </FGSelect>
                  </label>
                  <label>
                    Note
                    <textarea
                      placeholder="What this booking covers."
                      value={draft.note ?? ""}
                      onChange={(e) => setDraft({ ...draft, note: e.target.value })}
                    />
                  </label>
                </>
              ) : (
                <>
                  <label>
                    {v === 1 ? "Technician" : "Stage"}
                    <FGSelect
                      aria-label={v === 1 ? "Technician" : "Stage"}
                      value={draft.row}
                      onChange={(e) => setDraft({ ...draft, row: e.target.value })}
                    >
                      {data.rows
                        .filter((r) => !r.group)
                        .map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                    </FGSelect>
                  </label>
                  {v === 1 && (
                    <label>
                      Job Type
                      <FGSelect
                        aria-label="Job Type"
                        value={draft.jobType ?? "Repair"}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            jobType: e.target.value,
                            color: jobTypeColors[e.target.value] ?? colors[0],
                          })
                        }
                      >
                        {availableJobTypes.map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </FGSelect>
                    </label>
                  )}
                  {dayMode ? (
                    <div className="fg-form-two">
                      {(["start", "end"] as const).map((key) => (
                        <label key={key}>
                          {key === "start" ? "Start" : "End"}
                          <FGSelect
                            aria-label={key === "start" ? "Start" : "End"}
                            value={draft[key]}
                            onChange={(e) =>
                              setDraft({
                                ...draft,
                                [key]: Number(e.target.value),
                              })
                            }
                          >
                            {Array.from(
                              { length: v === 1 ? 21 : 289 },
                              (_, i) => (v === 1 ? 480 : 0) + i * (v === 1 ? 30 : 5),
                            )
                              .filter((t) => t <= 1440)
                              .map((t) => (
                                <option value={t} key={t}>
                                  {v === 1
                                    ? `${Math.floor(t / 60) % 12 || 12}:${String(t % 60).padStart(2, "0")} ${t >= 720 ? "pm" : "am"}`
                                    : fmtTime(t)}
                                </option>
                              ))}
                          </FGSelect>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="fg-form-two">
                      {dateField("Start", "start")}
                      {dateField("End", "end")}
                    </div>
                  )}
                  {v === 1 && (
                    <label>
                      Address
                      <input
                        placeholder="418 Wells St"
                        value={draft.address ?? ""}
                        onChange={(e) => setDraft({ ...draft, address: e.target.value })}
                      />
                    </label>
                  )}
                  <label>
                    Note
                    {v === 1 ? (
                      <input
                        placeholder="Optional"
                        value={draft.note ?? ""}
                        onChange={(e) => setDraft({ ...draft, note: e.target.value })}
                      />
                    ) : (
                      <textarea
                        placeholder="Why this window, or what to watch for"
                        value={draft.note ?? ""}
                        onChange={(e) => setDraft({ ...draft, note: e.target.value })}
                      />
                    )}
                  </label>
                </>
              )}
              {error && (
                <p role="alert" className="fg-form-error">
                  {error}
                </p>
              )}
            </div>
            <footer className="fg-gantt-modal-footer">
              {v === 3 && !newItem && (
                <Button
                  type="button"
                  variant="outline"
                  className="fg-button mr-auto"
                  onClick={() => setDeleteId(draft.id)}
                >
                  Cancel Booking
                </Button>
              )}
              {v === 2 && !newItem && (
                <Button
                  type="button"
                  variant="outline"
                  className="fg-button mr-auto"
                  onClick={() => setDeleteId(draft.id)}
                >
                  Clear
                </Button>
              )}
              {v === 1 && !newItem && (
                <Button
                  type="button"
                  variant="outline"
                  className="fg-button mr-auto"
                  onClick={() => setDeleteId(draft.id)}
                >
                  Cancel Job
                </Button>
              )}
              {v === 0 && !newItem && (
                <Button
                  type="button"
                  variant="ghost"
                  className="fg-button text-red-600 mr-auto"
                  onClick={() => {
                    setDeleteId(draft.id);
                  }}
                >
                  Delete Task
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                className="fg-button"
                onClick={() => setDraft(null)}
              >
                {v === 0 ? "Cancel" : v === 3 ? "Discard" : "Close"}
              </Button>
              <Button type="submit" className="fg-button" disabled={!draft.title.trim()}>
                {!newItem ? "Save" : ["Save", "Book Job", "Schedule", "Book"][v]}
              </Button>
            </footer>
          </form>
        )}
      </GanttEditorShell>
      <Dialog open={typeDialog} onOpenChange={setTypeDialog}>
        <DialogContent className="fg-portal sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New job type</DialogTitle>
            <DialogDescription>Name your job type and choose a color.</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const name = typeName.trim();
              if (name && !availableJobTypes.includes(name)) {
                setAvailableJobTypes((t) => [...t, name]);
                setJobTypeColors((t) => ({ ...t, [name]: typeColor }));
                setJobTypes((t) => [...t, name]);
                setTypeDialog(false);
              }
            }}
          >
            <label className="block">
              Name
              <Input
                className="mt-2"
                placeholder="e.g. Maintenance"
                value={typeName}
                onChange={(e) => setTypeName(e.target.value)}
              />
            </label>
            <div className="fg-color-pick">
              <span>Color</span>
              {colors.map((color) => (
                <button
                  type="button"
                  key={color}
                  aria-label={`Type color ${color}`}
                  aria-pressed={typeColor === color}
                  style={{ background: color }}
                  onClick={() => setTypeColor(color)}
                />
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setTypeDialog(false)}>
                Cancel
              </Button>
              <Button disabled={!typeName.trim() || availableJobTypes.includes(typeName.trim())}>
                Create
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!deleteId}
        onOpenChange={(o) => {
          if (!o) setDeleteId(null);
        }}
      >
        <DialogContent className="fg-portal sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{v === 3 ? "Cancel booking?" : "Delete item?"}</DialogTitle>
            <DialogDescription>This removes the item from this local schedule.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Keep item
            </Button>
            <Button variant="destructive" onClick={() => deleteId && remove(deleteId)}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
