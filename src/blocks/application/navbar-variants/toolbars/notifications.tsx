// Actual official free REUI c-dropdown-menu-11 body, adapted to the public Navbar4 Popover feed.
// MIT (c) Keenthemes. https://reui.io/r/radix-nova/c-dropdown-menu-11.json
// Avatar/action/target/time/unread row composition retained. Dropdown root/rows become
// official Popover/Item so the added action buttons remain semantically interactive.
// Public metadata requires19 rich items; fixtures, progress/review and local read/actions extend free3.
// Optional Tempo composition shares this feed and model. Additional domain actions
// are local preview state, not remote approvals, membership or downloads.
import { Fragment } from "react";
import {
  Bell,
  CalendarDays,
  Check,
  CheckCheck,
  CircleCheck,
  Clock3,
  Code2,
  CreditCard,
  Download,
  Gauge,
  MessageCircle,
  Paperclip,
  Plug,
  ShieldCheck,
  Sparkles,
  ThumbsUp,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { Badge } from "@/components/reui/badge";
import { Rating } from "@/components/reui/rating";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Item } from "@/components/ui/item";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { demoAvatar } from "@/lib/demo-artwork";
import { cn } from "@/lib/utils";
import { notifications, type Notification } from "./data";
import { NotificationProgress } from "./free/notification-progress";
import { useNotificationsFeedModel, type NotificationsFeedModel } from "./notification-feed-model";

const notificationIcons = {
  approval: CircleCheck,
  task: CircleCheck,
  people: Users,
  reaction: ThumbsUp,
  calendar: CalendarDays,
  integration: Plug,
  billing: CreditCard,
  security: ShieldCheck,
  sparkles: Sparkles,
  comment: MessageCircle,
  deployment: Code2,
  usage: Gauge,
  maintenance: Wrench,
} as const;

type NotificationAction = "Approve" | "Review" | "Join" | "Decline" | "Rate" | "Later";
export type NotificationFilter = "all" | "unread";

export type NotificationsFeedItem = Notification & {
  title?: string;
  description?: string;
  icon?: keyof typeof notificationIcons;
  avatarNames?: readonly string[];
  attachment?: { name: string; size: string };
  metadata?: { label: string; value: string };
  event?: { date: string; time: string };
  actions?: readonly NotificationAction[];
  tag?: string;
  reaction?: string;
  progressValue?: number;
};

export type { NotificationsFeedModel } from "./notification-feed-model";

export type NotificationsFeedProps = {
  variant?: "tempo";
  items?: readonly NotificationsFeedItem[];
  triggerClassName?: string;
  collisionBoundary?: HTMLElement | null;
  model?: NotificationsFeedModel;
};

export default function NotificationsFeed({
  variant,
  items = notifications,
  triggerClassName,
  collisionBoundary,
  model: controlledModel,
}: NotificationsFeedProps = {}) {
  const ownModel = useNotificationsFeedModel(items);
  const model = controlledModel ?? ownModel;
  const tempo = variant === "tempo";
  const read = model.readIds;
  const invitation = model.invitation;
  const activeItems = tempo ? items.filter((item) => !model.dismissedIds.includes(item.id)) : items;
  const unread = activeItems.filter((item) => !read.includes(item.id)).length;
  const visibleItems =
    tempo && model.filter === "unread"
      ? activeItems.filter((item) => !read.includes(item.id))
      : activeItems;

  const feed = (
    <ScrollArea className={tempo ? "tempo-notifications-scroll" : "h-[min(440px,65vh)]"}>
      <div role="list" aria-label="Notification feed" className="flex flex-col">
        {visibleItems.map((notification, index) => {
          const isRead = read.includes(notification.id);
          const Icon = notification.icon ? notificationIcons[notification.icon] : undefined;
          const title = notification.title ?? notification.action;
          const actionResult = model.actionResults[notification.id];

          return (
            <Fragment key={notification.id}>
              <Item
                role="listitem"
                data-notification={notification.id}
                data-unread={tempo ? !isRead : undefined}
                className={
                  tempo
                    ? "tempo-notification-item"
                    : "items-start gap-2 rounded-none border-b px-3 py-3"
                }
              >
                {tempo && Icon ? (
                  <span className="tempo-notification-icon" data-kind={notification.icon}>
                    <Icon aria-hidden="true" />
                  </span>
                ) : (
                  <Avatar
                    className={tempo ? "tempo-notification-avatar" : "mt-0.5 size-7 shrink-0"}
                  >
                    <AvatarImage src={demoAvatar(notification.user)} alt={notification.user} />
                    <AvatarFallback>
                      {notification.user
                        .split(" ")
                        .map((part) => part[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={
                    tempo ? "tempo-notification-body" : "flex min-w-0 flex-1 flex-col gap-2"
                  }
                >
                  {tempo ? (
                    <>
                      <p className="tempo-notification-title">
                        {!isRead && <span className="sr-only">Unread. </span>}
                        {title}
                        {notification.tag && (
                          <Badge variant="secondary" size="sm">
                            {notification.tag}
                          </Badge>
                        )}
                      </p>
                      {notification.reaction && (
                        <span className="tempo-notification-reaction">{notification.reaction}</span>
                      )}
                      {notification.description && (
                        <p className="tempo-notification-description">{notification.description}</p>
                      )}
                      {notification.attachment && (
                        <div className="tempo-notification-attachment">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              model.performLocalAction(notification.id, "Attachment preview")
                            }
                          >
                            <Paperclip aria-hidden="true" />
                            {notification.attachment.name}
                            <span>({notification.attachment.size})</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="icon-sm"
                            aria-label={`Download ${notification.attachment.name}`}
                            onClick={() =>
                              model.performLocalAction(notification.id, "Demo attachment download")
                            }
                          >
                            <Download aria-hidden="true" />
                          </Button>
                        </div>
                      )}
                      {notification.avatarNames && (
                        <AvatarGroup className="tempo-notification-avatar-group">
                          {notification.avatarNames.slice(0, -1).map((name) => (
                            <Avatar key={name} size="sm">
                              <AvatarImage src={demoAvatar(name)} alt={name} />
                              <AvatarFallback>
                                {name
                                  .split(" ")
                                  .map((part) => part[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          <AvatarGroupCount>+1</AvatarGroupCount>
                        </AvatarGroup>
                      )}
                      {notification.event && (
                        <div className="tempo-notification-event">
                          <span>
                            <CalendarDays aria-hidden="true" />
                            {notification.event.date}
                          </span>
                          <span>
                            <Clock3 aria-hidden="true" />
                            {notification.event.time}
                          </span>
                        </div>
                      )}
                      {notification.actions && !actionResult && (
                        <div className="tempo-notification-actions">
                          {notification.actions.map((action, actionIndex) => (
                            <Button
                              key={action}
                              size="sm"
                              variant={actionIndex === 0 ? "default" : "outline"}
                              onClick={() => model.performLocalAction(notification.id, action)}
                            >
                              {action}
                            </Button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-sm leading-snug">
                        <span className="font-medium">{notification.user}</span>{" "}
                        <span className="text-muted-foreground">{notification.action}</span>{" "}
                        <span className="font-medium">{notification.target}</span>
                      </p>
                      <span className="text-xs text-muted-foreground">{notification.time}</span>
                    </>
                  )}
                  {notification.kind === "invite" &&
                    (invitation ? (
                      <span role="status" className="text-xs text-muted-foreground">
                        {invitation} locally; no remote membership changed.
                      </span>
                    ) : (
                      <div className={tempo ? "tempo-notification-actions" : "flex gap-2"}>
                        <Button
                          size="sm"
                          onClick={() => model.respondToInvitation(notification.id, "Accepted")}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => model.respondToInvitation(notification.id, "Declined")}
                        >
                          Decline
                        </Button>
                      </div>
                    ))}
                  {tempo && notification.progressValue !== undefined ? (
                    <Progress
                      value={notification.progressValue}
                      aria-label={title}
                      className="tempo-notification-progress"
                    />
                  ) : notification.kind === "progress" ? (
                    <NotificationProgress value={65} />
                  ) : null}
                  {notification.kind === "rating" && (
                    <Rating rating={4} size="sm" aria-label="Four out of five stars" />
                  )}
                  {tempo && actionResult && (
                    <span role="status" className="tempo-notification-local-status">
                      {actionResult}
                    </span>
                  )}
                  {tempo && (
                    <div className="tempo-notification-meta">
                      <span className="tempo-notification-time">
                        {!isRead && (
                          <span className="tempo-notification-unread-dot" aria-hidden="true" />
                        )}
                        {notification.time}
                      </span>
                      {notification.metadata && (
                        <span
                          className="tempo-notification-metadata"
                          data-label={notification.metadata.label}
                        >
                          <span>{notification.metadata.label}</span>
                          <span>{notification.metadata.value}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {tempo ? (
                  <div className="tempo-notification-controls">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Mark "${notification.action || title}" as read`}
                      aria-pressed={isRead}
                      onClick={() => model.toggleRead(notification.id)}
                    >
                      <Check aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Dismiss "${notification.action || title}"`}
                      onClick={() => model.dismiss(notification.id)}
                    >
                      <X aria-hidden="true" />
                    </Button>
                  </div>
                ) : !isRead ? (
                  <span
                    aria-label="Unread"
                    className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
                  />
                ) : null}
              </Item>
              {tempo && index < visibleItems.length - 1 && <Separator />}
            </Fragment>
          );
        })}
        {tempo && !visibleItems.length && (
          <p className="tempo-notifications-empty" role="status">
            {model.filter === "unread" ? "No unread notifications." : "No notifications."}
          </p>
        )}
      </div>
    </ScrollArea>
  );

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className={cn("relative", tempo && "tempo-notifications-trigger", triggerClassName)}
            aria-label={`Notifications, ${unread} unread`}
          />
        }
      >
        <Bell />
        {unread > 0 &&
          (tempo ? (
            <span className="tempo-notifications-trigger-dot" aria-hidden="true" />
          ) : (
            <Badge
              variant="destructive"
              size="sm"
              className="absolute -right-1 -top-1 rounded-full px-1"
              aria-hidden="true"
            >
              {unread}
            </Badge>
          ))}
      </PopoverTrigger>
      <PopoverContent
        align={tempo ? "start" : "end"}
        {...(tempo
          ? {
              collisionPadding: 5,
              sideOffset: 8,
              collisionBoundary: collisionBoundary ?? undefined,
            }
          : {})}
        className={
          tempo ? "reui-reference tempo-notifications-popup p-0" : "toolbar-notifications p-0"
        }
        aria-label="Notifications"
      >
        <div
          className={
            tempo ? "tempo-notifications-header" : "flex items-center justify-between gap-2 p-3"
          }
        >
          {tempo ? (
            <div className="tempo-notifications-heading">
              <h2>Notifications</h2>
              <Badge className="tempo-notifications-count" size="sm">
                {unread}
              </Badge>
            </div>
          ) : (
            <h2 className="text-sm font-semibold">
              Notifications <span className="text-muted-foreground">19</span>
            </h2>
          )}
          <Button
            variant="ghost"
            size={tempo ? "icon-sm" : "sm"}
            className={tempo ? "tempo-notifications-read-all" : undefined}
            aria-label={tempo ? "Mark all as read" : undefined}
            disabled={!unread}
            onClick={model.markAllRead}
          >
            {tempo ? <CheckCheck aria-hidden="true" /> : <Check data-icon="inline-start" />}
            {!tempo && "Mark all as read"}
          </Button>
        </div>
        {tempo ? (
          <Tabs
            value={model.filter}
            onValueChange={(value) => {
              if (value === "all" || value === "unread") model.setFilter(value);
            }}
            className="tempo-notifications-tabs"
          >
            <TabsList aria-label="Filter notifications" variant="line">
              <TabsTrigger value="all">
                All{" "}
                <Badge variant="secondary" size="sm">
                  {activeItems.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="unread">
                Unread{" "}
                <Badge variant="secondary" size="sm">
                  {unread}
                </Badge>
              </TabsTrigger>
            </TabsList>
            <TabsContent value={model.filter}>{feed}</TabsContent>
          </Tabs>
        ) : (
          <>
            <Separator />
            {feed}
            <Separator />
            <p className="px-3 py-2 text-xs text-muted-foreground">
              Sample workspace activity. Read state is local.
            </p>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
