import { useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { useFileUpload, type FileWithPreview } from "@/hooks/use-file-upload";
import { downloadFile } from "@/lib/download";
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert";
import { Badge } from "@/components/reui/badge";
import { DataGrid, DataGridContainer } from "@/components/reui/data-grid/data-grid";
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { useDomainGrid, type DomainColumn } from "@/blocks/data/grid-advanced-model-grid";
import { Button } from "@/components/ui/button";
import { FieldDescription, FieldGroup } from "@/components/ui/field";
import { Sheet, SheetClose, SheetTrigger } from "@/components/ui/sheet";
import { VerveSettingsSheet } from "./verve-settings-people-billing-surfaces";
import {
  previewVerveMemberImport,
  verveMemberCsvSample,
  type VerveImportRow,
} from "./verve-settings-actions-data";
import type { VervePeopleBillingModel } from "./verve-settings-people-billing-model";

export function VerveMemberImport({ model }: { model: VervePeopleBillingModel }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<VerveImportRow[]>([]);
  const [filename, setFilename] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const version = useRef(0);
  useEffect(
    () => () => {
      version.current += 1;
    },
    [],
  );
  async function read(files: FileWithPreview[]) {
    const file = files[0]?.file;
    if (!(file instanceof File)) return;
    const current = ++version.current;
    setBusy(true);
    setError("");
    setRows([]);
    setFilename(file.name);
    try {
      const preview = previewVerveMemberImport(await file.text(), model.members);
      if (current === version.current) setRows(preview);
    } catch (issue) {
      if (current === version.current)
        setError(issue instanceof Error ? issue.message : "The CSV could not be read.");
    } finally {
      if (current === version.current) setBusy(false);
    }
  }
  const [upload, actions] = useFileUpload({
    accept: ".csv,text/csv",
    maxFiles: 1,
    multiple: false,
    maxSize: 1024 * 1024,
    onFilesAdded: (files) => void read(files),
  });
  function changeOpen(next: boolean) {
    version.current += 1;
    setRows([]);
    setFilename("");
    setBusy(false);
    setError("");
    actions.clearFiles();
    setOpen(next);
  }
  const columns: DomainColumn<VerveImportRow>[] = [
    { id: "name", header: "Name", accessorFn: (row) => row.draft.name, size: 180 },
    { id: "email", header: "Email", accessorFn: (row) => row.draft.email, size: 240 },
    { id: "role", header: "Role", accessorFn: (row) => row.draft.role, size: 150 },
    {
      id: "validation",
      header: "Validation",
      size: 280,
      cell: ({ row }) =>
        row.original.issues.length ? (
          <span className="text-destructive">{row.original.issues.join(" ")}</span>
        ) : (
          <Badge variant="success-light">Ready</Badge>
        ),
    },
  ];
  const table = useDomainGrid({ data: rows, columns, getRowId: (row) => row.id });
  const invalid = rows.filter((row) => row.issues.length).length;
  return (
    <Sheet open={open} onOpenChange={changeOpen}>
      <SheetTrigger asChild>
        <Button size="sm" variant="outline">
          Import
        </Button>
      </SheetTrigger>
      <VerveSettingsSheet
        title="Import members"
        description="Review a local CSV before adding records. No invitations, directory sync or real access changes are sent."
        footer={
          <>
            <SheetClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </SheetClose>
            <Button
              type="button"
              disabled={busy || !rows.length || invalid > 0 || upload.errors.length > 0}
              onClick={() => {
                const issue = model.memberActions.importRows(rows);
                if (issue) setError(issue);
                else changeOpen(false);
              }}
            >
              Import {rows.length} members
            </Button>
          </>
        }
      >
        <FieldGroup>
          <div
            className="rounded-lg border border-dashed p-4 flex flex-col gap-3"
            data-dragging={upload.isDragging}
            onDragEnter={actions.handleDragEnter}
            onDragLeave={actions.handleDragLeave}
            onDragOver={actions.handleDragOver}
            onDrop={actions.handleDrop}
          >
            <input
              {...actions.getInputProps({ "aria-label": "Upload members CSV" })}
              className="sr-only"
              tabIndex={-1}
            />
            <p>Drop one CSV here or choose a file. Up to 1 MB and 200 records.</p>
            <Button
              type="button"
              variant="outline"
              onClick={actions.openFileDialog}
              disabled={busy}
            >
              <Upload data-icon="inline-start" />
              {busy ? "Reading CSV…" : "Choose CSV"}
            </Button>
          </div>
          <FieldDescription>
            Required columns: name, email. Optional: username, role, billing, authentication.
            Existing or repeated email addresses and usernames are rejected.
          </FieldDescription>
          <Button
            type="button"
            variant="link"
            onClick={() =>
              downloadFile("bricklane-members-sample.csv", verveMemberCsvSample, "text/csv")
            }
          >
            Download sample CSV
          </Button>
          {(error || upload.errors.length > 0) && (
            <Alert variant="destructive">
              <AlertTitle>Import needs attention</AlertTitle>
              <AlertDescription>
                {[error, ...upload.errors].filter(Boolean).join(" ")}
              </AlertDescription>
            </Alert>
          )}
          {rows.length > 0 && (
            <>
              <p role="status" aria-label="CSV import preview">
                {filename}: {rows.length} records, {invalid} invalid. Nothing is imported until you
                confirm.
              </p>
              <DataGrid
                table={table}
                recordCount={rows.length}
                tableLayout={{ dense: true, width: "auto" }}
              >
                <DataGridContainer>
                  <DataGridScrollArea orientation="horizontal">
                    <DataGridTable />
                  </DataGridScrollArea>
                </DataGridContainer>
                <DataGridPagination sizes={[5, 10, 20]} />
              </DataGrid>
            </>
          )}
        </FieldGroup>
      </VerveSettingsSheet>
    </Sheet>
  );
}
