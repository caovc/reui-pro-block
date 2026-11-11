"use client";

import * as React from "react";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { useRender } from "@base-ui/react/use-render";
import { useMotionPolicy } from "@/components/ui/motion-policy";
import { cn } from "@/lib/utils";

import {
  type OverlayChildProps,
  type OverlayDismissHandlers,
  overlayButton,
  overlayChild,
  overlayClassName,
  overlayDismissContext,
  overlayMotionStyle,
  overlayFocus,
  shouldCancelOverlayDismiss,
  useOverlayDismiss,
  useOverlayDismissHandlers,
} from "./overlay-compat";

// ReUI c-popover-1 composes the shadcn Base Nova Popover (MIT).
// https://reui.io/r/base-nova/c-popover-1.json
// https://ui.shadcn.com/r/styles/base-nova/popover.json
type PositionerProps = PopoverPrimitive.Positioner.Props;
type Anchor = PositionerProps["anchor"];
type AnchorContextValue = {
  anchor: Anchor;
  setAnchor: React.Dispatch<React.SetStateAction<Anchor>>;
  modal: PopoverPrimitive.Root.Props["modal"];
};

const PopoverDismissContext = overlayDismissContext();
const PopoverAnchorContext = React.createContext<AnchorContextValue | null>(null);
const positionerStyle = {
  "--radix-popover-content-transform-origin": "var(--transform-origin)",
  "--radix-popover-content-available-width": "var(--available-width)",
  "--radix-popover-content-available-height": "var(--available-height)",
  "--radix-popover-trigger-width": "var(--anchor-width)",
  "--radix-popover-trigger-height": "var(--anchor-height)",
} as React.CSSProperties;

function Popover<Payload>({
  onOpenChange,
  modal = false,
  ...props
}: PopoverPrimitive.Root.Props<Payload>) {
  const { current: dismissHandlers, register } = useOverlayDismiss();
  const [anchor, setAnchor] = React.useState<Anchor>();
  return (
    <PopoverDismissContext.Provider value={register}>
      <PopoverAnchorContext.Provider value={{ anchor, setAnchor, modal }}>
        <PopoverPrimitive.Root
          data-slot="popover"
          {...props}
          modal={modal}
          onOpenChange={(open, details) => {
            if (!open && shouldCancelOverlayDismiss(details, dismissHandlers.current)) {
              details.cancel();
              return;
            }
            onOpenChange?.(open, details);
          }}
        />
      </PopoverAnchorContext.Provider>
    </PopoverDismissContext.Provider>
  );
}

function PopoverTrigger<Payload>({
  asChild,
  children,
  render,
  nativeButton,
  ...props
}: OverlayChildProps<PopoverPrimitive.Trigger.Props<Payload>>) {
  return (
    <PopoverPrimitive.Trigger
      data-slot="popover-trigger"
      {...props}
      {...overlayButton(asChild, children, render, nativeButton)}
    />
  );
}

type VirtualAnchor = {
  getBoundingClientRect: () => DOMRect;
  contextElement?: Element;
};

function PopoverAnchor({
  asChild,
  children,
  ref,
  render,
  virtualRef,
  ...props
}: OverlayChildProps<useRender.ComponentProps<"div">> & {
  virtualRef?: React.RefObject<VirtualAnchor | null>;
}) {
  const setAnchor = React.useContext(PopoverAnchorContext)?.setAnchor;
  const anchorRef = React.useRef<HTMLDivElement>(null);
  const registeredAnchor = React.useRef<Anchor>(undefined);

  React.useLayoutEffect(() => {
    if (!setAnchor) return;
    const anchor = (virtualRef ? virtualRef.current : anchorRef.current) ?? undefined;
    if (registeredAnchor.current === anchor) return;
    registeredAnchor.current = anchor;
    setAnchor(anchor);
  });

  React.useLayoutEffect(
    () => () => {
      const anchor = registeredAnchor.current;
      registeredAnchor.current = undefined;
      setAnchor?.((current) => (current === anchor ? undefined : current));
    },
    [setAnchor],
  );

  const element = overlayChild(asChild, children, render);
  return useRender({
    enabled: !virtualRef,
    defaultTagName: "div",
    render: element.render,
    ref: [ref ?? null, anchorRef],
    props: { "data-slot": "popover-anchor", ...props, children: element.children },
  });
}

type PopupRender = PopoverPrimitive.Popup.Props["render"];
type PopupRenderFn = Extract<PopupRender, (...args: never[]) => React.ReactElement>;

function PopoverPopupElement({
  elementProps,
  state,
  render,
}: {
  elementProps: Parameters<PopupRenderFn>[0];
  state: PopoverPrimitive.Popup.State;
  render: PopupRender;
}) {
  return useRender({
    defaultTagName: "div",
    render: typeof render === "function" ? (props) => render(props, state) : render,
    props: { ...elementProps, "data-state": state.open ? "open" : "closed" },
  });
}

type PopoverContentProps = OverlayChildProps<PopoverPrimitive.Popup.Props> &
  OverlayDismissHandlers &
  Pick<
    PositionerProps,
    | "anchor"
    | "align"
    | "alignOffset"
    | "side"
    | "sideOffset"
    | "positionMethod"
    | "collisionPadding"
    | "collisionAvoidance"
    | "arrowPadding"
    | "disableAnchorTracking"
  > & {
    collisionBoundary?:
      | Exclude<PositionerProps["collisionBoundary"], Element[]>
      | (Element | null)[]
      | null;
    sticky?: PositionerProps["sticky"] | "partial" | "always";
    avoidCollisions?: boolean;
    hideWhenDetached?: boolean;
    portalContainer?: PopoverPrimitive.Portal.Props["container"];
    forceMount?: true;
    onOpenAutoFocus?: (event: Event) => void;
    onCloseAutoFocus?: (event: Event) => void;
  };

function PopoverContent({
  asChild,
  children,
  className,
  render,
  style,
  anchor,
  align = "center",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  positionMethod = "fixed",
  collisionBoundary,
  collisionPadding = 0,
  collisionAvoidance,
  arrowPadding,
  sticky,
  avoidCollisions = true,
  hideWhenDetached,
  disableAnchorTracking,
  portalContainer,
  forceMount,
  onEscapeKeyDown,
  onPointerDownOutside,
  onFocusOutside,
  onInteractOutside,
  onOpenAutoFocus,
  onCloseAutoFocus,
  initialFocus,
  finalFocus,
  ...props
}: PopoverContentProps) {
  const context = React.useContext(PopoverAnchorContext);
  const reduceAnimations = useMotionPolicy();
  useOverlayDismissHandlers(PopoverDismissContext, {
    onEscapeKeyDown,
    onPointerDownOutside,
    onFocusOutside,
    onInteractOutside,
  });

  // Base UI uses a registered Close part to enable its native modal focus trap.
  const closePart = context?.modal ? (
    <PopoverPrimitive.Close hidden aria-hidden="true" tabIndex={-1} />
  ) : undefined;
  const element = overlayChild(asChild, children, render, closePart);
  const boundary = Array.isArray(collisionBoundary)
    ? collisionBoundary.filter((item): item is Element => item !== null)
    : collisionBoundary;
  return (
    <PopoverPrimitive.Portal container={portalContainer} keepMounted={forceMount}>
      <PopoverPrimitive.Positioner
        anchor={anchor ?? context?.anchor}
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        positionMethod={positionMethod}
        collisionBoundary={boundary ?? undefined}
        collisionPadding={collisionPadding}
        collisionAvoidance={
          avoidCollisions
            ? collisionAvoidance
            : { side: "none", align: "none", fallbackAxisSide: "none" }
        }
        arrowPadding={arrowPadding}
        sticky={sticky === "always" || sticky === true}
        disableAnchorTracking={disableAnchorTracking}
        className={cn("isolate z-50", hideWhenDetached && "data-[anchor-hidden]:invisible")}
        style={positionerStyle}
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={overlayClassName(
            "z-50 flex w-72 origin-(--transform-origin) flex-col gap-2.5 rounded-lg bg-popover p-2.5 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-hidden duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className,
          )}
          style={overlayMotionStyle(style, reduceAnimations)}
          initialFocus={overlayFocus(onOpenAutoFocus, initialFocus)}
          finalFocus={overlayFocus(onCloseAutoFocus, finalFocus)}
          {...props}
          render={(elementProps, state) => (
            <PopoverPopupElement
              elementProps={elementProps}
              state={state}
              render={element.render}
            />
          )}
        >
          {element.children}
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}

function PopoverHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="popover-header"
      className={cn("flex flex-col gap-0.5 text-sm", className)}
      {...props}
    />
  );
}

function PopoverTitle({ className, render = <div />, ...props }: PopoverPrimitive.Title.Props) {
  return (
    <PopoverPrimitive.Title
      data-slot="popover-title"
      className={overlayClassName("font-medium", className)}
      render={render}
      {...props}
    />
  );
}

function PopoverDescription({ className, ...props }: PopoverPrimitive.Description.Props) {
  return (
    <PopoverPrimitive.Description
      data-slot="popover-description"
      className={overlayClassName("text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
};
