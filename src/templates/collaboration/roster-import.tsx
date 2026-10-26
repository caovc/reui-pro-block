import { useState } from "react";
import { ArrowRight, Check, CheckCircle, CloudUpload, FileSpreadsheet, Info } from "lucide-react";
import {
  Stepper,
  StepperNav,
  StepperItem,
  StepperTrigger,
  StepperIndicator,
  StepperTitle,
  StepperSeparator,
} from "@/components/reui/stepper";
import {
  Frame,
  FrameHeader,
  FrameTitle,
  FrameDescription,
  FramePanel,
} from "@/components/reui/frame";
import { Alert, AlertTitle, AlertDescription } from "@/components/reui/alert";
import { Badge } from "@/components/reui/badge";
import { DomainRecordGrid } from "@/blocks/data/grid-advanced-model-grid";
import { useFileUpload } from "@/hooks/use-file-upload";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "./shared";
import {
  importFields,
  samplePeopleCSV,
  type DuplicateMode,
  type RosterImportState,
} from "./roster-import-model";
import "./roster-import.css";

const steps = ["Upload", "Map Columns", "Preview", "Duplicates", "Summary"];
export function RosterImport({
  model,
  onPeople,
}: {
  model: RosterImportState;
  onPeople: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [{ errors, isDragging }, upload] = useFileUpload({
    accept: ".csv,text/csv",
    maxSize: 5 * 1024 * 1024,
    onFilesAdded: async (files) => {
      const file = files[0]?.file;
      if (!(file instanceof File)) return;
      setBusy(true);
      try {
        model.load(await file.text(), file.name);
      } catch {
        model.setError("The selected file could not be read.");
      } finally {
        setBusy(false);
      }
    },
  });
  const requiredMapped = [1, 2, 3, 6].every((field) => model.mapping.includes(field));
  function next() {
    if (model.step === 1 && !model.rows.length) {
      model.setError("Choose a CSV file to continue.");
      return;
    }
    if (model.step === 2 && !requiredMapped) {
      model.setError("Map Full name, Job title, Department and Start date to continue.");
      return;
    }
    model.setError("");
    model.setStep(model.step + 1);
  }
  return (
    <>
      <div className="ct-heading">
        <h1>Import</h1>
      </div>
      <Frame className="ct-roster-import" dense>
        <FrameHeader>
          <div className="ct-between">
            <div>
              <FrameTitle>Import people</FrameTitle>
              <FrameDescription>
                {model.filename || "Choose a source file"}
                {model.rows.length > 0 ? ` · ${model.rows.length - 1} rows` : ""}
              </FrameDescription>
            </div>
            <Badge variant="outline">People</Badge>
          </div>
        </FrameHeader>
        <Stepper
          indicators={{ completed: <Check size={12} /> }}
          value={model.step}
          onValueChange={(step) => step <= model.step && !model.result && model.setStep(step)}
        >
          <StepperNav className="ct-import-steps">
            {steps.map((title, index) => (
              <StepperItem
                key={title}
                step={index + 1}
                completed={!!model.result || index + 1 < model.step}
                disabled={index + 1 > model.step || !!model.result}
              >
                <StepperTrigger>
                  <StepperIndicator>{index + 1}</StepperIndicator>{" "}
                  <StepperTitle>{title}</StepperTitle>
                </StepperTrigger>
                {index < 4 && <StepperSeparator />}
              </StepperItem>
            ))}
          </StepperNav>
        </Stepper>
        <FramePanel className="ct-import-content">
          {model.result ? (
            <div className="ct-import-complete">
              <CheckCircle size={36} className="text-success" />
              <h2>Import complete</h2>
              <p>
                {model.result.added} people added, {model.result.updated} updated,{" "}
                {model.result.skipped} skipped.
              </p>
              {model.result.errors > 0 && (
                <p>{model.result.errors} rows were held back with errors.</p>
              )}
              <div className="ct-toolbar">
                <Button onClick={onPeople}>
                  View people
                  <ArrowRight />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    model.setResult(null);
                    model.setStep(1);
                  }}
                >
                  Import another file
                </Button>
              </div>
            </div>
          ) : model.step === 1 ? (
            <>
              <h2>Source file</h2>
              <p>Choose a CSV with one person per row.</p>
              <input
                {...upload.getInputProps()}
                aria-label="Upload people CSV"
                className="sr-only"
              />
              <div
                className={`ct-import-dropzone${isDragging ? " dragging" : ""}`}
                onDragEnter={upload.handleDragEnter}
                onDragLeave={upload.handleDragLeave}
                onDragOver={upload.handleDragOver}
                onDrop={upload.handleDrop}
              >
                <CloudUpload size={28} className="ct-muted" />
                <h3>{busy ? "Reading file..." : "Drop a CSV file here"}</h3>
                <p>CSV · Up to 5 MB</p>
                <Button variant="outline" disabled={busy} onClick={upload.openFileDialog}>
                  Browse files
                </Button>
              </div>
              <button
                type="button"
                className="ct-import-sample"
                onClick={() => model.load(samplePeopleCSV, "roster-people-sample.csv")}
              >
                <FileSpreadsheet />
                <span>
                  roster-people-sample.csv<small>3 rows · Use sample CSV</small>
                </span>
                <ArrowRight size={16} />
              </button>
              {model.rows.length > 0 && (
                <Alert variant="success">
                  <CheckCircle />
                  <AlertDescription>
                    {model.filename} is ready. {model.rows.length - 1} rows detected.
                  </AlertDescription>
                </Alert>
              )}
              <p className="ct-import-hint">
                Quoted fields and Windows, Unix and legacy line endings are supported.
              </p>
            </>
          ) : model.step === 2 ? (
            <>
              <h2>Map columns</h2>
              <p>Match each column to a field.</p>
              <DomainRecordGrid
                data={model.headers.map((header, index) => ({ id: String(index), header, index }))}
                getRowId={(row) => row.id}
                fields={[
                  {
                    id: "column",
                    title: "File column",
                    value: (row) => row.header,
                    render: (row) => (
                      <span>
                        {row.header}
                        {[1, 2, 3, 6].includes(model.mapping[row.index]) && (
                          <span className="text-destructive"> *</span>
                        )}
                      </span>
                    ),
                  },
                  { id: "sample", title: "Sample", value: (row) => model.rows[1]?.[row.index] },
                  {
                    id: "field",
                    title: "Person field",
                    value: (row) => model.mapping[row.index],
                    render: (row) => (
                      <Select
                        value={String(model.mapping[row.index])}
                        onValueChange={(value) =>
                          model.setMapping((mapping) =>
                            mapping.map((field, index) =>
                              index === row.index
                                ? Number(value)
                                : field === Number(value) && value !== "-1"
                                  ? -1
                                  : field,
                            ),
                          )
                        }
                      >
                        <SelectTrigger aria-label={`Map ${row.header}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="-1">Skip column</SelectItem>
                          {importFields.map((field, index) => (
                            <SelectItem key={field} value={String(index)}>
                              {field}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ),
                  },
                ]}
                pagination={{ pageIndex: 0, pageSize: 20 }}
              />
            </>
          ) : model.step === 3 ? (
            <>
              <h2>Preview rows</h2>
              <p>
                First {Math.min(10, model.preview.length)} of {model.preview.length} rows after
                mapping.
              </p>
              <DomainRecordGrid
                data={model.preview.slice(0, 10)}
                getRowId={(row) => row.id}
                fields={[
                  { id: "name", title: "Name", value: (row) => row.values[1] || "—" },
                  { id: "department", title: "Department", value: (row) => row.values[3] || "—" },
                  { id: "issue", title: "Issue", value: (row) => row.issues.join("; ") || "—" },
                  {
                    id: "status",
                    title: "Status",
                    value: (row) => (row.issues.length ? "Error" : "Valid"),
                    render: (row) => (
                      <Badge variant={row.issues.length ? "destructive-light" : "success-light"}>
                        {row.issues.length ? "Error" : "Valid"}
                      </Badge>
                    ),
                  },
                ]}
                pagination={{ pageIndex: 0, pageSize: 10 }}
              />
              <div className="ct-toolbar mt-4">
                <Badge variant="success-light">{model.valid.length} valid</Badge>
                <Badge variant="warning-light">0 warnings</Badge>
                <Badge variant="destructive-light">
                  {model.preview.length - model.valid.length} errors
                </Badge>
              </div>
              <label className="ct-import-key">
                Unique key
                <Select value={model.uniqueKey} onValueChange={model.setUniqueKey}>
                  <SelectTrigger aria-label="Import unique key">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full name">Full name</SelectItem>
                    <SelectItem value="Employee ID">Employee ID</SelectItem>
                  </SelectContent>
                </Select>
                <small>Rows are matched on this column.</small>
              </label>
            </>
          ) : model.step === 4 ? (
            <>
              <h2>Duplicate handling</h2>
              <p>
                {model.duplicates} {model.duplicates === 1 ? "row matches" : "rows match"} someone
                already on the roster by {model.uniqueKey.toLowerCase()}.
              </p>
              <div className="ct-import-modes">
                {(
                  [
                    ["Skip existing", "Safest", "Leave matched people exactly as they are."],
                    [
                      "Update existing",
                      "Recommended",
                      "Write the mapped fields onto the people they match.",
                    ],
                    ["Create new", "Risky", "Add every row as a new person, duplicates included."],
                  ] as const
                ).map(([value, badge, description]) => (
                  <label key={value}>
                    <input
                      type="radio"
                      name="duplicate-mode"
                      checked={model.mode === value}
                      onChange={() => model.setMode(value as DuplicateMode)}
                    />
                    <span>
                      <b>
                        {value}
                        <Badge variant={value === "Create new" ? "warning-light" : "secondary"}>
                          {badge}
                        </Badge>
                      </b>
                      <small>{description}</small>
                    </span>
                  </label>
                ))}
              </div>
            </>
          ) : (
            <>
              <h2>Run the import</h2>
              <p>Review before importing.</p>
              <Alert variant={model.valid.length ? "success" : "destructive"}>
                <Info />
                <AlertTitle>{model.valid.length ? "Ready to import" : "No valid rows"}</AlertTitle>
                <AlertDescription>
                  {model.valid.length - (model.mode === "Create new" ? 0 : model.duplicates)} people
                  join the roster, {model.mode === "Update existing" ? model.duplicates : 0}{" "}
                  updated, {model.mode === "Skip existing" ? model.duplicates : 0} skipped,{" "}
                  {model.preview.length - model.valid.length} held back with errors.
                </AlertDescription>
              </Alert>
              <section className="ct-import-plan">
                <h3>Import plan</h3>
                <dl>
                  {[
                    ["File", model.filename],
                    ["Object", "People"],
                    ["Matched on", model.uniqueKey],
                    ["Duplicates", model.mode],
                  ].map(([title, value]) => (
                    <div key={title}>
                      <dt>{title}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            </>
          )}
          {(model.error || errors.length > 0) && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{model.error || errors.join(" ")}</AlertDescription>
            </Alert>
          )}
        </FramePanel>
        {!model.result && (
          <div className="ct-import-footer">
            <span>
              {
                [
                  "Choose a file to begin.",
                  "Match each column to a person field.",
                  "Check what the file resolves to.",
                  "Choose how matches merge.",
                  "Run the import.",
                ][model.step - 1]
              }
            </span>
            <div className="ct-toolbar">
              <Button
                variant="outline"
                disabled={model.step === 1}
                onClick={() => {
                  model.setError("");
                  model.setStep(model.step - 1);
                }}
              >
                Back
              </Button>
              <Button
                disabled={busy || (model.step === 5 && !model.valid.length)}
                onClick={model.step === 5 ? model.run : next}
              >
                {model.step === 5 ? "Import" : "Next Step"}
              </Button>
            </div>
          </div>
        )}
      </Frame>
    </>
  );
}
