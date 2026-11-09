import * as React from "react";
import { useRender } from "@base-ui/react/use-render";

type RenderSlotProps = Record<string, unknown> & {
  asChild?: boolean;
  children?: React.ReactNode;
  defaultTagName?: keyof React.JSX.IntrinsicElements;
  render?: React.ReactElement;
};

function Root({
  asChild = false,
  children,
  defaultTagName = "span",
  render,
  ...props
}: RenderSlotProps) {
  const element = render ?? (asChild && React.isValidElement(children) ? children : undefined);
  return useRender({
    render: element,
    props: render || !asChild ? { ...props, children } : props,
    defaultTagName,
  });
}

export const RenderSlot = { Root };
