import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { BlockProps } from "@/data/types";
import { Filter, Settings2 } from "lucide-react";
import { useMemo, useState } from "react";
import PerformanceCampaignTable from "./grid-advanced-campaign-table";
import TechnicianCapacity from "./grid-advanced-technician-capacity";
import FactoryScorecard from "./grid-advanced-factory-scorecard";
import FreightCargo from "./grid-advanced-freight";
import HRScorecard from "./grid-advanced-hr-scorecard";
import StrategyScorecard from "./grid-advanced-strategy-scorecard";
import ProspectDatabase from "./grid-advanced-prospect-database";
import { DomainRecordGrid, domainTextMatches } from "./grid-advanced-model-grid";
import { campaignPerformanceRows, campaignTargetRows, storePnlRows } from "./grid-advanced-seeds";
import {
  AddRecord,
  Button,
  Checkbox,
  Choice,
  DotBadge,
  ExportRows,
  GridFrame,
  GridSearch,
  GridTabs,
  Input,
  RowMenu,
  Spark,
  TableOptions,
  TinyAvatar,
} from "./grid-advanced-shared";
import { ProductKpis, ProForma, ServiceVisits, StockMix, Wholesale } from "./grid-advanced-sheets";
import { cellClass, cn, money, useGridSorting } from "./grid-advanced-utils";
type Campaign = (typeof campaignPerformanceRows)[number];
const campaignSeed: Campaign[] = campaignPerformanceRows;
function CampaignGrid({ targets = false }: { targets?: boolean }) {
  const [rows, setRows] = useState(targets ? campaignTargetRows : campaignSeed);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("All");
  const [status, setStatus] = useState("All statuses");
  const [channel, setChannel] = useState("All channels");
  const [page, setPage] = useState(0);

  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<number[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const [compact, setCompact] = useState(false);
  const [filters, setFilters] = useState(true);
  const [columnLines, setColumnLines] = useState(false);
  const [stripes, setStripes] = useState(false);
  const [resizable, setResizable] = useState(false);
  const [movable, setMovable] = useState(false);
  const [columnReset, setColumnReset] = useState(0);
  const [sort, setSort] = useState<{
    key: keyof Campaign;
    asc: boolean;
  }>({ key: "spend", asc: false });
  const [target, setTarget] = useState(targets ? "" : "4.3");
  const [filterName, setFilterName] = useState("");
  const filtered = useMemo(
    () =>
      rows
        .filter(
          (r) =>
            domainTextMatches(r, query) &&
            r.name.toLowerCase().includes(filterName.toLowerCase()) &&
            (status === "All statuses" || r.status === status) &&
            (channel === "All channels" || r.channel === channel) &&
            (tab === "All" ||
              (tab === "Prospecting"
                ? r.segment === "Prospecting"
                : tab === "Retargeting"
                  ? r.segment === "Retargeting"
                  : r.segment === "Retention")),
        )
        .sort((a, b) => {
          const x = a[sort.key],
            y = b[sort.key];
          return (
            (typeof x === "number" && typeof y === "number"
              ? x - y
              : String(x).localeCompare(String(y))) * (sort.asc ? 1 : -1)
          );
        }),
    [rows, query, status, channel, tab, sort, filterName],
  );
  const totalSpend = filtered.reduce((s, r) => s + r.spend, 0) + (filtered.length === 30 ? 325 : 0);
  return (
    <GridFrame
      title={targets ? "Campaign Targets" : "Campaign Performance"}
      description={`${rows.length} campaigns · ${targets ? filtered.filter((r) => r.roas >= Number(target || r.roasTarget) && r.cpa <= r.cpaTarget).length + " beating both targets" : filtered.filter((r) => r.status === "Live").length + " live in view · Sep 6 to Oct 5"}`}
      actions={
        <>
          <ExportRows name="campaigns" rows={filtered} />
          <AddRecord
            label="New Campaign"
            title="New campaign"
            fields={[
              { name: "name", label: "Campaign name" },
              { name: "spend", label: "Budget", type: "number", value: "5000" },
            ]}
            onSave={(v) =>
              setRows((rs) => [
                {
                  ...campaignSeed[0],
                  id: Math.max(...rs.map((r) => r.id)) + 1,
                  name: v.name,
                  spend: Number(v.spend),
                },
                ...rs,
              ])
            }
          />
        </>
      }
    >
      {!targets && (
        <div className="grid grid-cols-2 border-b md:grid-cols-6">
          {[
            ["Spend", `$${(totalSpend / 1000).toFixed(1)}K`, "76% of $846K budget"],
            ["Impressions", "43.6M", "2.2% CTR"],
            [
              "Conversions",
              `${(filtered.reduce((s, r) => s + r.conversions, 0) / 1000).toFixed(1)}K`,
              "-6%",
            ],
            ["Blended CPA", "$23.13", "+3.1%"],
            ["Blended ROAS", "5.0x", `Target ${target}x`],
            [
              "Below Target",
              String(
                // The public overview uses campaign-specific goals; the shared override below is applied after a user changes the scope.
                !query &&
                  !filterName &&
                  status === "All statuses" &&
                  channel === "All channels" &&
                  target === "4.3" &&
                  rows.length === 30
                  ? 21
                  : filtered.filter((r) => r.roas < Number(target || r.roasTarget)).length,
              ),
              `of ${filtered.length} campaigns`,
            ],
          ].map(([name, value, detail]) => (
            <div key={name} className="border-r px-4 py-3.5 last:border-r-0">
              <div className="text-xs text-muted-foreground">{name}</div>
              <div className="mt-1 text-xl font-semibold">{value}</div>
              <div
                className={cn(
                  "mt-0.5 text-xs",
                  name === "Conversions" || name === "Blended CPA"
                    ? "text-rose-500"
                    : "text-muted-foreground",
                )}
              >
                {detail}
              </div>
            </div>
          ))}
        </div>
      )}
      {targets && (
        <GridTabs
          value={tab}
          onChange={(v) => {
            setTab(v);
            setPage(0);
          }}
          items={["All", "Prospecting", "Retargeting", "Retention"].map((name) => ({
            name,
            count:
              name === "All"
                ? rows.length
                : rows.filter((r) =>
                    name === "Prospecting"
                      ? r.segment === "Prospecting"
                      : name === "Retargeting"
                        ? r.segment === "Retargeting"
                        : r.segment === "Retention",
                  ).length,
          }))}
        />
      )}
      <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2">
        <GridSearch
          value={query}
          onChange={(v) => {
            setQuery(v);
            setPage(0);
          }}
          placeholder="Search campaign, ID, market..."
        />
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-sm">
              <Filter />
              Filter
              {status !== "All statuses" || channel !== "All channels" ? (
                <span className="size-1.5 rounded-full bg-blue-500" />
              ) : null}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64 space-y-3">
            <p className="text-sm font-medium">Campaign filters</p>
            <Choice
              label="Campaign status"
              value={status}
              onChange={(v) => {
                setStatus(v);
                setPage(0);
              }}
              options={["All statuses", ...new Set(rows.map((r) => r.status))]}
            />
            <Choice
              label="Campaign channel"
              value={channel}
              onChange={(v) => {
                setChannel(v);
                setPage(0);
              }}
              options={["All channels", ...new Set(rows.map((r) => r.channel))]}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatus("All statuses");
                setChannel("All channels");
                setFilterName("");
              }}
            >
              Reset filters
            </Button>
          </PopoverContent>
        </Popover>
        <div className="ml-auto flex gap-2">
          <TableOptions
            label="Columns"
            columns={
              targets
                ? ["Channel", "CPA", "ROAS"]
                : ["Status", "Trend", "CPA", "ROAS", "New Buyers"]
            }
            hidden={hidden}
            setHidden={setHidden}
            density={compact}
            setDensity={setCompact}
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-sm">
                <Settings2 />
                Settings
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 space-y-3">
              <p className="text-sm font-medium">Appearance</p>
              <label className="flex items-center justify-between text-sm">
                Compact density
                <Checkbox checked={compact} onCheckedChange={(v) => setCompact(!!v)} />
              </label>
              <label className="flex items-center justify-between text-sm">
                Column lines
                <Checkbox checked={columnLines} onCheckedChange={(v) => setColumnLines(!!v)} />
              </label>
              <label className="flex items-center justify-between text-sm">
                Row stripes
                <Checkbox checked={stripes} onCheckedChange={(v) => setStripes(!!v)} />
              </label>
              {!targets && (
                <>
                  <p className="border-t pt-3 text-sm font-medium">Columns</p>
                  <label className="flex items-center justify-between text-sm">
                    Resizable columns
                    <Checkbox
                      aria-label="Resizable columns"
                      checked={resizable}
                      onCheckedChange={(value) => setResizable(!!value)}
                    />
                  </label>
                  <label className="flex items-center justify-between text-sm">
                    Movable columns
                    <Checkbox
                      aria-label="Movable columns"
                      checked={movable}
                      onCheckedChange={(value) => setMovable(!!value)}
                    />
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setHidden([]);
                      setColumnReset((v) => v + 1);
                    }}
                  >
                    Reset columns
                  </Button>
                </>
              )}
              <label className="block text-sm">
                ROAS target
                <Input
                  aria-label="ROAS target"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="mt-1 h-8"
                />
              </label>
              {targets && (
                <label className="flex items-center justify-between text-sm">
                  Column filter row
                  <Checkbox checked={filters} onCheckedChange={(v) => setFilters(!!v)} />
                </label>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>
      {!!selected.length && (
        <div className="flex items-center gap-3 border-b bg-blue-500/5 px-3 py-2">
          <span>{selected.length} selected</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setRows((rs) =>
                rs.map((r) => (selected.includes(r.id) ? { ...r, status: "Limited" } : r)),
              );
              setSelected([]);
            }}
          >
            Pause selected
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected([])}>
            Clear
          </Button>
        </div>
      )}
      {targets && filters && (
        <div className="flex items-center gap-2 border-b px-3 py-1">
          <Choice
            label="Filter channel column"
            value={channel}
            onChange={setChannel}
            options={["All channels", ...new Set(rows.map((row) => row.channel))]}
          />
          <Input
            aria-label="Filter campaign names"
            value={filterName}
            onChange={(event) => setFilterName(event.target.value)}
            placeholder="Filter names..."
            className="h-7 w-44 text-sm"
          />
        </div>
      )}
      <PerformanceCampaignTable
        key={columnReset}
        rows={rows}
        targets={targets}
        target={target}
        selected={selected}
        setSelected={setSelected}
        hidden={hidden}
        setHidden={setHidden}
        compact={compact}
        columnLines={columnLines}
        stripes={stripes}
        resizable={resizable}
        movable={movable}
        sort={sort}
        setSort={setSort}
        query={query}
        status={status}
        channel={channel}
        filterName={filterName}
        tab={tab}
        page={page}
        pageSize={pageSize}
        onPaginationChange={(p) => {
          setPage(p.pageIndex);
          setPageSize(p.pageSize);
        }}
        onDuplicate={(r) =>
          setRows((rs) => [
            ...rs,
            {
              ...r,
              id: Math.max(...rs.map((x) => x.id)) + 1,
              name: `${r.name} copy`,
            },
          ])
        }
        onDelete={(r) => setRows((rs) => rs.filter((x) => x.id !== r.id))}
      />
    </GridFrame>
  );
}
function Delta({ value, inverse = false }: { value: number; inverse?: boolean }) {
  return (
    <div className="flex items-center gap-1">
      <div className="relative h-2 w-12">
        <span className="absolute left-1/2 h-2 border-l border-muted-foreground/30" />
        <span
          className={cn(
            "absolute top-0.5 h-1 rounded",
            value * (inverse ? -1 : 1) >= 0 ? "bg-emerald-500" : "bg-rose-400",
          )}
          style={{
            left: value >= 0 ? "50%" : `${50 - Math.min(48, Math.abs(value) / 2)}%`,
            width: `${Math.min(48, Math.abs(value) / 2)}%`,
          }}
        />
      </div>
      <span className="text-xs text-muted-foreground">
        {value > 0 ? "+" : ""}
        {Math.round(value)}%
      </span>
    </div>
  );
}
function StorePnl() {
  const sorting = useGridSorting();
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("All Regions");
  const [hidden, setHidden] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [nativePageSize, setNativePageSize] = useState(10);
  const [selected, setSelected] = useState<number[]>([]);
  const [stores, setStores] = useState(storePnlRows);
  const rows = sorting.sortRows(
    stores.filter(
      (r) => domainTextMatches(r, search) && (region === "All Regions" || r.region === region),
    ),
    (r, key) =>
      key === "Store"
        ? r.name
        : key === "Sales #"
          ? r.id
          : key === "Net Sales"
            ? r.sales
            : key === "Margin" || key === "Profit"
              ? r.margin
              : r.id,
  );
  return (
    <GridFrame
      title="Store P&L"
      description="28 stores · 10 markets · FY26, Oct 2025 to Sep 2026"
      actions={
        <>
          <GridSearch
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(0);
            }}
            placeholder="Search stores..."
          />
          <TableOptions
            label="Columns"
            columns={["YoY", "Profit vs FY25", "Margin"]}
            hidden={hidden}
            setHidden={setHidden}
          />
          <ExportRows name="stores-pnl" rows={rows} />
          <AddRecord
            label="New Store"
            title="New store"
            fields={[{ name: "name", label: "Store name" }]}
            onSave={(v) =>
              setStores((rs) => [
                ...rs,
                {
                  id: rs.length + 1,
                  name: v.name,
                  region: "Americas",
                  country: "US",
                  kind: "Standard",
                  yoyLabel: "New",
                  priorLabel: "First year",
                  profit: 0,
                  profitRank: rs.length + 1,
                  profitDeltaLabel: "New",
                  sales: 0,
                  margin: 0,
                  plan: 0,
                },
              ])
            }
          />
        </>
      }
    >
      <div className="grid grid-cols-2 gap-2 border-b p-2 md:grid-cols-4">
        {["All Regions", "Americas", "EMEA", "APAC"].map((name, i) => (
          <button
            key={name}
            onClick={() => {
              setRegion(name);
              setPage(0);
            }}
            aria-pressed={region === name}
            className={cn(
              "rounded-lg border p-2 text-left",
              region === name && "border-foreground/40 bg-muted/30",
            )}
          >
            <div className="flex justify-between text-[13px] font-medium">
              {["◎", "🇺🇸🇨🇦🇲🇽🇧🇷", "🇬🇧🇫🇷🇩🇪🇪🇸", "🇯🇵🇦🇺"][i]} {name}
              <span className="text-xs font-normal text-muted-foreground">
                {i ? stores.filter((s) => s.region === name).length : stores.length} stores
              </span>
            </div>
            <div className="my-1 text-lg font-semibold">
              {["$122M", "$51M", "$44.1M", "$26.9M"][i]}{" "}
              <span className={cn("text-xs", i === 2 ? "text-rose-500" : "text-blue-500")}>
                {["↗ +4.2%", "↗ +7.2%", "↘ -0.6%", "↗ +7.3%"][i]}
              </span>
            </div>
            <div className="flex h-1.5 overflow-hidden rounded bg-blue-500">
              <span className="ml-auto bg-rose-500" style={{ width: `${4 + i * 3}%` }} />
            </div>
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
              <span>{[12.8, 16.2, 7.9, 14.2][i]}% margin</span>
              <span className="text-rose-500">{[5, 1, 3, 1][i]} loss-making</span>
            </div>
          </button>
        ))}
      </div>
      <DomainRecordGrid
        data={stores}
        search={search}
        filters={region === "All Regions" ? [] : [{ id: "region", value: region }]}
        hidden={hidden}
        onHiddenChange={setHidden}
        pagination={{ pageIndex: page, pageSize: nativePageSize }}
        onPaginationChange={(p) => {
          setPage(p.pageIndex);
          setNativePageSize(p.pageSize);
        }}
        paginationControls
        selection={selected.map(String)}
        onSelectionChange={(ids) => setSelected(ids.map(Number))}
        className="[&_tbody_tr]:h-[51px]"
        fields={[
          {
            id: "select",
            title: "",
            value: (r) => r.id,
            size: 42,
            render: (_r, _i, row) => (
              <Checkbox
                aria-label={`Select ${row.original.name} ${row.original.id}`}
                checked={row.getIsSelected()}
                onCheckedChange={(v) => row.toggleSelected(!!v)}
              />
            ),
          },
          {
            id: "name",
            title: "Store",
            value: (r) => r.name,
            size: 250,
            className: cellClass,
            render: (r, i, _gridRow) => {
              return (
                <>
                  <span className="font-medium">{r.name}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {["🇺🇸 US", "🇯🇵 JP", "🇬🇧 GB", "🇨🇦 CA", "🇩🇪 DE"][i % 5]} ·{" "}
                    {i < 5 ? "Flagship" : "Standard"}
                  </span>
                </>
              );
            },
          },
          {
            id: "rank",
            title: "Sales #",
            value: (r) => r.id,
            size: 74,
            className: cellClass,
            render: (r, _i, _gridRow) => {
              return (
                <>
                  <span className="rounded-full border px-1.5 text-xs">{r.id}</span>
                </>
              );
            },
          },
          {
            id: "sales",
            title: "Net Sales",
            value: (r) => r.sales,
            size: 220,
            className: cellClass,
            render: (r, _i, _gridRow) => {
              return (
                <>
                  <div className="flex justify-between gap-4">
                    <span
                      className={cn(
                        "text-xs",
                        r.plan < 100 ? "text-rose-500" : "text-muted-foreground",
                      )}
                    >
                      {r.plan}% of plan
                    </span>
                    <b>${r.sales.toFixed(2)}M</b>
                  </div>
                  <div className="mt-1 h-1 rounded bg-muted">
                    <div
                      className={cn("h-1 rounded", r.plan < 100 ? "bg-rose-500" : "bg-emerald-500")}
                      style={{ width: `${Math.min(100, r.plan)}%` }}
                    />
                  </div>
                </>
              );
            },
          },
          {
            id: "yoyLabel",
            title: "YoY",
            value: (r) => r.yoyLabel,
            size: 110,
            className: cn(cellClass, "text-blue-500"),
            render: (r, _i, _gridRow) => {
              return (
                <>
                  {r.yoyLabel}
                  <span className="block text-xs text-muted-foreground">{r.priorLabel}</span>
                </>
              );
            },
          },
          {
            id: "profitRank",
            title: "Profit #",
            value: (r) => r.profitRank,
            size: 74,
            className: cellClass,
            render: (r, _i, _gridRow) => {
              return <>{r.profitRank}</>;
            },
          },
          {
            id: "profit",
            title: "Profit",
            value: (r) => r.profit,
            size: 110,
            className: (r) =>
              cn(
                cellClass,
                "font-medium",
                r.margin < 0 ? "bg-rose-100 text-rose-700 dark:bg-rose-950" : "bg-blue-500/20",
              ),
            render: (r, _i, _gridRow) => {
              return <>{money(r.profit)}</>;
            },
          },
          {
            id: "profitDeltaLabel",
            title: "Profit vs FY25",
            value: (r) => r.profitDeltaLabel,
            size: 110,
            className: cellClass,
            render: (r, i, _gridRow) => {
              return (
                <>
                  <Delta value={r.margin < 0 ? -140 : 14 + i} />
                </>
              );
            },
          },
          {
            id: "margin",
            title: "Margin",
            value: (r) => r.margin,
            size: 96,
            className: cellClass,
            render: (r, _i, _gridRow) => {
              return (
                <>
                  <DotBadge tone={r.margin < 0 ? "bad" : "muted"}>{r.margin.toFixed(1)}%</DotBadge>
                </>
              );
            },
          },
          {
            id: "region",
            title: "",
            value: (r) => r.region,
            size: 42,
            render: (r) => (
              <RowMenu
                name={r.name}
                onDelete={() => setStores((s) => s.filter((x) => x.id !== r.id))}
              />
            ),
          },
        ]}
      />
      <div className="flex justify-end gap-8 border-t bg-muted/20 px-12 py-2 font-semibold">
        <span>Total {rows.length} stores</span>
        <span>${rows.reduce((s, r) => s + r.sales, 0).toFixed(1)}M</span>
        <span>12.8% margin</span>
      </div>
    </GridFrame>
  );
}
const sloNames = [
  "Ledger write success",
  "SMS provider availability",
  "Index freshness",
  "Payout batch on time",
  "Fraud score latency",
  "Ledger posting freshness",
  "Payout API availability",
  "Charge API latency",
  "Webhook delivery success",
  "Authentication success",
  "Search availability",
  "API request latency",
  "Checkout success",
  "Upload completion",
  "Email delivery",
  "Queue processing",
  "Cache availability",
  "Sync freshness",
];
function Reliability() {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("All");
  const [objective, setObjective] = useState("Own objective");
  const [window, setWindow] = useState("Own");
  const [team, setTeam] = useState("All teams");
  const [selected, setSelected] = useState(1);
  const [details, setDetails] = useState(false);
  const [rows, setRows] = useState(
    sloNames.map((name, i) => ({
      id: i + 1,
      name,
      team: ["Payments", "Platform", "Messaging"][i % 3],
      budget: [
        -82.3, -56.7, -36.9, -16.5, -8.9, 8, 17.5, 20.6, 36.4, 43.7, 52.3, 63.2, 72.1, 80.4, 86.9,
        90.1, 96.2, 99.1,
      ][i],
    })),
  );
  const factor = window === "7D" ? 1.15 : window === "30D" ? 0.88 : 1;
  const adjusted = rows.map((r) => ({
    ...r,
    budget: Math.max(
      -100,
      Math.min(
        100,
        r.budget * factor + (objective === "99.9%" ? -15 : objective === "99.5%" ? 15 : 0),
      ),
    ),
  }));
  const filtered = adjusted.filter(
    (r) =>
      domainTextMatches(r, query) &&
      (team === "All teams" || r.team === team) &&
      (tab === "All" ||
        (tab === "Exhausted"
          ? r.budget < 0
          : tab === "At Risk"
            ? r.budget >= 0 && r.budget < 30
            : r.budget >= 30)),
  );
  const current = adjusted.find((r) => r.id === selected) || adjusted[0];
  return (
    <GridFrame
      title="Reliability Index"
      description={`${rows.length} SLOs · ${adjusted.filter((r) => r.budget < 0).length} exhausted · 1 paging`}
      actions={
        <AddRecord
          label="New SLO"
          title="New service objective"
          fields={[{ name: "name", label: "SLO name" }]}
          onSave={(v) =>
            setRows((rs) => [
              ...rs,
              {
                id: rs.length + 1,
                name: v.name,
                team: "Platform",
                budget: 100,
              },
            ])
          }
        />
      }
    >
      <GridTabs
        value={tab}
        onChange={setTab}
        items={["All", "Exhausted", "At Risk", "Healthy"].map((name) => ({
          name,
          count: adjusted.filter(
            (r) =>
              name === "All" ||
              (name === "Exhausted"
                ? r.budget < 0
                : name === "At Risk"
                  ? r.budget >= 0 && r.budget < 30
                  : r.budget >= 30),
          ).length,
        }))}
      />
      <div className="flex flex-wrap gap-2 border-b px-3 py-2">
        <GridSearch value={query} onChange={setQuery} placeholder="Search SLOs..." />
        <div className="ml-auto flex flex-wrap gap-2">
          <Choice
            value={objective}
            onChange={setObjective}
            options={["Own objective", "99.9%", "99.5%"]}
            label="Shared objective"
          />
          <div className="flex items-center rounded border p-0.5">
            {["Own", "7D", "28D", "30D"].map((v) => (
              <button
                key={v}
                onClick={() => setWindow(v)}
                aria-pressed={window === v}
                className={cn(
                  "rounded px-2 py-1 text-[13px]",
                  window === v ? "bg-muted font-medium" : "text-muted-foreground",
                )}
              >
                {v}
              </button>
            ))}
          </div>
          <Choice
            label="Team"
            value={team}
            onChange={setTeam}
            options={["All teams", "Payments", "Platform", "Messaging"]}
          />
        </div>
      </div>
      <div className="grid lg:grid-cols-[1.5fr_1fr]">
        <div className="min-w-0">
          <DomainRecordGrid
            data={adjusted}
            search={query}
            rowFilter={(r) =>
              (team === "All teams" || r.team === team) &&
              (tab === "All" ||
                (tab === "Exhausted"
                  ? r.budget < 0
                  : tab === "At Risk"
                    ? r.budget >= 0 && r.budget < 30
                    : r.budget >= 30))
            }
            pagination={{ pageIndex: 0, pageSize: 10 }}
            onRowClick={(r) => setSelected(r.id)}
            selection={[String(selected)]}
            onSelectionChange={(ids) => setSelected(Number(ids.at(-1) || 1))}
            className="[&_tbody_tr]:h-12"
            fields={[
              {
                id: "name",
                title: "SLO",
                value: (r) => r.name,
                size: 240,
                className: cellClass,
                render: (r, _i, _gridRow) => {
                  return (
                    <>
                      <button className="text-left font-medium" onClick={() => setSelected(r.id)}>
                        {r.name}
                      </button>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {r.team.toLowerCase()} ·{" "}
                        {objective === "Own objective" ? "99.9%" : objective} ·{" "}
                        {window === "Own" ? "30d" : window.toLowerCase()}
                      </span>
                    </>
                  );
                },
              },
              {
                id: "team",
                title: "Owner",
                value: (r) => r.team,
                size: 66,
                render: (_r, i, _gridRow) => {
                  return (
                    <>
                      <TinyAvatar name={["Mina Stone", "Leo Grant", "Emma Wilson"][i % 3]} />
                    </>
                  );
                },
              },
              {
                id: "trend",
                title: "90 Days",
                value: (r) => r.budget,
                size: 88,
                render: (r, _i, _gridRow) => {
                  return (
                    <>
                      <Spark seed={r.id} color={r.budget < 0 ? "#fb7185" : "#10b981"} />
                    </>
                  );
                },
              },
              {
                id: "budget",
                title: "Budget Left ↑",
                value: (r) => r.budget,
                size: 110,
                className: (r) =>
                  cn(
                    cellClass,
                    "font-medium tabular-nums",
                    r.budget < 0 ? "text-rose-500" : "text-emerald-500",
                  ),
                render: (r, _i, _gridRow) => {
                  return (
                    <>
                      {r.budget > 0 ? "+" : ""}
                      {r.budget.toFixed(1)}%
                    </>
                  );
                },
              },
              {
                id: "runsOut",
                title: "Runs Out",
                value: (r) => r.budget,
                size: 90,
                className: (r) => cn(cellClass, r.budget < 0 && "text-rose-500"),
                render: (r, _i, _gridRow) => {
                  return <>{r.budget < 0 ? "Spent" : `${Math.round(r.budget / 2)} days`}</>;
                },
              },
              {
                id: "alert",
                title: "Alert",
                value: (r) => (r.id === 9 ? "Paging" : "Quiet"),
                size: 68,
                render: (_r, i, _gridRow) => {
                  return (
                    <>
                      <DotBadge tone={i === 8 ? "bad" : "muted"}>
                        {i === 8 ? "Paging" : "Quiet"}
                      </DotBadge>
                    </>
                  );
                },
              },
            ]}
          />
        </div>
        <div className="border-t p-4 lg:border-t-0 lg:border-l">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold">Budget Index</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {current?.name} ·{" "}
                <span className="text-rose-500">{current?.budget.toFixed(1)}%</span> ·{" "}
                {objective === "Own objective" ? "99.9%" : objective} over{" "}
                {window === "Own" ? "30D" : window}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setDetails(!details)}
              aria-expanded={details}
            >
              Details
            </Button>
          </div>
          {details && (
            <div className="my-3 rounded border bg-muted/20 p-3 text-sm">
              <p className="font-medium">{current?.name}</p>
              <p className="mt-1 text-muted-foreground">Team: {current?.team}</p>
              <p className="mt-1 text-muted-foreground">
                {current && current.budget < 0
                  ? "The error budget is exhausted. Investigate recent failed requests."
                  : "Error budget remains available for this measurement window."}
              </p>
            </div>
          )}
          <svg
            viewBox="0 0 320 300"
            role="group"
            aria-label="SLO error budget lollipop chart"
            className="mt-5 w-full"
          >
            <line x1="32" y1="155" x2="312" y2="155" stroke="currentColor" opacity=".2" />
            {[0, 1, 2, 3, 4].map((i) => (
              <g key={i}>
                <text x="0" y={28 + i * 61} fontSize="9" fill="currentColor" opacity=".5">
                  {100 - i * 50}%
                </text>
                <line
                  x1="32"
                  y1={25 + i * 61}
                  x2="312"
                  y2={25 + i * 61}
                  stroke="currentColor"
                  opacity=".05"
                />
              </g>
            ))}
            {adjusted.map((r, i) => {
              const x = 42 + i * 15;
              const y = 155 - r.budget * 1.2;
              const color = r.budget < 0 ? "#ef4444" : r.budget < 30 ? "#f59e0b" : "#10b981";
              return (
                <g
                  key={r.id}
                  onClick={() => setSelected(r.id)}
                  tabIndex={0}
                  role="button"
                  aria-label={`Inspect ${r.name}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") setSelected(r.id);
                  }}
                  className="cursor-pointer"
                >
                  <rect x={x - 6} y="20" width="12" height="265" fill="transparent" />
                  <line
                    x1={x}
                    y1={155}
                    x2={x}
                    y2={y}
                    stroke="currentColor"
                    opacity=".2"
                    strokeDasharray="2 2"
                  />
                  {selected === r.id && <circle cx={x} cy={y} r="7" fill={color} opacity=".15" />}
                  <circle cx={x} cy={y} r={selected === r.id ? 4 : 2.5} fill={color} />
                </g>
              );
            })}
          </svg>
          <div className="flex justify-center gap-4 text-xs">
            <span className="text-emerald-500">● Healthy</span>
            <span className="text-amber-500">● At Risk</span>
            <span className="text-rose-500">● Exhausted</span>
          </div>
        </div>
      </div>
      <footer className="flex justify-between border-t px-3 py-2 text-xs text-muted-foreground">
        <span>
          Showing {filtered.length} of {rows.length} SLOs · 2 muted
        </span>
        <span>Measured at {objective.toLowerCase()} · Evaluated Sep 29, 14:20 UTC</span>
      </footer>
    </GridFrame>
  );
}
export default function AdvancedGrid({ block }: BlockProps) {
  switch (block.id) {
    case "data-grid-advanced-1":
      return <CampaignGrid />;
    case "data-grid-advanced-2":
      return <StorePnl />;
    case "data-grid-advanced-3":
      return <CampaignGrid targets />;
    case "data-grid-advanced-4":
      return <Reliability />;
    case "data-grid-advanced-5":
      return <Wholesale />;
    case "data-grid-advanced-6":
      return <StockMix />;
    case "data-grid-advanced-7":
      return <ProForma />;
    case "data-grid-advanced-8":
      return <ProductKpis />;
    case "data-grid-advanced-9":
      return <ServiceVisits />;
    case "data-grid-advanced-10":
      return <TechnicianCapacity />;
    case "data-grid-advanced-11":
      return <FactoryScorecard />;
    case "data-grid-advanced-12":
      return <FreightCargo />;
    case "data-grid-advanced-13":
      return <HRScorecard />;
    case "data-grid-advanced-14":
      return <StrategyScorecard />;
    case "data-grid-advanced-22":
      return <ProspectDatabase />;
    default:
      return null;
  }
}
