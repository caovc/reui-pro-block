import { useEffect, useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function ComparisonTip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
export function ComparisonCopy({
  text,
  label = "Copy answer",
  compact = true,
}: {
  text: string;
  label?: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(timer);
  }, [copied]);
  return (
    <ComparisonTip label={copied ? "Copied" : label}>
      <Button
        type="button"
        variant="ghost"
        size={compact ? "icon-xs" : "sm"}
        className={compact ? "comparison-icon" : "comparison-copy-transcript"}
        disabled={!text}
        aria-label={copied ? `${label} copied` : label}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
          } catch {
            toast.error("Clipboard unavailable");
          }
        }}
      >
        {copied ? <Check /> : <Copy />}
        {!compact && "Copy"}
      </Button>
    </ComparisonTip>
  );
}
