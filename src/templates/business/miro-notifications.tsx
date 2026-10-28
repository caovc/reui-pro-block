import { Bell } from "lucide-react";
import { Badge } from "@/components/reui/badge";
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
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item";
import { miroAlertTypes, type MiroActivity } from "./miro-settings-data";
import "@/blocks/reference.css";
import "./miro-notifications.css";

/** Read-only view of the parent model's already-filtered session activities. */
export function MiroNotifications({ activities }: { activities: readonly MiroActivity[] }) {
  const count = activities.length;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="miro-notifications-trigger"
          aria-label={`Notifications, ${count} ${count === 1 ? "activity" : "activities"}`}
        >
          <Bell aria-hidden="true" />
          {count > 0 && (
            <Badge radius="full" size="sm" className="miro-notifications-dot" aria-hidden="true" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="reui-reference miro-notifications-menu"
        aria-label="Clinic notifications"
      >
        <DropdownMenuLabel className="miro-notifications-heading">
          Notifications{" "}
          <Badge variant="secondary">
            {count} {count === 1 ? "activity" : "activities"}
          </Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {count === 0 ? (
          <p className="miro-notifications-empty">No matching activity yet.</p>
        ) : (
          <ItemGroup className="miro-notifications-items" aria-label="Matching clinic activities">
            {[...activities].reverse().map((activity) => {
              const type = miroAlertTypes.find((entry) => entry.id === activity.type);
              return (
                <Item key={activity.id} role="listitem" data-activity-id={activity.id}>
                  <ItemContent>
                    <ItemTitle>{type?.label ?? activity.type}</ItemTitle>
                    <ItemDescription>
                      {type?.description ?? "Clinic activity recorded in this session."}
                    </ItemDescription>
                  </ItemContent>
                </Item>
              );
            })}
          </ItemGroup>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>Close</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
