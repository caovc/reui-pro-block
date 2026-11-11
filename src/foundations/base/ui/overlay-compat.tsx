import * as React from "react";
import type { BaseUIEvent } from "@base-ui/react/types";
import { mergeMotionStyle } from "@/components/ui/motion-policy";
import { cn } from "@/lib/utils";

export type OverlayChildProps<Props> = Props & { asChild?: boolean };

export function overlayChild<Render>(
  asChild: boolean | undefined,
  children: React.ReactNode,
  render: Render,
  append?: React.ReactNode,
) {
  if (asChild && React.isValidElement<{ children?: React.ReactNode }>(children)) {
    const element = append
      ? React.cloneElement(children, {
          children: (
            <>
              {children.props.children}
              {append}
            </>
          ),
        })
      : children;
    return { render: element, children: undefined };
  }
  return {
    render,
    children: append ? (
      <>
        {children}
        {append}
      </>
    ) : (
      children
    ),
  };
}

export function overlayButton<Render>(
  asChild: boolean | undefined,
  children: React.ReactNode,
  render: Render,
  nativeButton: boolean | undefined,
  append?: React.ReactNode,
) {
  const elementProps = overlayChild(asChild, children, render, append);
  const element = elementProps.render;
  const isIntrinsicElement = React.isValidElement(element) && typeof element.type === "string";
  return {
    ...elementProps,
    nativeButton: nativeButton ?? (isIntrinsicElement ? element.type === "button" : undefined),
  };
}

export function overlayClassName<State>(
  base: string,
  className: string | ((state: State) => string | undefined) | undefined,
) {
  if (typeof className === "function") {
    return (state: State) => cn(base, className(state));
  }
  return cn(base, className);
}

type PointerDownOutsideEvent = CustomEvent<{ originalEvent: PointerEvent }>;
type FocusOutsideEvent = CustomEvent<{ originalEvent: FocusEvent }>;

export interface OverlayDismissHandlers {
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  onPointerDownOutside?: (event: PointerDownOutsideEvent) => void;
  onFocusOutside?: (event: FocusOutsideEvent) => void;
  onInteractOutside?: (event: PointerDownOutsideEvent | FocusOutsideEvent) => void;
}

type RegisterDismissHandlers = (handlers: OverlayDismissHandlers) => () => void;

export function overlayDismissContext() {
  return React.createContext<RegisterDismissHandlers | null>(null);
}

export function useOverlayDismiss() {
  const current = React.useRef<OverlayDismissHandlers>(undefined);
  const register = React.useCallback<RegisterDismissHandlers>((handlers) => {
    current.current = handlers;
    return () => {
      if (current.current === handlers) current.current = undefined;
    };
  }, []);
  return { current, register };
}

export function useOverlayDismissHandlers(
  context: React.Context<RegisterDismissHandlers | null>,
  handlers: OverlayDismissHandlers,
) {
  const register = React.useContext(context);
  React.useLayoutEffect(() => register?.(handlers), [register, handlers]);
}

export function shouldCancelOverlayDismiss(
  details: { reason: string; event: Event },
  handlers: OverlayDismissHandlers | undefined,
) {
  if (!handlers) return false;
  const { reason, event } = details;
  if (reason === "escape-key") {
    handlers.onEscapeKeyDown?.(event as KeyboardEvent);
    return event.defaultPrevented;
  }
  if (reason === "outside-press") {
    const outside = new CustomEvent("dismissableLayer.pointerDownOutside", {
      cancelable: true,
      detail: { originalEvent: event as PointerEvent },
    });
    handlers.onPointerDownOutside?.(outside);
    handlers.onInteractOutside?.(outside);
    return outside.defaultPrevented;
  }
  if (reason === "focus-out") {
    const outside = new CustomEvent("dismissableLayer.focusOutside", {
      cancelable: true,
      detail: { originalEvent: event as FocusEvent },
    });
    handlers.onFocusOutside?.(outside);
    handlers.onInteractOutside?.(outside);
    return outside.defaultPrevented;
  }
  return false;
}

type FocusResult = boolean | HTMLElement | null | void;
type FocusTarget<Interaction> =
  | boolean
  | React.RefObject<HTMLElement | null>
  | ((interaction: Interaction) => FocusResult)
  | undefined;

export function resolveOverlayFocus<Interaction>(
  interaction: Interaction,
  callback: ((event: Event) => void) | undefined,
  focus: FocusTarget<Interaction>,
  fallback?: () => FocusResult,
  target?: HTMLElement | null,
): FocusResult {
  if (callback) {
    const event = new Event("focus", { cancelable: true });
    if (target) {
      Object.defineProperties(event, {
        target: { value: target },
        currentTarget: { value: target },
      });
    }
    callback(event);
    if (event.defaultPrevented) return false;
  }
  if (typeof focus === "function") return focus(interaction);
  if (typeof focus === "object") return focus.current;
  return focus ?? fallback?.() ?? true;
}

export function overlayFocus<Interaction>(
  callback: ((event: Event) => void) | undefined,
  focus: FocusTarget<Interaction>,
  target?: React.RefObject<HTMLElement | null>,
): FocusTarget<Interaction> {
  return callback
    ? (interaction) => resolveOverlayFocus(interaction, callback, focus, undefined, target?.current)
    : focus;
}

export function overlayMotionStyle<State>(
  style: React.CSSProperties | ((state: State) => React.CSSProperties | undefined) | undefined,
  reduceAnimations: boolean,
) {
  if (!reduceAnimations) return style;
  return (state: State): React.CSSProperties => {
    const resolvedStyle = typeof style === "function" ? style(state) : style;
    const {
      transitionDelay: _delay,
      transitionDuration: _duration,
      ...animationStyle
    } = mergeMotionStyle(resolvedStyle);
    // Base UI also writes transition: none during its mounting frame.
    return { ...animationStyle, transition: "none" };
  };
}

export function allowOverlayRadioNavigation(event: BaseUIEvent<React.KeyboardEvent>) {
  // Radix RadioGroup tracks arrow presses at the document before selecting on focus.
  if (
    event.key.startsWith("Arrow") &&
    event.target instanceof Element &&
    event.target.closest('[data-radix-collection-item][role="radio"]')
  ) {
    event.preventBaseUIHandler();
  }
}
