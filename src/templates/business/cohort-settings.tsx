/* Cohort owns this model so saved settings survive navigation without browser storage. */
/* eslint-disable react/only-export-components */
import { useState, type ReactNode } from "react";
import { Ellipsis, Plus, Upload, ShieldCheck } from "lucide-react";
import { GridFrame, NumericField, TinyAvatar } from "@/blocks/data/grid-advanced-shared";
import { DomainRecordGrid } from "@/blocks/data/grid-advanced-model-grid";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useGlobalTheme, setGlobalTheme } from "@/components/site/global-theme-store";
import { useFileUpload } from "@/hooks/use-file-upload";
import { Choice } from "./fidelity";
import { Button, Input, toast } from "./shared";

export const cohortSettingsPages = [
  "Organisation",
  "Policies",
  "Approval flows",
  "Profile",
  "Preferences",
  "Security",
];
type NamedSetting = { id: string; name: string; count: number; days?: number; timezone?: string };
type SectionValue = { fields: Record<string, string>; rows?: NamedSetting[] };
type SettingsValues = Record<string, SectionValue>;
const row = (name: string, count: number, extra: Partial<NamedSetting> = {}): NamedSetting => ({
  id: name,
  name,
  count,
  ...extra,
});
const defaults: SettingsValues = {
  company: { fields: { name: "Cohort UK", month: "April", day: "6" } },
  departments: {
    fields: {},
    rows: [
      row("Engineering", 5),
      row("Product", 2),
      row("Design", 2),
      row("Sales", 3),
      row("Marketing", 2),
      row("Customer Success", 2),
      row("People", 3),
      row("Finance", 2),
    ],
  },
  locations: {
    fields: {},
    rows: [
      row("London", 0, { timezone: "Europe/London" }),
      row("Lisbon", 0, { timezone: "Europe/Lisbon" }),
      row("Berlin", 0, { timezone: "Europe/Berlin" }),
    ],
  },
  working: { fields: { days: "Mon,Tue,Wed,Thu,Fri" } },
  leave: {
    fields: {},
    rows: [
      row("Annual", 27, { days: 25 }),
      row("Sick", 4, { days: 10 }),
      row("Parental", 1, { days: 90 }),
      row("Unpaid", 2, { days: 0 }),
    ],
  },
  rules: { fields: { carry: "5" } },
  employment: { fields: {}, rows: [row("Full-time", 19), row("Part-time", 1), row("Contract", 1)] },
  approvals: {
    fields: {
      Leave: "Manager",
      Expense: "Finance",
      Offer: "Department head",
      Compensation: "HR admin",
      "Profile change": "HR admin",
    },
  },
  profile: {
    fields: { name: "Bruno Duarte", title: "People Partner", location: "Lisbon", photo: "" },
  },
};
export function useCohortSettingsState() {
  const [saved, setSaved] = useState(defaults);
  const [draft, setDraft] = useState(defaults);
  const [appearance, setAppearance] = useState("Light");
  const [twoFactor, setTwoFactor] = useState(false);
  const [sessions, setSessions] = useState([
    "MacBook Pro · Lisbon, Portugal",
    "iPhone · London, United Kingdom",
  ]);
  return {
    saved,
    setSaved,
    draft,
    setDraft,
    appearance,
    setAppearance,
    twoFactor,
    setTwoFactor,
    sessions,
    setSessions,
  };
}
export type CohortSettingsModel = ReturnType<typeof useCohortSettingsState>;
function SettingsSection({
  id,
  title,
  description,
  action,
  model,
  children,
}: {
  id: string;
  title: string;
  description: string;
  action?: ReactNode;
  model: CohortSettingsModel;
  children: ReactNode;
}) {
  const dirty = JSON.stringify(model.saved[id]) !== JSON.stringify(model.draft[id]);
  function save() {
    const rows = model.draft[id].rows;
    if ((id === "company" || id === "profile") && !model.draft[id].fields.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (rows?.some((r) => !r.name.trim())) {
      toast.error("Name is required");
      return;
    }
    if (rows && new Set(rows.map((r) => r.name.trim().toLowerCase())).size !== rows.length) {
      toast.error("Names must be unique");
      return;
    }
    model.setSaved((old) => ({ ...old, [id]: model.draft[id] }));
    toast.success(`${title} saved`);
  }
  return (
    <GridFrame
      title={title}
      description={description}
      actions={action}
      className="bt-cohort-setting-section"
    >
      {children}
      <footer className="bt-setting-save">
        <span role="status">{dirty ? "Unsaved changes" : "All changes saved"}</span>
        <div>
          <Button
            variant="outline"
            size="sm"
            disabled={!dirty}
            onClick={() => model.setDraft((old) => ({ ...old, [id]: model.saved[id] }))}
          >
            {id === "profile" ? "Reset" : "Discard"}
          </Button>
          <Button size="sm" disabled={!dirty} onClick={save}>
            Save changes
          </Button>
        </div>
      </footer>
    </GridFrame>
  );
}
function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="bt-setting-row">
      <div>
        <strong>{label}</strong>
        {description && <p>{description}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}
function EditableList({
  id,
  title,
  description,
  add,
  kind,
  model,
}: {
  id: string;
  title: string;
  description: string;
  add: string;
  kind?: "leave" | "location";
  model: CohortSettingsModel;
}) {
  const rows = model.draft[id].rows || [];
  const [editing, setEditing] = useState("");
  function update(record: NamedSetting, values: Partial<NamedSetting>) {
    model.setDraft((old) => ({
      ...old,
      [id]: {
        ...old[id],
        rows: old[id].rows?.map((r) => (r.id === record.id ? { ...r, ...values } : r)),
      },
    }));
  }
  return (
    <SettingsSection
      id={id}
      title={title}
      description={description}
      model={model}
      action={
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const key = `new-${Date.now()}`;
            model.setDraft((old) => ({
              ...old,
              [id]: {
                ...old[id],
                rows: [
                  ...(old[id].rows || []),
                  {
                    id: key,
                    name: "",
                    count: 0,
                    ...(kind === "leave" ? { days: 0 } : {}),
                    ...(kind === "location" ? { timezone: "Europe/London" } : {}),
                  },
                ],
              },
            }));
            setEditing(key);
          }}
        >
          <Plus size={14} />
          {add}
        </Button>
      }
    >
      <DomainRecordGrid
        data={rows}
        getRowId={(r) => r.id}
        fields={[
          {
            id: "name",
            title:
              kind === "leave"
                ? "Type"
                : kind === "location"
                  ? "Location"
                  : id === "employment"
                    ? "Employment type"
                    : "Department",
            value: (r) => r.name,
            size: kind === "leave" ? 200 : 420,
            render: (r) =>
              editing === r.id ? (
                <Input
                  autoFocus
                  aria-label={`${title} name`}
                  placeholder="Name is required"
                  value={r.name}
                  onChange={(e) => update(r, { name: e.target.value })}
                />
              ) : (
                <button className="bt-setting-cell" onClick={() => setEditing(r.id)}>
                  {r.name}
                </button>
              ),
          },
          ...(kind === "leave"
            ? [
                {
                  id: "days",
                  title: "Days per year",
                  value: (r: NamedSetting) => r.days || 0,
                  size: 260,
                  render: (r: NamedSetting) => (
                    <NumericField
                      label={`Days per year for ${r.name || "new leave type"}`}
                      value={r.days || 0}
                      min={0}
                      max={366}
                      onValueChange={(days) => update(r, { days })}
                    />
                  ),
                },
              ]
            : []),
          {
            id: "count",
            title: kind === "location" ? "Timezone" : kind === "leave" ? "Requests" : "People",
            value: (r) => (kind === "location" ? r.timezone || "" : r.count),
            size: kind === "location" ? 300 : 120,
            render: (r) =>
              kind === "location" ? (
                <Choice
                  label={`Timezone for ${r.name || "new location"}`}
                  value={r.timezone || "Europe/London"}
                  onChange={(timezone) => update(r, { timezone })}
                  options={[
                    "Europe/London",
                    "Europe/Lisbon",
                    "Europe/Berlin",
                    "America/New_York",
                    "Asia/Singapore",
                    "Asia/Tokyo",
                  ]}
                />
              ) : (
                <span className="bt-setting-count">{r.count || "None"}</span>
              ),
          },
          {
            id: "actions",
            title: "",
            value: (r) => r.id,
            size: 42,
            render: (r) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Actions for ${r.name || "new item"}`}
                  >
                    <Ellipsis size={15} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setEditing(r.id)}>Edit</DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() =>
                      model.setDraft((old) => ({
                        ...old,
                        [id]: {
                          ...old[id],
                          rows: old[id].rows?.filter((item) => item.id !== r.id),
                        },
                      }))
                    }
                  >
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ),
          },
        ]}
      />
    </SettingsSection>
  );
}
export function CohortSettings({
  page,
  onPage,
  model,
  onClearPeople,
  onClearHiring,
  onClearApprovals,
  onClearNotes,
  onClearLeave,
}: {
  page: string;
  onPage: (page: string) => void;
  model: CohortSettingsModel;
  onClearPeople: () => void;
  onClearHiring: () => void;
  onClearApprovals: () => void;
  onClearNotes: () => void;
  onClearLeave: () => void;
}) {
  const { theme } = useGlobalTheme();
  const [securityConfirmed, setSecurityConfirmed] = useState(false);
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [profileUpload, upload] = useFileUpload({
    accept: "image/*",
    maxSize: 5 * 1024 * 1024,
    onFilesAdded: ([file]) => {
      if (file?.file instanceof File) {
        const reader = new FileReader();
        reader.onload = () => field("profile", "photo", String(reader.result));
        reader.readAsDataURL(file.file);
      }
    },
  });
  function field(id: string, key: string, value: string) {
    model.setDraft((old) => ({
      ...old,
      [id]: { ...old[id], fields: { ...old[id].fields, [key]: value } },
    }));
  }
  const profile = model.draft.profile.fields;
  return (
    <div className="bt-cohort-settings">
      <h1>Settings</h1>
      <nav className="bt-settings-tabs" aria-label="Settings pages">
        {cohortSettingsPages.map((name) => (
          <Button
            key={name}
            variant="ghost"
            aria-current={page === name ? "page" : undefined}
            onClick={() => onPage(name)}
          >
            {name}
          </Button>
        ))}
      </nav>
      {page === "Organisation" && (
        <>
          <SettingsSection
            id="company"
            title="Company"
            description="Company details."
            model={model}
          >
            <SettingRow label="Legal name" description="The registered company name.">
              <Input
                aria-label="Legal name"
                value={model.draft.company.fields.name}
                onChange={(e) => field("company", "name", e.target.value)}
              />
            </SettingRow>
            <SettingRow
              label="Fiscal year starts"
              description="Start of the financial and leave year."
            >
              <div className="bt-fiscal-fields">
                <Choice
                  label="Fiscal year start month"
                  value={model.draft.company.fields.month}
                  onChange={(value) => field("company", "month", value)}
                  options={[
                    "January",
                    "February",
                    "March",
                    "April",
                    "May",
                    "June",
                    "July",
                    "August",
                    "September",
                    "October",
                    "November",
                    "December",
                  ]}
                />
                <NumericField
                  label="Fiscal year start day"
                  value={Number(model.draft.company.fields.day)}
                  min={1}
                  max={31}
                  onValueChange={(value) => field("company", "day", String(value))}
                />
              </div>
            </SettingRow>
          </SettingsSection>
          <EditableList
            id="departments"
            title="Departments"
            description="Departments people can belong to."
            add="Add department"
            model={model}
          />
          <EditableList
            id="locations"
            title="Locations"
            description="Offices and regions, with their timezone."
            add="Add location"
            kind="location"
            model={model}
          />
          <SettingsSection
            id="working"
            title="Working week"
            description="Days that count as working days."
            model={model}
          >
            <SettingRow
              label="Working days"
              description={`${model.draft.working.fields.days.split(",").filter(Boolean).length} days a week: ${model.draft.working.fields.days.split(",").join(", ")}`}
            >
              <div className="bt-working-days">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => {
                  const selected = model.draft.working.fields.days.split(",").includes(day);
                  return (
                    <Button
                      key={day}
                      variant={selected ? "default" : "outline"}
                      size="sm"
                      aria-pressed={selected}
                      onClick={() =>
                        field(
                          "working",
                          "days",
                          selected
                            ? model.draft.working.fields.days
                                .split(",")
                                .filter((d) => d !== day)
                                .join(",")
                            : [
                                ...model.draft.working.fields.days.split(",").filter(Boolean),
                                day,
                              ].join(","),
                        )
                      }
                    >
                      {day}
                    </Button>
                  );
                })}
              </div>
            </SettingRow>
          </SettingsSection>
        </>
      )}
      {page === "Policies" && (
        <>
          <EditableList
            id="leave"
            title="Leave types"
            description="Leave types and their yearly entitlement."
            add="Add leave type"
            kind="leave"
            model={model}
          />
          <SettingsSection
            id="rules"
            title="Leave rules"
            description="Rules that apply to every leave type."
            model={model}
          >
            <SettingRow
              label="Carry-over cap"
              description="Unused days carried into the next leave year."
            >
              <NumericField
                label="Carry-over cap"
                min={0}
                max={366}
                value={Number(model.draft.rules.fields.carry)}
                onValueChange={(value) => field("rules", "carry", String(value))}
              />
            </SettingRow>
          </SettingsSection>
          <EditableList
            id="employment"
            title="Employment types"
            description="Contract types."
            add="Add employment type"
            model={model}
          />
        </>
      )}
      {page === "Approval flows" && (
        <SettingsSection
          id="approvals"
          title="Sign-off"
          description="The role that decides each kind of request."
          model={model}
        >
          {[
            ["Leave", "Time off requests."],
            ["Expense", "Spend over the claim threshold."],
            ["Offer", "Offers to candidates."],
            ["Compensation", "Salary, band and level changes."],
            ["Profile change", "Personal and payroll data."],
          ].map(([name, description]) => (
            <SettingRow key={name} label={name} description={description}>
              <Input
                aria-label={`Approver for ${name}`}
                value={model.draft.approvals.fields[name]}
                onChange={(e) => field("approvals", name, e.target.value)}
              />
            </SettingRow>
          ))}
        </SettingsSection>
      )}
      {page === "Profile" && (
        <SettingsSection
          id="profile"
          title="Profile"
          description="How you appear across the app."
          model={model}
        >
          <div className="bt-profile-heading">Your details</div>
          <SettingRow label="Photo">
            <div className="bt-profile-photo">
              {profile.photo ? (
                <img src={profile.photo} alt="Your profile" />
              ) : (
                <TinyAvatar name={profile.name} />
              )}
              <input
                className="hidden"
                {...upload.getInputProps({ "aria-label": "Upload profile photo" })}
              />
              <Button size="sm" variant="outline" onClick={upload.openFileDialog}>
                <Upload size={14} />
                Change
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  field("profile", "photo", "");
                  upload.clearFiles();
                }}
              >
                Remove
              </Button>
            </div>
            {profileUpload.errors.map((error) => (
              <p role="alert" key={error}>
                {error}
              </p>
            ))}
          </SettingRow>
          {[
            ["Full Name", "name"],
            ["Job Title", "title"],
            ["Location", "location"],
          ].map(([label, key]) => (
            <SettingRow key={key} label={label}>
              <Input
                aria-label={label}
                value={profile[key]}
                onChange={(e) => field("profile", key, e.target.value)}
              />
            </SettingRow>
          ))}
        </SettingsSection>
      )}
      {page === "Preferences" && (
        <GridFrame
          title="Preferences"
          description="Appearance and stored data."
          className="bt-cohort-setting-section"
        >
          <SettingRow label="Appearance" description="Light, dark, or follow the system.">
            <Choice
              label="Appearance"
              value={model.appearance}
              options={["Light", "Dark", "System"]}
              onChange={(value) => {
                model.setAppearance(value);
                setGlobalTheme(
                  { ...theme, mode: value.toLowerCase() as "light" | "dark" | "system" },
                  false,
                );
              }}
            />
          </SettingRow>
          <SettingRow label="People you added" description="Added or edited by you.">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClearPeople();
                toast.success("People restored");
              }}
            >
              Clear
            </Button>
          </SettingRow>
          <SettingRow label="Approval decisions" description="Requests you approved or rejected.">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClearApprovals();
                toast.success("Approval decisions restored");
              }}
            >
              Clear
            </Button>
          </SettingRow>
          <SettingRow label="Hiring pipeline" description="Candidates you moved between stages.">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClearHiring();
                toast.success("Hiring pipeline restored");
              }}
            >
              Clear
            </Button>
          </SettingRow>
          <SettingRow label="Person notes" description="Notes on a person's record.">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClearNotes();
                toast.success("Person notes cleared");
              }}
            >
              Clear
            </Button>
          </SettingRow>
          <SettingRow label="Booked leave" description="Leave you booked, edited or cancelled.">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClearLeave();
                toast.success("Added calendar events cleared");
              }}
            >
              Clear
            </Button>
          </SettingRow>
          <SettingRow
            label="Organisation settings"
            description="Departments, locations, policies and approval flows."
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                model.setDraft(defaults);
                model.setSaved(defaults);
                toast.success("Organisation settings restored");
              }}
            >
              Restore
            </Button>
          </SettingRow>
        </GridFrame>
      )}
      {page === "Security" &&
        (!securityConfirmed ? (
          <GridFrame
            title="Confirm password"
            description="This is a secure area of the application. Please confirm your password before continuing."
            className="bt-cohort-setting-section"
          >
            <form
              className="bt-security-form"
              onSubmit={(e) => {
                e.preventDefault();
                setSecurityConfirmed(true);
                setPassword("");
              }}
            >
              <ShieldCheck size={30} />
              <label>
                Password
                <Input
                  aria-label="Confirm current password"
                  type="password"
                  required
                  minLength={4}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              <Button type="submit">Confirm password</Button>
            </form>
          </GridFrame>
        ) : (
          <>
            <GridFrame
              title="Password"
              description="Choose a strong password for your account."
              className="bt-cohort-setting-section"
            >
              <form
                className="bt-security-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newPassword !== passwordConfirmation) {
                    toast.error("Passwords must match");
                    return;
                  }
                  setNewPassword("");
                  setPasswordConfirmation("");
                  toast.success("Password updated for this demo session");
                }}
              >
                <label>
                  New password
                  <Input
                    aria-label="New password"
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </label>
                <label>
                  Confirm password
                  <Input
                    aria-label="Confirm new password"
                    type="password"
                    required
                    minLength={8}
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                  />
                </label>
                <Button type="submit">Update password</Button>
              </form>
            </GridFrame>
            <GridFrame
              title="Two-factor authentication"
              description="Protect your account with an additional verification step."
              className="bt-cohort-setting-section"
            >
              <SettingRow label={model.twoFactor ? "Enabled" : "Not enabled"}>
                <Button size="sm" onClick={() => model.setTwoFactor(!model.twoFactor)}>
                  {model.twoFactor ? "Disable" : "Enable"} two-factor authentication
                </Button>
              </SettingRow>
            </GridFrame>
            <GridFrame
              title="Browser sessions"
              description="Devices signed in to your account."
              className="bt-cohort-setting-section"
            >
              {model.sessions.map((session, i) => (
                <SettingRow
                  key={session}
                  label={session}
                  description={i === 0 ? "This device" : "Last active 2 hours ago"}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={i === 0}
                    onClick={() =>
                      model.setSessions((old) => old.filter((item) => item !== session))
                    }
                  >
                    Revoke
                  </Button>
                </SettingRow>
              ))}
            </GridFrame>
          </>
        ))}
    </div>
  );
}
