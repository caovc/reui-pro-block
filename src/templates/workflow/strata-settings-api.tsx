import { useId, useState } from "react";
import { BriefcaseBusiness, Check, Copy, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useCopyToClipboard } from "@/blocks/application/empty-variants/team-setup/free/use-copy-to-clipboard";
import {
  DomainGridSurface,
  domainSelectionColumn,
  useDomainGrid,
  type DomainColumn,
  type SortingState,
} from "@/blocks/data/grid-advanced-model-grid";
import { StrataSettingsSection } from "./strata-settings-shared";
import {
  apiKeyEnabled,
  type StrataApiKey,
  type useStrataSettingsApiModel,
} from "./strata-settings-api-model";
import "./strata-settings-leaves.css";

type ApiModel = ReturnType<typeof useStrataSettingsApiModel>;

function DemoKeyCopy({ value, name }: { value: string; name: string }) {
  const [unavailable, setUnavailable] = useState(false);
  const { isCopied, copyToClipboard } = useCopyToClipboard();
  return (
    <span className="strata-api-copy-wrap">
      <Button
        variant="ghost"
        size="sm"
        className="strata-api-key"
        aria-label={isCopied ? `Copied demo key for ${name}` : `Copy API key for ${name}`}
        onClick={() => {
          if (typeof navigator.clipboard?.writeText !== "function") {
            setUnavailable(true);
            return;
          }
          setUnavailable(false);
          copyToClipboard(value);
        }}
      >
        <code>{value}</code>
        {isCopied ? <Check /> : <Copy />}
      </Button>
      {unavailable && (
        <span role="status" className="strata-settings-inline-error">
          Clipboard unavailable. Allow clipboard access for this site, then try again.
        </span>
      )}
    </span>
  );
}

export function StrataSettingsApi({ model }: { model: ApiModel }) {
  const id = useId();
  const [sorting, setSorting] = useState<SortingState>([{ id: "integration", desc: false }]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const columns: DomainColumn<StrataApiKey>[] = [
    domainSelectionColumn((key) => key.name),
    {
      id: "integration",
      accessorKey: "name",
      header: "Integration",
      size: 420,
      cell: ({ row }) => (
        <div className="strata-api-integration">
          <span className="strata-api-monogram" aria-hidden="true">
            {row.original.name
              .split(" ")
              .slice(0, 2)
              .map((word) => word[0])
              .join("")}
          </span>
          <span>
            <strong>{row.original.name}</strong>
            <small>
              {row.original.provider} · {row.original.purpose}
            </small>
          </span>
        </div>
      ),
    },
    {
      id: "token",
      accessorKey: "token",
      header: "API Key",
      size: 240,
      cell: ({ row }) => <DemoKeyCopy value={row.original.token} name={row.original.name} />,
    },
    {
      id: "dailyCalls",
      accessorKey: "dailyCalls",
      header: "Daily Calls",
      size: 120,
      cell: ({ row }) => row.original.dailyCalls.toLocaleString("en-US"),
    },
    {
      id: "enabled",
      accessorFn: (key) => apiKeyEnabled(key, model.paused),
      header: "Status",
      size: 100,
      cell: ({ row }) => (
        <Switch
          aria-label={`Toggle ${row.original.name}`}
          checked={apiKeyEnabled(row.original, model.paused)}
          disabled={model.paused}
          onCheckedChange={(enabled) => model.setEnabled(row.original.id, enabled)}
        />
      ),
    },
    {
      id: "edit",
      header: "",
      size: 48,
      enableSorting: false,
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Edit ${row.original.name}`}
          onClick={() =>
            toast("Edit key", {
              description: `Open the scopes and rotation for ${row.original.name}.`,
            })
          }
        >
          <Pencil />
        </Button>
      ),
    },
  ];
  const table = useDomainGrid({
    data: model.keys,
    columns,
    sorting,
    onSortingChange: setSorting,
    pagination,
    onPaginationChange: setPagination,
    getRowId: (key) => key.id,
  });
  return (
    <section className="strata-settings-api" aria-label="API keys settings">
      <DomainGridSurface
        table={table}
        className="strata-api-grid"
        scrollArea="horizontal"
        layout={{ width: "fixed", rowBorder: true, headerBorder: true }}
        paginationControls={{ sizes: [10, 20, 50], className: "strata-api-pagination" }}
        renderFrame={(content) => (
          <StrataSettingsSection
            title="API Keys"
            description="Keys that send telemetry and events into this workspace."
            action={
              <div className="strata-api-actions">
                <Label htmlFor={`${id}-paused`}>
                  Pause all
                  <Switch
                    id={`${id}-paused`}
                    aria-label="Pause all keys"
                    checked={model.paused}
                    onCheckedChange={model.setPaused}
                  />
                </Label>
                <Button
                  variant="outline"
                  onClick={() =>
                    toast.info("Scopes", {
                      description:
                        "Review which data each key may write: logs, metrics, traces or events.",
                    })
                  }
                >
                  <BriefcaseBusiness />
                  Scopes
                </Button>
              </div>
            }
          >
            {content}
          </StrataSettingsSection>
        )}
      />
      <p className="strata-settings-local-note">
        Demo keys only. Changes apply to this local preview.
      </p>
    </section>
  );
}
