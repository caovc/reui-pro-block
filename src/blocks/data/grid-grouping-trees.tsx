import { Box,Clock3 } from "lucide-react";
import { useState } from "react";
import { DomainRecordGrid } from "./grid-advanced-model-grid";
import {
Button,
Checkbox,
ChevronRight,
Choice,
DotBadge,
ExportRows,
GridFrame,
GridSearch,
TableOptions,
TinyAvatar,
} from "./grid-advanced-shared";
import {
cellClass,
cn
} from "./grid-advanced-utils";
type Part = {
  id: string;
  name: string;
  qty: number;
  cost: number;
  lead: number;
  supply: string;
  children?: Part[];
};
const parts: Part[] = [
  {
    id: "SYS-100",
    name: "Drive System",
    qty: 1,
    cost: 0,
    lead: 62,
    supply: "Shortage",
    children: [
      {
        id: "ASM-110",
        name: "Mid-Drive Motor",
        qty: 1,
        cost: 0,
        lead: 62,
        supply: "Shortage",
        children: [
          {
            id: "SUB-111",
            name: "Stator Assembly",
            qty: 1,
            cost: 0,
            lead: 45,
            supply: "Single source",
            children: [
              {
                id: "PRT-1111",
                name: "Stator Lamination",
                qty: 52,
                cost: 0.74,
                lead: 45,
                supply: "Single source",
              },
              {
                id: "PRT-1112",
                name: "Copper Winding",
                qty: 3,
                cost: 7.4,
                lead: 28,
                supply: "Stocked",
              },
              {
                id: "PRT-1113",
                name: "Thermal Sensor",
                qty: 2,
                cost: 3.85,
                lead: 21,
                supply: "Stocked",
              },
            ],
          },
          {
            id: "SUB-112",
            name: "Rotor Assembly",
            qty: 1,
            cost: 58.5,
            lead: 62,
            supply: "Shortage",
            children: [
              {
                id: "PRT-1121",
                name: "Permanent Magnet",
                qty: 6,
                cost: 6.5,
                lead: 62,
                supply: "Shortage",
              },
              {
                id: "PRT-1122",
                name: "Rotor Shaft",
                qty: 1,
                cost: 19.5,
                lead: 30,
                supply: "Stocked",
              },
            ],
          },
          {
            id: "PRT-113",
            name: "Motor Housing",
            qty: 2,
            cost: 13.9,
            lead: 30,
            supply: "Stocked",
          },
          {
            id: "PRT-114",
            name: "Torque Sensor Ring",
            qty: 1,
            cost: 34.75,
            lead: 40,
            supply: "Single source",
          },
        ],
      },
      {
        id: "ASM-120",
        name: "Drivetrain",
        qty: 1,
        cost: 0,
        lead: 54,
        supply: "Long lead",
        children: [
          {
            id: "PRT-121",
            name: "Chainring",
            qty: 1,
            cost: 24.5,
            lead: 28,
            supply: "Stocked",
          },
          {
            id: "PRT-122",
            name: "Drive Chain",
            qty: 1,
            cost: 18.75,
            lead: 21,
            supply: "Stocked",
          },
          {
            id: "PRT-123",
            name: "Rear Sprocket",
            qty: 1,
            cost: 34.7,
            lead: 54,
            supply: "Long lead",
          },
        ],
      },
    ],
  },
  {
    id: "SYS-200",
    name: "Energy Pack",
    qty: 1,
    cost: 0,
    lead: 56,
    supply: "Long lead",
    children: [
      {
        id: "ASM-210",
        name: "Battery Module",
        qty: 1,
        cost: 0,
        lead: 56,
        supply: "Long lead",
        children: [
          {
            id: "PRT-211",
            name: "Lithium Cell",
            qty: 40,
            cost: 6.2,
            lead: 56,
            supply: "Long lead",
          },
          {
            id: "PRT-212",
            name: "Battery Controller",
            qty: 1,
            cost: 45.5,
            lead: 35,
            supply: "Stocked",
          },
        ],
      },
      {
        id: "PRT-220",
        name: "Charger",
        qty: 1,
        cost: 32.47,
        lead: 28,
        supply: "Stocked",
      },
    ],
  },
  {
    id: "SYS-300",
    name: "Frame Set",
    qty: 1,
    cost: 0,
    lead: 42,
    supply: "Shortage",
    children: [
      {
        id: "PRT-310",
        name: "Cargo Frame",
        qty: 1,
        cost: 178.5,
        lead: 42,
        supply: "Shortage",
      },
      {
        id: "PRT-320",
        name: "Front Fork",
        qty: 1,
        cost: 55.3,
        lead: 35,
        supply: "Stocked",
      },
    ],
  },
  {
    id: "SYS-400",
    name: "Cockpit",
    qty: 1,
    cost: 0,
    lead: 38,
    supply: "Single source",
    children: [
      {
        id: "PRT-410",
        name: "Handlebar",
        qty: 1,
        cost: 37.5,
        lead: 28,
        supply: "Stocked",
      },
      {
        id: "PRT-420",
        name: "Display Unit",
        qty: 1,
        cost: 42,
        lead: 38,
        supply: "Single source",
      },
      {
        id: "PRT-430",
        name: "Brake Lever",
        qty: 2,
        cost: 12.75,
        lead: 21,
        supply: "Stocked",
      },
    ],
  },
  {
    id: "SYS-500",
    name: "Rolling Gear",
    qty: 1,
    cost: 0,
    lead: 51,
    supply: "Long lead",
    children: [
      {
        id: "PRT-510",
        name: "Cargo Wheel",
        qty: 2,
        cost: 68.5,
        lead: 51,
        supply: "Long lead",
      },
      {
        id: "PRT-520",
        name: "All-Terrain Tire",
        qty: 2,
        cost: 38.25,
        lead: 28,
        supply: "Stocked",
      },
      {
        id: "PRT-530",
        name: "Disc Rotor",
        qty: 2,
        cost: 16.83,
        lead: 21,
        supply: "Stocked",
      },
    ],
  },
];
function partCost(p: Part): number {
  return p.children
    ? p.children.reduce((s, c) => s + partCost(c), 0) * p.qty
    : p.cost * p.qty;
}
function flattenParts(nodes: Part[]): Part[] {
  return nodes.flatMap((n) => [n, ...flattenParts(n.children || [])]);
}
const allParts = flattenParts(parts);
function DepthControls({
  onChange,
  depth,
}: {
  onChange: (n: number) => void;
  depth: number;
}) {
  return (
    <div className="flex items-center gap-1 text-xs">
      <span className="mr-1 text-muted-foreground">Depth</span>
      {["Collapse", "1", "2", "All"].map((name, i) => (
        <button
          key={name}
          aria-label={`Set tree depth ${name}`}
          aria-pressed={depth === i}
          className={cn(
            "rounded px-2 py-1",
            depth === i ? "border bg-muted font-medium" : "hover:bg-muted",
          )}
          onClick={() => onChange(i)}
        >
          {name}
        </button>
      ))}
    </div>
  );
}
export function MaterialsTree() {
  const [query, setQuery] = useState("");
  const [supply, setSupply] = useState("All supply");
  const [depth, setDepth] = useState(2);
  const [expanded, setExpanded] = useState<string[]>([
    "SYS-100",
    "ASM-110",
    "SUB-111",
  ]);
  const [hidden, setHidden] = useState<string[]>([]);
  const total = parts.reduce((s, p) => s + partCost(p), 0);
  const setTreeDepth = (n: number) => {
    setDepth(n);
    setExpanded(
      n === 0
        ? []
        : n === 3
          ? allParts.map((p) => p.id)
          : n === 1
            ? parts.map((p) => p.id)
            : parts.flatMap((p) => [
                p.id,
                ...(p.children || []).map((c) => c.id),
              ]),
    );
  };
  return (
    <GridFrame
      className="mt-8 [&>header]:py-3.5"
      title="Bill Of Materials"
      description="Meridian C2 Cargo · Rev C · 24 Jul 2026"
      summary={
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span>
            Build cost{" "}
            <b className="text-foreground">
              {total.toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
              })}
            </b>
          </span>
          <span>
            Critical path <b className="text-foreground">62d</b>
          </span>
          <span>
            At risk{" "}
            <DotBadge tone="warn">
              {allParts.filter((p) => p.supply === "Shortage").length}
            </DotBadge>
          </span>
        </div>
      }
      actions={
        <ExportRows
          name="bill-of-materials"
          rows={allParts.map((p) => ({
            part: p.name,
            number: p.id,
            quantity: p.qty,
            extendedCost: partCost(p),
            lead: p.lead,
            supply: p.supply,
          }))}
        />
      }
    >
      <div className="flex flex-wrap gap-2 border-b px-3 py-2">
        <GridSearch
          value={query}
          onChange={setQuery}
          placeholder="Search parts..."
        />
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <DepthControls depth={depth} onChange={setTreeDepth} />
          <Choice
            label="Supply filter"
            value={supply}
            onChange={setSupply}
            options={[
              "All supply",
              "Stocked",
              "Single source",
              "Long lead",
              "Shortage",
            ]}
          />
          <TableOptions
            columns={["Number", "Qty", "Unit Cost", "Lead Time", "Supply"]}
            hidden={hidden}
            setHidden={setHidden}
          />
        </div>
      </div>
      <DomainRecordGrid data={parts} search={query} rowFilter={p=>supply==='All supply'||p.supply===supply} getSubRows={p=>p.children} getRowId={p=>p.id} expanded={query||supply!=='All supply'?true:Object.fromEntries(expanded.map(id=>[id,true]))} onExpandedChange={next=>setExpanded(next===true?allParts.map(p=>p.id):Object.keys(next).filter(id=>next[id]))} hidden={hidden} onHiddenChange={setHidden} className="[&_tbody_tr]:h-[45px]" fields={[{id:"name",title:"Part",value:p=>p.name,size:370,render:(p,_i,row)=><div className='flex items-center gap-2' style={{paddingLeft:row.depth*18}}><button aria-label={`${row.getIsExpanded()?'Collapse':'Expand'} ${p.name}`} aria-expanded={row.getIsExpanded()} disabled={!row.getCanExpand()} className='disabled:invisible' onClick={()=>row.toggleExpanded()}><ChevronRight className={cn('size-3',row.getIsExpanded()&&'rotate-90')}/></button><Box className='size-3 text-muted-foreground'/><span className={p.children?'font-medium':''}>{p.name}</span></div>},
{id:"id",title:"Number",value:p=>p.id,size:125,className:"px-3 font-mono text-xs text-muted-foreground",render:(p,_i,_gridRow)=>{return <>
                  {p.id}
                </>}},
{id:"qty",title:"Qty",value:p=>p.qty,size:65,className:cn(cellClass, "text-right"),render:(p,_i,_gridRow)=>{return <>
                  {p.qty}
                </>}},
{id:"cost",title:"Unit Cost",value:p=>p.cost,size:120,className:cn(cellClass, "text-right"),render:(p,_i,_gridRow)=>{return <>
                  {p.children
                    ? "—"
                    : p.cost.toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                      })}
                </>}},
{id:"extended",title:"Extended Cost",value:p=>partCost(p),size:180,className:cn(cellClass, "text-right font-medium"),render:(p,_i,_gridRow)=>{return <>
                <span className="mr-2 text-xs font-normal text-muted-foreground">
                  {p.children
                    ? `${((partCost(p) / total) * 100).toFixed(1)}%`
                    : ""}
                </span>
                {partCost(p).toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                })}
              </>}},
{id:"lead",title:"Lead Time",value:p=>p.lead,size:110,className:cellClass,render:(p,_i,_gridRow)=>{return <>
                  <DotBadge tone={p.lead > 50 ? "warn" : "muted"}>
                    <Clock3 className="size-3" />
                    {p.lead}d
                  </DotBadge>
                </>}},
{id:"supply",title:"Supply",value:p=>p.supply,size:125,className:cellClass,render:(p,_i,_gridRow)=>{return <>
                  <DotBadge
                    tone={
                      p.supply === "Shortage"
                        ? "bad"
                        : p.supply === "Long lead"
                          ? "warn"
                          : p.supply === "Single source"
                            ? "violet"
                            : "muted"
                    }
                  >
                    {p.supply}
                  </DotBadge>
                </>}}]} />
      <footer className="flex justify-between border-t bg-muted/20 px-3 py-2 text-sm">
        <b className="font-medium">
          Meridian C2 Cargo <DotBadge>{allParts.length} lines</DotBadge>
        </b>
        <b>
          {total.toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
          })}
        </b>
        <span>62d</span>
      </footer>
    </GridFrame>
  );
}
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
const flattenPeople = (nodes: Employee[]): Employee[] =>
  nodes.flatMap((p) => [p, ...flattenPeople(p.children || [])]);
const allEmployees = flattenPeople(employees);
const descendants = (p: Employee): number[] => [
  p.id,
  ...(p.children || []).flatMap(descendants),
];
export function ReportingTree() {
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("All departments");
  const [depth, setDepth] = useState(1);
  const [expanded, setExpanded] = useState<number[]>([1]);
  const [selected, setSelected] = useState<number[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  return (
    <GridFrame
      className="mt-8 [&>header]:py-3.5"
      title="Reporting Lines"
      description="Meridian Cycles · 24 Jul 2026"
      summary={
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {[
            ["Headcount", allEmployees.length],
            ["Layers", 5],
            ["Avg Span", "2.1"],
            ["Open Roles", 6],
          ].map(([name, value]) => (
            <span key={name}>
              {name} <b className="text-foreground">{value}</b>
            </span>
          ))}
        </div>
      }
      actions={
        <ExportRows
          name="reporting-lines"
          rows={allEmployees.map((p) => ({
            name: p.name,
            title: p.title,
            department: p.department,
            location: p.location,
            reports: descendants(p).length - 1,
          }))}
        />
      }
    >
      <div className="flex flex-wrap gap-2 border-b px-3 py-2">
        <GridSearch
          value={query}
          onChange={setQuery}
          placeholder="Search people..."
        />
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <DepthControls
            depth={depth}
            onChange={(n) => {
              setDepth(n);
              setExpanded(
                n === 0
                  ? []
                  : n === 3
                    ? allEmployees.map((p) => p.id)
                    : n === 1
                      ? [1]
                      : [1, ...(employees[0].children || []).map((p) => p.id)],
              );
            }}
          />
          <Choice
            label="Department filter"
            value={department}
            onChange={setDepartment}
            options={[
              "All departments",
              "Engineering",
              "Operations",
              "Commercial",
              "People",
              "Design",
            ]}
          />
          <TableOptions
            columns={[
              "Department",
              "Location",
              "Reports",
              "Open Roles",
              "Tenure",
              "Status",
            ]}
            hidden={hidden}
            setHidden={setHidden}
          />
        </div>
      </div>
      {selected.length > 0 && (
        <div
          role="status"
          className="flex items-center gap-3 border-b bg-blue-500/5 px-3 py-2 text-sm"
        >
          <b>{selected.length} people selected</b>
          <span className="text-muted-foreground">
            Selection includes all reports in each team.
          </span>
          <Button variant="ghost" size="sm" onClick={() => setSelected([])}>
            Clear selection
          </Button>
        </div>
      )}
      <DomainRecordGrid data={employees} search={query} rowFilter={p=>department==='All departments'||p.department===department} getSubRows={p=>p.children} getRowId={p=>String(p.id)} expanded={query||department!=='All departments'?true:Object.fromEntries(expanded.map(id=>[String(id),true]))} onExpandedChange={next=>setExpanded(next===true?allEmployees.map(p=>p.id):Object.keys(next).filter(id=>next[id]).map(Number))} selection={selected.map(String)} onSelectionChange={ids=>setSelected(ids.map(Number))} hidden={hidden} onHiddenChange={setHidden} className="[&_tbody_tr]:h-14" fields={[{id:"select",title:"",value:p=>p.id,size:42,render:(p,_i,row)=><Checkbox aria-label={`Select ${p.name} and reports`} checked={row.getIsSomeSelected()?'indeterminate':row.getIsSelected()} onCheckedChange={v=>row.toggleSelected(!!v,{deselectParents:true})}/>},
{id:"name",title:"Person",value:p=>p.name,size:385,render:(p,_i,row)=><div className='flex items-center gap-2' style={{paddingLeft:row.depth*16}}><button aria-label={`${row.getIsExpanded()?'Collapse':'Expand'} ${p.name}`} aria-expanded={row.getIsExpanded()} disabled={!row.getCanExpand()} className='disabled:invisible' onClick={()=>row.toggleExpanded()}><ChevronRight className={cn('size-3',row.getIsExpanded()&&'rotate-90')}/></button><TinyAvatar name={p.name}/><div><span className='font-medium'>{p.name}</span>{p.title.startsWith('VP')&&<span className='ml-2'><DotBadge tone='violet'>Vice President</DotBadge></span>}<span className='mt-0.5 block text-xs text-muted-foreground'>{p.title}</span></div></div>},
{id:"department",title:"Department",value:p=>p.department,size:140,className:cellClass,render:(p,_i,_gridRow)=>{return <>{p.department}</>}},
{id:"location",title:"Location",value:p=>p.location,size:130,className:cn(cellClass, "text-muted-foreground"),render:(p,_i,_gridRow)=>{return <>
                    {p.location}
                  </>}},
{id:"reports",title:"Reports",value:p=>descendants(p).length-1,size:90,className:cellClass,render:(p,_i,_gridRow)=>{return <>
                    {p.children
                      ? `${p.children.length} of ${descendants(p).length - 1}`
                      : "—"}
                  </>}},
{id:"roles",title:"Open Roles",value:p=>p.roles,size:100,className:cellClass,render:(p,_i,_gridRow)=>{return <>
                    {p.roles ? <DotBadge tone="warn">{p.roles}</DotBadge> : "—"}
                  </>}},
{id:"tenure",title:"Tenure",value:p=>p.tenure,size:115,className:cellClass,render:(p,_i,_gridRow)=>{return <>
                    {p.tenure} years
                    <span className="block text-xs text-muted-foreground">
                      {["Mar", "May", "Nov", "Apr", "Jan"][p.id % 5]}{" "}
                      {2026 - p.tenure}
                    </span>
                  </>}},
{id:"status",title:"Status",value:_p=>'Active',size:100,className:cellClass,render:(_p,_i,_gridRow)=>{return <>
                    <DotBadge tone="good">● Active</DotBadge>
                  </>}}]} />
      <footer className="flex justify-between border-t bg-muted/20 px-3 py-2 text-sm">
        <span className="font-medium">
          Meridian Cycles{" "}
          <span className="ml-2 text-xs font-normal">
            {allEmployees.length} people
          </span>
        </span>
        <span className="text-xs text-muted-foreground">3 need attention</span>
      </footer>
    </GridFrame>
  );
}
