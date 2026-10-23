// Actual official free REUI c-dropdown-menu-11 body, adapted to the public Navbar4 Popover feed.
// MIT (c) Keenthemes. https://reui.io/r/radix-nova/c-dropdown-menu-11.json
// Avatar/action/target/time/unread row composition retained. Dropdown root/rows become
// official Popover/Item so the added action buttons remain semantically interactive.
// Public metadata requires19 rich items; fixtures, progress/review and local read/actions extend free3.
import { useState } from "react";
import { Bell, Check } from "lucide-react";
import { Badge } from "@/components/reui/badge";
import { Rating } from "@/components/reui/rating";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Item } from "@/components/ui/item";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { demoAvatar } from "@/lib/demo-artwork";
import { notifications } from "./data";
import { NotificationProgress } from "./free/notification-progress";

export default function NotificationsFeed() {
  const [read, setRead] = useState(() =>
    notifications.filter((item) => !item.unread).map((item) => item.id),
  );
  const [invitation, setInvitation] = useState<string | null>(null);
  const unread = notifications.filter((item) => !read.includes(item.id)).length;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="relative"
          aria-label={`Notifications, ${unread} unread`}
        >
          <Bell />
          {unread > 0 && (
            <Badge
              variant="destructive"
              size="sm"
              className="absolute -right-1 -top-1 rounded-full px-1"
              aria-hidden="true"
            >
              {unread}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="toolbar-notifications p-0" aria-label="Notifications">
        <div className="flex items-center justify-between gap-2 p-3">
          <h2 className="text-sm font-semibold">
            Notifications <span className="text-muted-foreground">19</span>
          </h2>
          <Button
            variant="ghost"
            size="sm"
            disabled={!unread}
            onClick={() => setRead(notifications.map((item) => item.id))}
          >
            <Check data-icon="inline-start" />
            Mark all as read
          </Button>
        </div>
        <Separator />
        <ScrollArea className="h-[min(440px,65vh)]">
          <div role="list" aria-label="Notification feed" className="flex flex-col">
            {notifications.map((notification) => (
              <Item
                key={notification.id}
                role="listitem"
                data-notification={notification.id}
                className="items-start gap-2 rounded-none border-b px-3 py-3"
              >
                <Avatar className="mt-0.5 size-7 shrink-0">
                  <AvatarImage src={demoAvatar(notification.user)} alt={notification.user} />
                  <AvatarFallback>
                    {notification.user
                      .split(" ")
                      .map((part) => part[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <p className="text-sm leading-snug">
                    <span className="font-medium">{notification.user}</span>{" "}
                    <span className="text-muted-foreground">{notification.action}</span>{" "}
                    <span className="font-medium">{notification.target}</span>
                  </p>
                  <span className="text-xs text-muted-foreground">{notification.time}</span>
                  {notification.kind === "invite" &&
                    (invitation ? (
                      <span role="status" className="text-xs text-muted-foreground">
                        {invitation} locally; no remote membership changed.
                      </span>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            setInvitation("Accepted");
                            setRead((current) => [...new Set([...current, notification.id])]);
                          }}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setInvitation("Declined");
                            setRead((current) => [...new Set([...current, notification.id])]);
                          }}
                        >
                          Decline
                        </Button>
                      </div>
                    ))}
                  {notification.kind === "progress" && <NotificationProgress value={65} />}
                  {notification.kind === "rating" && (
                    <Rating rating={4} size="sm" aria-label="Four out of five stars" />
                  )}
                </div>
                {!read.includes(notification.id) && (
                  <span
                    aria-label="Unread"
                    className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
                  />
                )}
              </Item>
            ))}
          </div>
        </ScrollArea>
        <Separator />
        <p className="px-3 py-2 text-xs text-muted-foreground">
          Sample workspace activity. Read state is local.
        </p>
      </PopoverContent>
    </Popover>
  );
}
