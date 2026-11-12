import { useId, useMemo, useState, type FormEvent, type RefObject } from "react";
import { CalendarClock, Plus, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  STRATA_NOW_MS,
  STRATA_OWNERS,
  STRATA_SERVICES,
  type StrataEnvironment,
} from "./strata-domain";
import { nextStrataRuns, STRATA_CRON_PRESETS, strataCronLabel } from "./strata-cron";
import type { StrataJobDraft, StrataJobErrors, StrataJobResult } from "./strata-jobs-model";

function emptyDraft(): StrataJobDraft {
  const service = STRATA_SERVICES.find((item) => item.id === "payments-api")!;
  return {
    name: "",
    command: "",
    cron: "0 * * * *",
    timeZone: "UTC",
    serviceId: service.id,
    cluster: service.cluster,
    environment: service.environment,
    ownerId: STRATA_OWNERS[0].id,
    enabled: true,
  };
}

function FormSelect({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} aria-label={label} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

export function StrataJobForm({
  open,
  onOpenChange,
  onCreate,
  opener,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (draft: StrataJobDraft) => StrataJobResult;
  opener: RefObject<HTMLButtonElement | null>;
}) {
  const id = useId();
  const [draft, setDraft] = useState(emptyDraft);
  const [errors, setErrors] = useState<StrataJobErrors>({});
  const update = <K extends keyof StrataJobDraft>(key: K, value: StrataJobDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };
  const schedule = useMemo(() => {
    try {
      const runs = nextStrataRuns(draft.cron, STRATA_NOW_MS);
      return {
        runs,
        error: runs.length ? "" : "This schedule never fires in the next eight years.",
      };
    } catch (error) {
      return {
        runs: [],
        error: error instanceof Error ? error.message : "Enter a valid cron expression.",
      };
    }
  }, [draft.cron]);
  const changeService = (serviceId: string) => {
    const service = STRATA_SERVICES.find((item) => item.id === serviceId)!;
    setDraft((current) => ({
      ...current,
      serviceId,
      cluster: service.cluster,
      environment: service.environment,
    }));
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = onCreate(draft);
    if (result.ok) onOpenChange(false);
    else setErrors(result.errors);
  };
  const time = (at: number) =>
    new Intl.DateTimeFormat("en", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone: "UTC",
    }).format(at);
  const until = (at: number) => {
    const minutes = Math.round((at - STRATA_NOW_MS) / 60000);
    return minutes < 60
      ? `in ${minutes}m`
      : minutes % 60 === 0
        ? `in ${minutes / 60}h`
        : `in ${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  };
  const schedulePreset = STRATA_CRON_PRESETS.find((preset) => preset.expression === draft.cron);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="strata-job-sheet"
        onCloseAutoFocus={(event) => {
          const target = opener.current;
          if (target?.isConnected && target.getClientRects().length) {
            event.preventDefault();
            target.focus({ preventScroll: true });
          }
        }}
      >
        <SheetHeader className="shrink-0 border-b pr-12">
          <SheetTitle>New Job</SheetTitle>
          <SheetDescription>Schedule a command in this workspace.</SheetDescription>
        </SheetHeader>
        <form noValidate onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <FieldGroup className="strata-job-fields">
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor={`${id}-name`}>Name</FieldLabel>
              <Input
                id={`${id}-name`}
                value={draft.name}
                onChange={(event) => update("name", event.target.value)}
                placeholder="Nightly ledger reconciliation"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? `${id}-name-error` : undefined}
              />
              {errors.name && <FieldError id={`${id}-name-error`}>{errors.name}</FieldError>}
            </Field>
            <Field data-invalid={!!errors.command}>
              <FieldLabel htmlFor={`${id}-command`}>Command</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <Terminal />
                </InputGroupAddon>
                <InputGroupInput
                  id={`${id}-command`}
                  value={draft.command}
                  onChange={(event) => update("command", event.target.value)}
                  placeholder="bricklane run payments -- jobs:sync"
                  className="font-mono"
                  aria-invalid={!!errors.command}
                />
              </InputGroup>
              {errors.command && <FieldError>{errors.command}</FieldError>}
            </Field>
            <Field>
              <FieldLabel>Schedule</FieldLabel>
              <ToggleGroup
                type="single"
                value={schedulePreset?.expression ?? ""}
                onValueChange={(value) => {
                  if (value) update("cron", value);
                }}
                variant="outline"
                size="sm"
                className="strata-cron-presets"
                aria-label="Schedule preset"
              >
                {STRATA_CRON_PRESETS.map((preset) => (
                  <ToggleGroupItem key={preset.expression} value={preset.expression}>
                    {preset.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <div className="strata-cron-mobile">
                <Select
                  value={schedulePreset?.expression ?? "custom"}
                  onValueChange={(value) => {
                    if (value !== "custom") update("cron", value);
                  }}
                >
                  <SelectTrigger aria-label="Schedule preset" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {!schedulePreset && <SelectItem value="custom">Custom schedule</SelectItem>}
                    {STRATA_CRON_PRESETS.map((preset) => (
                      <SelectItem key={preset.expression} value={preset.expression}>
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </Field>
            <Field data-invalid={!!schedule.error || !!errors.cron}>
              <FieldLabel htmlFor={`${id}-cron`}>Cron Expression</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <CalendarClock />
                </InputGroupAddon>
                <InputGroupInput
                  id={`${id}-cron`}
                  value={draft.cron}
                  onChange={(event) => update("cron", event.target.value)}
                  className="font-mono"
                  spellCheck={false}
                  aria-invalid={!!schedule.error}
                  aria-describedby={`${id}-cron-description`}
                />
              </InputGroup>
              {schedule.error || errors.cron ? (
                <FieldError id={`${id}-cron-description`}>
                  {schedule.error || errors.cron}
                </FieldError>
              ) : (
                <FieldDescription id={`${id}-cron-description`}>
                  {strataCronLabel(draft.cron)} UTC
                </FieldDescription>
              )}
            </Field>
            <FormSelect
              id={`${id}-timezone`}
              label="Timezone"
              value="UTC"
              onChange={() => {}}
              options={[{ value: "UTC", label: "UTC" }]}
            />
            <section aria-label="Next 3 Runs" className="space-y-2 text-sm">
              <p className="text-muted-foreground">Next 3 Runs</p>
              {schedule.runs.map((at) => (
                <div key={at} className="flex justify-between gap-3">
                  <time dateTime={new Date(at).toISOString()}>{time(at)} UTC</time>
                  <span className="shrink-0 text-xs text-muted-foreground">{until(at)}</span>
                </div>
              ))}
            </section>
            <div className="grid grid-cols-2 gap-4">
              <FormSelect
                id={`${id}-service`}
                label="Service"
                value={draft.serviceId}
                onChange={changeService}
                options={STRATA_SERVICES.map((service) => ({
                  value: service.id,
                  label: service.name,
                }))}
              />
              <FormSelect
                id={`${id}-cluster`}
                label="Cluster"
                value={draft.cluster}
                onChange={(value) => update("cluster", value)}
                options={[...new Set(STRATA_SERVICES.map((service) => service.cluster))].map(
                  (cluster) => ({ value: cluster, label: cluster }),
                )}
              />
              <FormSelect
                id={`${id}-environment`}
                label="Environment"
                value={draft.environment}
                onChange={(value) => update("environment", value as StrataEnvironment)}
                options={["Production", "Staging", "Sandbox"].map((value) => ({
                  value,
                  label: value,
                }))}
              />
              <FormSelect
                id={`${id}-owner`}
                label="Owner"
                value={draft.ownerId}
                onChange={(value) => update("ownerId", value)}
                options={STRATA_OWNERS.map((owner) => ({ value: owner.id, label: owner.name }))}
              />
            </div>
            <Field orientation="horizontal">
              <div className="flex-1">
                <FieldLabel htmlFor={`${id}-enabled`}>Start enabled</FieldLabel>
                <FieldDescription>Runs on schedule once created.</FieldDescription>
              </div>
              <Switch
                id={`${id}-enabled`}
                checked={draft.enabled}
                onCheckedChange={(value) => update("enabled", value)}
              />
            </Field>
            <p className="text-xs text-muted-foreground">
              Local demo. Commands are recorded, never executed on a server.
            </p>
          </FieldGroup>
          <SheetFooter className="strata-job-footer">
            <p className="mr-auto text-xs text-muted-foreground">
              {schedule.runs[0]
                ? `First run ${until(schedule.runs[0])}`
                : "Choose a valid schedule"}
            </p>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!!schedule.error}>
              <Plus />
              Create Job
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
