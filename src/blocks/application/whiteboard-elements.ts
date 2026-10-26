import { convertToExcalidrawElements, newElementWith } from "@excalidraw/excalidraw";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { ExcalidrawElementSkeleton } from "@excalidraw/excalidraw/data/transform";
import type { Scene, Shape } from "./whiteboard-data";

export function sceneElements(scene: Scene): ExcalidrawElement[] {
  if (scene.native) return [...scene.native];
  const flow = scene.shapes.some((shape) => shape.id === "node0");
  const clean = scene.name.includes("Sprint");
  const fontFamily = clean ? 6 : 5;
  const labels: Record<string, string> = { arrow2: "yes", arrow3: "pay", arrow4: "no" };
  const shapes = flow
    ? scene.shapes.filter((shape) => !["yes", "pay", "no", "arrow6"].includes(shape.id))
    : scene.shapes;
  const frames = shapes.filter((shape) => shape.kind === "frame");
  const bindables = shapes.filter((shape) => ["rect", "diamond", "ellipse"].includes(shape.kind));
  function nearest(x: number, y: number) {
    return bindables.find(
      (shape) =>
        Math.hypot(
          Math.max(shape.x - x, 0, x - shape.x - shape.w),
          Math.max(shape.y - y, 0, y - shape.y - shape.h),
        ) < 26,
    )?.id;
  }
  const skeletons: ExcalidrawElementSkeleton[] = [];
  for (const shape of shapes) {
    const frame = frames.find(
      (item) =>
        item.id !== shape.id &&
        shape.x >= item.x &&
        shape.y >= item.y &&
        shape.x + shape.w <= item.x + item.w + 1 &&
        shape.y + shape.h <= item.y + item.h + 1,
    );
    const common = {
      id: shape.id,
      x: shape.x,
      y: shape.y,
      width: Math.max(1, Math.abs(shape.w)),
      height: Math.max(1, Math.abs(shape.h)),
      strokeColor: "#34343a",
      backgroundColor: shape.color || "transparent",
      fillStyle: "solid" as const,
      strokeWidth: 1.5,
      roughness: clean ? 0 : 1,
      frameId: frame?.id || null,
      customData: { bricklaneShape: shape },
      seed: Math.abs([...shape.id].reduce((hash, char) => hash * 31 + char.charCodeAt(0), 1) | 0),
    };
    if (shape.kind === "frame")
      skeletons.push({
        ...common,
        type: "frame",
        children: shapes
          .filter(
            (child) =>
              child.id !== shape.id &&
              child.x >= shape.x &&
              child.y >= shape.y &&
              child.x + child.w <= shape.x + shape.w + 1 &&
              child.y + child.h <= shape.y + shape.h + 1,
          )
          .map((child) => child.id),
        name: shape.text,
        strokeColor: "#b9b9c0",
        roughness: 0,
      });
    else if (shape.kind === "text")
      skeletons.push({
        ...common,
        type: "text",
        text: shape.text || "",
        fontSize: 20,
        fontFamily,
      });
    else if (shape.kind === "arrow" || shape.kind === "line")
      skeletons.push({
        ...common,
        type: shape.kind,
        width: shape.w,
        height: shape.h,
        points:
          flow && shape.id === "arrow5"
            ? [
                [0, 0],
                [163, 0],
                [163, -146.5],
              ]
            : [
                [0, 0],
                [shape.w, shape.h],
              ],
        start: nearest(shape.x, shape.y) ? { id: nearest(shape.x, shape.y)! } : undefined,
        end: nearest(
          shape.x + shape.w,
          shape.y + (flow && shape.id === "arrow5" ? -146.5 : shape.h),
        )
          ? {
              id: nearest(
                shape.x + shape.w,
                shape.y + (flow && shape.id === "arrow5" ? -146.5 : shape.h),
              )!,
            }
          : undefined,
        label:
          flow && labels[shape.id]
            ? {
                text: scene.shapes.find((item) => item.id === labels[shape.id])?.text || "",
                fontSize: 20,
                fontFamily,
                strokeColor: "#34343a",
              }
            : shape.text
              ? { text: shape.text, fontSize: 20, fontFamily, strokeColor: "#34343a" }
              : undefined,
        endArrowhead: shape.kind === "arrow" ? "arrow" : null,
      });
    else if (shape.kind === "draw") {
      skeletons.push({
        ...common,
        type: "line",
        points: (shape.points || "").split(" ").map((pair) => {
          const [x, y] = pair.split(",").map(Number);
          return [x - shape.x, y - shape.y];
        }),
      });
    } else if (shape.kind === "phone") {
      skeletons.push({
        ...common,
        type: "rectangle",
        backgroundColor: "#fff",
        roughness: 0,
        roundness: { type: 3 },
        groupIds: [shape.id],
      });
      const extra = (
        id: string,
        x: number,
        y: number,
        width: number,
        height: number,
        backgroundColor: string,
      ) => ({
        ...common,
        id: `${shape.id}-${id}`,
        x: shape.x + x * (shape.w / 130),
        y: shape.y + y * (shape.h / 260),
        width: width * (shape.w / 130),
        height: height * (shape.h / 260),
        backgroundColor,
        strokeColor: "transparent",
        roughness: 0,
        groupIds: [shape.id],
        customData: { decoration: true },
        roundness: { type: 3 as const },
      });
      skeletons.push({
        ...extra("title", 10, 19, 100, 12, "transparent"),
        type: "text",
        text: "Today's stops",
        fontSize: 10 * (shape.w / 130),
        fontFamily: 2,
      });
      for (let i = 0; i < 4; i++) {
        skeletons.push({
          ...extra(`row-${i}`, 10, 44 + i * 34, 110, 28, "#f4f4f5"),
          type: "rectangle",
        });
        skeletons.push({
          ...extra(`dot-${i}`, 16, 52 + i * 34, 12, 12, "#171717"),
          type: "ellipse",
        });
        skeletons.push({
          ...extra(`line-${i}`, 35, 52 + i * 34, 40, 4, "#a3a3a3"),
          type: "rectangle",
        });
        skeletons.push({
          ...extra(`time-${i}`, 82, 54 + i * 34, 28, 12, "transparent"),
          type: "text",
          strokeColor: i === 1 ? "#ef4444" : "#666",
          text: ["14:35", "15:10", "15:45", "16:20"][i],
          fontSize: 8 * (shape.w / 130),
          fontFamily: 2,
        });
      }
      skeletons.push({
        ...extra("start", 10, 230, 110, 23, "#18181b"),
        type: "rectangle",
        label: {
          text: "Start route",
          fontSize: 8 * (shape.w / 130),
          fontFamily: 2,
          strokeColor: "#fff",
        },
      });
    } else if (shape.kind !== "image") {
      const type = shape.kind === "diamond" || shape.kind === "ellipse" ? shape.kind : "rectangle";
      skeletons.push({
        ...common,
        type,
        roundness: { type: type === "rectangle" ? 3 : 2 },
        strokeColor: shape.kind === "note" ? "transparent" : common.strokeColor,
        backgroundColor: shape.color || "#fff",
        label: shape.text
          ? { text: shape.text, fontSize: 20, fontFamily, strokeColor: "#34343a" }
          : undefined,
      });
    }
  }
  return convertToExcalidrawElements(skeletons, { regenerateIds: false }).map((element) => {
    if (element.type !== "frame") return element;
    const frame = frames.find((shape) => shape.id === element.id);
    // The conversion helper fits frames to their children; preserve the authored layout instead.
    return frame
      ? newElementWith(element, {
          x: frame.x,
          y: frame.y,
          width: frame.w,
          height: frame.h,
        })
      : element;
  });
}

export function readScene(elements: readonly ExcalidrawElement[], name: string): Scene {
  const shapes: Shape[] = [];
  const byId = new Map(elements.map((element) => [element.id, element]));
  const lanes = elements.filter(
    (element) => !element.isDeleted && element.type === "frame" && /^lane\d$/.test(element.id),
  );
  function nearestLane(element: ExcalidrawElement) {
    const center = element.x + element.width / 2;
    const lane = lanes.reduce<ExcalidrawElement | null>(
      (nearest, candidate) =>
        !nearest ||
        Math.abs(candidate.x + candidate.width / 2 - center) <
          Math.abs(nearest.x + nearest.width / 2 - center)
          ? candidate
          : nearest,
      null,
    );
    return lane ? Number(lane.id.slice(4)) : undefined;
  }
  for (const element of elements) {
    if (
      element.isDeleted ||
      element.customData?.decoration ||
      (element.type === "text" && element.containerId)
    )
      continue;
    const original = element.customData?.bricklaneShape as Shape | undefined;
    const boundText = element.boundElements
      ?.map((bound) => byId.get(bound.id))
      .find((item) => item?.type === "text");
    const kind =
      original?.kind ||
      (
        {
          rectangle: "rect",
          freedraw: "draw",
          embeddable: "rect",
          iframe: "rect",
          magicframe: "frame",
          selection: "rect",
        } as const
      )[element.type as "rectangle"] ||
      element.type;
    shapes.push({
      ...original,
      id: element.id,
      kind: kind as Shape["kind"],
      x: element.x,
      y: element.y,
      w: element.width,
      h: element.height,
      color: element.backgroundColor,
      lane: original?.lane === undefined ? undefined : (nearestLane(element) ?? original.lane),
      text:
        element.type === "text"
          ? element.text
          : element.type === "frame"
            ? element.name || "Frame"
            : boundText?.type === "text"
              ? boundText.text
              : original?.text,
    });
  }
  return { name, shapes, native: elements };
}

/** Preserve native bindings, rotations and every unedited engine property on sidebar mutations. */
export function mergeScene(
  current: readonly ExcalidrawElement[],
  next: Scene,
): ExcalidrawElement[] {
  if (next.native) return [...next.native];
  const previous = readScene(current, next.name);
  const changed = next.shapes.filter(
    (shape) =>
      JSON.stringify(shape) !==
      JSON.stringify(previous.shapes.find((item) => item.id === shape.id)),
  );
  const removed = previous.shapes
    .filter((shape) => !next.shapes.some((item) => item.id === shape.id))
    .map((shape) => shape.id);
  const replaceIds = new Set([...changed.map((shape) => shape.id), ...removed]);
  const replacements = sceneElements({ name: next.name, shapes: changed });
  const ids = new Map(current.map((element) => [element.id, element]));
  const retained = current.filter(
    (element) =>
      !replaceIds.has(element.id) &&
      !(element.type === "text" && element.containerId && replaceIds.has(element.containerId)) &&
      !element.groupIds.some((id) => replaceIds.has(id)),
  );
  return [
    ...retained,
    ...replacements.map((element) => {
      const old = ids.get(element.id);
      return old ? newElementWith(old, { ...element }) : element;
    }),
  ];
}
