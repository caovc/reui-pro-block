import { useCallback, useState } from "react";
import NotificationsFeed, {
  type NotificationsFeedModel,
} from "@/blocks/application/navbar-variants/toolbars/notifications";
import { tempoNotifications } from "./tempo-notifications-data";
import "./tempo-notifications.css";

export function TempoNotifications({ model }: { model: NotificationsFeedModel }) {
  const [boundary, setBoundary] = useState<HTMLElement | null>(null);
  const attach = useCallback((node: HTMLSpanElement | null) => {
    setBoundary(node?.closest<HTMLElement>('[data-slot="sidebar"][data-mobile="true"]') ?? null);
  }, []);

  return (
    <span ref={attach} className="contents">
      <NotificationsFeed
        variant="tempo"
        items={tempoNotifications}
        model={model}
        collisionBoundary={boundary}
      />
    </span>
  );
}
