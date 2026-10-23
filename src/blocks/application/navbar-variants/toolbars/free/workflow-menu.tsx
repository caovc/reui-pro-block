// Actual official free REUI c-dropdown-menu-12. MIT (c) Keenthemes.
// https://reui.io/r/radix-nova/c-dropdown-menu-12.json
// Upstream source SHA256: d27d51532640ee2360089b277a139ccc19f0ebe140ce6625962d355f7167290b
// Controlled data/icon/handler adaptations recorded in docs/navbar4-6-implementation.md.
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Copy, EllipsisVertical, FileJson, Share2, Trash } from "lucide-react";

export function WorkflowMenu({ onAction }: { onAction: (action: string) => void }) {
  return (
    <div className="flex items-center justify-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Workflow options">
            <EllipsisVertical aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48" align="end">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => onAction("export")}>
              <FileJson aria-hidden="true" />
              Export JSON
              <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAction("duplicate")}>
              <Copy aria-hidden="true" />
              Duplicate
              <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => onAction("share")}>
              <Share2 aria-hidden="true" />
              Share
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => onAction("delete")}>
            <Trash aria-hidden="true" />
            Delete workflow
            <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
