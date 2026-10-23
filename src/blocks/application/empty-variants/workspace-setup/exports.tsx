import { useMemo, useState } from "react";
import { Archive, ChevronDown, Download, Play } from "lucide-react";
import { format, subDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import { downloadFile } from "@/lib/download";
import { IconStack } from "@/components/reui/icon-stack";
import { Badge } from "@/components/reui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FreeRangePicker } from "./free/range-picker";
import {
  activityCSV,
  activityForFilters,
  audienceOptions,
  printableBrief,
  rangeOptions,
  sampleActivity,
  workspaceOptions,
  type ActivityRow,
  type ExportFilters,
} from "./export-data";
import { WorkspaceDialog, WorkspaceStage } from "./support";

function ExportFilter({
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" aria-label={`${label}: ${value}`}>
          {value}
          <ChevronDown className="size-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
          {options.map((option) => (
            <DropdownMenuRadioItem key={option} value={option}>
              {option}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function ExportsEmpty() {
  const [filters, setFilters] = useState<ExportFilters>({
    audience: "Everyone",
    workspace: "All workspaces",
    range: "Last 30 days",
  });
  const [anchor] = useState(() => new Date());
  const samples = useMemo(() => sampleActivity(anchor), [anchor]);
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [rangeDraft, setRangeDraft] = useState<DateRange | undefined>();
  const [modal, setModal] = useState<"range" | "pdf" | "schedule" | null>(null);
  const [result, setResult] = useState<{ rows: ActivityRow[]; filters: ExportFilters } | null>(
    null,
  );
  const [email, setEmail] = useState("");
  const [frequency, setFrequency] = useState("Weekly on Monday");
  const [delivery, setDelivery] = useState<{ email: string; frequency: string } | null>(null);
  const currentRows = activityForFilters(samples, filters, anchor, customRange);

  function chooseFilter(key: keyof ExportFilters, value: string) {
    if (key === "range" && value === "Custom window") {
      setRangeDraft(customRange ?? { from: subDays(anchor, 6), to: anchor });
      setModal("range");
      return;
    }
    setFilters((current) => ({ ...current, [key]: value }));
    setResult(null);
  }

  return (
    <WorkspaceStage id={12}>
      <section className="empty-workspace-page" aria-label="Activity Exports">
        <h1 className="sr-only">Activity exports empty state</h1>
        <header className="empty-workspace-header">
          <div>
            <h2>Activity Exports</h2>
            <p>
              Download scoped activity packets for billing review, staffing audits, and client
              handoffs.
            </p>
          </div>
        </header>
        <div className="empty-workspace-toolbar">
          <div>
            <ExportFilter
              label="Audience"
              value={filters.audience}
              options={audienceOptions}
              onChange={(value) => chooseFilter("audience", value)}
            />
            <ExportFilter
              label="Workspace"
              value={filters.workspace}
              options={workspaceOptions}
              onChange={(value) => chooseFilter("workspace", value)}
            />
            <ExportFilter
              label="Date range"
              value={filters.range}
              options={rangeOptions}
              onChange={(value) => chooseFilter("range", value)}
            />
          </div>
          <ButtonGroup>
            <Button onClick={() => setResult({ rows: currentRows, filters: { ...filters } })}>
              <Play className="size-3.5 fill-current" />
              Execute
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" aria-label="Open download options">
                  <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onSelect={() =>
                      downloadFile(
                        "activity-bundle.csv",
                        activityCSV(currentRows),
                        "text/csv;charset=utf-8",
                      )
                    }
                  >
                    CSV bundle
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setModal("pdf")}>PDF brief</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setModal("schedule")}>
                    Schedule delivery
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </ButtonGroup>
        </div>
        <Separator />
        {result?.rows.length ? (
          <>
            <div className="empty-workspace-result-header">
              <div>
                <h3 className="text-sm font-semibold">Local activity packet</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {result.filters.audience} · {result.filters.workspace} · {result.filters.range} ·
                  Sample records
                </p>
              </div>
              <Badge variant="secondary">{result.rows.length} records</Badge>
            </div>
            <div className="empty-workspace-results-table">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Workspace</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Minutes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.rows.map((row) => (
                    <TableRow key={row.name}>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.activity}</TableCell>
                      <TableCell>{row.workspace}</TableCell>
                      <TableCell>{format(row.date, "MMM d, yyyy")}</TableCell>
                      <TableCell className="text-right">{row.minutes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              No real activity service is connected. This export uses local example rows.
            </p>
          </>
        ) : (
          <Empty className="empty-workspace-export-empty">
            <EmptyHeader>
              <EmptyMedia>
                <IconStack>
                  <Archive className="size-7" strokeWidth={1.5} />
                </IconStack>
              </EmptyMedia>
              <EmptyTitle>No exportable activity yet</EmptyTitle>
              <EmptyDescription>
                {result
                  ? "No example records match this filter window. Broaden the filters to create a local packet."
                  : "Capture approved activity and this view will assemble your next review packet."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
        {delivery && (
          <Alert variant="success" className="mt-4">
            <AlertTitle>Delivery draft saved locally</AlertTitle>
            <AlertDescription>
              {delivery.email} · {delivery.frequency}. No email has been sent or scheduled on a
              server.
            </AlertDescription>
          </Alert>
        )}
      </section>
      <WorkspaceDialog
        title={
          modal === "range"
            ? "Custom window"
            : modal === "pdf"
              ? "PDF brief preview"
              : "Schedule delivery"
        }
        description={
          modal === "range"
            ? "Choose the activity window included in your export."
            : modal === "pdf"
              ? "Printable local HTML for browser Print / Save as PDF. No PDF generation service is connected."
              : "Save a local delivery draft. No email is sent and no server schedule is created."
        }
        open={modal !== null}
        onOpenChange={(value) => !value && setModal(null)}
      >
        {modal === "range" ? (
          <div className="grid justify-items-start gap-4">
            <FreeRangePicker initialRange={rangeDraft} onChange={setRangeDraft} />
            <Button
              disabled={!rangeDraft?.from}
              onClick={() => {
                setCustomRange(rangeDraft);
                setFilters((current) => ({ ...current, range: "Custom window" }));
                setResult(null);
                setModal(null);
              }}
            >
              Apply custom window
            </Button>
          </div>
        ) : modal === "pdf" ? (
          <div className="grid gap-4">
            <p className="text-sm leading-relaxed">
              {filters.audience} · {filters.workspace} · {filters.range}
            </p>
            <p className="text-sm text-muted-foreground">
              {currentRows.length} sample records ·{" "}
              {currentRows.reduce((total, row) => total + row.minutes, 0)} minutes
            </p>
            <Button
              onClick={() =>
                downloadFile(
                  "activity-brief.html",
                  printableBrief(currentRows, filters),
                  "text/html;charset=utf-8",
                )
              }
            >
              <Download />
              Download printable brief
            </Button>
          </div>
        ) : (
          <form
            className="empty-workspace-form"
            onSubmit={(event) => {
              event.preventDefault();
              setDelivery({ email: email.trim(), frequency });
              setModal(null);
            }}
          >
            <label>
              Delivery email
              <Input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="reviewer@example.com"
                maxLength={160}
              />
            </label>
            <label>
              Frequency
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Weekly on Monday", "Monthly on the first", "After each review cycle"].map(
                    (value) => (
                      <SelectItem value={value} key={value}>
                        {value}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </label>
            <Button type="submit">Save local delivery draft</Button>
          </form>
        )}
      </WorkspaceDialog>
    </WorkspaceStage>
  );
}
