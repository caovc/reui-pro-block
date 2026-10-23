/** CSV records are domain content; file selection/validation uses the actual free REUI hook. */
export function parseRecordsCSV(text: string): string[][] {
  const rows: string[][] = [];
  let cells: string[] = [];
  let value = "";
  let quoted = false;
  const input = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (char === '"') {
      if (quoted && input[i + 1] === '"') {
        value += '"';
        i++;
      } else if (!value || quoted) {
        quoted = !quoted;
      } else {
        throw new Error("Quotes must surround the entire field.");
      }
    } else if (!quoted && (char === "," || char === "\n" || char === "\r")) {
      cells.push(value.trim());
      value = "";
      if (char !== ",") {
        if (cells.some(Boolean)) rows.push(cells);
        cells = [];
        if (char === "\r" && input[i + 1] === "\n") i++;
      }
    } else {
      value += char;
    }
  }
  if (quoted) throw new Error("A quoted CSV field is missing its closing quote.");
  cells.push(value.trim());
  if (cells.some(Boolean)) rows.push(cells);
  if (rows.length < 2) throw new Error("Include a header row and at least one record.");
  const columns = rows[0].length;
  if (columns > 8) throw new Error("This demo supports up to 8 columns.");
  if (rows.some((row) => row.length !== columns)) {
    throw new Error("Every record must have the same number of fields as the header.");
  }
  if (rows.length > 201) throw new Error("This demo supports up to 200 records.");
  return rows;
}
