// Actual official free REUI c-progress-2. MIT (c) Keenthemes.
// https://reui.io/r/radix-nova/c-progress-2.json
// Label/value lifted, layout gap replaces upstream space-y per project style.
import { Progress } from "@/components/ui/progress";
export function NotificationProgress({ value }: { value: number }) {
  return (
    <div className="mx-auto flex w-full max-w-xs flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Release assets</span>
        <span className="text-sm text-muted-foreground">{value}%</span>
      </div>
      <Progress value={value} className="h-1" aria-label="Release assets upload" />
    </div>
  );
}
