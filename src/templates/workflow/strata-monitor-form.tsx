import { useId, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { CalendarClock, Plus, Server, ShoppingCart, Terminal } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/reui/badge";
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
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  STRATA_NOW_MS,
  STRATA_OWNERS,
  STRATA_SERVICES,
  strataService,
  type StrataEnvironment,
} from "./strata-domain";
import { nextStrataRuns, STRATA_CRON_PRESETS, strataCronLabel } from "./strata-cron";
import {
  emptyStrataMonitorDraft,
  type StrataMonitorDraft,
  type StrataMonitorErrors,
  type StrataMonitorsModel,
} from "./strata-monitors-model";

const previewTime = new Intl.DateTimeFormat("en", {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "UTC",
});
const shortTime = new Intl.DateTimeFormat("en", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "UTC",
});
function until(at: number) {
  const minutes = Math.max(1, Math.round((at - STRATA_NOW_MS) / 60000));
  return minutes >= 1440
    ? `in ${Math.floor(minutes / 1440)}d`
    : minutes >= 60
      ? `in ${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ""}`
      : `in ${minutes}m`;
}

function MonitorFormSelect({
  id,
  label,
  value,
  onChange,
  options,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string; content?: ReactNode }[];
  error?: string;
}) {
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          id={id}
          aria-label={label}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="w-full"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} aria-label={option.label}>
              {option.content ?? option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </Field>
  );
}

export function StrataMonitorForm({
  model,
  onCreated,
}: {
  model: StrataMonitorsModel;
  onCreated: (monitorId: string) => void;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(emptyStrataMonitorDraft);
  const [errors, setErrors] = useState<StrataMonitorErrors>({});
  const update = <K extends keyof StrataMonitorDraft>(key: K, value: StrataMonitorDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };
  const schedule = useMemo(() => {
    try {
      const checks = nextStrataRuns(draft.cron, STRATA_NOW_MS, 3);
      return { checks, error: checks.length ? "" : "Choose a schedule with a future check." };
    } catch (error) {
      return {
        checks: [],
        error: error instanceof Error ? error.message : "Enter a valid cron expression.",
      };
    }
  }, [draft.cron]);
  const preset = STRATA_CRON_PRESETS.find((option) => option.expression === draft.cron);
  const changeService = (serviceId: string) => {
    const service = strataService(serviceId);
    if (!service) return;
    setDraft((current) => ({ ...current, serviceId, environment: service.environment }));
    setErrors((current) => ({ ...current, serviceId: undefined, environment: undefined }));
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const result = model.createMonitor(draft);
    if (result.ok) {
      setOpen(false);
      onCreated(result.monitor.id);
    } else {
      setErrors(result.errors);
      requestAnimationFrame(() =>
        form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
      );
    }
  };
  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setDraft(emptyStrataMonitorDraft());
          setErrors({});
        }
        setOpen(next);
      }}
    >
      <SheetTrigger asChild>
        <Button>
          <Plus /> New Monitor
        </Button>
      </SheetTrigger>
      <SheetContent className="strata-monitor-sheet">
        <SheetHeader className="strata-monitor-form-header">
          <SheetTitle>New Monitor</SheetTitle>
          <SheetDescription>
            Check a URL or watch a scheduled command in this workspace.
          </SheetDescription>
        </SheetHeader>
        <form noValidate className="strata-monitor-form" onSubmit={submit}>
          <FieldGroup className="strata-monitor-form-fields">
            <Field data-invalid={Boolean(errors.name)}>
              <FieldLabel htmlFor={`${id}-name`}>Name</FieldLabel>
              <Input
                id={`${id}-name`}
                name="name"
                value={draft.name}
                onChange={(event) => update("name", event.target.value)}
                placeholder="Checkout flow"
                autoComplete="off"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? `${id}-name-error` : undefined}
              />
              {errors.name && <FieldError id={`${id}-name-error`}>{errors.name}</FieldError>}
            </Field>
            <Field data-invalid={Boolean(errors.target)}>
              <FieldLabel htmlFor={`${id}-target`}>Target</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <Terminal />
                </InputGroupAddon>
                <InputGroupInput
                  id={`${id}-target`}
                  name="target"
                  value={draft.target}
                  onChange={(event) => update("target", event.target.value)}
                  placeholder="api.bricklane.test/health"
                  className="font-mono"
                  spellCheck={false}
                  autoComplete="off"
                  aria-invalid={Boolean(errors.target)}
                  aria-describedby={errors.target ? `${id}-target-error` : undefined}
                />
              </InputGroup>
              {errors.target && <FieldError id={`${id}-target-error`}>{errors.target}</FieldError>}
            </Field>
            <section className="strata-monitor-schedule" aria-label="Schedule">
              <Field>
                <FieldLabel htmlFor={`${id}-preset`}>Schedule</FieldLabel>
                <ToggleGroup
                  type="single"
                  value={preset?.expression ?? ""}
                  onValueChange={(value) => {
                    if (value) update("cron", value);
                  }}
                  size="sm"
                  variant="outline"
                  spacing={0}
                  aria-label="Schedule presets"
                  className="strata-monitor-presets"
                >
                  {STRATA_CRON_PRESETS.map((option) => (
                    <ToggleGroupItem key={option.expression} value={option.expression}>
                      {option.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
                <Select
                  value={preset?.expression ?? "custom"}
                  onValueChange={(value) => {
                    if (value !== "custom") update("cron", value);
                  }}
                >
                  <SelectTrigger
                    id={`${id}-preset`}
                    aria-label="Schedule preset"
                    className="strata-monitor-preset-select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STRATA_CRON_PRESETS.map((option) => (
                      <SelectItem key={option.expression} value={option.expression}>
                        {option.label}
                      </SelectItem>
                    ))}
                    {!preset && <SelectItem value="custom">Custom schedule</SelectItem>}
                  </SelectContent>
                </Select>
              </Field>
              <Field data-invalid={Boolean(schedule.error || errors.cron)}>
                <FieldLabel htmlFor={`${id}-cron`}>Cron Expression</FieldLabel>
                <InputGroup>
                  <InputGroupAddon>
                    <CalendarClock />
                  </InputGroupAddon>
                  <InputGroupInput
                    id={`${id}-cron`}
                    name="cron"
                    value={draft.cron}
                    onChange={(event) => update("cron", event.target.value)}
                    placeholder="0 2 * * *"
                    className="font-mono"
                    spellCheck={false}
                    aria-invalid={Boolean(schedule.error || errors.cron)}
                    aria-describedby={`${id}-cron-help`}
                  />
                </InputGroup>
                {schedule.error || errors.cron ? (
                  <FieldError id={`${id}-cron-help`}>{schedule.error || errors.cron}</FieldError>
                ) : (
                  <FieldDescription id={`${id}-cron-help`}>
                    {draft.cron === "*/5 * * * *" ? "Every 5 minutes" : strataCronLabel(draft.cron)}{" "}
                    UTC
                  </FieldDescription>
                )}
              </Field>
              <MonitorFormSelect
                id={`${id}-timezone`}
                label="Timezone"
                value={draft.timeZone}
                onChange={(value) => update("timeZone", value as "UTC")}
                error={errors.timeZone}
                options={[{ value: "UTC", label: "UTC" }]}
              />
              <section className="strata-monitor-next-checks" aria-labelledby={`${id}-next`}>
                <h3 id={`${id}-next`}>Next 3 Checks</h3>
                <ul>
                  {schedule.checks.map((at) => (
                    <li key={at}>
                      <time dateTime={new Date(at).toISOString()}>
                        {previewTime.format(at)} UTC
                      </time>
                      <span>{until(at)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </section>
            <div className="strata-monitor-form-pairs">
              <MonitorFormSelect
                id={`${id}-service`}
                label="Service"
                value={draft.serviceId}
                onChange={changeService}
                error={errors.serviceId}
                options={STRATA_SERVICES.map((service) => ({
                  value: service.id,
                  label: service.name,
                  content: (
                    <>
                      <span className="strata-monitor-option-icon">
                        {service.id === "checkout-api" ? <ShoppingCart /> : <Server />}
                      </span>
                      {service.name}
                    </>
                  ),
                }))}
              />
              <MonitorFormSelect
                id={`${id}-region`}
                label="Region"
                value={draft.region}
                onChange={(value) => update("region", value)}
                error={errors.region}
                options={[
                  {
                    value: "all",
                    label: "All 6 regions",
                    content: <span className="font-mono">All 6 regions</span>,
                  },
                ]}
              />
              <MonitorFormSelect
                id={`${id}-environment`}
                label="Environment"
                value={draft.environment}
                onChange={(value) => update("environment", value as StrataEnvironment)}
                error={errors.environment}
                options={["Production", "Staging", "Sandbox"].map((value) => ({
                  value,
                  label: value,
                  content: <Badge variant="outline">{value}</Badge>,
                }))}
              />
              <MonitorFormSelect
                id={`${id}-owner`}
                label="Owner"
                value={draft.ownerId}
                onChange={(value) => update("ownerId", value)}
                error={errors.ownerId}
                options={STRATA_OWNERS.map((owner) => ({
                  value: owner.id,
                  label: owner.name,
                  content: (
                    <>
                      <Avatar className="size-5">
                        <AvatarFallback className="text-[9px]">
                          {owner.name
                            .split(" ")
                            .map((part) => part[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      {owner.name}
                    </>
                  ),
                }))}
              />
            </div>
            <Field orientation="horizontal" data-invalid={Boolean(errors.enabled)}>
              <div className="flex-1">
                <FieldLabel htmlFor={`${id}-enabled`}>Start enabled</FieldLabel>
                <FieldDescription>Checks on schedule once created.</FieldDescription>
              </div>
              <Switch
                id={`${id}-enabled`}
                checked={draft.enabled}
                onCheckedChange={(value) => update("enabled", value)}
                aria-label="Start enabled"
              />
            </Field>
            <p className="strata-monitor-local-note">
              Local preview. No requests or commands are run.
            </p>
          </FieldGroup>
          <SheetFooter className="strata-monitor-form-footer">
            <p>
              {!draft.enabled ? (
                "Starts paused"
              ) : schedule.checks[0] ? (
                <>
                  First check {until(schedule.checks[0])}
                  <span aria-hidden="true"> · </span>
                  {shortTime.format(schedule.checks[0])} UTC
                </>
              ) : (
                "Choose a valid schedule"
              )}
            </p>
            <div>
              <SheetClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </SheetClose>
              <Button type="submit" disabled={Boolean(schedule.error)}>
                <Plus /> Create Monitor
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
