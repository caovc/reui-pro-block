"use client";

// ReUI free c-select-1 composes the shadcn Base Nova Select (MIT).
// https://reui.io/r/base-nova/c-select-1.json
// https://ui.shadcn.com/r/styles/base-nova/select.json
import * as React from "react";
import { DirectionProvider } from "@base-ui/react/direction-provider";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import type { ComponentRenderFn, HTMLProps } from "@base-ui/react/types";
import { useRender } from "@base-ui/react/use-render";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useMotionPolicy } from "@/components/ui/motion-policy";
import { cn } from "@/lib/utils";
import {
  overlayButton,
  overlayChild,
  overlayClassName,
  overlayDismissContext,
  overlayFocus,
  overlayMotionStyle,
  shouldCancelOverlayDismiss,
  useOverlayDismiss,
  useOverlayDismissHandlers,
  type OverlayChildProps,
  type OverlayDismissHandlers,
} from "./overlay-compat";

const SelectDismissContext = overlayDismissContext();

type SelectProps = Omit<SelectPrimitive.Root.Props<string>, "onValueChange"> & {
  dir?: "ltr" | "rtl";
  onValueChange?: {
    bivarianceHack(value: string, details: SelectPrimitive.Root.ChangeEventDetails): void;
  }["bivarianceHack"];
};

function selectItems(children: React.ReactNode) {
  const items: { value: string | null; label: React.ReactNode }[] = [];

  function visit(nodes: React.ReactNode) {
    React.Children.forEach(nodes, (node) => {
      if (!React.isValidElement<{ children?: React.ReactNode; value?: string | null }>(node)) {
        return;
      }
      if (node.type === Select) return;
      if (node.type === SelectItem) {
        if (node.props.value !== undefined) {
          items.push({ value: node.props.value, label: node.props.children });
        }
        return;
      }
      visit(node.props.children);
    });
  }

  visit(children);
  return items;
}

function Select({
  children,
  items,
  dir,
  value,
  defaultValue,
  onOpenChange,
  onValueChange,
  ...props
}: SelectProps) {
  const { current: dismissHandlers, register } = useOverlayDismiss();
  // Existing consumers describe their labels in JSX. Feed those labels to the
  // official Value component without replacing native option or keyboard logic.
  const options = React.useMemo(() => items ?? selectItems(children), [children, items]);
  const root = (
    <SelectDismissContext.Provider value={register}>
      <SelectPrimitive.Root
        {...props}
        items={options}
        value={value === "" ? null : value}
        defaultValue={defaultValue === "" ? null : defaultValue}
        onValueChange={(next, details) => onValueChange?.(next ?? "", details)}
        onOpenChange={(open, details) => {
          if (!open && shouldCancelOverlayDismiss(details, dismissHandlers.current)) {
            details.cancel();
            return;
          }
          onOpenChange?.(open, details);
        }}
      >
        {children}
      </SelectPrimitive.Root>
    </SelectDismissContext.Provider>
  );

  return dir ? <DirectionProvider direction={dir}>{root}</DirectionProvider> : root;
}

type SelectRender<State> = React.ReactElement | ComponentRenderFn<HTMLProps, State> | undefined;

function SelectElement({
  tag,
  render,
  elementProps,
}: {
  tag: "button" | "div";
  render?: React.ReactElement;
  elementProps: HTMLProps;
}) {
  return useRender({ defaultTagName: tag, render, props: { ...elementProps } });
}

function selectStateRender<State>(
  tag: "button" | "div",
  render: SelectRender<State>,
  attributes: (state: State) => Record<string, string | undefined>,
): ComponentRenderFn<HTMLProps, State> {
  return (props, state) => {
    const elementProps = { ...props, ...attributes(state) };
    return typeof render === "function" ? (
      render(elementProps, state)
    ) : (
      <SelectElement tag={tag} render={render} elementProps={elementProps} />
    );
  };
}

function selectLayout<Render>(
  asChild: boolean | undefined,
  children: React.ReactNode,
  render: Render,
  layout: (content: React.ReactNode) => React.ReactNode,
) {
  if (asChild && React.isValidElement<{ children?: React.ReactNode }>(children)) {
    return {
      render: React.cloneElement(children, { children: layout(children.props.children) }),
      children: undefined,
    };
  }
  return { render, children: layout(children) };
}

function SelectGroup({
  asChild,
  children,
  render,
  className,
  ...props
}: OverlayChildProps<SelectPrimitive.Group.Props>) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={overlayClassName("scroll-my-1 p-1", className)}
      {...props}
      {...overlayChild(asChild, children, render)}
    />
  );
}

function SelectValue({
  asChild,
  children,
  render,
  placeholder,
  ...props
}: OverlayChildProps<SelectPrimitive.Value.Props>) {
  const element =
    typeof children === "function" ? { render, children } : overlayChild(asChild, children, render);
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      placeholder={placeholder}
      {...props}
      {...element}
    />
  );
}

function SelectTrigger({
  asChild,
  render,
  nativeButton,
  className,
  size = "default",
  children,
  ...props
}: OverlayChildProps<SelectPrimitive.Trigger.Props> & { size?: "sm" | "default" }) {
  const icon = (
    <SelectPrimitive.Icon className="pointer-events-none text-muted-foreground">
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.Icon>
  );
  const element = overlayButton(asChild, children, render, nativeButton, icon);
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={overlayClassName(
        "flex w-fit items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground data-[size=default]:h-8 data-[size=sm]:h-7 data-[size=sm]:rounded-[min(var(--radius-md),10px)] *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
      nativeButton={element.nativeButton}
      render={selectStateRender("button", element.render, ({ open }) => ({
        "data-state": open ? "open" : "closed",
      }))}
    >
      {element.children}
    </SelectPrimitive.Trigger>
  );
}

type SelectPositionProps = Pick<
  SelectPrimitive.Positioner.Props,
  | "align"
  | "alignItemWithTrigger"
  | "alignOffset"
  | "anchor"
  | "arrowPadding"
  | "collisionAvoidance"
  | "collisionPadding"
  | "disableAnchorTracking"
  | "positionMethod"
  | "side"
  | "sideOffset"
>;

type SelectContentProps = OverlayChildProps<SelectPrimitive.Popup.Props> &
  SelectPositionProps &
  Pick<OverlayDismissHandlers, "onEscapeKeyDown" | "onPointerDownOutside"> & {
    position?: "item-aligned" | "popper";
    portalContainer?: SelectPrimitive.Portal.Props["container"];
    onCloseAutoFocus?: (event: Event) => void;
    avoidCollisions?: boolean;
    collisionBoundary?:
      | SelectPrimitive.Positioner.Props["collisionBoundary"]
      | (Element | null)[]
      | null;
    hideWhenDetached?: boolean;
    sticky?: boolean | "partial" | "always";
  };

const selectPositionerStyle = {
  "--radix-select-trigger-width": "var(--anchor-width)",
  "--radix-select-trigger-height": "var(--anchor-height)",
  "--radix-select-content-available-width": "var(--available-width)",
  "--radix-select-content-available-height": "var(--available-height)",
  "--radix-select-content-transform-origin": "var(--transform-origin)",
} as React.CSSProperties;

function SelectContent({
  asChild,
  children,
  render,
  className,
  style,
  position = "item-aligned",
  side = "bottom",
  sideOffset = 0,
  align = "center",
  alignOffset = 0,
  alignItemWithTrigger = position === "item-aligned",
  anchor,
  arrowPadding,
  avoidCollisions = true,
  collisionAvoidance,
  collisionBoundary,
  collisionPadding,
  disableAnchorTracking,
  positionMethod,
  sticky,
  hideWhenDetached,
  portalContainer,
  finalFocus,
  onCloseAutoFocus,
  onEscapeKeyDown,
  onPointerDownOutside,
  ...props
}: SelectContentProps) {
  const reduceAnimations = useMotionPolicy();
  useOverlayDismissHandlers(SelectDismissContext, { onEscapeKeyDown, onPointerDownOutside });
  const boundary: SelectPrimitive.Positioner.Props["collisionBoundary"] = Array.isArray(
    collisionBoundary,
  )
    ? (collisionBoundary as (Element | null)[]).filter((entry) => entry !== null)
    : (collisionBoundary ?? undefined);
  const element = selectLayout(asChild, children, render, (content) => (
    <>
      <SelectScrollUpButton />
      <SelectPrimitive.List
        data-position={position}
        className={cn("w-full", !alignItemWithTrigger && "min-w-(--anchor-width)")}
      >
        {content}
      </SelectPrimitive.List>
      <SelectScrollDownButton />
    </>
  ));

  return (
    <SelectPrimitive.Portal container={portalContainer}>
      <SelectPrimitive.Positioner
        anchor={anchor}
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        alignItemWithTrigger={alignItemWithTrigger}
        arrowPadding={arrowPadding}
        collisionAvoidance={
          avoidCollisions
            ? collisionAvoidance
            : { side: "none", align: "none", fallbackAxisSide: "none" }
        }
        collisionBoundary={boundary}
        collisionPadding={collisionPadding}
        disableAnchorTracking={disableAnchorTracking}
        positionMethod={positionMethod}
        sticky={sticky === true || sticky === "always"}
        className={cn("isolate z-50", hideWhenDetached && "data-[anchor-hidden]:invisible")}
        style={selectPositionerStyle}
      >
        <SelectPrimitive.Popup
          data-align-trigger={alignItemWithTrigger}
          className={overlayClassName(
            cn(
              "relative isolate z-50 max-h-(--available-height) min-w-36 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[align-trigger=true]:animate-none data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
              !alignItemWithTrigger &&
                "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
            ),
            className,
          )}
          {...props}
          style={overlayMotionStyle(style, reduceAnimations)}
          finalFocus={overlayFocus(onCloseAutoFocus, finalFocus)}
          render={selectStateRender("div", element.render, ({ open, transitionStatus }) => ({
            // Base UI keeps a hidden collection mounted for closed-trigger typeahead.
            // Preserve the legacy popup slot only for the visible popup and its exit.
            "data-slot": open || transitionStatus === "ending" ? "select-content" : undefined,
            "data-state": open ? "open" : "closed",
          }))}
        >
          {element.children}
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({
  asChild,
  render,
  children,
  className,
  ...props
}: OverlayChildProps<SelectPrimitive.GroupLabel.Props>) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-label"
      className={overlayClassName("px-1.5 py-1 text-xs text-muted-foreground", className)}
      {...props}
      {...overlayChild(asChild, children, render)}
    />
  );
}

type SelectItemProps = Omit<OverlayChildProps<SelectPrimitive.Item.Props>, "value"> & {
  value: string | null;
  textValue?: string;
};

function SelectItem({
  asChild,
  render,
  children,
  className,
  textValue,
  label,
  ...props
}: SelectItemProps) {
  const element = selectLayout(asChild, children, render, (content) => (
    <>
      <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="pointer-events-none" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText render={<span />}>{content}</SelectPrimitive.ItemText>
    </>
  ));
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      label={label ?? textValue}
      className={overlayClassName(
        "relative flex w-full cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className,
      )}
      {...props}
      render={selectStateRender("div", element.render, ({ selected }) => ({
        "data-state": selected ? "checked" : "unchecked",
      }))}
    >
      {element.children}
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({
  asChild,
  render,
  children,
  className,
  ...props
}: OverlayChildProps<SelectPrimitive.Separator.Props>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={overlayClassName("pointer-events-none -mx-1 my-1 h-px bg-border", className)}
      {...props}
      {...overlayChild(asChild, children, render)}
    />
  );
}

function SelectScrollUpButton({
  asChild,
  render,
  children,
  className,
  ...props
}: OverlayChildProps<SelectPrimitive.ScrollUpArrow.Props>) {
  return (
    <SelectPrimitive.ScrollUpArrow
      data-slot="select-scroll-up-button"
      className={overlayClassName(
        "top-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
      {...overlayChild(asChild, children, render, <ChevronUpIcon />)}
    />
  );
}

function SelectScrollDownButton({
  asChild,
  render,
  children,
  className,
  ...props
}: OverlayChildProps<SelectPrimitive.ScrollDownArrow.Props>) {
  return (
    <SelectPrimitive.ScrollDownArrow
      data-slot="select-scroll-down-button"
      className={overlayClassName(
        "bottom-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
      {...overlayChild(asChild, children, render, <ChevronDownIcon />)}
    />
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
