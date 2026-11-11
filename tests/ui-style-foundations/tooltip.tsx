import { createRoot } from "react-dom/client";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { MotionPolicyProvider } from "@/components/ui/motion-policy";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { uiFoundation } from "@/lib/ui-foundation";
import "@/index.css";

export function TooltipFixture() {
  return (
    <MotionPolicyProvider value={true}>
      <TooltipProvider delayDuration={300} skipDelayDuration={0}>
        <main className="grid justify-items-start gap-4 p-28" data-library={uiFoundation.primitive}>
          <button type="button">Before tooltip</button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button>Shortcut help</Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              Save changes <Kbd>⌘S</Kbd>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button>Custom help</Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="rounded-2xl px-4 **:data-[slot=kbd]:rounded-xl">
              Custom shortcut <Kbd className="h-8 min-w-8 px-2 text-sm">⌘K</Kbd>
            </TooltipContent>
          </Tooltip>
          <Kbd data-testid="standalone-key">⌘P</Kbd>
        </main>
      </TooltipProvider>
    </MotionPolicyProvider>
  );
}

createRoot(document.getElementById("root")!).render(<TooltipFixture />);
