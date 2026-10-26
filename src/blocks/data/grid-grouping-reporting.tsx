import { Badge } from "@/components/reui/badge";
import { Frame, FramePanel } from "@/components/reui/frame";
import { DataGrid, DataGridContainer } from "@/components/reui/data-grid/data-grid";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import {
  DataGridTable,
  DataGridTableFootRow,
  DataGridTableFootRowCell,
} from "@/components/reui/data-grid/data-grid-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { demoAvatar } from "@/lib/demo-artwork";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Check,
  ChevronRight,
  Ellipsis,
  Filter,
  SlidersHorizontal,
  UserRound,
  UsersRound,
  UserRoundPlus,
  X,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useDomainGrid, type DomainColumn, type ExpandedState } from "./grid-advanced-model-grid";
import { Choice, ExportRows, GridSearch } from "./grid-advanced-shared";
import { cn } from "./grid-advanced-utils";
type Employee = {
  id: number;
  name: string;
  title: string;
  department: string;
  location: string;
  tenure: number;
  roles: number;
  children?: Employee[];
};
const employees: Employee[] = [
  {
    id: 1,
    name: "Mira Stone",
    title: "Chief Executive",
    department: "Executive",
    location: "Copenhagen",
    tenure: 9,
    roles: 0,
    children: [
      {
        id: 2,
        name: "Leo Grant",
        title: "VP Engineering",
        department: "Engineering",
        location: "Copenhagen",
        tenure: 8,
        roles: 2,
        children: [
          {
            id: 6,
            name: "Noah Chen",
            title: "Engineering Manager",
            department: "Engineering",
            location: "Copenhagen",
            tenure: 5,
            roles: 1,
            children: [
              {
                id: 10,
                name: "Amara Okafor",
                title: "Senior Engineer",
                department: "Engineering",
                location: "London",
                tenure: 3,
                roles: 0,
              },
              {
                id: 11,
                name: "Oliver Smith",
                title: "Platform Engineer",
                department: "Engineering",
                location: "Copenhagen",
                tenure: 2,
                roles: 0,
              },
              {
                id: 12,
                name: "Maya Patel",
                title: "Frontend Engineer",
                department: "Engineering",
                location: "London",
                tenure: 2,
                roles: 0,
              },
            ],
          },
          {
            id: 7,
            name: "Rina Holt",
            title: "Design Lead",
            department: "Design",
            location: "Copenhagen",
            tenure: 4,
            roles: 1,
            children: [
              {
                id: 13,
                name: "Noor Albright",
                title: "Product Designer",
                department: "Design",
                location: "Berlin",
                tenure: 2,
                roles: 0,
              },
              {
                id: 14,
                name: "Sora Min",
                title: "Researcher",
                department: "Design",
                location: "Copenhagen",
                tenure: 1,
                roles: 0,
              },
            ],
          },
        ],
      },
      {
        id: 3,
        name: "Emma Wilson",
        title: "VP Operations",
        department: "Operations",
        location: "Utrecht",
        tenure: 7,
        roles: 2,
        children: [
          {
            id: 8,
            name: "Evren Blake",
            title: "Operations Manager",
            department: "Operations",
            location: "Utrecht",
            tenure: 4,
            roles: 1,
            children: [
              {
                id: 15,
                name: "Alex Rivers",
                title: "Supply Analyst",
                department: "Operations",
                location: "Utrecht",
                tenure: 2,
                roles: 0,
              },
              {
                id: 16,
                name: "Jules Park",
                title: "Quality Analyst",
                department: "Operations",
                location: "Berlin",
                tenure: 1,
                roles: 0,
              },
            ],
          },
          {
            id: 9,
            name: "Sam Rivera",
            title: "Finance Lead",
            department: "Finance",
            location: "Copenhagen",
            tenure: 5,
            roles: 0,
          },
        ],
      },
      {
        id: 4,
        name: "Kenji Tan",
        title: "VP Commercial",
        department: "Commercial",
        location: "Tokyo",
        tenure: 7,
        roles: 1,
        children: [
          {
            id: 17,
            name: "Kai Nakamura",
            title: "Account Executive",
            department: "Commercial",
            location: "Tokyo",
            tenure: 3,
            roles: 0,
          },
          {
            id: 18,
            name: "Lina Meyer",
            title: "Partnerships Lead",
            department: "Commercial",
            location: "Berlin",
            tenure: 2,
            roles: 0,
          },
        ],
      },
      {
        id: 5,
        name: "Sofia Romero",
        title: "Director, People",
        department: "People",
        location: "Copenhagen",
        tenure: 6,
        roles: 1,
      },
    ],
  },
];

type EmploymentStatus = "Active" | "Onboarding" | "On leave" | "Notice";
const statusOptions: EmploymentStatus[] = ["Active", "Onboarding", "On leave", "Notice"];
function flattenPeople(nodes: Employee[]): Employee[] {
  return nodes.flatMap((person) => [person, ...flattenPeople(person.children || [])]);
}
function lineSize(person: Employee): number {
  return 1 + (person.children || []).reduce((sum, child) => sum + lineSize(child), 0);
}
function openRoles(person: Employee): number {
  return person.roles + (person.children || []).reduce((sum, child) => sum + openRoles(child), 0);
}
function layers(nodes: Employee[]): number {
  return nodes.length ? 1 + Math.max(...nodes.map((person) => layers(person.children || []))) : 0;
}
function updatePerson(
  nodes: Employee[],
  id: number,
  update: (person: Employee) => Employee,
): Employee[] {
  return nodes.map((person) =>
    person.id === id
      ? update(person)
      : {
          ...person,
          ...(person.children ? { children: updatePerson(person.children, id, update) } : {}),
        },
  );
}
function ownMatch(person: Employee, query: string) {
  const value = query.trim().toLowerCase();
  return (
    !value ||
    [person.name, person.title, person.department, person.location].some((field) =>
      field.toLowerCase().includes(value),
    )
  );
}

function reportingColumns(columns: DomainColumn<Employee>[]): DomainColumn<Employee>[] {
  return columns.map<DomainColumn<Employee>>((definition) => {
    const title = definition.header;
    if (typeof title !== "string") return definition;
    return {
      ...definition,
      id: definition.id || title,
      header: ({ column }) => (
        <DataGridColumnHeader
          column={column}
          title={title}
          className="text-sm leading-5 font-normal"
        />
      ),
      meta: {
        ...definition.meta,
        headerTitle: title,
        headerClassName: cn("text-sm leading-5 font-medium", definition.meta?.headerClassName),
      },
    };
  });
}

export default function ReportingTree() {
  const isMobile = useIsMobile(640);
  const [people, setPeople] = useState(employees);
  const [query, setQuery] = useState("");
  const [departments, setDepartments] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [statusById, setStatusById] = useState<Record<number, EmploymentStatus>>({
    11: "On leave",
    16: "Onboarding",
    18: "Notice",
  });
  const [depth, setDepth] = useState("1");
  const [expanded, setExpanded] = useState<ExpandedState>({ 1: true });
  const [selected, setSelected] = useState<string[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const [compact, setCompact] = useState(false);
  const [showTitle, setShowTitle] = useState(true);
  const [profile, setProfile] = useState<number | null>(null);
  const [profileLocation, setProfileLocation] = useState("");
  const [profileStatus, setProfileStatus] = useState<EmploymentStatus>("Active");
  const [managerTargets, setManagerTargets] = useState<number[]>([]);
  const [manager, setManager] = useState("");
  const [roleOwner, setRoleOwner] = useState<number | null>(null);
  const [roleTitle, setRoleTitle] = useState("");
  const [roleTitles, setRoleTitles] = useState<Record<number, string[]>>({});
  const [reviewIds, setReviewIds] = useState<number[]>([]);
  const [notice, setNotice] = useState("");
  const allPeople = flattenPeople(people);
  const status = useCallback((person: Employee) => statusById[person.id] || "Active", [statusById]);
  const matches = (
    person: Employee,
    nextQuery = query,
    nextDepartments = departments,
    nextStatuses = statuses,
  ) =>
    ownMatch(person, nextQuery) &&
    (!nextDepartments.length || nextDepartments.includes(person.department)) &&
    (!nextStatuses.length || nextStatuses.includes(status(person)));
  function revealMatches(nextQuery: string, nextDepartments: string[], nextStatuses: string[]) {
    if (!nextQuery.trim() && !nextDepartments.length && !nextStatuses.length) {
      setExpanded(Object.fromEntries(people.map((person) => [person.id, true])));
      setDepth("1");
      return;
    }
    const next: Record<string, boolean> = {};
    function visit(person: Employee): boolean {
      const matchedChild = (person.children || []).map(visit).some(Boolean);
      if (matchedChild) next[String(person.id)] = true;
      return matches(person, nextQuery, nextDepartments, nextStatuses) || matchedChild;
    }
    people.forEach(visit);
    setExpanded(next);
    setDepth("");
  }
  function changeQuery(value: string) {
    setQuery(value);
    revealMatches(value, departments, statuses);
  }
  function changeFacet(value: string, checked: boolean, kind: "department" | "status") {
    const current = kind === "department" ? departments : statuses;
    const next = checked ? [...current, value] : current.filter((item) => item !== value);
    if (kind === "department") setDepartments(next);
    else setStatuses(next);
    revealMatches(
      query,
      kind === "department" ? next : departments,
      kind === "status" ? next : statuses,
    );
  }
  function setTreeDepth(value: string) {
    if (!value) return;
    setDepth(value);
    const next: Record<string, boolean> = {};
    function visit(nodes: Employee[], level: number) {
      for (const person of nodes) {
        if (person.children?.length && (value === "All" || level < Number(value)))
          next[String(person.id)] = true;
        visit(person.children || [], level + 1);
      }
    }
    visit(people, 0);
    setExpanded(value === "Collapse" ? {} : next);
  }
  const openProfile = useCallback(
    (person: Employee) => {
      setProfile(person.id);
      setProfileLocation(person.location);
      setProfileStatus(status(person));
    },
    [status],
  );

  const columns = useMemo<DomainColumn<Employee>[]>(
    () =>
      reportingColumns([
        {
          id: "select",
          size: 36,
          enableSorting: false,
          enableHiding: false,
          header: ({ table }) => (
            <Checkbox
              aria-label="Select all rows"
              checked={
                table.getIsAllRowsSelected()
                  ? true
                  : table.getIsSomeRowsSelected()
                    ? "indeterminate"
                    : false
              }
              onCheckedChange={(checked) => table.toggleAllRowsSelected(!!checked)}
            />
          ),
          cell: ({ row }) => (
            <Checkbox
              aria-label={`Select ${row.original.name} and reports`}
              checked={row.getIsSomeSelected() ? "indeterminate" : row.getIsSelected()}
              onCheckedChange={(checked) =>
                row.toggleSelected(!!checked, { deselectParents: true })
              }
            />
          ),
        },
        {
          id: "name",
          header: "Person",
          accessorFn: (person) => person.name,
          size: 362,
          enableHiding: false,
          cell: ({ row }) => {
            const person = row.original;
            return (
              <div
                className="flex min-w-0 items-center gap-2"
                style={{ paddingLeft: row.depth * 20 }}
              >
                <button
                  type="button"
                  className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted disabled:invisible"
                  aria-label={`${row.getIsExpanded() ? "Collapse" : "Expand"} ${person.name}`}
                  aria-expanded={row.getIsExpanded()}
                  disabled={!row.getCanExpand()}
                  onClick={() => row.toggleExpanded()}
                >
                  <ChevronRight
                    className={cn(
                      "size-3.5 transition-transform",
                      row.getIsExpanded() && "rotate-90",
                    )}
                  />
                </button>
                <Avatar className={cn("size-7", compact && "size-6")}>
                  <AvatarImage src={demoAvatar(person.name)} alt="" />
                  <AvatarFallback>
                    {person.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <button
                      className="truncate text-left text-sm leading-4 font-semibold hover:underline"
                      onClick={() => openProfile(person)}
                    >
                      {person.name}
                    </button>
                    {person.id === 1 ? (
                      <Badge variant="outline" size="sm">
                        Executive
                      </Badge>
                    ) : person.title.startsWith("VP") ? (
                      <Badge
                        variant="outline"
                        size="sm"
                        className="border-violet-200 text-violet-700 dark:border-violet-800 dark:text-violet-300"
                      >
                        Vice President
                      </Badge>
                    ) : null}
                  </div>
                  {showTitle && (
                    <span
                      className={cn(
                        "mt-0.5 block truncate text-xs leading-4 text-muted-foreground",
                        compact && "text-[11px] leading-3",
                      )}
                    >
                      {person.title}
                    </span>
                  )}
                </div>
              </div>
            );
          },
        },
        {
          id: "department",
          header: "Department",
          accessorFn: (person) => person.department,
          size: 132,
        },
        {
          id: "location",
          header: "Location",
          accessorFn: (person) => person.location,
          size: 128,
          meta: { cellClassName: "text-muted-foreground" },
        },
        {
          id: "reports",
          header: "Reports",
          accessorFn: (person) => lineSize(person) - 1,
          size: 124,
          meta: {
            cellClassName: "text-right tabular-nums",
            headerClassName: "[&>div]:justify-end",
          },
          cell: ({ row }) =>
            row.original.children?.length ? (
              <span>
                <b className="font-semibold">{row.original.children.length}</b>
                <span className="ml-1 text-xs text-muted-foreground">
                  of {lineSize(row.original) - 1}
                </span>
              </span>
            ) : (
              <span className="text-muted-foreground">—</span>
            ),
        },
        {
          id: "roles",
          header: "Open Roles",
          accessorFn: openRoles,
          size: 116,
          meta: { cellClassName: "text-right", headerClassName: "[&>div]:justify-end" },
          cell: ({ row }) =>
            openRoles(row.original) ? (
              <Badge variant="warning-light" size="sm">
                {openRoles(row.original)}
              </Badge>
            ) : (
              <span className="text-muted-foreground">—</span>
            ),
        },
        {
          id: "tenure",
          header: "Tenure",
          accessorFn: (person) => person.tenure,
          size: 124,
          cell: ({ row }) => (
            <span className="tabular-nums leading-4">
              {row.original.tenure} years
              <span
                className={cn(
                  "mt-0.5 block text-xs leading-4 text-muted-foreground",
                  compact && "text-[11px] leading-3",
                )}
              >
                {["Mar", "May", "Nov", "Apr", "Jan"][(row.original.id - 1) % 5]}{" "}
                {2026 - row.original.tenure}
              </span>
            </span>
          ),
        },
        {
          id: "status",
          header: "Status",
          accessorFn: status,
          size: 128,
          cell: ({ row }) => (
            <Badge variant="outline" size="sm">
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  status(row.original) === "Active"
                    ? "bg-emerald-500"
                    : status(row.original) === "Onboarding"
                      ? "bg-blue-500"
                      : status(row.original) === "On leave"
                        ? "bg-amber-500"
                        : "bg-rose-500",
                )}
              />
              {status(row.original)}
            </Badge>
          ),
        },
        {
          id: "actions",
          size: 56,
          enableHiding: false,
          enableSorting: false,
          cell: ({ row }) => (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Actions for ${row.original.name}`}
                >
                  <Ellipsis className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 text-base leading-6">
                <DropdownMenuGroup>
                  <DropdownMenuItem onSelect={() => openProfile(row.original)}>
                    <UserRound className="size-4" />
                    View profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      setManagerTargets([row.original.id]);
                      setManager("");
                    }}
                  >
                    <UsersRound className="size-4" />
                    Change manager
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onSelect={() => {
                      setRoleOwner(row.original.id);
                      setRoleTitle("");
                    }}
                  >
                    <UserRoundPlus className="size-4" />
                    Open a role
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ),
        },
        {
          id: "__facet",
          accessorFn: (person) =>
            (!departments.length || departments.includes(person.department)) &&
            (!statuses.length || statuses.includes(status(person))),
          enableHiding: false,
          enableSorting: false,
        },
      ]),
    [showTitle, compact, status, openProfile, departments, statuses],
  );
  const table = useDomainGrid({
    data: people,
    columns,
    search: query,
    globalFilterFn: ownMatch,
    filters: [{ id: "__facet", value: true }],
    alwaysHidden: ["__facet"],
    hidden,
    onHiddenChange: setHidden,
    getRowId: (person) => String(person.id),
    getSubRows: (person) => person.children,
    expanded,
    onExpandedChange: (next) => {
      setExpanded(next);
      setDepth("");
    },
    selection: selected,
    onSelectionChange: setSelected,
  });
  const filteredPeople = table.getFilteredRowModel().flatRows.map((row) => row.original);
  const selectedPeople = allPeople.filter((person) => selected.includes(String(person.id)));
  const managers = allPeople.filter((person) => person.children?.length);
  const openCount = allPeople.reduce((sum, person) => sum + person.roles, 0);
  const attention = filteredPeople.filter((person) => status(person) !== "Active").length;
  const activeProfile = allPeople.find((person) => person.id === profile);
  const vacancyOwner = allPeople.find((person) => person.id === roleOwner);
  const excludedManagerIds = new Set(
    allPeople
      .filter((person) => managerTargets.includes(person.id))
      .flatMap((person) => flattenPeople([person]).map((child) => child.id)),
  );
  const managerOptions = allPeople.filter((person) => !excludedManagerIds.has(person.id));
  function moveTeam() {
    const destination = Number(manager);
    if (!managerOptions.some((person) => person.id === destination)) return;
    const roots: Employee[] = [];
    function detach(nodes: Employee[]): Employee[] {
      return nodes.flatMap((person) => {
        if (managerTargets.includes(person.id)) {
          roots.push(person);
          return [];
        }
        return [{ ...person, ...(person.children ? { children: detach(person.children) } : {}) }];
      });
    }
    const remaining = detach(people);
    setPeople(
      updatePerson(remaining, destination, (person) => ({
        ...person,
        children: [...(person.children || []), ...roots],
      })),
    );
    setExpanded((previous) => ({ ...(previous === true ? {} : previous), [destination]: true }));
    setNotice(
      `${roots.length} reporting ${roots.length === 1 ? "line moved" : "lines moved"} to ${managerOptions.find((person) => person.id === destination)?.name}.`,
    );
    setManagerTargets([]);
    setSelected([]);
  }
  return (
    <DataGrid
      table={table}
      recordCount={filteredPeople.length}
      emptyMessage="No people match your filters."
      tableLayout={{
        width: "fixed",
        rowBorder: true,
        headerBorder: true,
        headerBackground: false,
        footerBackground: true,
        dense: compact,
        headerSticky: true,
      }}
      tableClassNames={{
        bodyRow: compact ? "h-10 [&>td]:py-0.5" : "h-14",
        headerRow: "h-10",
        base: "text-sm",
      }}
    >
      <Frame
        variant="ghost"
        role="region"
        aria-label="Reporting Lines"
        className="mx-auto mt-8 w-full min-w-0 max-w-[1216px] gap-0 overflow-hidden rounded-2xl border text-sm shadow-xs max-sm:mt-12 max-sm:w-[calc(100%-72px)]"
      >
        <header className="flex min-w-0 flex-wrap items-center justify-between gap-4 px-4 py-2.5 max-sm:flex-col max-sm:items-start max-sm:pt-2 max-sm:pb-3.5">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold">Reporting Lines</h2>
            <p className="mt-px text-sm leading-5 text-muted-foreground">
              Meridian Cycles · 24 Jul 2026
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 max-sm:gap-y-3">
            {[
              ["Headcount", allPeople.length],
              ["Layers", layers(people)],
              [
                "Avg Span",
                managers.length
                  ? ((allPeople.length - people.length) / managers.length).toFixed(1)
                  : "0",
              ],
              ["Open Roles", openCount],
            ].map(([name, value]) => (
              <span
                key={name}
                className="flex items-center gap-2 text-xs text-muted-foreground sm:border-l sm:pl-3 first:border-l-0 first:pl-0"
              >
                <span className="font-medium">{name}</span>
                <Badge
                  className="text-xs font-medium"
                  size="sm"
                  variant={
                    name === "Avg Span" || name === "Open Roles" ? "warning-light" : "secondary"
                  }
                >
                  {value}
                </Badge>
              </span>
            ))}
            <span className="max-sm:basis-full">
              <ExportRows
                name="reporting-lines"
                rows={filteredPeople.map((person) => ({
                  name: person.name,
                  title: person.title,
                  department: person.department,
                  location: person.location,
                  directReports: person.children?.length || 0,
                  reports: lineSize(person) - 1,
                  openRoles: openRoles(person),
                  status: status(person),
                }))}
              />
            </span>
          </div>
        </header>
        <FramePanel className="overflow-hidden rounded-xl border p-0 shadow-none">
          <div className="flex flex-wrap items-center gap-2 border-b px-3 pt-2.5 pb-3 max-sm:gap-3 max-sm:py-3 max-sm:[&>div:has(input)]:basis-full sm:pr-4">
            <GridSearch value={query} onChange={changeQuery} placeholder="Search people..." />
            <div className="flex flex-wrap items-center gap-1.5 sm:ml-auto">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Depth</span>
                <ToggleGroup
                  type="single"
                  value={depth}
                  onValueChange={setTreeDepth}
                  variant="outline"
                  size="sm"
                  spacing={0}
                >
                  {["Collapse", "1", "2", "All"].map((value) => (
                    <ToggleGroupItem
                      key={value}
                      value={value}
                      aria-label={`Set tree depth ${value}`}
                      className="h-8 px-2.5 text-sm"
                    >
                      {value}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 text-sm">
                    <Filter className="size-4" />
                    Filter
                    {departments.length + statuses.length > 0 && (
                      <Badge size="sm" variant="secondary">
                        {departments.length + statuses.length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align={isMobile ? "start" : "end"}
                  collisionPadding={5}
                  className="w-52 text-base leading-6"
                >
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Department</DropdownMenuLabel>
                    {[...new Set(allPeople.map((person) => person.department))].map((value) => (
                      <DropdownMenuCheckboxItem
                        key={value}
                        checked={departments.includes(value)}
                        onSelect={(event) => event.preventDefault()}
                        onCheckedChange={(checked) => changeFacet(value, !!checked, "department")}
                      >
                        {value}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Status</DropdownMenuLabel>
                    {statusOptions.map((value) => (
                      <DropdownMenuCheckboxItem
                        key={value}
                        checked={statuses.includes(value)}
                        onSelect={(event) => event.preventDefault()}
                        onCheckedChange={(checked) => changeFacet(value, !!checked, "status")}
                      >
                        <span
                          className={cn(
                            "size-1.5 rounded-full",
                            value === "Active"
                              ? "bg-emerald-500"
                              : value === "Onboarding"
                                ? "bg-sky-500"
                                : value === "On leave"
                                  ? "bg-amber-500"
                                  : "bg-rose-500",
                          )}
                        />
                        {value}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuGroup>
                  {departments.length + statuses.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem
                          onSelect={() => {
                            setDepartments([]);
                            setStatuses([]);
                            revealMatches(query, [], []);
                          }}
                        >
                          Reset filters
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 text-sm">
                    <SlidersHorizontal className="size-4" />
                    Display
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align={isMobile ? "start" : "end"}
                  collisionPadding={5}
                  className="w-[300px] p-0"
                >
                  <FieldGroup className="gap-3 px-3.5 py-3">
                    <div className="flex flex-col gap-2">
                      <p className="text-xs font-medium text-muted-foreground">Table</p>
                      <Field orientation="horizontal" className="h-9 justify-between gap-3">
                        <FieldLabel className="text-sm leading-none font-normal">
                          Density
                        </FieldLabel>
                        <Choice
                          label="Row density"
                          value={compact ? "Compact" : "Comfortable"}
                          options={["Compact", "Comfortable"]}
                          onChange={(value) => setCompact(value === "Compact")}
                          className="h-7! w-[132px] shrink-0"
                        />
                      </Field>
                      <Field orientation="horizontal" className="h-9 justify-between gap-3">
                        <FieldLabel
                          htmlFor="reporting-job-title"
                          className="text-sm leading-none font-normal"
                        >
                          Job Title
                        </FieldLabel>
                        <Switch
                          id="reporting-job-title"
                          checked={showTitle}
                          onCheckedChange={setShowTitle}
                        />
                      </Field>
                    </div>
                    <FieldSeparator className="-mx-3.5" />
                    <div className="flex flex-col gap-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        Display properties
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {table
                          .getAllLeafColumns()
                          .filter((column) => column.getCanHide())
                          .map((column) => {
                            const visible = column.getIsVisible();
                            return (
                              <Button
                                key={column.id}
                                type="button"
                                size="sm"
                                variant={visible ? "secondary" : "outline"}
                                aria-pressed={visible}
                                className="rounded-full border-foreground/10"
                                onClick={() => column.toggleVisibility(!visible)}
                              >
                                {visible && <Check className="size-4" />}
                                {column.columnDef.meta?.headerTitle || column.id}
                              </Button>
                            );
                          })}
                      </div>
                    </div>
                  </FieldGroup>
                </PopoverContent>
              </Popover>
              {(query.trim() || departments.length > 0 || statuses.length > 0) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  onClick={() => {
                    setQuery("");
                    setDepartments([]);
                    setStatuses([]);
                    revealMatches("", [], []);
                  }}
                >
                  <X className="size-3.5" />
                  Clear
                </Button>
              )}
            </div>
          </div>
          {selected.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-b bg-muted/30 px-4 py-2 text-sm">
              <div role="status" className="mr-auto">
                <b className="font-semibold">{selectedPeople.length} people selected</b>
                <span className="ml-3 text-xs text-muted-foreground">
                  {query.trim() || departments.length || statuses.length
                    ? "Selecting a manager includes their current matching reports."
                    : "Selecting a manager selects their whole line."}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7"
                onClick={() => {
                  setManagerTargets(selectedPeople.map((person) => person.id));
                  setManager("");
                }}
              >
                Change manager
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7"
                onClick={() => {
                  setReviewIds((previous) => [
                    ...new Set([...previous, ...selectedPeople.map((person) => person.id)]),
                  ]);
                  setNotice(`Review started for ${selectedPeople.length} people.`);
                  setSelected([]);
                }}
              >
                Start review
              </Button>
              <ExportRows
                name="selected-reporting-lines"
                rows={selectedPeople.map((person) => ({
                  name: person.name,
                  department: person.department,
                  title: person.title,
                }))}
              />
              <Button variant="ghost" size="sm" className="h-7" onClick={() => setSelected([])}>
                Clear selection
              </Button>
            </div>
          )}
          {notice && (
            <div className="flex items-center gap-2 border-b px-4 py-2 text-xs text-muted-foreground">
              <p aria-live="polite" className="flex-1">
                {notice}
              </p>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Dismiss update"
                onClick={() => setNotice("")}
              >
                <X className="size-3" />
              </Button>
            </div>
          )}
          <DataGridContainer className="rounded-none border-0 [&_tfoot_tr]:h-9">
            <DataGridScrollArea orientation="horizontal">
              <DataGridTable
                footerContent={
                  <DataGridTableFootRow>
                    <DataGridTableFootRowCell />
                    <DataGridTableFootRowCell>
                      <span className="font-semibold">Meridian Cycles</span>
                      <Badge variant="outline" size="sm" className="ml-2 font-normal">
                        {filteredPeople.length} people
                      </Badge>
                    </DataGridTableFootRowCell>
                    {table
                      .getVisibleLeafColumns()
                      .filter((column) => !["select", "name"].includes(column.id))
                      .map((column) => (
                        <DataGridTableFootRowCell
                          key={column.id}
                          className={cn(column.id === "roles" && "text-right font-semibold")}
                        >
                          {column.id === "roles" ? (
                            filteredPeople.reduce((sum, person) => sum + person.roles, 0)
                          ) : column.id === "status" ? (
                            <span className="text-xs text-muted-foreground">
                              {attention} need attention
                            </span>
                          ) : null}
                        </DataGridTableFootRowCell>
                      ))}
                  </DataGridTableFootRow>
                }
              />
            </DataGridScrollArea>
          </DataGridContainer>
        </FramePanel>
      </Frame>
      <Dialog
        open={profile !== null}
        onOpenChange={(open) => {
          if (!open) setProfile(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{activeProfile?.name}</DialogTitle>
            <DialogDescription>
              {activeProfile?.title} · {activeProfile?.department}
            </DialogDescription>
          </DialogHeader>
          {activeProfile && (
            <div className="space-y-4">
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Direct reports</dt>
                  <dd>{activeProfile.children?.length || 0}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Reporting line</dt>
                  <dd>{lineSize(activeProfile)} people</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Open roles in line</dt>
                  <dd>{openRoles(activeProfile)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Review</dt>
                  <dd>{reviewIds.includes(activeProfile.id) ? "In progress" : "Not started"}</dd>
                </div>
              </dl>
              <label className="block space-y-1 text-sm">
                <span>Location</span>
                <Input
                  aria-label="Employee location"
                  value={profileLocation}
                  onChange={(event) => setProfileLocation(event.target.value)}
                />
              </label>
              <Choice
                label="Employment status"
                value={profileStatus}
                options={statusOptions}
                onChange={(value) => setProfileStatus(value as EmploymentStatus)}
              />
              {roleTitles[activeProfile.id]?.length > 0 && (
                <div className="text-sm">
                  <b className="font-medium">New local openings</b>
                  <ul className="mt-1 list-disc pl-4">
                    {roleTitles[activeProfile.id].map((title, index) => (
                      <li key={`${title}-${index}`}>{title}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setProfile(null)}>
              Cancel
            </Button>
            <Button
              disabled={!profileLocation.trim()}
              onClick={() => {
                if (profile === null) return;
                setPeople(
                  updatePerson(people, profile, (person) => ({
                    ...person,
                    location: profileLocation.trim(),
                  })),
                );
                setStatusById((previous) => ({ ...previous, [profile]: profileStatus }));
                setProfile(null);
                setNotice("Employee details saved locally.");
              }}
            >
              Save details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={managerTargets.length > 0}
        onOpenChange={(open) => {
          if (!open) setManagerTargets([]);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change manager</DialogTitle>
            <DialogDescription>
              Move the selected reporting lines together with their descendants. Cyclic reporting
              lines are excluded.
            </DialogDescription>
          </DialogHeader>
          {managerOptions.length ? (
            <Choice
              label="New manager"
              value={manager}
              options={managerOptions.map((person) => String(person.id))}
              labels={Object.fromEntries(
                managerOptions.map((person) => [String(person.id), person.name]),
              )}
              onChange={setManager}
              className="w-full"
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Select a reporting line below the chief executive to choose another manager.
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setManagerTargets([])}>
              Cancel
            </Button>
            <Button disabled={!manager} onClick={moveTeam}>
              Move reporting line
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={roleOwner !== null}
        onOpenChange={(open) => {
          if (!open) setRoleOwner(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Open a role</DialogTitle>
            <DialogDescription>
              Add a local opening for {vacancyOwner?.name}. Counts roll up through the reporting
              line.
            </DialogDescription>
          </DialogHeader>
          <label className="space-y-1 text-sm">
            <span>Role title</span>
            <Input
              aria-label="Role title"
              value={roleTitle}
              onChange={(event) => setRoleTitle(event.target.value)}
            />
          </label>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleOwner(null)}>
              Cancel
            </Button>
            <Button
              disabled={!roleTitle.trim()}
              onClick={() => {
                if (roleOwner === null) return;
                setPeople(
                  updatePerson(people, roleOwner, (person) => ({
                    ...person,
                    roles: person.roles + 1,
                  })),
                );
                setRoleTitles((previous) => ({
                  ...previous,
                  [roleOwner]: [...(previous[roleOwner] || []), roleTitle.trim()],
                }));
                setNotice(`Opening added for ${vacancyOwner?.name}.`);
                setRoleOwner(null);
              }}
            >
              Create opening
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DataGrid>
  );
}
