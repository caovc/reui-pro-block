import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area";
import { cn } from "@/lib/utils";
import { createContext, useContext } from "react";

type ScrollbarVisibility = "auto" | "always" | "scroll" | "hover";
const ScrollbarVisibilityContext = createContext<ScrollbarVisibility>("hover");

function ScrollArea({
  className,
  children,
  type = "hover",
  ...props
}: ScrollAreaPrimitive.Root.Props & { type?: ScrollbarVisibility }) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn("relative", className)}
      {...props}
    >
      <ScrollbarVisibilityContext.Provider value={type}>
        <ScrollAreaPrimitive.Viewport
          data-slot="scroll-area-viewport"
          className="size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1"
        >
          <ScrollAreaPrimitive.Content>{children}</ScrollAreaPrimitive.Content>
        </ScrollAreaPrimitive.Viewport>
        <ScrollBar />
        <ScrollAreaPrimitive.Corner />
      </ScrollbarVisibilityContext.Provider>
    </ScrollAreaPrimitive.Root>
  );
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: ScrollAreaPrimitive.Scrollbar.Props) {
  const visibility = useContext(ScrollbarVisibilityContext);
  return (
    <ScrollAreaPrimitive.Scrollbar
      data-slot="scroll-area-scrollbar"
      data-orientation={orientation}
      orientation={orientation}
      keepMounted={visibility === "always"}
      className={cn(
        "flex touch-none p-px transition-colors select-none data-horizontal:h-2.5 data-horizontal:flex-col data-horizontal:border-t data-horizontal:border-t-transparent data-vertical:h-full data-vertical:w-2.5 data-vertical:border-l data-vertical:border-l-transparent",
        visibility === "hover" && "opacity-0 data-hovering:opacity-100 data-scrolling:opacity-100",
        visibility === "scroll" && "opacity-0 data-scrolling:opacity-100",
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb
        data-slot="scroll-area-thumb"
        className="relative flex-1 rounded-full bg-border"
      />
    </ScrollAreaPrimitive.Scrollbar>
  );
}

export { ScrollArea, ScrollBar };
