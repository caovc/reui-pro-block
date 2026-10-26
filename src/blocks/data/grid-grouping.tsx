import type { BlockProps } from "@/data/types";
import { ExternalLink, MessageSquare, Paperclip, Plus } from "lucide-react";
import { useState } from "react";
import { advancedBrandAssets } from "./grid-advanced-brand-assets";
import { DomainGroupedGrid } from "./grid-advanced-group-model";
import { domainTextMatches } from "./grid-advanced-model-grid";
import {
  AddRecord,
  Button,
  Checkbox,
  Choice,
  DotBadge,
  GridFrame,
  GridSearch,
  RowMenu,
  TableOptions,
  TinyAvatar,
} from "./grid-advanced-shared";
import { cellClass, cn, useGridSorting } from "./grid-advanced-utils";
import { gridBrandAssets } from "./grid-base-assets";
import { MaterialsTree, ReportingTree } from "./grid-grouping-trees";
import Roadmap from "./grid-grouping-roadmap";
import Revenue from "./grid-grouping-revenue";
import Cohorts from "./grid-grouping-cohorts";
const owners = ["Rina Holt", "Evren Blake", "Mina Rowe", "Sora Min", "Noor Albright"];
const storyTitles = [
  "The Last Dry Winter",
  "Cheap Money Ends",
  "Night Shift Choirs",
  "The Grid Goes Quiet",
  "The Repair Clause",
  "Museum of Ordinary Things",
  "Counting the Kelp",
  "Who Owns the Aquifer?",
  "The Understudy Economy",
  "After the Last Train",
  "Good Neighbors",
  "A Smaller Footprint",
  "Beyond the Headline",
];
const editorialStages = ["DRAFTING", "IN EDIT", "FACT CHECK", "READY"];
function Editorial() {
  const [rows, setRows] = useState(
    storyTitles.map((name, i) => ({
      id: i + 1,
      name,
      stage: editorialStages[Math.min(3, Math.floor(i / 3))],
      desk: ["Culture", "Business", "Climate"][i % 3],
      issue: ["July", "August", "September"][i % 3],
      placement: ["Lead", "Feature", "Brief"][i % 3],
      assets: [7, 3, 2, 11, 6, 4, 9, 14, 3, 5, 8, 2, 6][i],
      notes: [12, 5, 3, 18, 21, 7, 26, 33, 9, 4, 7, 2, 6][i],
    })),
  );
  const [groupBy, setGroupBy] = useState("Stage");
  const [query, setQuery] = useState("");
  const [placement, setPlacement] = useState("All placements");
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const groups =
    groupBy === "Stage"
      ? editorialStages
      : groupBy === "Desk"
        ? ["Culture", "Business", "Climate"]
        : ["July", "August", "September"];
  const columns = ["Story", "Angle", "Byline", "Filed", "Publish", "Placement", "Assets", "Notes"];
  return (
    <GridFrame
      className="mt-8 [&>header]:py-3.5"
      title="Production Desk"
      description="Northline Review · 24 Jul 2026"
      summary={
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span>
            Stories <b className="text-foreground">{rows.length}</b>
          </span>
          <span>
            Unchecked <b className="text-foreground">6</b>
          </span>
        </div>
      }
      actions={
        <AddRecord
          label="New story"
          title="New story"
          fields={[{ name: "name", label: "Story title" }]}
          onSave={(v) =>
            setRows((rs) => [
              ...rs,
              {
                id: rs.length + 1,
                name: v.name,
                stage: "DRAFTING",
                desk: "Culture",
                issue: "July",
                placement: "Brief",
                assets: 0,
                notes: 0,
              },
            ])
          }
        />
      }
    >
      <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2">
        <span className="text-xs text-muted-foreground">Group by</span>
        <div className="flex rounded border p-0.5">
          {["Stage", "Desk", "Issue"].map((v) => (
            <button
              key={v}
              onClick={() => {
                setGroupBy(v);
                setCollapsed([]);
              }}
              aria-pressed={groupBy === v}
              className={cn(
                "rounded px-2 py-1 text-[13px]",
                groupBy === v && "bg-muted font-medium",
              )}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="ml-auto flex min-w-0 flex-wrap gap-2">
          <GridSearch value={query} onChange={setQuery} placeholder="Search stories..." />
          <Choice
            label="Story placement"
            value={placement}
            onChange={setPlacement}
            options={["All placements", "Lead", "Feature", "Brief"]}
          />
          <TableOptions columns={columns.slice(1)} hidden={hidden} setHidden={setHidden} />
        </div>
      </div>
      <DomainGroupedGrid
        groups={groups.map((group, i) => ({
          id: group,
          title: group,
          tone: ["bg-sky-500/5", "bg-amber-500/5", "bg-rose-500/5", "bg-emerald-500/5"][i % 4],
          children: rows.filter(
            (r) =>
              (groupBy === "Stage" ? r.stage : groupBy === "Desk" ? r.desk : r.issue) === group,
          ),
        }))}
        getId={(r) => String(r.id)}
        search={query}
        filter={(r) => placement === "All placements" || r.placement === placement}
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        hidden={hidden}
        onHiddenChange={setHidden}
        header="repeated"
        className="[&_tbody_tr]:h-14"
        groupAction={(group) => (
          <Button
            variant="outline"
            size="icon-xs"
            className="size-5"
            aria-label={`Add story to ${group.title}`}
            onClick={() =>
              setRows((rs) => [
                ...rs,
                {
                  id: rs.length + 1,
                  name: `Untitled story ${rs.length + 1}`,
                  stage: groupBy === "Stage" ? group.title : "DRAFTING",
                  desk: groupBy === "Desk" ? group.title : "Culture",
                  issue: groupBy === "Issue" ? group.title : "July",
                  placement: "Brief",
                  assets: 0,
                  notes: 0,
                },
              ])
            }
          >
            <Plus />
          </Button>
        )}
        fields={[
          {
            id: "name",
            title: "Story",
            value: (r) => r.name,
            size: 280,
            className: cellClass,
            render: (r, _i, _gridRow) => {
              return (
                <>
                  <span className="font-medium">{r.name}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    NR-{1200 + r.id}
                  </span>
                </>
              );
            },
          },
          {
            id: "angle",
            title: "Angle",
            value: (r) =>
              [
                "Reservoir towns rewrite what remains",
                "Why regional lenders stopped lending",
                "Hospital cleaners built a choir",
                "A utility learns to sell less power",
              ][(r.id - 1) % 4],
            size: 290,
            className: cn(cellClass, "truncate text-[13px] text-muted-foreground"),
            render: (_r, i, _gridRow) => {
              return (
                <>
                  {
                    [
                      "Reservoir towns rewrite what remains",
                      "Why regional lenders stopped lending",
                      "Hospital cleaners built a choir",
                      "A utility learns to sell less power",
                    ][i % 4]
                  }
                </>
              );
            },
          },
          {
            id: "byline",
            title: "Byline",
            value: (r) => owners[(r.id - 1) % 5],
            size: 90,
            className: cellClass,
            render: (_r, i, _gridRow) => {
              return (
                <>
                  <div className="flex -space-x-1">
                    <TinyAvatar name={owners[i % 5]} />
                    {i % 2 === 0 && (
                      <TinyAvatar
                        name={owners[(i + 1) % 5]}
                        color="bg-violet-100 text-violet-700"
                      />
                    )}
                  </div>
                </>
              );
            },
          },
          {
            id: "filed",
            title: "Filed",
            value: (r) => r.id,
            size: 85,
            className: cn(cellClass, "text-xs text-muted-foreground"),
            render: (_r, i, _gridRow) => {
              return <>{6 + i * 3} Jul</>;
            },
          },
          {
            id: "publish",
            title: "Publish",
            value: (r) => r.id,
            size: 85,
            className: cn(cellClass, "text-xs text-muted-foreground"),
            render: (_r, i, _gridRow) => {
              return <>{14 + i * 3} Aug</>;
            },
          },
          {
            id: "placement",
            title: "Placement",
            value: (r) => r.placement,
            size: 100,
            className: cellClass,
            render: (r, _i, _gridRow) => {
              return (
                <>
                  <DotBadge tone={r.placement === "Feature" ? "violet" : "muted"}>
                    {r.placement}
                  </DotBadge>
                </>
              );
            },
          },
          {
            id: "assets",
            title: "Assets",
            value: (r) => r.assets,
            size: 82,
            className: cellClass,
            render: (r, _i, _gridRow) => {
              return (
                <>
                  <span className="inline-flex items-center gap-1 rounded border px-1 text-xs">
                    <Paperclip className="size-3" />
                    {r.assets}
                  </span>
                </>
              );
            },
          },
          {
            id: "notes",
            title: "Notes",
            value: (r) => r.notes,
            size: 82,
            className: cellClass,
            render: (r, _i, _gridRow) => {
              return (
                <>
                  <span className="inline-flex items-center gap-1 rounded border px-1 text-xs">
                    <MessageSquare className="size-3" />
                    {r.notes}
                  </span>
                </>
              );
            },
          },
          {
            id: "actions",
            title: "",
            value: (r) => r.id,
            size: 36,
            render: (r, _i, _gridRow) => {
              return (
                <>
                  <RowMenu
                    name={r.name}
                    onDelete={() => setRows((rs) => rs.filter((x) => x.id !== r.id))}
                  />
                </>
              );
            },
          },
        ]}
      />
    </GridFrame>
  );
}
const clients = [
  "Stripe",
  "Docker",
  "Gemini",
  "Supabase",
  "Neon",
  "Slack",
  "Loom",
  "Hono",
  "Convex",
  "Redis",
  "Vercel",
  "Linear",
];
const engagements = [
  "Spring Menu Film",
  "Platform Launch",
  "Type Specimen",
  "Lab Site Rebuild",
  "Docuseries Titles",
  "Catalog Relaunch",
  "Product Story",
  "Annual Report",
  "Care Campaign",
  "Cellar Identity",
  "Brand Platform",
  "Launch Campaign",
];
const deliveryStages = ["Discovery", "In Production", "Client Review", "Ready To Ship"];
function Delivery() {
  const sorting = useGridSorting();
  const [rows, setRows] = useState(
    clients.map((name, i) => ({
      id: i + 1,
      name,
      engagement: engagements[i],
      stage: deliveryStages[i < 3 ? 0 : i < 7 ? 1 : i < 10 ? 2 : 3],
      progress: [18, 0, 27, 64, 52, 71, 59, 88, 79, 83, 96, 100][i],
      milestone: [
        "Concept Lock",
        "No milestone",
        "Art Direction",
        "Motion Pass",
        "Style Frames",
        "Photo Edit",
        "No milestone",
        "Print Proof",
        "Final Cut",
        "Brand Book",
        "Final Delivery",
        "Sign-off",
      ][i],
    })),
  );
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("All stages");
  const [hidden, setHidden] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const filtered = sorting.sortRows(
    rows.filter(
      (r) =>
        domainTextMatches(r, query) && (stageFilter === "All stages" || r.stage === stageFilter),
    ),
    (r, key) =>
      key === "Client"
        ? r.name
        : key === "Engagement"
          ? r.engagement
          : key === "Completion"
            ? r.progress
            : key === "Milestone"
              ? r.milestone
              : r.id,
  );
  return (
    <GridFrame
      className="mt-8 [&>header]:py-3.5"
      title="Delivery Board"
      description="Active studio engagements · Week Of Mar 10"
      summary={
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>
            Engagements <b className="text-foreground">{rows.length}</b>
          </span>
          <span>
            Near done <DotBadge tone="good">{rows.filter((r) => r.progress > 80).length}</DotBadge>
          </span>
        </div>
      }
    >
      <div className="flex flex-wrap gap-2 border-b px-3 py-2">
        <GridSearch value={query} onChange={setQuery} placeholder="Search engagements..." />
        <div className="ml-auto flex gap-2">
          <Choice
            label="Delivery stage"
            value={stageFilter}
            onChange={setStageFilter}
            options={["All stages", ...deliveryStages]}
          />
          <TableOptions
            columns={["Engagement", "Completion", "Crew", "Milestone"]}
            hidden={hidden}
            setHidden={setHidden}
          />
        </div>
      </div>
      {selected.length > 0 && (
        <div className="flex items-center gap-3 border-b bg-blue-500/5 px-3 py-2">
          <span>{selected.length} selected</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setRows((rs) =>
                rs.map((r) =>
                  selected.includes(r.id) ? { ...r, stage: "Ready To Ship", progress: 100 } : r,
                ),
              );
              setSelected([]);
            }}
          >
            Move to ready
          </Button>
        </div>
      )}
      <DomainGroupedGrid
        groups={deliveryStages.map((stage) => ({
          id: stage,
          title: stage,
          children: rows.filter((r) => r.stage === stage),
        }))}
        getId={(r) => String(r.id)}
        search={query}
        filter={(r) => stageFilter === "All stages" || r.stage === stageFilter}
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        hidden={hidden}
        onHiddenChange={setHidden}
        selection={selected.map(String)}
        onSelectionChange={(ids) => setSelected(ids.map(Number))}
        header="repeated"
        className="[&_tbody_tr]:h-12"
        renderGroup={(group) => (
          <>
            <b>{group.title}</b>
            <DotBadge>{filtered.filter((r) => r.stage === group.id).length}</DotBadge>
            <span className="ml-auto text-xs text-muted-foreground">
              Avg{" "}
              {Math.round(
                group.children
                  .filter((r) => filtered.includes(r))
                  .reduce((s, r) => s + r.progress, 0) /
                  (group.children.filter((r) => filtered.includes(r)).length || 1),
              )}
              %
            </span>
          </>
        )}
        fields={[
          {
            id: "select",
            title: "",
            value: (r) => r.id,
            size: 40,
            render: (r, _i, row) => (
              <Checkbox
                aria-label={`Select ${r.name}`}
                checked={row.getIsSelected()}
                onCheckedChange={(v) => row.toggleSelected(!!v)}
              />
            ),
          },
          {
            id: "name",
            title: "Client",
            value: (r) => r.name,
            size: 215,
            className: cellClass,
            render: (r, i, _gridRow) => {
              return (
                <>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex size-5 items-center justify-center rounded text-xs font-bold",
                        [
                          "bg-violet-500/10 text-violet-500",
                          "bg-sky-500/10 text-sky-500",
                          "bg-emerald-500/10 text-emerald-500",
                        ][i % 3],
                      )}
                    >
                      <img
                        alt=""
                        className="size-5 object-contain"
                        src={
                          gridBrandAssets[r.name.toLowerCase()] ||
                          advancedBrandAssets[
                            r.name === "Gemini" ? "googlegemini" : r.name.toLowerCase()
                          ]
                        }
                      />
                    </span>
                    {r.name}
                  </div>
                </>
              );
            },
          },
          {
            id: "engagement",
            title: "Engagement",
            value: (r) => r.engagement,
            size: 270,
            className: cellClass,
            render: (r, _i, _gridRow) => {
              return (
                <>
                  <span className="inline-flex items-center gap-2">
                    {r.engagement}
                    <ExternalLink className="size-3 text-muted-foreground" />
                  </span>
                </>
              );
            },
          },
          {
            id: "progress",
            title: "Completion",
            value: (r) => r.progress,
            size: 250,
            className: cellClass,
            render: (r, _i, _gridRow) => {
              return (
                <>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5" role="img" aria-label={`${r.progress}% complete`}>
                      {Array.from({ length: 10 }, (_, n) => (
                        <span
                          key={n}
                          className={cn(
                            "h-1 w-3 rounded",
                            n < r.progress / 10
                              ? deliveryStages.indexOf(r.stage) === 0
                                ? "bg-sky-500"
                                : deliveryStages.indexOf(r.stage) === 1
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              : "bg-muted",
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-xs">{r.progress}%</span>
                  </div>
                </>
              );
            },
          },
          {
            id: "crew",
            title: "Crew",
            value: (r) => owners[(r.id - 1) % 5],
            size: 110,
            className: cellClass,
            render: (_r, i, _gridRow) => {
              return (
                <>
                  <div className="flex -space-x-1">
                    <TinyAvatar name={owners[i % 5]} />
                    {i % 2 === 0 && (
                      <TinyAvatar
                        name={owners[(i + 1) % 5]}
                        color="bg-violet-100 text-violet-700"
                      />
                    )}
                  </div>
                </>
              );
            },
          },
          {
            id: "milestone",
            title: "Milestone",
            value: (r) => r.milestone,
            size: 160,
            className: cellClass,
            render: (r, _i, _gridRow) => {
              return (
                <>
                  <DotBadge>{r.milestone}</DotBadge>
                </>
              );
            },
          },
        ]}
      />
    </GridFrame>
  );
}
export default function GroupingGrid({ block }: BlockProps) {
  switch (block.id) {
    case "data-grid-grouping-1":
      return <Roadmap />;
    case "data-grid-grouping-2":
      return <Revenue />;
    case "data-grid-grouping-3":
      return <Cohorts />;
    case "data-grid-grouping-4":
      return <MaterialsTree />;
    case "data-grid-grouping-5":
      return <ReportingTree />;
    case "data-grid-grouping-6":
      return <Editorial />;
    default:
      return <Delivery />;
  }
}
