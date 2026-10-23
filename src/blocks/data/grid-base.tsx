import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Ellipsis,
  PinOff,
  Plus,
} from "lucide-react";
import type { BlockProps } from "@/data/types";
import { Button } from "@/components/ui/button";
import {
  DataGridTableFootRow,
  DataGridTableFootRowCell,
} from "@/components/reui/data-grid/data-grid-table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  useGridTable,
  useGridDisplay,
  selectionColumn,
  pinColumn,
  NativeGrid,
  NativeTable,
  NativePager,
  NativeColumns,
  NativeSettings,
  type GridColumn,
} from "./grid-base-engine";
import { downloadCsv } from "./data-utils";
import {
  FilterBar,
  firstRule,
  matchesRules,
  type FilterField,
  type FilterRule,
} from "./grid-filter-controls";
import {
  Frame,
  Toolbar,
  SearchBox,
  Identity,
  Chip,
  Meter,
  Ring,
  Facet,
  RowMenu,
  CreateDialog,
  ClearFilters,
  BrandMark,
} from "./grid-base-common";

type RecordRow = {
  id: number;
  name: string;
  detail: string;
  company: string;
  role: string;
  location: string;
  status: string;
  amount: number;
  score: number;
  extra: string[];
};
const names = [
  "Alex Johnson",
  "Aron Thompson",
  "David Kim",
  "Emma Wilson",
  "James Brown",
  "Lena Foster",
  "Mia Chen",
  "Noah Davis",
  "Olivia Reed",
  "Sam Taylor",
  "Theo Park",
  "Zoe Patel",
];
const companyNames = [
  "Anthropic",
  "Supabase",
  "Stripe",
  "Convex",
  "Mintlify",
  "Linear",
  "Notion",
  "Vercel",
  "Figma",
  "Resend",
  "Prisma",
  "Neon",
];
const roles = ["CEO", "Director", "Lawyer", "Developer", "Product Manager", "Designer"];
const statuses = ["Active", "Pending", "Active", "Inactive", "Inactive"];
const balances = [
  5143.03, 6214.22, 9876.54, 3456.45, 5321.77, 7620, 4320, 1950, 16080, 8450, 3200, 11890,
];
function seed(kind: number): RecordRow[] {
  if (kind === 2)
    return [
      "Theresa Webb",
      "Cameron Williamson",
      "Annette Black",
      "Bessie Cooper",
      "Brooklyn Simmons",
      "Cody Fisher",
      "Darrell Steward",
      "Dianne Russell",
      "Eleanor Pena",
      "Esther Howard",
      "Floyd Miles",
      "Guy Hawkins",
      "Jacob Jones",
      "Jane Cooper",
      "Jenny Wilson",
      "Jerome Bell",
      "Kathryn Murphy",
      "Kristin Watson",
      "Leslie Alexander",
      "Marvin McKinney",
      "Ralph Edwards",
      "Robert Fox",
    ].map((name, i) => ({
      id: i + 1,
      name,
      detail: `${name.split(" ")[0].toLowerCase()}@${["stripe.com", "mintlify.com", "slack.com", "modelcontextprotocol.io", "paypal.com", "zoom.us"][i % 6]}`,
      company: ["Stripe", "Mintlify", "Slack", "Model Context Protocol", "PayPal", "Zoom"][i % 6],
      role: "",
      location: "",
      status: i === 4 ? "Churned" : "Active",
      amount: [48500, 62300, 67800, 41200, 0, 38900][i % 6],
      score: [92, 93, 81, 84, 12, 55][i % 6],
      extra: [
        ["E-commerce", "Enterprise"],
        ["P2P", "AI", "Developer tools"],
        ["Automation", "Digital", "Enterprise"],
        ["AI", "E-commerce", "Developer tools"],
        ["E-commerce"],
        ["Digital", "Enterprise", "Automation"],
      ][i % 6],
    }));
  if (kind === 3)
    return [
      "Annual Service Renewal",
      "Enterprise Upgrade",
      "Enterprise Upgrade",
      "New Product Launch",
      "Enterprise Upgrade",
      "Expansion Pilot",
      "Annual Platform Renewal",
      "Analytics Rollout",
      "Workspace Expansion",
      "Infrastructure Upgrade",
    ].map((name, i) => ({
      id: i + 1,
      name,
      detail: [
        "Orbit Stack",
        "Northstar Health",
        "Stackpoint Cloud",
        "Forge Systems",
        "Altura Finance",
        "Linear",
        "Vercel",
        "Figma",
        "Neon",
        "Prisma",
      ][i],
      company: "",
      role: ["Rebecca Lee", "Sarah Jones", "John Martin", "John Martin", "Tom Carter"][i % 5],
      location: "",
      status: [
        "Won",
        "Proposal Sent",
        "Negotiation",
        "Proposal Sent",
        "Proposal Sent",
        "Discovery",
      ][i % 6],
      amount: [150000, 70000, 72000, 63000, 56000, 48000][i % 6],
      score: [25, 56, 57, 63, 80, 32][i % 6],
      extra: [],
    }));
  return names.map((name, i) => ({
    id: i + 1,
    name,
    detail: `${name.split(" ")[0].toLowerCase()}@${companyNames[i].toLowerCase()}.${i === 3 ? "dev" : "com"}`,
    company: companyNames[i],
    role: roles[i % 6],
    location: ["United States", "Malaysia", "Germany", "Australia", "Spain", "United Kingdom"][
      i % 6
    ],
    status: statuses[i % 5],
    amount: balances[i],
    score: [5.2, 1.2, 12.7, 0.8, -0.4, 6.2][i % 6],
    extra: [
      ["Executive", "GTM", "Legal · Counsel", "Platform · IC3", "Product", "Design"][i % 6],
      ["PST (UTC−8)", "MYT (UTC+8)", "CET (UTC+1)", "AEDT (UTC+11)", "CET (UTC+1)", "GMT (UTC+0)"][
        i % 6
      ],
    ],
  }));
}
const usd = (n: number, digits = 0) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
function Spark({ id }: { id: number }) {
  return (
    <svg viewBox="0 0 88 28" className="h-7 w-20" aria-label="Stock trend">
      <path
        d={
          id % 2
            ? "M1 8 C9 36 15 29 24 12 S37 4 43 19 S53 33 60 15 S73 27 87 7"
            : "M1 20 C9 31 15 27 25 4 S41 31 49 20 S59 4 68 10 S80 2 87 17"
        }
        fill="none"
        stroke={id % 3 === 0 ? "#ef4444" : "#10b981"}
        strokeWidth="1.4"
      />
    </svg>
  );
}
function CrmGrid({ kind }: { kind: number }) {
  const [rows, setRows] = useState(() => seed(kind));
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<string[]>([]);
  const [rules, setRules] = useState<FilterRule[]>([firstRule("name")]);
  const [create, setCreate] = useState(false);
  const display = useGridDisplay();
  const title = kind === 1 ? "Customers" : kind === 2 ? "Contacts" : "Opportunities";
  const singular = kind === 1 ? "customer" : kind === 2 ? "contact" : "opportunity";
  const cols = useMemo(
    () =>
      kind === 1
        ? ["Customer", "Company", "Role", "Location", "Balance ($)", "Status"]
        : kind === 2
          ? ["Contact", "Company", "Category", "Score", "Stock", "Amount", "Status"]
          : ["Opportunity", "Stage", "Owner", "Amount", "Progress", "Alerts"],
    [kind],
  );
  function cell(r: RecordRow, col: string): ReactNode {
    if (col === "Customer" || col === "Contact" || col === "Opportunity")
      return kind === 3 ? (
        <div>
          <p className="font-medium">{r.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">{r.detail}</p>
        </div>
      ) : (
        <Identity name={r.name} detail={r.detail} online={r.id % 3 !== 2} photo={kind !== 1} />
      );
    if (col === "Company")
      return (
        <span className="inline-flex items-center gap-1.5 font-medium">
          <BrandMark name={r.company} />
          {r.company}
        </span>
      );
    if (col === "Role" || col === "Location")
      return (
        <div>
          {col === "Role" ? r.role : r.location}
          <p className="mt-1 text-xs text-muted-foreground">{r.extra[col === "Role" ? 0 : 1]}</p>
        </div>
      );
    if (col === "Balance ($)")
      return (
        <div className="tabular-nums">
          {usd(r.amount, 2)}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "mt-0.5 flex items-center gap-1 text-xs",
                  r.score < 0 ? "text-rose-500" : "text-emerald-500",
                )}
              >
                {r.score < 0 ? (
                  <ArrowDownRight className="size-3" />
                ) : (
                  <ArrowUpRight className="size-3" />
                )}
                {Math.abs(r.score)}%
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-60 text-xs">
              {r.score < 0
                ? "Includes refunds and chargebacks."
                : "Balance increased from the prior statement period."}
            </PopoverContent>
          </Popover>
        </div>
      );
    if (col === "Status" || col === "Stage") return <Chip>{r.status}</Chip>;
    if (col === "Category")
      return (
        <div className="flex max-w-52 flex-wrap gap-1">
          {r.extra.map((v) => (
            <Chip key={v}>{v}</Chip>
          ))}
        </div>
      );
    if (col === "Score" || col === "Progress") return <Meter value={r.score} />;
    if (col === "Stock") return <Spark id={r.id} />;
    if (col === "Amount")
      return <span className="font-medium tabular-nums">{usd(r.amount, kind === 2 ? 2 : 0)}</span>;
    if (col === "Owner") return <Identity name={r.role} compact />;
    return r.id % 3 === 2 ? (
      <span className="text-muted-foreground">None</span>
    ) : (
      <Chip color="amber">{(r.id % 3) + 1}</Chip>
    );
  }
  const columnFields = useMemo<GridColumn<RecordRow>[]>(
    () => [
      kind === 1 ? selectionColumn<RecordRow>() : pinColumn<RecordRow>(),
      ...cols.map((col, i) => ({
        id: col,
        value: (r: RecordRow) =>
          i === 0
            ? r.name
            : col === "Company"
              ? r.company
              : col === "Role" || col === "Owner"
                ? r.role
                : col === "Location"
                  ? r.location
                  : col === "Balance ($)" || col === "Amount"
                    ? r.amount
                    : col === "Score" || col === "Progress" || col === "Stock"
                      ? r.score
                      : col === "Category"
                        ? r.extra.join(", ")
                        : r.status,
        cell: (r: RecordRow) => cell(r, col),
        width:
          i === 0
            ? 350
            : col === "Category"
              ? 220
              : col === "Location" || col === "Role"
                ? 160
                : 150,
        hideable: i !== 0,
      })),
      {
        id: "_actions",
        width: 42,
        minWidth: 42,
        cell: (r, row) => (
          <RowMenu
            name={r.name}
            onPin={() => row.pin(row.getIsPinned() ? false : "top")}
            onDelete={() => setRows((rs) => rs.filter((x) => x.id !== r.id))}
          />
        ),
      },
    ],
    [cols, kind],
  );
  const match = useCallback(
    (r: RecordRow) =>
      `${r.name} ${r.company} ${r.detail}`.toLowerCase().includes(search.toLowerCase()) &&
      (!filters.length || filters.includes(r.status)) &&
      (kind === 1 || matchesRules({ ...r, categories: r.extra }, rules)),
    [search, filters, kind, rules],
  );
  const table = useGridTable({
    data: rows,
    fields: columnFields,
    pageSize: 5,
    filter: match,
    initialPinned: kind === 1 ? [] : [1, 2],
  });
  const selected = table.getSelectedRowModel().flatRows;
  const filteredCount = table.getFilteredRowModel().rows.length;
  const pinnedCount = table.state.rowPinning.top?.length ?? 0;
  const filterFields: FilterField[] = [
    { key: "name", label: kind === 2 ? "Name" : "Opportunity" },
    {
      key: "company",
      label: "Company",
      type: "select",
      options: [...new Set(rows.map((r) => r.company).filter(Boolean))],
    },
    {
      key: "categories",
      label: "Category",
      type: "tags",
      options: [...new Set(rows.flatMap((r) => r.extra))],
    },
    {
      key: "status",
      label: kind === 2 ? "Status" : "Stage",
      type: "select",
      options: [...new Set(rows.map((r) => r.status))],
    },
    { key: "score", label: kind === 2 ? "Score" : "Progress", type: "number" },
    { key: "amount", label: "Amount", type: "number" },
  ];
  return (
    <NativeGrid
      table={table}
      {...display}
      cellBorder
      emptyMessage={`No ${title.toLowerCase()} match your filters.`}
      className="[&_tbody_tr]:h-[51px]"
    >
      <Frame
        title={title}
        description={
          kind === 1
            ? `${filteredCount} of ${rows.length} customers`
            : `${rows.length} ${kind === 2 ? "CRM" : "revenue"} pipeline`
        }
        action={
          <Button size="sm" onClick={() => setCreate(true)}>
            <Plus />
            Add {singular}
          </Button>
        }
      >
        <Toolbar>
          {kind === 1 ? (
            <>
              <SearchBox
                value={search}
                onChange={setSearch}
                placeholder="Search customers..."
                label="Search customers"
              />
              <Facet
                label="Status"
                value={filters}
                onChange={setFilters}
                options={[...new Set(rows.map((r) => r.status))]}
              />
            </>
          ) : (
            <FilterBar
              fields={filterFields}
              rules={rules}
              onChange={setRules}
              clearLabel=""
              className="p-0"
            />
          )}
          <div className="flex-1" />
          {kind !== 1 && pinnedCount > 0 && (
            <div className="flex items-center rounded-lg border">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => table.setRowPinning({ top: [], bottom: [] })}
              >
                <PinOff />
                Unpin all
              </Button>
              <span className="border-l bg-muted/50 px-2 py-1.5 text-xs text-muted-foreground">
                {pinnedCount} {singular}s pinned
              </span>
            </div>
          )}
          {(search || filters.length > 0) && (
            <ClearFilters
              onClick={() => {
                setSearch("");
                setFilters([]);
              }}
            />
          )}
          {kind < 3 ? (
            <Popover>
              <PopoverTrigger asChild>
                <Button size="sm" variant="outline">
                  <Ellipsis />
                  Actions
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56">
                <Button
                  size="sm"
                  variant="ghost"
                  className="justify-start"
                  onClick={() =>
                    downloadCsv(
                      title,
                      (selected.length ? selected : table.getFilteredRowModel().rows).map(
                        (row) => ({ ...row.original, extra: row.original.extra.join(", ") }),
                      ),
                    )
                  }
                >
                  Export CSV
                </Button>
                <NativeSettings table={table} {...display} />
              </PopoverContent>
            </Popover>
          ) : (
            <NativeColumns table={table} />
          )}
        </Toolbar>
        {selected.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b bg-muted/30 px-3 py-2 text-xs">
            <span>{selected.length} selected</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setRows((rs) => rs.filter((r) => !table.state.rowSelection[String(r.id)]));
                table.setRowSelection({});
              }}
            >
              Delete selected
            </Button>
            <Button variant="ghost" size="sm" onClick={() => table.setRowSelection({})}>
              Clear selection
            </Button>
          </div>
        )}
        <NativeTable />
        <NativePager />
        <CreateDialog
          open={create}
          onOpenChange={setCreate}
          title={`Add ${singular}`}
          onCreate={(name) => {
            setRows((rs) => [
              { ...seed(kind)[0], id: Math.max(...rs.map((r) => r.id)) + 1, name },
              ...rs,
            ]);
            table.setPageIndex(0);
            setSearch("");
            table.setSorting([{ id: cols[0], desc: true }]);
          }}
        />
      </Frame>
    </NativeGrid>
  );
}
const memberNames = [
  "Avery Quinn",
  "Dev Rana",
  "Imani Brooks",
  "Lena Torres",
  "Marcus Hale",
  "Nora Patel",
  "Owen Diaz",
  "Theo Bennett",
];
function Members() {
  const [rows, setRows] = useState(
    memberNames.map((name, i) => ({
      id: i,
      name,
      role: ["Security", "Growth", "Support", "Admin", "Finance", "Engineering", "Design", "Admin"][
        i
      ],
      billing: [
        "Past due",
        "Pending invoice",
        "Active",
        "Active",
        "Pending invoice",
        "Active",
        "Active",
        "Active",
      ][i],
      auth: [
        "Okta SSO",
        "GitHub",
        "Passwordless",
        "Google",
        "Okta SSO",
        "Google",
        "GitHub",
        "Google",
      ][i],
      date: [
        "Feb 10, 2026",
        "Jan 11, 2026",
        "Mar 29, 2026",
        "Apr 17, 2026",
        "Apr 12, 2026",
        "Mar 10, 2026",
        "Apr 20, 2026",
        "Apr 4, 2026",
      ][i],
    })),
  );
  const [query, setQuery] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [billing, setBilling] = useState<string[]>([]);
  const [create, setCreate] = useState(false);
  const display = useGridDisplay();
  type Member = (typeof rows)[number];
  const fields = useMemo<GridColumn<Member>[]>(
    () => [
      {
        id: "Member",
        value: (r) => r.name,
        width: 310,
        hideable: false,
        cell: (r) => <Identity name={r.name} detail={r.name.toLowerCase().replace(" ", ".")} />,
      },
      {
        id: "Email",
        value: (r) => `${r.name.split(" ")[0].toLowerCase()}@northline.app`,
        width: 265,
        cell: (r) => (
          <a
            className="hover:underline"
            href={`mailto:${r.name.split(" ")[0].toLowerCase()}@northline.app`}
          >
            {r.name.split(" ")[0].toLowerCase()}@northline.app
          </a>
        ),
      },
      { id: "Role", value: (r) => r.role, width: 145, cell: (r) => r.role },
      {
        id: "Billing status",
        value: (r) => r.billing,
        width: 180,
        cell: (r) => (
          <span className="inline-flex items-center gap-2">
            <i
              className={cn(
                "size-1.5 rounded-full",
                r.billing === "Active"
                  ? "bg-emerald-500"
                  : r.billing === "Past due"
                    ? "bg-rose-500"
                    : "bg-sky-500",
              )}
            />
            {r.billing}
          </span>
        ),
      },
      { id: "Authentication", value: (r) => r.auth, width: 160, cell: (r) => r.auth },
      {
        id: "Joining date",
        value: (r) => new Date(r.date).getTime(),
        width: 145,
        cell: (r) => <span className="text-muted-foreground">{r.date}</span>,
      },
      {
        id: "_actions",
        width: 40,
        cell: (r) => (
          <RowMenu
            name={r.name}
            onDelete={() => setRows((rs) => rs.filter((x) => x.id !== r.id))}
          />
        ),
      },
    ],
    [],
  );
  const match = useCallback(
    (r: Member) =>
      r.name.toLowerCase().includes(query.toLowerCase()) &&
      (!roles.length || roles.includes(r.role)) &&
      (!billing.length || billing.includes(r.billing)),
    [query, roles, billing],
  );
  const table = useGridTable({ data: rows, fields, filter: match });
  return (
    <NativeGrid table={table} {...display} className="[&_tbody_tr]:h-[53px]">
      <Frame
        plain
        title="Members"
        count={rows.length}
        action={
          <div className="flex flex-wrap gap-2">
            <SearchBox value={query} onChange={setQuery} />
            <Facet
              label="Role"
              options={[...new Set(rows.map((r) => r.role))]}
              value={roles}
              onChange={setRoles}
            />
            <Facet
              label="Billing"
              options={["Active", "Past due", "Pending invoice"]}
              value={billing}
              onChange={setBilling}
            />
            <Button size="sm" onClick={() => setCreate(true)}>
              Add member
            </Button>
          </div>
        }
      >
        <NativeTable />
        <NativePager noun="members" />
        <CreateDialog
          open={create}
          onOpenChange={setCreate}
          title="Add member"
          onCreate={(name) =>
            setRows((rs) => [{ ...rs[0], id: Date.now(), name, billing: "Pending invoice" }, ...rs])
          }
        />
      </Frame>
    </NativeGrid>
  );
}
const timeNames = [
  "Amara Ortiz",
  "Theo Mercer",
  "Lena Hoffman",
  "Iris Calder",
  "Samir Vale",
  "Nora Lane",
  "Owen Parks",
  "Mira Stone",
  "Leo Martin",
];
const timeRoles = [
  "Client delivery lead",
  "Platform engineer",
  "Content systems editor",
  "Design systems lead",
  "Partner success manager",
];
const timeValues = [
  [6.5, 5.5, 7, 6, 4.5, 0, 0],
  [8, 8, 7.5, 8, 8, 0, 0],
  [5, 4.5, 5, 3.5, 4, 0, 0],
  [6, 6.5, 6, 6.5, 4, 0, 0],
  [7, 7.5, 6.5, 8, 7, 0, 0],
];
const formatHours = (v: number) => (v ? `${Math.floor(v)}h${v % 1 ? " 30m" : ""}` : "-");
function Timesheet() {
  const [rows, setRows] = useState(
    timeNames.map((name, i) => ({ id: i, name, role: timeRoles[i % 5], hours: timeValues[i % 5] })),
  );
  const [week, setWeek] = useState(0);
  const [people, setPeople] = useState<string[]>([]);
  const [billable, setBillable] = useState<string[]>([]);
  const [timeFilter, setTimeFilter] = useState<string[]>([]);
  const [create, setCreate] = useState(false);
  type Entry = (typeof rows)[number];
  const dates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => new Date(2026, 2, 23 + i + week * 7)),
    [week],
  );
  const fields = useMemo<GridColumn<Entry>[]>(
    () => [
      {
        id: "People",
        value: (r) => r.name,
        width: 255,
        hideable: false,
        cell: (r) => <Identity name={r.name} detail={r.role} />,
      },
      ...dates.map((date, i) => ({
        id: `day-${i}`,
        title: date.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric" }),
        value: (r: Entry) => r.hours[i],
        width: 119,
        align: "center" as const,
        cell: (r: Entry) => {
          const hours = r.hours[i];
          const type =
            hours === 0
              ? "Off"
              : r.id === 4 && [0, 1, 4].includes(i)
                ? "Support"
                : (r.id === 0 && i === 1) ||
                    (r.id === 2 && i % 2 === 0 && i < 4) ||
                    (r.id === 3 && i === 2)
                  ? "Internal"
                  : "Client";
          return (
            <div className="text-center">
              <div className="font-medium tabular-nums">{formatHours(hours)}</div>
              <div className="mx-auto my-1 h-1 w-14 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full",
                    type === "Internal"
                      ? "bg-sky-500"
                      : type === "Support"
                        ? "bg-amber-500"
                        : "bg-emerald-500",
                  )}
                  style={{ width: `${(hours / 8) * 100}%` }}
                />
              </div>
              <div className="text-[10px] text-muted-foreground">{type}</div>
            </div>
          );
        },
      })),
      {
        id: "Total",
        value: (r) => r.hours.reduce((a, b) => a + b, 0),
        width: 128,
        align: "right",
        cell: (r) => (
          <>
            <div className="font-medium">{formatHours(r.hours.reduce((a, b) => a + b, 0))}</div>
            <div className="mt-1 text-xs text-emerald-500">
              ↗ {[92, 99, 73, 91, 103][r.id % 5]}%
            </div>
          </>
        ),
      },
    ],
    [dates],
  );
  const match = useCallback(
    (r: Entry) =>
      (!people.length || people.includes(r.name)) &&
      (!timeFilter.length ||
        (timeFilter.includes("Over 32 hours")
          ? r.hours.reduce((a, b) => a + b, 0) > 32
          : r.hours.reduce((a, b) => a + b, 0) <= 32)) &&
      (!billable.length || (billable.includes("Client") ? r.id % 3 !== 2 : r.id % 3 === 2)),
    [people, timeFilter, billable],
  );
  const table = useGridTable({ data: rows, fields, filter: match });
  return (
    <NativeGrid table={table} cellBorder className="[&_tbody_tr]:h-[66px]">
      <Frame
        title="Timesheets"
        description="Weekly team timesheets"
        action={
          <Button size="sm" onClick={() => setCreate(true)}>
            New entry
          </Button>
        }
      >
        <Toolbar>
          <Facet
            label="People"
            options={rows.map((r) => r.name)}
            value={people}
            onChange={setPeople}
          />
          <Facet
            label="Tracked time"
            options={["Over 32 hours", "Under 32 hours"]}
            value={timeFilter}
            onChange={setTimeFilter}
          />
          <Facet
            label="Billable status"
            options={["Client", "Internal"]}
            value={billable}
            onChange={setBillable}
          />
          <div className="flex-1" />
          <div className="flex items-center rounded-lg border">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Previous week"
              onClick={() => setWeek((v) => v - 1)}
            >
              <ChevronLeft />
            </Button>
            <span className="px-2 text-xs">
              {dates[0].toLocaleString("en-US", { month: "short" })} {dates[0].getDate()} -{" "}
              {dates[6].getDate()}
            </span>
            <CalendarDays className="mx-2 size-3.5 text-muted-foreground" />
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Next week"
              onClick={() => setWeek((v) => v + 1)}
            >
              <ChevronRight />
            </Button>
          </div>
        </Toolbar>
        <NativeTable />
        <NativePager />
        <CreateDialog
          open={create}
          onOpenChange={setCreate}
          title="New timesheet entry"
          onCreate={(name) =>
            setRows((rs) => [
              { id: Date.now(), name, role: "Team member", hours: [0, 0, 0, 0, 0, 0, 0] },
              ...rs,
            ])
          }
        />
      </Frame>
    </NativeGrid>
  );
}
const ticketNames = [
  "Webhook signatures stop validating in EU region only",
  "Ledger correction completed and refund receipt confirmed",
  "Need audit trail export before Monday security review",
  "SSO claims fail after Okta certificate rotation",
  "Enterprise invoice PDF renders missing tax address block",
  "Slack installation skips channel permissions on reconnect",
  "Cannot update billing contact",
  "Workspace invite link expired",
  "Export job pending",
  "Usage report missing April data",
  "Need help with API rate limits",
];
function Support() {
  const [rows, setRows] = useState(
    ticketNames.map((name, i) => ({
      id: i,
      name,
      requester: [
        "Theo Vincent",
        "Sofia Kim",
        "Harper Lowe",
        "Jordan Park",
        "Lena Foster",
        "Elliot Hart",
      ][i % 6],
      company: [
        "Atlas Fleet",
        "Bright Harbor",
        "Veritas Grid",
        "Northstar Labs",
        "Shoreline Capital",
        "Sunline HQ",
      ][i % 6],
      queue: ["Platform", "Billing", "Authentication", "Authentication", "Billing", "Integrations"][
        i % 6
      ],
      priority: ["Urgent", "Low", "Urgent", "Urgent", "High", "High"][i % 6],
      status: ["Pending", "Resolved", "Open", "Pending", "Open", "Open"][i % 6],
      owner: i % 5 === 0 ? "Unassigned" : "Maya Chen",
    })),
  );
  const [search, setSearch] = useState("");
  const [queue, setQueue] = useState<string[]>([]);
  const [status, setStatus] = useState<string[]>([]);
  const [create, setCreate] = useState(false);
  const display = useGridDisplay();
  type Ticket = (typeof rows)[number];
  const fields = useMemo<GridColumn<Ticket>[]>(
    () => [
      selectionColumn<Ticket>(),
      {
        id: "Ticket",
        value: (r) => r.name,
        width: 390,
        hideable: false,
        cell: (r) => (
          <div className="max-w-80">
            <div className="truncate font-medium">{r.name}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              SUP-{1831 - r.id * 7} · Opened {r.id === 1 ? "yesterday" : `${22 + r.id * 7}m ago`}
            </p>
          </div>
        ),
      },
      {
        id: "Requester",
        value: (r) => r.requester,
        width: 240,
        cell: (r) => <Identity name={r.requester} detail={`${r.company} · ${r.owner}`} />,
      },
      { id: "Queue", value: (r) => r.queue, width: 160, cell: (r) => <Chip>{r.queue}</Chip> },
      {
        id: "Priority",
        value: (r) => ["Low", "Normal", "High", "Urgent"].indexOf(r.priority),
        width: 130,
        cell: (r) => <Chip>{r.priority}</Chip>,
      },
      {
        id: "SLA",
        value: (r) =>
          r.id === 0 ? -14 : r.id === 1 ? Infinity : ([18, 28, 34, 43][(r.id - 2) % 4] ?? 52),
        width: 210,
        cell: (r) => (
          <div>
            <div
              className={cn(
                "font-medium",
                r.id === 0
                  ? "text-rose-600"
                  : r.id === 1
                    ? "text-muted-foreground"
                    : "text-amber-600",
              )}
            >
              {r.id === 0
                ? "Breached 14m"
                : r.id === 1
                  ? "Closed"
                  : `${[18, 28, 34, 43][(r.id - 2) % 4] || 52}m left`}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              {r.id === 0
                ? "Needs immediate follow-up"
                : r.id === 1
                  ? "No live SLA"
                  : "Reply target is close"}
            </div>
          </div>
        ),
      },
      { id: "Status", value: (r) => r.status, width: 130, cell: (r) => <Chip>{r.status}</Chip> },
      {
        id: "_actions",
        width: 40,
        cell: (r) => (
          <RowMenu
            name={r.name}
            onDelete={() => setRows((rs) => rs.filter((x) => x.id !== r.id))}
          />
        ),
      },
    ],
    [],
  );
  const match = useCallback(
    (r: Ticket) =>
      `${r.name} ${r.requester}`.toLowerCase().includes(search.toLowerCase()) &&
      (!queue.length || queue.includes(r.queue)) &&
      (!status.length || status.includes(r.status)),
    [search, queue, status],
  );
  const table = useGridTable({ data: rows, fields, filter: match, pageSize: 6 });
  const selected = table.getSelectedRowModel().flatRows;
  return (
    <NativeGrid table={table} {...display} className="[&_tbody_tr]:h-[64px]">
      <Frame
        title="Support Queue"
        description={
          <>
            {table.getFilteredRowModel().rows.length} visible <span className="mx-2">·</span>2
            unassigned <span className="mx-2">·</span>6 near SLA
          </>
        }
        action={
          <Button size="sm" onClick={() => setCreate(true)}>
            <Plus />
            New ticket
          </Button>
        }
      >
        <Toolbar>
          <SearchBox value={search} onChange={setSearch} placeholder="Search tickets..." />
          <Facet
            label="All queues"
            options={["Platform", "Billing", "Authentication", "Integrations"]}
            value={queue}
            onChange={setQueue}
          />
          <Facet
            label="Status"
            options={["Open", "Pending", "Resolved"]}
            value={status}
            onChange={setStatus}
          />
          <div className="flex-1" />
          <NativeColumns table={table} />
          <NativeSettings table={table} {...display} />
        </Toolbar>
        {selected.length > 0 && (
          <div className="flex items-center gap-3 border-b bg-muted/30 px-3 py-2 text-xs">
            <span>{selected.length} tickets selected</span>
            <Facet
              label="Assign owner"
              options={["Maya Chen", "Oskar Lind", "Niko Patel"]}
              value={[]}
              onChange={(v) => {
                setRows((rs) =>
                  rs.map((r) =>
                    table.state.rowSelection[String(r.id)] ? { ...r, owner: v[0] } : r,
                  ),
                );
                table.setRowSelection({});
              }}
            />
            <Button size="sm" variant="ghost" onClick={() => table.setRowSelection({})}>
              Clear
            </Button>
          </div>
        )}
        <NativeTable />
        <NativePager />
        <CreateDialog
          open={create}
          onOpenChange={setCreate}
          title="New ticket"
          onCreate={(name) =>
            setRows((rs) => [
              { ...rs[0], id: Date.now(), name, status: "Open", owner: "Unassigned" },
              ...rs,
            ])
          }
        />
      </Frame>
    </NativeGrid>
  );
}
const moduleNames = [
  "API Console",
  "Audit Trail",
  "Billing Rules",
  "Core Workflow",
  "Data Retention",
  "Design System",
  "Event Pipeline",
  "Feature Flags",
  "Identity Provider",
  "Integration Hub",
  "Notification Center",
  "Observability",
  "Permissions",
  "Release Manager",
  "Search Index",
  "Usage Metering",
  "Workspace Settings",
];
function Modules() {
  const [rows, setRows] = useState(
    moduleNames.map((name, i) => ({
      id: i,
      name,
      score: [91, 76, 64, 25, 22, 86, 55, 73, 90, 45, 63, 80, 40, 25, 92, 66, 58][i],
      status: ["In Progress", "In Progress", "In Progress", "Planned", "Backlog"][i % 5],
    })),
  );
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string[]>([]);
  const [create, setCreate] = useState(false);
  type Module = (typeof rows)[number];
  const fields = useMemo<GridColumn<Module>[]>(
    () => [
      {
        id: "Progress",
        value: (r) => r.score,
        width: 210,
        cell: (r) => (
          <div className="flex items-center gap-3">
            <Ring value={r.score} size={40} />
            <div>
              <p className="font-medium">{r.score}% ready</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {[29, 19, 21, 8, 7][r.id % 5]}/{[32, 25, 33, 32, 32][r.id % 5]} tasks
              </p>
            </div>
          </div>
        ),
      },
      {
        id: "Module",
        value: (r) => r.name,
        width: 470,
        hideable: false,
        cell: (r) => (
          <>
            <div className="font-medium">
              {r.name} <Chip>{r.id % 2 ? "System" : "Feature"}</Chip>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {["Lena Brooks", "Omar Haddad", "Elijah Morgan", "Maya Patel", "Kenji Tan"][r.id % 5]}{" "}
              · {r.name.toUpperCase().replaceAll(" ", "-")}
            </p>
          </>
        ),
      },
      {
        id: "Window",
        value: (r) => 12 + (r.id % 17) * 2,
        width: 250,
        cell: (r) => (
          <>
            <p>
              {new Date(2026, 3, 12 + (r.id % 17) * 2).toLocaleDateString("en-US", {
                month: "short",
                day: "2-digit",
              })}{" "}
              -{" "}
              {new Date(2026, 3, 26 + (r.id % 17) * 2).toLocaleDateString("en-US", {
                month: "short",
                day: "2-digit",
              })}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">14-day window</p>
          </>
        ),
      },
      { id: "Status", value: (r) => r.status, width: 180, cell: (r) => <Chip>{r.status}</Chip> },
      {
        id: "_actions",
        width: 60,
        cell: (r) => (
          <RowMenu
            name={r.name}
            onDelete={() => setRows((rs) => rs.filter((x) => x.id !== r.id))}
          />
        ),
      },
    ],
    [],
  );
  const match = useCallback(
    (r: Module) =>
      r.name.toLowerCase().includes(search.toLowerCase()) &&
      (!status.length || status.includes(r.status)),
    [search, status],
  );
  const table = useGridTable({ data: rows, fields, filter: match });
  return (
    <NativeGrid table={table} className="[&_tbody_tr]:h-[76px]">
      <Frame
        plain
        title="Modules"
        eyebrow="Keenthemes"
        action={
          <div className="flex flex-wrap gap-2">
            <SearchBox value={search} onChange={setSearch} placeholder="Name" />
            <Facet
              label="Filters"
              options={["In Progress", "Planned", "Backlog"]}
              value={status}
              onChange={setStatus}
            />
            <Button size="sm" onClick={() => setCreate(true)}>
              <Plus />
              Add Module
            </Button>
          </div>
        }
      >
        <NativeTable />
        <NativePager noun="modules" />
        <CreateDialog
          open={create}
          onOpenChange={setCreate}
          title="Add Module"
          onCreate={(name) =>
            setRows((rs) => [{ id: Date.now(), name, score: 0, status: "Backlog" }, ...rs])
          }
        />
      </Frame>
    </NativeGrid>
  );
}
const rateNames = [
  "Standard Compute",
  "Memory Optimized",
  "GPU L4",
  "Block Storage SSD",
  "Object Storage",
  "Internet Egress",
  "Managed Postgres",
  "Redis Cache",
  "Inference Tokens",
  "Function Calls",
  "Load Balancer",
  "Embedding Tokens",
  "Archive Storage",
  "Private Link",
  "Fine-tune Training",
  "Postgres Storage",
];
const rateList = [
  0.05, 0.0625, 0.8, 0.1, 0.025, 0.09, 0.125, 0.02, 3, 0.2, 0.025, 0.1, 0.004, 0.0125, 2.5, 0.115,
];
const rateNet = [
  0.036, 0.0486, 0.646, 0.0765, 0.017, 0.0756, 0.0972, 0.015, 2.295, 0.2128, 0.027, 0.064, 0.003,
  0.0108, 2.142, 0.092,
];
const commits = [
  186420, 64000, 3612, 48000, 418600, 36480, 21900, 146000, 1850, 5400, 2190, 12400, 1250000, 17520,
  420, 8200,
];
function RateCard() {
  const [rows, setRows] = useState(
    rateNames.map((name, i) => ({
      id: i,
      name,
      list: rateList[i],
      net: rateNet[i],
      discount: [28, 28, 19.3, 23.5, 32, 25, 28, 25, 23.5, 5, 0, 36, 25, 20, 23.5, 20][i],
      commit: commits[i],
      usage: [92, 91, 108, 96, 108, 58, 90, 60, 116, 55, 0, 0, 95, 100, 44, 90][i],
      status:
        i === 10 || i === 11 ? "Draft" : i === 5 || i === 9 || i === 13 ? "Expiring" : "Active",
    })),
  );
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string[]>([]);
  const [create, setCreate] = useState(false);
  const display = useGridDisplay();
  type Rate = (typeof rows)[number];
  const fields = useMemo<GridColumn<Rate>[]>(
    () => [
      {
        id: "Product",
        value: (r) => r.name,
        width: 285,
        hideable: false,
        cell: (r) => (
          <div className="flex items-center gap-2">
            <span className="rounded-md border bg-muted/20 p-1">
              <Cpu className="size-3.5" />
            </span>
            {r.name}
          </div>
        ),
      },
      {
        id: "List",
        value: (r) => r.list,
        width: 115,
        align: "right",
        cell: (r) => `$${r.list.toFixed(4)}`,
      },
      {
        id: "Discount",
        value: (r) => r.discount,
        width: 110,
        align: "right",
        cell: (r) => `${r.discount.toFixed(1)}%`,
      },
      {
        id: "Net / unit",
        value: (r) => r.net,
        width: 120,
        align: "right",
        cell: (r) => (
          <Popover>
            <PopoverTrigger asChild>
              <button className="underline decoration-dotted underline-offset-4">
                ${r.net.toFixed(4)}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 text-xs">
              <p className="font-medium">{r.name} price breakdown</p>
              <div className="flex justify-between">
                <span>List price</span>
                <span>${r.list.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span>Commit + volume discount</span>
                <span>{r.discount}%</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-medium">
                <span>Net / unit</span>
                <span>${r.net.toFixed(4)}</span>
              </div>
            </PopoverContent>
          </Popover>
        ),
      },
      {
        id: "Commit",
        value: (r) => r.commit,
        width: 115,
        align: "right",
        cell: (r) => r.commit.toLocaleString(),
      },
      {
        id: "Usage",
        value: (r) => r.usage,
        width: 130,
        align: "right",
        cell: (r) =>
          r.usage ? (
            <Meter
              value={r.usage}
              color={
                r.usage > 100 ? "bg-rose-500" : r.usage < 60 ? "bg-amber-500" : "bg-neutral-400"
              }
            />
          ) : (
            <span className="text-muted-foreground">None</span>
          ),
      },
      {
        id: "Monthly",
        value: (r) => r.net * r.commit,
        width: 130,
        align: "right",
        cellClassName: "bg-muted/20 font-medium border-x",
        cell: (r) => usd(r.net * r.commit, 2),
      },
      {
        id: "Renews",
        value: (r) =>
          r.id === 5
            ? 20261015
            : r.id === 9
              ? 20261102
              : r.id % 3 === 0
                ? 20280301
                : r.id % 3 === 1
                  ? 20270615
                  : 20270131,
        width: 145,
        cell: (r) =>
          r.id === 5
            ? "Oct 15, 2026"
            : r.id === 9
              ? "Nov 2, 2026"
              : r.id % 3 === 0
                ? "Mar 1, 2028"
                : r.id % 3 === 1
                  ? "Jun 15, 2027"
                  : "Jan 31, 2027",
      },
      { id: "Status", value: (r) => r.status, width: 110, cell: (r) => <Chip>{r.status}</Chip> },
      {
        id: "_actions",
        width: 40,
        cell: (r) => (
          <RowMenu
            name={r.name}
            onDelete={() => setRows((rs) => rs.filter((x) => x.id !== r.id))}
          />
        ),
      },
    ],
    [],
  );
  const match = useCallback(
    (r: Rate) =>
      r.name.toLowerCase().includes(search.toLowerCase()) &&
      (!status.length || status.includes(r.status)),
    [search, status],
  );
  const table = useGridTable({ data: rows, fields, filter: match, pageSize: 10 });
  const total = table
    .getFilteredRowModel()
    .rows.reduce((sum, row) => sum + row.original.net * row.original.commit, 0);
  const footer = (
    <DataGridTableFootRow>
      {table.getVisibleLeafColumns().map((column) => (
        <DataGridTableFootRowCell
          key={column.id}
          className={column.id === "Monthly" ? "text-right font-medium" : undefined}
        >
          {column.id === "Product" ? (
            <>
              Total{" "}
              <span className="text-muted-foreground">
                · {table.getFilteredRowModel().rows.length} SKUs
              </span>
            </>
          ) : column.id === "Monthly" ? (
            usd(total, 2)
          ) : null}
        </DataGridTableFootRowCell>
      ))}
    </DataGridTableFootRow>
  );
  return (
    <NativeGrid table={table} {...display} className="[&_tbody_tr]:h-[37px] [&_td]:py-1.5">
      <Frame
        title="Rate Card"
        description={`${rows.length} SKUs · 24.6% below list`}
        action={
          <Button size="sm" onClick={() => setCreate(true)}>
            <Plus />
            Add rate
          </Button>
        }
      >
        <Toolbar>
          <SearchBox value={search} onChange={setSearch} placeholder="Search SKU or name..." />
          <div className="flex-1" />
          <Facet
            label="Filter"
            options={["Active", "Expiring", "Draft"]}
            value={status}
            onChange={setStatus}
          />
          <NativeColumns table={table} />
          <NativeSettings table={table} {...display} />
        </Toolbar>
        <NativeTable footer={footer} />
        <NativePager />
        <CreateDialog
          open={create}
          onOpenChange={setCreate}
          title="Add rate"
          onCreate={(name) =>
            setRows((rs) => [
              {
                id: Date.now(),
                name,
                list: 0.05,
                net: 0.05,
                discount: 0,
                commit: 0,
                usage: 0,
                status: "Active",
              },
              ...rs,
            ])
          }
        />
      </Frame>
    </NativeGrid>
  );
}
export default function BaseGrid({ block }: BlockProps) {
  const n = Number(block.id.split("-").at(-1));
  if (n <= 3) return <CrmGrid key={n} kind={n} />;
  if (n === 4) return <Timesheet />;
  if (n === 5) return <Support />;
  if (n === 6) return <Members />;
  if (n === 7) return <Modules />;
  return <RateCard />;
}
