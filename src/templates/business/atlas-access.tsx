/* Model hooks keep domain edits in the owning template during navigation. */
/* eslint-disable react/only-export-components */
import { useState } from "react";
import { Plus, LockKeyhole, Pencil, ShieldCheck } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/reui/alert";
import { BusinessGrid } from "./grid";
import {
  Button,
  Input,
  Panel,
  Tabs,
  TabsList,
  TabsTrigger,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  toast,
} from "./shared";
import { Tone, Choice } from "./fidelity";

const scopes = ["Members", "Roles", "Billing", "Projects", "Settings", "Audit", "API keys", "SSO"];
const initialRoles = ["Owner", "Admin", "Member", "Billing", "Guest", "Support"];
const permissions: Record<string, string[][]> = {
  Members: [
    ["Read members", "View the directory of 12 active members"],
    ["Invite members", "Send invites that expire in 7 days"],
    ["Remove members", "Deactivate or remove a member"],
    ["Export members", "Download seat and role CSV"],
    ["Transfer owner", "Move Owner after handoff approval"],
  ],
  Roles: [
    ["Read roles", "View role definitions"],
    ["Create roles", "Add a workspace role"],
    ["Edit roles", "Change permission grants"],
    ["Delete roles", "Remove an unused role"],
  ],
  Billing: [
    ["Read billing", "View invoices and payment methods"],
    ["Manage invoices", "Download and reconcile invoices"],
    ["Manage subscription", "Change the workspace plan"],
    ["Manage payment methods", "Update billing details"],
  ],
  Projects: [
    ["Read projects", "View workspace projects"],
    ["Create projects", "Start a new project"],
    ["Edit projects", "Update project details"],
    ["Delete projects", "Archive a project"],
  ],
  Settings: [
    ["Read settings", "View workspace preferences"],
    ["Edit settings", "Change workspace preferences"],
    ["Manage integrations", "Connect a workspace integration"],
    ["Manage domains", "Verify a workspace domain"],
  ],
  Audit: [
    ["Read audit log", "Review workspace activity"],
    ["Export audit log", "Download activity history"],
    ["Manage retention", "Set the audit retention period"],
    ["Read security events", "Review authentication events"],
  ],
  "API keys": [
    ["Read API keys", "List workspace API keys"],
    ["Create API keys", "Create a scoped API key"],
    ["Rotate API keys", "Replace an active key"],
    ["Revoke API keys", "Disable an API key"],
  ],
  SSO: [
    ["Read SSO", "View identity provider settings"],
    ["Configure SSO", "Set up an identity provider"],
    ["Enforce SSO", "Require SSO for members"],
    ["Manage recovery", "Update recovery options"],
  ],
};
type Grants = Record<string, Record<string, boolean[]>>;
function defaultGrants(): Grants {
  return Object.fromEntries(
    scopes.map((scope) => [
      scope,
      Object.fromEntries(
        initialRoles.map((role, column) => [
          role,
          permissions[scope].map(
            (_, row) =>
              column < 2 ||
              row === 0 ||
              (scope === "Members" && ((column === 2 && row === 1) || (column === 3 && row === 3))),
          ),
        ]),
      ),
    ]),
  );
}
export function useAtlasRoleState() {
  const [saved, setSaved] = useState<Grants>(defaultGrants);
  const [grants, setGrants] = useState<Grants>(defaultGrants);
  return { saved, setSaved, grants, setGrants };
}
export function AtlasRoles({ model }: { model: ReturnType<typeof useAtlasRoleState> }) {
  const { saved, setSaved, grants, setGrants } = model;
  const roles = Object.keys(grants.Members);
  const [scope, setScope] = useState("Members");
  const [editing, setEditing] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const dirty = JSON.stringify(saved) !== JSON.stringify(grants);
  return (
    <Panel
      className="bt-permission-panel"
      title="Roles & Permissions"
      description={`${roles.length} roles · 33 permissions`}
      action={
        <div className="bt-pills">
          <Button variant="outline" onClick={() => setEditing(!editing)}>
            <Pencil />
            {editing ? "Editing" : "View only"}
          </Button>
          <Button onClick={() => setOpen(true)}>
            <Plus />
            Create role
          </Button>
        </div>
      }
    >
      <Tabs value={scope} onValueChange={setScope}>
        <TabsList variant="line">
          {scopes.map((item) => (
            <TabsTrigger value={item} key={item}>
              {item}
              <Tone tone="neutral">{permissions[item].length}</Tone>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="bt-permission-summary">
        <span>
          Admin grants {grants[scope].Admin.filter(Boolean).length} of {permissions[scope].length} ·{" "}
          {scope} group
        </span>
        <div className="bt-pills">
          {roles.map((role) => (
            <Tone tone={role === "Admin" ? "violet" : "neutral"} key={role}>
              {role} {grants[scope][role]?.filter(Boolean).length ?? 0}/{permissions[scope].length}
            </Tone>
          ))}
        </div>
      </div>
      <BusinessGrid
        headers={["Permission", ...roles]}
        className="bt-permission-grid"
        rows={permissions[scope].map(([permission, hint], row) => [
          <span key="permission">
            <strong>{permission}</strong>
            <small className="bt-table-sub">{hint}</small>
          </span>,
          ...roles.map((role) => (
            <Switch
              key={role}
              aria-label={`${role}: ${permission}`}
              checked={grants[scope][role]?.[row] ?? false}
              disabled={role === "Owner" || !editing}
              onCheckedChange={(value) =>
                setGrants((current) => ({
                  ...current,
                  [scope]: {
                    ...current[scope],
                    [role]: current[scope][role].map((allowed, index) =>
                      index === row ? value : allowed,
                    ),
                  },
                }))
              }
            />
          )),
        ])}
      />
      <footer className="bt-save-footer">
        <span role="status">
          <ShieldCheck size={15} />
          {dirty ? "Unsaved changes" : "All scopes saved"}
        </span>
        <div className="bt-pills">
          <Button
            variant="ghost"
            disabled={!dirty}
            onClick={() => setGrants(structuredClone(saved))}
          >
            Discard
          </Button>
          <Button
            disabled={!dirty}
            onClick={() => {
              setSaved(structuredClone(grants));
            }}
          >
            Save changes
          </Button>
        </div>
      </footer>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bt-invite-dialog">
          <DialogHeader>
            <DialogTitle>New Role</DialogTitle>
            <DialogDescription>
              Starts from the Member preset with 0 members assigned.
            </DialogDescription>
          </DialogHeader>
          <form
            className="bt-form"
            onSubmit={(event) => {
              event.preventDefault();
              const role = name.trim();
              if (!role || roles.includes(role)) return;
              setGrants((current) =>
                Object.fromEntries(
                  scopes.map((item) => [
                    item,
                    { ...current[item], [role]: [...current[item].Member] },
                  ]),
                ),
              );
              setOpen(false);
              setName("");
              setDescription("");
            }}
          >
            <label>
              Role name
              <Input value={name} onChange={(event) => setName(event.target.value)} required />
            </label>
            <label>
              Description
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>
            {roles.includes(name.trim()) && (
              <p role="alert">A role with this name already exists.</p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!name.trim() || roles.includes(name.trim())}>
                Create role
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Panel>
  );
}
const accessSeed = [
  [
    "Sana Qureshi",
    "Backend Engineer",
    "Production database",
    "Backfill failed orders after the EU webhook outage on Jun 16.",
    "4h",
    "Pending",
  ],
  [
    "David Kim",
    "DevOps",
    "Admin role",
    "Cover on-call rotation while Sarah Chen is on leave next week.",
    "7 days",
    "Pending",
  ],
  [
    "Kenji Tan",
    "Contractor",
    "Billing console",
    "Reconcile Q2 invoices flagged during the finance close.",
    "1 day",
    "Pending",
  ],
  [
    "Nora Vale",
    "Product Designer",
    "Engineering team",
    "Pair on the new onboarding flow and review staging builds.",
    "Permanent",
    "Pending",
  ],
  [
    "Omar Haddad",
    "Data Analyst",
    "Data export",
    "Build the churn cohort for the Monday revenue review.",
    "1 day",
    "Pending",
  ],
  [
    "Alex Johnson",
    "QA Engineer",
    "Feature flags",
    "Toggle the checkout experiment for the regression suite.",
    "7 days",
    "Approved",
  ],
  [
    "Emma Wilson",
    "Marketing",
    "Analytics console",
    "Pull campaign attribution for the Q3 planning deck.",
    "Permanent",
    "Approved",
  ],
  [
    "Michael Rodriguez",
    "Account Executive",
    "Billing role",
    "Issue a refund for the Northwind account dispute.",
    "4h",
    "Denied",
  ],
  [
    "Priya Patel",
    "Finance",
    "Audit log export",
    "Provide the SOC 2 auditors the Q1 access change history.",
    "1 day",
    "Expired",
  ],
  [
    "Leo Grant",
    "Eng Manager",
    "IT/Security team",
    "Join the incident bridge for the SSO certificate rotation.",
    "7 days",
    "Expired",
  ],
];
export function useAtlasAccessState() {
  return useState(accessSeed);
}
export function AtlasAccess({ model }: { model: ReturnType<typeof useAtlasAccessState> }) {
  const [requests, setRequests] = model;
  const [status, setStatus] = useState("All statuses");
  const shown = requests.filter((row) => status === "All statuses" || row[5] === status);
  return (
    <Panel
      title="Access Requests"
      description="Review and approve workspace access requests."
      className="bt-access-panel"
      action={
        <Tone tone="amber">{requests.filter((row) => row[5] === "Pending").length} pending</Tone>
      }
    >
      <Alert variant="default">
        <LockKeyhole />
        <AlertDescription>
          Access requests are reviewed against workspace policies. Production database access
          requires a time-limited approval.
        </AlertDescription>
      </Alert>
      <BusinessGrid
        selectable
        settings
        pageSize={10}
        toolbar={
          <Choice
            label="Status"
            value={status}
            onChange={setStatus}
            options={["All statuses", "Pending", "Approved", "Denied", "Expired"]}
          />
        }
        headers={["Requester", "Requested Access", "Reason", "Duration", "Status", "Actions"]}
        rows={shown.map((row) => [
          <span key="requester">
            <strong>{row[0]}</strong>
            <small className="bt-table-sub">{row[1]}</small>
          </span>,
          row[2],
          row[3],
          row[4],
          <Tone
            key="status"
            tone={row[5] === "Approved" ? "green" : row[5] === "Denied" ? "red" : "neutral"}
          >
            {row[5]}
          </Tone>,
          row[5] === "Pending" ? (
            <div className="bt-pills" key="actions">
              {["Deny", "Approve"].map((decision) => (
                <Button
                  key={decision}
                  variant={decision === "Deny" ? "outline" : "default"}
                  size="sm"
                  onClick={() => {
                    setRequests((current) =>
                      current.map((request) =>
                        request[0] === row[0]
                          ? [...request.slice(0, 5), decision === "Approve" ? "Approved" : "Denied"]
                          : request,
                      ),
                    );
                    toast.success(decision === "Approve" ? "Request approved" : "Request denied", {
                      description: `${row[2]} ${decision === "Approve" ? "granted to" : "denied for"} ${row[0]} for ${row[4]}.`,
                    });
                  }}
                >
                  {decision}
                </Button>
              ))}
            </div>
          ) : (
            "—"
          ),
        ])}
      />
    </Panel>
  );
}

const auditSeed = [
  [
    "EVT-4822",
    "Delete production API key prod-key-4f9c",
    "Flagged",
    "API Keys",
    "Maya Perez",
    "Security admin",
    "iam.keys.delete",
    "09:46 today",
  ],
  [
    "EVT-4819",
    "Bulk export of 1,847 customer records",
    "Escalated",
    "Data Export",
    "Lara Chen",
    "Support lead",
    "data.export.customers",
    "09:34 today",
  ],
  [
    "EVT-4815",
    "Access billing ledger for Globex",
    "Flagged",
    "Billing",
    "Noa Kim",
    "Platform engineer",
    "sso.verify",
    "09:21 today",
  ],
  [
    "EVT-4811",
    "Bulk role change on 380 accounts",
    "Flagged",
    "User Management",
    "Emil Novak",
    "Database admin",
    "iam.roles.bulk_update",
    "09:02 today",
  ],
  [
    "EVT-4808",
    "Grant admin role to 3 contractors",
    "Flagged",
    "Security Policy",
    "Pavel Singh",
    "Growth engineer",
    "policy.evaluate",
    "08:11 today",
  ],
  [
    "EVT-4806",
    "Repeated failed sign-in attempts",
    "Flagged",
    "Access Control",
    "Jonas Reed",
    "Compliance reviewer",
    "auth.signin",
    "07:24 today",
  ],
  [
    "EVT-4804",
    "Rotate sandbox API token",
    "Resolved",
    "API Keys",
    "Maya Perez",
    "Security admin",
    "iam.keys.rotate",
    "07:02 today",
  ],
  [
    "EVT-4801",
    "Export weekly billing statement",
    "Resolved",
    "Billing",
    "Lara Chen",
    "Support lead",
    "billing.export",
    "06:40 today",
  ],
];
export function useAtlasAuditState() {
  return useState(auditSeed);
}
export function AtlasAudit({ model }: { model: ReturnType<typeof useAtlasAuditState> }) {
  const [rows, setRows] = model;
  const [category, setCategory] = useState("All Categories");
  const [status, setStatus] = useState("All Statuses");
  const [selected, setSelected] = useState<string[] | null>(null);
  return (
    <Panel
      title="Audit Log"
      description="About 120 events today across 6 categories"
      className="bt-audit-panel"
      action={
        <Choice
          label="Audit category"
          value={category}
          onChange={setCategory}
          options={["All Categories", ...new Set(auditSeed.map((row) => row[3]))]}
        />
      }
    >
      <div className="bt-audit-metrics">
        {[
          ["Flagged", "Open events", rows.filter((row) => row[2] !== "Resolved").length],
          ["Actors", "Involved", "6"],
          ["Throttled", "Rate limited", "3"],
          ["Resolved", "Closed out", rows.filter((row) => row[2] === "Resolved").length],
        ].map(([name, detail, value]) => (
          <div key={name}>
            <strong>{name}</strong>
            <small>{detail}</small>
            <b>{value}</b>
          </div>
        ))}
      </div>
      <BusinessGrid
        pageSize={6}
        settings
        toolbar={
          <Choice
            label="Audit status"
            value={status}
            onChange={setStatus}
            options={["All Statuses", "Flagged", "Escalated", "Resolved"]}
          />
        }
        headers={["Event", "Status", "Category", "Actor", "Resource", "Timestamp"]}
        rows={rows
          .filter(
            (row) =>
              (category === "All Categories" || row[3] === category) &&
              (status === "All Statuses" || row[2] === status),
          )
          .map((row) => [
            <button className="text-left" key="event" onClick={() => setSelected(row)}>
              <strong>{row[1]}</strong>
              <small className="bt-table-sub">{row[0]}</small>
            </button>,
            <Tone
              key="status"
              tone={row[2] === "Resolved" ? "green" : row[2] === "Escalated" ? "red" : "amber"}
            >
              {row[2]}
            </Tone>,
            row[3],
            <span key="actor">
              {row[4]}
              <small className="bt-table-sub">{row[5]}</small>
            </span>,
            row[6],
            row[7],
          ])}
      />
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected?.[1]}</DialogTitle>
            <DialogDescription>
              {selected?.[0]} · {selected?.[3]}
            </DialogDescription>
          </DialogHeader>
          <dl className="bt-audit-detail">
            <dt>Actor</dt>
            <dd>{selected?.[4]}</dd>
            <dt>Resource</dt>
            <dd>{selected?.[6]}</dd>
            <dt>Timestamp</dt>
            <dd>{selected?.[7]}</dd>
            <dt>Status</dt>
            <dd>{selected?.[2]}</dd>
          </dl>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>
              Close
            </Button>
            <Button
              disabled={selected?.[2] === "Resolved"}
              onClick={() => {
                setRows((current) =>
                  current.map((row) =>
                    row[0] === selected?.[0]
                      ? row.map((value, index) => (index === 2 ? "Resolved" : value))
                      : row,
                  ),
                );
                setSelected(null);
              }}
            >
              Mark resolved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Panel>
  );
}
