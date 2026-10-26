import { useMemo, type ComponentType } from "react";
import { useTable, type ColumnDef } from "@tanstack/react-table";
import {
  Bot,
  Check,
  Copy,
  CreditCard,
  Database,
  Download,
  FileText,
  GitBranch,
  Layers,
  Mail,
  MessageCircle,
  MessagesSquare,
  Pencil,
  Sparkles,
  Video,
  Workflow,
} from "lucide-react";
import { toast } from "sonner";
import {
  DataGrid,
  DataGridContainer,
  dataGridFeatures,
  type DataGridFeatures,
} from "@/components/reui/data-grid/data-grid";
import {
  DataGridTable,
  DataGridTableRowSelect,
  DataGridTableRowSelectAll,
} from "@/components/reui/data-grid/data-grid-table";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import { IconTile } from "@/components/reui/icon-tile";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useCopyToClipboard } from "@/blocks/application/empty-variants/team-setup/free/use-copy-to-clipboard";
import { downloadFile } from "@/lib/download";
import type { FluxIntegration, FluxSettingsModel } from "./flux-settings-model";
import "@/blocks/reference.css";
import "./flux-settings.css";

const providerMarks: Record<
  string,
  { icon: ComponentType<{ className?: string }>; color: string }
> = {
  Supabase: { icon: Database, color: "text-emerald-500" },
  Slack: { icon: MessageCircle, color: "text-fuchsia-500" },
  Stripe: { icon: CreditCard, color: "text-indigo-600" },
  n8n: { icon: Workflow, color: "text-rose-500" },
  Gemini: { icon: Sparkles, color: "text-sky-500" },
  Discord: { icon: MessagesSquare, color: "text-indigo-500" },
  Loom: { icon: Video, color: "text-violet-500" },
  OpenAI: { icon: Bot, color: "text-emerald-600" },
  Notion: { icon: FileText, color: "text-foreground" },
  Linear: { icon: Layers, color: "text-indigo-500" },
  GitHub: { icon: GitBranch, color: "text-foreground" },
  Resend: { icon: Mail, color: "text-foreground" },
};
function IntegrationKey({ value }: { value: string }) {
  const { isCopied, copyToClipboard } = useCopyToClipboard();
  return (
    <Button
      variant="ghost"
      size="sm"
      className="flux-api-key font-mono"
      aria-label={isCopied ? "API key copied" : "Copy API key"}
      onClick={() => {
        if (typeof navigator.clipboard?.writeText === "function") copyToClipboard(value);
        else
          toast.info("Copy API key", {
            description: "Clipboard access is unavailable in this browser.",
          });
      }}
    >
      <span className="truncate">{value}</span>
      {isCopied ? <Check /> : <Copy />}
    </Button>
  );
}
export function FluxApiKeysSettings({ model }: { model: FluxSettingsModel }) {
  const { setIntegrationEnabled } = model;
  const columns = useMemo<ColumnDef<DataGridFeatures, FluxIntegration>[]>(
    () => [
      {
        id: "select",
        header: () => <DataGridTableRowSelectAll />,
        cell: ({ row }) => <DataGridTableRowSelect row={row} />,
        size: 32,
        enableSorting: false,
        enableHiding: false,
      },
      {
        id: "integration",
        accessorKey: "name",
        size: 400,
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Integration" visibility />
        ),
        cell: ({ row }) => {
          const mark = providerMarks[row.original.provider] ?? providerMarks.OpenAI;
          const Icon = mark.icon;
          return (
            <div className="flex min-w-0 items-center gap-4">
              <IconTile size="xs" className={`border-0 bg-transparent ${mark.color}`}>
                <Icon />
              </IconTile>
              <div className="flex min-w-0 flex-col gap-0.5">
                <div className="truncate text-sm font-medium">{row.original.name}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {row.original.provider} · {row.original.purpose}
                </div>
              </div>
            </div>
          );
        },
        meta: { headerTitle: "Integration" },
      },
      {
        id: "apiKey",
        accessorKey: "apiKey",
        size: 290,
        header: ({ column }) => <DataGridColumnHeader column={column} title="API Key" visibility />,
        cell: ({ row }) => <IntegrationKey value={row.original.apiKey} />,
        meta: { headerTitle: "API Key" },
      },
      {
        id: "dailyCalls",
        accessorKey: "dailyCalls",
        size: 120,
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Daily Calls" visibility />
        ),
        cell: ({ row }) => row.original.dailyCalls.toLocaleString("en-US"),
        meta: { headerTitle: "Daily Calls" },
      },
      {
        id: "enabled",
        accessorKey: "enabled",
        size: 85,
        header: ({ column }) => <DataGridColumnHeader column={column} title="Status" visibility />,
        cell: ({ row }) => (
          <Switch
            aria-label={`Toggle ${row.original.name}`}
            checked={row.original.enabled}
            onCheckedChange={(enabled) => setIntegrationEnabled(row.original.id, enabled)}
          />
        ),
        meta: { headerTitle: "Status" },
      },
      {
        id: "edit",
        size: 53,
        enableSorting: false,
        enableHiding: false,
        header: "",
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Edit ${row.original.name}`}
            onClick={() =>
              toast.info("Edit integration", {
                description: `Open ${row.original.name} settings in your configuration flow.`,
              })
            }
          >
            <Pencil className="size-3.5" />
          </Button>
        ),
      },
    ],
    [setIntegrationEnabled],
  );
  const table = useTable({
    features: dataGridFeatures,
    data: model.integrations,
    columns,
    getRowId: (row) => row.id,
    enableRowSelection: true,
    autoResetPageIndex: false,
    initialState: {
      pagination: { pageIndex: 0, pageSize: 10 },
      sorting: [{ id: "integration", desc: false }],
    },
  });
  const exportIntegrations = () => {
    const rows = model.integrations.map(({ name, provider, purpose, dailyCalls, enabled }) => ({
      name,
      provider,
      purpose,
      dailyCalls,
      enabled,
    }));
    downloadFile(
      "api-integrations.json",
      JSON.stringify(
        {
          integrations: rows.length,
          enabled: rows.filter((row) => row.enabled).length,
          dailyCalls: rows.reduce((sum, row) => sum + row.dailyCalls, 0),
          rows,
        },
        null,
        2,
      ),
      "application/json",
    );
  };
  return (
    <section className="flux-settings-page flux-api-grid" aria-labelledby="flux-api-heading">
      <h1 className="sr-only" id="flux-api-heading">
        API keys
      </h1>
      <Frame dense spacing="sm">
        <FrameHeader className="flex-row items-center justify-between gap-3">
          <div className="min-w-0 space-y-px">
            <FrameTitle>API Integrations</FrameTitle>
            <FrameDescription>
              What this workspace holds a key for, and whether it may call.
            </FrameDescription>
          </div>
          <div className="flux-api-actions">
            <Label htmlFor="flux-pause-all" className="gap-2 font-normal text-muted-foreground">
              <span className="hidden sm:inline">Pause all</span>
              <Switch
                id="flux-pause-all"
                aria-label="Pause all integrations"
                checked={model.integrations.every((row) => !row.enabled)}
                onCheckedChange={model.pauseAll}
              />
            </Label>
            <Button
              variant="outline"
              size="default"
              className="rounded-full"
              aria-label="Export integrations"
              onClick={exportIntegrations}
            >
              <Download />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </FrameHeader>
        <DataGrid
          table={table}
          recordCount={model.integrations.length}
          tableLayout={{
            dense: true,
            rowBorder: true,
            headerBorder: true,
            width: "auto",
            columnsVisibility: true,
          }}
          tableClassNames={{ edgeCell: "px-3" }}
        >
          <FramePanel className="p-0">
            <DataGridContainer className="rounded-none border-0">
              <DataGridScrollArea orientation="horizontal">
                <DataGridTable />
              </DataGridScrollArea>
            </DataGridContainer>
          </FramePanel>
          <FrameFooter>
            <DataGridPagination
              className="flux-api-pagination"
              sizes={[5, 10, 25, 50, 100]}
              info="{from} - {to} of {count}"
            />
          </FrameFooter>
        </DataGrid>
      </Frame>
    </section>
  );
}
