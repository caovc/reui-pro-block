// Actual official free REUI c-radio-group-3. MIT (c) Keenthemes.
// https://reui.io/r/radix-nova/c-radio-group-3.json
// Adapter: controlled value and domain-specific option content; original Field composition retained.
import { Badge } from "@/components/reui/badge";
import { Field, FieldContent, FieldDescription, FieldLabel } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export type SyncScopeOption = { id: string; title: string; description: string; badge?: string };
export function SyncScopeOptions({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SyncScopeOption[];
}) {
  return (
    <RadioGroup
      value={value}
      onValueChange={onChange}
      aria-label="Sync scope"
      className="w-full gap-4"
    >
      {options.map((option) => (
        <Field key={option.id} orientation="horizontal">
          <RadioGroupItem value={option.id} id={`consent-scope-${option.id}`} />
          <FieldContent>
            <FieldLabel htmlFor={`consent-scope-${option.id}`}>
              {option.title}
              {option.badge && (
                <Badge variant="secondary" className="ml-auto">
                  {option.badge}
                </Badge>
              )}
            </FieldLabel>
            <FieldDescription>{option.description}</FieldDescription>
          </FieldContent>
        </Field>
      ))}
    </RadioGroup>
  );
}
