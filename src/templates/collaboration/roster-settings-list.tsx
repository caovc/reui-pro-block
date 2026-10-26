import { useState } from "react";
import { MoreHorizontal, Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/reui/badge";
import { DomainRecordGrid, type DomainField } from "@/blocks/data/grid-advanced-model-grid";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Input, Button } from "./shared";
import { SettingsSection, SettingsNumber, SettingsSelect } from "./settings-shared";
import type { useSettingsDraft } from "./settings-model";
import type { SettingRecord } from "./roster-settings-model";

export function RosterSettingsList({
  title,
  description,
  addLabel,
  firstColumn,
  model,
  days = false,
  timezone = false,
}: {
  title: string;
  description: string;
  addLabel: string;
  firstColumn: string;
  model: ReturnType<typeof useSettingsDraft<SettingRecord[]>>;
  days?: boolean;
  timezone?: boolean;
}) {
  const [editing, setEditing] = useState("");
  function patch(id: string, changes: Partial<SettingRecord>) {
    model.setDraft((rows) => rows.map((row) => (row.id === id ? { ...row, ...changes } : row)));
  }
  const fields: DomainField<SettingRecord>[] = [
    {
      id: "name",
      title: firstColumn,
      value: (row) => row.name,
      size: 400,
      render: (row) =>
        editing === row.id || !row.name ? (
          <Input
            aria-label={`Name for ${row.id}`}
            autoFocus
            value={row.name}
            onChange={(e) => patch(row.id, { name: e.target.value })}
            placeholder="Name is required"
          />
        ) : (
          <button
            className="ct-settings-cell"
            aria-label={`Edit name for ${row.name}`}
            onClick={() => setEditing(row.id)}
          >
            {row.name}
          </button>
        ),
    },
  ];
  if (days)
    fields.push({
      id: "days",
      title: "Days per year",
      value: (row) => row.days || 0,
      size: 400,
      render: (row) =>
        editing === row.id ? (
          <SettingsNumber
            label={`Days per year for ${row.name || "new leave type"}`}
            value={row.days || 0}
            onChange={(value) => patch(row.id, { days: value })}
          />
        ) : (
          <button
            className="ct-settings-cell ct-muted"
            aria-label={`Edit days for ${row.name}`}
            onClick={() => setEditing(row.id)}
          >
            {row.days}
          </button>
        ),
    });
  fields.push(
    timezone
      ? {
          id: "timezone",
          title: "Timezone",
          value: (row) => row.timezone || "",
          size: 400,
          render: (row) =>
            editing === row.id ? (
              <SettingsSelect
                label={`Timezone for ${row.name}`}
                value={row.timezone || "Europe/London"}
                options={[
                  "Europe/London",
                  "Europe/Lisbon",
                  "Europe/Berlin",
                  "America/New_York",
                  "Asia/Singapore",
                ]}
                onChange={(value) => patch(row.id, { timezone: value })}
              />
            ) : (
              <button
                className="ct-settings-cell ct-muted"
                aria-label={`Edit timezone for ${row.name}`}
                onClick={() => setEditing(row.id)}
              >
                {row.timezone}
              </button>
            ),
        }
      : {
          id: "count",
          title: days ? "Requests" : "People",
          value: (row) => row.count || 0,
          size: 220,
          render: (row) => <Badge variant="secondary">{row.count || "—"}</Badge>,
        },
  );
  fields.push({
    id: "actions",
    title: "",
    value: (row) => row.id,
    size: 112,
    render: (row) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={`Actions for ${row.name || "new row"}`}
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            onClick={() => model.setDraft((rows) => rows.filter((item) => item.id !== row.id))}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  });
  return (
    <SettingsSection
      title={title}
      description={description}
      dirty={model.dirty}
      save={() => {
        if (model.draft.some((row) => !row.name.trim())) {
          toast.error("Every row needs a name before saving");
          return;
        }
        if (
          new Set(model.draft.map((row) => row.name.trim().toLowerCase())).size !==
          model.draft.length
        ) {
          toast.error("Names must be unique within this section");
          return;
        }
        setEditing("");
        model.save();
      }}
      discard={() => {
        setEditing("");
        model.discard();
      }}
      action={
        <Button
          variant="outline"
          onClick={() => {
            const id = `${title}-${crypto.randomUUID()}`;
            model.setDraft((rows) => [
              ...rows,
              {
                id,
                name: "",
                count: 0,
                ...(days ? { days: 0 } : {}),
                ...(timezone ? { timezone: "Europe/London" } : {}),
              },
            ]);
            setEditing(id);
          }}
        >
          <Plus />
          {addLabel}
        </Button>
      }
    >
      <div className={`ct-settings-list${timezone ? "" : " ct-settings-list-counts"}`}>
        <DomainRecordGrid
          data={model.draft}
          fields={fields.map((field) => ({
            ...field,
            header: () => (
              <div className={field.id === "count" ? "text-right" : undefined}>{field.title}</div>
            ),
          }))}
          getRowId={(row) => row.id}
          pagination={{ pageIndex: 0, pageSize: 100 }}
          layout={{ width: "fixed", rowBorder: true }}
        />
      </div>
    </SettingsSection>
  );
}
