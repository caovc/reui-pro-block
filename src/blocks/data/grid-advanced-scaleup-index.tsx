import { useId, useMemo, useRef, useState, type CSSProperties } from "react";
import { Check, ChevronDown, Download, Medal, Search, Undo2 } from "lucide-react";
import { Badge } from "@/components/reui/badge";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import { DataGridColumnVisibility } from "@/components/reui/data-grid/data-grid-column-visibility";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { downloadFile } from "@/lib/download";
import { FinanceSelect } from "./grid-advanced-finance-controls";
import { DomainGridSurface, useDomainGrid, type DomainColumn } from "./grid-advanced-model-grid";
import {
  createScaleupCompanies,
  filterScaleups,
  rankScaleups,
  SCALEUP_CHECKS,
  SCALEUP_PROVINCES,
  SCALEUP_YEARS,
  scaleupSummary,
  SCREEN_ANSWERS,
  setScaleupCheck,
  type RankedScaleup,
  type ScaleupCheck,
  type ScaleupCompany,
  type ScaleupProvince,
  type ScreenAnswer,
} from "./grid-advanced-scaleup-index-model";
import "./grid-advanced-scaleup-index.css";

const checkLabels: Record<ScaleupCheck, string> = {
  independent: "Independent",
  audited: "Audited",
  recurring: "Recurring",
};
const provinceCodes = ["DR", "FL", "FR", "GE", "GR", "LI", "NB", "NH", "OV", "SH", "UT", "ZE"];
const provinceOptions = [
  { value: "all" as const, label: "All provinces" },
  ...SCALEUP_PROVINCES.map(({ id, name }) => ({ value: id, label: name })),
];
const yearOptions = SCALEUP_YEARS.map((year) => ({ value: String(year), label: String(year) }));
const currency = new Intl.NumberFormat("en-NL", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
const integers = new Intl.NumberFormat("en-NL");

function money(cents: number | null) {
  return cents === null ? "—" : currency.format(cents / 100);
}

function percent(value: number | null) {
  return value === null ? "—" : value.toFixed(1) + "%";
}

function provinceName(id: ScaleupProvince) {
  return SCALEUP_PROVINCES.find((province) => province.id === id)!.name;
}

function CompanyRank({ position }: { position: number | null }) {
  if (position === null) return <span className="text-muted-foreground">Unranked</span>;
  return (
    <span className="scaleup-rank" data-position={position}>
      {position <= 3 && <Medal aria-hidden="true" />}
      <span>#{position}</span>
    </span>
  );
}

function ScreenCheck({
  company,
  check,
  onChange,
}: {
  company: ScaleupCompany;
  check: ScaleupCheck;
  onChange: (next: ScreenAnswer) => void;
}) {
  const value = company.checks[check];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="xs"
          variant="outline"
          aria-label={company.name + ", " + checkLabels[check] + ": " + value}
          className="scaleup-check"
          data-answer={value}
        >
          {value}
          <ChevronDown aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(next) => {
            const answer = SCREEN_ANSWERS.find((item) => item === next);
            if (answer && answer !== value) onChange(answer);
          }}
        >
          {SCREEN_ANSWERS.map((answer) => (
            <DropdownMenuRadioItem key={answer} value={answer}>
              {answer}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ProvinceLocator({
  selected,
  rows,
  onSelect,
}: {
  selected: ScaleupProvince | "all";
  rows: RankedScaleup[];
  onSelect: (next: ScaleupProvince | "all") => void;
}) {
  const counts = new Map<ScaleupProvince, number>();
  for (const { company } of rows) {
    counts.set(company.province, (counts.get(company.province) ?? 0) + 1);
  }
  return (
    <Frame className="min-w-0">
      <FrameHeader>
        <div>
          <FrameTitle>Province locator</FrameTitle>
          <FrameDescription>Select a province to filter the companies.</FrameDescription>
        </div>
      </FrameHeader>
      <FramePanel>
        <div className="scaleup-map" role="group" aria-label="Schematic province map">
          {SCALEUP_PROVINCES.map((province, index) => (
            <Button
              key={province.id}
              size="icon-xs"
              variant={selected === province.id ? "default" : "outline"}
              aria-label={"Show companies in " + province.name}
              aria-pressed={selected === province.id}
              title={province.name}
              className="scaleup-map-pin"
              style={{ "--pin-x": province.x + "%", "--pin-y": province.y + "%" } as CSSProperties}
              onClick={() => onSelect(selected === province.id ? "all" : province.id)}
            >
              {provinceCodes[index]}
            </Button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">
            {selected === "all" ? "Netherlands" : provinceName(selected)}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {selected === "all" ? rows.length : (counts.get(selected) ?? 0)} companies
          </span>
        </div>
      </FramePanel>
    </Frame>
  );
}

function CompanyProfile({
  row,
  year,
  restoreFocus,
  onClose,
}: {
  row: RankedScaleup | undefined;
  year: number;
  restoreFocus: () => void;
  onClose: () => void;
}) {
  return (
    <Sheet open={Boolean(row)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        className="w-full max-w-full data-[side=right]:sm:max-w-[460px]"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          restoreFocus();
        }}
      >
        <SheetHeader>
          <SheetTitle>{row?.company.name ?? "Company profile"}</SheetTitle>
          <SheetDescription>
            {row && provinceName(row.company.province) + " · " + row.company.sector}
          </SheetDescription>
        </SheetHeader>
        {row && (
          <div className="min-h-0 overflow-auto px-4 pb-5">
            <dl className="scaleup-profile grid grid-cols-2 gap-3">
              <div>
                <dt>Index year</dt>
                <dd>{year}</dd>
              </div>
              <div>
                <dt>Founded</dt>
                <dd>{row.company.founded}</dd>
              </div>
              <div>
                <dt>National rank</dt>
                <dd>{row.overallRank ?? "Unranked"}</dd>
              </div>
              <div>
                <dt>Province rank</dt>
                <dd>{row.provinceRank ?? "Unranked"}</dd>
              </div>
            </dl>
            <h3 className="mt-5 mb-2 text-sm font-semibold">Reporting history</h3>
            <Table className="scaleup-history w-full text-left text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Year</TableHead>
                  <TableHead scope="col">Sales</TableHead>
                  <TableHead scope="col">Team</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {row.company.facts
                  .toSorted((a, b) => b.year - a.year)
                  .map((fact) => (
                    <TableRow key={fact.year}>
                      <TableHead scope="row">{fact.year}</TableHead>
                      <TableCell>{money(fact.revenueCents)}</TableCell>
                      <TableCell>{fact.employees}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

type CheckUndo = { id: string; check: ScaleupCheck; previous: ScreenAnswer };

export default function ScaleupIndex() {
  const rankedOnlyId = useId();
  const [companies, setCompanies] = useState(createScaleupCompanies);
  const [year, setYear] = useState("2026");
  const [province, setProvince] = useState<ScaleupProvince | "all">("all");
  const [search, setSearch] = useState("");
  const [rankedOnly, setRankedOnly] = useState(false);
  const [profileId, setProfileId] = useState<string>();
  const [lastChange, setLastChange] = useState<CheckUndo>();
  const [announcement, setAnnouncement] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const ranked = useMemo(() => rankScaleups(companies, Number(year)), [companies, year]);
  const visible = useMemo(
    () =>
      filterScaleups(ranked, search, province === "all" ? [] : [province], rankedOnly).toSorted(
        (a, b) =>
          (a.overallRank ?? Infinity) - (b.overallRank ?? Infinity) ||
          a.company.name.localeCompare(b.company.name),
      ),
    [ranked, search, province, rankedOnly],
  );
  const totals = scaleupSummary(visible);
  const profile = ranked.find((row) => row.company.id === profileId);

  function updateCheck(row: RankedScaleup, check: ScaleupCheck, next: ScreenAnswer) {
    const { id, name, checks } = row.company;
    setCompanies((current) => setScaleupCheck(current, id, check, next).companies);
    setLastChange({ id, check, previous: checks[check] });
    setAnnouncement(name + " · " + checkLabels[check] + " changed to " + next);
    if (rankedOnly && next === "No") requestAnimationFrame(() => searchRef.current?.focus());
  }

  function undoCheck() {
    if (!lastChange) return;
    const { id, check, previous } = lastChange;
    setCompanies((current) => setScaleupCheck(current, id, check, previous).companies);
    setLastChange(undefined);
    setAnnouncement("Previous check restored");
  }

  const columns: DomainColumn<RankedScaleup>[] = [
    {
      id: "company",
      size: 184,
      header: "Company",
      accessorFn: ({ company }) => company.name,
      enableHiding: false,
      cell: ({ row }) => (
        <Button
          variant="link"
          className="h-auto justify-start px-0 text-left"
          onClick={(event) => {
            opener.current = event.currentTarget;
            setProfileId(row.original.company.id);
          }}
        >
          {row.original.company.name}
        </Button>
      ),
    },
    {
      id: "province",
      header: "Province",
      size: 135,
      accessorFn: ({ company }) => provinceName(company.province),
    },
    {
      id: "provinceRank",
      header: "Local rank",
      size: 110,
      accessorFn: ({ provinceRank }) => provinceRank ?? undefined,
      sortUndefined: "last",
      cell: ({ row }) => <CompanyRank position={row.original.provinceRank} />,
    },
    {
      id: "revenue",
      header: "Sales",
      size: 115,
      accessorFn: ({ metrics }) => metrics.revenueCents,
      cell: ({ row }) => money(row.original.metrics.revenueCents),
    },
    {
      id: "growth",
      header: "3-year CAGR",
      size: 109,
      accessorFn: ({ metrics }) => metrics.growth,
      cell: ({ row }) => percent(row.original.metrics.growth),
    },
    {
      id: "margin",
      header: "Gross margin",
      size: 112,
      accessorFn: ({ metrics }) => metrics.margin,
      cell: ({ row }) => percent(row.original.metrics.margin),
    },
    {
      id: "employees",
      header: "Team",
      size: 83,
      accessorFn: ({ metrics }) => metrics.employees,
    },
    ...SCALEUP_CHECKS.map((check): DomainColumn<RankedScaleup> => ({
      id: check,
      header: checkLabels[check],
      size: 112,
      accessorFn: ({ company }) => company.checks[check],
      cell: ({ row }) => (
        <ScreenCheck
          company={row.original.company}
          check={check}
          onChange={(next) => updateCheck(row.original, check, next)}
        />
      ),
    })),
  ];
  const table = useDomainGrid({ data: visible, columns, getRowId: ({ company }) => company.id });

  function exportView() {
    const gridRows = table.getRowModel().rows.map(({ original }) => original);
    const lines = [
      [
        "Company",
        "Province",
        "Year",
        "National rank",
        "Local rank",
        "Revenue (EUR)",
        "CAGR",
        "Margin",
        ...SCALEUP_CHECKS.map((check) => checkLabels[check]),
      ],
      ...gridRows.map(({ company, metrics, overallRank, provinceRank }) => [
        company.name,
        provinceName(company.province),
        year,
        overallRank,
        provinceRank,
        metrics.revenueCents === null ? "" : (metrics.revenueCents / 100).toFixed(2),
        metrics.growth?.toFixed(2),
        metrics.margin?.toFixed(2),
        ...SCALEUP_CHECKS.map((check) => company.checks[check]),
      ]),
    ];
    const csv = lines
      .map((line) =>
        line.map((value) => '"' + String(value ?? "").replaceAll('"', '""') + '"').join(","),
      )
      .join("\r\n");
    downloadFile("scale-up-index-" + year + ".csv", csv, "text/csv;charset=utf-8");
  }

  return (
    <section
      className="scaleup-index mx-auto max-w-[1400px] px-4 py-8 sm:px-6 sm:py-12"
      aria-label="Scale-up Index"
    >
      <Frame className="mb-4 min-w-0">
        <FrameHeader className="flex-wrap gap-3">
          <div>
            <h1 className="text-base font-semibold">Scale-up Index</h1>
            <FrameDescription>Dutch company rankings and eligibility checks.</FrameDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <FinanceSelect
              value={year}
              options={yearOptions}
              label="Index year"
              onChange={setYear}
            />
            <Button size="sm" variant="outline" disabled={!visible.length} onClick={exportView}>
              <Download data-icon="inline-start" aria-hidden="true" />
              Export CSV
            </Button>
          </div>
        </FrameHeader>
        <FramePanel className="p-0">
          <dl className="scaleup-summary">
            <div>
              <dt>Companies</dt>
              <dd>{totals.companies}</dd>
            </div>
            <div>
              <dt>Ranked</dt>
              <dd>{totals.eligible}</dd>
            </div>
            <div>
              <dt>Combined sales</dt>
              <dd>{money(totals.revenueCents)}</dd>
            </div>
            <div>
              <dt>Weighted margin</dt>
              <dd>{percent(totals.weightedMargin)}</dd>
            </div>
          </dl>
        </FramePanel>
      </Frame>

      <div className="scaleup-workspace grid gap-4">
        <Frame className="min-w-0">
          <FrameHeader>
            <div>
              <FrameTitle>Company register</FrameTitle>
              <FrameDescription>
                Ranking uses three-year sales growth and screening checks.
              </FrameDescription>
            </div>
          </FrameHeader>
          <FramePanel className="p-0">
            <DomainGridSurface
              table={table}
              scrollArea="horizontal"
              layout={{ columnsVisibility: true, headerSticky: true }}
              renderFrame={(grid) => (
                <>
                  <div className="scaleup-controls">
                    <InputGroup className="w-full min-w-0 sm:w-52">
                      <InputGroupAddon>
                        <Search aria-hidden="true" />
                      </InputGroupAddon>
                      <InputGroupInput
                        ref={searchRef}
                        type="search"
                        aria-label="Search companies"
                        placeholder="Search companies"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                      />
                    </InputGroup>
                    <FinanceSelect
                      value={province}
                      options={provinceOptions}
                      label="Province"
                      onChange={setProvince}
                    />
                    <label htmlFor={rankedOnlyId} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        id={rankedOnlyId}
                        checked={rankedOnly}
                        onCheckedChange={(next) => setRankedOnly(next === true)}
                      />
                      Ranked only
                    </label>
                    <DataGridColumnVisibility
                      table={table}
                      trigger={
                        <Button size="sm" variant="outline">
                          Columns
                        </Button>
                      }
                    />
                    <Button size="sm" variant="ghost" disabled={!lastChange} onClick={undoCheck}>
                      <Undo2 data-icon="inline-start" aria-hidden="true" />
                      Undo check
                    </Button>
                  </div>
                  {grid}
                  <div className="scaleup-footer">
                    <span>
                      {integers.format(visible.length)} of {integers.format(ranked.length)}{" "}
                      companies
                    </span>
                    <span role="status">
                      {announcement && <Check aria-hidden="true" />}
                      {announcement}
                    </span>
                  </div>
                </>
              )}
            />
          </FramePanel>
        </Frame>
        <ProvinceLocator selected={province} rows={ranked} onSelect={setProvince} />
      </div>
      <CompanyProfile
        row={profile}
        year={Number(year)}
        onClose={() => setProfileId(undefined)}
        restoreFocus={() => {
          const control = opener.current?.isConnected ? opener.current : searchRef.current;
          control?.focus();
        }}
      />
    </section>
  );
}
