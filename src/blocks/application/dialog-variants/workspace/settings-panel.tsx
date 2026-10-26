import { useId, type ChangeEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export type SettingsValue = string | boolean;
export type SettingsValues = Record<string, SettingsValue>;

/** Shared presentation extracted from AccountSettingsDialog. The caller owns all draft/saved data. */
export function SettingsRow({
  id,
  title,
  description,
  badge,
  children,
  invalid,
  className,
}: {
  id?: string;
  title: ReactNode;
  description?: ReactNode;
  badge?: ReactNode;
  children: ReactNode;
  invalid?: boolean;
  className?: string;
}) {
  return (
    <Field className={cn("workspace-settings-row", className)} data-invalid={invalid}>
      <FieldContent>
        {id ? (
          <FieldLabel htmlFor={id}>
            {title}
            {badge}
          </FieldLabel>
        ) : (
          <FieldTitle>
            {title}
            {badge}
          </FieldTitle>
        )}
        {description && (
          <FieldDescription id={id ? `${id}-description` : undefined}>
            {description}
          </FieldDescription>
        )}
      </FieldContent>
      <div className="workspace-settings-control">{children}</div>
    </Field>
  );
}

export function SettingsChoice({
  id,
  value,
  options,
  onChange,
  disabled,
  describedBy,
  invalid,
}: {
  id: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  disabled?: boolean;
  describedBy?: string;
  invalid?: boolean;
}) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        id={id}
        className="w-full"
        aria-describedby={describedBy}
        aria-invalid={invalid}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options.map((option) => (
            <SelectItem value={option} key={option}>
              {option}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export type SettingsFieldDefinition = {
  id: string;
  /** Explicit legacy id; otherwise the panel scopes controls to their section. */
  controlId?: string;
  label: ReactNode;
  description?: ReactNode;
  type?: "text" | "email" | "switch" | "textarea";
  prefix?: string;
  suffix?: string;
  options?: readonly string[];
  badge?: ReactNode;
  error?: string;
  disabled?: boolean;
  maxLength?: number;
};

export function SettingsFields({
  fields,
  value,
  onValueChange,
  idPrefix = "workspace-settings",
}: {
  fields: readonly SettingsFieldDefinition[];
  value: SettingsValues;
  onValueChange: (id: string, value: SettingsValue) => void;
  idPrefix?: string;
}) {
  return fields.map((field) => {
    const id = field.controlId ?? `${idPrefix}-${field.id}`;
    const describedBy =
      [field.description && `${id}-description`, field.error && `${id}-error`]
        .filter(Boolean)
        .join(" ") || undefined;
    const controlProps = {
      id,
      disabled: field.disabled,
      "aria-describedby": describedBy,
      "aria-invalid": Boolean(field.error),
    };
    const textProps = {
      ...controlProps,
      value: String(value[field.id] ?? ""),
      maxLength: field.maxLength ?? 160,
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        onValueChange(field.id, event.target.value),
    };
    return (
      <SettingsRow
        key={field.id}
        id={id}
        title={field.label}
        description={field.description}
        badge={field.badge}
        invalid={Boolean(field.error)}
      >
        {field.type === "switch" ? (
          <Switch
            {...controlProps}
            checked={Boolean(value[field.id])}
            onCheckedChange={(checked) => onValueChange(field.id, checked)}
          />
        ) : field.options ? (
          <SettingsChoice
            id={id}
            value={String(value[field.id] ?? "")}
            options={field.options}
            disabled={field.disabled}
            describedBy={describedBy}
            invalid={Boolean(field.error)}
            onChange={(next) => onValueChange(field.id, next)}
          />
        ) : field.type === "textarea" ? (
          <Textarea {...textProps} />
        ) : field.prefix || field.suffix ? (
          <InputGroup>
            {field.prefix && <InputGroupAddon>{field.prefix}</InputGroupAddon>}
            <InputGroupInput {...textProps} />
            {field.suffix && <InputGroupAddon align="inline-end">{field.suffix}</InputGroupAddon>}
          </InputGroup>
        ) : (
          <Input {...textProps} type={field.type === "email" ? "email" : "text"} />
        )}
        {field.error && <FieldError id={`${id}-error`}>{field.error}</FieldError>}
      </SettingsRow>
    );
  });
}

export type SettingsPanelSection = {
  id: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  fields?: readonly SettingsFieldDefinition[];
  children?: ReactNode;
};

export type SettingsPanelProps = {
  sections: readonly SettingsPanelSection[];
  section: string;
  onSectionChange: (section: string) => void;
  value: SettingsValues;
  onValueChange: (id: string, value: SettingsValue) => void;
  onSave: (value: SettingsValues) => void;
  onCancel?: () => void;
  onDiscard?: () => void;
  saveDisabled?: boolean;
  discardDisabled?: boolean;
  saveLabel?: string;
  idPrefix?: string;
  className?: string;
  navigationLabel?: string;
  renderHeader?: (section: SettingsPanelSection) => ReactNode;
  renderFooter?: (actions: ReactNode) => ReactNode;
};

/** No initial values, domain mutations, upload state or toast lives in this controlled panel. */
export function SettingsPanel({
  sections,
  section,
  onSectionChange,
  value,
  onValueChange,
  onSave,
  onCancel,
  onDiscard,
  saveDisabled,
  discardDisabled,
  saveLabel = "Save changes",
  idPrefix,
  className,
  navigationLabel = "Settings sections",
  renderHeader,
  renderFooter,
}: SettingsPanelProps) {
  const generatedId = useId();
  const active = sections.find((entry) => entry.id === section);
  const actions = (
    <>
      {onCancel && (
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      )}
      {onDiscard && (
        <Button variant="outline" disabled={discardDisabled} onClick={onDiscard}>
          Discard
        </Button>
      )}
      <Button disabled={saveDisabled} onClick={() => onSave(value)}>
        {saveLabel}
      </Button>
    </>
  );
  return (
    <Tabs
      value={section}
      onValueChange={onSectionChange}
      className={cn("workspace-settings-tabs", className)}
      data-settings-panel="controlled"
    >
      <TabsList variant="line" className="workspace-settings-rail" aria-label={navigationLabel}>
        {sections.map((entry) => (
          <TabsTrigger value={entry.id} key={entry.id}>
            {entry.icon}
            {entry.title}
          </TabsTrigger>
        ))}
      </TabsList>
      <div className="workspace-settings-main">
        {active &&
          (renderHeader ? (
            renderHeader(active)
          ) : (
            <header className="workspace-settings-header">
              <h2>{active.title}</h2>
              {active.description && <p>{active.description}</p>}
            </header>
          ))}
        <Separator />
        <ScrollArea className="workspace-settings-scroll">
          {sections.map((entry) => (
            <TabsContent
              value={entry.id}
              key={entry.id}
              forceMount
              hidden={section !== entry.id}
              className="workspace-settings-tab"
            >
              <FieldGroup>
                {entry.children}
                {entry.fields && (
                  <SettingsFields
                    fields={entry.fields}
                    value={value}
                    onValueChange={onValueChange}
                    idPrefix={`${idPrefix ?? generatedId}-${entry.id}`}
                  />
                )}
              </FieldGroup>
            </TabsContent>
          ))}
        </ScrollArea>
        {renderFooter ? (
          renderFooter(actions)
        ) : (
          <div className="workspace-settings-footer">{actions}</div>
        )}
      </div>
    </Tabs>
  );
}
