import { useState } from "react";
import { CalendarDays, MapPin, MoreHorizontal } from "lucide-react";
import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnContent,
  KanbanItem,
  KanbanItemHandle,
} from "@/components/reui/kanban";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Button, Input } from "./shared";
import { Choice, Tone } from "./fidelity";
type Deal = {
  id: string;
  name: string;
  type: string;
  sector: string;
  prob: number;
  location: string;
  region: string;
  date: string;
  value: string;
  status: string;
  note: string;
};
const stages = ["New Lead", "Qualified", "Discovery", "Proposal", "Negotiation", "Closing"];
const seed = [
  [
    "New Lead",
    "Bluebird Energy",
    "New Logo",
    "Energy",
    28,
    "Oslo, NO",
    "EMEA",
    "Jul 22, 2026",
    "$140K-$160K",
    "New",
    "Forecast tracked",
  ],
  [
    "New Lead",
    "Luma Hospitality",
    "New Logo",
    "Hospitality",
    24,
    "Singapore, SG",
    "APAC",
    "Jul 20, 2026",
    "$60K-$80K",
    "New",
    "Forecast tracked",
  ],
  [
    "New Lead",
    "Pioneer Robotics",
    "New Logo",
    "Robotics",
    33,
    "Tokyo, JP",
    "APAC",
    "Jul 12, 2026",
    "$110K-$140K",
    "Working",
    "Forecast tracked",
  ],
  [
    "Qualified",
    "Vera Capital",
    "New Logo",
    "Finance",
    38,
    "New York, US",
    "NA-East",
    "Jul 18, 2026",
    "$90K-$110K",
    "Working",
    "Forecast tracked",
  ],
  [
    "Qualified",
    "Contoso Freight",
    "New Logo",
    "Logistics",
    45,
    "Rotterdam, NL",
    "EMEA",
    "Jul 24, 2026",
    "$240K-$280K",
    "On track",
    "Forecast tracked",
  ],
  [
    "Discovery",
    "Atlas Education",
    "Renewal",
    "Education",
    52,
    "Boston, US",
    "NA-East",
    "Jul 8, 2026",
    "$130K-$155K",
    "On track",
    "Forecast tracked",
  ],
  [
    "Discovery",
    "Northwind Traders",
    "New Logo",
    "Retail",
    58,
    "Sydney, AU",
    "APAC",
    "Jul 28, 2026",
    "$300K-$340K",
    "On track",
    "Forecast tracked",
  ],
  [
    "Discovery",
    "Keystone Transit",
    "Expansion",
    "Transit",
    55,
    "Chicago, US",
    "NA-East",
    "Jul 16, 2026",
    "$180K-$210K",
    "Working",
    "Forecast tracked",
  ],
  [
    "Proposal",
    "Brightwave Media",
    "New Logo",
    "Media",
    62,
    "Los Angeles, US",
    "NA-West",
    "Jun 24, 2026",
    "$150K-$185K",
    "On track",
    "Forecast tracked",
  ],
  [
    "Proposal",
    "Quartz Payments",
    "New Logo",
    "Fintech",
    59,
    "Austin, US",
    "NA-West",
    "Jul 8, 2026",
    "$220K-$260K",
    "At risk",
    "Security review",
  ],
  [
    "Negotiation",
    "Cobalt Logistics",
    "Renewal",
    "Logistics",
    72,
    "Newark, US",
    "NA-East",
    "Jun 28, 2026",
    "$360K-$400K",
    "At risk",
    "Discount pending",
  ],
  [
    "Negotiation",
    "Redwood BioLabs",
    "Renewal",
    "Biotech",
    78,
    "San Diego, US",
    "NA-West",
    "Jun 29, 2026",
    "$310K-$350K",
    "On track",
    "Forecast tracked",
  ],
  [
    "Negotiation",
    "Summit Retail Group",
    "Expansion",
    "Retail",
    66,
    "London, UK",
    "EMEA",
    "Jul 5, 2026",
    "$680K-$740K",
    "At risk",
    "Volume tiers",
  ],
  [
    "Closing",
    "Orbit Software",
    "Expansion",
    "Software",
    88,
    "Seattle, US",
    "NA-West",
    "Jun 26, 2026",
    "$400K-$430K",
    "Committed",
    "Forecast tracked",
  ],
  [
    "Closing",
    "Meridian Bank",
    "New Logo",
    "Banking",
    81,
    "New York, US",
    "NA-East",
    "Jul 2, 2026",
    "$430K-$470K",
    "Committed",
    "Forecast tracked",
  ],
  [
    "Closing",
    "Helio Manufacturing",
    "New Logo",
    "Manufacturing",
    84,
    "Munich, DE",
    "EMEA",
    "Jun 30, 2026",
    "$490K-$530K",
    "Committed",
    "Forecast tracked",
  ],
];
export default function VervePipeline({
  open,
  onOpenChange,
  query,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  query: string;
}) {
  const [columns, setColumns] = useState<Record<string, Deal[]>>(() =>
    Object.fromEntries(
      stages.map((stage) => [
        stage,
        seed.flatMap((r, i) =>
          r[0] === stage
            ? [
                {
                  id: String(i),
                  name: String(r[1]),
                  type: String(r[2]),
                  sector: String(r[3]),
                  prob: Number(r[4]),
                  location: String(r[5]),
                  region: String(r[6]),
                  date: String(r[7]),
                  value: String(r[8]),
                  status: String(r[9]),
                  note: String(r[10]),
                },
              ]
            : [],
        ),
      ]),
    ),
  );
  const [stage, setStage] = useState("New Lead");
  const [type, setType] = useState("New Logo");
  const [owner, setOwner] = useState("Mira Stone");
  const [status, setStatus] = useState("New");
  const [region, setRegion] = useState("EMEA");
  return (
    <>
      <div className="bt-pipeline-intro">
        <h1>Deal Pipeline</h1>
        <p>Track deals by stage, value, and win probability.</p>
      </div>
      <Kanban value={columns} onValueChange={setColumns} getItemValue={(d) => d.id}>
        <KanbanBoard className="bt-native-pipeline">
          {stages.map((name, i) => (
            <KanbanColumn key={name} value={name}>
              <header>
                <span
                  className="bt-metric-dot"
                  style={{
                    background: ["#94a3b8", "#9a7af0", "#40c4de", "#6c9bf3", "#e9b64a", "#20b988"][
                      i
                    ],
                  }}
                />
                {name}
                <Tone tone="neutral">{columns[name].length}</Tone>
                <MoreHorizontal size={16} />
              </header>
              <KanbanColumnContent value={name}>
                {columns[name]
                  .filter((d) => d.name.toLowerCase().includes(query.toLowerCase()))
                  .map((d) => (
                    <KanbanItem key={d.id} value={d.id} className="bt-pipeline-card">
                      <KanbanItemHandle className="bt-pipeline-handle">
                        <span className="bt-avatar">
                          {d.name
                            .split(" ")
                            .map((x) => x[0])
                            .slice(0, 2)
                            .join("")}
                        </span>
                        <span>
                          <strong>{d.name}</strong>
                          <small>
                            {d.type} · {d.sector}
                          </small>
                        </span>
                      </KanbanItemHandle>
                      <div className="bt-probability">
                        <span>Win prob.</span>
                        <span>{d.prob}%</span>
                      </div>
                      <Slider
                        aria-label={d.name + " win probability"}
                        value={[d.prob]}
                        max={100}
                        step={1}
                        onValueChange={(v) =>
                          setColumns((xs) => ({
                            ...xs,
                            [name]: xs[name].map((x) => (x.id === d.id ? { ...x, prob: v[0] } : x)),
                          }))
                        }
                      />
                      <p>
                        <MapPin size={13} />
                        {d.location}
                        <span>{d.region}</span>
                      </p>
                      <p>
                        <CalendarDays size={13} />
                        {d.date}
                      </p>
                      <strong className="bt-pipeline-value">{d.value}</strong>
                      <footer>
                        <Tone
                          tone={
                            d.status === "At risk"
                              ? "amber"
                              : d.status === "Committed"
                                ? "green"
                                : d.status === "Working"
                                  ? "blue"
                                  : "neutral"
                          }
                        >
                          {d.status}
                        </Tone>
                        <small>{d.note}</small>
                      </footer>
                    </KanbanItem>
                  ))}
              </KanbanColumnContent>
            </KanbanColumn>
          ))}
        </KanbanBoard>
      </Kanban>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="bt-floating-sheet bt-deal-sheet">
          <SheetHeader>
            <SheetTitle>Add deal</SheetTitle>
            <SheetDescription>Open a deal and set its stage, value, and odds.</SheetDescription>
          </SheetHeader>
          <form
            className="bt-sheet-form"
            onSubmit={(e) => {
              e.preventDefault();
              const v = new FormData(e.currentTarget);
              setColumns((xs) => ({
                ...xs,
                [stage]: [
                  ...xs[stage],
                  {
                    id: "new-" + Object.values(xs).flat().length,
                    name: String(v.get("deal")),
                    type,
                    sector: String(v.get("account")),
                    prob: Number(v.get("prob")),
                    location: region,
                    region,
                    date: String(v.get("date")),
                    value: "$" + Number(v.get("value")).toLocaleString(),
                    status,
                    note: "Forecast tracked",
                  },
                ],
              }));
              onOpenChange(false);
            }}
          >
            <div className="bt-form">
              <label>
                Deal
                <Input name="deal" required placeholder="e.g. Bluebird Energy — New Logo" />
              </label>
              <div className="bt-grid-2">
                <label>
                  Account
                  <Input name="account" placeholder="Bluebird Energy" required />
                </label>
                <label>
                  Type
                  <Choice
                    label="Type"
                    value={type}
                    onChange={setType}
                    options={["New Logo", "Expansion", "Renewal"]}
                  />
                </label>
              </div>
              <label>
                Stage
                <Choice label="Stage" value={stage} onChange={setStage} options={stages} />
              </label>
              <div className="bt-grid-2">
                <label>
                  Value
                  <Input name="value" type="number" min="0" placeholder="150,000" required />
                </label>
                <label>
                  Win probability
                  <Input name="prob" type="number" min="0" max="100" defaultValue="40" />
                </label>
              </div>
              <div className="bt-grid-2">
                <label>
                  Owner
                  <Choice
                    label="Owner"
                    value={owner}
                    onChange={setOwner}
                    options={["Mira Stone", "Leo Grant", "Nora Vale", "Theo Park", "Sana Qureshi"]}
                  />
                </label>
                <label>
                  Close date
                  <Input name="date" defaultValue="Jul 22, 2026" />
                </label>
              </div>
              <div className="bt-grid-2">
                <label>
                  Status
                  <Choice
                    label="Status"
                    value={status}
                    onChange={setStatus}
                    options={["New", "Working", "On track", "At risk", "Committed"]}
                  />
                </label>
                <label>
                  Region
                  <Choice
                    label="Region"
                    value={region}
                    onChange={setRegion}
                    options={["EMEA", "APAC", "NA-East", "NA-West"]}
                  />
                </label>
              </div>
            </div>
            <SheetFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Create deal</Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
