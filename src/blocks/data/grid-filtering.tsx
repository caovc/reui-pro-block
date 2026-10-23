import { useEffect, useState, type ReactNode } from "react";
import {
  BellRing,
  Check,
  Ellipsis,
  GitBranch,
  Workflow,
  Mail,
  MoreVertical,
  Pin,
  PinOff,
  Plus,
  Trash2,
} from "lucide-react";
import type { BlockProps } from "@/data/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/reui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { downloadCsv } from "./data-utils";
import { billingSeed, automationSeed, renewalSeed, riskSeed } from "./grid-filtering-data";
import {
  FilterBar,
  FilteringSettings,
  firstRule,
  matchesRules,
  type FilterField,
  type FilterRule,
} from "./grid-filter-controls";
import {
  FilterGrid,
  FilterTable,
  FilterPager,
  useFilteringTable,
  type FilterGridColumn,
} from "./grid-filter-model";
import {
  Frame as ReuiFrame,
  FrameHeader,
  FrameTitle,
  FrameDescription,
} from "@/components/reui/frame";
import { IconTile } from "@/components/reui/icon-tile";
import { Rating } from "@/components/reui/rating";
import "./grid-filtering.css";
import { gridBrandAssets } from "./grid-base-assets";
import { demoAvatar, integrationArtwork, svgImage } from "@/lib/demo-artwork";

const usd = (n: number) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
function Portrait({ name, small = false }: { name: string; small?: boolean }) {
  return (
    <Avatar className={small ? "size-4" : "size-7"}>
      <AvatarImage src={small ? undefined : demoAvatar(name)} alt={name} />
      <AvatarFallback className={small ? "text-[8px]" : "text-[10px]"}>
        {name
          .split(" ")
          .map((s) => s[0])
          .slice(0, 2)
          .join("")}
      </AvatarFallback>
    </Avatar>
  );
}
function Brand({ name, tile = false }: { name: string; tile?: boolean }) {
  const slug = name.toLowerCase().replaceAll(" ", "");
  const src =
    gridBrandAssets[slug] ??
    svgImage(integrationArtwork(name.slice(0, 1).toUpperCase() || "?", "#71808f"));
  return (
    <IconTile
      aria-hidden="true"
      className={cn(
        "size-5 rounded-none border-0 bg-transparent font-semibold",
        tile && "size-9 rounded-xl border bg-background shadow-xs",
      )}
    >
      <img src={src} alt="" className="size-5 object-contain" />
    </IconTile>
  );
}
function DotBadge({
  children,
  tone = "default",
  dot = true,
}: {
  children: ReactNode;
  tone?: string;
  dot?: boolean;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 rounded-[5px] px-1 py-0 text-xs font-normal leading-[18px]",
        tone === "Critical" && "border-rose-500/15 bg-rose-500/10 text-rose-700 dark:text-rose-400",
        tone === "High" && "border-amber-500/15 bg-amber-500/10 text-amber-700 dark:text-amber-400",
        tone === "Medium" &&
          "border-violet-500/15 bg-violet-500/10 text-violet-700 dark:text-violet-400",
        tone === "Low" && "border-transparent bg-muted",
      )}
    >
      {dot && (
        <span
          className={cn(
            "size-1.5 rounded-full",
            /Live|Completed|Verbal/.test(String(children))
              ? "bg-emerald-500"
              : /Legal|Executive|Needs|Pending/.test(String(children))
                ? "bg-amber-500"
                : /Save|Failed/.test(String(children))
                  ? "bg-rose-500"
                  : /Commercial|Procurement/.test(String(children))
                    ? "bg-sky-500"
                    : "bg-muted-foreground",
          )}
        />
      )}
      {children}
    </Badge>
  );
}
function Frame({
  title,
  subtitle,
  children,
  action,
  white = false,
  library = false,
}: {
  title: string;
  subtitle: ReactNode;
  children: ReactNode;
  action?: ReactNode;
  white?: boolean;
  library?: boolean;
}) {
  return (
    <ReuiFrame
      className={cn(
        "refined-filter-grid mx-auto w-full min-w-0 max-w-[1216px] overflow-hidden rounded-2xl border bg-muted/20 text-sm",
        white && "bg-background",
        library && "automation-filter-grid",
      )}
      aria-label={`${title} data grid`}
    >
      <FrameHeader
        className={cn(
          "flex flex-row flex-wrap items-center justify-between gap-3 px-4 py-[9px]",
          library && "px-3 py-1.5",
          white && "px-5 py-[17px]",
        )}
      >
        <div>
          <FrameTitle className="leading-5">{title}</FrameTitle>
          <FrameDescription className="mt-0.5 text-xs">{subtitle}</FrameDescription>
        </div>
        {action}
      </FrameHeader>
      {children}
    </ReuiFrame>
  );
}
function useSorting(initial: string, asc = true) {
  const [sort, setSort] = useState({ key: initial, asc });
  return { sort, setSort };
}
function Details({
  title,
  data,
  close,
}: {
  title: string;
  data: Record<string, unknown> | null;
  close: () => void;
}) {
  return (
    <Dialog
      open={!!data}
      onOpenChange={(v) => {
        if (!v) close();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Record details in this interactive preview.</DialogDescription>
        </DialogHeader>
        <dl className="max-h-[60vh] space-y-3 overflow-y-auto text-sm">
          {data &&
            Object.entries(data)
              .filter(([k]) => k !== "id")
              .map(([key, value]) => (
                <div key={key} className="grid grid-cols-[100px_1fr] gap-4 border-b pb-2">
                  <dt className="capitalize text-muted-foreground">{key}</dt>
                  <dd className="break-words">
                    {Array.isArray(value) ? value.join(", ") : String(value)}
                  </dd>
                </div>
              ))}
        </dl>
      </DialogContent>
    </Dialog>
  );
}

function BillingGrid() {
  const [rows, setRows] = useState(billingSeed);
  const [rules, setRules] = useState<FilterRule[]>([firstRule("reference")]);
  const [selected, setSelected] = useState<number[]>([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<(typeof billingSeed)[number] | null>(null);
  const [dispute, setDispute] = useState<(typeof billingSeed)[number] | null>(null);
  const [create, setCreate] = useState(false);
  const { sort, setSort } = useSorting("Reference", false);
  const fields: FilterField[] = [
    { key: "reference", label: "Reference" },
    { key: "description", label: "Description" },
    {
      key: "merchant",
      label: "Merchant",
      type: "select",
      options: [...new Set(rows.map((r) => r.merchant))],
    },
    {
      key: "category",
      label: "Category",
      type: "select",
      options: [...new Set(rows.map((r) => r.category))],
    },
    {
      key: "region",
      label: "Region",
      type: "select",
      options: [...new Set(rows.map((r) => r.region))],
    },
    {
      key: "channel",
      label: "Channel",
      type: "select",
      options: ["Checkout", "Dashboard", "API", "Invoice"],
    },
    {
      key: "status",
      label: "Status",
      type: "select",
      options: ["Completed", "Pending", "Failed", "Disputed"],
    },
    { key: "amount", label: "Amount", type: "number" },
  ];
  const query = JSON.stringify(rules);
  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 400);
    return () => window.clearTimeout(timer);
  }, [query]);
  const gridColumns: FilterGridColumn<(typeof billingSeed)[number]>[] = [
    {
      id: "_select",
      width: 38,
      cell: (r, row) => (
        <>
          <Checkbox
            aria-label={`Select ${r.reference}`}
            checked={row.getIsSelected()}
            onCheckedChange={(v) => row.toggleSelected(!!v)}
          />
        </>
      ),
    },
    {
      id: "Reference",
      key: "reference",
      width: 132,
      cell: (r) => (
        <>
          <span className="font-mono text-xs tracking-tight">{r.reference}</span>
          <div className="grid-secondary">{r.date}</div>
        </>
      ),
    },
    {
      id: "Description",
      key: "description",
      width: 445,
      cell: (r) => (
        <>
          <div className="flex items-center gap-2.5">
            <Brand name={r.merchant} />
            <div>
              <div className="font-medium">{r.description}</div>
              <div className="grid-secondary">
                {r.merchant} · {r.category}
              </div>
            </div>
          </div>
        </>
      ),
    },
    {
      id: "Region",
      key: "region",
      width: 164,
      cell: (r) => (
        <>
          <div className="flex items-center gap-1.5">
            <span aria-hidden="true">
              {r.region === "United States"
                ? "🇺🇸"
                : r.region === "Germany"
                  ? "🇩🇪"
                  : r.region === "Canada"
                    ? "🇨🇦"
                    : "🇬🇧"}
            </span>
            {r.region}
          </div>
          <div className="grid-secondary">{r.zone}</div>
        </>
      ),
    },
    {
      id: "Channel",
      key: "channel",
      width: 120,
      cell: (r) => (
        <>
          <Badge variant="secondary" className="rounded-md px-1.5 py-0 text-xs font-normal">
            {r.channel}
          </Badge>
        </>
      ),
    },
    {
      id: "Amount",
      key: "amount",
      width: 130,
      cell: (r) => (
        <>
          <span className={cn("font-medium tabular-nums", r.amount > 0 && "text-emerald-500")}>
            {r.amount < 0 ? "−" : "+"}
            {Math.abs(r.amount).toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
            })}
          </span>
        </>
      ),
    },
    {
      id: "Status",
      key: "status",
      width: 110,
      cell: (r) => (
        <>
          <DotBadge
            dot={false}
            tone={r.status === "Failed" || r.status === "Disputed" ? "Critical" : "default"}
          >
            <span
              className={
                r.status === "Completed"
                  ? "text-emerald-800 dark:text-emerald-400"
                  : r.status === "Pending"
                    ? "text-amber-800 dark:text-amber-400"
                    : ""
              }
            >
              {r.status}
            </span>
          </DotBadge>
        </>
      ),
    },
    {
      id: "_actions",
      width: 38,
      cell: (r) => (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${r.reference}`}>
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={() => setDetails(r)}>View details</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => downloadCsv(`receipt-${r.reference}`, [r])}>
                  Download receipt
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled={r.status === "Disputed"} onSelect={() => setDispute(r)}>
                  Dispute transaction
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      ),
    },
  ];
  const table = useFilteringTable({
    rows,
    columns: gridColumns,
    rules,
    sort,
    onSort: setSort,
    selected,
    onSelection: setSelected,
    page,
    onPage: setPage,
    pageSize,
    onPageSize: setPageSize,
  });
  return (
    <>
      <FilterGrid
        table={table}
        loading={loading}
        className="min-w-[1000px]"
        emptyMessage="No transactions match your filters."
      >
        <Frame
          title="Transactions"
          subtitle="Billing ledger(refunds / payouts)"
          action={
            <Button className="h-8" onClick={() => setCreate(true)}>
              <Plus />
              New transaction
            </Button>
          }
        >
          <div className="mx-[3px] overflow-hidden rounded-xl border bg-background">
            <FilterBar
              fields={fields}
              rules={rules}
              onChange={(r) => {
                setLoading(true);
                setRules(r);
                setPage(0);
              }}
            />
            {selected.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 border-t bg-muted/30 px-3 py-2 text-xs">
                <strong>{selected.length} selected</strong>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    downloadCsv(
                      "selected-transactions",
                      rows.filter((r) => selected.includes(r.id)),
                    )
                  }
                >
                  Export selected
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelected([])}>
                  Clear selection
                </Button>
              </div>
            )}
            <FilterTable />{" "}
          </div>
          <FilterPager />
        </Frame>
      </FilterGrid>
      <Details title="Transaction details" data={details} close={() => setDetails(null)} />
      <AlertDialog
        open={!!dispute}
        onOpenChange={(v) => {
          if (!v) setDispute(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dispute {dispute?.reference}?</AlertDialogTitle>
            <AlertDialogDescription>
              Flag this transaction for review in the local demo ledger.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setRows((rs) =>
                  rs.map((r) => (r.id === dispute?.id ? { ...r, status: "Disputed" } : r)),
                );
                setDispute(null);
                toast.success("Transaction flagged for review");
              }}
            >
              Confirm dispute
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={create} onOpenChange={setCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New transaction</DialogTitle>
            <DialogDescription>Add a transaction to this preview ledger.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              const amount = Number(data.get("amount"));
              if (!Number.isFinite(amount)) return;
              setRows((rs) => [
                {
                  ...billingSeed[0],
                  id: Math.max(0, ...rs.map((r) => r.id)) + 1,
                  reference: `TXN-2025-${String(Math.max(143, ...rs.map((r) => Number(r.reference.split("-").at(-1)))) + 1).padStart(6, "0")}`,
                  description: String(data.get("description")).trim(),
                  amount,
                  status: "Pending",
                },
                ...rs,
              ]);
              setCreate(false);
              setRules([firstRule("reference")]);
              setPage(0);
            }}
            className="space-y-4"
          >
            <label className="grid gap-2">
              Description
              <Input name="description" required />
            </label>
            <label className="grid gap-2">
              Amount (USD)
              <Input name="amount" type="number" step="0.01" required />
            </label>
            <DialogFooter>
              <Button type="submit">Add transaction</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AutomationGrid() {
  const [rows, setRows] = useState(automationSeed);
  const [rules, setRules] = useState<FilterRule[]>([firstRule("name")]);
  const [tab, setTab] = useState("All");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [selected, setSelected] = useState<number[]>([]);
  const [details, setDetails] = useState<(typeof automationSeed)[number] | null>(null);
  const [archive, setArchive] = useState<(typeof automationSeed)[number] | null>(null);
  const [create, setCreate] = useState(false);
  const { sort, setSort } = useSorting("Last updated", false);
  const fields: FilterField[] = [
    { key: "name", label: "Workflow" },
    {
      key: "team",
      label: "Owner team",
      type: "select",
      options: ["Revenue Ops", "Operations", "Customer Success", "Growth"],
    },
    {
      key: "mode",
      label: "Delivery mode",
      type: "select",
      options: ["Scheduled", "Queue-based", "Digest", "Event-driven"],
    },
    {
      key: "updated",
      label: "Last updated",
      type: "select",
      options: ["Today", "This week", "Older"],
    },
  ];
  const filtered = rows.filter((r) => matchesRules(r, rules));
  const tabs = [
    { label: "All", status: "" },
    { label: "Live", status: "Live" },
    { label: "Needs Review", status: "Needs approval" },
    { label: "Drafts", status: "Draft" },
    { label: "Paused", status: "Paused" },
  ];
  const gridColumns: FilterGridColumn<(typeof automationSeed)[number]>[] = [
    {
      id: "_select",
      width: 38,
      cell: (r, row) => (
        <>
          <Checkbox
            aria-label={`Select ${r.name}`}
            checked={row.getIsSelected()}
            onCheckedChange={(v) => row.toggleSelected(!!v)}
          />
        </>
      ),
    },
    {
      id: "Workflow",
      key: "name",
      width: 400,
      cell: (r, row) => (
        <>
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-xl border bg-muted/50 shadow-xs ring-2 ring-background",
                row.index % 4 === 0
                  ? "text-sky-500"
                  : row.index % 4 === 1
                    ? "text-violet-500"
                    : row.index % 4 === 2
                      ? "text-orange-500"
                      : "text-rose-500",
              )}
            >
              {r.id === 1 ? (
                <GitBranch className="size-4" />
              ) : r.id === 2 ? (
                <Workflow className="size-4" />
              ) : /digest|follow-up|retry/i.test(r.name) ? (
                <Mail className="size-4" />
              ) : (
                <BellRing className="size-4" />
              )}
            </span>
            <div>
              <div className="font-medium">{r.name}</div>
              <div className="grid-secondary">
                {r.schedule}
                <span className="mx-1.5 text-border">•</span>
                {r.audience}
              </div>
            </div>
          </div>
        </>
      ),
    },
    {
      id: "Owner",
      key: "owner",
      width: 260,
      cell: (r) => (
        <>
          <div className="flex items-center gap-2">
            <Portrait name={r.owner} />
            <div>
              {r.owner}
              <div className="grid-secondary">{r.email}</div>
            </div>
          </div>
        </>
      ),
    },
    {
      id: "Score",
      key: "score",
      width: 180,
      cell: (r) => (
        <>
          <div className="flex items-center gap-2">
            <Rating rating={r.score} size="sm" className="gap-0 [&_svg]:size-4" />
            <span className="text-xs text-muted-foreground">{r.score.toFixed(1)}</span>
          </div>
        </>
      ),
    },
    {
      id: "State",
      key: "status",
      width: 140,
      cell: (r) => (
        <>
          <DotBadge>{r.status}</DotBadge>
        </>
      ),
    },
    {
      id: "Last updated",
      key: "date",
      width: 140,
      cell: (r) => (
        <>
          {r.date}
          <div className="grid-secondary">{r.updated}</div>
        </>
      ),
    },
    {
      id: "_actions",
      width: 38,
      cell: (r) => (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${r.name}`}>
                <MoreVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={() => setDetails(r)}>View details</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setDetails(r)}>Edit workflow</DropdownMenuItem>
                <div className="flex items-center justify-between px-2 py-2 text-sm">
                  Enabled
                  <Switch
                    size="sm"
                    aria-label={`Enable ${r.name}`}
                    checked={r.status === "Live"}
                    onCheckedChange={(v) =>
                      setRows((rs) =>
                        rs.map((row) =>
                          row.id === r.id
                            ? {
                                ...row,
                                status: v ? "Live" : "Paused",
                              }
                            : row,
                        ),
                      )
                    }
                  />
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => setArchive(r)}>
                  <Trash2 />
                  Archive
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      ),
    },
  ];
  const table = useFilteringTable({
    rows,
    columns: gridColumns,
    rules,
    sort,
    onSort: setSort,
    selected,
    onSelection: setSelected,
    page,
    onPage: setPage,
    pageSize,
    onPageSize: setPageSize,
    filter: (r) => tab === "All" || r.status === tabs.find((t) => t.label === tab)?.status,
  });
  return (
    <>
      <FilterGrid
        table={table}
        className="min-w-[950px]"
        emptyMessage="No workflows match your filters."
      >
        <Frame
          library
          title="Automation Library"
          subtitle={
            <>
              {rows.length} workflows <span className="mx-1 text-border">•</span>
              {rows.filter((r) => r.status === "Live").length} live
              <span className="mx-1 text-border">•</span>
              {rows.filter((r) => r.status === "Needs approval").length} review
            </>
          }
          action={
            <Button className="h-8" onClick={() => setCreate(true)}>
              <Plus />
              New workflow
            </Button>
          }
        >
          <div className="overflow-hidden rounded-2xl border-t bg-background">
            <div
              className="flex gap-6 overflow-x-auto border-b px-4"
              role="tablist"
              aria-label="Workflow state"
            >
              {tabs.map((t) => (
                <button
                  key={t.label}
                  role="tab"
                  aria-selected={tab === t.label}
                  onClick={() => {
                    setTab(t.label);
                    setPage(0);
                  }}
                  className={cn(
                    "flex shrink-0 items-center gap-2 border-b-2 py-2 font-medium",
                    tab === t.label
                      ? "border-foreground"
                      : "border-transparent text-muted-foreground",
                  )}
                >
                  <span>{t.label}</span>
                  <span className="rounded-md bg-muted px-1.5 text-xs font-normal text-muted-foreground">
                    {filtered.filter((r) => !t.status || r.status === t.status).length}
                  </span>
                </button>
              ))}
            </div>
            <FilterBar
              fields={fields}
              rules={rules}
              onChange={(r) => {
                setRules(r);
                setPage(0);
              }}
            />
            {selected.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 border-t bg-muted/30 px-3 py-2">
                <span>{selected.length} selected</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setRows((rs) =>
                      rs.map((r) => (selected.includes(r.id) ? { ...r, status: "Paused" } : r)),
                    );
                    setSelected([]);
                  }}
                >
                  Pause selected
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelected([])}>
                  Clear selection
                </Button>
              </div>
            )}
            <FilterTable /> <FilterPager />
          </div>
        </Frame>
      </FilterGrid>
      <Details title="Workflow details" data={details} close={() => setDetails(null)} />
      <AlertDialog
        open={!!archive}
        onOpenChange={(v) => {
          if (!v) setArchive(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive workflow?</AlertDialogTitle>
            <AlertDialogDescription>
              {archive?.name} will be removed from this local library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setRows((rs) => rs.filter((r) => r.id !== archive?.id));
                setArchive(null);
                setSelected((s) => s.filter((id) => id !== archive?.id));
              }}
            >
              Archive workflow
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={create} onOpenChange={setCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New workflow</DialogTitle>
            <DialogDescription>Create a draft in this preview.</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const name = String(new FormData(e.currentTarget).get("name") ?? "").trim();
              if (!name) return;
              setRows((rs) => [
                {
                  ...automationSeed[0],
                  id: Math.max(0, ...rs.map((r) => r.id)) + 1,
                  name,
                  status: "Draft",
                  score: 0,
                },
                ...rs,
              ]);
              setCreate(false);
              setTab("Drafts");
              setRules([firstRule("name")]);
              setPage(0);
            }}
          >
            <label className="grid gap-2">
              Workflow name
              <Input name="name" required autoFocus />
            </label>
            <DialogFooter>
              <Button>Create draft</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Health({ value, caption }: { value: number; caption?: string }) {
  return (
    <div className="min-w-24">
      <div className="flex items-center gap-2">
        <div
          role="progressbar"
          aria-label="Renewal health"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={value}
          className="h-1 flex-1 overflow-hidden rounded-full bg-muted"
        >
          <div
            className={cn(
              "h-full",
              value < 55 ? "bg-rose-500" : value < 75 ? "bg-amber-500" : "bg-emerald-500",
            )}
            style={{ width: `${value}%` }}
          />
        </div>
        <span className="text-[10px] text-muted-foreground">{value}%</span>
      </div>
      {caption && <div className="grid-secondary mt-1">{caption}</div>}
    </div>
  );
}
function Choice({
  label,
  value,
  change,
  options,
}: {
  label: string;
  value: string;
  change: (v: string) => void;
  options: string[];
}) {
  return (
    <Select value={value} onValueChange={change}>
      <SelectTrigger aria-label={label} className="h-8 min-w-40">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
function RenewalsGrid() {
  const [rows, setRows] = useState(renewalSeed);
  const [rules, setRules] = useState<FilterRule[]>([firstRule("name")]);
  const [selected, setSelected] = useState<number[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const [compact, setCompact] = useState(true);
  const [owner, setOwner] = useState("Maya Patel");
  const [stage, setStage] = useState("Preparing");
  const [details, setDetails] = useState<(typeof renewalSeed)[number] | null>(null);
  const { sort, setSort } = useSorting("Renewal");
  const owners = [...new Set(rows.map((r) => r.owner))];
  const stages = [...new Set(rows.map((r) => r.stage))];
  const fields: FilterField[] = [
    { key: "name", label: "Account" },
    { key: "stage", label: "Stage", type: "select", options: stages },
    {
      key: "risk",
      label: "Risk",
      type: "select",
      options: ["Critical", "High", "Medium", "Low"],
    },
    { key: "days", label: "Renewal window", type: "number" },
    { key: "owner", label: "Owner", type: "select", options: owners },
  ];
  const [resizable, setResizable] = useState(true);
  const [movable, setMovable] = useState(true);
  const gridColumns: FilterGridColumn<(typeof renewalSeed)[number]>[] = [
    {
      id: "_select",
      width: 40,
      cell: (r, row) => (
        <Checkbox
          aria-label={`Select ${r.name} renewal ${r.id}`}
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
        />
      ),
    },
    ...(
      [
        ["Account", "name", 389],
        ["Renewal", "days", 148],
        ["ARR", "amount", 150],
        ["Health", "health", 140],
        ["Stage", "stage", 167],
        ["Risk", "risk", 116],
      ] as const
    ).map(([c, key, width]) => ({
      id: c,
      key,
      width,
      cell: (r: (typeof renewalSeed)[number]) => (
        <>
          {c === "Account" ? (
            <div className="flex items-center gap-3">
              <Brand name={r.name} />
              <div className="font-medium">
                {r.name}
                <div className="mt-0.5 flex items-center gap-1 text-xs font-normal text-muted-foreground">
                  <Portrait name={r.owner} small />
                  {r.owner}
                  <span className="text-border">•</span>
                  {r.segment}
                </div>
              </div>
            </div>
          ) : c === "Renewal" ? (
            <>
              <span
                className={r.days <= 21 ? "text-red-500" : r.days <= 30 ? "text-amber-500" : ""}
              >
                {r.days <= 30 ? `Due in ${r.days}d` : `${r.days}d out`}
              </span>
              <div className="grid-secondary">{r.date}</div>
            </>
          ) : c === "ARR" ? (
            <>
              <span className="font-medium tabular-nums">{usd(r.amount)}</span>
              <div className={cn("grid-secondary", r.upside > 0 && "text-emerald-500")}>
                {r.upside ? "+" : ""}
                {usd(r.upside)} upside
              </div>
            </>
          ) : c === "Health" ? (
            <Health value={r.health} caption={r.healthState} />
          ) : c === "Stage" ? (
            <DotBadge>{r.stage}</DotBadge>
          ) : (
            <DotBadge dot={false} tone={r.risk}>
              {r.risk}
            </DotBadge>
          )}
        </>
      ),
    })),
    {
      id: "_actions",
      width: 40,
      cell: (r) => (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Actions for ${r.name} renewal ${r.id}`}
              >
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={() => setDetails(r)}>Open account</DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    setRows((rs) =>
                      rs.map((row) =>
                        row.id === r.id
                          ? {
                              ...row,
                              stage: "Legal review",
                              risk: "Critical",
                            }
                          : row,
                      ),
                    );
                    toast.success("Renewal escalated for review");
                  }}
                >
                  Escalate review
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => downloadCsv(`renewal-brief-${r.name}`, [r])}>
                  Create brief
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      ),
    },
  ];
  const table = useFilteringTable({
    rows,
    columns: gridColumns,
    rules,
    sort,
    onSort: setSort,
    selected,
    onSelection: setSelected,
    hidden,
    onHidden: setHidden,
  });
  const blocked = rows.filter((r) => r.health < 66 || r.risk === "Critical");
  const atRisk = rows
    .filter((r) => ["Critical", "High"].includes(r.risk))
    .reduce((sum, r) => sum + r.amount, 0);
  return (
    <>
      <FilterGrid
        table={table}
        compact={compact}
        resizable={resizable}
        movable={movable}
        className={compact ? "compact-renewals" : "comfortable-renewals"}
      >
        <Frame
          white
          title="Renewals Review"
          subtitle={`${rows.filter((r) => r.days <= 30).length} due in 30d, ${blocked.length} blocked, $${(atRisk / 1e6).toFixed(1)}M ARR at risk.`}
          action={
            <Button
              size="sm"
              onClick={() => toast.info("New renewal brief ready to connect to your workspace")}
            >
              <Plus />
              New transaction
            </Button>
          }
        >
          <div className="border-t border-b">
            <FilterBar
              className="px-5 py-3"
              clearLabel="Clear filters"
              fields={fields}
              rules={rules}
              onChange={setRules}
            >
              <FilteringSettings
                table={table}
                columns={["Renewal", "ARR", "Health", "Stage", "Risk"]}
                hidden={hidden}
                onHidden={setHidden}
                compact={compact}
                onCompact={setCompact}
                resizable={resizable}
                onResizable={setResizable}
                movable={movable}
                onMovable={setMovable}
              />
            </FilterBar>
          </div>
          {selected.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-b bg-muted/25 px-5 py-3">
              <strong className="mr-2">{selected.length} selected</strong>
              <Choice label="Assign owner" value={owner} change={setOwner} options={owners} />
              <Choice label="Set stage" value={stage} change={setStage} options={stages} />
              <Button
                onClick={() => {
                  setRows((rs) =>
                    rs.map((r) => (selected.includes(r.id) ? { ...r, owner, stage } : r)),
                  );
                  setSelected([]);
                  toast.success("Selected renewals updated");
                }}
              >
                Apply to selected
              </Button>
              <Button variant="ghost" onClick={() => setSelected([])}>
                Cancel
              </Button>
            </div>
          )}
          <div className="renewal-scroll">
            <FilterTable />{" "}
          </div>
        </Frame>
      </FilterGrid>
      <Details title="Renewal account" data={details} close={() => setDetails(null)} />
    </>
  );
}

const signalColors: Record<string, string> = {
  "Champion Change": "bg-sky-500/15 text-sky-800 dark:text-sky-300",
  "Security Review": "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  "Usage Dip": "bg-amber-500/20 text-amber-800 dark:text-amber-300",
  Procurement: "bg-cyan-500/20 text-cyan-800 dark:text-cyan-300",
  "Legal Redlines": "bg-orange-500/15 text-orange-800 dark:text-orange-300",
  "Pricing Pushback": "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  "Multi-Year Ask": "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
  "Adoption Plateau": "bg-lime-500/20 text-lime-800 dark:text-lime-300",
};
function RiskGrid() {
  const [rows, setRows] = useState(riskSeed);
  const [rules, setRules] = useState<FilterRule[]>([firstRule("name")]);
  const [pinned, setPinned] = useState<number[]>([1, 2]);
  const [hidden, setHidden] = useState<string[]>([]);
  const [compact, setCompact] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(7);
  const [details, setDetails] = useState<(typeof riskSeed)[number] | null>(null);
  const [plan, setPlan] = useState<(typeof riskSeed)[number] | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const { sort, setSort } = useSorting("Renewal");
  const signals = [...new Set(rows.flatMap((r) => r.signals))];
  const fields: FilterField[] = [
    { key: "name", label: "Account" },
    {
      key: "owner",
      label: "Owner",
      type: "select",
      options: [...new Set(rows.map((r) => r.owner))],
    },
    {
      key: "stage",
      label: "Stage",
      type: "select",
      options: [...new Set(rows.map((r) => r.stage))],
    },
    { key: "signals", label: "Signals", type: "tags", options: signals },
    { key: "alert", label: "Alerts" },
  ];
  const [resizable, setResizable] = useState(true);
  const [movable, setMovable] = useState(true);
  const gridColumns: FilterGridColumn<(typeof riskSeed)[number]>[] = [
    {
      id: "_pin",
      width: 48,
      cell: (r, row) => (
        <Button
          size="icon-sm"
          variant="ghost"
          className={cn("opacity-45 hover:opacity-100", row.getIsPinned() && "opacity-100")}
          aria-label={`${row.getIsPinned() ? "Unpin" : "Pin"} ${r.name}`}
          aria-pressed={!!row.getIsPinned()}
          onClick={() => {
            row.pin(row.getIsPinned() ? false : "top");
            setPage(0);
          }}
        >
          <Pin className={cn("size-3.5", row.getIsPinned() && "fill-current")} />
        </Button>
      ),
    },
    ...(
      [
        ["Account", "name", 324],
        ["Stage", "stage", 152],
        ["Owner", "owner", 176],
        ["Signals", "signals", 148],
        ["Health", "health", 104],
        ["ARR", "amount", 88],
        ["Renewal", "days", 114],
        ["Alerts", "issues", 300],
      ] as const
    ).map(([c, key, width]) => ({
      id: c,
      key,
      width,
      cell: (r: (typeof riskSeed)[number]) => (
        <>
          {c === "Account" ? (
            <div className="flex items-center gap-3">
              <Brand name={r.name} tile />
              <div>
                <div className="font-medium">{r.name}</div>
                <div className="grid-secondary">
                  {r.contact}
                  <span className="mx-1.5 text-border">•</span>
                  {r.job}
                </div>
                <div className="grid-secondary">
                  {r.product}
                  <span className="mx-1.5 text-border">•</span>
                  {r.seats}
                </div>
              </div>
            </div>
          ) : c === "Stage" ? (
            <DotBadge>{r.stage}</DotBadge>
          ) : c === "Owner" ? (
            <div className="flex items-center gap-2">
              <Portrait name={r.owner} />
              <div>
                {r.owner}
                <div className="grid-secondary">{r.role}</div>
              </div>
            </div>
          ) : c === "Signals" ? (
            <div className="flex w-[128px] flex-wrap gap-1">
              {r.signals.slice(0, 2).map((s) => (
                <span
                  key={s}
                  className={cn("rounded px-1.5 text-xs leading-5", signalColors[s] ?? "bg-muted")}
                >
                  {s}
                </span>
              ))}
              {r.signals.length > 2 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className="rounded border px-1 text-[10px]"
                      aria-label={`${r.signals.length - 2} more signals`}
                    >
                      +{r.signals.length - 2}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{r.signals.slice(2).join(", ")}</TooltipContent>
                </Tooltip>
              )}
            </div>
          ) : c === "Health" ? (
            <Health value={r.health} />
          ) : c === "ARR" ? (
            <span className="tabular-nums">{usd(r.amount)}</span>
          ) : c === "Renewal" ? (
            <>
              {r.date}
              <div
                className={cn("grid-secondary", r.days < 21 ? "text-rose-500" : "text-amber-500")}
              >
                {r.days} days left
              </div>
            </>
          ) : (
            <div className="max-w-72">
              <DotBadge>
                <span
                  className={
                    r.issues >= 3
                      ? "text-rose-600"
                      : r.issues === 2
                        ? "text-amber-700"
                        : "text-emerald-700"
                  }
                >
                  {r.issues} {r.issues === 1 ? "issue" : "issues"}
                </span>
              </DotBadge>
              <div className="grid-secondary truncate" title={r.alert}>
                {r.alert}
              </div>
            </div>
          )}
        </>
      ),
    })),
    {
      id: "_actions",
      width: 40,
      cell: (r, row) => (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${r.name}`}>
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={() => setDetails(r)}>Open account</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setPlan(r)}>
                  Save plan
                  {notes[r.id] && <Check className="ml-auto" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    setRows((rs) =>
                      rs.map((row) =>
                        row.id === r.id ? { ...row, stage: "Executive Review" } : row,
                      ),
                    );
                    toast.success("Account moved to Executive Review");
                  }}
                >
                  Executive review
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => row.pin(row.getIsPinned() ? false : "top")}>
                  {pinned.includes(r.id) ? <PinOff /> : <Pin />}
                  {pinned.includes(r.id) ? "Unpin account" : "Pin account"}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      ),
    },
  ];
  const table = useFilteringTable({
    rows,
    columns: gridColumns,
    rules,
    sort,
    onSort: setSort,
    page,
    onPage: setPage,
    pageSize,
    onPageSize: setPageSize,
    hidden,
    onHidden: setHidden,
    pinned,
    onPinned: setPinned,
  });
  const total = rows.reduce((sum, r) => sum + r.amount, 0);
  return (
    <>
      <FilterGrid
        table={table}
        compact={compact}
        resizable={resizable}
        movable={movable}
        className={compact ? "compact-risk" : "comfortable-risk"}
      >
        <Frame
          white
          title="Renewals Risk"
          subtitle={
            <>
              {rows.length} renewals <span className="text-border">•</span> $
              {Math.round(total / 1e6)}M ARR <span className="text-border">•</span>{" "}
              {rows.filter((r) => r.health < 40).length} critical{" "}
              <span className="text-border">•</span> {rows.filter((r) => r.days <= 30).length} in
              30d
            </>
          }
          action={
            <Button className="h-8" onClick={() => setPlan(rows[0])}>
              <Plus />
              Create save plan
            </Button>
          }
        >
          <div className="border-t border-b">
            <FilterBar
              className="px-5 py-3"
              clearLabel={rules.some((r) => r.values.length > 0) ? "Clear filters" : ""}
              fields={fields}
              rules={rules}
              onChange={(r) => {
                setRules(r);
                setPage(0);
              }}
            >
              <FilteringSettings
                table={table}
                columns={["Stage", "Owner", "Signals", "Health", "ARR", "Renewal", "Alerts"]}
                hidden={hidden}
                onHidden={setHidden}
                compact={compact}
                onCompact={setCompact}
                resizable={resizable}
                onResizable={setResizable}
                movable={movable}
                onMovable={setMovable}
              />
            </FilterBar>
          </div>
          {pinned.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/20 px-5 py-2.5 text-xs">
              <div className="flex gap-2 text-muted-foreground">
                <span className="text-[11px] uppercase">Pinned risk</span>
                <span>{pinned.length} renewals stay on top</span>
              </div>
              <span>
                {usd(rows.filter((r) => pinned.includes(r.id)).reduce((s, r) => s + r.amount, 0))}{" "}
                ARR pinned
              </span>
            </div>
          )}
          <FilterTable /> <FilterPager />
        </Frame>
      </FilterGrid>
      <Details title="Account risk overview" data={details} close={() => setDetails(null)} />
      <Dialog
        open={!!plan}
        onOpenChange={(v) => {
          if (!v) setPlan(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save plan · {plan?.name}</DialogTitle>
            <DialogDescription>
              Record a recovery plan for this account in the local preview.
            </DialogDescription>
          </DialogHeader>
          <form
            key={plan?.id}
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!plan) return;
              const note = String(new FormData(e.currentTarget).get("note") ?? "").trim();
              if (!note) return;
              setNotes((s) => ({ ...s, [plan.id]: note }));
              setRows((rs) => rs.map((r) => (r.id === plan.id ? { ...r, stage: "Save Plan" } : r)));
              setPlan(null);
              toast.success("Recovery plan saved");
            }}
          >
            <label className="grid gap-2">
              Recovery plan
              <Input
                name="note"
                required
                defaultValue={plan ? (notes[plan.id] ?? "") : ""}
                placeholder="Next action and owner..."
              />
            </label>
            <DialogFooter>
              <Button type="submit">Save plan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
export default function FilteringGrid({ block }: BlockProps) {
  return block.id === "data-grid-filtering-1" ? (
    <BillingGrid />
  ) : block.id === "data-grid-filtering-2" ? (
    <AutomationGrid />
  ) : block.id === "data-grid-filtering-3" ? (
    <RenewalsGrid />
  ) : (
    <RiskGrid />
  );
}
