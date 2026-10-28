// Actual free ReUI c-sheet-1 root/trigger/close composition, MIT (c) Keenthemes.
// https://reui.io/r/radix-nova/c-sheet-1.json
// Actual c-dropdown-menu-11 avatar/action/target/time/unread row composition:
// https://reui.io/r/radix-nova/c-dropdown-menu-11.json
// As in the existing toolbars/notifications consumer, Item + ScrollArea replace
// menu rows so nested links/actions retain their native interactive semantics.
// Free fixtures/media are replaced with original Bricklane demo data/avatars.
import { useReducer, useState, type MouseEvent } from "react";
import {
  Bell,
  Check,
  CircleCheck,
  Cloud,
  CreditCard,
  Download,
  FileText,
  Link2,
  LoaderCircle,
  Monitor,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { Badge } from "@/components/reui/badge";
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupText } from "@/components/ui/button-group";
import { Item, ItemContent, ItemMedia } from "@/components/ui/item";
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
import { demoAvatar } from "@/lib/demo-artwork";
import {
  createDriveHeaderActivity,
  driveHeaderActivityReducer,
  driveHeaderNotifications,
  driveNotificationAttachment,
  type DriveHeaderNavigation,
  type DriveHeaderNotification,
  type DriveHeaderTarget,
} from "./drive-header-data";
import "./drive-header.css";

const notificationIcons = {
  share: Users,
  comment: FileText,
  access: ShieldCheck,
  attachment: FileText,
  joined: Users,
  retention: Trash2,
  device: Monitor,
  mention: FileText,
  backup: Cloud,
  payment: CreditCard,
  integration: Link2,
};

function DriveNotificationAvatar({ name }: { name: string }) {
  return (
    <Avatar size="sm" className="drive-notification-avatar">
      <AvatarImage src={demoAvatar(name)} alt={name} />
      <AvatarFallback>
        {name
          .split(" ")
          .map((part) => part[0])
          .join("")}
      </AvatarFallback>
    </Avatar>
  );
}

export function DriveHeaderNotifications({
  navigation,
  onDownloadAttachment,
}: {
  navigation: DriveHeaderNavigation;
  /** Integrate the existing downloadDrivePdf(name, lines) local serializer.
   * Must either create the original local download or reject/throw; no network
   * call or remote agreement is implied by the ready/downloaded state. */
  onDownloadAttachment: (attachment: typeof driveNotificationAttachment) => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [activity, dispatch] = useReducer(
    driveHeaderActivityReducer,
    undefined,
    createDriveHeaderActivity,
  );
  const [download, setDownload] = useState<"idle" | "busy" | "downloaded" | "error">("idle");
  const unread = driveHeaderNotifications.filter(
    (notification) => !activity.readIds.includes(notification.id),
  ).length;

  function follow(
    event: MouseEvent<HTMLAnchorElement>,
    target: DriveHeaderTarget,
    notification: DriveHeaderNotification,
  ) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    event.preventDefault();
    dispatch({ type: "read", id: notification.id });
    setOpen(false);
    navigation.onNavigate(target);
  }

  async function downloadAttachment() {
    if (download === "busy") return;
    setDownload("busy");
    try {
      await onDownloadAttachment(driveNotificationAttachment);
      setDownload("downloaded");
    } catch {
      setDownload("error");
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="drive-notifications-trigger"
          aria-label="Notifications"
        >
          <Bell />
          {unread > 0 && <span className="drive-notifications-trigger-dot" aria-hidden="true" />}
        </Button>
      </SheetTrigger>
      <SheetContent
        className="reui-reference drive-header-sheet drive-notifications-sheet"
        showCloseButton={false}
      >
        <SheetHeader className="drive-header-sheet-heading">
          <div className="drive-notifications-heading">
            <SheetTitle>Notifications</SheetTitle>
            <Badge size="xs" radius="full" aria-label={`${unread} unread notifications`}>
              {unread}
            </Badge>
          </div>
          <SheetDescription className="sr-only">
            File activity, access requests, and workspace updates. Actions affect this demo only.
          </SheetDescription>
          <div className="drive-header-sheet-heading-actions">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Mark all as read"
              disabled={unread === 0}
              onClick={() => dispatch({ type: "read-all" })}
            >
              <Check />
            </Button>
            <SheetClose asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Dismiss notifications">
                <X />
              </Button>
            </SheetClose>
          </div>
        </SheetHeader>
        <ScrollArea className="drive-header-sheet-scroll">
          <div
            role="list"
            aria-label="Workspace notifications"
            className="drive-notifications-feed"
          >
            {driveHeaderNotifications.map((notification) => {
              const Icon = notificationIcons[notification.kind];
              const isUnread = !activity.readIds.includes(notification.id);
              const target = notification.target;
              const actorTarget: DriveHeaderTarget | null = notification.actorSlug
                ? { kind: "settings", section: "team", memberSlug: notification.actorSlug }
                : null;
              const rowTarget =
                notification.kind === "joined" || notification.kind === "payment" ? target : null;
              const usesAvatar =
                notification.kind === "share" ||
                notification.kind === "comment" ||
                notification.kind === "attachment" ||
                notification.kind === "mention";
              const targetLink =
                !rowTarget && target ? (
                  <a
                    className={
                      notification.kind === "retention" ? undefined : "drive-notification-target"
                    }
                    href={navigation.href(target)}
                    onClick={(event) => follow(event, target, notification)}
                  >
                    {notification.targetLabel}
                  </a>
                ) : null;
              const content = (
                <>
                  <ItemMedia className="drive-notification-media" data-kind={notification.kind}>
                    {isUnread ? (
                      <span
                        className="drive-notification-unread"
                        aria-label="Unread notification"
                      />
                    ) : (
                      <span className="drive-notification-read-placeholder" aria-hidden="true" />
                    )}
                    {usesAvatar && notification.actor ? (
                      <DriveNotificationAvatar name={notification.actor} />
                    ) : (
                      <Icon className="drive-notification-glyph" aria-hidden="true" />
                    )}
                  </ItemMedia>
                  <ItemContent className="drive-notification-body">
                    <p className="drive-notification-title">
                      {notification.actor && actorTarget && !rowTarget && (
                        <>
                          <a
                            href={navigation.href(actorTarget)}
                            onClick={(event) => follow(event, actorTarget, notification)}
                          >
                            {notification.actor}
                          </a>{" "}
                        </>
                      )}
                      {notification.title}
                      {notification.kind === "share" && targetLink && <> {targetLink}</>}
                    </p>
                    <p className="drive-notification-description">{notification.description}</p>
                    {notification.kind === "joined" && (
                      <AvatarGroup className="drive-notification-avatar-group -space-x-1">
                        <DriveNotificationAvatar name="Nora Vale" />
                        <DriveNotificationAvatar name="Theo Park" />
                      </AvatarGroup>
                    )}
                    {!rowTarget && notification.kind !== "share" && targetLink ? (
                      notification.kind === "retention" ? (
                        <Button asChild variant="outline" size="xs" className="w-fit">
                          {targetLink}
                        </Button>
                      ) : (
                        targetLink
                      )
                    ) : null}
                    {notification.kind === "access" && (
                      <div className="drive-notification-actions">
                        {activity.access === "pending" ? (
                          <>
                            <Button
                              size="xs"
                              onClick={() => dispatch({ type: "access", decision: "granted" })}
                            >
                              Grant
                            </Button>
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => dispatch({ type: "access", decision: "denied" })}
                            >
                              Deny
                            </Button>
                          </>
                        ) : (
                          <span role="status" className="drive-notification-decision">
                            <CircleCheck aria-hidden="true" />
                            {activity.access === "granted"
                              ? "Edit access granted in this demo."
                              : "Access request denied in this demo."}
                          </span>
                        )}
                      </div>
                    )}
                    {notification.kind === "attachment" && (
                      <div className="drive-notification-attachment">
                        <ButtonGroup
                          aria-label="Sample attachment"
                          className="drive-notification-file"
                        >
                          <ButtonGroupText className="drive-notification-file-label">
                            <FileText aria-hidden="true" />
                            <span className="drive-notification-file-name">
                              Bricklane sample agreement
                            </span>
                            <Badge variant="outline" size="sm">
                              PDF
                            </Badge>
                          </ButtonGroupText>
                          <Button
                            variant="outline"
                            size="icon-xs"
                            disabled={download === "busy"}
                            onClick={downloadAttachment}
                          >
                            {download === "busy" ? (
                              <LoaderCircle className="animate-spin" />
                            ) : (
                              <Download />
                            )}
                            <span className="sr-only">
                              {download === "busy" ? "Preparing…" : "Download sample"}
                            </span>
                          </Button>
                        </ButtonGroup>
                        {download === "error" && (
                          <p role="alert">
                            The sample could not be prepared. Try downloading again.
                          </p>
                        )}
                        {download === "downloaded" && (
                          <p role="status">Original demo PDF prepared for download.</p>
                        )}
                      </div>
                    )}
                    {notification.kind === "device" && (
                      <div className="drive-notification-actions">
                        {activity.device === "pending" ? (
                          <>
                            <Button
                              size="xs"
                              variant="destructive"
                              onClick={() => dispatch({ type: "device", decision: "revoked" })}
                            >
                              Revoke
                            </Button>
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => dispatch({ type: "device", decision: "recognized" })}
                            >
                              This was me
                            </Button>
                          </>
                        ) : (
                          <span role="status" className="drive-notification-decision">
                            <CircleCheck aria-hidden="true" />
                            {activity.device === "revoked"
                              ? "Demo session revoked."
                              : "Demo device marked as recognized."}
                          </span>
                        )}
                      </div>
                    )}
                    <time className="drive-notification-time">{notification.time}</time>
                  </ItemContent>
                </>
              );
              return rowTarget ? (
                <div key={notification.id} role="listitem">
                  <Item
                    asChild
                    className="drive-notification"
                    data-notification={notification.id}
                    data-unread={isUnread}
                  >
                    <a
                      href={navigation.href(rowTarget)}
                      aria-label={notification.targetLabel}
                      onClick={(event) => follow(event, rowTarget, notification)}
                    >
                      {content}
                    </a>
                  </Item>
                </div>
              ) : (
                <Item
                  key={notification.id}
                  role="listitem"
                  className="drive-notification"
                  data-notification={notification.id}
                  data-unread={isUnread}
                >
                  {content}
                </Item>
              );
            })}
          </div>
        </ScrollArea>
        <SheetFooter className="drive-notifications-footer">
          <p>Demo activity. Access and device decisions stay in this preview.</p>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
