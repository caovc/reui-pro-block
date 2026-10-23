import { Checkbox } from "@/components/ui/checkbox";
import { IconTile } from "@/components/reui/icon-tile";
import { useState, type Dispatch, type SetStateAction } from "react";
import { Plus, Filter, Settings2, MoreHorizontal, Building2 } from "lucide-react";
import { DomainRecordGrid, type DomainField } from "@/blocks/data/grid-advanced-model-grid";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
  FrameDescription,
} from "@/components/reui/frame";
import { Badge } from "@/components/reui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Avatar, Button, Input, ReferenceSheet } from "./shared";

export type DirectoryRecord = {
  id: string;
  name: string;
  email: string;
  account: string;
  plan: string;
  owner: string;
  lifecycle: string;
  deals: string;
  title: string;
  role: string;
  access: string;
  teams: string;
  status: string;
};
const contacts = [
  [
    "Aisha Bello",
    "aisha.bello@atlasfreight.com",
    "Atlas Freight",
    "Enterprise",
    "Sana Qureshi",
    "Customer",
    "$38K · 1 open",
  ],
  [
    "Ben Travers",
    "ben.travers@ridgelineenergy.com",
    "Ridgeline Energy",
    "Scale",
    "Sarah Chen",
    "Opportunity",
    "$67K · 1 open",
  ],
  [
    "Carla Ferreira",
    "carla.f@quantadevices.com",
    "Quanta Devices",
    "Enterprise",
    "Alex Johnson",
    "MQL",
    "No deals",
  ],
  [
    "David Okafor",
    "d.okafor@vertexhealth.io",
    "Vertex Health",
    "Growth",
    "Alex Johnson",
    "MQL",
    "No deals",
  ],
  [
    "Elena Sokolova",
    "elena.s@cobaltlogistics.com",
    "Cobalt Logistics",
    "Enterprise",
    "Sana Qureshi",
    "SQL",
    "$28K · 1 open",
  ],
  [
    "Hana Kim",
    "hana.kim@meridianretail.com",
    "Meridian Retail",
    "Scale",
    "Mira Stone",
    "Opportunity",
    "$56K · 2 open",
  ],
  [
    "Marcus Hale",
    "marcus.hale@apexmfg.com",
    "Apex Manufacturing",
    "Growth",
    "Leo Grant",
    "Customer",
    "$42K · 1 open",
  ],
  [
    "Priya Raman",
    "priya.raman@brightwave.media",
    "Brightwave Media",
    "Growth",
    "Mira Stone",
    "Opportunity",
    "$84K · 2 open",
  ],
  [
    "Ryan Mercer",
    "ryan.mercer@orbitsoftware.dev",
    "Orbit Software",
    "Scale",
    "Leo Grant",
    "SQL",
    "$31K · 1 open",
  ],
  [
    "Sofia Marchetti",
    "sofia.m@summitfinancial.com",
    "Summit Financial",
    "Starter",
    "Nora Vale",
    "Lead",
    "No deals",
  ],
  [
    "Tom Whitfield",
    "tom@cedar.example",
    "Cedar & Co",
    "Growth",
    "Diego Ramos",
    "Customer",
    "$24K · 1 open",
  ],
];
const members = [
  ["Alex Johnson", "Support Agent", "Member", "No access", "Tier 1", "Deactivated"],
  ["David Kim", "Technical Support", "Member", "Read and write", "Technical · Tier 2", "Active"],
  ["Diego Ramos", "Support Agent", "Member", "Read and write", "Tier 1 · Onboarding", "Active"],
  ["Emma Wilson", "Support Agent", "Member", "Read only", "Tier 1", "Invited"],
  ["Jamal Reid", "Escalation Engineer", "Member", "Read and write", "Tier 2 · Technical", "Active"],
  ["Kenji Tan", "Contract Agent", "Guest", "Read only", "Tier 1", "Suspended"],
  ["Leo Grant", "Support Manager", "Admin", "Full access", "Tier 2 · Escalations", "Active"],
  ["Michael Rodriguez", "Onboarding Specialist", "Member", "Read only", "Onboarding", "Active"],
  ["Mira Stone", "Head of Support", "Owner", "Full access", "Escalations · Quality", "Active"],
  [
    "Nora Vale",
    "Knowledge Base Editor",
    "Member",
    "Read and write",
    "Knowledge Base · Quality",
    "Active",
  ],
  ["Priya Patel", "Billing Specialist", "Member", "Read and write", "Billing", "Active"],
  ["Sana Qureshi", "Support Agent", "Member", "Read and write", "Technical", "Active"],
  ["Sarah Chen", "Team Lead", "Admin", "Full access", "Tier 1", "Active"],
  ["Nick Bold", "Help Desk Administrator", "Owner", "Full access", "Quality", "Active"],
  ["Olivia Martinez", "Support Agent", "Member", "Read only", "Onboarding", "Invited"],
];
const blank: DirectoryRecord = {
  id: "",
  name: "",
  email: "",
  account: "",
  plan: "Growth",
  owner: "Mira Stone",
  lifecycle: "Lead",
  deals: "No deals",
  title: "",
  role: "Member",
  access: "Read and write",
  teams: "Tier 1",
  status: "Active",
};
export function initialDirectoryRecords(team: boolean): DirectoryRecord[] {
  return team
    ? members.map(([name, title, role, access, teams, status], i) => ({
        ...blank,
        id: `member-${i}`,
        name,
        email: name.toLowerCase().replaceAll(" ", ".") + "@pulse.io",
        title,
        role,
        access,
        teams,
        status,
      }))
    : contacts.map(([name, email, account, plan, owner, lifecycle, deals], i) => ({
        ...blank,
        id: `contact-${i}`,
        name,
        email,
        account,
        plan,
        owner,
        lifecycle,
        deals,
      }));
}
function Choice({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label>
      {label}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem value={option} key={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}
export function PulseDirectory({
  team,
  query,
  setQuery,
  rows,
  setRows,
}: {
  team: boolean;
  query: string;
  setQuery: (value: string) => void;
  rows: DirectoryRecord[];
  setRows: Dispatch<SetStateAction<DirectoryRecord[]>>;
}) {
  const [hidden, setHidden] = useState<string[]>([]);
  const [filter, setFilter] = useState("All");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [selection, setSelection] = useState<string[]>([]);
  const [draft, setDraft] = useState<DirectoryRecord | null>(null);
  const editing = !!draft?.id;
  const fields: DomainField<DirectoryRecord>[] = [
    {
      id: "select",
      title: "",
      size: 35,
      value: (r) => r.id,
      render: (r, _index, row) => (
        <Checkbox
          aria-label={`Select ${r.name}`}
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
    },
    {
      id: "name",
      title: team ? "Member" : "Name",
      size: 250,
      value: (r) => r.name,
      render: (r) => (
        <span className="ct-person">
          <Avatar name={r.name} />
          <span>
            <b>{r.name}</b>
            <small>{r.email}</small>
          </span>
        </span>
      ),
    },
    ...(team
      ? [
          { id: "title", title: "Title", size: 165, value: (r: DirectoryRecord) => r.title },
          {
            id: "role",
            title: "Role",
            size: 100,
            value: (r: DirectoryRecord) => r.role,
            render: (r: DirectoryRecord) => <Badge variant="outline">{r.role}</Badge>,
          },
          { id: "access", title: "Access", size: 155, value: (r: DirectoryRecord) => r.access },
          {
            id: "teams",
            title: "Teams",
            size: 170,
            value: (r: DirectoryRecord) => r.teams,
            render: (r: DirectoryRecord) => (
              <span className="ct-record-tags">
                {r.teams.split(" · ").map((t) => (
                  <Badge variant="outline" key={t}>
                    {t}
                  </Badge>
                ))}
              </span>
            ),
          },
          {
            id: "status",
            title: "Status",
            size: 125,
            value: (r: DirectoryRecord) => r.status,
            render: (r: DirectoryRecord) => (
              <Badge variant="outline">
                <i className={"ct-record-dot " + r.status.toLowerCase()} />
                {r.status}
              </Badge>
            ),
          },
        ]
      : [
          {
            id: "account",
            title: "Account",
            size: 180,
            value: (r: DirectoryRecord) => r.account,
            render: (r: DirectoryRecord) => (
              <span className="ct-person">
                <IconTile variant="outline" className="size-7">
                  <Building2 className="size-4" />
                </IconTile>
                {r.account}
              </span>
            ),
          },
          {
            id: "plan",
            title: "Plan",
            size: 110,
            value: (r: DirectoryRecord) => r.plan,
            render: (r: DirectoryRecord) => (
              <Badge
                variant={
                  r.plan === "Scale"
                    ? "success-light"
                    : r.plan === "Growth"
                      ? "info-light"
                      : "secondary"
                }
              >
                {r.plan}
              </Badge>
            ),
          },
          {
            id: "owner",
            title: "Owner",
            size: 165,
            value: (r: DirectoryRecord) => r.owner,
            render: (r: DirectoryRecord) => (
              <span className="ct-person">
                <Avatar name={r.owner} />
                {r.owner}
              </span>
            ),
          },
          {
            id: "lifecycle",
            title: "Lifecycle",
            size: 130,
            value: (r: DirectoryRecord) => r.lifecycle,
            render: (r: DirectoryRecord) => (
              <Badge variant="outline">
                <i className={"ct-record-dot " + r.lifecycle.toLowerCase()} />
                {r.lifecycle}
              </Badge>
            ),
          },
          {
            id: "deals",
            title: "Open Deals",
            size: 120,
            value: (r: DirectoryRecord) => r.deals,
            render: (r: DirectoryRecord) => (
              <span>
                {r.deals.split(" · ")[0]}
                <small className="block ct-muted">{r.deals.split(" · ")[1]}</small>
              </span>
            ),
          },
        ]),
    {
      id: "actions",
      title: "",
      size: 45,
      value: (r) => r.id,
      render: (r) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label={`Actions for ${r.name}`}
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setDraft(r)}>
              Edit {team ? "member" : "contact"}
            </DropdownMenuItem>
            {team && (
              <DropdownMenuItem
                onClick={() =>
                  setRows((current) =>
                    current.map((item) =>
                      item.id === r.id
                        ? { ...item, status: item.status === "Active" ? "Suspended" : "Active" }
                        : item,
                    ),
                  )
                }
              >
                {r.status === "Active" ? "Suspend" : "Activate"} member
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setRows((current) => current.filter((item) => item.id !== r.id))}
            >
              Remove {team ? "member" : "contact"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
  return (
    <>
      <div className="ct-heading">
        <p>
          {team
            ? "Agents, their teams and the seats in use."
            : "The people who write in, and who owns each one."}
        </p>
      </div>
      <Frame className="ct-record-directory">
        <FrameHeader>
          <div className="ct-between">
            <div>
              <FrameTitle>{team ? "Members" : "Contacts"}</FrameTitle>
              <FrameDescription>
                {team
                  ? `${rows.filter((r) => r.status !== "Invited").length} of 80 seats`
                  : `${rows.length} contacts`}
                <span className="ml-3">
                  {team
                    ? `${rows.filter((r) => r.status === "Invited").length} pending invites`
                    : `${new Set(rows.map((r) => r.account)).size} accounts`}
                </span>
              </FrameDescription>
            </div>
            <Button onClick={() => setDraft({ ...blank })}>
              <Plus />
              {team ? "Invite people" : "Add contact"}
            </Button>
          </div>
        </FrameHeader>
        <FramePanel>
          <div className="ct-toolbar ct-record-toolbar">
            <span className="ct-record-field">{team ? "Member" : "Name"}</span>
            <span className="ct-subtle">contains</span>
            <Input
              aria-label={team ? "Search members" : "Search contacts"}
              placeholder={team ? "Search members…" : "Search contacts…"}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter />
                  {filter === "All" ? "Filters" : filter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {[
                  "All",
                  ...(team
                    ? ["Active", "Invited", "Suspended", "Deactivated"]
                    : ["Customer", "Opportunity", "MQL", "SQL", "Lead"]),
                ].map((option) => (
                  <DropdownMenuCheckboxItem
                    key={option}
                    checked={filter === option}
                    onCheckedChange={() => {
                      setFilter(option);
                      setPagination((p) => ({ ...p, pageIndex: 0 }));
                    }}
                  >
                    {option}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              onClick={() => {
                setQuery("");
                setFilter("All");
              }}
            >
              Clear
            </Button>
            <div className="ct-grow" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Settings2 />
                  Settings
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {fields
                  .filter((f) => !["name", "actions"].includes(f.id))
                  .map((field) => (
                    <DropdownMenuCheckboxItem
                      key={field.id}
                      checked={!hidden.includes(field.id)}
                      onCheckedChange={(value) =>
                        setHidden((current) =>
                          value ? current.filter((id) => id !== field.id) : [...current, field.id],
                        )
                      }
                    >
                      {field.title}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <DomainRecordGrid
            data={rows}
            fields={fields}
            search={query}
            rowFilter={(r) => filter === "All" || (team ? r.status : r.lifecycle) === filter}
            selection={selection}
            onSelectionChange={setSelection}
            hidden={hidden}
            pagination={pagination}
            onPaginationChange={setPagination}
            getRowId={(r) => r.id}
            paginationControls={{ sizes: [5, 10, 25] }}
            onRowClick={setDraft}
            layout={{ width: "auto" }}
          />
        </FramePanel>
      </Frame>
      <ReferenceSheet
        title={
          editing ? `Edit ${team ? "member" : "contact"}` : team ? "Invite people" : "Add contact"
        }
        description={
          team
            ? `Send an invite to join this help desk. ${80 - rows.length} seats left.`
            : "Add a person and their account to your help desk."
        }
        width={512}
        open={!!draft}
        onClose={() => setDraft(null)}
        footer={
          <>
            <Button variant="outline" className="flex-1" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button className="flex-1" form="ct-directory-form" type="submit">
              {editing ? "Save changes" : team ? "Send invite" : "Add contact"}
            </Button>
          </>
        }
      >
        {draft && (
          <form
            id="ct-directory-form"
            className="ct-form"
            onSubmit={(e) => {
              e.preventDefault();
              const record = {
                ...draft,
                id: draft.id || crypto.randomUUID(),
                status: team && !editing ? "Invited" : draft.status,
              };
              setRows((current) =>
                editing
                  ? current.map((r) => (r.id === record.id ? record : r))
                  : [record, ...current],
              );
              setDraft(null);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
          >
            <label>
              Full name
              <Input
                required
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </label>
            <label>
              Email
              <Input
                type="email"
                required
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              />
            </label>
            {team ? (
              <>
                <Choice
                  label="Role"
                  value={draft.role}
                  options={["Member", "Admin", "Guest"]}
                  onChange={(role) => setDraft({ ...draft, role })}
                />
                <Choice
                  label="Team"
                  value={draft.teams}
                  options={[
                    draft.teams,
                    "Tier 1",
                    "Tier 2",
                    "Technical",
                    "Billing",
                    "Onboarding",
                    "Quality",
                  ].filter((v, i, a) => a.indexOf(v) === i)}
                  onChange={(teams) => setDraft({ ...draft, teams })}
                />
                <label>
                  Job title
                  <Input
                    required
                    value={draft.title}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  />
                </label>
                <Choice
                  label="Access"
                  value={draft.access}
                  options={["Read only", "Read and write", "Full access", "No access"]}
                  onChange={(access) => setDraft({ ...draft, access })}
                />
              </>
            ) : (
              <>
                <label>
                  Account
                  <Input
                    required
                    value={draft.account}
                    onChange={(e) => setDraft({ ...draft, account: e.target.value })}
                  />
                </label>
                <Choice
                  label="Plan"
                  value={draft.plan}
                  options={["Starter", "Growth", "Scale", "Enterprise"]}
                  onChange={(plan) => setDraft({ ...draft, plan })}
                />
                <Choice
                  label="Owner"
                  value={draft.owner}
                  options={[
                    "Mira Stone",
                    "Sana Qureshi",
                    "Sarah Chen",
                    "Alex Johnson",
                    "Leo Grant",
                    "Nora Vale",
                  ]}
                  onChange={(owner) => setDraft({ ...draft, owner })}
                />
                <Choice
                  label="Lifecycle"
                  value={draft.lifecycle}
                  options={["Lead", "MQL", "SQL", "Opportunity", "Customer"]}
                  onChange={(lifecycle) => setDraft({ ...draft, lifecycle })}
                />
              </>
            )}
          </form>
        )}
      </ReferenceSheet>
    </>
  );
}
