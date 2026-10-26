import { useId, useRef, useState, type ReactNode } from "react";
import { Clock, Code, Database, GitBranch, Info, Mail, Webhook, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { IconTile } from "@/components/reui/icon-tile";
import { BrandIcon } from "./flow-gantt-brand";
import { MiniAvatar } from "./flow-gantt-avatars";
import { useFlowPortalFont } from "./flow-portal-font";
import "./flow-inspector-fields.css";

type FieldName = "Title" | "Detail" | "Category" | "Owner" | "App";

function FlowFieldHelp({ label, children }: { label: FieldName; children: string }) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const portalFont = useFlowPortalFont(triggerRef, open);

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <Button
          ref={triggerRef}
          type="button"
          variant="ghost"
          size="icon-xs"
          className="-my-1 text-muted-foreground"
          aria-label={`About the ${label.toLowerCase()}`}
        >
          <Info />
        </Button>
      </TooltipTrigger>
      {/* The free Radix arrow adds 10px; retain the reference's 4px content gap. */}
      <TooltipContent
        side="top"
        sideOffset={-6}
        collisionPadding={5}
        className="fg-inspector-field-tooltip max-w-56"
        style={portalFont}
      >
        {children}
      </TooltipContent>
    </Tooltip>
  );
}

interface FlowSelectOption {
  value: string;
  label: string;
  leading: ReactNode;
  content?: ReactNode;
}

function FlowSelectField({
  label,
  help,
  value,
  options,
  onValueChange,
}: {
  label: "Category" | "Owner" | "App";
  help: string;
  value: string | undefined;
  options: readonly FlowSelectOption[];
  onValueChange: (value: string) => void;
}) {
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const portalFont = useFlowPortalFont(triggerRef, open);

  return (
    <Field>
      <div className="flex items-center gap-1.5">
        <FieldLabel htmlFor={id} className="leading-none">
          {label}
        </FieldLabel>
        <FlowFieldHelp label={label}>{help}</FlowFieldHelp>
      </div>
      <Select value={value} onValueChange={onValueChange} open={open} onOpenChange={setOpen}>
        <SelectTrigger ref={triggerRef} id={id} className="w-full font-normal">
          <SelectValue />
        </SelectTrigger>
        <SelectContent
          position="popper"
          align="start"
          className="fg-inspector-field-select-content"
          style={portalFont}
          onEscapeKeyDown={(event) => event.stopPropagation()}
        >
          <SelectGroup className="p-0">
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value} textValue={option.label}>
                {option.content ?? (
                  <>
                    {option.leading}
                    {option.label}
                  </>
                )}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  );
}

const categories = [
  { value: "Webhook", icon: Webhook },
  { value: "Condition", icon: GitBranch },
  { value: "Data", icon: Database },
  { value: "Email", icon: Mail },
  { value: "Delay", icon: Clock },
  { value: "Action", icon: Zap },
] as const;

export function FlowWorkflowSelectFields({
  category,
  owner,
  owners,
  onCategoryChange,
  onOwnerChange,
}: {
  category: string;
  owner: string | undefined;
  owners: readonly string[];
  onCategoryChange: (value: string) => void;
  onOwnerChange: (value: string) => void;
}) {
  return (
    <TooltipProvider>
      <FieldGroup className="fg-native-inspector-fields fg-inspector-select-fields">
        <FlowSelectField
          label="Category"
          help="Sets the glyph on the node, so a run reads by shape before anyone reads the words."
          value={category}
          onValueChange={onCategoryChange}
          options={categories.map(({ value, icon: Icon }) => ({
            value,
            label: value,
            leading: <Icon aria-hidden="true" />,
          }))}
        />
        <FlowSelectField
          label="Owner"
          help="Whoever gets paged when this step fails on a live run."
          value={owner}
          onValueChange={onOwnerChange}
          options={owners.map((name) => ({
            value: name,
            label: name,
            leading: (
              <span aria-hidden="true" className="fg-inspector-owner-choice pointer-events-none">
                <MiniAvatar
                  name={name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")}
                />
              </span>
            ),
          }))}
        />
      </FieldGroup>
    </TooltipProvider>
  );
}

const helpText = {
  workflow: {
    title: "Shown on the node. Two or three words read best.",
    detail: "The second line on the node. Usually the service it calls or the condition it tests.",
  },
  agent: {
    title: "The integration or service this step calls.",
    detail: "What the step does, in one short clause.",
  },
};

interface FlowInspectorTextFieldsProps {
  variant: "workflow" | "agent";
  title: string;
  detail: string;
  onTitleChange: (value: string) => void;
  onDetailChange: (value: string) => void;
}

export function FlowInspectorTextFields({
  variant,
  title,
  detail,
  onTitleChange,
  onDetailChange,
}: FlowInspectorTextFieldsProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const detailId = `${id}-detail`;

  return (
    <TooltipProvider>
      <FieldGroup className="fg-native-inspector-fields fg-inspector-text-fields">
        <Field>
          <div className="flex items-center gap-1.5">
            <FieldLabel htmlFor={titleId} className="leading-none">
              Title
            </FieldLabel>
            <FlowFieldHelp label="Title">{helpText[variant].title}</FlowFieldHelp>
          </div>
          <Input
            id={titleId}
            className="font-normal"
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
          />
        </Field>
        <Field>
          <div className="flex items-center gap-1.5">
            <FieldLabel htmlFor={detailId} className="leading-none">
              Detail
            </FieldLabel>
            <FlowFieldHelp label="Detail">{helpText[variant].detail}</FlowFieldHelp>
          </div>
          <Input
            id={detailId}
            className="font-normal"
            value={detail}
            onChange={(event) => onDetailChange(event.target.value)}
          />
        </Field>
      </FieldGroup>
    </TooltipProvider>
  );
}

const agentApps = ["Stripe", "Neon", "Claude", "ClickUp", "Resend", "Slack", "Custom Code"];

/** App marks use the same free IconTile that appears in the reference rows. */
export function FlowAgentAppField({
  value,
  onValueChange,
}: {
  value: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <TooltipProvider>
      <FieldGroup className="fg-native-inspector-fields fg-inspector-app-fields">
        <FlowSelectField
          label="App"
          help="The service this step calls. Its mark is what the node shows."
          value={value}
          onValueChange={onValueChange}
          options={agentApps.map((app) => ({
            value: app,
            label: app,
            leading: null,
            content: (
              <span className="inline-flex items-center gap-2 align-middle">
                <IconTile size="xs" aria-hidden="true">
                  {app === "Custom Code" ? (
                    <Code className="size-3.5" />
                  ) : (
                    <BrandIcon app={app} className="size-3.5" />
                  )}
                </IconTile>
                {app}
              </span>
            ),
          }))}
        />
      </FieldGroup>
    </TooltipProvider>
  );
}

const agentModels = ["Opus 5", "Sonnet 5", "Haiku 4.5"];

/** Graph state and model Undo stay in the consumer, outside the native Select. */
export function FlowAgentModelSelect({
  value,
  leading,
  onValueChange,
}: {
  value: string;
  leading: ReactNode;
  onValueChange: (value: string) => void;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const portalFont = useFlowPortalFont(triggerRef, open);

  return (
    <Select value={value} onValueChange={onValueChange} open={open} onOpenChange={setOpen}>
      <SelectTrigger ref={triggerRef} aria-label="Model" className="w-fit font-normal">
        {leading}
        <SelectValue />
      </SelectTrigger>
      <SelectContent
        position="popper"
        align="start"
        className="fg-inspector-field-select-content"
        style={portalFont}
      >
        <SelectGroup className="p-0">
          {agentModels.map((model) => (
            <SelectItem key={model} value={model} textValue={model} data-value={model}>
              {model}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
