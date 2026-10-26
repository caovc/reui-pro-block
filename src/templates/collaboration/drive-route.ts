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
      window.location.hash = driveRouteHref(window.location.hash, templateId, destination);
    },
    [templateId],
  );
  return {
    route: readDriveRoute(hash, templateId),
    href: (destination: DriveRoute) => driveRouteHref(hash, templateId, destination),
    navigate,
  };
}
