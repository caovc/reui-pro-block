import { cn } from "@/lib/utils";
import { Progress as ProgressPrimitive } from "@base-ui/react/progress";

function Progress({
  className,
  value = null,
  ...props
}: Omit<ProgressPrimitive.Root.Props, "value"> & { value?: number | null }) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={value}
      className={cn(
        "relative flex h-1 w-full items-center overflow-x-hidden rounded-full bg-muted",
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="h-full bg-primary transition-all"
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
