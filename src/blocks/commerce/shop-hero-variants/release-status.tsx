import { Badge } from "@/components/reui/badge";
import { cn } from "@/lib/utils";
import type { ReleasePhase } from "./release-data";

const variants = {
  live: "success-light",
  new: "info-light",
  limited: "warning-light",
  upcoming: "focus-light",
} as const;
const dotColors = {
  live: "text-emerald-400",
  new: "text-sky-400",
  limited: "text-amber-400",
  upcoming: "text-violet-400",
};

/** Actual official free c-badge-22 status-dot composition. MIT, Keenthemes.
 * https://reui.io/r/radix-nova/c-badge-22.json
 */
export function ReleaseStatus({
  phase,
  label,
  onImage = false,
  ping = false,
}: {
  phase: ReleasePhase;
  label: string;
  onImage?: boolean;
  ping?: boolean;
}) {
  return (
    <Badge
      variant={variants[phase]}
      radius="full"
      className={cn(onImage && "border-white/20 bg-black/55 text-white backdrop-blur-sm")}
    >
      <span
        aria-hidden
        className={cn(
          "ms-0.25 size-1.25 rounded-full! bg-[currentColor]",
          onImage && dotColors[phase],
          ping &&
            "relative after:absolute after:inset-0 after:animate-ping after:rounded-full after:bg-current motion-reduce:after:animate-none",
        )}
      />
      {label}
    </Badge>
  );
}
