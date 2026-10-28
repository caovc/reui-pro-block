import { useCallback, useSyncExternalStore } from "react";
import {
  driveRouteHref,
  readDriveRoute,
  type DriveRoute,
  type DriveTemplateId,
} from "./drive-route-model";

function subscribe(listener: () => void) {
  window.addEventListener("hashchange", listener);
  window.addEventListener("popstate", listener);
  return () => {
    window.removeEventListener("hashchange", listener);
    window.removeEventListener("popstate", listener);
  };
}

function snapshot() {
  return window.location.hash;
}

export function useDriveRoute(templateId: DriveTemplateId) {
  const hash = useSyncExternalStore(subscribe, snapshot, () => "");
  const navigate = useCallback(
    (destination: DriveRoute) => {
      const origin = window.location.hash;
      const target = driveRouteHref(origin, templateId, destination);
      if (origin === target) return;
      window.location.hash = target;
      if (destination.kind === "files" && destination.location?.kind === "file") {
        // Native hash navigation created this entry. Its own metadata survives Back/Forward.
        window.history.replaceState(
          {
            ...(window.history.state && typeof window.history.state === "object"
              ? window.history.state
              : {}),
            bricklaneDrivePreview: {
              templateId,
              target,
              origin: driveRouteHref(origin, templateId, readDriveRoute(origin, templateId)),
            },
          },
          "",
          target,
        );
      }
    },
    [templateId],
  );
  const closePreview = useCallback(
    (fallback: DriveRoute) => {
      const entry = window.history.state?.bricklaneDrivePreview;
      const origin =
        typeof entry?.origin === "string" ? readDriveRoute(entry.origin, templateId) : null;
      const validOrigin =
        origin &&
        origin.kind !== "missing" &&
        origin.kind !== "login" &&
        driveRouteHref(window.location.hash, templateId, origin) === entry.origin;
      if (
        entry?.templateId === templateId &&
        entry.target === window.location.hash &&
        validOrigin &&
        window.history.length > 1
      ) {
        window.history.back();
        return;
      }
      // A direct copied link has no known local predecessor. Never leave the app via blind Back.
      const target = driveRouteHref(window.location.hash, templateId, fallback);
      window.history.replaceState(null, "", target);
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    },
    [templateId],
  );
  return {
    route: readDriveRoute(hash, templateId),
    href: (destination: DriveRoute) => driveRouteHref(hash, templateId, destination),
    navigate,
    closePreview,
  };
}
