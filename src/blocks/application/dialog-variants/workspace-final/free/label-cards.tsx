// Actual official free REUI c-checkbox-9. MIT (c) Keenthemes.
// https://reui.io/r/radix-nova/c-checkbox-9.json
// Adapter: controlled project label data and responsive group; original clickable FieldLabel/Field composition.
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
const projectLabels = [
  { id: "feature", label: "Feature", description: "Product-facing capability." },
  { id: "billing", label: "Billing", description: "Revenue or plan logic." },
  { id: "design", label: "Design", description: "Interface or UX work." },
  { id: "operations", label: "Operations", description: "Process and rollout tasks." },
];
export function ProjectLabelCards({
  value,
  onChange,
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) {
  return (
    <FieldGroup className="final-project-label-grid">
      {projectLabels.map((option) => (
        <FieldLabel key={option.id}>
          <Field orientation="horizontal">
            <Checkbox
              checked={value.includes(option.id)}
              onCheckedChange={(checked) =>
                onChange(checked ? [...value, option.id] : value.filter((id) => id !== option.id))
              }
            />
            <FieldContent>
              <FieldTitle>{option.label}</FieldTitle>
              <FieldDescription>{option.description}</FieldDescription>
            </FieldContent>
          </Field>
        </FieldLabel>
      ))}
    </FieldGroup>
  );
}
