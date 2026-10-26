import { Badge } from "@/components/reui/badge";
import {
  DataGridTableFootRow,
  DataGridTableFootRowCell,
  DataGridTableRowExpand,
} from "@/components/reui/data-grid/data-grid-table";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import { IconTile } from "@/components/reui/icon-tile";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Activity,
  Battery,
  Box,
  Cable,
  Circle,
  CircleDot,
  Clock3,
  Cpu,
  Copy,
  Check,
  SlidersHorizontal,
  Ellipsis,
  Disc3,
  Expand,
  ExternalLink,
  Flame,
  Grip,
  Grid2X2,
  Hand,
  Layers,
  Monitor,
  MoveHorizontal,
  PlugZap,
  RectangleHorizontal,
  Repeat2,
  Rocket,
  RotateCw,
  Settings,
  Sun,
  Target,
  Triangle,
  Truck,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  DomainRecordGrid,
  domainTextMatches,
  type DomainField,
  type ExpandedState,
} from "./grid-advanced-model-grid";
import { Button, Choice, ExportRows, GridSearch } from "./grid-advanced-shared";
import { cn } from "./grid-advanced-utils";

type Supply = "Stocked" | "Single source" | "Long lead" | "Shortage";
type Part = {
  id: string;
  name: string;
  qty: number;
  unitCents?: number;
  lead?: number;
  supply?: Supply;
  children?: Part[];
};
type MaterialRow = {
  id: string;
  name: string;
  path: string;
  qty: number;
  perParent: number;
  unitCents: number | null;
  costCents: number;
  lead: number;
  supply: Supply;
  description: string;
  supplier?: string;
  lineCount: number;
  matches: boolean;
  children?: MaterialRow[];
};
const supplyStates: Supply[] = ["Stocked", "Single source", "Long lead", "Shortage"];
// Only visible public preview records are transcribed. Assembly cost is the sum of
// purchased descendants, not an extra copy of the displayed rolled-up unit value.
const parts: Part[] = [
  {
    id: "SYS-100",
    name: "Drive System",
    qty: 1,
    children: [
      {
        id: "ASM-110",
        name: "Mid-Drive Motor",
        qty: 1,
        children: [
          {
            id: "SUB-111",
            name: "Stator Assembly",
            qty: 1,
            children: [
              {
                id: "PRT-1111",
                name: "Stator Lamination",
                qty: 52,
                unitCents: 74,
                lead: 45,
                supply: "Single source",
              },
              {
                id: "PRT-1112",
                name: "Copper Winding",
                qty: 3,
                unitCents: 740,
                lead: 28,
                supply: "Stocked",
              },
              {
                id: "PRT-1113",
                name: "Thermal Sensor",
                qty: 2,
                unitCents: 385,
                lead: 21,
                supply: "Stocked",
              },
            ],
          },
          {
            id: "SUB-112",
            name: "Rotor Assembly",
            qty: 1,
            children: [
              {
                id: "PRT-1121",
                name: "Rotor Shaft",
                qty: 1,
                unitCents: 1690,
                lead: 35,
                supply: "Stocked",
              },
              {
                id: "PRT-1122",
                name: "Magnet Segment",
                qty: 16,
                unitCents: 260,
                lead: 62,
                supply: "Shortage",
              },
            ],
          },
          {
            id: "PRT-113",
            name: "Motor Housing",
            qty: 2,
            unitCents: 1390,
            lead: 30,
            supply: "Stocked",
          },
          {
            id: "PRT-114",
            name: "Torque Sensor Ring",
            qty: 1,
            unitCents: 3475,
            lead: 40,
            supply: "Single source",
          },
        ],
      },
      {
        id: "ASM-120",
        name: "Drivetrain",
        qty: 1,
        children: [
          {
            id: "PRT-121",
            name: "Chainring 42T",
            qty: 1,
            unitCents: 1830,
            lead: 24,
            supply: "Stocked",
          },
          {
            id: "PRT-122",
            name: "Chain",
            qty: 1,
            unitCents: 1275,
            lead: 18,
            supply: "Stocked",
          },
          {
            id: "PRT-123",
            name: "Cassette 11-42T",
            qty: 1,
            unitCents: 4690,
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
    children: [
      {
        id: "ASM-210",
        name: "Battery Module",
        qty: 2,
        children: [
          {
            id: "PRT-211",
            name: "Cell 21700",
            qty: 40,
            unitCents: 235,
            lead: 56,
            supply: "Long lead",
          },
          {
            id: "PRT-212",
            name: "Cell Holder Frame",
            qty: 4,
            unitCents: 195,
            lead: 22,
            supply: "Stocked",
          },
          {
            id: "PRT-213",
            name: "Nickel Busbar",
            qty: 8,
            unitCents: 62,
            lead: 16,
            supply: "Stocked",
          },
        ],
      },
      {
        id: "PRT-220",
        name: "BMS Controller",
        qty: 1,
        unitCents: 5840,
        lead: 49,
        supply: "Single source",
      },
      {
        id: "PRT-230",
        name: "Pack Enclosure",
        qty: 1,
        unitCents: 4420,
        lead: 25,
        supply: "Stocked",
      },
      {
        id: "PRT-240",
        name: "Charge Port",
        qty: 1,
        unitCents: 985,
        lead: 19,
        supply: "Stocked",
      },
    ],
  },
  {
    id: "SYS-300",
    name: "Frame Set",
    qty: 1,
    children: [
      {
        id: "ASM-310",
        name: "Welded Frame",
        qty: 1,
        children: [
          {
            id: "PRT-311",
            name: "Main Triangle",
            qty: 1,
            unitCents: 9650,
            lead: 42,
            supply: "Single source",
          },
          {
            id: "PRT-312",
            name: "Rear Triangle",
            qty: 1,
            unitCents: 6120,
            lead: 42,
            supply: "Stocked",
          },
          {
            id: "PRT-313",
            name: "Head Tube Insert",
            qty: 2,
            unitCents: 740,
            lead: 20,
            supply: "Stocked",
          },
        ],
      },
      {
        id: "PRT-320",
        name: "Cargo Deck",
        qty: 1,
        unitCents: 3890,
        lead: 26,
        supply: "Stocked",
      },
      {
        id: "PRT-330",
        name: "Dual-Leg Kickstand",
        qty: 1,
        unitCents: 2240,
        lead: 33,
        supply: "Shortage",
      },
    ],
  },
  {
    id: "SYS-400",
    name: "Cockpit",
    qty: 1,
    children: [
      {
        id: "PRT-410",
        name: "Display Head Unit",
        qty: 1,
        unitCents: 5260,
        lead: 38,
        supply: "Single source",
      },
      {
        id: "PRT-420",
        name: "Brake Lever",
        qty: 2,
        unitCents: 1420,
        lead: 27,
        supply: "Stocked",
      },
      {
        id: "PRT-430",
        name: "Handlebar",
        qty: 1,
        unitCents: 1680,
        lead: 21,
        supply: "Stocked",
      },
      {
        id: "PRT-440",
        name: "Grip",
        qty: 2,
        unitCents: 360,
        lead: 14,
        supply: "Stocked",
      },
    ],
  },
  {
    id: "SYS-500",
    name: "Rolling Gear",
    qty: 1,
    children: [
      {
        id: "ASM-510",
        name: "Wheel Set",
        qty: 2,
        children: [
          {
            id: "PRT-511",
            name: "Rim",
            qty: 1,
            unitCents: 2730,
            lead: 29,
            supply: "Stocked",
          },
          {
            id: "PRT-512",
            name: "Spoke",
            qty: 36,
            unitCents: 28,
            lead: 17,
            supply: "Stocked",
          },
          {
            id: "PRT-513",
            name: "Hub Shell",
            qty: 1,
            unitCents: 1960,
            lead: 31,
            supply: "Stocked",
          },
          {
            id: "PRT-514",
            name: "Tyre",
            qty: 1,
            unitCents: 2390,
            lead: 51,
            supply: "Long lead",
          },
        ],
      },
      {
        id: "ASM-520",
        name: "Brake Set",
        qty: 1,
        children: [
          {
            id: "PRT-521",
            name: "Hydraulic Caliper",
            qty: 2,
            unitCents: 3150,
            lead: 36,
            supply: "Stocked",
          },
          {
            id: "PRT-522",
            name: "Brake Rotor",
            qty: 2,
            unitCents: 1120,
            lead: 23,
            supply: "Stocked",
          },
        ],
      },
    ],
  },
];

const partIcons: Record<string, LucideIcon> = {
  "SYS-100": Settings,
  "ASM-110": Rocket,
  "SUB-111": Target,
  "PRT-1111": Layers,
  "PRT-1112": Cable,
  "PRT-1113": Flame,
  "SUB-112": RotateCw,
  "PRT-1121": CircleDot,
  "PRT-1122": Grid2X2,
  "PRT-113": Box,
  "PRT-114": Activity,
  "ASM-120": Repeat2,
  "PRT-121": Disc3,
  "PRT-122": Cable,
  "PRT-123": Disc3,
  "SYS-200": Zap,
  "ASM-210": Battery,
  "PRT-211": Battery,
  "PRT-212": RectangleHorizontal,
  "PRT-213": Cable,
  "PRT-220": Cpu,
  "PRT-230": Box,
  "PRT-240": PlugZap,
  "SYS-300": Expand,
  "ASM-310": Triangle,
  "PRT-311": Triangle,
  "PRT-312": Triangle,
  "PRT-313": Circle,
  "PRT-320": RectangleHorizontal,
  "PRT-330": MoveHorizontal,
  "SYS-400": Grid2X2,
  "PRT-410": Monitor,
  "PRT-420": Hand,
  "PRT-430": MoveHorizontal,
  "PRT-440": Grip,
  "SYS-500": Truck,
  "ASM-510": Circle,
  "PRT-511": Circle,
  "PRT-512": Sun,
  "PRT-513": CircleDot,
  "PRT-514": Circle,
  "ASM-520": Disc3,
  "PRT-521": Settings,
  "PRT-522": Disc3,
};

const partDetails: Record<string, { description: string; supplier?: string }> = {
  "SYS-100": {
    description: "Mid-drive motor and chain transmission",
  },
  "ASM-110": {
    description: "250 W nominal, 85 Nm peak torque",
  },
  "SUB-111": {
    description: "Wound and potted before motor build",
  },
  "PRT-1111": {
    description: "Grain-oriented silicon steel, 0.35 mm",
    supplier: "Kestrel Magnetics",
  },
  "PRT-1112": {
    description: "Class H enamel, 1.2 mm gauge",
    supplier: "Halden Wire Works",
  },
  "PRT-1113": {
    description: "NTC 10k, potted lead",
    supplier: "Orbit Sensing",
  },
  "SUB-112": {
    description: "Balanced to 8000 rpm before press-fit",
  },
  "PRT-1121": {
    description: "Hardened 4140, ground finish",
    supplier: "Norwood Precision",
  },
  "PRT-1122": {
    description: "Sintered neodymium, N45SH grade",
    supplier: "Kestrel Magnetics",
  },
  "PRT-113": {
    description: "Die-cast half shell, powder coated",
    supplier: "Norwood Precision",
  },
  "PRT-114": {
    description: "Strain gauge bridge, calibrated",
    supplier: "Orbit Sensing",
  },
  "ASM-120": {
    description: "Chain drive with wide-range cassette",
  },
  "PRT-121": {
    description: "Narrow-wide profile, 7075 alloy",
    supplier: "Calder Drivetrain",
  },
  "PRT-122": {
    description: "11-speed, nickel plated",
    supplier: "Calder Drivetrain",
  },
  "PRT-123": {
    description: "Steel sprockets, alloy carrier",
    supplier: "Calder Drivetrain",
  },
  "SYS-200": {
    description: "36 V dual-module pack, smart charging",
  },
  "ASM-210": {
    description: "10S4P block, laser welded",
  },
  "PRT-211": {
    description: "5.0 Ah, matched by internal resistance",
    supplier: "Talvane Cells",
  },
  "PRT-212": {
    description: "Flame-retardant PC, V-0 rated",
    supplier: "Ridgeway Polymers",
  },
  "PRT-213": {
    description: "0.2 mm pure nickel strip",
    supplier: "Halden Wire Works",
  },
  "PRT-220": {
    description: "20S balancing, CAN diagnostics",
    supplier: "Verrin Electronics",
  },
  "PRT-230": {
    description: "IP67 shell with lock barrel",
    supplier: "Ridgeway Polymers",
  },
  "PRT-240": {
    description: "5 A barrel inlet, sealed cap",
    supplier: "Verrin Electronics",
  },
  "SYS-300": {
    description: "Long-tail cargo frame, 180 kg rating",
  },
  "ASM-310": {
    description: "TIG welded, heat treated after jig",
  },
  "PRT-311": {
    description: "Hydroformed 6061 tubeset",
    supplier: "Arbor Frameworks",
  },
  "PRT-312": {
    description: "Extended chainstay, rack mounts",
    supplier: "Arbor Frameworks",
  },
  "PRT-313": {
    description: "Pressed bearing cup, 1.5 in",
    supplier: "Norwood Precision",
  },
  "PRT-320": {
    description: "Bamboo ply with alloy edging",
    supplier: "Arbor Frameworks",
  },
  "PRT-330": {
    description: "Centre mount, 200 kg static load",
    supplier: "Calder Drivetrain",
  },
  "SYS-400": {
    description: "Rider controls and display",
  },
  "PRT-410": {
    description: "2.4 in transflective LCD, backlit",
    supplier: "Verrin Electronics",
  },
  "PRT-420": {
    description: "Hydraulic, with motor cutoff",
    supplier: "Calder Drivetrain",
  },
  "PRT-430": {
    description: "680 mm alloy riser, 31.8 mm clamp",
    supplier: "Arbor Frameworks",
  },
  "PRT-440": {
    description: "Locking ergonomic grip",
    supplier: "Ridgeway Polymers",
  },
  "SYS-500": {
    description: "Wheels, tyres and hydraulic braking",
  },
  "ASM-510": {
    description: "Hand-tensioned, 36 spoke build",
  },
  "PRT-511": {
    description: "20 in double wall, eyeleted",
    supplier: "Arbor Frameworks",
  },
  "PRT-512": {
    description: "14G stainless, butted",
    supplier: "Halden Wire Works",
  },
  "PRT-513": {
    description: "Sealed cartridge, 15 mm axle",
    supplier: "Norwood Precision",
  },
  "PRT-514": {
    description: "20 x 2.4 in, puncture belt",
    supplier: "Talvane Rubber",
  },
  "ASM-520": {
    description: "Four-piston hydraulic, front and rear",
  },
  "PRT-521": {
    description: "Four piston, mineral oil",
    supplier: "Calder Drivetrain",
  },
  "PRT-522": {
    description: "180 mm, six bolt",
    supplier: "Norwood Precision",
  },
};

function formatMoney(cents: number) {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

/** Domain-only rollups; all original nodes stay in the native TanStack subRows tree. */
function buildMaterials(
  nodes: Part[],
  query = "",
  supplyFilter: Supply[] = [],
  ancestorQuantity = 1,
  ancestorPath = "",
): MaterialRow[] {
  return nodes.map((part) => {
    const qty = ancestorQuantity * part.qty;
    const detail = partDetails[part.id];
    const path =
      `${ancestorPath} ${part.id} ${part.name} ${detail.description} ${detail.supplier || ""}`.trim();
    const children = part.children
      ? buildMaterials(part.children, query, supplyFilter, qty, path)
      : undefined;
    const matches = children
      ? children.some((child) => child.matches)
      : (!supplyFilter.length || supplyFilter.includes(part.supply || "Stocked")) &&
        domainTextMatches(
          {
            name: part.name,
            id: part.id,
            path,
            qty,
            unitCost: (part.unitCents || 0) / 100,
            lead: part.lead,
            supply: part.supply,
            description: detail.description,
            supplier: detail.supplier,
          },
          query,
        );
    const activeChildren = children?.filter((child) => child.matches);
    return {
      id: part.id,
      name: part.name,
      description: detail.description,
      supplier: detail.supplier,
      path,
      qty,
      perParent: part.qty,
      unitCents: part.unitCents ?? null,
      costCents: children
        ? children.reduce((sum, child) => sum + child.costCents, 0)
        : matches
          ? qty * (part.unitCents || 0)
          : 0,
      lead: children
        ? Math.max(0, ...(activeChildren || []).map((child) => child.lead))
        : matches
          ? part.lead || 0
          : 0,
      supply: children
        ? supplyStates[
            Math.max(
              0,
              ...(activeChildren || []).map((child) => supplyStates.indexOf(child.supply)),
            )
          ]
        : part.supply || "Stocked",
      lineCount: children
        ? children.reduce((sum, child) => sum + child.lineCount, 0)
        : Number(matches),
      matches,
      children,
    };
  });
}

function flattenMaterials(nodes: MaterialRow[]): MaterialRow[] {
  return nodes.flatMap((node) => [node, ...flattenMaterials(node.children || [])]);
}
const fullBuild = buildMaterials(parts);
const allRows = flattenMaterials(fullBuild);
const fullCost = fullBuild.reduce((total, row) => total + row.costCents, 0);
const criticalPath = Math.max(...fullBuild.map((row) => row.lead));
const purchasedLines = allRows.filter((row) => !row.children);
const atRisk = purchasedLines.filter((row) => row.supply !== "Stocked").length;

function SupplyBadge({ supply }: { supply: Supply }) {
  return (
    <Badge
      variant={
        supply === "Shortage"
          ? "destructive-light"
          : supply === "Long lead"
            ? "warning-light"
            : supply === "Single source"
              ? "info-light"
              : "secondary"
      }
      className={cn(
        "h-5 font-medium",
        supply === "Single source" &&
          "border-violet-300/60 bg-violet-500/10 text-violet-700 dark:border-violet-700 dark:text-violet-300",
      )}
    >
      {supply}
    </Badge>
  );
}

function BuildShare({ cost }: { cost: number }) {
  const share = fullCost ? (cost / fullCost) * 100 : 0;
  const label = share < 10 ? share.toFixed(1) : Math.round(share);
  return (
    <span className="inline-flex items-center gap-2 text-xs font-normal text-muted-foreground">
      <svg
        viewBox="0 0 24 24"
        className="size-5 -rotate-90"
        role="img"
        aria-label={`${label}% of build cost`}
      >
        <circle
          cx="12"
          cy="12"
          r="9"
          fill="none"
          stroke="currentColor"
          strokeOpacity=".1"
          strokeWidth="3"
        />
        <circle
          cx="12"
          cy="12"
          r="9"
          fill="none"
          stroke="currentColor"
          className="text-foreground"
          strokeWidth="3"
          strokeLinecap="round"
          pathLength="100"
          strokeDasharray={`${share} 100`}
        />
      </svg>
      <span>{label}%</span>
    </span>
  );
}

function PartActions({ row }: { row: MaterialRow }) {
  async function copyNumber() {
    try {
      await navigator.clipboard.writeText(row.id);
      toast.success("Part number copied", { description: row.id });
    } catch {
      toast.error("Could not copy part number", { description: row.id });
    }
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-xs" aria-label={`Actions for ${row.id}`}>
          <Ellipsis className="size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuGroup>
          <DropdownMenuItem
            onSelect={() => toast("View part", { description: `${row.id} / ${row.name}` })}
          >
            <ExternalLink className="size-3.5" />
            View part
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              void copyNumber();
            }}
          >
            <Copy className="size-3.5" />
            Copy number
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() =>
              toast("Find supplier", {
                description: `Connect ${row.id} to your sourcing workflow.`,
              })
            }
          >
            <Truck className="size-3.5" />
            Find supplier
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function MaterialsTree() {
  const [query, setQuery] = useState("");
  const [supply, setSupply] = useState<Supply[]>([]);
  const [depth, setDepth] = useState("");
  const [expanded, setExpanded] = useState<ExpandedState>({
    "SYS-100": true,
    "ASM-110": true,
    "SUB-111": true,
  });
  const [hidden, setHidden] = useState<string[]>([]);
  const [compact, setCompact] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const rows = useMemo(() => buildMaterials(parts, query, supply), [query, supply]);
  const currentRows = flattenMaterials(rows);
  const filteredCost = rows.reduce((total, row) => total + row.costCents, 0);
  const filteredLead = Math.max(0, ...rows.map((row) => row.lead));
  const filteredLines = rows.reduce((total, row) => total + row.lineCount, 0);

  // Reveal matching ancestor paths once, while leaving native toggles usable afterwards.
  function updateQuery(next: string) {
    setQuery(next);
    if (next || supply.length) {
      setExpanded(true);
      setDepth("");
    }
  }
  function toggleSupply(status: Supply, checked: boolean) {
    const next = checked ? [...supply, status] : supply.filter((value) => value !== status);
    setSupply(next);
    if (query || next.length) {
      setExpanded(true);
      setDepth("");
    }
  }

  function changeDepth(next: string) {
    if (!next) return;
    setDepth(next);
    if (next === "All") setExpanded(true);
    else {
      const nextExpanded: Record<string, boolean> = {};
      function visit(nodes: MaterialRow[], level: number) {
        for (const row of nodes) {
          if (row.children && level < Number(next)) nextExpanded[row.id] = true;
          if (row.children) visit(row.children, level + 1);
        }
      }
      visit(rows, 0);
      setExpanded(nextExpanded);
    }
  }

  const fields: DomainField<MaterialRow>[] = [
    {
      id: "name",
      title: "Part",
      value: (row) => row.name,
      size: 420,
      className: "px-3",
      render: (part, _index, row) => {
        const Icon = partIcons[part.id] || Box;
        return (
          <div className="flex min-w-0 items-center gap-2.5">
            <DataGridTableRowExpand
              row={row}
              indent={20}
              className={compact ? "[&>span]:w-6" : "[&>span]:w-7"}
            />
            <IconTile
              size="xs"
              variant={part.children ? "elevated" : "outline"}
              className="text-muted-foreground"
            >
              <Icon className="size-3.5" />
            </IconTile>
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={cn("truncate", part.children && "font-semibold")}
                  title={part.name}
                >
                  {part.name}
                </span>
                {part.children && part.perParent > 1 && (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    x{part.qty} per build
                  </span>
                )}
              </div>
              {showDetails && (
                <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs leading-4 text-muted-foreground">
                  <span className="truncate" title={partDetails[part.id]?.description}>
                    {partDetails[part.id]?.description}
                  </span>
                  {partDetails[part.id]?.supplier && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="truncate" title={partDetails[part.id].supplier}>
                        {partDetails[part.id].supplier}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      id: "id",
      title: "Number",
      value: (row) => row.id,
      size: 108,
      className: "px-3 font-mono text-xs text-muted-foreground",
    },
    {
      id: "qty",
      title: "Qty",
      value: (row) => row.qty,
      size: 76,
      className: "px-3 text-right tabular-nums",
    },
    {
      id: "cost",
      title: "Unit Cost",
      value: (row) => row.unitCents,
      size: 110,
      className: "px-3 text-right tabular-nums",
      render: (row) =>
        row.unitCents === null ? (
          <span className="text-muted-foreground">--</span>
        ) : (
          formatMoney(row.unitCents)
        ),
    },
    {
      id: "extended",
      title: "Extended Cost",
      value: (row) => row.costCents,
      size: 196,
      className: "px-3 text-right font-medium tabular-nums",
      render: (row) => (
        <span className="inline-flex items-center gap-3">
          {row.children && <BuildShare cost={row.costCents} />}
          <span>{formatMoney(row.costCents)}</span>
        </span>
      ),
    },
    {
      id: "lead",
      title: "Lead Time",
      value: (row) => row.lead,
      size: 115,
      className: "px-3 text-right",
      render: (row) => (
        <Badge
          variant="outline"
          className={cn(
            "h-5 gap-1 font-normal",
            row.lead > 50 && "text-amber-600 dark:text-amber-400",
          )}
        >
          <Clock3 className="size-3" />
          {row.lead}d
        </Badge>
      ),
    },
    {
      id: "supply",
      title: "Supply",
      value: (row) => row.supply,
      size: 124,
      className: "px-3",
      render: (row) => <SupplyBadge supply={row.supply} />,
    },
    {
      id: "actions",
      title: "",
      header: () => null,
      value: (row) => row.id,
      size: 56,
      className: "px-3 text-right",
      render: (row) => <PartActions row={row} />,
    },
  ];

  return (
    <Frame
      variant="default"
      role="region"
      aria-label="Bill Of Materials"
      className="mx-auto mt-8 w-full min-w-0 max-w-[1216px] overflow-hidden rounded-2xl border text-sm shadow-xs max-sm:mt-12 max-sm:w-[calc(100%-72px)]"
    >
      <FrameHeader className="min-w-0 flex-col items-start gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 max-sm:w-full">
          <FrameTitle>
            <h2>Bill Of Materials</h2>
          </FrameTitle>
          <FrameDescription className="flex min-w-0 items-center gap-1.5">
            <span className="truncate">Meridian C2 Cargo</span>
            <span
              aria-hidden="true"
              className="size-1 shrink-0 rounded-full bg-muted-foreground/40"
            />
            <span className="shrink-0">Rev C · 24 Jul 2026</span>
          </FrameDescription>
        </div>
        <div className="flex flex-wrap items-center gap-3 max-sm:gap-y-3">
          <span className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground sm:border-r sm:pr-3">
            Build cost{" "}
            <Badge variant="outline" className="h-5 font-medium text-foreground tabular-nums">
              {formatMoney(fullCost)}
            </Badge>
          </span>
          <span className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground sm:border-r sm:pr-3">
            Critical path{" "}
            <Badge variant="outline" className="h-5 font-medium text-foreground tabular-nums">
              {criticalPath}d
            </Badge>
          </span>
          <span className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
            At risk{" "}
            <Badge variant="warning-light" className="h-5 font-medium tabular-nums">
              {atRisk}
            </Badge>
          </span>
          <span className="max-sm:basis-full">
            <ExportRows
              name="bill-of-materials"
              rows={currentRows
                .filter((row) => row.matches && !row.children)
                .map((row) => ({
                  part: row.name,
                  number: row.id,
                  quantity: row.qty,
                  unitCost: (row.unitCents || 0) / 100,
                  extendedCost: row.costCents / 100,
                  lead: row.lead,
                  supply: row.supply,
                }))}
            />
          </span>
        </div>
      </FrameHeader>
      <FramePanel className="bg-card p-0 shadow-none">
        <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3 max-sm:px-3">
          <div className="min-w-0 flex-1 basis-full sm:basis-auto">
            <GridSearch value={query} onChange={updateQuery} placeholder="Search parts..." />
          </div>
          <div className="flex flex-wrap items-center gap-2 max-sm:gap-y-1.5 sm:ml-auto">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Depth</span>
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                spacing={0}
                value={depth}
                onValueChange={changeDepth}
                aria-label="Tree depth"
              >
                {[
                  ["0", "Collapse"],
                  ["1", "1"],
                  ["2", "2"],
                  ["All", "All"],
                ].map(([value, label]) => (
                  <ToggleGroupItem
                    key={value}
                    value={value}
                    aria-label={`Set tree depth ${label}`}
                    className="h-8"
                  >
                    {label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <Truck className="size-3.5" />
                  Supply
                  {supply.length > 0 && (
                    <Badge variant="secondary" className="h-5">
                      {supply.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Supply status</DropdownMenuLabel>
                  {supplyStates.map((status) => (
                    <DropdownMenuCheckboxItem
                      key={status}
                      checked={supply.includes(status)}
                      onSelect={(event) => event.preventDefault()}
                      onCheckedChange={(checked) => toggleSupply(status, !!checked)}
                    >
                      {status}
                    </DropdownMenuCheckboxItem>
                  ))}
                  {supply.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => setSupply([])}>
                        Reset supply
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <SlidersHorizontal className="size-3.5" />
                  Display
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-[300px] p-0">
                <FieldGroup className="gap-3 px-3.5 py-3">
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-medium text-muted-foreground">Table</p>
                    <Field orientation="horizontal" className="min-h-9 justify-between gap-3">
                      <FieldLabel className="text-sm font-normal">Density</FieldLabel>
                      <Choice
                        label="Row density"
                        value={compact ? "Compact" : "Comfortable"}
                        options={["Compact", "Comfortable"]}
                        onChange={(value) => setCompact(value === "Compact")}
                        className="w-[132px] shrink-0"
                      />
                    </Field>
                    <Field orientation="horizontal" className="min-h-9 justify-between gap-3">
                      <FieldLabel htmlFor="bom-part-detail" className="text-sm font-normal">
                        Part detail
                      </FieldLabel>
                      <Switch
                        id="bom-part-detail"
                        checked={showDetails}
                        onCheckedChange={setShowDetails}
                      />
                    </Field>
                  </div>
                  <FieldSeparator className="-mx-3.5 my-0 h-px" />
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-medium text-muted-foreground">Display properties</p>
                    <div className="flex flex-wrap gap-1.5">
                      {["Number", "Unit Cost", "Lead Time", "Supply"].map((label) => {
                        const visible = !hidden.includes(label);
                        return (
                          <Button
                            key={label}
                            size="sm"
                            variant={visible ? "secondary" : "outline"}
                            aria-pressed={visible}
                            className="rounded-full border-foreground/10"
                            onClick={() =>
                              setHidden(
                                visible
                                  ? [...hidden, label]
                                  : hidden.filter((value) => value !== label),
                              )
                            }
                          >
                            {visible && <Check className="size-3.5" />}
                            {label}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </FieldGroup>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <DomainRecordGrid
          scrollArea="horizontal"
          data={rows}
          fields={fields}
          search={query}
          rowFilter={(row) => row.matches}
          getSubRows={(row) => row.children}
          getRowId={(row) => row.id}
          expanded={expanded}
          onExpandedChange={(next) => {
            setExpanded(next);
            setDepth("");
          }}
          hidden={hidden}
          onHiddenChange={setHidden}
          layout={{ dense: compact, columnsResizable: true }}
          className={cn(
            "[&_thead_tr]:h-10 [&_thead_th]:px-3 [&_thead_th]:text-sm [&_thead_th]:font-medium",
            compact
              ? showDetails
                ? "[&_tbody_td]:py-[5px] [&_tbody_tr]:h-[49px] [&_tbody_tr:last-child]:h-12"
                : "[&_tbody_tr]:h-[41px] [&_tbody_tr:last-child]:h-10"
              : showDetails
                ? "[&_tbody_tr]:h-14"
                : "[&_tbody_tr]:h-[45px] [&_tbody_tr:last-child]:h-11",
          )}
          footerContent={
            <DataGridTableFootRow>
              {fields
                .filter((field) => !hidden.includes(field.title))
                .map((field) => (
                  <DataGridTableFootRowCell
                    key={field.id}
                    className={cn(
                      "bg-muted/30 px-3",
                      typeof field.className === "string" ? field.className : undefined,
                    )}
                  >
                    {field.id === "name" ? (
                      <span className="inline-flex items-center gap-2 font-semibold">
                        Meridian C2 Cargo
                        <Badge variant="outline" className="h-5 font-normal text-muted-foreground">
                          {filteredLines} lines
                        </Badge>
                      </span>
                    ) : field.id === "extended" ? (
                      formatMoney(filteredCost)
                    ) : field.id === "lead" ? (
                      `${filteredLead}d`
                    ) : null}
                  </DataGridTableFootRowCell>
                ))}
            </DataGridTableFootRow>
          }
        />
      </FramePanel>
    </Frame>
  );
}
