import { Badge } from "@/components/reui/badge";
import { DataGrid, DataGridContainer } from "@/components/reui/data-grid/data-grid";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Field, FieldLabel, FieldSeparator } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { demoAvatar, integrationArtwork, svgImage } from "@/lib/demo-artwork";
import { cn } from "@/lib/utils";
import { Check, Filter, Link, Plus, Search, Settings2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  domainTextMatches,
  useDomainGrid,
  type DomainColumn,
  type SortingState,
} from "./grid-advanced-model-grid";
import { Choice } from "./grid-advanced-shared";

const stageNames = ["Discovery", "In Production", "Client Review", "Ready To Ship"] as const;
type Stage = (typeof stageNames)[number];
type Engagement = {
  id: string;
  client: string;
  engagement: string | null;
  stage: Stage;
  completion: number | null;
  crew: string[];
  milestone: string | null;
};

// Visible public project data; independent stable crew identities and original
// typographic client tiles replace upstream portraits and brand SVG artwork.
const crew = [
  "Rina Holt",
  "Noor Albright",
  "Evren Blake",
  "Sora Min",
  "Mina Rowe",
  "Vale Aksoy",
  "Leo Grant",
  "Mira Stone",
];
const initialRows: Engagement[] = [
  {
    id: "discovery-stripe",
    client: "Stripe",
    engagement: "Spring Menu Film",
    stage: "Discovery",
    completion: 18,
    crew: [crew[0], crew[1]],
    milestone: "Concept Lock",
  },
  {
    id: "discovery-docker",
    client: "Docker",
    engagement: null,
    stage: "Discovery",
    completion: null,
    crew: [crew[6]],
    milestone: null,
  },
  {
    id: "discovery-gemini",
    client: "Gemini",
    engagement: "Type Specimen",
    stage: "Discovery",
    completion: 27,
    crew: [crew[3], crew[0], crew[2], crew[5]],
    milestone: "Art Direction",
  },
  {
    id: "production-supabase",
    client: "Supabase",
    engagement: "Lab Site Rebuild",
    stage: "In Production",
    completion: 64,
    crew: [crew[3], crew[5], crew[1], crew[0], crew[4], crew[2], crew[6]],
    milestone: "Motion Pass",
  },
  {
    id: "production-neon",
    client: "Neon",
    engagement: "Docuseries Titles",
    stage: "In Production",
    completion: 52,
    crew: [crew[4], crew[7], crew[2]],
    milestone: "Style Frames",
  },
  {
    id: "production-slack",
    client: "Slack",
    engagement: "Catalog Relaunch",
    stage: "In Production",
    completion: 71,
    crew: [crew[2], crew[0], crew[1], crew[3], crew[7]],
    milestone: "Photo Edit",
  },
  {
    id: "production-loom",
    client: "Loom",
    engagement: null,
    stage: "In Production",
    completion: null,
    crew: [crew[0]],
    milestone: null,
  },
  {
    id: "review-hono",
    client: "Hono",
    engagement: "Annual Report",
    stage: "Client Review",
    completion: 88,
    crew: [crew[1], crew[6], crew[3], crew[5], crew[2], crew[4]],
    milestone: "Print Proof",
  },
  {
    id: "review-convex",
    client: "Convex",
    engagement: "Care Campaign",
    stage: "Client Review",
    completion: 79,
    crew: [crew[7], crew[5]],
    milestone: "Final Cut",
  },
  {
    id: "review-redis",
    client: "Redis",
    engagement: "Cellar Identity",
    stage: "Client Review",
    completion: 83,
    crew: [crew[0]],
    milestone: "Brand Book",
  },
  {
    id: "ready-stripe",
    client: "Stripe",
    engagement: "Holiday Packaging",
    stage: "Ready To Ship",
    completion: 96,
    crew: [...crew],
    milestone: "Launch Kit",
  },
  {
    id: "ready-supabase",
    client: "Supabase",
    engagement: "Investor Deck",
    stage: "Ready To Ship",
    completion: 100,
    crew: [crew[2], crew[5]],
    milestone: "Handoff",
  },
];
const clientColors: Record<string, string> = {
  Stripe: "#7763b6",
  Docker: "#5288ac",
  Gemini: "#b58a64",
  Supabase: "#589881",
  Neon: "#5c9a88",
  Slack: "#a56d8f",
  Loom: "#7a70b1",
  Hono: "#bb885e",
  Convex: "#a67986",
  Redis: "#af706e",
};

function Completion({ value }: { value: number | null }) {
  if (value === null) return <div className="text-right text-muted-foreground">-</div>;
  const filled = Math.ceil((value / 100) * 8);
  return (
    <div className="flex items-center gap-2" aria-label={`${value}% complete`}>
      <span className="grid h-1.5 min-w-16 flex-1 grid-cols-8 gap-1" aria-hidden="true">
        {Array.from({ length: 8 }, (_, index) => (
          <span
            key={index}
            className={cn(
              "rounded-full",
              index >= filled
                ? "bg-muted"
                : value >= 80
                  ? "bg-emerald-500"
                  : value >= 40
                    ? "bg-amber-500"
                    : "bg-sky-500",
            )}
          />
        ))}
      </span>
      <span className="w-10 shrink-0 text-right text-sm tabular-nums">{value}%</span>
    </div>
  );
}

function Crew({ row }: { row: Engagement }) {
  const previewCount = row.client === "Neon" ? 2 : 3;
  return (
    <AvatarGroup
      className="items-center -space-x-1"
      aria-label={`Crew on the ${row.client} engagement`}
    >
      {row.crew.slice(0, previewCount).map((name) => (
        <Avatar key={name} size="sm" className="size-5">
          <AvatarImage src={demoAvatar(name)} alt="" />
          <AvatarFallback className="text-[9px]">
            {name
              .split(" ")
              .map((part) => part[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
      ))}
      {row.crew.length > previewCount && (
        <AvatarGroupCount className="size-5! border bg-background text-[9px]">
          +{row.crew.length - previewCount}
        </AvatarGroupCount>
      )}
    </AvatarGroup>
  );
}

function StageTable({
  stage,
  records,
  query,
  sorting,
  setSorting,
  selected,
  setSelected,
  hidden,
  setHidden,
  roomy,
}: {
  stage: Stage;
  records: Engagement[];
  query: string;
  sorting: SortingState;
  setSorting: (next: SortingState) => void;
  selected: string[];
  setSelected: (next: string[]) => void;
  hidden: string[];
  setHidden: (next: string[]) => void;
  roomy: boolean;
}) {
  const columns = useMemo<DomainColumn<Engagement>[]>(
    () => [
      {
        id: "select",
        size: 44,
        enableSorting: false,
        enableHiding: false,
        meta: {
          headerClassName: "pl-3 pr-0 sm:pl-4",
          cellClassName: "pl-3 pr-2 sm:pl-4",
        },
        header: ({ table }) => (
          <Checkbox
            aria-label={`Select every row in ${stage}`}
            checked={
              table.getIsAllPageRowsSelected()
                ? true
                : table.getIsSomePageRowsSelected()
                  ? "indeterminate"
                  : false
            }
            onCheckedChange={(checked) => table.toggleAllPageRowsSelected(!!checked)}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            aria-label={`Select ${row.original.client}`}
            checked={row.getIsSelected()}
            onCheckedChange={(checked) => row.toggleSelected(!!checked)}
          />
        ),
      },
      {
        id: "client",
        accessorFn: (row) => row.client,
        size: 212,
        enableHiding: false,
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Client" className="text-sm leading-5" />
        ),
        meta: { headerTitle: "Client", headerClassName: "px-2", cellClassName: "px-2" },
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <img
              className="size-5 shrink-0 rounded-sm"
              alt=""
              src={svgImage(
                integrationArtwork(
                  row.original.client[0],
                  clientColors[row.original.client] || "#71717a",
                ),
              )}
            />
            <span>{row.original.client}</span>
          </div>
        ),
      },
      {
        id: "engagement",
        accessorFn: (row) => row.engagement,
        size: 288,
        enableHiding: false,
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Engagement" className="text-sm leading-5" />
        ),
        meta: { headerTitle: "Engagement", headerClassName: "px-2", cellClassName: "px-2" },
        cell: ({ row }) =>
          row.original.engagement ? (
            <div className="flex min-w-0 items-center gap-1">
              <span className="truncate">{row.original.engagement}</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    className="text-muted-foreground"
                    aria-label={`Open the brief for ${row.original.engagement}`}
                    onClick={() =>
                      toast("Open brief", {
                        description: `${row.original.client} / ${row.original.engagement}`,
                      })
                    }
                  >
                    <Link className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">Open Brief</p>
                </TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon-xs"
                  className="size-6 rounded-full border-dashed text-muted-foreground"
                  aria-label={`Name the ${row.original.client} engagement`}
                  onClick={() =>
                    toast("Name engagement", {
                      description: `Open the intake form for ${row.original.client}.`,
                    })
                  }
                >
                  <Plus className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">Name Engagement</p>
              </TooltipContent>
            </Tooltip>
          ),
      },
      {
        id: "completion",
        accessorFn: (row) => row.completion,
        size: 192,
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Completion" className="text-sm leading-5" />
        ),
        meta: { headerTitle: "Completion", headerClassName: "px-2", cellClassName: "px-2" },
        cell: ({ row }) => <Completion value={row.original.completion} />,
      },
      {
        id: "crew",
        accessorFn: (row) => row.crew.length,
        sortDescFirst: false,
        size: 140,
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Crew" className="text-sm leading-5" />
        ),
        meta: { headerTitle: "Crew", headerClassName: "px-2", cellClassName: "px-2" },
        cell: ({ row }) => <Crew row={row.original} />,
      },
      {
        id: "milestone",
        accessorFn: (row) => row.milestone,
        size: 164,
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Milestone" className="text-sm leading-5" />
        ),
        meta: {
          headerTitle: "Milestone",
          headerClassName: "pl-2 pr-3 sm:pr-4",
          cellClassName: "pl-2 pr-3 sm:pr-4",
        },
        cell: ({ row }) =>
          row.original.milestone ? (
            <Badge variant="outline" className="h-5">
              {row.original.milestone}
            </Badge>
          ) : (
            <span className="text-muted-foreground">No milestone</span>
          ),
      },
    ],
    [stage],
  );
  const table = useDomainGrid({
    data: records,
    columns,
    search: query,
    sorting,
    onSortingChange: setSorting,
    selection: selected,
    onSelectionChange: setSelected,
    hidden,
    onHiddenChange: setHidden,
    getRowId: (row) => row.id,
  });
  const matching = table.getFilteredRowModel().rows.map((row) => row.original);
  if (!matching.length) return null;
  const completions = matching.flatMap((row) => (row.completion === null ? [] : [row.completion]));
  const average = completions.length
    ? Math.round(completions.reduce((sum, value) => sum + value, 0) / completions.length)
    : null;
  return (
    <section aria-label={`${stage} engagements`} data-delivery-stage={stage}>
      <div className="flex h-[38px] items-center justify-between gap-3 border-y bg-muted/30 px-4">
        <span className="inline-flex items-center gap-2 font-semibold">
          {stage}
          <Badge
            variant={
              stage === "Discovery"
                ? "info-light"
                : stage === "Client Review"
                  ? "warning-light"
                  : stage === "Ready To Ship"
                    ? "success-light"
                    : "secondary"
            }
            className={cn(
              "h-4.5 min-w-4.5 px-1 text-[10px] font-normal",
              stage === "Discovery" &&
                "border-violet-300/40 bg-violet-500/10 text-violet-700 dark:text-violet-300",
            )}
          >
            {matching.length}
          </Badge>
        </span>
        <span className="text-xs text-muted-foreground">
          Avg {average === null ? "—" : `${average}%`}
        </span>
      </div>
      <DataGrid
        table={table}
        recordCount={matching.length}
        tableLayout={{
          width: "fixed",
          rowBorder: true,
          headerBorder: true,
          headerBackground: false,
        }}
        tableClassNames={{ headerRow: "h-8", bodyRow: roomy ? "h-14" : "h-12", base: "text-sm" }}
      >
        <DataGridContainer className="rounded-none border-0">
          <ScrollArea className="w-full" type="auto">
            <div className="min-w-[1040px]">
              <DataGridTable />
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </DataGridContainer>
      </DataGrid>
    </section>
  );
}

export default function DeliveryStages() {
  const [records, setRecords] = useState(initialRows);
  const [query, setQuery] = useState("");
  const [visibleStages, setVisibleStages] = useState<Stage[]>([...stageNames]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const [roomy, setRoomy] = useState(false);
  const hasMatches = records.some(
    (row) => visibleStages.includes(row.stage) && domainTextMatches(row, query),
  );
  return (
    <Frame
      variant="default"
      role="region"
      aria-label="Delivery Board"
      className="mx-auto mt-8 w-full min-w-0 max-w-[1216px] max-sm:mt-12 max-sm:w-[calc(100%-72px)]"
    >
      <FrameHeader className="min-w-0 flex-col items-start gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-col max-sm:w-full">
          <FrameTitle>Delivery Board</FrameTitle>
          <FrameDescription className="flex min-w-0 items-center gap-1.5">
            <span className="truncate">Active studio engagements</span>
            <span
              className="size-1 shrink-0 rounded-full bg-muted-foreground/40"
              aria-hidden="true"
            />
            <span className="shrink-0">Week Of Mar 10</span>
          </FrameDescription>
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground sm:border-r sm:pr-3">
            Engagements{" "}
            <Badge variant="outline" className="h-5 tabular-nums">
              {records.length}
            </Badge>
          </div>
          <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
            Near done{" "}
            <Badge variant="success-light" className="h-5 tabular-nums">
              {records.filter((row) => row.completion !== null && row.completion > 80).length}
            </Badge>
          </div>
        </div>
      </FrameHeader>
      <FramePanel className="bg-card p-0 shadow-none">
        <div className="flex flex-col gap-3 px-3 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-4">
          <InputGroup className="h-8 w-full min-w-0 lg:max-w-xs">
            <InputGroupInput
              aria-label="Search engagements"
              placeholder="Search engagements..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <InputGroupAddon>
              <Search className="size-4" />
            </InputGroupAddon>
          </InputGroup>
          <div className="flex flex-wrap items-center gap-2">
            {selected.length > 0 && (
              <>
                <span role="status" className="text-xs text-muted-foreground">
                  {selected.length} selected
                </span>
                <Button size="sm" variant="ghost" className="h-8" onClick={() => setSelected([])}>
                  Clear
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8"
                  onClick={() => {
                    setRecords((rows) =>
                      rows.map((row) =>
                        selected.includes(row.id)
                          ? { ...row, stage: "Ready To Ship", completion: 100 }
                          : row,
                      ),
                    );
                    setSelected([]);
                  }}
                >
                  Move to ready
                </Button>
              </>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 pr-2.5 pl-2 text-sm leading-5"
                >
                  <Filter className="size-3.5" />
                  Stages
                  {visibleStages.length !== stageNames.length && (
                    <Badge variant="secondary">{visibleStages.length}</Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" collisionPadding={5} className="w-48">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Visible stages</DropdownMenuLabel>
                  {stageNames.map((stage) => (
                    <DropdownMenuCheckboxItem
                      key={stage}
                      checked={visibleStages.includes(stage)}
                      onSelect={(event) => event.preventDefault()}
                      onCheckedChange={(checked) =>
                        setVisibleStages((current) =>
                          checked
                            ? [...current, stage]
                            : current.filter((value) => value !== stage),
                        )
                      }
                    >
                      {stage}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuGroup>
                {visibleStages.length !== stageNames.length && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => setVisibleStages([...stageNames])}>
                      Show all
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 pr-2.5 pl-2 text-sm leading-5"
                >
                  <Settings2 className="size-3.5" />
                  Display
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                collisionPadding={5}
                className="w-[300px] gap-2.5 p-0 text-sm leading-5"
              >
                <div className="flex flex-col gap-3 px-3.5 py-3">
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-medium text-muted-foreground">Table</p>
                    <Field
                      orientation="horizontal"
                      className="min-h-9 items-center justify-between gap-3"
                    >
                      <FieldLabel className="text-sm font-normal">Density</FieldLabel>
                      <Choice
                        label="Row density"
                        value={roomy ? "Roomy" : "Compact"}
                        onChange={(value) => setRoomy(value === "Roomy")}
                        options={["Compact", "Roomy"]}
                        className="h-7! min-h-7! w-[132px]"
                      />
                    </Field>
                  </div>
                  <FieldSeparator className="-mx-3.5" />
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-medium text-muted-foreground">Display properties</p>
                    <div className="flex flex-wrap gap-1.5">
                      {["Completion", "Crew", "Milestone"].map((name) => (
                        <Button
                          key={name}
                          size="sm"
                          variant="outline"
                          aria-pressed={!hidden.includes(name)}
                          className={cn(
                            "h-7 gap-1 rounded-full px-2.5 font-medium",
                            !hidden.includes(name) && "bg-muted",
                          )}
                          onClick={() =>
                            setHidden((current) =>
                              current.includes(name)
                                ? current.filter((value) => value !== name)
                                : [...current, name],
                            )
                          }
                        >
                          {!hidden.includes(name) && <Check className="size-4" />}
                          {name}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        {stageNames
          .filter((stage) => visibleStages.includes(stage))
          .map((stage) => (
            <StageTable
              key={stage}
              stage={stage}
              records={records.filter((row) => row.stage === stage)}
              query={query}
              sorting={sorting}
              setSorting={setSorting}
              selected={selected}
              setSelected={setSelected}
              hidden={hidden}
              setHidden={setHidden}
              roomy={roomy}
            />
          ))}
        {!hasMatches && (
          <Empty className="py-12">
            <EmptyHeader>
              <EmptyTitle>No Matches</EmptyTitle>
              <EmptyDescription>
                No engagement matches this search or stage filter.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </FramePanel>
    </Frame>
  );
}
