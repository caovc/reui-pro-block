import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import "./flow-inspector-tabs.css";

export interface FlowInspectorTabsProps {
  enabled: boolean;
  value: string;
  onValueChange: (value: string) => void;
  secondaryLabel: "Wiring" | "Links";
  children: ReactNode;
}

/** Official free line tabs; the caller retains inspector content and draft state. */
export function FlowInspectorTabs({
  enabled,
  value,
  onValueChange,
  secondaryLabel,
  children,
}: FlowInspectorTabsProps) {
  if (!enabled) return <>{children}</>;

  return (
    <Tabs value={value} onValueChange={onValueChange} className="flow-inspector-tabs">
      <TabsList
        variant="line"
        className="flow-inspector-tablist"
        aria-label={secondaryLabel === "Links" ? "Metric details" : "Task details"}
      >
        <TabsTrigger value="Settings">Settings</TabsTrigger>
        <TabsTrigger value={secondaryLabel}>{secondaryLabel}</TabsTrigger>
      </TabsList>
      <TabsContent value={value} className="flow-inspector-tabpanel">
        {children}
      </TabsContent>
    </Tabs>
  );
}

export interface FlowPeriodControlProps {
  value: number;
  onValueChange: (value: number) => void;
}

const periods = [
  { label: "7 days", compactLabel: "7d" },
  { label: "6 weeks", compactLabel: "6w" },
  { label: "12 months", compactLabel: "12m" },
];

/** Free ButtonGroup retains joined outline borders and each Button's focus state. */
export function FlowPeriodControl({ value, onValueChange }: FlowPeriodControlProps) {
  return (
    <ButtonGroup aria-label="Period" className="flow-period-control">
      {periods.map((period, index) => (
        <Button
          key={period.label}
          type="button"
          variant="outline"
          aria-label={period.label}
          aria-pressed={value === index}
          onClick={() => onValueChange(index)}
        >
          <span className="flow-period-label" aria-hidden="true">
            {period.label}
          </span>
          <span className="flow-period-compact-label" aria-hidden="true">
            {period.compactLabel}
          </span>
        </Button>
      ))}
    </ButtonGroup>
  );
}

export default FlowInspectorTabs;
