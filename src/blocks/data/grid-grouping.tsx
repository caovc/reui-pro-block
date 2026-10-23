import { DataGridTableFootRow,DataGridTableFootRowCell } from "@/components/reui/data-grid/data-grid-table";
import { Switch } from "@/components/ui/switch";
import type { BlockProps } from "@/data/types";
import {
CalendarDays,
ExternalLink,
Globe,
MessageSquare,
Paperclip,
Plus
} from "lucide-react";
import { useState } from "react";
import { advancedBrandAssets } from "./grid-advanced-brand-assets";
import { DomainGroupedGrid } from "./grid-advanced-group-model";
import { domainTextMatches } from "./grid-advanced-model-grid";
import {
AddRecord,
Button,
Checkbox,
Choice,
DotBadge,
ExportRows,
GridFrame,
GridSearch,
GridTabs,
Ring,
RowMenu,
TableOptions,
TinyAvatar
} from "./grid-advanced-shared";
import {
cellClass,
cn,
money,
useGridSorting
} from "./grid-advanced-utils";
import { gridBrandAssets } from "./grid-base-assets";
import { MaterialsTree,ReportingTree } from "./grid-grouping-trees";
const taskNames = [
  "Draft first-run board tips",
  "Map invoice retries to health cards",
  "Guard archived pages",
  "Audit assistant fallback prompts for unsupported requests",
  "Scope vendor admin roles",
  "Define regional quiet hours for digest notifications",
  "Prototype mobile composer",
  "Connect revenue alerts to renewals",
  "Write handoff checklist for knowledge base imports",
  "Separate SSO exception review from the access queue",
  "Preview announcement routing",
  "Tune citation scoring for generated release notes",
  "Ship onboarding status badges",
  "Review swipe-to-archive recovery",
  "Show warehouse lag in ops dashboards",
  "Automate release notes",
  "Verify webhook delivery",
  "Improve search relevance",
  "Publish changelog",
];
const owners = [
  "Rina Holt",
  "Evren Blake",
  "Mina Rowe",
  "Sora Min",
  "Noor Albright",
];
const stageNames = ["Backlog", "To Do", "In Progress", "Done"];
function Roadmap() {
  const [rows, setRows] = useState(
    taskNames.map((name, i) => ({
      id: i + 1,
      name,
      stage: stageNames[i < 6 ? 0 : i < 11 ? 1 : i < 16 ? 2 : 3],
      owner: owners[i % 5],
      signal: ["Queued", "At risk", "Queued", "On track", "Blocked", "Queued"][
        i % 6
      ],
      progress: [
        18, 34, 12, 42, 9, 28, 46, 58, 37, 29, 51, 76, 88, 67, 41, 100, 100,
        100, 100,
      ][i],
    })),
  );
  const [query, setQuery] = useState("");
  const [signal, setSignal] = useState("All signals");
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  return (
    <GridFrame
      className="mt-8 [&>header]:py-3.5"
      title="Roadmap Queue"
      description="Track work by stage, owner, and signal."
      summary={
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span>
            Tasks <b className="ml-1 text-foreground">{rows.length}</b>
          </span>
          <span>
            Blocked{" "}
            <DotBadge tone="bad">
              {rows.filter((r) => r.signal === "Blocked").length}
            </DotBadge>
          </span>
          <span>
            At risk{" "}
            <DotBadge tone="warn">
              {rows.filter((r) => r.signal === "At risk").length}
            </DotBadge>
          </span>
          <span>
            Unassigned <b>2</b>
          </span>
        </div>
      }
    >
      <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2">
        <GridSearch
          value={query}
          onChange={setQuery}
          placeholder="Search roadmap..."
        />
        <div className="ml-auto flex flex-wrap gap-2">
          <Choice
            label="Roadmap signal"
            value={signal}
            onChange={setSignal}
            options={[
              "All signals",
              "Queued",
              "At risk",
              "On track",
              "Blocked",
            ]}
          />
          <TableOptions
            columns={["Owner", "Category", "Due date", "Progress", "Signal"]}
            hidden={hidden}
            setHidden={setHidden}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-sm"
            onClick={() =>
              setCollapsed(
                collapsed.length === stageNames.length ? [] : stageNames,
              )
            }
          >
            {collapsed.length === stageNames.length
              ? "Expand groups"
              : "Collapse groups"}
          </Button>
          <AddRecord
            label="New task"
            title="New roadmap task"
            fields={[{ name: "name", label: "Task title" }]}
            onSave={(v) =>
              setRows((rs) => [
                ...rs,
                {
                  id: rs.length + 1,
                  name: v.name,
                  stage: "Backlog",
                  owner: "Unassigned",
                  signal: "Queued",
                  progress: 0,
                },
              ])
            }
          />
        </div>
      </div>
      {selected.length > 0 && (
        <div className="flex items-center gap-3 border-b bg-blue-500/5 px-3 py-2">
          <span>{selected.length} selected</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setRows((rs) =>
                rs.map((r) =>
                  selected.includes(r.id)
                    ? { ...r, stage: "Done", progress: 100, signal: "On track" }
                    : r,
                ),
              );
              setSelected([]);
            }}
          >
            Mark done
          </Button>
        </div>
      )}
      <DomainGroupedGrid groups={stageNames.map((stage,i)=>({id:stage,title:stage,description:['Ideas waiting for product shaping','Scoped work ready for owners','Active delivery with review signals','Delivered and verified'][i],children:rows.filter(r=>r.stage===stage)}))} getId={r=>String(r.id)} search={query} filter={r=>signal==='All signals'||r.signal===signal} collapsed={collapsed} onCollapsedChange={setCollapsed} hidden={hidden} onHiddenChange={setHidden} selection={selected.map(String)} onSelectionChange={ids=>setSelected(ids.map(Number))} header="none" className="[&_tbody_tr]:h-[45px]" fields={[{id:"select",title:"",value:r=>r.id,size:40,render:(r,_i,row)=><Checkbox aria-label={`Select ${r.name}`} checked={row.getIsSelected()} onCheckedChange={v=>row.toggleSelected(!!v)}/>},
{id:"name",title:"Task",value:r=>r.name,size:480,className:cn(
                          cellClass,
                          "max-w-80 truncate font-medium",
                        ),render:(r,_i,_gridRow)=>{return <>
                        {r.name}
                      </>}},
{id:"owner",title:"Owner",value:r=>r.owner,size:64,className:cellClass,render:(r,_i,_gridRow)=>{return <>
                          <TinyAvatar name={r.owner} />
                        </>}},
{id:"category",title:"Category",value:r=>['Adoption','Revenue','Knowledge','AI Quality','Access','Messaging'][(r.id-1)%6],size:115,className:cellClass,render:(_r,i,_gridRow)=>{return <>
                          <DotBadge tone={i % 2 ? "good" : "violet"}>
                            {
                              [
                                "Adoption",
                                "Revenue",
                                "Knowledge",
                                "AI Quality",
                                "Access",
                                "Messaging",
                              ][i % 6]
                            }
                          </DotBadge>
                        </>}},
{id:"due",title:"Due date",value:r=>r.id,size:105,className:cellClass,render:(_r,i,_gridRow)=>{return <>
                          <span className="inline-flex items-center gap-1 rounded border px-1 py-0.5 text-xs">
                            <CalendarDays className="size-3" />
                            {22 - i * 2}{" "}
                            {["Dec", "Mar", "Aug", "Nov", "Jan", "Feb"][i % 6]}
                          </span>
                        </>}},
{id:"progress",title:"Progress",value:r=>r.progress,size:80,className:cellClass,render:(r,_i,_gridRow)=>{return <>
                          <Ring value={r.progress} />
                        </>}},
{id:"signal",title:"Signal",value:r=>r.signal,size:110,className:cellClass,render:(r,_i,_gridRow)=>{return <>
                          <DotBadge
                            tone={
                              r.signal === "Blocked"
                                ? "bad"
                                : r.signal === "At risk"
                                  ? "warn"
                                  : r.signal === "On track"
                                    ? "good"
                                    : "muted"
                            }
                          >
                            {r.signal}
                          </DotBadge>
                        </>}},
{id:"actions",title:"",value:r=>r.id,size:36,render:(r,_i,_gridRow)=>{return <>
                        <RowMenu
                          name={r.name}
                          onDelete={() =>
                            setRows((rs) => rs.filter((x) => x.id !== r.id))
                          }
                        />
                      </>}}]} />
    </GridFrame>
  );
}
const accountNames = [
  "Northwind Trading",
  "Cedar Health Systems",
  "Vantage Robotics",
  "Brightline Media",
  "Summit Analytics",
  "Banyan AgriTech",
  "Andes Fintech",
  "Meridian Software",
  "Harbor Labs",
  "Atlas Logistics",
  "Pinecone Studio",
  "Orbit Solutions",
  "Nova Health",
  "Cobalt Systems",
  "Ember Group",
  "Kite Financial",
  "Solstice Digital",
  "Lumen Commerce",
  "Juniper Works",
  "Vista Partners",
];
const regions = ["North America", "EMEA", "APAC", "LATAM"];
function Revenue() {
  const sorting = useGridSorting();
  const [rows, setRows] = useState(
    accountNames.map((name, i) => ({
      id: i + 1,
      name,
      region: regions[i < 7 ? 0 : i < 13 ? 1 : i < 17 ? 2 : 3],
      owner: owners[i % 5],
      arr: [
        920000, 760000, 410000, 285000, 138000, 124000, 268000, 730000, 690000,
        530000, 430000, 615000, 500000, 420000, 350000, 355000, 330000, 180000,
        170000, 200000,
      ][i],
      nrr: [124, 103, 118, 92, 129, 132, 122, 112, 108, 99][i % 10],
      health: i % 5 === 3 ? "At Risk" : i % 5 === 1 ? "Watch" : "Healthy",
    })),
  );
  const [query, setQuery] = useState("");
  const [health, setHealth] = useState("All health");
  const [collapsed, setCollapsed] = useState<string[]>([
    "EMEA",
    "APAC",
    "LATAM",
  ]);
  const [hidden, setHidden] = useState<string[]>([]);
  const filtered = sorting.sortRows(
    rows.filter(
      (r) =>
        domainTextMatches(r,query) &&
        (health === "All health" || r.health === health),
    ),
    (r, key) =>
      key === "Account"
        ? r.name
        : key === "Owner"
          ? r.owner
          : key === "Health"
            ? r.health
            : key === "ARR"
              ? r.arr
              : key === "NRR"
                ? r.nrr
                : r.id,
  );
  return (
    <GridFrame
      className="mt-8 [&>header]:py-3.5"
      title="Revenue By Region"
      description="Net retention and renewals across the book."
      summary={
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span>
            Total ARR{" "}
            <b className="text-foreground">
              ${(rows.reduce((s, r) => s + r.arr, 0) / 1000000).toFixed(2)}M
            </b>
          </span>
          <span>
            Portfolio NRR <DotBadge tone="good">111%</DotBadge>
          </span>
          <span>
            At-Risk ARR{" "}
            <DotBadge tone="bad">
              $
              {(
                rows
                  .filter((r) => r.health === "At Risk")
                  .reduce((s, r) => s + r.arr, 0) / 1000000
              ).toFixed(2)}
              M
            </DotBadge>
          </span>
        </div>
      }
      actions={<ExportRows name="revenue-by-region" rows={filtered} />}
    >
      <div className="flex flex-wrap gap-2 border-b px-3 py-2">
        <GridSearch
          value={query}
          onChange={setQuery}
          placeholder="Search accounts..."
        />
        <div className="ml-auto flex gap-2">
          <Choice
            label="Account health"
            value={health}
            onChange={setHealth}
            options={["All health", "Healthy", "Watch", "At Risk"]}
          />
          <TableOptions
            columns={["Owner", "Health", "NRR", "Renewal"]}
            hidden={hidden}
            setHidden={setHidden}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-sm"
            onClick={() => setCollapsed(collapsed.length ? [] : regions)}
          >
            {collapsed.length ? "Expand all" : "Collapse all"}
          </Button>
        </div>
      </div>
      <DomainGroupedGrid groups={regions.map(region=>({id:region,title:region,children:rows.filter(r=>r.region===region)}))} getId={r=>String(r.id)} search={query} filter={r=>health==='All health'||r.health===health} collapsed={collapsed} onCollapsedChange={setCollapsed} hidden={hidden} onHiddenChange={setHidden} className="[&_tbody_tr]:h-[45px]" renderGroup={group=><><Globe className='size-3'/><b>{group.title}</b><DotBadge>{filtered.filter(r=>r.region===group.id).length}</DotBadge><span className='ml-auto pr-20 font-medium'>{money(filtered.filter(r=>r.region===group.id).reduce((sum,r)=>sum+r.arr,0))}</span><span className='text-xs text-emerald-500'>↗ +111%</span></>} footer={<DataGridTableFootRow><DataGridTableFootRowCell colSpan={3}>All Regions <DotBadge>{filtered.length}</DotBadge></DataGridTableFootRowCell><DataGridTableFootRowCell>{money(filtered.reduce((s,r)=>s+r.arr,0))}</DataGridTableFootRowCell><DataGridTableFootRowCell colSpan={3}>↗ +111%</DataGridTableFootRowCell></DataGridTableFootRow>} fields={[{id:"name",title:"Account",value:r=>r.name,size:285,className:cellClass,render:(r,i,_gridRow)=>{return <>
                        <div className="flex items-center gap-2 pl-6">
                          <TinyAvatar
                            photo={false}
                            name={r.name}
                            color={
                              [
                                "bg-blue-100 text-blue-600",
                                "bg-violet-100 text-violet-600",
                                "bg-emerald-100 text-emerald-600",
                              ][i % 3]
                            }
                          />
                          <span className="font-medium">{r.name}</span>
                        </div>
                      </>}},
{id:"owner",title:"Owner",value:r=>r.owner,size:190,className:cellClass,render:(r,_i,_gridRow)=>{return <>
                          <div className="flex items-center gap-2">
                            <TinyAvatar name={r.owner} />
                            {r.owner}
                          </div>
                        </>}},
{id:"health",title:"Health",value:r=>r.health,size:110,className:cellClass,render:(r,_i,_gridRow)=>{return <>
                          <DotBadge
                            tone={
                              r.health === "Healthy"
                                ? "good"
                                : r.health === "Watch"
                                  ? "warn"
                                  : "bad"
                            }
                          >
                            {r.health}
                          </DotBadge>
                        </>}},
{id:"arr",title:"ARR",value:r=>r.arr,size:125,className:cn(cellClass, "text-right font-medium"),render:(r,_i,_gridRow)=>{return <>
                        {money(r.arr)}
                      </>}},
{id:"nrr",title:"NRR",value:r=>r.nrr,size:110,className:(r)=>cn(
                            cellClass,
                            r.nrr > 100 ? "text-emerald-500" : "text-rose-500",
                          ),render:(r,_i,_gridRow)=>{return <>
                          {r.nrr > 100 ? "↗ +" : "↘ "}
                          {r.nrr}%
                        </>}},
{id:"renewal",title:"Renewal",value:r=>r.id,size:150,className:cellClass,render:(_r,i,_gridRow)=>{return <>
                          <span className="inline-flex items-center gap-1 rounded border px-1 py-0.5 text-xs">
                            <CalendarDays className="size-3" />
                            {["Sep", "Jul", "Nov", "Jun", "Oct"][i % 5]}{" "}
                            {14 + i}, 2026
                          </span>
                        </>}},
{id:"actions",title:"",value:r=>r.id,size:36,render:(r,_i,_gridRow)=>{return <>
                        <RowMenu
                          name={r.name}
                          onDelete={() =>
                            setRows((rs) => rs.filter((x) => x.id !== r.id))
                          }
                        />
                      </>}}]} />
    </GridFrame>
  );
}
const signalSeed = [
  {
    name: "Needs care this week",
    note: "Acute pain and mobility limits",
    group: "Clinical Fit",
    answers: 642,
    verified: 548,
    booked: 392,
    arrived: 328,
    started: 284,
    hold: 39,
  },
  {
    name: "Imaging is ready",
    note: "X-ray or MRI attached",
    group: "Clinical Fit",
    answers: 639,
    verified: 512,
    booked: 376,
    arrived: 310,
    started: 268,
    hold: 56,
  },
  {
    name: "Plan matches network",
    note: "Payer accepted at main campus",
    group: "Coverage Fit",
    answers: 640,
    verified: 502,
    booked: 354,
    arrived: 279,
    started: 240,
    hold: 68,
  },
  {
    name: "Prior auth status",
    note: "Authorization known at intake",
    group: "Coverage Fit",
    answers: 631,
    verified: 476,
    booked: 318,
    arrived: 246,
    started: 209,
    hold: 92,
  },
  {
    name: "Can travel to clinic",
    note: "Transport available for consultation",
    group: "Visit Fit",
    answers: 612,
    verified: 460,
    booked: 321,
    arrived: 267,
    started: 219,
    hold: 49,
  },
  {
    name: "Caregiver available",
    note: "Support after procedure",
    group: "Visit Fit",
    answers: 604,
    verified: 433,
    booked: 298,
    arrived: 255,
    started: 209,
    hold: 61,
  },
  {
    name: "Morning appointment",
    note: "Preferred consultation time",
    group: "Visit Fit",
    answers: 617,
    verified: 402,
    booked: 294,
    arrived: 248,
    started: 205,
    hold: 73,
  },
  {
    name: "Ready for a consult",
    note: "Patient confirmed next steps",
    group: "Visit Fit",
    answers: 600,
    verified: 337,
    booked: 289,
    arrived: 223,
    started: 215,
    hold: 74,
  },
];
function Cohorts() {
  const [tab, setTab] = useState("Intake area");
  const [cohort, setCohort] = useState("Orthopedic Recall");
  const [risk, setRisk] = useState("All hold risk");
  const [query, setQuery] = useState("");
  const [notes, setNotes] = useState(true);
  const [collapsed, setCollapsed] = useState<string[]>(["Visit Fit"]);
  const filtered = signalSeed.filter(
    (r) =>
      domainTextMatches(r,query) &&
      (risk === "All hold risk" ||
        (risk === "High hold risk"
          ? r.hold / r.answers > 0.1
          : r.hold / r.answers <= 0.1)),
  );
  const groups =
    tab === "Intake area"
      ? ["Clinical Fit", "Coverage Fit", "Visit Fit"]
      : tab === "Booking strength"
        ? ["Strong booking", "Needs follow-up"]
        : ["Low hold risk", "High hold risk"];
  const groupFor = (r: (typeof signalSeed)[number]) =>
    tab === "Intake area"
      ? r.group
      : tab === "Booking strength"
        ? r.booked / r.answers > 0.55
          ? "Strong booking"
          : "Needs follow-up"
        : r.hold / r.answers > 0.1
          ? "High hold risk"
          : "Low hold risk";
  const metrics = ["verified", "booked", "arrived", "started", "hold"] as const;
  const sums = (rows: typeof signalSeed) =>
    ({
      answers: rows.reduce((s, r) => s + r.answers, 0),
      ...Object.fromEntries(
        metrics.map((k) => [k, rows.reduce((s, r) => s + r[k], 0)]),
      ),
    }) as (typeof signalSeed)[number];
  function heat(
    row: (typeof signalSeed)[number],
    key: (typeof metrics)[number],
  ) {
    const percent = row.answers
      ? Math.round((row[key] / row.answers) * 100)
      : 0;
    return (
      <div
        key={key}
        className={cn(
          "border-l px-3 py-2 text-sm",
          key === "hold"
            ? "text-rose-700 dark:text-rose-300"
            : "text-emerald-950 dark:text-emerald-100",
        )}
        style={{
          backgroundColor:
            key === "hold"
              ? `rgba(251,113,133,${Math.min(0.35, percent / 45)})`
              : `rgba(16,185,129,${percent / 130})`,
        }}
      >
        <span>{row[key].toLocaleString()}</span>
        <span className="float-right pl-5 text-xs opacity-70">{percent}%</span>
      </div>
    );
  }
  const total = sums(filtered);
  return (
    <GridFrame
      className="mt-8 [&>header]:py-3.5"
      title="Access Cohort"
      description={`AI intake for ${cohort === "Orthopedic Recall" ? "joint replacement" : "specialist"} consults`}
      summary={
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span>
            Answers{" "}
            <b className="ml-1 text-foreground">
              {total.answers.toLocaleString()}
            </b>
          </span>
          <span>
            Hold Risk <DotBadge tone="bad">{total.hold}</DotBadge>
          </span>
          <span>Exported 24 Jun 2026</span>
        </div>
      }
      actions={<ExportRows name="access-cohort" rows={filtered} />}
    >
      <GridTabs
        value={tab}
        onChange={(v) => {
          setTab(v);
          setCollapsed([]);
        }}
        items={["Intake area", "Booking strength", "Hold risk"]}
      />
      <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2">
        <Choice
          label="Patient cohort"
          value={cohort}
          onChange={setCohort}
          options={["Orthopedic Recall", "Specialist Intake"]}
        />
        <Choice
          label="Hold risk filter"
          value={risk}
          onChange={setRisk}
          options={["All hold risk", "High hold risk", "Low hold risk"]}
        />
        <GridSearch
          value={query}
          onChange={setQuery}
          placeholder="Search signals"
        />
        <label className="ml-auto flex items-center gap-2 text-[13px]">
          Notes
          <Switch size="sm" checked={notes} onCheckedChange={setNotes} />
        </label>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-[13px]"
          onClick={() => setCollapsed(collapsed.length ? [] : groups)}
        >
          {collapsed.length ? "Expand" : "Collapse"}
        </Button>
      </div>
      <DomainGroupedGrid groups={groups.map(group=>({id:group,title:group,children:signalSeed.filter(r=>groupFor(r)===group)}))} getId={r=>r.name} search={query} filter={r=>risk==="All hold risk"||(risk==="High hold risk"?r.hold/r.answers>0.1:r.hold/r.answers<=0.1)} collapsed={collapsed} onCollapsedChange={setCollapsed} className="[&_td]:p-0"
        groupValue={(group,key)=>{const sum=sums(group.children.filter(r=>filtered.includes(r)));return key==="answers"?<span className="px-3 font-medium">{sum.answers.toLocaleString()}</span>:metrics.includes(key as typeof metrics[number])?heat(sum,key as typeof metrics[number]):null;}}
        fields={[
          {id:"name",title:"Signal",value:r=>r.name,size:340,className:"px-3 py-2",render:r=><div className="flex items-center gap-2 pl-5"><DotBadge>Q{signalSeed.indexOf(r)+1}</DotBadge><div><span className="font-medium">{r.name}</span>{notes&&<span className="mt-0.5 block text-xs text-muted-foreground">{r.note}</span>}</div></div>},
          {id:"answers",title:"Answers",value:r=>r.answers,size:100,className:"px-3 py-2 text-right"},
          ...metrics.map(key=>({id:key,title:key[0].toUpperCase()+key.slice(1),value:(r:typeof signalSeed[number])=>r[key],size:150,className:"p-0",render:(r:typeof signalSeed[number])=>heat(r,key)}))
        ]}
        footer={<DataGridTableFootRow><DataGridTableFootRowCell>Visible Signals <DotBadge>{filtered.length}</DotBadge></DataGridTableFootRowCell><DataGridTableFootRowCell>{total.answers.toLocaleString()}</DataGridTableFootRowCell>{metrics.map(key=><DataGridTableFootRowCell key={key}>{total[key].toLocaleString()} / {Math.round(total[key]/total.answers*100)||0}%</DataGridTableFootRowCell>)}</DataGridTableFootRow>}
      />

    </GridFrame>
  );
}
const storyTitles = [
  "The Last Dry Winter",
  "Cheap Money Ends",
  "Night Shift Choirs",
  "The Grid Goes Quiet",
  "The Repair Clause",
  "Museum of Ordinary Things",
  "Counting the Kelp",
  "Who Owns the Aquifer?",
  "The Understudy Economy",
  "After the Last Train",
  "Good Neighbors",
  "A Smaller Footprint",
  "Beyond the Headline",
];
const editorialStages = ["DRAFTING", "IN EDIT", "FACT CHECK", "READY"];
function Editorial() {
  const [rows, setRows] = useState(
    storyTitles.map((name, i) => ({
      id: i + 1,
      name,
      stage: editorialStages[Math.min(3, Math.floor(i / 3))],
      desk: ["Culture", "Business", "Climate"][i % 3],
      issue: ["July", "August", "September"][i % 3],
      placement: ["Lead", "Feature", "Brief"][i % 3],
      assets: [7, 3, 2, 11, 6, 4, 9, 14, 3, 5, 8, 2, 6][i],
      notes: [12, 5, 3, 18, 21, 7, 26, 33, 9, 4, 7, 2, 6][i],
    })),
  );
  const [groupBy, setGroupBy] = useState("Stage");
  const [query, setQuery] = useState("");
  const [placement, setPlacement] = useState("All placements");
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const groups =
    groupBy === "Stage"
      ? editorialStages
      : groupBy === "Desk"
        ? ["Culture", "Business", "Climate"]
        : ["July", "August", "September"];
  const columns = [
    "Story",
    "Angle",
    "Byline",
    "Filed",
    "Publish",
    "Placement",
    "Assets",
    "Notes",
  ];
  return (
    <GridFrame
      className="mt-8 [&>header]:py-3.5"
      title="Production Desk"
      description="Northline Review · 24 Jul 2026"
      summary={
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span>
            Stories <b className="text-foreground">{rows.length}</b>
          </span>
          <span>
            Unchecked <b className="text-foreground">6</b>
          </span>
        </div>
      }
      actions={
        <AddRecord
          label="New story"
          title="New story"
          fields={[{ name: "name", label: "Story title" }]}
          onSave={(v) =>
            setRows((rs) => [
              ...rs,
              {
                id: rs.length + 1,
                name: v.name,
                stage: "DRAFTING",
                desk: "Culture",
                issue: "July",
                placement: "Brief",
                assets: 0,
                notes: 0,
              },
            ])
          }
        />
      }
    >
      <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2">
        <span className="text-xs text-muted-foreground">Group by</span>
        <div className="flex rounded border p-0.5">
          {["Stage", "Desk", "Issue"].map((v) => (
            <button
              key={v}
              onClick={() => {
                setGroupBy(v);
                setCollapsed([]);
              }}
              aria-pressed={groupBy === v}
              className={cn(
                "rounded px-2 py-1 text-[13px]",
                groupBy === v && "bg-muted font-medium",
              )}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="ml-auto flex min-w-0 flex-wrap gap-2">
          <GridSearch
            value={query}
            onChange={setQuery}
            placeholder="Search stories..."
          />
          <Choice
            label="Story placement"
            value={placement}
            onChange={setPlacement}
            options={["All placements", "Lead", "Feature", "Brief"]}
          />
          <TableOptions
            columns={columns.slice(1)}
            hidden={hidden}
            setHidden={setHidden}
          />
        </div>
      </div>
      <DomainGroupedGrid groups={groups.map((group,i)=>({id:group,title:group,tone:['bg-sky-500/5','bg-amber-500/5','bg-rose-500/5','bg-emerald-500/5'][i%4],children:rows.filter(r=>(groupBy==='Stage'?r.stage:groupBy==='Desk'?r.desk:r.issue)===group)}))} getId={r=>String(r.id)} search={query} filter={r=>placement==='All placements'||r.placement===placement} collapsed={collapsed} onCollapsedChange={setCollapsed} hidden={hidden} onHiddenChange={setHidden} header="repeated" className="[&_tbody_tr]:h-14" groupAction={group=><Button variant='outline' size='icon-xs' className='size-5' aria-label={`Add story to ${group.title}`} onClick={()=>setRows(rs=>[...rs,{id:rs.length+1,name:`Untitled story ${rs.length+1}`,stage:groupBy==='Stage'?group.title:'DRAFTING',desk:groupBy==='Desk'?group.title:'Culture',issue:groupBy==='Issue'?group.title:'July',placement:'Brief',assets:0,notes:0}])}><Plus/></Button>} fields={[{id:"name",title:"Story",value:r=>r.name,size:280,className:cellClass,render:(r,_i,_gridRow)=>{return <>
                          <span className="font-medium">{r.name}</span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            NR-{1200 + r.id}
                          </span>
                        </>}},
{id:"angle",title:"Angle",value:r=>['Reservoir towns rewrite what remains','Why regional lenders stopped lending','Hospital cleaners built a choir','A utility learns to sell less power'][(r.id-1)%4],size:290,className:cn(
                              cellClass,
                              "truncate text-[13px] text-muted-foreground",
                            ),render:(_r,i,_gridRow)=>{return <>
                            {
                              [
                                "Reservoir towns rewrite what remains",
                                "Why regional lenders stopped lending",
                                "Hospital cleaners built a choir",
                                "A utility learns to sell less power",
                              ][i % 4]
                            }
                          </>}},
{id:"byline",title:"Byline",value:r=>owners[(r.id-1)%5],size:90,className:cellClass,render:(_r,i,_gridRow)=>{return <>
                            <div className="flex -space-x-1">
                              <TinyAvatar name={owners[i % 5]} />
                              {i % 2 === 0 && (
                                <TinyAvatar
                                  name={owners[(i + 1) % 5]}
                                  color="bg-violet-100 text-violet-700"
                                />
                              )}
                            </div>
                          </>}},
{id:"filed",title:"Filed",value:r=>r.id,size:85,className:cn(
                              cellClass,
                              "text-xs text-muted-foreground",
                            ),render:(_r,i,_gridRow)=>{return <>
                            {6 + i * 3} Jul
                          </>}},
{id:"publish",title:"Publish",value:r=>r.id,size:85,className:cn(
                              cellClass,
                              "text-xs text-muted-foreground",
                            ),render:(_r,i,_gridRow)=>{return <>
                            {14 + i * 3} Aug
                          </>}},
{id:"placement",title:"Placement",value:r=>r.placement,size:100,className:cellClass,render:(r,_i,_gridRow)=>{return <>
                            <DotBadge
                              tone={
                                r.placement === "Feature" ? "violet" : "muted"
                              }
                            >
                              {r.placement}
                            </DotBadge>
                          </>}},
{id:"assets",title:"Assets",value:r=>r.assets,size:82,className:cellClass,render:(r,_i,_gridRow)=>{return <>
                            <span className="inline-flex items-center gap-1 rounded border px-1 text-xs">
                              <Paperclip className="size-3" />
                              {r.assets}
                            </span>
                          </>}},
{id:"notes",title:"Notes",value:r=>r.notes,size:82,className:cellClass,render:(r,_i,_gridRow)=>{return <>
                            <span className="inline-flex items-center gap-1 rounded border px-1 text-xs">
                              <MessageSquare className="size-3" />
                              {r.notes}
                            </span>
                          </>}},
{id:"actions",title:"",value:r=>r.id,size:36,render:(r,_i,_gridRow)=>{return <>
                          <RowMenu
                            name={r.name}
                            onDelete={() =>
                              setRows((rs) => rs.filter((x) => x.id !== r.id))
                            }
                          />
                        </>}}]} />
    </GridFrame>
  );
}
const clients = [
  "Stripe",
  "Docker",
  "Gemini",
  "Supabase",
  "Neon",
  "Slack",
  "Loom",
  "Hono",
  "Convex",
  "Redis",
  "Vercel",
  "Linear",
];
const engagements = [
  "Spring Menu Film",
  "Platform Launch",
  "Type Specimen",
  "Lab Site Rebuild",
  "Docuseries Titles",
  "Catalog Relaunch",
  "Product Story",
  "Annual Report",
  "Care Campaign",
  "Cellar Identity",
  "Brand Platform",
  "Launch Campaign",
];
const deliveryStages = [
  "Discovery",
  "In Production",
  "Client Review",
  "Ready To Ship",
];
function Delivery() {
  const sorting = useGridSorting();
  const [rows, setRows] = useState(
    clients.map((name, i) => ({
      id: i + 1,
      name,
      engagement: engagements[i],
      stage: deliveryStages[i < 3 ? 0 : i < 7 ? 1 : i < 10 ? 2 : 3],
      progress: [18, 0, 27, 64, 52, 71, 59, 88, 79, 83, 96, 100][i],
      milestone: [
        "Concept Lock",
        "No milestone",
        "Art Direction",
        "Motion Pass",
        "Style Frames",
        "Photo Edit",
        "No milestone",
        "Print Proof",
        "Final Cut",
        "Brand Book",
        "Final Delivery",
        "Sign-off",
      ][i],
    })),
  );
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("All stages");
  const [hidden, setHidden] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const filtered = sorting.sortRows(
    rows.filter(
      (r) =>
        domainTextMatches(r,query) &&
        (stageFilter === "All stages" || r.stage === stageFilter),
    ),
    (r, key) =>
      key === "Client"
        ? r.name
        : key === "Engagement"
          ? r.engagement
          : key === "Completion"
            ? r.progress
            : key === "Milestone"
              ? r.milestone
              : r.id,
  );
  return (
    <GridFrame
      className="mt-8 [&>header]:py-3.5"
      title="Delivery Board"
      description="Active studio engagements · Week Of Mar 10"
      summary={
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>
            Engagements <b className="text-foreground">{rows.length}</b>
          </span>
          <span>
            Near done{" "}
            <DotBadge tone="good">
              {rows.filter((r) => r.progress > 80).length}
            </DotBadge>
          </span>
        </div>
      }
    >
      <div className="flex flex-wrap gap-2 border-b px-3 py-2">
        <GridSearch
          value={query}
          onChange={setQuery}
          placeholder="Search engagements..."
        />
        <div className="ml-auto flex gap-2">
          <Choice
            label="Delivery stage"
            value={stageFilter}
            onChange={setStageFilter}
            options={["All stages", ...deliveryStages]}
          />
          <TableOptions
            columns={["Engagement", "Completion", "Crew", "Milestone"]}
            hidden={hidden}
            setHidden={setHidden}
          />
        </div>
      </div>
      {selected.length > 0 && (
        <div className="flex items-center gap-3 border-b bg-blue-500/5 px-3 py-2">
          <span>{selected.length} selected</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setRows((rs) =>
                rs.map((r) =>
                  selected.includes(r.id)
                    ? { ...r, stage: "Ready To Ship", progress: 100 }
                    : r,
                ),
              );
              setSelected([]);
            }}
          >
            Move to ready
          </Button>
        </div>
      )}
      <DomainGroupedGrid groups={deliveryStages.map(stage=>({id:stage,title:stage,children:rows.filter(r=>r.stage===stage)}))} getId={r=>String(r.id)} search={query} filter={r=>stageFilter==='All stages'||r.stage===stageFilter} collapsed={collapsed} onCollapsedChange={setCollapsed} hidden={hidden} onHiddenChange={setHidden} selection={selected.map(String)} onSelectionChange={ids=>setSelected(ids.map(Number))} header="repeated" className="[&_tbody_tr]:h-12" renderGroup={group=><><b>{group.title}</b><DotBadge>{filtered.filter(r=>r.stage===group.id).length}</DotBadge><span className='ml-auto text-xs text-muted-foreground'>Avg {Math.round(group.children.filter(r=>filtered.includes(r)).reduce((s,r)=>s+r.progress,0)/(group.children.filter(r=>filtered.includes(r)).length||1))}%</span></>} fields={[{id:"select",title:"",value:r=>r.id,size:40,render:(r,_i,row)=><Checkbox aria-label={`Select ${r.name}`} checked={row.getIsSelected()} onCheckedChange={v=>row.toggleSelected(!!v)}/>},
{id:"name",title:"Client",value:r=>r.name,size:215,className:cellClass,render:(r,i,_gridRow)=>{return <>
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "inline-flex size-5 items-center justify-center rounded text-xs font-bold",
                                  [
                                    "bg-violet-500/10 text-violet-500",
                                    "bg-sky-500/10 text-sky-500",
                                    "bg-emerald-500/10 text-emerald-500",
                                  ][i % 3],
                                )}
                              >
                                <img
                                  alt=""
                                  className="size-5 object-contain"
                                  src={
                                    gridBrandAssets[r.name.toLowerCase()] ||
                                    advancedBrandAssets[
                                      r.name === "Gemini"
                                        ? "googlegemini"
                                        : r.name.toLowerCase()
                                    ]
                                  }
                                />
                              </span>
                              {r.name}
                            </div>
                          </>}},
{id:"engagement",title:"Engagement",value:r=>r.engagement,size:270,className:cellClass,render:(r,_i,_gridRow)=>{return <>
                              <span className="inline-flex items-center gap-2">
                                {r.engagement}
                                <ExternalLink className="size-3 text-muted-foreground" />
                              </span>
                            </>}},
{id:"progress",title:"Completion",value:r=>r.progress,size:250,className:cellClass,render:(r,_i,_gridRow)=>{return <>
                              <div className="flex items-center gap-2">
                                <div
                                  className="flex gap-0.5"
                                  role="img"
                                  aria-label={`${r.progress}% complete`}
                                >
                                  {Array.from({ length: 10 }, (_, n) => (
                                    <span
                                      key={n}
                                      className={cn(
                                        "h-1 w-3 rounded",
                                        n < r.progress / 10
                                          ? deliveryStages.indexOf(r.stage) === 0
                                            ? "bg-sky-500"
                                            : deliveryStages.indexOf(r.stage) === 1
                                              ? "bg-amber-500"
                                              : "bg-emerald-500"
                                          : "bg-muted",
                                      )}
                                    />
                                  ))}
                                </div>
                                <span className="text-xs">{r.progress}%</span>
                              </div>
                            </>}},
{id:"crew",title:"Crew",value:r=>owners[(r.id-1)%5],size:110,className:cellClass,render:(_r,i,_gridRow)=>{return <>
                              <div className="flex -space-x-1">
                                <TinyAvatar name={owners[i % 5]} />
                                {i % 2 === 0 && (
                                  <TinyAvatar
                                    name={owners[(i + 1) % 5]}
                                    color="bg-violet-100 text-violet-700"
                                  />
                                )}
                              </div>
                            </>}},
{id:"milestone",title:"Milestone",value:r=>r.milestone,size:160,className:cellClass,render:(r,_i,_gridRow)=>{return <>
                              <DotBadge>{r.milestone}</DotBadge>
                            </>}}]} />
    </GridFrame>
  );
}
export default function GroupingGrid({ block }: BlockProps) {
  switch (block.id) {
    case "data-grid-grouping-1":
      return <Roadmap />;
    case "data-grid-grouping-2":
      return <Revenue />;
    case "data-grid-grouping-3":
      return <Cohorts />;
    case "data-grid-grouping-4":
      return <MaterialsTree />;
    case "data-grid-grouping-5":
      return <ReportingTree />;
    case "data-grid-grouping-6":
      return <Editorial />;
    default:
      return <Delivery />;
  }
}
