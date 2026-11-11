import { lazy, Suspense, useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { getUiPresetUrl, navigateToUiPrimitive, uiFoundation } from "@/lib/ui-foundation";
import { applyTheme } from "./preview-theme";
import {
  closeGlobalCustomizer,
  openGlobalCustomizer,
  reopenCustomizerKey,
  restoreCustomizerFocus,
  setGlobalTheme,
  syncGlobalThemeFromUrl,
  useGlobalTheme,
} from "./global-theme-store";
import "./global-theme.css";
const PreviewCustomizer = lazy(() =>
  import("./preview-customizer").then((m) => ({ default: m.PreviewCustomizer })),
);

export function GlobalCustomizeButton({ compact = false }: { compact?: boolean }) {
  const { customizerOpen } = useGlobalTheme();
  return (
    <Button
      variant="outline"
      size={compact ? "icon-xs" : "sm"}
      aria-label="Customize"
      aria-controls="preview-customizer"
      aria-expanded={customizerOpen}
      onClick={(event) =>
        customizerOpen ? closeGlobalCustomizer() : openGlobalCustomizer(event.currentTarget)
      }
    >
      <SlidersHorizontal />
      {!compact && <span className="hidden md:inline">Customize</span>}
    </Button>
  );
}
export function GlobalThemeRoot({ children }: { children: ReactNode }) {
  const { theme, dark, customizerOpen } = useGlobalTheme();
  const [mobile, setMobile] = useState(() => matchMedia("(max-width: 1023px)").matches);
  const [hash, setHash] = useState(location.hash);
  useLayoutEffect(() => {
    applyTheme(theme, dark);
  }, [theme, dark]);
  useEffect(() => {
    if (window.parent !== window || theme.primitive === uiFoundation.primitive) return;
    if (customizerOpen) {
      try {
        sessionStorage.setItem(reopenCustomizerKey, "true");
      } catch {
        // The library can still switch when session storage is unavailable.
      }
    }
    navigateToUiPrimitive(theme.primitive, theme);
  }, [theme, customizerOpen]);
  useEffect(() => {
    const media = matchMedia("(max-width: 1023px)");
    const resize = () => setMobile(media.matches);
    const navigate = () => setHash(location.hash);
    media.addEventListener("change", resize);
    window.addEventListener("hashchange", navigate);
    // Opening an explicit preset is a global choice. Ordinary iframe loading
    // only reads storage and must never overwrite a newer parent selection.
    if (window.parent === window) syncGlobalThemeFromUrl();
    return () => {
      media.removeEventListener("change", resize);
      window.removeEventListener("hashchange", navigate);
    };
  }, []);
  const isolated = /^#\/(preview|template-preview)\//.test(hash);
  const templateWorkspace = /^#\/templates\/[^/?]+/.test(hash);
  const presetLink = getUiPresetUrl(theme).href;
  const panel = (
    <Suspense
      fallback={
        <div className="global-theme-loading" role="status">
          Loading customizer…
        </div>
      }
    >
      <PreviewCustomizer
        theme={theme}
        onChange={setGlobalTheme}
        onClose={closeGlobalCustomizer}
        presetLink={presetLink}
      />
    </Suspense>
  );
  return (
    <div
      className="global-theme-host"
      data-customizer-open={!isolated && customizerOpen && !mobile}
      data-template-workspace={templateWorkspace}
    >
      {children}
      {!isolated && customizerOpen && !mobile && (
        <div
          className="global-theme-rail"
          onKeyDown={(event) => {
            if (event.key === "Escape" && !event.defaultPrevented) {
              event.preventDefault();
              closeGlobalCustomizer();
            }
          }}
        >
          {panel}
        </div>
      )}
      {!isolated && mobile && (
        <Sheet open={customizerOpen} onOpenChange={(open) => !open && closeGlobalCustomizer()}>
          <SheetContent
            side="left"
            className="global-theme-mobile"
            showCloseButton={false}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              restoreCustomizerFocus();
            }}
          >
            <SheetTitle className="sr-only">Customize global theme</SheetTitle>
            <SheetDescription className="sr-only">
              Appearance settings for all Bricklane previews.
            </SheetDescription>
            {customizerOpen && panel}
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
