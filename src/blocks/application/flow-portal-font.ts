import { useLayoutEffect, useState, type CSSProperties, type RefObject } from "react";

type FlowPortalFontStyle = CSSProperties & {
  "--fg-inspector-origin-font-family": string;
  "--fg-inspector-origin-font-sans": string;
};

/** Supplies instance-local font fallbacks without overriding explicit theme rules. */
export function useFlowPortalFont(
  originRef: RefObject<HTMLElement | null>,
  enabled: boolean,
): CSSProperties | undefined {
  const [fontStyle, setFontStyle] = useState<FlowPortalFontStyle>();

  useLayoutEffect(() => {
    if (!enabled) return;

    const origin = originRef.current;
    const ownerDocument = origin?.ownerDocument;
    const view = ownerDocument?.defaultView;
    if (!origin || !ownerDocument || !view) return;

    const syncFont = () => {
      if (!origin.isConnected) return;

      const computed = view.getComputedStyle(origin);
      const fontFamily = computed.fontFamily;
      const fontSans = computed.getPropertyValue("--font-sans").trim() || fontFamily;

      setFontStyle((previous) => {
        if (
          previous?.["--fg-inspector-origin-font-family"] === fontFamily &&
          previous["--fg-inspector-origin-font-sans"] === fontSans
        ) {
          return previous;
        }

        return {
          "--fg-inspector-origin-font-family": fontFamily,
          "--fg-inspector-origin-font-sans": fontSans,
        };
      });
    };

    let presetObserver: MutationObserver | undefined;
    let headObserver: MutationObserver | undefined;

    const observePreset = () => {
      const preset = ownerDocument.getElementById("preview-preset");
      if (!(preset instanceof view.HTMLStyleElement)) return false;

      presetObserver = new view.MutationObserver(syncFont);
      presetObserver.observe(preset, {
        childList: true,
        characterData: true,
        subtree: true,
      });

      headObserver?.disconnect();
      headObserver = undefined;
      syncFont();
      return true;
    };

    syncFont();

    if (!observePreset() && ownerDocument.head) {
      // Standalone exports need no site theme dependency. If the host installs
      // its preset later, switch from this shallow head watch to that style only.
      headObserver = new view.MutationObserver(() => {
        observePreset();
      });
      headObserver.observe(ownerDocument.head, { childList: true });
    }

    return () => {
      presetObserver?.disconnect();
      headObserver?.disconnect();
    };
  }, [enabled, originRef]);

  return enabled ? fontStyle : undefined;
}
