import { useState } from "react";
import { Check, X } from "lucide-react";
import {
  Button,
  Input,
  Panel,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./shared";
import { BusinessGrid } from "./grid";
import { Choice, Tone } from "./fidelity";
const seed = [
  [
    "Campaign shoot: £4,200",
    "Over the £1,000 threshold, agency invoice",
    "Expense",
    "Aisha Rahman",
    "Marketing",
    "Finance",
    "14d",
    "16 Jul",
    "Rejected",
  ],
  [
    "Right to work renewal",
    "Visa expires 30 Sep, blocks payroll if it lapses",
    "Profile change",
    "Hannah Weber",
    "Product",
    "HR admin",
    "13d",
    "17 Jul",
    "Approved",
  ],
  [
    "Promotion to Staff Engineer",
    "Level change, effective 1 Sep",
    "Compensation",
    "Amara Okafor",
    "Engineering",
    "HR admin",
    "13d",
    "17 Jul",
    "Pending",
  ],
  [
    "Offer sign-off: Account Executive",
    "Candidate holds a competing offer",
    "Offer",
    "Bruno Duarte",
    "People",
    "Department head",
    "12d",
    "18 Jul",
    "Approved",
  ],
  [
    "Developer tooling renewal: £3,600",
    "Annual licence, over the £1,000 threshold",
    "Expense",
    "Daniel Reyes",
    "Engineering",
    "Finance",
    "11d",
    "19 Jul",
    "Rejected",
  ],
  [
    "Address change",
    "Moves them into a new tax jurisdiction",
    "Profile change",
    "Yuki Tanaka",
    "Sales",
    "HR admin",
    "10d",
    "20 Jul",
    "Approved",
  ],
  [
    "Probation completion: salary review",
    "Confirmed in role on 1 Aug",
    "Compensation",
    "Mei Chen",
    "Engineering",
    "HR admin",
    "10d",
    "20 Jul",
    "Approved",
  ],
  [
    "Offer sign-off: Product Manager",
    "Above the band midpoint",
    "Offer",
    "Omar Haddad",
    "People",
    "Department head",
    "9d",
    "21 Jul",
    "Approved",
  ],
  [
    "Onsite support visit: £2,310",
    "Over the £1,000 threshold, flights and hotel",
    "Expense",
    "Grace Adeyemi",
    "Customer Success",
    "Finance",
    "8d",
    "22 Jul",
    "Pending",
  ],
  [
    "Client dinner: £1,420",
    "Over the £1,000 threshold, six attendees",
    "Expense",
    "Elena Petrova",
    "Sales",
    "Finance",
    "7d",
    "23 Jul",
    "Pending",
  ],
];
export default function CohortApprovals() {
  const [rows, setRows] = useState(seed);
  const [decision, setDecision] = useState<{ row: string[]; action: string } | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("Status");
  const [type, setType] = useState("Type");
  const filtered = rows.filter(
    (r) =>
      r.join(" ").toLowerCase().includes(q.toLowerCase()) &&
      (status === "Status" || r[8] === status) &&
      (type === "Type" || r[2] === type),
  );
  return (
    <>
      <Panel
        title="Requests"
        description="Everything raised, decided or not."
        className="bt-approval-grid"
      >
        <BusinessGrid
          headers={["Request", "Type", "Requested by", "Approver", "Waiting", "Decision", ""]}
          pageSize={10}
          toolbar={
            <>
              <Input
                aria-label="Search requests"
                placeholder="Search requests..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <Choice
                label="Status"
                value={status}
                onChange={setStatus}
                options={["Status", "Pending", "Approved", "Rejected"]}
              />
              <Choice
                label="Type"
                value={type}
                onChange={setType}
                options={["Type", "Expense", "Profile change", "Compensation", "Offer"]}
              />
            </>
          }
          rows={filtered.map((r) => [
            <span key="request">
              {r[0]}
              <small className="bt-table-sub">{r[1]}</small>
            </span>,
            <Tone key="type" tone="neutral">
              {r[2]}
            </Tone>,
            <span key="person" className="bt-product-name">
              <span className="bt-avatar">
                {r[3]
                  .split(" ")
                  .map((x) => x[0])
                  .join("")}
              </span>
              <span>
                {r[3]}
                <small className="bt-table-sub">{r[4]}</small>
              </span>
            </span>,
            r[5],
            <span key="waiting">
              {r[6]}
              <small className="bt-table-sub">{r[7]}</small>
            </span>,
            <Tone
              key="decision"
              tone={r[8] === "Approved" ? "green" : r[8] === "Rejected" ? "red" : "amber"}
            >
              {r[8]}
            </Tone>,
            <div key="actions" className="bt-pills">
              {r[8] === "Pending" && (
                <>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={"Approve: " + r[0]}
                    onClick={() => setDecision({ row: r, action: "Approve" })}
                  >
                    <Check />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={"Reject: " + r[0]}
                    onClick={() => setDecision({ row: r, action: "Reject" })}
                  >
                    <X />
                  </Button>
                </>
              )}
            </div>,
          ])}
        />
      </Panel>
      <Dialog open={!!decision} onOpenChange={(v) => !v && setDecision(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{decision?.action} this request?</DialogTitle>
            <DialogDescription>
              {decision?.row[0]}, from {decision?.row[3]}, waiting {decision?.row[6]}. This settles
              it and clears it from the queue.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecision(null)}>
              Cancel
            </Button>
            <Button
              variant={decision?.action === "Reject" ? "destructive" : "default"}
              onClick={() => {
                setRows((xs) =>
                  xs.map((x) =>
                    x === decision?.row
                      ? [...x.slice(0, 8), decision.action === "Approve" ? "Approved" : "Rejected"]
                      : x,
                  ),
                );
                setDecision(null);
              }}
            >
              {decision?.action}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
