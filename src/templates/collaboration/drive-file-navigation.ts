import type { FileRecord } from "./drive";
import type { DriveHeaderTarget } from "./drive-header-data";
import type { DriveLocation, DriveRoute, DriveView } from "./drive-route-model";

type TreeFolder = { id: string; name: string };
export type DriveHeaderBindings = ReadonlyMap<string, DriveLocation>;
export type DriveFileDestination =
  | { status: "ready"; view: string; file: FileRecord | null }
  | { status: "unavailable" | "ambiguous"; message: string };

export function isDriveView(name: string): name is DriveView {
  return ["My Drive", "Shared With Me", "Favourites", "Bin", "Recent"].includes(name);
}

/** Capture existing IDs once so renaming/deleting a fixture never retargets its link. */
export function createDriveHeaderBindings(
  files: readonly FileRecord[],
  treeFolders: readonly TreeFolder[],
): DriveHeaderBindings {
  const bindings = new Map<string, DriveLocation>();
  for (const name of new Set([
    ...files.map((file) => file.name),
    ...treeFolders.map((node) => node.name),
  ])) {
    const folderRecords = files.filter((file) => file.type === "Folder" && file.name === name);
    const documentRecords = files.filter((file) => file.type !== "Folder" && file.name === name);
    const folders = folderRecords.filter((file) => !file.deleted);
    const documents = documentRecords.filter((file) => !file.deleted);
    const nodes = treeFolders.filter((node) => node.name === name);
    if (folders.length === 1) {
      bindings.set(`folder:${name}`, { kind: "folder", source: "record", id: folders[0]!.id });
    } else if (folders.length === 0 && folderRecords.length === 1) {
      bindings.set(`folder:${name}`, {
        kind: "folder",
        source: "record",
        id: folderRecords[0]!.id,
      });
    } else if (folderRecords.length === 0 && nodes.length === 1) {
      bindings.set(`folder:${name}`, { kind: "folder", source: "tree", id: nodes[0]!.id });
    }
    if (documents.length === 1)
      bindings.set(`file:${name}`, { kind: "file", id: documents[0]!.id });
    else if (documents.length === 0 && documentRecords.length === 1)
      bindings.set(`file:${name}`, { kind: "file", id: documentRecords[0]!.id });
  }
  return bindings;
}

export function driveFolderLocation(
  name: string,
  files: readonly FileRecord[],
  treeFolders: readonly TreeFolder[],
  bindings: DriveHeaderBindings,
): DriveLocation {
  if (isDriveView(name)) return { kind: "view", view: name };
  const bound = bindings.get(`folder:${name}`);
  if (bound) return bound;
  const allRecords = files.filter((file) => file.type === "Folder" && file.name === name);
  const records = allRecords.filter((file) => !file.deleted);
  if (records.length === 0 && allRecords.length === 1)
    return { kind: "folder", source: "record", id: allRecords[0]!.id };
  if (records.length === 1) return { kind: "folder", source: "record", id: records[0]!.id };
  const nodes = treeFolders.filter((node) => node.name === name);
  if (allRecords.length === 0 && nodes.length === 1)
    return { kind: "folder", source: "tree", id: nodes[0]!.id };
  return { kind: "lookup", entity: "folder", name };
}

export function driveHeaderRoute(
  target: DriveHeaderTarget,
  files: readonly FileRecord[],
  treeFolders: readonly TreeFolder[],
  bindings: DriveHeaderBindings,
): DriveRoute {
  if (target.kind === "settings") return target;
  if (target.kind === "view") return { kind: "files", location: target };
  if (target.kind === "folder") {
    return {
      kind: "files",
      location: driveFolderLocation(target.name, files, treeFolders, bindings),
    };
  }
  const bound = bindings.get(`file:${target.name}`);
  if (bound) return { kind: "files", location: bound };
  const records = files.filter(
    (file) => file.type !== "Folder" && file.name === target.name && !file.deleted,
  );
  return {
    kind: "files",
    location:
      records.length === 1
        ? { kind: "file", id: records[0]!.id }
        : { kind: "lookup", entity: "file", name: target.name },
  };
}

export function resolveDriveFileDestination(
  location: DriveLocation | undefined,
  files: readonly FileRecord[],
  treeFolders: readonly TreeFolder[],
  defaultView: DriveView,
  bindings: DriveHeaderBindings,
): DriveFileDestination {
  const unavailable = (message: string): DriveFileDestination => ({
    status: "unavailable",
    message,
  });
  if (!location) return { status: "ready", view: defaultView, file: null };
  if (location.kind === "view") return { status: "ready", view: location.view, file: null };
  if (location.kind === "file") {
    const file = files.find(
      (entry) => entry.id === location.id && entry.type !== "Folder" && !entry.deleted,
    );
    return file
      ? { status: "ready", view: file.parent, file }
      : unavailable("This file is unavailable or has been removed from this local demo.");
  }
  if (location.kind === "folder") {
    if (location.source === "record") {
      const folder = files.find(
        (entry) => entry.id === location.id && entry.type === "Folder" && !entry.deleted,
      );
      return folder
        ? { status: "ready", view: folder.name, file: null }
        : unavailable("This folder is unavailable or has been removed from this local demo.");
    }
    const node = treeFolders.find((entry) => entry.id === location.id);
    if (!node) return unavailable("This folder does not exist in this local demo.");
    // A deleted real folder must not reappear through the static tree namespace.
    const bound = bindings.get(`folder:${node.name}`);
    if (bound?.kind === "folder" && bound.source === "record") {
      return resolveDriveFileDestination(bound, files, treeFolders, defaultView, bindings);
    }
    const allRecords = files.filter((entry) => entry.type === "Folder" && entry.name === node.name);
    const records = allRecords.filter((entry) => !entry.deleted);
    if (records.length > 1)
      return {
        status: "ambiguous",
        message: "More than one folder has this name. Open a specific folder from Drive.",
      };
    if (records.length === 1) {
      return resolveDriveFileDestination(
        { kind: "folder", source: "record", id: records[0]!.id },
        files,
        treeFolders,
        defaultView,
        bindings,
      );
    }
    if (allRecords.length > 0)
      return unavailable("This folder has been removed from this local demo.");
    return { status: "ready", view: node.name, file: null };
  }
  const allMatches = files.filter(
    (entry) =>
      entry.name === location.name && (entry.type === "Folder") === (location.entity === "folder"),
  );
  const matches = allMatches.filter((entry) => !entry.deleted);
  if (matches.length > 1)
    return {
      status: "ambiguous",
      message: "More than one record has this name. Open a specific record from Drive.",
    };
  if (matches.length === 1) {
    const record = matches[0]!;
    return resolveDriveFileDestination(
      location.entity === "folder"
        ? { kind: "folder", source: "record", id: record.id }
        : { kind: "file", id: record.id },
      files,
      treeFolders,
      defaultView,
      bindings,
    );
  }
  if (allMatches.length > 0)
    return unavailable("This record has been removed from this local demo.");
  if (location.entity === "folder") {
    const nodes = treeFolders.filter((entry) => entry.name === location.name);
    if (nodes.length === 1)
      return resolveDriveFileDestination(
        { kind: "folder", source: "tree", id: nodes[0]!.id },
        files,
        treeFolders,
        defaultView,
        bindings,
      );
  }
  return unavailable("This record could not be found in this local demo.");
}
