// Actual official free REUI c-select-5. MIT (c) Keenthemes.
// https://reui.io/r/radix-nova/c-select-5.json
// Options lifted; controlled local deployment field.
import { Field } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AgentPicker({
  value,
  onChange,
  items,
}: {
  value: string;
  onChange: (value: string) => void;
  items: { label: string; value: string }[];
}) {
  return (
    <Field className="max-w-xs">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger size="sm" aria-label="Agent to deploy">
          <SelectValue placeholder="Choose an agent" />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectGroup>
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  );
}
