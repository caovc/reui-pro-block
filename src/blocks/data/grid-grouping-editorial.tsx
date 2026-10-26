import { Badge } from "@/components/reui/badge";
import { DataGrid, DataGridContainer } from "@/components/reui/data-grid/data-grid";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useIsMobile } from "@/hooks/use-mobile";
import { demoAvatar } from "@/lib/demo-artwork";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Check,
  Ellipsis,
  Filter,
  MessageSquare,
  Paperclip,
  Pencil,
  Plus,
  Search,
  Settings2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { domainTextMatches, useDomainGrid, type DomainColumn } from "./grid-advanced-model-grid";
import { Choice } from "./grid-advanced-shared";

type Stage = "Drafting" | "In Edit" | "Fact Check" | "Ready";
type Desk = "Features" | "Business" | "Culture" | "Science";
type Placement = "Lead" | "Feature" | "Brief";
type GroupBy = "Stage" | "Desk" | "Issue";
type Story = {
  id: string;
  name: string;
  angle: string;
  byline: string[];
  filed: string;
  publish: string;
  stage: Stage;
  desk: Desk;
  issue: "Issue 42" | "Issue 43";
  placement: Placement;
  assets: number;
  notes: number;
};

// Visible public demo records, stored once by identity. Neither grouping nor
// sorting derives field values from a section-local row index.
const stories: Story[] = [
  {
    id: "NR-1201",
    name: "The Last Dry Winter",
    angle: "Reservoir towns rewrite what a drought season means",
    byline: ["Nora Vale", "Leo Grant"],
    filed: "2026-07-06",
    publish: "2026-08-14",
    stage: "Drafting",
    desk: "Features",
    issue: "Issue 42",
    placement: "Lead",
    assets: 7,
    notes: 12,
  },
  {
    id: "NR-1202",
    name: "Cheap Money Ends",
    angle: "Why regional lenders stopped underwriting the middle",
    byline: ["Alex Johnson"],
    filed: "2026-07-09",
    publish: "2026-08-07",
    stage: "Drafting",
    desk: "Business",
    issue: "Issue 42",
    placement: "Feature",
    assets: 3,
    notes: 5,
  },
  {
    id: "NR-1203",
    name: "Night Shift Choirs",
    angle: "Hospital cleaners built a choir that outlasted the ward",
    byline: ["Emma Wilson", "Sarah Chen"],
    filed: "2026-07-11",
    publish: "2026-09-11",
    stage: "Drafting",
    desk: "Culture",
    issue: "Issue 43",
    placement: "Brief",
    assets: 2,
    notes: 3,
  },
  {
    id: "NR-1204",
    name: "The Grid Goes Quiet",
    angle: "A utility learns to sell less power and stay solvent",
    byline: ["Theo Park", "Leo Grant"],
    filed: "2026-06-24",
    publish: "2026-08-14",
    stage: "In Edit",
    desk: "Business",
    issue: "Issue 42",
    placement: "Feature",
    assets: 11,
    notes: 18,
  },
  {
    id: "NR-1205",
    name: "The Repair Clause",
    angle: "A right-to-repair bill nobody lobbied against, and why",
    byline: ["Alex Johnson", "Nora Vale", "Leo Grant"],
    filed: "2026-06-19",
    publish: "2026-08-21",
    stage: "In Edit",
    desk: "Business",
    issue: "Issue 42",
    placement: "Lead",
    assets: 6,
    notes: 21,
  },
  {
    id: "NR-1206",
    name: "Museum of Ordinary Things",
    angle: "A curator collects receipts, tickets, and other proof of living",
    byline: ["Sarah Chen"],
    filed: "2026-07-02",
    publish: "2026-08-07",
    stage: "In Edit",
    desk: "Culture",
    issue: "Issue 42",
    placement: "Brief",
    assets: 4,
    notes: 7,
  },
  {
    id: "NR-1207",
    name: "Counting the Kelp",
    angle: "Divers and satellites disagree about the forest offshore",
    byline: ["Theo Park", "Michael Rodriguez"],
    filed: "2026-06-12",
    publish: "2026-08-28",
    stage: "Fact Check",
    desk: "Science",
    issue: "Issue 42",
    placement: "Feature",
    assets: 9,
    notes: 26,
  },
  {
    id: "NR-1208",
    name: "Who Owns the Aquifer?",
    angle: "Three counties, one permit, forty years of paperwork",
    byline: ["Nora Vale", "Michael Rodriguez", "Leo Grant"],
    filed: "2026-06-05",
    publish: "2026-08-14",
    stage: "Fact Check",
    desk: "Features",
    issue: "Issue 42",
    placement: "Lead",
    assets: 14,
    notes: 33,
  },
  {
    id: "NR-1209",
    name: "The Understudy Economy",
    angle: "Touring shows now run on performers who never go on",
    byline: ["Emma Wilson", "Michael Rodriguez"],
    filed: "2026-07-01",
    publish: "2026-09-11",
    stage: "Fact Check",
    desk: "Culture",
    issue: "Issue 43",
    placement: "Brief",
    assets: 3,
    notes: 9,
  },
  {
    id: "NR-1210",
    name: "Freight on the Old Line",
    angle: "A closed rail spur reopens, and the town argues about noise",
    byline: ["Alex Johnson", "Sana Qureshi"],
    filed: "2026-05-28",
    publish: "2026-08-21",
    stage: "Ready",
    desk: "Business",
    issue: "Issue 42",
    placement: "Feature",
    assets: 8,
    notes: 15,
  },
  {
    id: "NR-1211",
    name: "Field Notes: Ash",
    angle: "What a burn scar looks like eighteen months later",
    byline: ["Theo Park", "Sana Qureshi"],
    filed: "2026-06-02",
    publish: "2026-08-28",
    stage: "Ready",
    desk: "Science",
    issue: "Issue 42",
    placement: "Brief",
    assets: 12,
    notes: 6,
  },
  {
    id: "NR-1212",
    name: "The Quiet Ward",
    angle: "A hospice unit that stopped measuring outcomes in days",
    byline: ["Emma Wilson", "Leo Grant", "Sana Qureshi"],
    filed: "2026-05-21",
    publish: "2026-08-14",
    stage: "Ready",
    desk: "Features",
    issue: "Issue 42",
    placement: "Feature",
    assets: 5,
    notes: 11,
  },
  {
    id: "NR-1213",
    name: "Second Press",
    angle: "A closed print shop reopens as a co-op, badly at first",
    byline: ["Sarah Chen", "Sana Qureshi"],
    filed: "2026-06-18",
    publish: "2026-09-11",
    stage: "Ready",
    desk: "Culture",
    issue: "Issue 43",
    placement: "Brief",
    assets: 4,
    notes: 8,
  },
];
const stages: Stage[] = ["Drafting", "In Edit", "Fact Check", "Ready"];
const desks: Desk[] = ["Features", "Business", "Culture", "Science"];
const placements: Placement[] = ["Lead", "Feature", "Brief"];
const properties = ["Angle", "Byline", "Filed", "Publish", "Placement", "Assets", "Notes"];
const bandStyles = [
  { background: "bg-sky-50 dark:bg-sky-950/35", dot: "bg-sky-500" },
  { background: "bg-amber-50 dark:bg-amber-950/35", dot: "bg-amber-500" },
  { background: "bg-rose-50 dark:bg-rose-950/35", dot: "bg-rose-500" },
  { background: "bg-emerald-50 dark:bg-emerald-950/35", dot: "bg-emerald-500" },
];
const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
});
function dateLabel(value: string) {
  return dateFormatter.format(new Date(`${value}T00:00:00Z`)).replace(/\bSept\b/g, "Sep");
}
function toggleValue<T extends string>(values: T[], value: T, checked: boolean): T[] {
  return checked ? [...values, value] : values.filter((item) => item !== value);
}
function matchesStory(
  story: Story,
  query: string,
  deskFilter: Desk[],
  placementFilter: Placement[],
) {
  return (
    domainTextMatches(story, query) &&
    (!deskFilter.length || deskFilter.includes(story.desk)) &&
    (!placementFilter.length || placementFilter.includes(story.placement))
  );
}
function Byline({ names }: { names: string[] }) {
  return (
    <AvatarGroup className="w-fit -space-x-1">
      {names.map((name) => (
        <Avatar key={name} className="size-5" title={name}>
          <AvatarImage src={demoAvatar(name)} alt="" />
          <AvatarFallback className="text-[9px] font-medium">
            {name
              .split(" ")
              .map((part) => part[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
      ))}
      <span className="sr-only">{names.join(", ")}</span>
    </AvatarGroup>
  );
}
function StoryActions({ story }: { story: Story }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Actions for ${story.id}`}
          className="size-7"
        >
          <Ellipsis className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" collisionPadding={5} className="w-44 text-base leading-6">
        <DropdownMenuGroup>
          <DropdownMenuItem
            onSelect={() =>
              toast("Open draft", { description: `Local demo: ${story.id} · ${story.name}.` })
            }
          >
            <Pencil />
            Open draft
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() =>
              toast("View assets", {
                description: `Local demo: ${story.assets} assets attached to ${story.id}.`,
              })
            }
          >
            <Paperclip />
            View assets
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onSelect={() =>
              toast("Move publish date", {
                description: `Local demo: ${story.id} is scheduled for ${dateLabel(story.publish)}.`,
              })
            }
          >
            <Calendar />
            Move publish date
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Each section owns an independent native table: its sort order and horizontal
// viewport do not reorder or scroll any of the other sections.
function StorySection({
  title,
  index,
  data,
  query,
  deskFilter,
  placementFilter,
  hidden,
  setHidden,
  compact,
  showSlug,
}: {
  title: string;
  index: number;
  data: Story[];
  query: string;
  deskFilter: Desk[];
  placementFilter: Placement[];
  hidden: string[];
  setHidden: (next: string[]) => void;
  compact: boolean;
  showSlug: boolean;
}) {
  const columns = useMemo<DomainColumn<Story>[]>(() => {
    const headerClassName = "h-9 text-sm leading-5 font-medium text-foreground";
    const cellClassName = compact ? "py-1.5 text-sm" : "py-2 text-sm";
    const header =
      (title: string): DomainColumn<Story>["header"] =>
      ({ column }) => (
        <DataGridColumnHeader
          column={column}
          title={title}
          className={column.getCanSort() ? "text-sm leading-5 font-normal" : undefined}
        />
      );
    return [
      {
        id: "name",
        accessorKey: "name",
        header: header("Story"),
        size: 220,
        enableHiding: false,
        meta: {
          headerTitle: "Story",
          headerClassName: cn(headerClassName, "lg:pl-4"),
          cellClassName: cn(cellClassName, "lg:pl-4"),
        },
        cell: ({ row }) => (
          <div className="min-w-0">
            <div className="truncate font-medium">{row.original.name}</div>
            {showSlug && (
              <div className="text-xs leading-4 text-muted-foreground">{row.original.id}</div>
            )}
          </div>
        ),
      },
      {
        id: "angle",
        accessorKey: "angle",
        header: header("Angle"),
        size: 200,
        enableSorting: false,
        meta: { headerTitle: "Angle", headerClassName, cellClassName },
        cell: ({ row }) => (
          <div className="truncate text-muted-foreground" title={row.original.angle}>
            {row.original.angle}
          </div>
        ),
      },
      {
        id: "byline",
        accessorFn: (story) => story.byline.join(", "),
        header: header("Byline"),
        size: 104,
        enableSorting: false,
        meta: { headerTitle: "Byline", headerClassName, cellClassName },
        cell: ({ row }) => <Byline names={row.original.byline} />,
      },
      ...(["filed", "publish"] as const).map((id): DomainColumn<Story> => {
        const title = id === "filed" ? "Filed" : "Publish";
        return {
          id,
          accessorKey: id,
          header: header(title),
          size: id === "filed" ? 80 : 92,
          meta: {
            headerTitle: title,
            headerClassName,
            cellClassName: cn(cellClassName, "text-muted-foreground tabular-nums"),
          },
          cell: ({ row }) => <time dateTime={row.original[id]}>{dateLabel(row.original[id])}</time>,
        };
      }),
      {
        id: "placement",
        accessorKey: "placement",
        header: header("Placement"),
        size: 116,
        enableSorting: false,
        filterFn: (row, _id, values: Placement[]) =>
          !values.length || values.includes(row.original.placement),
        meta: { headerTitle: "Placement", headerClassName, cellClassName },
        cell: ({ row }) => (
          <Badge
            variant={row.original.placement === "Lead" ? "secondary" : "outline"}
            className={cn(
              "h-5 text-xs font-normal",
              row.original.placement === "Feature" &&
                "border-violet-200 text-violet-700 dark:border-violet-800 dark:text-violet-300",
            )}
          >
            {row.original.placement}
          </Badge>
        ),
      },
      ...(["assets", "notes"] as const).map((id): DomainColumn<Story> => {
        const title = id === "assets" ? "Assets" : "Notes";
        const Icon = id === "assets" ? Paperclip : MessageSquare;
        return {
          id,
          accessorKey: id,
          header: header(title),
          size: 80,
          meta: { headerTitle: title, headerClassName, cellClassName },
          cell: ({ row }) => (
            <Badge variant="outline" className="h-5 gap-1 text-xs font-normal tabular-nums">
              <Icon className="size-3.5 text-muted-foreground" />
              {row.original[id]}
              <span className="sr-only">{id === "assets" ? "assets attached" : "desk notes"}</span>
            </Badge>
          ),
        };
      }),
      {
        id: "actions",
        header: "",
        size: 52,
        enableSorting: false,
        enableHiding: false,
        meta: {
          headerClassName: cn(headerClassName, "lg:pr-4"),
          cellClassName: cn(cellClassName, "text-right lg:pr-4"),
        },
        cell: ({ row }) => <StoryActions story={row.original} />,
      },
      {
        id: "desk",
        accessorKey: "desk",
        enableHiding: false,
        enableSorting: false,
        filterFn: (row, _id, values: Desk[]) =>
          !values.length || values.includes(row.original.desk),
      },
    ];
  }, [compact, showSlug]);
  const table = useDomainGrid({
    data,
    columns,
    search: query,
    filters: [
      { id: "desk", value: deskFilter },
      { id: "placement", value: placementFilter },
    ],
    hidden,
    alwaysHidden: ["desk"],
    onHiddenChange: setHidden,
    getRowId: (story) => story.id,
  });
  const visibleCount = table.getFilteredRowModel().rows.length;
  const style = bandStyles[index % bandStyles.length];
  return (
    <section aria-label={`${title} stories`} className="min-w-0 border-b last:border-b-0">
      <div
        className={cn("flex h-[45px] items-center gap-2 border-b px-3 lg:px-4", style.background)}
      >
        <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", style.dot)} />
        <h2 className="text-xs font-semibold tracking-[0.025em] uppercase">{title}</h2>
        <Badge variant="outline" className="h-5 bg-background text-xs font-normal tabular-nums">
          {visibleCount}
        </Badge>
        <Button
          variant="outline"
          size="icon-sm"
          className="ml-auto size-7 bg-background"
          aria-label={`Add a story to ${title}`}
          onClick={() =>
            toast("Commission a story", { description: `Local demo: add a piece to ${title}.` })
          }
        >
          <Plus className="size-4" />
        </Button>
      </div>
      <DataGrid
        table={table}
        recordCount={visibleCount}
        emptyMessage={`Nothing in ${title}.`}
        tableLayout={{
          width: "fixed",
          rowBorder: true,
          headerBorder: true,
          headerBackground: false,
        }}
        tableClassNames={{
          base: "text-sm",
          headerRow: "h-9",
          bodyRow: compact ? "h-12" : "h-[52px]",
        }}
      >
        <DataGridContainer className="min-w-0 rounded-none border-0">
          <DataGridScrollArea orientation="horizontal">
            <DataGridTable />
          </DataGridScrollArea>
        </DataGridContainer>
      </DataGrid>
    </section>
  );
}

export default function EditorialDesk() {
  const isMobile = useIsMobile(640);
  const [groupBy, setGroupBy] = useState<GroupBy>("Stage");
  const [query, setQuery] = useState("");
  const [deskFilter, setDeskFilter] = useState<Desk[]>([]);
  const [placementFilter, setPlacementFilter] = useState<Placement[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const [compact, setCompact] = useState(false);
  const [showSlug, setShowSlug] = useState(true);
  const filtered = stories.filter((story) =>
    matchesStory(story, query, deskFilter, placementFilter),
  );
  const activeFilters = deskFilter.length + placementFilter.length;
  const filteredView = Boolean(query.trim() || activeFilters);
  const groups =
    groupBy === "Stage" ? stages : groupBy === "Desk" ? desks : ["Issue 42", "Issue 43"];
  const groupField = groupBy === "Stage" ? "stage" : groupBy === "Desk" ? "desk" : "issue";
  return (
    <Frame
      role="region"
      aria-label="Editorial production desk grouped data grid"
      className="mx-auto mt-8 w-full min-w-0 max-w-[1216px] overflow-hidden text-base leading-6 max-sm:mt-12 max-sm:w-[calc(100%-72px)]"
    >
      <FrameHeader className="flex flex-row flex-wrap items-center justify-between gap-4 px-4 py-2 max-sm:flex-col max-sm:items-start">
        <div>
          <FrameTitle>Production Desk</FrameTitle>
          <FrameDescription className="flex flex-wrap items-center gap-1.5">
            Northline Review{" "}
            <span aria-hidden="true" className="text-muted-foreground/40">
              •
            </span>{" "}
            24 Jul 2026
          </FrameDescription>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            Stories
            <Badge variant="outline" className="h-5 text-xs font-normal tabular-nums">
              {filteredView ? `${filtered.length} of ${stories.length}` : stories.length}
            </Badge>
          </span>
          <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground sm:border-l sm:pl-3">
            Unchecked
            <Badge variant="outline" className="h-5 text-xs font-normal tabular-nums">
              {
                filtered.filter((story) => story.stage === "Drafting" || story.stage === "In Edit")
                  .length
              }
            </Badge>
          </span>
          <div className="max-sm:basis-full">
            <Button
              onClick={() =>
                toast("New story", { description: "Local demo: connect this action to your CMS." })
              }
            >
              <Plus data-icon="inline-start" className="size-4" />
              New story
            </Button>
          </div>
        </div>
      </FrameHeader>
      <FramePanel className="p-0 shadow-none">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-3 py-3 lg:px-4">
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-xs font-medium text-muted-foreground">Group by</span>
            <ToggleGroup
              type="single"
              value={groupBy}
              onValueChange={(value) => {
                if (value) setGroupBy(value as GroupBy);
              }}
              variant="outline"
              spacing={0}
              aria-label="Group stories by"
            >
              {(["Stage", "Desk", "Issue"] as const).map((value) => (
                <ToggleGroupItem key={value} value={value} className="h-8 px-2 text-sm">
                  {value}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-1.5 max-sm:w-full">
            <InputGroup className="w-56 max-sm:w-full">
              <InputGroupAddon>
                <Search className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                aria-label="Search stories"
                placeholder="Search stories..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </InputGroup>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter data-icon="inline-start" className="size-4" />
                  Filter
                  {activeFilters > 0 && (
                    <Badge variant="secondary" className="h-4 min-w-4 px-1 text-[10px]">
                      {activeFilters}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align={isMobile ? "start" : "end"}
                collisionPadding={5}
                className="w-52 text-base leading-6"
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Desk</DropdownMenuLabel>
                  {desks.map((desk) => (
                    <DropdownMenuCheckboxItem
                      key={desk}
                      checked={deskFilter.includes(desk)}
                      onSelect={(event) => event.preventDefault()}
                      onCheckedChange={(checked) =>
                        setDeskFilter(toggleValue(deskFilter, desk, !!checked))
                      }
                    >
                      {desk}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Placement</DropdownMenuLabel>
                  {placements.map((placement) => (
                    <DropdownMenuCheckboxItem
                      key={placement}
                      checked={placementFilter.includes(placement)}
                      onSelect={(event) => event.preventDefault()}
                      onCheckedChange={(checked) =>
                        setPlacementFilter(toggleValue(placementFilter, placement, !!checked))
                      }
                    >
                      {placement}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <Settings2 data-icon="inline-start" className="size-4" />
                  Display
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align={isMobile ? "start" : "end"}
                collisionPadding={5}
                className="w-[300px] p-0"
              >
                <FieldGroup className="gap-3 px-3.5 py-3">
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-medium text-muted-foreground">Table</p>
                    <Field orientation="horizontal" className="h-9 justify-between gap-3">
                      <FieldLabel className="text-sm leading-none font-normal">Density</FieldLabel>
                      <Choice
                        label="Row density"
                        value={compact ? "Compact" : "Comfortable"}
                        options={["Compact", "Comfortable"]}
                        onChange={(value) => setCompact(value === "Compact")}
                        className="h-7! w-[132px] shrink-0"
                      />
                    </Field>
                    <Field orientation="horizontal" className="h-9 justify-between gap-3">
                      <FieldLabel
                        htmlFor="editorial-story-slug"
                        className="text-sm leading-none font-normal"
                      >
                        Story Slug
                      </FieldLabel>
                      <Switch
                        id="editorial-story-slug"
                        checked={showSlug}
                        onCheckedChange={setShowSlug}
                      />
                    </Field>
                  </div>
                  <FieldSeparator className="-mx-3.5" />
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-medium text-muted-foreground">Display properties</p>
                    <div className="flex flex-wrap gap-1.5">
                      {properties.map((name) => {
                        const visible = !hidden.includes(name);
                        return (
                          <Button
                            key={name}
                            size="sm"
                            variant={visible ? "secondary" : "outline"}
                            aria-pressed={visible}
                            className="rounded-full border-foreground/10"
                            onClick={() => setHidden(toggleValue(hidden, name, visible))}
                          >
                            {visible && <Check className="size-4" />}
                            {name}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </FieldGroup>
              </PopoverContent>
            </Popover>
            {filteredView && (
              <Button
                variant="ghost"
                onClick={() => {
                  setQuery("");
                  setDeskFilter([]);
                  setPlacementFilter([]);
                }}
              >
                <X data-icon="inline-start" className="size-4" />
                Clear
              </Button>
            )}
          </div>
        </div>
        {filtered.length > 0 ? (
          groups.map((title, index) => (
            <StorySection
              key={`${groupBy}:${title}`}
              title={title}
              index={index}
              data={stories.filter((story) => story[groupField] === title)}
              query={query}
              deskFilter={deskFilter}
              placementFilter={placementFilter}
              hidden={hidden}
              setHidden={setHidden}
              compact={compact}
              showSlug={showSlug}
            />
          ))
        ) : (
          <Empty className="rounded-none px-4 py-14">
            <EmptyHeader className="gap-1">
              <EmptyTitle className="tracking-normal" style={{ fontFamily: "inherit" }}>
                No stories match
              </EmptyTitle>
              <EmptyDescription className="leading-5">
                Try another desk or clear the filters.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </FramePanel>
    </Frame>
  );
}
