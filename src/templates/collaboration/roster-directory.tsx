import {
  organization,
  departments,
  person,
  rosterPersonNames,
  type Person,
} from "./roster-directory-data";
import type { ImportedPerson } from "./roster-import-model";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { ChevronDown, ChevronRight, Filter, Settings2 } from "lucide-react";
import {
  DomainRecordGrid,
  type DomainField,
  type ExpandedState,
} from "@/blocks/data/grid-advanced-model-grid";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
  FrameDescription,
} from "@/components/reui/frame";
import { Badge } from "@/components/reui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, Button, Input, Export } from "./shared";
import "./roster-directory.css";

function flatten(rows: Person[]): Person[] {
  return rows.flatMap((row) => [row, ...flatten(row.children || [])]);
}
export function RosterDirectory({
  query,
  setQuery,
  onOpen,
  extras = [],
  imports = [],
}: {
  query: string;
  setQuery: (value: string) => void;
  onOpen: (value: string[]) => void;
  extras?: string[][];
  imports?: ImportedPerson[];
}) {
  const [expanded, setExpanded] = useState<ExpandedState>({ [organization.id]: true });
  const [depth, setDepth] = useState("1");
  const [department, setDepartment] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [selection, setSelection] = useState<string[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const applyUpdates = (row: Person): Person => {
    const update = imports
      .slice()
      .reverse()
      .find((item) => item.update && item.values[1].toLowerCase() === row.values[0].toLowerCase());
    return {
      ...row,
      values: update
        ? [
            update.values[1],
            update.values[2],
            update.values[3],
            update.values[4],
            ...row.values.slice(4, 7),
            update.values[6],
            row.values[8],
          ]
        : row.values,
      children: row.children?.map(applyUpdates),
    };
  };
  const data = [
    applyUpdates(organization),
    ...imports
      .filter(
        (item) =>
          !item.update ||
          !rosterPersonNames.some((name) => name.toLowerCase() === item.values[1].toLowerCase()),
      )
      .map((item) => ({
        ...person(
          item.values[1],
          item.values[2],
          item.values[3],
          item.values[4],
          "—",
          "—",
          "New",
          item.values[6],
        ),
        id: item.id,
      })),
    ...extras
      .filter((row) => ["New team member", "Candidate"].includes(row[2]))
      .map((row) => person(row[0], row[2], row[1], row[3], "—", "—", "New", "Today")),
  ];
  const filterOn = !!(query || department.length || statuses.length);
  function prune(rows: Person[]): Person[] {
    return rows.flatMap((row) => {
      const children = prune(row.children || []);
      const ownMatch =
        row.values.join(" ").toLowerCase().includes(query.toLowerCase()) &&
        (!department.length || department.includes(row.values[2])) &&
        (!statuses.length || statuses.includes(row.values[8]));
      return ownMatch || children.length
        ? [{ ...row, children: ownMatch && !filterOn ? row.children : children }]
        : [];
    });
  }
  function chooseDepth(value: string) {
    setDepth(value);
    setExpanded(
      value === "All"
        ? true
        : value === "Collapse"
          ? {}
          : Object.fromEntries(
              (value === "1"
                ? [organization]
                : [organization, ...(organization.children || [])]
              ).map((row) => [row.id, true]),
            ),
    );
  }
  const fields: DomainField<Person>[] = [
    {
      id: "select",
      title: "",
      size: 35,
      value: (person) => person.id,
      render: (person, _index, row) => (
        <Checkbox
          aria-label={`Select ${person.id}`}
          checked={row.getIsSelected()}
          onCheckedChange={(checked) => row.toggleSelected(!!checked)}
        />
      ),
    },
    {
      id: "person",
      title: "Person",
      size: 300,
      value: (row) => row.values[0],
      render: (person, _index, row) => (
        <div className="ct-person ct-directory-person" style={{ paddingLeft: row.depth * 28 }}>
          <button
            className="ct-tree-expander"
            disabled={!row.getCanExpand()}
            aria-label={`${row.getIsExpanded() ? "Collapse" : "Expand"} ${person.values[0]}`}
            aria-expanded={row.getCanExpand() ? row.getIsExpanded() : undefined}
            onClick={(event) => {
              event.stopPropagation();
              row.toggleExpanded();
              setDepth("");
            }}
          >
            {row.getCanExpand() &&
              (row.getIsExpanded() ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
          </button>
          <Avatar name={person.values[0]} />
          <span>
            <b>{person.values[0]}</b>
            {row.depth < 2 && !person.id.startsWith("import-") && (
              <Badge variant="secondary" className="ct-org-level">
                {row.depth ? "Vice President" : "Executive"}
              </Badge>
            )}
            <small>{person.values[1]}</small>
          </span>
        </div>
      ),
    },
    {
      id: "department",
      title: "Department",
      size: 130,
      value: (row) => row.values[2],
      render: (row) => <span>{row.values[2]}</span>,
    },
    { id: "location", title: "Location", size: 120, value: (row) => row.values[3] },
    {
      id: "reports",
      title: "Reports",
      size: 105,
      value: (row) => Number.parseInt(row.values[4]) || 0,
      render: (row) => (
        <span>
          {row.values[4].split(" of ")[0]}
          {row.values[4].includes(" of ") && (
            <small className="ct-muted ml-1">of {row.values[4].split(" of ")[1]}</small>
          )}
        </span>
      ),
    },
    {
      id: "roles",
      title: "Open Roles",
      size: 110,
      value: (row) => Number.parseInt(row.values[5]) || 0,
      render: (row) =>
        row.values[5] === "—" ? "—" : <Badge variant="warning-light">{row.values[5]}</Badge>,
    },
    {
      id: "tenure",
      title: "Tenure",
      size: 120,
      value: (row) => row.values[6],
      render: (row) => (
        <span>
          {row.values[6]}
          <small className="block ct-muted">{row.values[7]}</small>
        </span>
      ),
    },
    {
      id: "status",
      title: "Status",
      size: 120,
      value: (row) => row.values[8],
      render: (row) => (
        <Badge
          variant={
            row.values[8] === "Active"
              ? "success-light"
              : row.values[8] === "Notice"
                ? "warning-light"
                : "info-light"
          }
        >
          {row.values[8]}
        </Badge>
      ),
    },
  ];
  return (
    <Frame className="ct-directory ct-reporting-lines">
      <FrameHeader>
        <div className="ct-between">
          <div>
            <FrameTitle>Reporting Lines</FrameTitle>
            <FrameDescription>
              Roster UK <span className="mx-1">·</span> 30 Jul 2026
            </FrameDescription>
          </div>
          <div className="ct-directory-header-right">
            <div className="ct-directory-metrics">
              {[
                ["Headcount", String(flatten(data).length)],
                ["Layers", "4"],
                ["Avg Span", "2.0"],
                ["Open Roles", "5"],
              ].map(([label, value]) => (
                <span key={label}>
                  {label}
                  <b>{value}</b>
                </span>
              ))}
            </div>
            <Export rows={flatten(data).map((row) => row.values)} name="reporting-lines" />
          </div>
        </div>
      </FrameHeader>
      <FramePanel>
        <div className="ct-toolbar ct-directory-toolbar">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people…"
          />
          <div className="ct-grow" />
          <span className="ct-subtle">Depth</span>
          {["Collapse", "1", "2", "All"].map((value) => (
            <Button
              key={value}
              size="sm"
              variant={depth === value ? "secondary" : "ghost"}
              onClick={() => chooseDepth(value)}
            >
              {value}
            </Button>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Department</DropdownMenuLabel>
              {departments.map((value) => (
                <DropdownMenuCheckboxItem
                  key={value}
                  checked={department.includes(value)}
                  onCheckedChange={(checked) =>
                    setDepartment((current) =>
                      checked ? [...current, value] : current.filter((item) => item !== value),
                    )
                  }
                >
                  {value}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              {["Active", "Notice", "On leave", "Probation"].map((value) => (
                <DropdownMenuCheckboxItem
                  key={value}
                  checked={statuses.includes(value)}
                  onCheckedChange={(checked) =>
                    setStatuses((current) =>
                      checked ? [...current, value] : current.filter((item) => item !== value),
                    )
                  }
                >
                  {value}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Settings2 />
                Display
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {fields.slice(1).map((field) => (
                <DropdownMenuCheckboxItem
                  key={field.id}
                  checked={!hidden.includes(field.id)}
                  onCheckedChange={(checked) =>
                    setHidden((current) =>
                      checked ? current.filter((id) => id !== field.id) : [...current, field.id],
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
          data={filterOn ? prune(data) : data}
          fields={fields}
          getRowId={(row) => row.id}
          getSubRows={(row) => row.children}
          expanded={filterOn ? true : expanded}
          onExpandedChange={setExpanded}
          selection={selection}
          onSelectionChange={setSelection}
          hidden={hidden}
          pagination={{ pageIndex: 0, pageSize: 100 }}
          onRowClick={(row) =>
            onOpen([row.values[0], row.values[2], row.values[1], row.values[3], "Full-time"])
          }
          layout={{ width: "auto" }}
        />
        <footer className="ct-directory-footer">
          Roster UK <span>{flatten(data).length} people</span>
          <span>5 open roles</span>
          <span>3 need attention</span>
        </footer>
      </FramePanel>
    </Frame>
  );
}
