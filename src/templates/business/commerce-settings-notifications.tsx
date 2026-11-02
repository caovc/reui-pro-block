import { useMemo } from "react";
import { useTable, type ColumnDef } from "@tanstack/react-table";
import {
  DataGrid,
  dataGridFeatures,
  type DataGridFeatures,
} from "@/components/reui/data-grid/data-grid";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table";
import { Frame, FramePanel } from "@/components/reui/frame";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  commerceNotificationChannels,
  commerceNotificationTabs,
  type CommerceNotification,
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
              <TabsList variant="line" className="p-0" aria-label="Notification categories">
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
    <NotificationGroupTable
      key={group}
      group={group}
      rows={rows.filter((entry) => entry.group === group)}
      model={model}
    />
  ));
}

/** Each preference group owns its actual free DataGrid table instance. */
function NotificationGroupTable({
  group,
  rows,
  model,
}: {
  group: string;
  rows: CommerceNotification[];
  model: CommerceSettingsModel;
}) {
  const { setNotification } = model;
  const columns = useMemo<ColumnDef<DataGridFeatures, CommerceNotification>[]>(
    () => [
      {
        id: "notification",
        accessorKey: "title",
        header: group,
        enableSorting: false,
        enableHiding: false,
        meta: {
          headerClassName: "ps-0 whitespace-normal",
          cellClassName: "ps-0 whitespace-normal",
        },
      },
      ...commerceNotificationChannels.map(
        (channel) =>
          ({
            id: channel.id,
            header: channel.label,
            accessorFn: (entry) => entry.channels[channel.id],
            enableSorting: false,
            enableHiding: false,
            meta: {
              headerClassName: "w-1 text-center whitespace-nowrap last:pe-0",
              cellClassName: "w-1 text-center last:pe-0",
            },
            cell: ({ row }) => (
              <Checkbox
                className="mx-auto"
                aria-label={`${row.original.title} via ${channel.label}`}
                checked={row.original.channels[channel.id]}
                onCheckedChange={(checked) =>
                  setNotification(row.original.id, channel.id, checked === true)
                }
              />
            ),
          }) satisfies ColumnDef<DataGridFeatures, CommerceNotification>,
      ),
    ],
    [group, setNotification],
  );
  const table = useTable({
    features: dataGridFeatures,
    columns,
    data: rows,
    getRowId: (entry) => entry.id,
    manualPagination: true,
  });

  return (
    <div className="csd-notification-grid">
      <DataGrid
        table={table}
        recordCount={rows.length}
        tableLayout={{ width: "auto" }}
        tableClassNames={{ base: "csd-notification-table" }}
      >
        <DataGridScrollArea orientation="horizontal">
          <DataGridTable />
        </DataGridScrollArea>
      </DataGrid>
    </div>
  );
}
