// Actual official free REUI c-dropdown-menu-11 row composition, MIT (c) Keenthemes.
// https://reui.io/r/radix-nova/c-dropdown-menu-11.json
// Popover/Item wrappers allow public Navbar8's rich interactive feed. Actual free
// c-avatar-10 groups, installed ReUI Rating, and c-progress-2 slim bar are composed below.
// Fixed frozen admin feed has no data slots, so this scoped AI fixture consumer stays separate.
import { useState } from "react";
import { Bell, Check } from "lucide-react";
import { Badge } from "@/components/reui/badge";
import { Rating } from "@/components/reui/rating";
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Item } from "@/components/ui/item";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { demoAvatar } from "@/lib/demo-artwork";

export function AgentNotifications() {
  const [read, setRead] = useState(false);
  const [review, setReview] = useState<string | null>(null);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Agent notifications, ${read ? 0 : 4} unread`}
          className="relative"
        >
          <Bell />
          {!read && (
            <Badge
              variant="destructive"
              size="sm"
              className="absolute -right-1 -top-1 rounded-full px-1"
            >
              4
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="publishing-notifications p-0"
        aria-label="Agent notifications"
      >
        <div className="flex items-center justify-between gap-2 p-3">
          <h2 className="text-sm font-semibold">Notifications</h2>
          <Button variant="ghost" size="sm" disabled={read} onClick={() => setRead(true)}>
            <Check data-icon="inline-start" />
            Mark all as read
          </Button>
        </div>
        <Separator />
        <ScrollArea className="h-[min(440px,65vh)]">
          <div className="flex flex-col gap-0" role="list" aria-label="Agent activity">
            <Item role="listitem" className="items-start gap-3 rounded-none border-b p-3">
              <Avatar size="sm">
                <AvatarImage src={demoAvatar("Maya Stone")} alt="Maya Stone" />
                <AvatarFallback>MS</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <p className="text-sm">
                  <strong>Maya Stone</strong> shared Code Reviewer with your team.
                </p>
                <span className="text-xs text-muted-foreground">2 min ago</span>
                <AvatarGroup aria-label="Three agent collaborators">
                  {["Maya Stone", "Leo Grant", "Nora Chen"].map((name) => (
                    <Avatar size="sm" key={name}>
                      <AvatarImage src={demoAvatar(name)} alt={name} />
                      <AvatarFallback>
                        {name
                          .split(" ")
                          .map((part) => part[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </AvatarGroup>
              </div>
            </Item>
            <Item role="listitem" className="items-start gap-3 rounded-none border-b p-3">
              <Avatar size="sm">
                <AvatarImage src={demoAvatar("Leo Grant")} alt="Leo Grant" />
                <AvatarFallback>LG</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <p className="text-sm">
                  <strong>Research Brief</strong> is ready for a local review.
                </p>
                {review ? (
                  <p role="status" className="text-xs text-muted-foreground">
                    {review} locally. No agent permissions changed.
                  </p>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => setReview("Approved")}>
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setReview("Dismissed");
                      }}
                    >
                      Dismiss
                    </Button>
                  </div>
                )}
                <span className="text-xs text-muted-foreground">8 min ago</span>
              </div>
            </Item>
            <Item role="listitem" className="rounded-none border-b p-3">
              <div className="flex w-full flex-col gap-2">
                <p className="text-sm font-medium">Dataset Assistant is indexing sample data</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Local sample progress</span>
                  <span className="text-xs text-muted-foreground">72%</span>
                </div>
                <Progress value={72} className="h-1" aria-label="Agent indexing progress" />
              </div>
            </Item>
            <Item role="listitem" className="rounded-none p-3">
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">Code Reviewer received a new rating</p>
                <Rating rating={4.5} size="sm" aria-label="Four and a half out of five stars" />
                <span className="text-xs text-muted-foreground">
                  Original fictional activity only
                </span>
              </div>
            </Item>
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
