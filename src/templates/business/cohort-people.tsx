/* eslint-disable react/only-export-components */
import { useRef, useState } from "react";
import { CohortPersonDetail } from "./cohort-person-detail";
import { PersonFieldLabel, PersonManagerPicker } from "./cohort-person-editor-fields";
import { cohortProfileData, employeeIdsByInitialName } from "./cohort-person-profile-data";
import { useFileUpload } from "@/hooks/use-file-upload";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ChevronRight, Ellipsis, Filter, Plus, RotateCcw, Save, Upload, X } from "lucide-react";
import { DomainRecordGrid, type ExpandedState } from "@/blocks/data/grid-advanced-model-grid";
import {
  ExportRows,
  GridFrame,
  GridSearch,
  TableOptions,
  TinyAvatar,
} from "@/blocks/data/grid-advanced-shared";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Choice, Tone } from "./fidelity";
import {
  Button,
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  toast,
} from "./shared";

export type CohortPerson = {
  id: string;
  externalEmployeeId: string;
  manager: string;
  name: string;
  title: string;
  department: string;
  location: string;
  start: string;
  status: string;
  roles: number;
  level?: string;
  notes: string;
  employment?: string;
  photo?: string;
  photoRemoved?: boolean;
  children?: CohortPerson[];
};
const person = (
  id: string,
  manager: string,
  name: string,
  title: string,
  department: string,
  location: string,
  start: string,
  roles = 0,
  level?: string,
): CohortPerson => ({
  id,
  externalEmployeeId: employeeIdsByInitialName[name],
  manager,
  name,
  title,
  department,
  location,
  start,
  roles,
  level,
  status: "Active",
  notes: "",
  employment: cohortProfileData({ externalEmployeeId: employeeIdsByInitialName[name] }).employment,
});
const initialPeople: CohortPerson[] = [
  person(
    "1",
    "",
    "Isabel Ferreira",
    "Founder & CEO",
    "People",
    "London",
    "2019-01-15",
    0,
    "Executive",
  ),
  person(
    "2",
    "1",
    "Amara Okafor",
    "VP Engineering",
    "Engineering",
    "London",
    "2021-03-15",
    1,
    "Vice President",
  ),
  person(
    "3",
    "1",
    "Hannah Weber",
    "Head of Product",
    "Product",
    "Berlin",
    "2021-08-02",
    1,
    "Vice President",
  ),
  person(
    "4",
    "1",
    "Elena Petrova",
    "Sales Director",
    "Sales",
    "Amsterdam",
    "2020-11-16",
    1,
    "Vice President",
  ),
  person(
    "5",
    "1",
    "Aisha Rahman",
    "Marketing Manager",
    "Marketing",
    "Dubai",
    "2023-02-06",
    0,
    "Vice President",
  ),
  person(
    "6",
    "1",
    "Grace Adeyemi",
    "CS Lead",
    "Customer Success",
    "Lagos",
    "2022-06-20",
    1,
    "Vice President",
  ),
  person(
    "7",
    "1",
    "Bruno Duarte",
    "People Partner",
    "People",
    "Lisbon",
    "2021-09-27",
    0,
    "Vice President",
  ),
  person(
    "8",
    "1",
    "Ingrid Larsen",
    "Finance Manager",
    "Finance",
    "Oslo",
    "2022-11-14",
    1,
    "Vice President",
  ),
  person("9", "2", "Daniel Reyes", "Staff Engineer", "Engineering", "Lisbon", "2022-01-10"),
  {
    ...person("10", "9", "Tomás Silva", "Engineer", "Engineering", "Lisbon", "2026-06-15"),
    status: "Probation",
  },
  {
    ...person("11", "9", "Mei Chen", "Engineer", "Engineering", "Singapore", "2026-07-13"),
    status: "Probation",
  },
  {
    ...person("12", "2", "Priya Nair", "Senior Engineer", "Engineering", "Bengaluru", "2022-09-05"),
    status: "On leave",
  },
  person("13", "3", "Marco Bianchi", "Product Manager", "Product", "Milan", "2023-04-17"),
  person("14", "3", "Sofia Lindqvist", "Design Lead", "Design", "Stockholm", "2022-02-28"),
  {
    ...person("15", "14", "Abena Mensah", "Product Designer", "Design", "Accra", "2024-01-08"),
    status: "On leave",
  },
  {
    ...person("16", "4", "James Whitfield", "Account Executive", "Sales", "London", "2023-07-24"),
    status: "Notice",
  },
  person("17", "4", "Yuki Tanaka", "Account Executive", "Sales", "Singapore", "2024-05-13"),
  person("18", "5", "Lucas Moreau", "Content Lead", "Marketing", "Paris", "2025-03-03"),
  person(
    "19",
    "6",
    "Nils Andersen",
    "Support Engineer",
    "Customer Success",
    "Copenhagen",
    "2026-07-06",
  ),
  person("20", "7", "Omar Haddad", "Talent Partner", "People", "Cairo", "2024-10-21"),
  person("21", "8", "Rafael Costa", "Financial Analyst", "Finance", "São Paulo", "2025-08-11"),
];
export function useCohortPeopleState() {
  const [people, setPeople] = useState(initialPeople);
  return { people, setPeople, reset: () => setPeople(initialPeople) };
}
export type CohortPeopleModel = ReturnType<typeof useCohortPeopleState>;
const descendants = (p: CohortPerson): number =>
  (p.children || []).reduce((n, child) => n + 1 + descendants(child), 0);
function tenure(start: string) {
  const [year, month, day] = start.split("-").map(Number);
  const years = 2026 - year - (month > 7 || (month === 7 && day > 30) ? 1 : 0);
  return years < 1 ? "Under a year" : `${years} ${years === 1 ? "year" : "years"}`;
}
function buildTree(people: CohortPerson[], manager = ""): CohortPerson[] {
  return people
    .filter((p) => p.manager === manager)
    .map((p) => ({ ...p, children: buildTree(people, p.id) }));
}
function isReport(id: string, ancestor: string, people: CohortPerson[]): boolean {
  const manager = people.find((p) => p.id === id)?.manager;
  return !!manager && (manager === ancestor || isReport(manager, ancestor, people));
}
const blankPerson: CohortPerson = {
  id: "",
  externalEmployeeId: "",
  manager: "1",
  name: "",
  title: "",
  department: "Engineering",
  location: "London",
  start: "2026-07-30",
  status: "Active",
  roles: 0,
  notes: "",
};
export function CohortPeople({
  model,
  create,
  onCreateChange,
  departmentOptions,
  organisation = "Cohort UK",
  locationOptions,
  employmentOptions,
  onTimesheet,
}: {
  model: CohortPeopleModel;
  create: boolean;
  onCreateChange: (open: boolean) => void;
  departmentOptions?: string[];
  organisation?: string;
  locationOptions?: string[];
  employmentOptions?: string[];
  onTimesheet: () => void;
}) {
  const { people, setPeople } = model;
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("All departments");
  const [hidden, setHidden] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<ExpandedState>({ "1": true });
  const [depth, setDepth] = useState(1);
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [selection, setSelection] = useState<string[]>([]);
  const [editing, setEditing] = useState<CohortPerson | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(blankPerson);
  const [remove, setRemove] = useState<CohortPerson | null>(null);
  const uploadVersion = useRef(0);
  const editorContent = useRef<HTMLDivElement>(null);
  const [uploadState, upload] = useFileUpload({
    accept: "image/*",
    maxSize: 5 * 1024 * 1024,
    onFilesAdded: ([file]) => {
      if (file?.file instanceof File) {
        const version = ++uploadVersion.current;
        const reader = new FileReader();
        reader.onload = () => {
          if (version === uploadVersion.current)
            setDraft((old) => ({ ...old, photo: String(reader.result), photoRemoved: false }));
        };
        reader.readAsDataURL(file.file);
      }
    },
  });
  const departments = [...new Set(people.map((p) => p.department))];
  const tree = buildTree(people);
  const openRoles = people.reduce((n, p) => n + p.roles, 0);
  const update = (id: string, values: Partial<CohortPerson>) =>
    setPeople((rows) => rows.map((p) => (p.id === id ? { ...p, ...values } : p)));
  function edit(p: CohortPerson) {
    uploadVersion.current++;
    upload.clearFiles();
    setDraft({ ...p, children: undefined });
    setEditing(p);
  }
  const close = () => {
    uploadVersion.current++;
    upload.clearFiles();
    onCreateChange(false);
    setEditing(null);
    setDraft(blankPerson);
  };
  const viewing = people.find((person) => person.id === viewingId);
  return (
    <>
      <GridFrame
        title="Reporting Lines"
        description={`${organisation} · 30 Jul 2026`}
        className="bt-reporting-lines"
        summary={
          <div className="bt-reporting-summary">
            {[
              ["Headcount", people.length],
              [
                "Layers",
                Math.max(
                  ...people.map((p) => {
                    let layers = 1;
                    let current = p;
                    while (current.manager) {
                      layers++;
                      current = people.find((person) => person.id === current.manager)!;
                    }
                    return layers;
                  }),
                ),
              ],
              [
                "Avg Span",
                (
                  people.filter((p) => p.manager).length /
                  Math.max(1, new Set(people.filter((p) => p.manager).map((p) => p.manager)).size)
                ).toFixed(1),
              ],
              ["Open Roles", openRoles],
            ].map(([label, value]) => (
              <span key={label}>
                {label} <b>{value}</b>
              </span>
            ))}
          </div>
        }
        actions={
          <ExportRows
            name="cohort-people"
            rows={people.map(({ name, title, department, location, status }) => ({
              name,
              title,
              department,
              location,
              status,
            }))}
          />
        }
      >
        <div className="bt-reporting-toolbar">
          <GridSearch value={query} onChange={setQuery} placeholder="Search people..." />
          <div className="bt-reporting-controls">
            <span className="text-xs text-muted-foreground">Depth</span>
            <div className="bt-depth-controls">
              {["Collapse", "1", "2", "All"].map((label, i) => (
                <Button
                  key={label}
                  size="sm"
                  variant="ghost"
                  aria-label={`Set tree depth ${label}`}
                  aria-pressed={depth === i}
                  onClick={() => {
                    setDepth(i);
                    setExpanded(
                      i === 3
                        ? true
                        : Object.fromEntries(
                            people
                              .filter(
                                (p) => i > 0 && (!p.manager || (i === 2 && p.manager === "1")),
                              )
                              .map((p) => [p.id, true]),
                          ),
                    );
                  }}
                >
                  {label}
                </Button>
              ))}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter size={14} />
                  Filter
                  {(department !== "All departments" || statusFilter !== "All statuses") &&
                    ` ${Number(department !== "All departments") + Number(statusFilter !== "All statuses")}`}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {["All departments", ...departments].map((name) => (
                  <DropdownMenuItem key={name} onSelect={() => setDepartment(name)}>
                    {department === name ? "✓ " : ""}
                    {name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                {["All statuses", "Active", "Probation", "On leave", "Notice"].map((status) => (
                  <DropdownMenuItem key={status} onSelect={() => setStatusFilter(status)}>
                    {statusFilter === status ? "✓ " : ""}
                    {status}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <TableOptions
              columns={["Department", "Location", "Reports", "Open Roles", "Tenure", "Status"]}
              hidden={hidden}
              setHidden={setHidden}
            />
          </div>
        </div>
        {(department !== "All departments" || statusFilter !== "All statuses") && (
          <div className="bt-tree-filter">
            <Tone tone="neutral">
              {department !== "All departments"
                ? `Department: ${department}`
                : `Status: ${statusFilter}`}
            </Tone>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setDepartment("All departments");
                setStatusFilter("All statuses");
              }}
            >
              Clear
            </Button>
          </div>
        )}
        {selection.length > 0 && (
          <div className="bt-tree-filter" role="status">
            {selection.length} people selected
            <Button size="sm" variant="ghost" onClick={() => setSelection([])}>
              Clear selection
            </Button>
          </div>
        )}
        <DomainRecordGrid
          data={tree}
          getSubRows={(p) => p.children}
          getRowId={(p) => p.id}
          expanded={
            query || department !== "All departments" || statusFilter !== "All statuses"
              ? true
              : expanded
          }
          onExpandedChange={setExpanded}
          search={query}
          rowFilter={(p) =>
            (department === "All departments" || p.department === department) &&
            (statusFilter === "All statuses" || p.status === statusFilter)
          }
          hidden={hidden}
          onHiddenChange={setHidden}
          selection={selection}
          onSelectionChange={setSelection}
          className="bt-reporting-grid"
          fields={[
            {
              id: "select",
              title: "",
              value: (p) => p.id,
              size: 40,
              render: (p, _i, row) => (
                <Checkbox
                  aria-label={`Select ${p.name} and reports`}
                  checked={row.getIsSomeSelected() ? "indeterminate" : row.getIsSelected()}
                  onCheckedChange={(v) => row.toggleSelected(!!v, { deselectParents: true })}
                />
              ),
            },
            {
              id: "name",
              title: "Person",
              value: (p) => p.name,
              size: 290,
              render: (p, _i, row) => (
                <div className="bt-tree-person" style={{ paddingLeft: row.depth * 20 }}>
                  <button
                    aria-label={`${row.getIsExpanded() ? "Collapse" : "Expand"} ${p.name}`}
                    aria-expanded={row.getIsExpanded()}
                    disabled={!row.getCanExpand()}
                    onClick={() => row.toggleExpanded()}
                  >
                    <ChevronRight
                      size={14}
                      style={{ transform: row.getIsExpanded() ? "rotate(90deg)" : undefined }}
                    />
                  </button>
                  {p.photo ? (
                    <img className="size-6 rounded-full object-cover" alt="" src={p.photo} />
                  ) : (
                    <TinyAvatar name={p.name} photo={!p.photoRemoved} />
                  )}
                  <div data-person-level={p.level}>
                    <span className="bt-person-name">{p.name}</span>
                    {p.level && (
                      <Tone tone={p.level === "Executive" ? "neutral" : "violet"}>{p.level}</Tone>
                    )}
                    <small>{p.title}</small>
                  </div>
                </div>
              ),
            },
            { id: "department", title: "Department", value: (p) => p.department, size: 130 },
            { id: "location", title: "Location", value: (p) => p.location, size: 110 },
            {
              id: "reports",
              title: "Reports",
              value: (p) => descendants(p),
              size: 94,
              render: (p) =>
                p.children?.length ? (
                  <span>
                    <b>{p.children.length}</b>{" "}
                    <small className="text-muted-foreground">of {descendants(p)}</small>
                  </span>
                ) : (
                  "—"
                ),
            },
            {
              id: "roles",
              title: "Open Roles",
              value: (p) => (p.id === "1" ? openRoles : p.roles),
              size: 94,
              render: (p) =>
                (p.id === "1" ? openRoles : p.roles) ? (
                  <Tone tone="amber">{p.id === "1" ? openRoles : p.roles}</Tone>
                ) : (
                  "—"
                ),
            },
            {
              id: "tenure",
              title: "Tenure",
              value: (p) => p.start,
              size: 116,
              render: (p) => (
                <div>
                  {tenure(p.start)}
                  <small className="block text-muted-foreground">
                    {new Date(p.start + "T12:00:00").toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </small>
                </div>
              ),
            },
            {
              id: "status",
              title: "Status",
              value: (p) => p.status,
              size: 112,
              render: (p) => (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button aria-label={`Change status for ${p.name}, currently ${p.status}`}>
                      <Tone
                        tone={
                          p.status === "Active"
                            ? "green"
                            : p.status === "On leave"
                              ? "amber"
                              : "neutral"
                        }
                      >
                        <i
                          className={`bt-person-status-dot ${p.status === "Active" ? "active" : "away"}`}
                        />
                        {p.status}
                      </Tone>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {["Active", "Probation", "On leave", "Notice"].map((status) => (
                      <DropdownMenuItem key={status} onSelect={() => update(p.id, { status })}>
                        {status}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ),
            },
            {
              id: "actions",
              title: "",
              value: (p) => p.id,
              size: 42,
              render: (p) => (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon-sm" variant="ghost" aria-label={`Actions for ${p.name}`}>
                      <Ellipsis size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => setViewingId(p.id)}>
                      View profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => edit(p)}>Edit person</DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() =>
                        toast.info("Change manager", {
                          description: `Move ${p.name} and ${people.filter((candidate) => isReport(candidate.id, p.id, people)).length} reports.`,
                        })
                      }
                    >
                      Change manager
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => {
                        update(p.id, { roles: p.roles + 1 });
                        toast.success(`Open role added for ${p.name}`);
                      }}
                    >
                      Open a role
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled={p.id === "1"} onSelect={() => setRemove(p)}>
                      Remove person
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ),
            },
          ]}
        />
        <footer className="bt-reporting-footer">
          <b>
            {organisation} <Tone tone="neutral">{people.length} people</Tone>
          </b>
          <span>
            <b>{openRoles}</b>
            <small>3 need attention</small>
          </span>
        </footer>
      </GridFrame>
      {viewing && (
        <CohortPersonDetail
          key={viewing.id}
          person={viewing}
          people={people}
          onClose={() => setViewingId(null)}
          onSaveNote={(notes) => update(viewing.id, { notes })}
          onTimesheet={() => {
            setViewingId(null);
            onTimesheet();
          }}
        />
      )}
      <Sheet open={create || !!editing} onOpenChange={(open) => !open && close()}>
        <SheetContent
          ref={editorContent}
          className="bt-floating-sheet bt-person-editor cohort-person-editor"
          onEscapeKeyDown={(event) => {
            // The free manager Combobox owns Escape while its local popup is open.
            if (editorContent.current?.querySelector('[data-slot="combobox-content"]'))
              event.preventDefault();
          }}
        >
          <SheetHeader>
            <SheetTitle>{editing ? `Edit ${editing.name}` : "Add a person"}</SheetTitle>
            <SheetDescription className="sr-only">
              {editing
                ? "Personal details and reporting line."
                : "Add a person to your organisation."}
            </SheetDescription>
          </SheetHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const nextEmployeeNumber =
                Math.max(
                  0,
                  ...people.map(
                    (person) => Number(person.externalEmployeeId.replace(/^p-/, "")) || 0,
                  ),
                ) + 1;
              const values = create
                ? {
                    ...draft,
                    id: `person-${crypto.randomUUID()}`,
                    externalEmployeeId: `p-${String(nextEmployeeNumber).padStart(3, "0")}`,
                  }
                : draft;
              if (create) setPeople((rows) => [...rows, values]);
              else update(values.id, values);
              close();
              toast.success(create ? "Person added" : "Person saved");
            }}
          >
            <div className="bt-person-form">
              <label>
                Photo
                <div className="bt-profile-photo">
                  {draft.photo ? (
                    <img src={draft.photo} alt="Person" />
                  ) : (
                    <TinyAvatar name={draft.name || "New person"} photo={!draft.photoRemoved} />
                  )}
                  <input
                    className="hidden"
                    {...upload.getInputProps({ "aria-label": "Upload person photo" })}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={upload.openFileDialog}>
                    <Upload size={14} />
                    Change
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      uploadVersion.current++;
                      upload.clearFiles();
                      setDraft((old) => ({ ...old, photo: "", photoRemoved: true }));
                    }}
                  >
                    <X size={14} />
                    Remove
                  </Button>
                </div>
                {uploadState.errors.map((error) => (
                  <p key={error} role="alert">
                    {error}
                  </p>
                ))}
              </label>
              {[
                ["Full name", "name"],
                ["Job title", "title"],
              ].map(([label, key]) => (
                <label key={key}>
                  <PersonFieldLabel
                    label={label === "Full name" ? "Full Name" : "Job Title"}
                    help={
                      key === "title"
                        ? "The job title shown in the directory and employee record."
                        : undefined
                    }
                  />
                  <Input
                    required
                    aria-label={label}
                    value={draft[key as "name"]}
                    onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                  />
                </label>
              ))}
              <label>
                <PersonFieldLabel
                  label="Manager"
                  help="The person this employee reports to in the organisation chart."
                />
                <PersonManagerPicker
                  value={draft.manager}
                  people={people.filter(
                    (p) => p.id !== draft.id && !isReport(p.id, draft.id, people),
                  )}
                  onChange={(manager) => setDraft({ ...draft, manager })}
                />
              </label>
              <label>
                <PersonFieldLabel
                  label="Department"
                  help="The department this person belongs to."
                />
                <Choice
                  label="Person department"
                  value={draft.department}
                  onChange={(department) => setDraft({ ...draft, department })}
                  options={departmentOptions || departments}
                />
              </label>
              <label>
                <PersonFieldLabel label="Location" />
                <Choice
                  label="Person location"
                  value={draft.location}
                  onChange={(location) => setDraft({ ...draft, location })}
                  options={locationOptions || [...new Set(people.map((p) => p.location))]}
                />
              </label>
              <label>
                <PersonFieldLabel
                  label="Employment Type"
                  help="The working arrangement for this employee’s contract."
                />
                <Choice
                  label="Employment Type"
                  value={draft.employment || "Full-time"}
                  onChange={(employment) => setDraft({ ...draft, employment })}
                  options={employmentOptions || ["Full-time", "Part-time", "Contract"]}
                />
              </label>
              <label>
                <PersonFieldLabel label="Start Date" />
                <Input
                  aria-label="Start date"
                  type="date"
                  required
                  value={draft.start}
                  onChange={(e) => setDraft({ ...draft, start: e.target.value })}
                />
              </label>
            </div>
            <div className="bt-dialog-actions">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  uploadVersion.current++;
                  setDraft(editing ? { ...editing, children: undefined } : blankPerson);
                  upload.clearFiles();
                }}
              >
                <RotateCcw size={14} />
                Reset
              </Button>
              <Button type="submit">
                {create ? <Plus size={14} /> : <Save size={14} />}
                {create ? "Add person" : "Save changes"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
      <Dialog open={!!remove} onOpenChange={(open) => !open && setRemove(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove {remove?.name}?</DialogTitle>
            <DialogDescription>
              Direct reports will move to this person's manager.
            </DialogDescription>
          </DialogHeader>
          <div className="bt-dialog-actions">
            <Button variant="outline" onClick={() => setRemove(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (remove)
                  setPeople((rows) =>
                    rows
                      .filter((p) => p.id !== remove.id)
                      .map((p) =>
                        p.manager === remove.id ? { ...p, manager: remove.manager } : p,
                      ),
                  );
                setRemove(null);
                toast.success("Person removed");
              }}
            >
              Remove person
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
