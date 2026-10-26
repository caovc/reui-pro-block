import { demoAvatar } from "@/lib/demo-artwork";
import type { ReactNode } from "react";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { CalendarSelect } from "@/components/reui/calendar-select";
import { CalendarDays } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
export function Choice({
  label,
  value,
  onChange,
  items,
  placeholder,
  showLabel = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  items: string[];
  placeholder?: string;
  showLabel?: boolean;
}) {
  const control = (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {items.map((x) => (
          <SelectItem key={x} value={x}>
            {x}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
  return showLabel ? (
    <label className="wf-choice-label">
      <span>{label}</span>
      {control}
    </label>
  ) : (
    control
  );
}
export function SideForm({
  title,
  description,
  open,
  onClose,
  children,
  onSubmit,
  submit = "Save changes",
  wide = false,
  hideTitle = false,
  className = "",
}: {
  title: string;
  description: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  onSubmit?: () => void;
  submit?: string;
  wide?: boolean;
  hideTitle?: boolean;
  className?: string;
}) {
  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <SheetContent className={`wf-sheet ${className} ${wide ? "wf-sheet-wide" : ""}`}>
        <div className={hideTitle ? "sr-only" : "wf-sheet-heading"}>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription className={description ? undefined : "sr-only"}>
            {description}
          </SheetDescription>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit?.();
          }}
        >
          <div className="wf-form-fields">{children}</div>
          <footer>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{submit}</Button>
          </footer>
        </form>
      </SheetContent>
    </Sheet>
  );
}
export function Person({ name }: { name: string; index?: number }) {
  return (
    <span className="wf-person">
      <Avatar>
        <AvatarImage src={demoAvatar(name)} alt="" />
        <AvatarFallback>
          {name
            .split(" ")
            .map((x) => x[0])
            .join("")
            .slice(0, 2)}
        </AvatarFallback>
      </Avatar>
      <span>{name}</span>
    </span>
  );
}

export function DateChoice({
  value,
  onChange,
  label = "Due date",
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  const parsed = value ? new Date(/^\d{4}-/.test(value) ? value : value + " 2026") : undefined;
  const date = parsed && !Number.isNaN(parsed.getTime()) ? parsed : undefined;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="justify-start font-normal"
          aria-label={label}
        >
          <CalendarDays />
          {date
            ? date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            : "Pick a date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <CalendarSelect
          mode="single"
          selected={date}
          defaultMonth={date || new Date(2026, 9, 15)}
          onSelect={(d) =>
            onChange(
              d
                ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
                : "",
            )
          }
        />
      </PopoverContent>
    </Popover>
  );
}
