// Actual official free REUI c-button-group-53. MIT (c) Keenthemes.
// https://reui.io/r/radix-nova/c-button-group-53.json
// Upstream source SHA256: ec661d71fe2b0452db0de4c03e1042a0b4aaa3f625ccf9c47eed9ae2843e6c60
// Local adaptations recorded in docs/navbar7-9-implementation.md.
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupSeparator } from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Archive,
  Calendar,
  ChevronDown,
  Copy,
  Eye,
  File,
  History,
  MoreHorizontal,
  Send,
  Trash,
} from "lucide-react";

import { demoAvatar } from "@/lib/demo-artwork";
const viewers = [
  { name: "Maya Stone", initials: "MS", src: demoAvatar("Maya Stone") },
  { name: "Leo Grant", initials: "LG", src: demoAvatar("Leo Grant") },
  { name: "Nora Chen", initials: "NC", src: demoAvatar("Nora Chen") },
];
export function PublishControls({
  onAction,
  disabled = false,
}: {
  onAction: (action: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="cms-publish-controls flex shrink-0 items-center gap-2">
      <AvatarGroup aria-label="Three sample viewers">
        {viewers.map((viewer) => (
          <Avatar key={viewer.name} size="sm">
            <AvatarImage src={viewer.src} alt={viewer.name} />
            <AvatarFallback>{viewer.initials}</AvatarFallback>
          </Avatar>
        ))}
      </AvatarGroup>

      <Separator orientation="vertical" className="my-auto h-4" />

      <Button
        variant="outline"
        size="sm"
        aria-label="Preview post"
        onClick={() => onAction("preview")}
      >
        <Eye aria-hidden="true" />
        <span className="hidden md:block">Preview</span>
      </Button>

      <ButtonGroup className="**:data-[slot=button]:border-r-0">
        <Button size="sm" disabled={disabled} onClick={() => onAction("publish")}>
          <Send aria-hidden="true" />
          Publish
        </Button>

        <ButtonGroupSeparator className="bg-primary/72" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon-sm"
              className="border-primary-foreground/20 rounded-l-none border-l"
              aria-label="More publish options"
              disabled={disabled}
            >
              <ChevronDown aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent sideOffset={8} align="end" className="w-48">
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={() => onAction("schedule")}>
                <Calendar aria-hidden="true" />
                Schedule for later
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onAction("draft")}>
                <File aria-hidden="true" />
                Save as draft
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </ButtonGroup>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="More actions">
            <MoreHorizontal aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent sideOffset={8} align="end" className="w-40">
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => onAction("duplicate")}>
              <Copy aria-hidden="true" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAction("history")}>
              <History aria-hidden="true" />
              View history
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAction("archive")}>
              <Archive aria-hidden="true" />
              Archive
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => onAction("delete")}>
              <Trash aria-hidden="true" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
