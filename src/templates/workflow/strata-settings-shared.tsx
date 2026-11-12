import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import "./strata-settings-shared.css";

/** Settings layout composes the actual free Frame, Field and native controls. */
export function StrataSettingsSection({
  title,
  description,
  action,
  footer,
  children,
  collapsible = false,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  collapsible?: boolean;
}) {
  const [open, setOpen] = useState(true);
  const content = <FramePanel className="strata-settings-section-body">{children}</FramePanel>;
  const header = (
    <FrameHeader className="strata-settings-section-header">
      <div>
        <FrameTitle>{title}</FrameTitle>
        {description && <FrameDescription>{description}</FrameDescription>}
      </div>
      {action}
      {collapsible && <ChevronDown className="strata-settings-chevron" aria-hidden="true" />}
    </FrameHeader>
  );
  const frame = (
    <Frame dense className="strata-settings-section" aria-label={title}>
      {collapsible ? (
        <FrameHeader className="strata-settings-section-header">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="strata-settings-section-toggle" aria-label={title}>
              <span>
                <span className="strata-settings-collapse-title">{title}</span>
                {description && (
                  <span className="strata-settings-collapse-description">{description}</span>
                )}
              </span>
              <ChevronDown className="strata-settings-chevron" aria-hidden="true" />
            </Button>
          </CollapsibleTrigger>
          {action}
        </FrameHeader>
      ) : (
        header
      )}
      {collapsible ? <CollapsibleContent>{content}</CollapsibleContent> : content}
      {footer && <FrameFooter className="strata-settings-section-footer">{footer}</FrameFooter>}
    </Frame>
  );
  return collapsible ? (
    <Collapsible open={open} onOpenChange={setOpen}>
      {frame}
    </Collapsible>
  ) : (
    frame
  );
}

export function StrataSettingsRow({
  id,
  title,
  description,
  badge,
  children,
  compact = false,
}: {
  id?: string;
  title: ReactNode;
  description?: ReactNode;
  badge?: ReactNode;
  children: ReactNode;
  compact?: boolean;
}) {
  const label = (
    <>
      {title}
      {badge}
    </>
  );
  return (
    <Field className="strata-setting-row" data-compact={compact || undefined}>
      <FieldContent className="strata-setting-label">
        {id ? <FieldLabel htmlFor={id}>{label}</FieldLabel> : <FieldTitle>{label}</FieldTitle>}
        {description && (
          <FieldDescription id={id ? `${id}-description` : undefined}>
            {description}
          </FieldDescription>
        )}
      </FieldContent>
      <div className="strata-setting-control">{children}</div>
    </Field>
  );
}

export function StrataSettingsSelect({
  id,
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger id={id} aria-label={label} className="strata-setting-select">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
