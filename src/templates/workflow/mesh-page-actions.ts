import { toast } from "sonner";

/** Preview links preserve the actual template route and local document ID. */
export function meshPageLink(documentId?: string, viewOnly = false) {
  const url = new URL(window.location.href);
  if (documentId) {
    url.searchParams.set("doc", documentId);
    url.searchParams.delete("page");
  } else {
    url.searchParams.delete("doc");
    url.searchParams.set("page", "canvas");
  }
  if (viewOnly) url.searchParams.set("mode", "view");
  else url.searchParams.delete("mode");
  return url.href;
}

export async function copyMeshText(text: string, message: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(message);
  } catch {
    toast.error("Copy is unavailable. Select the text and use your browser's copy command.");
  }
}
