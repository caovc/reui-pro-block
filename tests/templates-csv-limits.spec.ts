import { expect, test } from "@playwright/test";
import { parseRecordsCSV } from "../src/blocks/application/empty-variants/first-run/csv";

test("CSV defaults retain the eight-column boundary while Roster explicitly accepts nine", () => {
  const csv =
    "name,email,team,role,manager,location,start,status,type\nNora,nora@example.com,Design,Designer,Leo,London,2026-10-01,Active,Full time";
  expect(() => parseRecordsCSV(csv)).toThrow("This demo supports up to 8 columns.");
  const rows = parseRecordsCSV(csv, { maxColumns: 9 });
  expect(rows).toHaveLength(2);
  expect(rows[1]).toEqual([
    "Nora",
    "nora@example.com",
    "Design",
    "Designer",
    "Leo",
    "London",
    "2026-10-01",
    "Active",
    "Full time",
  ]);
});

test("CSV limits preserve BOM, CRLF, quoted commas, escaped quotes and embedded newlines", () => {
  const rows = parseRecordsCSV(
    '\uFEFFname,notes\r\n"Nora, Vale","Said ""ready""\r\nPanel complete"\r\n',
    { maxColumns: 9 },
  );
  expect(rows).toEqual([
    ["name", "notes"],
    ["Nora, Vale", 'Said "ready"\r\nPanel complete'],
  ]);
  expect(() => parseRecordsCSV("name,notes\nNora", { maxColumns: 9 })).toThrow(
    "Every record must have the same number of fields as the header.",
  );
  expect(() => parseRecordsCSV('name,notes\nNora,"Unfinished', { maxColumns: 9 })).toThrow(
    "A quoted CSV field is missing its closing quote.",
  );
});

test("CSV defaults still cap data at 200 records and custom record limits apply independently", () => {
  const make = (length: number) =>
    "name\n" + Array.from({ length }, (_, index) => `Person ${index + 1}`).join("\n");
  expect(parseRecordsCSV(make(200))).toHaveLength(201);
  expect(() => parseRecordsCSV(make(201))).toThrow("This demo supports up to 200 records.");
  expect(() => parseRecordsCSV(make(201), { maxColumns: 9 })).toThrow(
    "This demo supports up to 200 records.",
  );
  expect(parseRecordsCSV(make(2), { maxRecords: 2 })).toHaveLength(3);
  expect(() => parseRecordsCSV(make(3), { maxRecords: 2 })).toThrow(
    "This demo supports up to 2 records.",
  );
});
