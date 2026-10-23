// Actual official free REUI c-dropdown-menu-16. MIT (c) Keenthemes.
// https://reui.io/r/radix-nova/c-dropdown-menu-16.json
// Upstream source SHA256: efe8d1a3c33efa35b519f802c8f0e3117fd3cfa89d9d549fe29ed060a52cbbbf
// Only icon adapter, trigger dimensions/alignment and local handlers changed.
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Ellipsis, Settings, Share2, Trash } from "lucide-react";

const icons = {
  more: <Ellipsis aria-hidden="true" />,
  settings: <Settings aria-hidden="true" />,
  share: <Share2 aria-hidden="true" />,
  trash: <Trash aria-hidden="true" />,
};

export function WorkspaceActions({ onAction }: { onAction: (action: string) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="-me-1.5"
          aria-label="More workspace actions"
        >
          {icons.more}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={() => onAction("Settings")}>
            {icons.settings}
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onAction("Share")}>
            {icons.share}
            Share
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => onAction("Remove requested")}>
            {icons.trash}
            Remove
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
