import { useId, type ReactNode } from "react";
import { Search } from "lucide-react";
import { Field, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export function FinanceSelect<T extends string>({
  value,
  options,
  label,
  onChange,
  className,
  field = false,
}: {
  value: T;
  options: readonly { value: T; label: string }[];
  label: string;
  onChange: (value: T) => void;
  className?: string;
  field?: boolean;
}) {
  const id = useId();
  const control = (
    <Select
      value={value}
      onValueChange={(next) => {
        const selected = options.find((option) => option.value === next);
        if (selected) onChange(selected.value);
      }}
    >
      <SelectTrigger
        id={field ? id : undefined}
        aria-label={label}
        size={field ? "default" : "sm"}
        className={className}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
  return field ? (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {control}
    </Field>
  ) : (
    control
  );
}

export function FinanceSearch({
  label,
  placeholder,
  value,
  onChange,
  shortcut,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  shortcut?: ReactNode;
}) {
  const control = (
    <InputGroup className="h-7 w-full">
      <InputGroupAddon>
        <Search />
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {shortcut && <InputGroupAddon align="inline-end">{shortcut}</InputGroupAddon>}
    </InputGroup>
  );
  return (
    <>
      <div className="hidden min-w-0 sm:block">{control}</div>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon-xs" aria-label={label} className="sm:hidden">
            <Search />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64">
          {control}
        </PopoverContent>
      </Popover>
    </>
  );
}

export function FinanceConfirmation({
  title,
  description,
  action,
  danger,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: ReactNode;
  action: string;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant={danger ? "destructive" : "default"} onClick={onConfirm}>
            {action}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export type FinanceTone = "focus" | "success" | "info" | "warning" | "destructive" | "muted";
export function FinanceSchedule({
  label,
  start,
  elapsed,
  end,
  marker,
  tone,
  divisions = 8,
  late = false,
  compact = false,
}: {
  label: string;
  start: number;
  elapsed: number;
  end: number;
  marker?: number;
  tone: FinanceTone;
  divisions?: number;
  late?: boolean;
  compact?: boolean;
}) {
  const clip = (position: number) => Math.max(0, Math.min(100, position));
  const left = clip(start);
  const right = clip(end);
  const elapsedWidth = Math.max(0, clip(elapsed) - left);
  return (
    <div
      role="img"
      aria-label={label}
      title={label}
      className={cn("finance-schedule", compact && "finance-schedule-compact")}
      data-tone={tone}
    >
      <span className="finance-schedule-intervals" aria-hidden="true">
        {Array.from({ length: divisions }, (_, index) => (
          <i key={index} />
        ))}
      </span>
      {right > left && (
        <span
          aria-hidden="true"
          className="finance-schedule-plan"
          style={{ left: `${left}%`, width: `${right - left}%` }}
        />
      )}
      {elapsedWidth > 0 && (
        <span
          aria-hidden="true"
          className="finance-schedule-elapsed"
          style={{ left: `${left}%`, width: `${elapsedWidth}%` }}
        />
      )}
      {marker !== undefined && (
        <span
          aria-hidden="true"
          className="finance-schedule-marker"
          style={{ left: `${clip(marker)}%` }}
        />
      )}
      {late && right > left && (
        <span aria-hidden="true" className="finance-schedule-slip" style={{ left: `${right}%` }} />
      )}
    </div>
  );
}
