import { useState } from "react";
import { parseRecordsCSV } from "@/blocks/application/empty-variants/first-run/csv";

export const importFields = [
  "Employee ID",
  "Full name",
  "Job title",
  "Department",
  "Location",
  "Employment type",
  "Start date",
  "Manager (name)",
  "Date of birth",
];
export const samplePeopleCSV = [
  importFields.join(","),
  "p-901,Noor Haddad,VP Engineering,Engineering,London,Full-time,2026-09-01,Isabel Ferreira,1993-04-17",
  "p-902,Tomas Beaulieu,Engineer,Engineering,Lisbon,Full-time,2026-09-07,Noor Haddad,1995-08-23",
  "p-003,Amara Okafor,VP Engineering,Engineering,London,Full-time,2021-03-15,Isabel Ferreira,1990-06-12",
].join("\n");
export type ImportedPerson = { id: string; values: string[]; update: boolean };
export type DuplicateMode = "Skip existing" | "Update existing" | "Create new";

export function useRosterImportState(existingNames: string[]) {
  const [step, setStep] = useState(1);
  const [filename, setFilename] = useState("");
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<DuplicateMode>("Skip existing");
  const [uniqueKey, setUniqueKey] = useState("Full name");
  const [applied, setApplied] = useState<ImportedPerson[]>([]);
  const [result, setResult] = useState<{
    added: number;
    updated: number;
    skipped: number;
    errors: number;
  } | null>(null);
  const headers = rows[0] || [];
  function load(text: string, name: string) {
    try {
      const parsed = parseRecordsCSV(text, { maxColumns: 9 });
      setRows(parsed);
      setFilename(name);
      setMapping(
        parsed[0].map((header) =>
          importFields.findIndex(
            (field) =>
              field.toLowerCase().replace(" (name)", "") ===
              header.toLowerCase().replace(" (name)", ""),
          ),
        ),
      );
      setStep(1);
      setResult(null);
      setError("");
    } catch (issue) {
      setRows([]);
      setFilename(name);
      setError(issue instanceof Error ? issue.message : "Unable to read this CSV file.");
    }
  }
  const preview = rows.slice(1).map((source, index) => {
    const values = importFields.map((_, field) => source[mapping.indexOf(field)] || "");
    const issues = [1, 2, 3, 6]
      .filter((field) => !values[field])
      .map((field) => `${importFields[field]} is required`);
    if (
      values[6] &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(values[6]) || Number.isNaN(Date.parse(values[6])))
    )
      issues.push("Start date must use YYYY-MM-DD");
    return { id: `preview-${index}`, values, issues };
  });
  const valid = preview.filter((row) => !row.issues.length);
  const keyIndex = uniqueKey === "Employee ID" ? 0 : 1;
  function isDuplicate(values: string[], previous: string[][] = []) {
    const key = values[keyIndex].trim().toLowerCase();
    return (
      !!key &&
      ((keyIndex === 1 && existingNames.some((name) => name.toLowerCase() === key)) ||
        applied.some((person) => person.values[keyIndex].trim().toLowerCase() === key) ||
        previous.some((row) => row[keyIndex].trim().toLowerCase() === key))
    );
  }
  const duplicates = valid.filter((row, index) =>
    isDuplicate(
      row.values,
      valid.slice(0, index).map((r) => r.values),
    ),
  ).length;
  function run() {
    if (result) return;
    const changes: ImportedPerson[] = [];
    let skipped = 0;
    let updated = 0;
    let added = 0;
    valid.forEach((row, index) => {
      const duplicate = isDuplicate(
        row.values,
        valid.slice(0, index).map((r) => r.values),
      );
      if (duplicate && mode === "Skip existing") {
        skipped++;
        return;
      }
      const update = duplicate && mode === "Update existing";
      if (update) updated++;
      else added++;
      changes.push({ id: `import-${Date.now()}-${index}`, values: row.values, update });
    });
    setApplied((previous) => {
      let next = [...previous];
      for (const change of changes) {
        const match = change.update
          ? next.findIndex(
              (p) => p.values[keyIndex].toLowerCase() === change.values[keyIndex].toLowerCase(),
            )
          : -1;
        if (match >= 0)
          next = next.map((person, index) =>
            index === match ? { ...change, id: person.id, update: person.update } : person,
          );
        else next.push(change);
      }
      return next;
    });
    setResult({ added, updated, skipped, errors: preview.length - valid.length });
  }
  return {
    step,
    setStep,
    filename,
    rows,
    headers,
    mapping,
    setMapping,
    error,
    setError,
    mode,
    setMode,
    uniqueKey,
    setUniqueKey,
    applied,
    setApplied,
    result,
    setResult,
    preview,
    valid,
    duplicates,
    load,
    run,
  };
}
export type RosterImportState = ReturnType<typeof useRosterImportState>;
