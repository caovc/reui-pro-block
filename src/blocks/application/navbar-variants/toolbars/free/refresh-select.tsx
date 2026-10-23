// Actual official free REUI c-select-5. MIT (c) Keenthemes.
// https://reui.io/r/radix-nova/c-select-5.json
// Upstream source SHA256: 59ce33e5b54f51d36fed42660adfb6c4bb2a69d73df6221820931f935e1bddc8
// Controlled data/icon/handler adaptations recorded in docs/navbar4-6-implementation.md.
import { Field } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const items = [
  { label: "Off", value: "off" },
  { label: "10s", value: "10" },
  { label: "30s", value: "30" },
  { label: "1m", value: "60" },
  { label: "5m", value: "300" },
];
export function RefreshSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field className="w-20">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger size="sm" aria-label="Auto refresh">
          <SelectValue placeholder="Off" />
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
