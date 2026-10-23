export function downloadContent(name: string, value: string | Blob, type = "text/plain") {
  const url = URL.createObjectURL(value instanceof Blob ? value : new Blob([value], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
