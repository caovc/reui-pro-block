// Actual official free REUI c-switch-1. MIT (c) Keenthemes.
// https://reui.io/r/radix-nova/c-switch-1.json
// Upstream source SHA256: 87b075da613bdcac3670ca236ff2210fdc6de7392a011bc4a98a2ce1c6aafc40
// Controlled data/icon/handler adaptations recorded in docs/navbar4-6-implementation.md.
import { Field, FieldLabel } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";

export function WorkflowActive({
  active,
  onChange,
}: {
  active: boolean;
  onChange: (active: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-center">
      <Field orientation="horizontal">
        <Switch
          id="workflow-enabled"
          checked={active}
          onCheckedChange={onChange}
          aria-label="Workflow enabled"
        />
        <FieldLabel htmlFor="workflow-enabled">{active ? "Active" : "Inactive"}</FieldLabel>
      </Field>
    </div>
  );
}
