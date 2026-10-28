import { useCallback, useEffect, useRef, useState } from "react";
import { useFileUpload } from "@/hooks/use-file-upload";
import {
  createCommerceGeneralDefaults,
  type CommerceGeneralValues,
} from "./commerce-settings-general-data";

type CommerceGeneralErrors = Partial<Record<keyof CommerceGeneralValues, string>>;
type LogoURLResult = { ok: true } | { ok: false; error: string };
const excludedLogoHosts = ["reui.io", "reui.com", "keenthemes.com", "keenthemes.io"];

function logoURL(raw: string): { url: string } | { error: string } {
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== "https:" || url.username || url.password) {
      return { error: "Use an HTTPS image URL without sign-in details." };
    }
    const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
    if (excludedLogoHosts.some((host) => hostname === host || hostname.endsWith(`.${host}`))) {
      return { error: "Use your own image. ReUI and KeenThemes preview assets are excluded." };
    }
    return { url: url.href };
  } catch {
    return { error: "Enter a complete HTTPS image URL." };
  }
}

/** Local saved/draft state only. The parent keeps this model mounted across settings pages. */
export function useCommerceGeneralSettingsModel() {
  const [saved, setSaved] = useState(createCommerceGeneralDefaults);
  const [draft, setDraft] = useState(createCommerceGeneralDefaults);
  const [errors, setErrors] = useState<CommerceGeneralErrors>({});
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState("");
  const reader = useRef<FileReader | null>(null);
  const request = useRef(0);
  const previews = useRef(new Set<string>());

  const releasePreviews = useCallback(() => {
    for (const preview of previews.current) URL.revokeObjectURL(preview);
    previews.current.clear();
  }, []);

  const stopRead = useCallback(() => {
    request.current += 1;
    reader.current?.abort();
    reader.current = null;
    setPending(false);
  }, []);

  const readLogo = useCallback((file: File) => {
    const version = ++request.current;
    reader.current?.abort();
    const nextReader = new FileReader();
    reader.current = nextReader;
    setPending(true);
    setStatus("");
    setErrors((current) => ({ ...current, logo: undefined }));
    nextReader.onload = () => {
      if (version !== request.current) return;
      if (typeof nextReader.result === "string") {
        const logo = nextReader.result;
        setDraft((current) => ({ ...current, logo }));
      } else {
        setErrors((current) => ({ ...current, logo: "The image could not be read." }));
      }
      reader.current = null;
      setPending(false);
    };
    nextReader.onerror = () => {
      if (version !== request.current) return;
      reader.current = null;
      setErrors((current) => ({
        ...current,
        logo: "The image could not be read. Choose another image.",
      }));
      setPending(false);
    };
    nextReader.readAsDataURL(file);
  }, []);

  // Use the actual official selection/type/size validation hook. Its object URLs
  // are not persisted: the saved model holds a data URL or an explicit user URL.
  const [uploadState, upload] = useFileUpload({
    accept: "image/*",
    maxFiles: 1,
    multiple: false,
    maxSize: 2 * 1024 * 1024,
    onFilesAdded: (files) => {
      for (const entry of files) {
        if (entry.preview?.startsWith("blob:")) previews.current.add(entry.preview);
      }
      const file = files[0]?.file;
      if (file instanceof File) readLogo(file);
    },
  });

  useEffect(() => {
    const currentPreviews = previews.current;
    return () => {
      request.current += 1;
      reader.current?.abort();
      for (const preview of currentPreviews) URL.revokeObjectURL(preview);
      currentPreviews.clear();
    };
  }, []);

  const change = useCallback(
    <K extends keyof CommerceGeneralValues>(key: K, value: CommerceGeneralValues[K]) => {
      setDraft((current) => ({ ...current, [key]: value }));
      setErrors((current) => ({ ...current, [key]: undefined }));
      setStatus("");
    },
    [],
  );

  function clearUpload() {
    upload.clearFiles();
    releasePreviews();
  }

  function save() {
    if (pending) return false;
    const nextErrors: CommerceGeneralErrors = {};
    const name = draft.name.trim();
    const domain = draft.domain.trim();
    if (!name) nextErrors.name = "Enter a store name.";
    try {
      const url = new URL(`https://${domain}`);
      if (!domain || /\s|:\/\//.test(domain) || url.pathname !== "/" || url.search || url.hash) {
        nextErrors.domain = "Enter a storefront domain without https:// or a path.";
      }
    } catch {
      nextErrors.domain = "Enter a valid storefront domain.";
    }
    if (errors.logo) nextErrors.logo = errors.logo;
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return false;
    const next = { ...draft, name, domain };
    setSaved({ ...next });
    setDraft({ ...next });
    clearUpload();
    setStatus("Store settings saved in this local preview.");
    return true;
  }

  function cancel() {
    stopRead();
    clearUpload();
    setDraft({ ...saved });
    setErrors({});
    setStatus("");
  }

  function reset() {
    stopRead();
    clearUpload();
    const defaults = createCommerceGeneralDefaults();
    setSaved({ ...defaults });
    setDraft({ ...defaults });
    setErrors({});
    setStatus("Store settings reset to the local defaults.");
  }

  function importLogoURL(raw: string): LogoURLResult {
    const result = logoURL(raw);
    if ("error" in result) return { ok: false, error: result.error };
    stopRead();
    clearUpload();
    change("logo", result.url);
    return { ok: true };
  }

  function reportLogoLoadError() {
    setErrors((current) => ({
      ...current,
      logo: "The logo preview could not be loaded. Choose another image or URL.",
    }));
  }

  return {
    saved,
    draft,
    errors,
    pending,
    status,
    headerName: saved.name,
    dirty: JSON.stringify(saved) !== JSON.stringify(draft),
    change,
    save,
    cancel,
    reset,
    readLogo,
    importLogoURL,
    reportLogoLoadError,
    upload,
    uploadErrors: uploadState.errors,
  };
}

export type CommerceGeneralSettingsModel = ReturnType<typeof useCommerceGeneralSettingsModel>;
