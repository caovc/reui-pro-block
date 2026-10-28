import { Frame, FramePanel } from "@/components/reui/frame";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  commerceNotificationChannels,
  commerceNotificationTabs,
  type CommerceNotificationTab,
} from "./commerce-settings-data";
import type { CommerceSettingsModel } from "./commerce-settings-model";

export function CommerceNotificationSettings({ model }: { model: CommerceSettingsModel }) {
  return (
    <>
      <header className="csd-page-heading">
        <h1>Notifications</h1>
      </header>
      <Frame dense className="csd-frame">
        <FramePanel fit className="csd-notification-panel">
          <Tabs
            value={model.notificationTab}
            onValueChange={(value) => {
              const tab = commerceNotificationTabs.find((entry) => entry.id === value);
              if (tab) model.setNotificationTab(tab.id);
            }}
          >
            <div className="csd-tabs-scroll">
              <TabsList variant="line" aria-label="Notification categories">
                {commerceNotificationTabs.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            {commerceNotificationTabs.map((tab) => (
              <TabsContent key={tab.id} value={tab.id} className="csd-notification-tab">
                {tab.id !== "orders" && (
                  <p className="csd-demo-note">
                    Original local demo preferences. The reference schema for this category has not
                    been verified. No message is sent.
                  </p>
                )}
                <NotificationGroups tab={tab.id} model={model} />
              </TabsContent>
            ))}
          </Tabs>
        </FramePanel>
      </Frame>
    </>
  );
}

function NotificationGroups({
  tab,
  model,
}: {
  tab: CommerceNotificationTab;
  model: CommerceSettingsModel;
}) {
  const rows = model.notifications.filter((entry) => entry.tab === tab);
  const groups = [...new Set(rows.map((entry) => entry.group))];
  return groups.map((group) => (
    <Table key={group} className="csd-notification-table">
      <TableHeader>
        <TableRow>
          <TableHead scope="col">{group}</TableHead>
          {commerceNotificationChannels.map((channel) => (
            <TableHead key={channel.id} scope="col">
              {channel.label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows
          .filter((entry) => entry.group === group)
          .map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>{entry.title}</TableCell>
              {commerceNotificationChannels.map((channel) => (
                <TableCell key={channel.id}>
                  <Checkbox
                    aria-label={`${entry.title} via ${channel.label}`}
                    checked={entry.channels[channel.id]}
                    onCheckedChange={(checked) =>
                      model.setNotification(entry.id, channel.id, checked === true)
                    }
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
      </TableBody>
    </Table>
  ));
}
