// Actual official free ReUI c-tabs-9 controlled segmented composition, MIT (c) Keenthemes.
// https://reui.io/r/radix-nova/c-tabs-9.json
// Upstream SHA256: 59d3512bf78a069283ee32d2fcef5cf6da37735853f0e5296970939e9b7b0f8e
// Replaces period labels with the four documented sections; omits metric panels/icons.
// The public Navbar11 also intentionally renders no section panels.
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { designSections, type DesignSection } from "../data";

export function DesignSections({
  value,
  onChange,
}: {
  value: DesignSection;
  onChange: (value: DesignSection) => void;
}) {
  return (
    <Tabs value={value} onValueChange={(next) => onChange(next as DesignSection)}>
      <TabsList aria-label="Design system sections" className="w-full">
        {designSections.map((section) => (
          <TabsTrigger key={section} value={section} className="gap-1.5">
            {section}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
