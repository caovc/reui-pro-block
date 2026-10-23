import type { ReactNode } from "react";
import { Check, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert";
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import { IconTile } from "@/components/reui/icon-tile";
import { Button } from "@/components/ui/button";
import { DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function DialogLauncher({
  id,
  title,
  description,
  icon,
  action,
  children,
  result,
}: {
  id: number;
  title: string;
  description: string;
  icon: ReactNode;
  action: string;
  children: ReactNode;
  result?: ReactNode;
}) {
  return (
    <section className="refined-dialog-stage" data-dialog-variant={id}>
      <Frame className="refined-dialog-launcher">
        <FrameHeader className="flex-row items-center gap-3">
          <IconTile variant="frame">{icon}</IconTile>
          <div className="min-w-0">
            <FrameTitle>{title}</FrameTitle>
            <FrameDescription>{description}</FrameDescription>
          </div>
        </FrameHeader>
        <FramePanel>{children}</FramePanel>
        <FrameFooter>
          <DialogTrigger asChild>
            <Button className="w-full">{action}</Button>
          </DialogTrigger>
        </FrameFooter>
      </Frame>
      {result && (
        <Alert variant="success" className="refined-dialog-result">
          <Check />
          <AlertTitle>Saved in this preview</AlertTitle>
          <AlertDescription>{result}</AlertDescription>
        </Alert>
      )}
    </section>
  );
}

export function FooterHelp({ label, children }: { label: string; children: ReactNode }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" className="refined-dialog-help" type="button">
            <Info data-icon="inline-start" />
            {label}
          </Button>
        </TooltipTrigger>
        <TooltipContent className="max-w-64">{children}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
