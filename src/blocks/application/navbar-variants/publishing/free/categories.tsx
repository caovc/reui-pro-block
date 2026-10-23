// Actual official free REUI c-toggle-group-5. MIT (c) Keenthemes.
// https://reui.io/r/radix-nova/c-toggle-group-5.json
// Upstream source SHA256: b10361080ab7e301e4b6a441280fdbd103f8b84c8473d5c2fa5a4d95a72b4ec8
// Local adaptations recorded in docs/navbar7-9-implementation.md.
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export function AgentCategories({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center justify-center">
      <ToggleGroup
        className="marketplace-category-pills"
        type="single"
        value={value}
        onValueChange={(next) => {
          if (next) onChange(next);
        }}
        aria-label="Agent categories"
        variant="outline"
        size="sm"
      >
        <ToggleGroupItem value="all">All</ToggleGroupItem>
        <ToggleGroupItem value="code">Code</ToggleGroupItem>
        <ToggleGroupItem value="research">Research</ToggleGroupItem>
        <ToggleGroupItem value="data">Data</ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
