import { toast } from "sonner";

export async function copyDriveMemberValue(value: string, label: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  } catch {
    toast.error("Copy failed", { description: "Clipboard access was blocked." });
  }
}

/** Consumer adaptation of the repository's receipt-data.ts PDF serializer.
 * The existing exported helper closes over unrelated receipt data/images and accepts no data.
 * ASCII normalization makes string offsets identical to byte offsets; no PDF dependency or assets.
 */
export function createDrivePdf(lines: readonly string[]) {
  const ascii = lines.flatMap(
    (line) =>
      line
        .normalize("NFKD")
        .replace(/[^\x20-\x7E]/g, "-")
        .match(/.{1,88}/g) ?? [""],
  );
  const escape = (line: string) =>
    line.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
  const stream = `BT /F1 10 Tf 45 795 Td 14 TL ${ascii.map((line, index) => `${index ? "T* " : ""}(${escape(line)}) Tj`).join("\n")} ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = "%PDF-1.7\n";
  const offsets = [0];
  for (const [index, object] of objects.entries()) {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`)
    .join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}
export function downloadDrivePdf(name: string, lines: readonly string[]) {
  const bytes = createDrivePdf(lines);
  const url = URL.createObjectURL(
    new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
