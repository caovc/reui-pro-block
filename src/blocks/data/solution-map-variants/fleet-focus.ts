import { useCallback, useLayoutEffect, useMemo, useRef, type RefObject } from "react";

type Layer = "fleet" | "vehicle" | "action" | "command" | "exceptions";
type OpenLayers = Record<Layer, boolean>;

function available(element: HTMLElement | null | undefined): element is HTMLElement {
  return !!(
    element?.isConnected &&
    element.getClientRects().length &&
    !element.matches(":disabled, [aria-disabled='true']") &&
    !element.closest("[inert]")
  );
}

// The overlays retain their actual native focus scopes. This stores the opener
// for controlled consumer surfaces, which have no native Trigger of their own.
export function useDispatchFocus(
  open: OpenLayers,
  fallback: RefObject<HTMLButtonElement | null>,
  placing: boolean,
) {
  const latest = useRef({ open, placing });
  useLayoutEffect(() => {
    latest.current = { open, placing };
  }, [open, placing]);
  const serial = useRef(0);
  const origins = useRef<
    Partial<
      Record<
        Layer,
        { element: HTMLElement | null; serial: number; resolve?: () => HTMLElement | null }
      >
    >
  >({});

  const capture = useCallback(
    (
      layer: Layer,
      origin: Element | null = document.activeElement,
      resolve?: () => HTMLElement | null,
    ) => {
      let element = origin instanceof HTMLElement ? origin : null;
      const menu = element?.closest<HTMLElement>('[role="menu"]');
      if (menu?.id) {
        // A menu item unmounts after selection; its real native trigger persists.
        element =
          Array.from(document.querySelectorAll<HTMLElement>('[aria-haspopup="menu"]')).find(
            (trigger) => trigger.getAttribute("aria-controls") === menu.id,
          ) ?? element;
      }
      origins.current[layer] = { element, resolve, serial: ++serial.current };
    },
    [],
  );

  const inherit = useCallback(
    (layer: Layer, source: Layer) => {
      capture(layer, origins.current[source]?.element ?? fallback.current);
    },
    [capture, fallback],
  );

  const restore = useCallback(
    (layer: Layer, event: Event) => {
      event.preventDefault();
      if (latest.current.open[layer] || latest.current.placing) return;
      const origin = origins.current[layer];
      const opener = available(origin?.element) ? origin.element : origin?.resolve?.();
      const parent = (Object.keys(latest.current.open) as Layer[])
        .filter((name) => name !== layer && latest.current.open[name])
        .sort((a, b) => (origins.current[b]?.serial ?? 0) - (origins.current[a]?.serial ?? 0))[0];
      if (parent) {
        // A newly opened destination owns autofocus; an old layer cannot reclaim it.
        if ((origins.current[parent]?.serial ?? 0) > (origin?.serial ?? 0)) return;
        const surface = document.querySelector<HTMLElement>(
          `[data-dm-focus-layer="${parent}"][data-state="open"]`,
        );
        if (!surface) return;
        if (available(opener) && surface.contains(opener)) opener.focus();
        else (surface.querySelector<HTMLElement>("[data-dm-focus-fallback]") ?? surface).focus();
        return;
      }
      if (available(opener)) opener.focus();
      else if (available(fallback.current)) fallback.current.focus();
    },
    [fallback],
  );

  return useMemo(() => ({ capture, inherit, restore }), [capture, inherit, restore]);
}
