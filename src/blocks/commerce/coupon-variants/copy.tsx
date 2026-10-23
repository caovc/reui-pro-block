/** Actual official c-button-41 copy-feedback composition, consuming the existing
 * official free hook unchanged (MIT, Keenthemes). No duplicate hook is created.
 * https://reui.io/r/radix-nova/c-button-41.json
 */
import { useState } from "react";
import { Check, TicketPercent } from "lucide-react";
import { useCopyToClipboard } from "@/blocks/application/empty-variants/team-setup/free/use-copy-to-clipboard";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";

export function CouponCopyButton({
  code,
  label = "Copy",
  light = false,
  codeId,
}: {
  code: string;
  label?: string;
  light?: boolean;
  codeId?: string;
}) {
  const [attempted, setAttempted] = useState(false);
  const { isCopied, copyToClipboard } = useCopyToClipboard({
    timeout: 2000,
    onCopy: () => setAttempted(false),
  });
  return (
    <Popover open={attempted && !isCopied} onOpenChange={setAttempted}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant={light ? "secondary" : "default"}
          aria-label={isCopied ? `Copied ${code}` : `Copy code ${code}`}
          onClick={() => {
            if (typeof navigator.clipboard?.writeText === "function") {
              copyToClipboard(code);
            } else if (codeId) {
              const element = document.getElementById(codeId);
              if (element) {
                const range = document.createRange();
                range.selectNodeContents(element);
                const selection = window.getSelection();
                selection?.removeAllRanges();
                selection?.addRange(range);
              }
            }
          }}
        >
          {label === "Copy" &&
            (isCopied ? (
              <Check data-icon="inline-start" />
            ) : (
              <TicketPercent data-icon="inline-start" />
            ))}
          <span aria-live="polite">{isCopied ? "Copied" : label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="max-w-64 px-3 py-2"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <PopoverHeader>
          <PopoverTitle>Copy this offer</PopoverTitle>
          <PopoverDescription>
            Select the displayed code and copy it manually if clipboard access is blocked.
          </PopoverDescription>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  );
}
