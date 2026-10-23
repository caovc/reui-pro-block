// Actual whole official free REUI c-button-group-52. MIT (c) Keenthemes.
// https://reui.io/r/radix-nova/c-button-group-52.json
// Upstream source SHA256: c1c0f9712b5fa5d9bb1b4da017c2ea84410a479d451ffd8eb8fd5ad5ceec7c3d
// Mechanical Lucide mapping, existing local callback/refresh bindings, aria labels and retained Embed extension.
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
import { FileText, Image, MoreHorizontal, Pencil, RefreshCw, Share2, Code } from "lucide-react";

const icons = {
  refresh: (
    <RefreshCw aria-hidden="true" className="group-data-[refreshing=true]/refresh:animate-spin" />
  ),
  share: <Share2 aria-hidden="true" />,
  more: <MoreHorizontal aria-hidden="true" />,
  pencil: <Pencil aria-hidden="true" />,
  fileText: <FileText aria-hidden="true" />,
  image: <Image aria-hidden="true" />,
};

export function DashboardActions({
  refreshing,
  onRefresh,
  onShare,
  onAction,
}: {
  refreshing: boolean;
  onRefresh: () => void;
  onShare: () => void;
  onAction: (action: string) => void;
}) {
  return (
    <ButtonGroup aria-label="Dashboard actions" data-free-example="c-button-group-52">
      <Button
        variant="outline"
        size="sm"
        aria-label="Refresh dashboard"
        className="group/refresh"
        data-refreshing={refreshing}
        disabled={refreshing}
        onClick={onRefresh}
      >
        {icons.refresh}
      </Button>
      <Button variant="outline" size="sm" onClick={onShare}>
        {icons.share}
        Share
      </Button>
      <ButtonGroupSeparator />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" aria-label="Dashboard options">
            {icons.more}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44" sideOffset={9}>
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => onAction("edit")}>
              {icons.pencil}
              Edit dashboard
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onAction("csv")}>
              {icons.fileText}
              Export CSV
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAction("png")}>
              {icons.image}
              Export PNG
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onAction("embed")}>
              <Code aria-hidden="true" />
              Embed
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  );
}
