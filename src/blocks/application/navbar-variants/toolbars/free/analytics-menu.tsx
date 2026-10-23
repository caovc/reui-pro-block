// Actual official free REUI c-dropdown-menu-13. MIT (c) Keenthemes.
// https://reui.io/r/radix-nova/c-dropdown-menu-13.json
// Upstream source SHA256: 62f962f9e1b2d1cec5b6e35982d551723745ddbaeae41de4a26ed6392304b487
// Controlled data/icon/handler adaptations recorded in docs/navbar4-6-implementation.md.
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Ellipsis, FileText, FileSpreadsheet, Image, Code } from "lucide-react";

export function AnalyticsMenu({ onAction }: { onAction: (action: string) => void }) {
  return (
    <div className="flex items-center justify-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Dashboard options">
            <Ellipsis aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48" align="start">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Dashboard</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => onAction("edit")}>
              <FileText />
              Edit dashboard
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel>Export as</DropdownMenuLabel>

            <DropdownMenuItem onSelect={() => onAction("csv")}>
              <FileSpreadsheet aria-hidden="true" />
              Export CSV
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAction("png")}>
              <Image aria-hidden="true" />
              Export PNG
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => onAction("embed")}>
            <Code aria-hidden="true" />
            Embed
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
