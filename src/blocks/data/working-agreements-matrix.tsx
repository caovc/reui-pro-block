import { useRef, useState, type KeyboardEvent } from "react";
import { Activity, Brain, Rocket, SquareCode, TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  agreementAreas,
  agreementOutcomes,
  agreementWeeks,
  type AgreementRow,
  type AgreementWeek,
} from "./working-agreements-model";

const areaIcons = { review: SquareCode, release: Rocket, reliability: Activity, knowledge: Brain };
const desktopOnly = "hidden @min-[880px]:table-cell";

function weekVisibility(index: number) {
  if (index >= 21) return "table-cell";
  if (index >= 13) return "hidden @md:table-cell";
  return desktopOnly;
}

function weekDetail(row: AgreementRow, week: AgreementWeek) {
  const outcome = agreementOutcomes[week.outcome].detail;
  if (week.outcome === "paused")
    return `${outcome}, ${week.current ? "Paused this week" : "Release freeze"}`;
  if (week.outcome === "unadopted") return `${outcome}, no observations yet`;
  return `${outcome}, ${week.done} of ${week.due} ${row.unit}${week.current ? " so far" : ""}, ${week.share}% against a ${row.target}% target`;
}

function WeekTile({
  row,
  week,
  onPause,
  onEdit,
}: {
  row: AgreementRow;
  week: AgreementWeek;
  onPause: (row: AgreementRow, pause: boolean) => void;
  onEdit: (row: AgreementRow, trigger: HTMLButtonElement) => void;
}) {
  const outcome = agreementOutcomes[week.outcome];
  const Trend = row.slipping ? TrendingDown : TrendingUp;
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const openingEditor = useRef(false);
  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) openingEditor.current = false;
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          ref={trigger}
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`${row.name}, week of ${week.label}: ${weekDetail(row, week)}`}
          tabIndex={week.current ? 0 : -1}
          data-agreement-week={week.index}
          className="h-7 w-full min-w-0 rounded-sm px-0 hover:bg-muted @min-[880px]:h-[22px]"
        >
          <span aria-hidden="true" className={cn("size-4 rounded-[3px]", outcome.fill)} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        aria-label={`${row.name}, week of ${week.label}`}
        align="center"
        side="top"
        className="w-64 gap-2.5"
        onCloseAutoFocus={(event) => {
          if (openingEditor.current) event.preventDefault();
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="text-sm font-medium">{row.name}</h4>
            <p className="text-xs text-muted-foreground">
              Week of {week.label} to {week.endLabel}
            </p>
          </div>
          <Badge variant="outline" size="sm" className="shrink-0">
            {outcome.detail}
          </Badge>
        </div>
        {week.due > 0 && week.outcome !== "paused" ? (
          <div className="flex flex-col gap-1.5">
            <p className="font-medium">
              {week.done} of {week.due} {row.unit}
              {week.current ? " so far" : ""}
            </p>
            <p className="text-xs text-muted-foreground">
              {week.share}% against a {row.target}% target
            </p>
            <div className="relative my-1">
              <Progress
                aria-label="Weekly target progress"
                value={week.share}
                className="h-2.5 bg-muted [&_[data-slot=progress-indicator]]:bg-teal-500"
              />
              <span
                className="pointer-events-none absolute inset-y-[-2px] w-0.5 -translate-x-1/2 rounded-full bg-foreground"
                style={{ left: `${row.target}%` }}
                aria-hidden="true"
              />
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">{weekDetail(row, week)}</p>
        )}
        <dl className="grid grid-cols-3 gap-2 border-t pt-2.5 tabular-nums">
          <div>
            <dt className="text-xs text-muted-foreground">Weeks Kept</dt>
            <dd className="font-medium">
              {row.done}/{row.finished}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Streak</dt>
            <dd className="font-medium">{row.streak} wk</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Last 4</dt>
            <dd className="flex items-center gap-1 font-medium">
              <Trend aria-hidden="true" className="size-3.5" />
              {row.recentDone}/{row.recentCount}
            </dd>
          </div>
        </dl>
        {week.current && (
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onPause(row, week.outcome !== "paused")}
            >
              {week.outcome === "paused" ? "Resume Week" : "Pause Week"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (!trigger.current) return;
                openingEditor.current = true;
                setOpen(false);
                onEdit(row, trigger.current);
              }}
            >
              Edit Target
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function focusNeighbor(event: KeyboardEvent<HTMLTableElement>) {
  const cell = event.target;
  if (!(cell instanceof HTMLButtonElement) || !cell.dataset.agreementWeek) return;
  const row = cell.closest<HTMLTableRowElement>("[data-agreement-row]");
  if (!row) return;
  let next: HTMLButtonElement | undefined;
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    const buttons = Array.from(
      row.querySelectorAll<HTMLButtonElement>("[data-agreement-week]"),
    ).filter((button) => button.getClientRects().length > 0);
    next = buttons[buttons.indexOf(cell) + (event.key === "ArrowLeft" ? -1 : 1)];
  }
  if (event.key === "ArrowUp" || event.key === "ArrowDown") {
    const rows = Array.from(
      event.currentTarget.querySelectorAll<HTMLTableRowElement>("[data-agreement-row]"),
    );
    const neighbor = rows[rows.indexOf(row) + (event.key === "ArrowUp" ? -1 : 1)];
    next =
      neighbor?.querySelector<HTMLButtonElement>(
        `[data-agreement-week="${cell.dataset.agreementWeek}"]`,
      ) ?? undefined;
  }
  if (next) {
    event.preventDefault();
    next.focus();
  }
}

export function WorkingAgreementsMatrix({
  teamName,
  rows,
  sortHint,
  onPause,
  onEdit,
}: {
  teamName: string;
  rows: AgreementRow[];
  sortHint: string;
  onPause: (row: AgreementRow, pause: boolean) => void;
  onEdit: (row: AgreementRow, trigger: HTMLButtonElement) => void;
}) {
  return (
    <Table
      aria-label={`${teamName} working agreements by week`}
      className="table-fixed"
      onKeyDown={focusNeighbor}
    >
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead
            className={cn(desktopOnly, "w-28 border-r text-center text-xs text-muted-foreground")}
          >
            Area
          </TableHead>
          <TableHead className="h-14 pl-4 text-xs font-normal text-muted-foreground @min-[880px]:w-[174px]">
            <span className="block">Agreement</span>
            <span className="mt-1 block truncate">{sortHint}</span>
          </TableHead>
          {agreementWeeks.map((week, index) => {
            const monthStarts = index === 0 || week.month !== agreementWeeks[index - 1].month;
            return (
              <TableHead
                key={week.index}
                className={cn(
                  weekVisibility(index),
                  "relative h-14 w-6 p-0 text-center text-xs tabular-nums @min-[880px]:w-auto",
                  week.current && "w-10",
                )}
              >
                <span className="sr-only">
                  Week of {week.label}
                  {week.current ? ", this week" : ""}
                </span>
                {monthStarts && (
                  <span className="absolute top-2 left-0 text-muted-foreground" aria-hidden="true">
                    {week.month}
                  </span>
                )}
                {index % 2 === 1 && (
                  <span
                    className={cn(
                      "absolute right-0 bottom-2 left-0",
                      week.current &&
                        "right-4 text-teal-700 underline underline-offset-4 @min-[880px]:right-0 dark:text-teal-300",
                    )}
                    aria-hidden="true"
                  >
                    {week.day}
                  </span>
                )}
              </TableHead>
            );
          })}
          <TableHead
            className={cn(
              desktopOnly,
              "w-16 text-center text-xs font-normal text-muted-foreground",
            )}
          >
            Target
          </TableHead>
        </TableRow>
      </TableHeader>
      {agreementAreas.map((area) => {
        const areaRows = rows.filter((row) => row.area === area.id);
        if (!areaRows.length) return null;
        const Icon = areaIcons[area.id];
        const kept = areaRows.reduce((sum, row) => sum + row.done, 0);
        const finished = areaRows.reduce((sum, row) => sum + row.finished, 0);
        return (
          <TableBody key={area.id} className="border-t">
            <TableRow className="border-0 hover:bg-transparent @min-[880px]:hidden">
              <TableCell className="overflow-visible pt-3 pb-1 pl-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                  <Icon aria-hidden="true" className="size-3.5" />
                  {area.label} <span aria-hidden="true">·</span> {kept}/{finished} kept
                </span>
              </TableCell>
            </TableRow>
            {areaRows.map((row, index) => (
              <TableRow
                key={row.id}
                data-agreement-row={row.id}
                className={cn(
                  "border-0 hover:bg-transparent",
                  index === 0 && "@min-[880px]:[&>td]:pt-2",
                  index === areaRows.length - 1 && "@min-[880px]:[&>td]:pb-2",
                )}
              >
                {index === 0 && (
                  <TableHead
                    scope="rowgroup"
                    rowSpan={areaRows.length}
                    className={cn(desktopOnly, "border-r text-center")}
                  >
                    <Icon
                      aria-hidden="true"
                      className="mx-auto mb-1 size-4 text-teal-700 dark:text-teal-300"
                    />
                    {area.label}
                  </TableHead>
                )}
                <TableHead
                  scope="row"
                  className={cn(
                    "h-auto py-2 pl-4 text-sm font-normal whitespace-normal @min-[880px]:py-0",
                    index === 0 && "@min-[880px]:pt-2",
                    index === areaRows.length - 1 && "@min-[880px]:pb-2",
                  )}
                >
                  <span className="block @min-[880px]:truncate" title={row.name}>
                    {row.name}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground @min-[880px]:hidden">
                    Target {row.target}%
                  </span>
                  <span className="sr-only">
                    {row.done} of {row.finished} weeks kept. Streak {row.streak} weeks.
                  </span>
                </TableHead>
                {row.weeks.map((week) => (
                  <TableCell
                    key={week.index}
                    className={cn(
                      weekVisibility(week.index),
                      "p-0 text-center",
                      week.current && "pr-4 @min-[880px]:pr-0",
                    )}
                  >
                    <WeekTile row={row} week={week} onPause={onPause} onEdit={onEdit} />
                  </TableCell>
                ))}
                <TableCell
                  className={cn(desktopOnly, "p-0 text-center text-muted-foreground tabular-nums")}
                >
                  {row.target}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        );
      })}
    </Table>
  );
}
