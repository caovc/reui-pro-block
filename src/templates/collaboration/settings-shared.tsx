import type { ReactNode } from "react";
import {
  Frame,
  FrameHeader,
  FrameTitle,
  FrameDescription,
  FramePanel,
} from "@/components/reui/frame";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  NumberField,
  NumberFieldGroup,
  NumberFieldInput,
  NumberFieldIncrement,
  NumberFieldDecrement,
} from "@/components/reui/number-field";
import { Button } from "./shared";
import "./settings.css";

export function SettingsSection({
  title,
  description,
  children,
  action,
  dirty,
  save,
  discard,
  footer,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
  dirty?: boolean;
  save?: () => void;
  discard?: () => void;
  footer?: ReactNode;
}) {
  return (
    <Frame dense className="ct-settings-section" aria-label={title}>
      <FrameHeader>
        <div className="ct-between">
          <div>
            <FrameTitle>{title}</FrameTitle>
            {description && <FrameDescription>{description}</FrameDescription>}
          </div>
          {action}
        </div>
      </FrameHeader>
      <FramePanel className="ct-settings-section-content">{children}</FramePanel>
      {footer}
      {save && (
        <div className="ct-setting-footer">
          <span>{dirty ? "Unsaved changes" : "All changes saved"}</span>
          <div className="ct-toolbar">
            <Button size="sm" variant="outline" disabled={!dirty} onClick={discard}>
              Discard
            </Button>
            <Button size="sm" disabled={!dirty} onClick={save}>
              Save changes
            </Button>
          </div>
        </div>
      )}
    </Frame>
  );
}
export function SettingsRow({
  title,
  description,
  children,
}: {
  title: ReactNode;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="ct-setting-row">
      <div className="ct-setting-label">
        <h3>{title}</h3>
        {description && <p>{description}</p>}
      </div>
      <div className="ct-setting-control">{children}</div>
    </div>
  );
}
export function SettingsSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem value={option} key={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
export function SettingsNumber({
  label,
  value,
  onChange,
  min = 0,
  max = 365,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <NumberField
      value={value}
      min={min}
      max={max}
      onValueChange={(number) => onChange(number ?? min)}
    >
      <NumberFieldGroup>
        <NumberFieldDecrement aria-label={`Decrease ${label}`} />
        <NumberFieldInput aria-label={label} />
        <NumberFieldIncrement aria-label={`Increase ${label}`} />
      </NumberFieldGroup>
    </NumberField>
  );
}
