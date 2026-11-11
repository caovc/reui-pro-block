"use client";

import * as React from "react";
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import type { HTMLProps } from "@base-ui/react/types";
import { useRender } from "@base-ui/react/use-render";
import { useMotionPolicy } from "@/components/ui/motion-policy";
import {
  type OverlayChildProps,
  type OverlayDismissHandlers,
  overlayChild,
  overlayClassName,
  overlayDismissContext,
  overlayMotionStyle,
  shouldCancelOverlayDismiss,
  useOverlayDismiss,
  useOverlayDismissHandlers,
} from "./overlay-compat";

// ReUI free c-tooltip-1 composes the shadcn Base Nova tooltip.
// Adapted from https://ui.shadcn.com/r/styles/base-nova/tooltip.json (MIT).
const TooltipDismissContext = overlayDismissContext();
const TooltipHoverPolicyContext = React.createContext<boolean | undefined>(undefined);
const TooltipDescriptionContext = React.createContext<{
  contentId: string;
  setContentId: React.Dispatch<React.SetStateAction<string | undefined>>;
  delayDuration: number | undefined;
  openedByHover: boolean;
} | null>(null);

function TooltipProvider({
  delayDuration = 0,
  skipDelayDuration = 300,
  disableHoverableContent,
  delay = delayDuration,
  timeout = skipDelayDuration,
  ...props
}: TooltipPrimitive.Provider.Props & {
  delayDuration?: number;
  skipDelayDuration?: number;
  disableHoverableContent?: boolean;
}) {
  return (
    <TooltipHoverPolicyContext.Provider value={disableHoverableContent}>
      <TooltipPrimitive.Provider
        data-slot="tooltip-provider"
        delay={delay}
        timeout={timeout}
        {...props}
      />
    </TooltipHoverPolicyContext.Provider>
  );
}

function Tooltip<Payload>({
  delayDuration,
  disableHoverableContent,
  disableHoverablePopup,
  onOpenChange,
  ...props
}: TooltipPrimitive.Root.Props<Payload> & {
  delayDuration?: number;
  disableHoverableContent?: boolean;
}) {
  const hoverPolicy = React.useContext(TooltipHoverPolicyContext);
  const generatedId = React.useId();
  const [contentId, setContentId] = React.useState<string>();
  const [openedByHover, setOpenedByHover] = React.useState(false);
  const { current: dismissHandlers, register } = useOverlayDismiss();
  return (
    <TooltipDismissContext.Provider value={register}>
      <TooltipDescriptionContext.Provider
        value={{
          contentId: contentId ?? generatedId,
          setContentId,
          delayDuration,
          openedByHover,
        }}
      >
        <TooltipPrimitive.Root
          data-slot="tooltip"
          {...props}
          disableHoverablePopup={disableHoverablePopup ?? disableHoverableContent ?? hoverPolicy}
          onOpenChange={(open, details) => {
            if (!open && shouldCancelOverlayDismiss(details, dismissHandlers.current)) {
              details.cancel();
              return;
            }
            onOpenChange?.(open, details);
            if (!details.isCanceled) setOpenedByHover(open && details.reason === "trigger-hover");
          }}
        />
      </TooltipDescriptionContext.Provider>
    </TooltipDismissContext.Provider>
  );
}

// Render through Base UI so its forwarded refs, native state and the child's
// original handlers are retained when adding Radix-compatible DOM attributes.
function TooltipSurface<State extends Record<string, unknown>>({
  tag,
  render,
  state,
  elementProps,
}: {
  tag: "button" | "div";
  render: useRender.RenderProp<State> | undefined;
  state: State;
  elementProps: HTMLProps & { "data-state"?: string; disabled?: boolean };
}) {
  return useRender({ defaultTagName: tag, render, state, props: { ...elementProps } });
}

function TooltipTrigger<Payload>({
  asChild,
  children,
  render,
  delay,
  disabled,
  onFocus,
  ...props
}: OverlayChildProps<TooltipPrimitive.Trigger.Props<Payload>>) {
  const tooltip = React.useContext(TooltipDescriptionContext);
  const child = overlayChild(asChild, children, render);
  return (
    <TooltipPrimitive.Trigger
      data-slot="tooltip-trigger"
      {...props}
      delay={delay ?? tooltip?.delayDuration}
      disabled={disabled}
      onFocus={(event) => {
        onFocus?.(event);
        if (event.defaultPrevented) event.preventBaseUIHandler();
      }}
      render={(elementProps, state) => {
        const description = [
          elementProps["aria-describedby"],
          state.open ? tooltip?.contentId : undefined,
        ]
          .filter(Boolean)
          .join(" ");
        return (
          <TooltipSurface
            tag="button"
            render={child.render}
            state={{ ...state }}
            elementProps={{
              ...elementProps,
              "aria-describedby": description || undefined,
              disabled,
              "data-state": state.open
                ? tooltip?.openedByHover
                  ? "delayed-open"
                  : "instant-open"
                : "closed",
            }}
          />
        );
      }}
    >
      {child.children}
    </TooltipPrimitive.Trigger>
  );
}

type TooltipPositionerProps = TooltipPrimitive.Positioner.Props;
type TooltipContentProps = OverlayChildProps<TooltipPrimitive.Popup.Props> &
  Pick<
    TooltipPositionerProps,
    | "align"
    | "alignOffset"
    | "arrowPadding"
    | "collisionAvoidance"
    | "collisionPadding"
    | "side"
    | "sideOffset"
  > &
  Pick<OverlayDismissHandlers, "onEscapeKeyDown" | "onPointerDownOutside"> & {
    avoidCollisions?: boolean;
    collisionBoundary?:
      | Exclude<TooltipPositionerProps["collisionBoundary"], Element[]>
      | (Element | null)[];
    forceMount?: true;
    hideWhenDetached?: boolean;
    portalContainer?: TooltipPrimitive.Portal.Props["container"];
    sticky?: "partial" | "always" | boolean;
  };

function TooltipContent({
  align = "center",
  alignOffset = 0,
  arrowPadding = 0,
  asChild,
  avoidCollisions = true,
  children,
  className,
  collisionAvoidance,
  collisionBoundary,
  collisionPadding = 0,
  forceMount,
  hideWhenDetached,
  id,
  onEscapeKeyDown,
  onPointerDownOutside,
  portalContainer,
  render,
  side = "top",
  sideOffset = 0,
  sticky = "partial",
  style,
  ...props
}: TooltipContentProps) {
  const tooltip = React.useContext(TooltipDescriptionContext);
  const setContentId = tooltip?.setContentId;
  React.useLayoutEffect(() => {
    if (!id || !setContentId) return;
    setContentId(id);
    return () => setContentId(undefined);
  }, [id, setContentId]);
  useOverlayDismissHandlers(TooltipDismissContext, { onEscapeKeyDown, onPointerDownOutside });
  const reduceAnimations = useMotionPolicy();
  const arrow = React.useRef<HTMLDivElement>(null);
  const child = overlayChild(
    asChild,
    children,
    render,
    <TooltipPrimitive.Arrow
      ref={arrow}
      data-slot="tooltip-arrow"
      className="z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px] bg-foreground fill-foreground data-uncentered:invisible data-[side=bottom]:top-1 data-[side=inline-end]:top-1/2! data-[side=inline-end]:-left-1 data-[side=inline-end]:-translate-y-1/2 data-[side=inline-start]:top-1/2! data-[side=inline-start]:-right-1 data-[side=inline-start]:-translate-y-1/2 data-[side=left]:top-1/2! data-[side=left]:-right-1 data-[side=left]:-translate-y-1/2 data-[side=right]:top-1/2! data-[side=right]:-left-1 data-[side=right]:-translate-y-1/2 data-[side=top]:-bottom-2.5"
    />,
  );
  return (
    <TooltipPrimitive.Portal container={portalContainer} keepMounted={forceMount}>
      <TooltipPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        arrowPadding={arrowPadding}
        collisionAvoidance={
          collisionAvoidance ?? {
            side: avoidCollisions ? "flip" : "none",
            align: avoidCollisions ? "shift" : "none",
            fallbackAxisSide: "none",
          }
        }
        collisionBoundary={
          Array.isArray(collisionBoundary)
            ? collisionBoundary.filter((boundary): boundary is Element => boundary !== null)
            : collisionBoundary
        }
        collisionPadding={collisionPadding}
        positionMethod="fixed"
        side={side}
        sideOffset={(placement) => {
          const offset = typeof sideOffset === "function" ? sideOffset(placement) : sideOffset;
          // Radix adds the measured arrow height to sideOffset. Base does not.
          return offset + (arrow.current?.offsetHeight ?? 0);
        }}
        sticky={sticky === true || sticky === "always"}
        className={hideWhenDetached ? "isolate z-50 data-anchor-hidden:invisible" : "isolate z-50"}
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          id={id ?? tooltip?.contentId}
          role="tooltip"
          {...props}
          className={overlayClassName(
            "z-50 inline-flex w-fit max-w-xs origin-(--transform-origin) items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs text-background has-data-[slot=kbd]:pr-1.5 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 **:data-[slot=kbd]:relative **:data-[slot=kbd]:isolate **:data-[slot=kbd]:z-50 **:data-[slot=kbd]:rounded-sm data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className,
          )}
          style={overlayMotionStyle(style, reduceAnimations)}
          render={(elementProps, state) => (
            <TooltipSurface
              tag="div"
              render={child.render}
              state={{ ...state }}
              elementProps={{
                ...elementProps,
                "data-state": state.open
                  ? tooltip?.openedByHover && !state.instant
                    ? "delayed-open"
                    : "instant-open"
                  : "closed",
              }}
            />
          )}
        >
          {child.children}
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
