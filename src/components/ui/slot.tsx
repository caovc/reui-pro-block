"use client";

import { useRender } from "@base-ui/react/use-render";
import {
  Children,
  cloneElement,
  isValidElement,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
} from "react";

type SlottableProps = { children?: ReactNode };

type SlotProps = HTMLAttributes<HTMLElement> & { ref?: Ref<HTMLElement> };

function Slottable({ children }: SlottableProps) {
  return children;
}

// ReUI's Base UI registry uses useRender to merge props and refs into a consumer element.
// These shared composites also accept asChild and can place an announcer inside that element.
function Slot({ children, className, ref, ...props }: SlotProps) {
  const siblings = Children.toArray(children);
  const slottable = siblings.find(
    (child) => isValidElement<SlottableProps>(child) && child.type === Slottable,
  );
  const child = isValidElement<SlottableProps>(slottable) ? slottable.props.children : children;
  const element = isValidElement<Pick<SlotProps, "children" | "className">>(child)
    ? child
    : undefined;

  if (!element && Children.count(child) > 1) {
    throw new Error("Slot expects a single element.");
  }

  // Keep the child class last for callers that merge Tailwind utilities.
  const render =
    element &&
    cloneElement(element, {
      className: [className, element.props.className].filter(Boolean).join(" ") || undefined,
      children: slottable
        ? Children.toArray(
            siblings.map((sibling) => (sibling === slottable ? element.props.children : sibling)),
          )
        : element.props.children,
    });

  return useRender({ render, ref, props, enabled: render !== undefined });
}

export { Slot, Slottable };
