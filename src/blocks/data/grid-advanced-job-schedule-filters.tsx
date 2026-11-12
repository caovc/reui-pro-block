import { CalendarX2, Package, UsersRound } from "lucide-react";
import type { Ref } from "react";
import { Badge } from "@/components/reui/badge";
import {
  createFilterRule,
  flattenFilterRules,
  type FilterQuery,
} from "@/components/reui/filters/filters";
import { insertFilterNode, removeFilterNode } from "@/components/reui/filters/filters-query";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { JobStatusBadge } from "./grid-advanced-job-schedule-details";
import {
  jobAttentionOptions,
  jobScheduleFilterFields,
  jobStatuses,
  jobTypeOptions,
  type JobAttention,
  type JobStatus,
  type summarizeJobFilters,
} from "./grid-advanced-job-schedule-model";

type Query = FilterQuery<string | string[]>;
const all = "__all__";
const attentionIcons = {
  "lost-days": CalendarX2,
  "late-materials": Package,
  "booked-twice": UsersRound,
};

function selectedValue(query: Query, fields: string[]) {
  const rules = flattenFilterRules(query).filter((rule) => fields.includes(rule.path[0]));
  if (!rules.length) return all;
  const rule = rules[0];
  if (
    rules.length !== 1 ||
    rule.operator !== "is" ||
    rule.negated ||
    typeof rule.value !== "string"
  )
    return "";
  const known = jobScheduleFilterFields.find((field) => field.id === rule.path[0]);
  if (!known?.options?.some((option) => option.value === rule.value)) return "";
  return fields.length === 1 ? rule.value : `${rule.path[0]}:${rule.value}`;
}

function replaceField(query: Query, fields: string[], field: string, value: string) {
  let next = query;
  for (const rule of flattenFilterRules(query)) {
    if (fields.includes(rule.path[0])) next = removeFilterNode(next, rule.id);
  }
  return value === all
    ? next
    : insertFilterNode(
        next,
        createFilterRule({
          id: `job-direct-${field}`,
          path: [field],
          operator: "is",
          value,
        }),
      );
}

function TypeLabel({ value }: { value: string }) {
  const option = jobTypeOptions.find((type) => type.value === value);
  return option ? (
    <span className="flex min-w-0 items-center gap-2">
      <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", option.color)} />
      <span className="truncate">{option.label}</span>
    </span>
  ) : null;
}

function AttentionLabel({ value, count }: { value: JobAttention; count: number }) {
  const Icon = attentionIcons[value];
  return (
    <span className="flex min-w-0 items-center gap-2">
      <Icon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      <span className="truncate">
        {jobAttentionOptions.find((option) => option.value === value)?.label}
      </span>
      <Badge size="xs" variant={count ? "destructive-light" : "outline"}>
        {count}
      </Badge>
    </span>
  );
}

export function JobScheduleDirectFilters({
  query,
  onQueryChange,
  summary,
  typeTriggerRef,
}: {
  query: Query;
  onQueryChange: (query: Query) => void;
  summary: ReturnType<typeof summarizeJobFilters>;
  typeTriggerRef?: Ref<HTMLButtonElement>;
}) {
  const type = selectedValue(query, ["type"]);
  const view = selectedValue(query, ["status", "attention"]);
  const [viewField, viewValue] = view.split(":");
  return (
    <div className="grid min-w-0 flex-1 grid-cols-2 gap-2 sm:flex sm:flex-none">
      <Select
        value={type}
        onValueChange={(value) => onQueryChange(replaceField(query, ["type"], "type", value))}
      >
        <SelectTrigger
          ref={typeTriggerRef}
          aria-label="Job type"
          className="w-full min-w-0 sm:w-auto sm:min-w-30"
        >
          <SelectValue placeholder="Custom filters">
            {type === all ? "All Types" : type ? <TypeLabel value={type} /> : undefined}
          </SelectValue>
        </SelectTrigger>
        <SelectContent align="start" position="popper" className="w-56 max-w-[calc(100vw-2rem)]">
          <SelectGroup>
            <SelectItem value={all}>All Types</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Job type</SelectLabel>
            {jobTypeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value} textValue={option.label}>
                <TypeLabel value={option.value} />
                <span className="text-muted-foreground tabular-nums">
                  {summary.typeCounts[option.value]}
                </span>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select
        value={view}
        onValueChange={(value) => {
          if (value === all)
            onQueryChange(replaceField(query, ["status", "attention"], "status", all));
          else {
            const [field, selected] = value.split(":");
            onQueryChange(replaceField(query, ["status", "attention"], field, selected));
          }
        }}
      >
        <SelectTrigger aria-label="Show jobs" className="w-full min-w-0 sm:w-auto sm:min-w-30">
          <SelectValue placeholder="Custom filters">
            {view === all ? (
              "All Jobs"
            ) : viewField === "status" ? (
              <JobStatusBadge status={viewValue as JobStatus} />
            ) : viewField === "attention" ? (
              <AttentionLabel
                value={viewValue as JobAttention}
                count={summary.attentionCounts[viewValue as JobAttention]}
              />
            ) : undefined}
          </SelectValue>
        </SelectTrigger>
        <SelectContent align="start" position="popper" className="w-56 max-w-[calc(100vw-2rem)]">
          <SelectGroup>
            <SelectItem value={all}>All Jobs</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Status</SelectLabel>
            {jobStatuses.map((status) => (
              <SelectItem key={status} value={`status:${status}`} textValue={status}>
                <JobStatusBadge status={status} />
              </SelectItem>
            ))}
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Needs attention</SelectLabel>
            {jobAttentionOptions.map(({ value, label }) => (
              <SelectItem
                key={value}
                value={`attention:${value}`}
                textValue={label}
                disabled={!summary.attentionCounts[value]}
              >
                <AttentionLabel value={value} count={summary.attentionCounts[value]} />
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
