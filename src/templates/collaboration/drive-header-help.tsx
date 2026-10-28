// Actual free ReUI c-sheet-1 composition: Sheet/Trigger/Content/Header/Footer/Close.
// MIT (c) Keenthemes. https://reui.io/r/radix-nova/c-sheet-1.json
// Consumer content extends that implementation with guide links and local search.
import { useRef, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Building2,
  CircleHelp,
  Clock,
  HardDrive,
  LifeBuoy,
  Search,
  Share2,
  Star,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { Badge } from "@/components/reui/badge";
import { IconTile } from "@/components/reui/icon-tile";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { driveHelpGuides, type DriveHeaderNavigation } from "./drive-header-data";
import "./drive-header.css";

const guideIcons = {
  upload: Upload,
  share: Share2,
  star: Star,
  trash: Trash2,
  history: Clock,
  storage: HardDrive,
  people: Users,
  workspace: Building2,
};

export function DriveHeaderHelp({
  navigation,
  documentationHref = "https://github.com/caovc/reui-pro-block#readme",
  supportHref = "https://github.com/caovc/reui-pro-block/issues",
}: {
  navigation: DriveHeaderNavigation;
  documentationHref?: string;
  supportHref?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const search = useRef<HTMLInputElement>(null);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visible = driveHelpGuides.filter((guide) =>
    `${guide.title} ${guide.description}`.toLocaleLowerCase().includes(normalizedQuery),
  );
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Help">
          <CircleHelp />
        </Button>
      </SheetTrigger>
      <SheetContent
        className="reui-reference drive-header-sheet"
        showCloseButton={false}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          search.current?.focus();
        }}
      >
        <SheetHeader className="drive-header-sheet-heading drive-help-heading">
          <div className="drive-help-title-row">
            <div>
              <SheetTitle>Help</SheetTitle>
              <SheetDescription className="sr-only">
                Find a guide to files, sharing, and your workspace.
              </SheetDescription>
            </div>
            <SheetClose asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Dismiss help">
                <X />
              </Button>
            </SheetClose>
          </div>
          <div className="drive-help-search">
            <InputGroup>
              <InputGroupAddon>
                <Search aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput
                ref={search}
                aria-label="Search help"
                placeholder="Search help"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </InputGroup>
          </div>
        </SheetHeader>
        <ScrollArea className="drive-header-sheet-scroll">
          <nav aria-label="Help guides" className="drive-help-guides">
            {(["Working with files", "Getting work back", "Workspace"] as const).map((group) => {
              const guides = visible.filter((guide) => guide.group === group);
              if (!guides.length) return null;
              return (
                <section key={group} aria-label={group}>
                  <h3>{group}</h3>
                  <ItemGroup className="drive-help-group">
                    {guides.map((guide) => {
                      const Icon = guideIcons[guide.icon];
                      return (
                        <div key={guide.id} role="listitem">
                          <Item
                            asChild
                            variant="outline"
                            className="drive-help-guide hover:bg-muted/30"
                          >
                            <a
                              href={navigation.href(guide.target)}
                              onClick={(event) => {
                                if (
                                  event.button !== 0 ||
                                  event.metaKey ||
                                  event.ctrlKey ||
                                  event.shiftKey ||
                                  event.altKey
                                )
                                  return;
                                event.preventDefault();
                                setOpen(false);
                                navigation.onNavigate(guide.target);
                              }}
                            >
                              <ItemMedia>
                                <IconTile size="sm" variant="outline">
                                  <Icon />
                                </IconTile>
                              </ItemMedia>
                              <ItemContent>
                                <ItemTitle>
                                  {guide.title}
                                  {guide.badge && (
                                    <Badge size="sm" variant="secondary">
                                      {guide.badge}
                                    </Badge>
                                  )}
                                </ItemTitle>
                                <ItemDescription>{guide.description}</ItemDescription>
                              </ItemContent>
                            </a>
                          </Item>
                        </div>
                      );
                    })}
                  </ItemGroup>
                </section>
              );
            })}
            {!visible.length && (
              <div role="status" className="drive-help-empty">
                <Search aria-hidden="true" />
                <p>No guides found</p>
                <span>Try a different word or clear your search.</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQuery("");
                    search.current?.focus();
                  }}
                >
                  Clear search
                </Button>
              </div>
            )}
          </nav>
        </ScrollArea>
        <SheetFooter className="drive-help-footer">
          <ItemGroup role="group" aria-label="Help resources" className="drive-help-resources">
            <Button asChild variant="ghost">
              <a href={documentationHref} target="_blank" rel="noreferrer">
                <BookOpen aria-hidden="true" />
                Documentation <ArrowUpRight />
              </a>
            </Button>
            <Button asChild variant="ghost">
              <a href={supportHref} target="_blank" rel="noreferrer">
                <LifeBuoy aria-hidden="true" />
                Support on GitHub <ArrowUpRight />
              </a>
            </Button>
          </ItemGroup>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
