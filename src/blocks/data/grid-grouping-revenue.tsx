import { Badge } from "@/components/reui/badge";
import {
  DataGridTableFootRow,
  DataGridTableFootRowCell,
} from "@/components/reui/data-grid/data-grid-table";
import { CalendarDays, Globe, TrendingDown, TrendingUp } from "lucide-react";
import { useState } from "react";
import { DomainGroupedGrid } from "./grid-advanced-group-model";
import { domainTextMatches, type DomainField } from "./grid-advanced-model-grid";
import {
  Button,
  Choice,
  ExportRows,
  GridFrame,
  GridSearch,
  RowMenu,
  TableOptions,
  TinyAvatar,
} from "./grid-advanced-shared";
import { cn, money } from "./grid-advanced-utils";

type Health = "Healthy" | "Watch" | "At Risk";
type Region = "North America" | "EMEA" | "APAC" | "LATAM";
type Account = {
  id: number;
  name: string;
  region: Region;
  owner: string;
  health: Health;
  arr: number;
  nrr: number;
  renewal: string;
};

const regions: { id: Region; description: string }[] = [
  { id: "North America", description: "US and Canada strategic accounts" },
  { id: "EMEA", description: "Europe, Middle East, and Africa book" },
  { id: "APAC", description: "Asia Pacific growth territory" },
  { id: "LATAM", description: "Latin America emerging accounts" },
];

// Account attributes transcribed from the public rendered preview, never paid source.
// Dates and identity-based artwork remain stable when native filters or sorting change.
const accountSeeds: [string, Region, string, Health, number, number, string][] = [
  ["Northwind Trading", "North America", "Rina Holt", "Healthy", 920000, 124, "2026-09-14"],
  ["Cedar Health Systems", "North America", "Evren Blake", "Watch", 760000, 103, "2026-07-02"],
  ["Vantage Robotics", "North America", "Rina Holt", "Healthy", 410000, 118, "2026-11-21"],
  ["Brightline Media", "North America", "Mina Rowe", "At Risk", 285000, 92, "2026-06-30"],
  ["Summit Analytics", "North America", "Evren Blake", "Healthy", 138000, 129, "2026-10-09"],
  ["Banyan AgriTech", "North America", "Sora Min", "Healthy", 124000, 132, "2026-11-12"],
  ["Andes Fintech", "North America", "Noor Albright", "Healthy", 268000, 122, "2026-10-30"],
  ["Helvetia Pay", "EMEA", "Vale Aksoy", "Healthy", 845000, 121, "2026-08-18"],
  ["Nordwind Energy", "EMEA", "Noor Albright", "Watch", 690000, 99, "2026-07-27"],
  ["Albion Retail Group", "EMEA", "Vale Aksoy", "At Risk", 320000, 88, "2026-06-24"],
  ["Lumen Telecom", "EMEA", "Noor Albright", "Healthy", 455000, 115, "2026-12-03"],
  ["Castellan Bank", "EMEA", "Vale Aksoy", "Healthy", 980000, 109, "2026-09-30"],
  ["Tucan Media", "EMEA", "Noor Albright", "Healthy", 205000, 113, "2026-09-19"],
  ["Sakura Mobility", "APAC", "Sora Min", "Healthy", 372000, 126, "2026-10-22"],
  ["Pacific Cloud", "APAC", "Mina Rowe", "Watch", 615000, 101, "2026-08-05"],
  ["Meridian Shipping", "APAC", "Mina Rowe", "At Risk", 298000, 90, "2026-06-27"],
  ["Hanwoo Foods", "APAC", "Sora Min", "Healthy", 340000, 112, "2026-09-08"],
  ["Costera Travel", "LATAM", "Rina Holt", "Watch", 96000, 104, "2026-07-15"],
  ["Verde Logistics", "LATAM", "Evren Blake", "Healthy", 312000, 117, "2026-12-09"],
  ["Pampa Retail", "LATAM", "Sora Min", "At Risk", 142000, 89, "2026-06-22"],
];
const initialAccounts: Account[] = accountSeeds.map(
  ([name, region, owner, health, arr, nrr, renewal], index) => ({
    id: index + 1,
    name,
    region,
    owner,
    health,
    arr,
    nrr,
    renewal,
  }),
);
const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function displayDate(date: string) {
  return dateFormat.format(new Date(`${date}T00:00:00Z`));
}

function summarize(accounts: Account[]) {
  const arr = accounts.reduce((total, account) => total + account.arr, 0);
  return {
    count: accounts.length,
    arr,
    nrr: arr
      ? Math.round(accounts.reduce((total, account) => total + account.arr * account.nrr, 0) / arr)
      : null,
    renewal: accounts.reduce<string | null>(
      (earliest, account) =>
        earliest === null || account.renewal < earliest ? account.renewal : earliest,
      null,
    ),
  };
}

function Retention({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted-foreground">—</span>;
  const growing = value >= 100;
  const Trend = growing ? TrendingUp : TrendingDown;
  return (
    <span
      className={cn(
        "inline-flex items-center justify-end gap-1 tabular-nums",
        growing ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
      )}
    >
      <Trend className="size-3.5" aria-hidden="true" />
      {value}%
    </span>
  );
}

function HealthBadge({ health }: { health: Health }) {
  return (
    <Badge
      variant={
        health === "Healthy"
          ? "success-light"
          : health === "Watch"
            ? "warning-light"
            : "destructive-light"
      }
      className="h-5 font-normal"
    >
      {health}
    </Badge>
  );
}

export default function Revenue() {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [query, setQuery] = useState("");
  const [health, setHealth] = useState("All health");
  const [collapsed, setCollapsed] = useState<string[]>(["EMEA", "APAC", "LATAM"]);
  const [hidden, setHidden] = useState<string[]>([]);
  const [compact, setCompact] = useState(false);
  const matchesHealth = (account: Account) => health === "All health" || account.health === health;
  // The native model receives all raw records; this identical predicate only derives summaries/CSV.
  const filtered = accounts.filter(
    (account) => domainTextMatches(account, query) && matchesHealth(account),
  );
  const total = summarize(accounts);
  const visible = summarize(filtered);
  const atRiskArr = accounts
    .filter((account) => account.health === "At Risk")
    .reduce((sum, account) => sum + account.arr, 0);
  const groupSummaries = new Map(
    regions.map((region) => [
      region.id,
      summarize(filtered.filter((account) => account.region === region.id)),
    ]),
  );
  const fields: DomainField<Account>[] = [
    {
      id: "name",
      title: "Account",
      value: (account) => account.name,
      size: 270,
      className: "whitespace-nowrap px-4",
      render: (account) => (
        <div className="flex items-center gap-3 pl-8">
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-[10px] border text-xs font-medium",
              [
                "border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300",
                "border-violet-200 bg-violet-100 text-violet-700 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-300",
                "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
                "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300",
                "border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300",
                "border-cyan-200 bg-cyan-100 text-cyan-700 dark:border-cyan-800 dark:bg-cyan-950 dark:text-cyan-300",
              ][(account.id - 1) % 6],
            )}
            aria-hidden="true"
          >
            {account.name
              .split(" ")
              .map((part) => part[0])
              .slice(0, 2)
              .join("")}
          </span>
          <span className="font-medium">{account.name}</span>
        </div>
      ),
    },
    {
      id: "owner",
      title: "Owner",
      value: (account) => account.owner,
      size: 215,
      className: "whitespace-nowrap px-4",
      render: (account) => (
        <span className="inline-flex items-center gap-2">
          <TinyAvatar name={account.owner} />
          {account.owner}
        </span>
      ),
    },
    {
      id: "health",
      title: "Health",
      value: (account) => account.health,
      size: 110,
      className: "px-4",
      render: (account) => <HealthBadge health={account.health} />,
    },
    {
      id: "arr",
      title: "ARR",
      value: (account) => account.arr,
      size: 190,
      className: "px-4 text-right font-medium tabular-nums",
      render: (account) => money(account.arr),
    },
    {
      id: "nrr",
      title: "NRR",
      value: (account) => account.nrr,
      size: 135,
      className: "px-4 text-right",
      render: (account) => <Retention value={account.nrr} />,
    },
    {
      id: "renewal",
      title: "Renewal",
      value: (account) => account.renewal,
      size: 210,
      className: "px-4 text-right",
      render: (account) => (
        <Badge variant="outline" className="h-5 gap-1 font-normal">
          <CalendarDays className="size-3 text-muted-foreground" aria-hidden="true" />
          <time dateTime={account.renewal}>{displayDate(account.renewal)}</time>
        </Badge>
      ),
    },
    {
      id: "actions",
      title: "",
      value: (account) => account.id,
      size: 48,
      className: "px-2 text-right",
      render: (account) => (
        <RowMenu
          name={account.name}
          onDelete={() => setAccounts((rows) => rows.filter((row) => row.id !== account.id))}
        />
      ),
    },
  ];

  return (
    <GridFrame
      title="Revenue By Region"
      description="Net retention and renewals across the book."
      className="mt-8 max-sm:mt-12 max-sm:w-[calc(100%-72px)] [&_header]:gap-4 [&_header]:px-4 [&_header]:py-3.5 [&_header_p]:text-sm [&_header_p]:leading-5 max-sm:[&_header>div:last-child]:items-end"
      summary={
        <div className="flex flex-wrap items-center gap-x-3 gap-y-4 text-xs text-muted-foreground max-sm:flex-col max-sm:items-start">
          <span className="inline-flex items-center gap-2 sm:border-r sm:pr-3">
            Total ARR
            <Badge variant="outline" className="h-5 font-medium text-foreground">
              ${(total.arr / 1000000).toFixed(2)}M
            </Badge>
          </span>
          <span className="inline-flex items-center gap-2 sm:border-r sm:pr-3">
            Portfolio NRR
            <Badge variant="success-light" className="h-5 font-normal">
              {total.nrr === null ? "—" : `${total.nrr}%`}
            </Badge>
          </span>
          <span className="inline-flex items-center gap-2">
            At-Risk ARR
            <Badge variant="destructive-light" className="h-5 font-normal">
              ${(atRiskArr / 1000000).toFixed(2)}M
            </Badge>
          </span>
        </div>
      }
      actions={<ExportRows name="revenue-by-region" rows={filtered} />}
    >
      <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
        <div className="min-w-0 flex-1 basis-full sm:basis-auto">
          <GridSearch value={query} onChange={setQuery} placeholder="Search accounts..." />
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          <Choice
            label="Account health"
            value={health}
            onChange={setHealth}
            options={["All health", "Healthy", "Watch", "At Risk"]}
            labels={{ "All health": "Health" }}
            className="min-w-0"
          />
          <TableOptions
            columns={["Owner", "Health", "NRR", "Renewal"]}
            hidden={hidden}
            setHidden={setHidden}
            density={compact}
            setDensity={setCompact}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => setCollapsed(collapsed.length ? [] : regions.map((region) => region.id))}
          >
            {collapsed.length ? "Expand all" : "Collapse all"}
          </Button>
        </div>
      </div>
      <DomainGroupedGrid
        groups={regions.map((region) => ({
          ...region,
          title: region.id,
          children: accounts.filter((account) => account.region === region.id),
        }))}
        fields={fields}
        getId={(account) => String(account.id)}
        search={query}
        filter={matchesHealth}
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        hidden={hidden}
        onHiddenChange={setHidden}
        className={cn(
          "[&_thead_tr]:h-10 [&_thead_th]:px-4 [&_tbody_tr]:h-11",
          compact ? "[&_tbody_tr]:h-9 [&_tbody_td]:py-1" : "[&_tbody_tr]:h-[45px]",
        )}
        renderGroup={(group) => (
          <>
            <Globe className="size-3.5 text-muted-foreground" aria-hidden="true" />
            <span className="font-semibold">{group.title}</span>
            <Badge variant="outline" className="h-5 min-w-5 bg-background font-normal">
              {groupSummaries.get(group.id as Region)?.count ?? 0}
            </Badge>
          </>
        )}
        groupValue={(group, key) => {
          const summary = groupSummaries.get(group.id as Region);
          if (!summary) return null;
          if (key === "owner") {
            return (
              <span className="whitespace-nowrap text-muted-foreground">{group.description}</span>
            );
          }
          if (key === "arr") return <span className="font-semibold">{money(summary.arr)}</span>;
          if (key === "nrr") return <Retention value={summary.nrr} />;
          if (key === "renewal" && summary.renewal) {
            return (
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-muted-foreground">Next</span>
                <time dateTime={summary.renewal}>{displayDate(summary.renewal)}</time>
              </span>
            );
          }
          return null;
        }}
        footer={
          <DataGridTableFootRow>
            {fields
              .filter((field) => !hidden.includes(field.title))
              .map((field) => (
                <DataGridTableFootRowCell
                  key={field.id}
                  className={cn(
                    "bg-muted/30 px-4",
                    typeof field.className === "string" ? field.className : undefined,
                  )}
                >
                  {field.id === "name" ? (
                    <span className="inline-flex items-center gap-2 font-semibold">
                      All Regions
                      <Badge variant="outline" className="h-5 font-normal">
                        {visible.count}
                      </Badge>
                    </span>
                  ) : field.id === "arr" ? (
                    <span className="font-semibold">{money(visible.arr)}</span>
                  ) : field.id === "nrr" ? (
                    <Retention value={visible.nrr} />
                  ) : null}
                </DataGridTableFootRowCell>
              ))}
          </DataGridTableFootRow>
        }
      />
    </GridFrame>
  );
}
