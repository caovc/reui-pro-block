import { useId, useMemo, useRef, useState } from "react";
import { Area, AreaChart, YAxis } from "recharts";
import {
  ClipboardList,
  Copy,
  Download,
  Ellipsis,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
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
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { downloadCsv } from "./data-utils";
import { ReuiScoreRings } from "./reui-free-chart-primitives";
import { WorkingAgreementsMatrix } from "./working-agreements-matrix";
import {
  agreementAreas,
  agreementOutcomes,
  agreementOverrideKey,
  agreementRows,
  agreementScore,
  agreementTeams,
  type AgreementArea,
  type AgreementOutcome,
  type AgreementOverride,
  type AgreementOverrides,
  type AgreementRow,
  type AgreementTeam,
} from "./working-agreements-model";

const sortOptions = [
  { id: "kept", label: "Kept Share", hint: "Lowest kept share first" },
  { id: "streak", label: "Streak", hint: "Shortest streak first" },
  { id: "name", label: "Name", hint: "Alphabetical" },
] as const;
type Sort = (typeof sortOptions)[number]["id"];
type AreaFilter = AgreementArea | "all";

const scoreConfig = { score: { label: "Weeks kept", color: "#2ba99e" } };

function AgreementSummary({ score }: { score: ReturnType<typeof agreementScore> }) {
  const fillId = useId().replaceAll(":", "");
  return (
    <FramePanel className="grid divide-y px-0 py-0 @min-[880px]:grid-cols-3 @min-[880px]:divide-x @min-[880px]:divide-y-0">
      <section aria-label="This Week" className="flex min-w-0 flex-col gap-1.5 px-4 py-3.5">
        <div className="flex justify-between gap-1 text-xs text-muted-foreground">
          <h4>This Week</h4>
          <span>Day 2 of 5</span>
        </div>
        <div className="flex items-baseline gap-1.5 text-sm text-muted-foreground">
          <strong className="text-2xl leading-none font-semibold text-foreground tabular-nums">
            {score.onTrack}
          </strong>
          <span>of {score.activeCount} on track</span>
        </div>
        <div className="relative">
          <Progress
            value={score.progress}
            aria-label="Agreements on track"
            className="h-3 bg-teal-100 dark:bg-teal-950 [&_[data-slot=progress-indicator]]:bg-teal-700 dark:[&_[data-slot=progress-indicator]]:bg-teal-500"
          />
          {score.progress > 16 && (
            <span
              className="absolute top-0 -translate-x-full pr-2 text-[10px] leading-3 text-white tabular-nums"
              style={{ left: `${score.progress}%` }}
              aria-hidden="true"
            >
              {score.progress}%
            </span>
          )}
        </div>
      </section>
      <section aria-label="Team Score" className="flex min-w-0 flex-col gap-1.5 px-4 py-3">
        <div className="flex justify-between gap-1 text-xs text-muted-foreground">
          <h4>Team Score</h4>
          <span className="whitespace-nowrap">
            Last 4 wk <strong className="font-medium text-foreground">{score.recent}%</strong> · was{" "}
            {score.previous}%
          </span>
        </div>
        <div className="flex items-center gap-3">
          <ReuiScoreRings
            values={[{ score: score.total, color: "#2ba99e" }]}
            label={`${score.total}% of finished weeks kept`}
          >
            <span className="text-xs">{score.total}%</span>
          </ReuiScoreRings>
          <div className="min-w-0 flex-1">
            <div className="text-xs text-muted-foreground">Weekly score</div>
            <ChartContainer
              config={scoreConfig}
              className="aspect-auto h-8 w-full"
              initialDimension={{ width: 208, height: 32 }}
            >
              <AreaChart data={score.weeks} margin={{ top: 3, right: 3, bottom: 0, left: 1 }}>
                <defs>
                  <linearGradient id={fillId} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-score)" stopOpacity={0.26} />
                    <stop offset="100%" stopColor="var(--color-score)" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <YAxis hide domain={[0, 100]} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Area
                  dataKey="score"
                  type="monotone"
                  stroke="var(--color-score)"
                  strokeWidth={1.5}
                  fill={`url(#${fillId})`}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ChartContainer>
          </div>
        </div>
      </section>
      <section aria-label="Weeks Kept by Area" className="flex min-w-0 flex-col gap-2 px-4 py-3.5">
        <h4 className="text-xs text-muted-foreground">Weeks Kept by Area</h4>
        <div className="flex items-center justify-between gap-2">
          <ul className="grid gap-x-2.5 gap-y-1 text-xs text-muted-foreground min-[330px]:grid-cols-2">
            {score.areaScores.map((area) => (
              <li key={area.id} className="flex items-center gap-1 whitespace-nowrap">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: area.color }}
                  aria-hidden="true"
                />
                {area.label} <span className="text-foreground tabular-nums">{area.score}%</span>
              </li>
            ))}
          </ul>
          <ReuiScoreRings
            values={score.areaScores}
            label="Weeks kept by area, four concentric rings"
          />
        </div>
      </section>
    </FramePanel>
  );
}

function EditTargetDialog({
  open,
  row,
  returnFocus,
  draft,
  setDraft,
  preview,
  onClose,
  onSave,
}: {
  open: boolean;
  row: AgreementRow;
  returnFocus: HTMLButtonElement;
  draft: number | null;
  setDraft: (draft: number | null) => void;
  preview: AgreementRow;
  onClose: () => void;
  onSave: () => void;
}) {
  const fieldId = useId();
  const input = useRef<HTMLInputElement>(null);
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        className="max-w-[min(calc(100vw-2rem),25rem)]"
        onOpenAutoFocus={(event) => {
          if (!input.current) return;
          event.preventDefault();
          input.current.focus();
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          returnFocus.focus({ preventScroll: true });
        }}
      >
        <DialogHeader>
          <DialogTitle>Edit Target</DialogTitle>
          <DialogDescription>{row.name}</DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor={fieldId}>Weekly target (%)</FieldLabel>
          <NumberField
            id={fieldId}
            value={draft}
            onValueChange={setDraft}
            min={1}
            max={100}
            step={1}
          >
            <NumberFieldGroup>
              <NumberFieldDecrement aria-label="Lower the target" />
              <NumberFieldInput ref={input} />
              <NumberFieldIncrement aria-label="Raise the target" />
            </NumberFieldGroup>
          </NumberField>
          <FieldDescription>
            Kept at {draft ?? row.target}% of the {row.unit} due, partly kept from{" "}
            {(draft ?? row.target) * 0.75}%.
          </FieldDescription>
        </Field>
        <div className="flex flex-col gap-2 rounded-lg border p-3 text-xs text-muted-foreground">
          <p>Finished weeks at {preview.target}%</p>
          <div
            role="img"
            aria-label={`${preview.done} of ${preview.finished} finished weeks kept at ${preview.target}%`}
            className="grid grid-cols-[repeat(25,minmax(0,1fr))] gap-0.5"
          >
            {preview.weeks.slice(0, -1).map((week) => (
              <span
                key={week.index}
                className={cn("aspect-square rounded-xs", agreementOutcomes[week.outcome].fill)}
              />
            ))}
          </div>
          <p>
            {preview.done} of {preview.finished} weeks kept, compared with {row.done} at the current
            target.
          </p>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={draft === null || draft < 1 || draft > 100 || draft === row.target}
            onClick={onSave}
          >
            Save Target
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function WorkingAgreements() {
  const [team, setTeam] = useState<AgreementTeam>("payments");
  const [area, setArea] = useState<AreaFilter>("all");
  const [sort, setSort] = useState<Sort>("kept");
  const [slipping, setSlipping] = useState(false);
  const [starter, setStarter] = useState(false);
  const [overrides, setOverrides] = useState<AgreementOverrides>({});
  const [editing, setEditing] = useState<{
    id: string;
    trigger: HTMLButtonElement;
    open: boolean;
  } | null>(null);
  const [draft, setDraft] = useState<number | null>(null);
  const rows = useMemo(() => agreementRows(team, overrides, starter), [team, overrides, starter]);
  const score = useMemo(() => agreementScore(rows), [rows]);
  const activeTeam = agreementTeams.find((item) => item.id === team) ?? agreementTeams[0];
  const teamName = activeTeam.label;
  const visible = rows
    .filter((row) => (area === "all" || row.area === area) && (!slipping || row.slipping))
    .toSorted((a, b) => {
      if (sort === "kept") return a.percentage - b.percentage || a.name.localeCompare(b.name);
      if (sort === "streak") return a.streak - b.streak || a.name.localeCompare(b.name);
      return a.name.localeCompare(b.name);
    });
  const editedRow = rows.find((row) => row.id === editing?.id);
  const editedKey = editedRow ? agreementOverrideKey(team, editedRow.id) : null;
  const targetPreview =
    editedKey && editedRow
      ? agreementRows(
          team,
          {
            ...overrides,
            [editedKey]: { ...overrides[editedKey], target: draft ?? editedRow.target },
          },
          starter,
        ).find((row) => row.id === editedRow.id)
      : undefined;

  function closeEditor() {
    setEditing((current) => (current ? { ...current, open: false } : null));
  }

  function resetView() {
    setArea("all");
    setSort("kept");
    setSlipping(false);
  }

  function changeAgreement(row: AgreementRow, change: AgreementOverride, message: string) {
    const key = agreementOverrideKey(team, row.id);
    const before = overrides[key];
    const after = { ...before, ...change };
    setOverrides((current) => ({ ...current, [key]: after }));
    toast.success(message, {
      id: `agreement-${key}`,
      action: {
        label: "Undo",
        onClick: () =>
          setOverrides((current) =>
            current[key] === after ? { ...current, [key]: before } : current,
          ),
      },
    });
  }

  function adoptStarter() {
    setStarter(true);
    toast.success("Starter agreements added", {
      id: "agreement-starter",
      action: { label: "Undo", onClick: () => setStarter(false) },
    });
  }

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(
        [
          `${teamName} Working Agreements`,
          `${score.onTrack} of ${score.activeCount} on track this week`,
          `${score.total}% kept across finished weeks`,
          ...visible.map(
            (row) => `${row.name}: ${row.done}/${row.finished} weeks kept · ${row.target}% target`,
          ),
        ].join("\n"),
      );
      toast.success("Summary copied");
    } catch {
      toast.error("Could not copy summary");
    }
  }

  return (
    <section className="@container mx-auto min-h-svh w-full max-w-[984px] px-4 py-4 sm:px-6 sm:py-6">
      <Frame className="min-w-0">
        <FrameHeader className="gap-2 @md:flex-row @md:items-center @md:justify-between">
          <div>
            <FrameTitle>
              <h3>Working Agreements</h3>
            </FrameTitle>
            <FrameDescription>Practices kept, weeks of Apr 6 to Sep 28</FrameDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={team}
              onValueChange={(value) => {
                setTeam(value as AgreementTeam);
                resetView();
              }}
            >
              <SelectTrigger aria-label="Team" className="w-36">
                <SelectValue>
                  <Avatar className="size-5" aria-hidden="true">
                    <AvatarFallback className="text-[9px]">{activeTeam.initials}</AvatarFallback>
                  </Avatar>
                  {teamName}
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="start" position="popper">
                <SelectGroup>
                  {agreementTeams.map((item) => (
                    <SelectItem key={item.id} value={item.id} textValue={item.label}>
                      <Avatar className="size-5">
                        <AvatarFallback className="text-[9px]">{item.initials}</AvatarFallback>
                      </Avatar>
                      {item.label}
                      <span
                        className="text-xs text-muted-foreground tabular-nums"
                        aria-hidden="true"
                      >
                        {item.id === "search" && starter ? 4 : item.count}
                      </span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <ButtonGroup aria-label="Matrix menus">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" size="icon" aria-label="View options">
                    <SlidersHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Area</DropdownMenuLabel>
                    <DropdownMenuRadioGroup
                      value={area}
                      onValueChange={(value) => setArea(value as AreaFilter)}
                    >
                      <DropdownMenuRadioItem value="all">
                        All Areas{" "}
                        <span className="ml-auto text-muted-foreground">{rows.length}</span>
                      </DropdownMenuRadioItem>
                      {agreementAreas.map((item) => (
                        <DropdownMenuRadioItem key={item.id} value={item.id}>
                          {item.label}{" "}
                          <span className="ml-auto text-muted-foreground">
                            {rows.filter((row) => row.area === item.id).length}
                          </span>
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                    <DropdownMenuCheckboxItem checked={slipping} onCheckedChange={setSlipping}>
                      Slipping Only{" "}
                      <span className="ml-auto text-muted-foreground">
                        {rows.filter((row) => row.slipping).length}
                      </span>
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                    <DropdownMenuRadioGroup
                      value={sort}
                      onValueChange={(value) => setSort(value as Sort)}
                    >
                      {sortOptions.map((option) => (
                        <DropdownMenuRadioItem key={option.id} value={option.id}>
                          {option.label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" size="icon" aria-label="More actions">
                    <Ellipsis />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      disabled={visible.length === 0}
                      onSelect={() =>
                        downloadCsv(
                          `${teamName} Working Agreements`,
                          visible.flatMap((row) =>
                            row.weeks.map((week) => ({
                              Area: agreementAreas.find((item) => item.id === row.area)?.label,
                              Agreement: row.name,
                              Week: week.label,
                              Outcome: agreementOutcomes[week.outcome].detail,
                              Done: week.done,
                              Due: week.due,
                              Target: `${row.target}%`,
                            })),
                          ),
                        )
                      }
                    >
                      <Download /> Download CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => void copySummary()}>
                      <Copy /> Copy Summary
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      disabled={area === "all" && sort === "kept" && !slipping}
                      onSelect={resetView}
                    >
                      <RotateCcw /> Reset View
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </ButtonGroup>
          </div>
        </FrameHeader>
        {rows.length > 0 && <AgreementSummary score={score} />}
        <FramePanel className="px-0 py-0">
          {visible.length > 0 ? (
            <WorkingAgreementsMatrix
              teamName={teamName}
              rows={visible}
              sortHint={
                sortOptions.find((option) => option.id === sort)?.hint ?? "Lowest kept share first"
              }
              onPause={(row, paused) =>
                changeAgreement(row, { paused }, paused ? "Week paused" : "Week resumed")
              }
              onEdit={(row, trigger) => {
                setDraft(row.target);
                setEditing({ id: row.id, trigger, open: true });
              }}
            />
          ) : (
            <Empty className="min-h-52">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ClipboardList />
                </EmptyMedia>
                <EmptyTitle>
                  {rows.length ? "No agreements match this view" : "No working agreements yet"}
                </EmptyTitle>
                <EmptyDescription>
                  {rows.length
                    ? "Clear the filters to see this team's practices."
                    : "Start with a few practices to track how this team works together."}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  type="button"
                  variant="outline"
                  onClick={rows.length ? resetView : adoptStarter}
                >
                  {rows.length ? "Reset View" : "Adopt Starter Set"}
                </Button>
              </EmptyContent>
            </Empty>
          )}
        </FramePanel>
        <FrameFooter className="gap-2 text-xs text-muted-foreground @min-[880px]:flex-row @min-[880px]:items-center @min-[880px]:justify-between">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
            {(Object.keys(agreementOutcomes) as AgreementOutcome[]).map((key) => (
              <span key={key} className="inline-flex items-center gap-1 whitespace-nowrap">
                <span
                  className={cn("size-3 rounded-sm", agreementOutcomes[key].fill)}
                  aria-hidden="true"
                />
                {agreementOutcomes[key].name}
              </span>
            ))}
          </div>
          <span className="shrink-0">As of Sep 29, 14:20 UTC</span>
        </FrameFooter>
      </Frame>
      {editing && editedRow && targetPreview && (
        <EditTargetDialog
          open={editing.open}
          row={editedRow}
          returnFocus={editing.trigger}
          draft={draft}
          setDraft={setDraft}
          preview={targetPreview}
          onClose={closeEditor}
          onSave={() => {
            if (draft === null || draft < 1 || draft > 100) return;
            changeAgreement(editedRow, { target: draft }, "Weekly target updated");
            closeEditor();
          }}
        />
      )}
    </section>
  );
}
