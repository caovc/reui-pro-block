import { useState } from "react";
import { Check, Copy, Mail, RefreshCw, Search, ShieldCheck, Trash2, X } from "lucide-react";
import type { BlockProps } from "@/data/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { AddButton, BlockHeading, Metric, Person, Status } from "./shared";
import { companies, downloadCsv, people } from "./data-utils";

type QueueRow = {
  id: number;
  name: string;
  detail: string;
  status: string;
  value: number;
  limit: number;
  selected: boolean;
};
export default function QueueBlock({ block }: BlockProps) {
  const coupons = block.category === "billing" && block.index === 8;
  const invites = block.category === "users" && block.index === 3;
  const access = block.category === "users" && block.index === 4;
  const dunning = block.category === "billing" && block.index === 5;
  const subscriptions = block.category === "billing" && block.index === 2;
  const initial = Array.from({ length: 8 }, (_, i): QueueRow => ({
    id: i,
    name: coupons
      ? [
          "WELCOME20",
          "SUMMER25",
          "ANNUAL10",
          "TEAM15",
          "EARLYBIRD",
          "PARTNER30",
          "LAUNCH10",
          "SAVE50",
        ][i]
      : invites || access
        ? people[i]
        : companies[i],
    detail: coupons
      ? `${[20, 25, 10, 15, 30, 30, 10, 50][i]}% off · All plans`
      : invites
        ? `${people[i].split(" ")[0].toLowerCase()}@company.com`
        : access
          ? "Production database · 4 hours"
          : dunning
            ? `INV-2026-${1042 + i}`
            : subscriptions
              ? ["Pro", "Enterprise", "Starter"][i % 3]
              : "Usage event",
    status: coupons
      ? i % 3 === 0
        ? "Expired"
        : "Active"
      : invites
        ? i % 3 === 0
          ? "Expiring soon"
          : "Pending"
        : access
          ? "Needs approval"
          : dunning
            ? i % 3 === 0
              ? "Failed"
              : "Past due"
            : subscriptions
              ? ["Active", "Trial", "Canceled"][i % 3]
              : "Paid",
    value: coupons ? 24 + i * 8 : dunning ? 149 + i * 85 : subscriptions ? 29 + i * 20 : 4 + i,
    limit: coupons ? 500 : 100,
    selected: false,
  }));
  const [rows, setRows] = useState(initial);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<QueueRow | null>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("20");
  const [reason, setReason] = useState("");
  const [expanded, setExpanded] = useState<number[]>([]);
  const [kind, setKind] = useState("Percentage");
  const filtered = rows.filter(
    (r) =>
      (filter === "All" || r.status === filter) &&
      `${r.name} ${r.detail}`.toLowerCase().includes(search.toLowerCase()),
  );
  const selected = rows.filter((r) => r.selected);
  const statusOptions = coupons
    ? ["All", "Active", "Expired"]
    : invites
      ? ["All", "Pending", "Expiring soon"]
      : access
        ? ["All", "Needs approval", "Approved", "Rejected"]
        : dunning
          ? ["All", "Past due", "Failed", "Retrying", "Paid"]
          : ["All", "Active", "Trial", "Canceled"];
  function update(id: number, status: string) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    toast.success(`Status updated to ${status.toLowerCase()}`);
  }
  function create() {
    if (!name.trim()) return;
    if (coupons && rows.some((r) => r.name.toUpperCase() === name.trim().toUpperCase())) {
      toast.error("This promotion code already exists");
      return;
    }
    const names = invites
      ? name
          .split(/[\n,;]+/)
          .map((s) => s.trim())
          .filter(Boolean)
      : [name.trim()];
    if (invites && names.some((n) => !n.includes("@"))) {
      toast.error("Enter valid email addresses separated by commas");
      return;
    }
    setRows((rs) => [
      ...names.map((n, i) => ({
        id: Date.now() + i,
        name: coupons ? n.toUpperCase() : n,
        detail: coupons
          ? `${kind === "Percentage" ? amount + "% off" : "$" + amount + " off"} · All plans`
          : invites
            ? n
            : access
              ? "Production database · 4 hours"
              : `INV-2026-${1042 + rs.length + i}`,
        status: coupons ? "Active" : invites ? "Pending" : access ? "Needs approval" : "Active",
        value: Number(amount),
        limit: 500,
        selected: false,
      })),
      ...rs,
    ]);
    setName("");
    setOpen(false);
    toast.success(
      coupons ? "Promotion created" : invites ? "Invitations added to preview" : "Record created",
    );
  }
  return (
    <div className="rounded-xl border bg-background p-6">
      <BlockHeading
        title={block.name}
        description={
          coupons
            ? "Create and manage promotional offers for your customers."
            : invites
              ? "Invite new members and track pending invitations."
              : access
                ? "Review temporary access requests and policy checks."
                : dunning
                  ? "Recover failed payments and help customers stay active."
                  : "Manage subscriptions across their lifecycle."
        }
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            downloadCsv(
              block.name,
              filtered.map((r) => ({
                name: r.name,
                detail: r.detail,
                status: r.status,
                value: r.value,
                limit: r.limit,
              })),
            )
          }
        >
          Export CSV
        </Button>
        <AddButton
          label={
            coupons
              ? "Create coupon"
              : invites
                ? "Invite members"
                : access
                  ? "Request access"
                  : "Add subscription"
          }
          onClick={() => setOpen(true)}
        />
      </BlockHeading>
      {(dunning || subscriptions) && (
        <div className="my-5 grid grid-cols-3 gap-3">
          {(dunning
            ? [
                [
                  "Past due balance",
                  `$${rows
                    .filter((r) => r.status !== "Paid")
                    .reduce((s, r) => s + r.value, 0)
                    .toLocaleString()}`,
                ],
                ["Recovery rate", "84.2%"],
                ["Accounts at risk", String(rows.filter((r) => r.status === "Failed").length)],
              ]
            : [
                ["Monthly recurring revenue", "$28,450"],
                ["Active subscriptions", String(rows.filter((r) => r.status === "Active").length)],
                ["Churn rate", "2.4%"],
              ]
          ).map(([k, v]) => (
            <Metric key={k} title={k} value={v} />
          ))}
        </div>
      )}
      <div className="my-5 flex flex-wrap items-center justify-between gap-3">
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            {statusOptions.map((s) => (
              <TabsTrigger key={s} value={s} className="text-[11px]">
                {s}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
          <Input
            aria-label="Search queue"
            placeholder="Search records..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 max-w-52 pl-8 text-xs"
          />
        </div>
      </div>
      {selected.length > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-lg bg-muted p-3 text-xs">
          <span>{selected.length} selected</span>
          <Button
            size="sm"
            onClick={() => {
              setRows((rs) =>
                rs.map((r) =>
                  r.selected
                    ? {
                        ...r,
                        status: access ? "Approved" : invites ? "Pending" : "Retrying",
                        selected: false,
                      }
                    : r,
                ),
              );
              toast.success("Bulk action completed");
            }}
          >
            {access ? "Approve selected" : invites ? "Resend invitations" : "Retry selected"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setRows((rs) => rs.filter((r) => !r.selected));
              toast.success("Selected records removed");
            }}
          >
            Remove
          </Button>
        </div>
      )}
      <div className="overflow-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-9">
                <Checkbox
                  aria-label="Select all records"
                  checked={filtered.length > 0 && filtered.every((r) => r.selected)}
                  onCheckedChange={(v) => setRows((rs) => rs.map((r) => ({ ...r, selected: !!v })))}
                />
              </TableHead>
              <TableHead className="text-[11px]">
                {coupons ? "Code" : invites || access ? "Member" : "Customer"}
              </TableHead>
              <TableHead className="text-[11px]">
                {coupons
                  ? "Redemptions"
                  : access
                    ? "Requested access"
                    : invites
                      ? "Role"
                      : "Amount"}
              </TableHead>
              <TableHead className="text-[11px]">Status</TableHead>
              <TableHead className="text-[11px]">
                {coupons ? "Expires" : access ? "Policy check" : "Updated"}
              </TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.flatMap((r, i) => [
              <TableRow key={r.id}>
                <TableCell>
                  <Checkbox
                    aria-label={`Select ${r.name}`}
                    checked={r.selected}
                    onCheckedChange={(v) =>
                      setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, selected: !!v } : x)))
                    }
                  />
                </TableCell>
                <TableCell className="py-4">
                  <div className="flex items-center gap-2">
                    {invites || access ? (
                      <Person name={r.name} small />
                    ) : (
                      <button
                        className={`text-xs font-medium hover:underline ${coupons ? "font-mono" : ""}`}
                        onClick={() => {
                          setEdit(r);
                          setName(r.name);
                          setOpen(true);
                        }}
                      >
                        {r.name}
                      </button>
                    )}
                    {coupons && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-5"
                        aria-label={`Copy ${r.name}`}
                        onClick={() => {
                          navigator.clipboard.writeText(r.name);
                          toast.success("Code copied");
                        }}
                      >
                        <Copy />
                      </Button>
                    )}
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground">{r.detail}</p>
                </TableCell>
                <TableCell>
                  {coupons ? (
                    <div className="min-w-24">
                      <div className="mb-1 flex justify-between text-[10px]">
                        <span>
                          {r.value} / {r.limit}
                        </span>
                      </div>
                      <Progress value={(r.value / r.limit) * 100} className="h-1" />
                    </div>
                  ) : access ? (
                    <Badge variant="outline">4 hours · Read only</Badge>
                  ) : invites ? (
                    <Badge variant="outline">{i % 3 === 0 ? "Admin" : "Member"}</Badge>
                  ) : (
                    <span className="text-xs tabular-nums">${r.value.toFixed(2)}</span>
                  )}
                </TableCell>
                <TableCell>
                  <Status value={r.status} />
                </TableCell>
                <TableCell className="text-[10px] text-muted-foreground">
                  {access ? (
                    <span className="flex items-center gap-1 text-foreground">
                      <ShieldCheck className="size-3" />
                      Policy passed
                    </span>
                  ) : coupons ? (
                    "Nov 30, 2026"
                  ) : (
                    "2 hours ago"
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    {access ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={r.status !== "Needs approval"}
                          onClick={() => update(r.id, "Approved")}
                        >
                          <Check />
                          Approve
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8"
                          aria-label={`Reject ${r.name}`}
                          onClick={() => {
                            setEdit(r);
                            setOpen(true);
                          }}
                        >
                          <X />
                        </Button>
                      </>
                    ) : invites ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            update(r.id, "Pending");
                            toast.success("Invitation resent in demo");
                          }}
                        >
                          <Mail />
                          Resend
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8"
                          aria-label={`Revoke ${r.name}`}
                          onClick={() => update(r.id, "Revoked")}
                        >
                          <Trash2 />
                        </Button>
                      </>
                    ) : dunning ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={r.status === "Retrying" || r.status === "Paid"}
                          onClick={() => update(r.id, "Retrying")}
                        >
                          <RefreshCw />
                          Retry now
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setExpanded((s) =>
                              s.includes(r.id) ? s.filter((x) => x !== r.id) : [...s, r.id],
                            )
                          }
                        >
                          History
                        </Button>
                      </>
                    ) : coupons ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => update(r.id, r.status === "Active" ? "Paused" : "Active")}
                      >
                        {r.status === "Active" ? "Pause" : "Activate"}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => update(r.id, r.status === "Active" ? "Paused" : "Active")}
                      >
                        {r.status === "Active" ? "Pause" : "Resume"}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>,
              expanded.includes(r.id) && (
                <TableRow key={`${r.id}-history`}>
                  <TableCell colSpan={6} className="bg-muted/30 px-10 py-4">
                    <div className="flex flex-col gap-2 text-[11px]">
                      {[
                        "Oct 18 · Attempt 1 · Card declined",
                        "Oct 20 · Attempt 2 · Insufficient funds",
                        "Oct 22 · Reminder sent to billing contact",
                      ].map((s) => (
                        <p key={s}>{s}</p>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ),
            ])}
            {!filtered.length && (
              <TableRow>
                <TableCell colSpan={6} className="py-14 text-center text-xs text-muted-foreground">
                  No records match this view.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <p className="mt-4 text-[10px] text-muted-foreground">
        {filtered.length} records · Actions update local preview data.
      </p>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) {
            setEdit(null);
            setName("");
            setReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {access && edit
                ? "Reject access request"
                : coupons
                  ? "Create promotion"
                  : invites
                    ? "Invite members"
                    : "Add record"}
            </DialogTitle>
            <DialogDescription>
              {access
                ? "Provide a reason so the requester understands the decision."
                : invites
                  ? "Enter one or more email addresses separated by commas."
                  : "Configure the details below."}
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            {access && edit ? (
              <Field>
                <FieldLabel htmlFor="access-reason">Rejection reason</FieldLabel>
                <Textarea
                  id="access-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </Field>
            ) : (
              <>
                <Field>
                  <FieldLabel htmlFor="queue-name">
                    {coupons ? "Promotion code" : invites ? "Email addresses" : "Name"}
                  </FieldLabel>
                  <Input
                    id="queue-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={
                      coupons
                        ? "WELCOME20"
                        : invites
                          ? "alex@company.com, sam@company.com"
                          : "Enter name"
                    }
                  />
                </Field>
                {coupons && (
                  <>
                    <Tabs value={kind} onValueChange={setKind}>
                      <TabsList>
                        <TabsTrigger value="Percentage">Percentage</TabsTrigger>
                        <TabsTrigger value="Fixed amount">Fixed amount</TabsTrigger>
                      </TabsList>
                    </Tabs>
                    <Field>
                      <FieldLabel htmlFor="coupon-amount">
                        Discount {kind === "Percentage" ? "(%)" : "($)"}
                      </FieldLabel>
                      <Input
                        id="coupon-amount"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Expiry date</FieldLabel>
                      <Input type="date" defaultValue="2026-11-30" />
                    </Field>
                  </>
                )}
              </>
            )}
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={access && edit ? !reason.trim() : !name.trim()}
              onClick={() => {
                if (access && edit) {
                  update(edit.id, "Rejected");
                  setOpen(false);
                  setEdit(null);
                } else create();
              }}
            >
              {access && edit
                ? "Reject request"
                : coupons
                  ? "Create coupon"
                  : invites
                    ? "Send invitations"
                    : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
