import {
  Check,
  X,
  ChevronDown,
  Banknote,
  CalendarDays,
  FileCheck,
  UserRoundPen,
} from "lucide-react";
import { Frame, FrameHeader, FrameTitle, FrameDescription } from "@/components/reui/frame";
import { Badge } from "@/components/reui/badge";
import { DomainRecordGrid, type DomainField } from "@/blocks/data/grid-advanced-model-grid";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, Button, Input } from "./shared";
import {
  type ApprovalRequest,
  type ApprovalDecision,
  type RosterApprovalsState,
} from "./roster-approvals-model";
import "./roster-approvals.css";

export function RosterApprovals({ model }: { model: RosterApprovalsState }) {
  const fields: DomainField<ApprovalRequest>[] = [
    {
      id: "request",
      title: "Request",
      value: (r) => r.title,
      size: 260,
      render: (r) => (
        <span className="ct-approval-request">
          <b>{r.title}</b>
          <small>{r.description}</small>
        </span>
      ),
    },
    {
      id: "type",
      title: "Type",
      value: (r) => r.type,
      size: 136,
      render: (r) => {
        const Icon =
          r.type === "Expense" || r.type === "Compensation"
            ? Banknote
            : r.type === "Leave"
              ? CalendarDays
              : r.type === "Offer"
                ? FileCheck
                : UserRoundPen;
        return (
          <span className="ct-toolbar gap-2">
            <Icon size={14} className="ct-muted" />
            {r.type}
          </span>
        );
      },
    },
    {
      id: "requester",
      title: "Requested by",
      value: (r) => r.requester,
      size: 174,
      render: (r) => (
        <span className="ct-person">
          <Avatar name={r.requester} />
          <span>
            {r.requester}
            <small>{r.department}</small>
          </span>
        </span>
      ),
    },
    { id: "approver", title: "Approver", value: (r) => r.approver, size: 160 },
    {
      id: "waiting",
      title: "Waiting",
      value: (r) => r.waiting,
      size: 95,
      render: (r) => (
        <span>
          {r.waiting}d<small className="block ct-muted">{r.date}</small>
        </span>
      ),
    },
    {
      id: "decision",
      title: "Decision",
      value: (r) => r.decision,
      size: 140,
      render: (r) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              aria-label={`Change decision for ${r.title}, currently ${r.decision}`}
            >
              <Badge
                variant={
                  r.decision === "Approved"
                    ? "success-light"
                    : r.decision === "Rejected"
                      ? "destructive-light"
                      : "warning-light"
                }
              >
                {r.decision}
              </Badge>
              <ChevronDown size={12} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {(["Pending", "Approved", "Rejected"] as ApprovalDecision[]).map((decision) => (
              <DropdownMenuItem key={decision} onClick={() => model.decide(r.id, decision)}>
                {decision}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
    {
      id: "actions",
      title: "",
      value: (r) => r.id,
      size: 82,
      render: (r) => (
        <div className="ct-approval-actions">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Approve: ${r.title}`}
            disabled={r.decision === "Approved"}
            onClick={() => model.decide(r.id, "Approved")}
          >
            <Check />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Reject: ${r.title}`}
            disabled={r.decision === "Rejected"}
            onClick={() => model.decide(r.id, "Rejected")}
          >
            <X />
          </Button>
        </div>
      ),
    },
  ];
  const data = model.requests.filter(
    (r) =>
      (model.status === "All" || r.decision === model.status) &&
      (model.type === "All" || r.type === model.type),
  );
  return (
    <>
      <div className="ct-heading">
        <h1>Approvals</h1>
      </div>
      <Frame dense className="ct-approvals">
        <FrameHeader>
          <FrameTitle>Requests</FrameTitle>
          <FrameDescription>Everything raised, decided or not.</FrameDescription>
        </FrameHeader>
        <div className="ct-approvals-toolbar">
          <Input
            aria-label="Search requests"
            placeholder="Search requests..."
            value={model.search}
            onChange={(e) => {
              model.setSearch(e.target.value);
              model.setPagination({ ...model.pagination, pageIndex: 0 });
            }}
          />
          {(
            [
              ["Status", model.status, model.setStatus, ["All", "Pending", "Approved", "Rejected"]],
              [
                "Type",
                model.type,
                model.setType,
                ["All", "Expense", "Profile change", "Compensation", "Offer", "Leave"],
              ],
            ] as const
          ).map(([label, value, change, options]) => (
            <Select
              key={label}
              value={value}
              onValueChange={(value) => {
                change(value);
                model.setPagination({ ...model.pagination, pageIndex: 0 });
              }}
            >
              <SelectTrigger aria-label={`Filter request ${label.toLowerCase()}`}>
                <SelectValue placeholder={label} />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option === "All" ? label : option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
          <div className="ct-grow" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Actions
                <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={() => {
                  model.setSearch("");
                  model.setStatus("All");
                  model.setType("All");
                  model.setPagination({ ...model.pagination, pageIndex: 0 });
                }}
              >
                Clear filters
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <DomainRecordGrid
          data={data}
          fields={fields}
          search={model.search}
          getRowId={(r) => r.id}
          pagination={model.pagination}
          onPaginationChange={model.setPagination}
          paginationControls={{ sizes: [10, 20, 50] }}
          className="ct-approvals-grid"
        />
      </Frame>
    </>
  );
}
