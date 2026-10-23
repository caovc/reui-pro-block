import { useState } from "react";
import { BookOpen, FileSpreadsheet, Plug, Upload } from "lucide-react";
import { useFileUpload, type FileWithPreview } from "@/hooks/use-file-upload";
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StackedCardsIllustration } from "./free/stacked-cards";
import { ActionRow, EmptyHero, EmptyStage, LocalDialog, QuickLinks } from "./first-run/shared";

import { parseRecordsCSV } from "./first-run/csv";

const sample = [
  ["Name", "Email", "Team"],
  ["Olivia Rhye", "olivia@example.com", "Design"],
  ["Phoenix Baker", "phoenix@example.com", "Engineering"],
  ["Lana Steiner", "lana@example.com", "Operations"],
];

export default function DataImportEmpty() {
  const [rows, setRows] = useState<string[][]>([]);
  const [source, setSource] = useState("");
  const [dialog, setDialog] = useState<"connect" | "records" | "csv" | null>(null);
  const [parseError, setParseError] = useState("");
  const [busy, setBusy] = useState(false);

  async function readFiles(files: FileWithPreview[]) {
    const file = files[0]?.file;
    if (!(file instanceof File)) return;
    setBusy(true);
    setParseError("");
    try {
      const next = parseRecordsCSV(await file.text());
      setRows(next);
      setSource(file.name);
    } catch (error) {
      setParseError(error instanceof Error ? error.message : "Could not read the CSV.");
    } finally {
      setBusy(false);
    }
  }

  const [{ errors }, { getInputProps, openFileDialog, clearFiles }] = useFileUpload({
    accept: ".csv,text/csv",
    maxSize: 1024 * 1024,
    onFilesAdded: (files) => void readFiles(files),
  });

  function reset() {
    setRows([]);
    setSource("");
    setParseError("");
    clearFiles();
  }

  return (
    <EmptyStage id={1}>
      <input
        {...getInputProps()}
        className="sr-only"
        aria-label="Upload records CSV"
        tabIndex={-1}
      />
      {rows.length ? (
        <div className="empty-first-populated">
          <header>
            <div>
              <h1>Your record space</h1>
              <p>
                {rows.length - 1} records · {source} · Local preview only
              </p>
            </div>
            <Button variant="outline" onClick={reset}>
              Clear records
            </Button>
          </header>
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  {rows[0].map((header, index) => (
                    <TableHead key={index}>{header || `Column ${index + 1}`}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.slice(1).map((row, index) => (
                  <TableRow key={index}>
                    {row.map((cell, cellIndex) => (
                      <TableCell key={cellIndex}>{cell}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <>
          <EmptyHero
            media={<StackedCardsIllustration />}
            title="Your record space is empty"
            description="Connect a live source or upload a CSV to start organizing people, teams, and attributes in one place."
          >
            <ActionRow>
              <Button onClick={() => setDialog("connect")}>
                <Plug />
                Connect source
              </Button>
              <Button variant="outline" onClick={openFileDialog} disabled={busy}>
                <Upload />
                {busy ? "Reading CSV…" : "Upload CSV"}
              </Button>
            </ActionRow>
          </EmptyHero>
          {(parseError || errors.length > 0) && (
            <Alert variant="destructive" className="mt-6 max-w-lg">
              <AlertTitle>Could not import records</AlertTitle>
              <AlertDescription>{errors.length ? errors.join(" ") : parseError}</AlertDescription>
            </Alert>
          )}
          <QuickLinks
            title="Quick guides"
            items={[
              {
                label: "How records work",
                icon: <BookOpen className="size-4" />,
                onClick: () => setDialog("records"),
              },
              {
                label: "CSV setup",
                icon: <FileSpreadsheet className="size-4" />,
                onClick: () => setDialog("csv"),
              },
            ]}
          />
        </>
      )}
      <LocalDialog
        open={dialog !== null}
        onOpenChange={(open) => !open && setDialog(null)}
        title={
          dialog === "connect"
            ? "Connect a record source"
            : dialog === "records"
              ? "How records work"
              : "CSV setup"
        }
        description={
          dialog === "connect"
            ? "Try a local sample connection. No credentials or external account access is requested."
            : "This preview keeps imported records in memory on this page."
        }
      >
        {dialog === "connect" ? (
          <div className="grid gap-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <strong className="text-sm">Workspace directory</strong>
                <Badge variant="secondary">Sample</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Three sample people, their team names, and email addresses.
              </p>
            </div>
            <Button
              onClick={() => {
                setRows(sample);
                setSource("Sample directory");
                setDialog(null);
              }}
            >
              Connect sample directory
            </Button>
          </div>
        ) : dialog === "records" ? (
          <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              A record represents one person, team, or company. Each CSV column becomes an
              attribute.
            </p>
            <p>
              Import a CSV to inspect rows, or connect the sample directory. Clear records restores
              the original empty state.
            </p>
          </div>
        ) : (
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              Use a header row followed by records. Quoted commas, escaped quotes, and line breaks
              are supported. Limit: 1 MB, 8 columns, 200 records.
            </p>
            <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">
              {'Name,Email,Team\n"Rhye, Olivia",olivia@example.com,Design'}
            </pre>
            <Button
              onClick={() => {
                setDialog(null);
                openFileDialog();
              }}
            >
              <Upload />
              Choose CSV
            </Button>
          </div>
        )}
      </LocalDialog>
    </EmptyStage>
  );
}
