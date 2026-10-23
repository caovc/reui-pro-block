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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  items: string[];
  placeholder?: string;
}) {
  return (
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
const photos: Record<string, string> = {
  "Tomas Lindqvist": "photo-1500648767791-00dcc994a43e",
  "Ines Marchetti": "photo-1494790108377-be9c29b29330",
  "Hanna Berg": "photo-1534528741775-53994a69daeb",
  "Nick Bold": "photo-1543299750-19d1d6297053",
  "Omar Haddad": "photo-1507591064344-4c6ce005b128",
  "Leo Grant": "photo-1500648767791-00dcc994a43e",
  "Nora Vale": "photo-1438761681033-6461ffad8d80",
  "Ada Brooks": "photo-1488426862026-3ee34a7d66df",
  "Mira Stone": "photo-1494790108377-be9c29b29330",
  "Ravi Shah": "photo-1535713875002-d1d0cf377fde",
  "Iris Fox": "photo-1534528741775-53994a69daeb",
};
export function Person({ name, index = 0 }: { name: string; index?: number }) {
  return (
    <span className="wf-person">
      <Avatar>
        <AvatarImage
          src={
            [
              "Tomas Okonkwo",
              "Amelia Hart",
              "Marcus Webb",
              "Nia Achebe",
              "Klara Nowak",
              "Rafael Duarte",
              "Leila Haddad",
              "Theo Morales",
              "Mei Watanabe",
              "Adam Reyes",
            ].includes(name)
              ? demoAvatar(name)
              : `https://images.unsplash.com/${photos[name] || ["photo-1500648767791-00dcc994a43e", "photo-1494790108377-be9c29b29330", "photo-1534528741775-53994a69daeb", "photo-1543299750-19d1d6297053", "photo-1507591064344-4c6ce005b128"][index % 5]}?w=96&h=96&dpr=2&q=80`
          }
          alt=""
        />
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
