import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { cn } from "cn";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

type AccordionSharedProps = Omit<
  AccordionPrimitive.Root.Props,
  "multiple" | "value" | "defaultValue" | "onValueChange"
>;

type AccordionSingleProps = AccordionSharedProps & {
  type?: "single";
  multiple?: false;
  collapsible?: boolean;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
};

type AccordionMultipleProps = AccordionSharedProps & {
  type?: "multiple";
  multiple?: true;
  collapsible?: boolean;
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
};

function Accordion(props: AccordionSingleProps | AccordionMultipleProps) {
  const {
    className,
    type,
    multiple: multipleProp,
    collapsible: _collapsible,
    value,
    defaultValue,
    onValueChange,
    ...rest
  } = props;
  const multiple = multipleProp ?? type === "multiple";
  const values = multiple
    ? (value as string[] | undefined)
    : value === undefined
      ? undefined
      : [value as string];
  const defaults = multiple
    ? (defaultValue as string[] | undefined)
    : defaultValue === undefined
      ? undefined
      : [defaultValue as string];
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={cn("flex w-full flex-col", className)}
      {...rest}
      multiple={multiple}
      value={values}
      defaultValue={defaults}
      onValueChange={(next) => {
        if (multiple) {
          const callback = onValueChange as AccordionMultipleProps["onValueChange"];
          callback?.([...next]);
        } else {
          const callback = onValueChange as AccordionSingleProps["onValueChange"];
          callback?.(next[0] ?? "");
        }
      }}
    />
  );
}

function AccordionItem({ className, ...props }: AccordionPrimitive.Item.Props) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("not-last:border-b", className)}
      {...props}
    />
  );
}

function AccordionTrigger({ className, children, ...props }: AccordionPrimitive.Trigger.Props) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "group/accordion-trigger relative flex flex-1 items-start justify-between rounded-lg border border-transparent py-2.5 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:after:border-ring aria-disabled:pointer-events-none aria-disabled:opacity-50 **:data-[slot=accordion-trigger-icon]:ml-auto **:data-[slot=accordion-trigger-icon]:size-4 **:data-[slot=accordion-trigger-icon]:text-muted-foreground",
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon
          data-slot="accordion-trigger-icon"
          className="pointer-events-none shrink-0 group-aria-expanded/accordion-trigger:hidden"
        />
        <ChevronUpIcon
          data-slot="accordion-trigger-icon"
          className="pointer-events-none hidden shrink-0 group-aria-expanded/accordion-trigger:inline"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({ className, children, ...props }: AccordionPrimitive.Panel.Props) {
  return (
    <AccordionPrimitive.Panel
      data-slot="accordion-content"
      className="overflow-hidden text-sm data-open:animate-accordion-down data-closed:animate-accordion-up"
      {...props}
    >
      <div
        className={cn(
          "h-(--accordion-panel-height) pt-0 pb-2.5 data-ending-style:h-0 data-starting-style:h-0 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4",
          className,
        )}
      >
        {children}
      </div>
    </AccordionPrimitive.Panel>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
