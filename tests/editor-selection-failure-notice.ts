import type { TestInfo } from "@playwright/test";

const title = "Tiptap edits, formats and restores the saved document with native undo and redo";
const verification = "A verified editor paragraph";
const seed = "Type / to insert a block, or @ to mention a teammate.";
const number = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 && value < 1e9
    ? Math.round(value)
    : "?";
const textKey = (text: unknown) =>
  typeof text !== "string"
    ? "?"
    : text.includes(verification)
      ? "V"
      : text && verification.startsWith(text)
        ? "v"
        : text === seed
          ? "S"
          : "O";

function point(node: { path?: string; text?: string } | null, offset: unknown) {
  const path = node?.path;
  const safe =
    typeof path === "string" && /^editor(?:\/(?:[A-Z][A-Z0-9]*|#text)\[\d{1,3}\]){0,6}$/.test(path)
      ? path.replace("editor", "E").replaceAll("#text", "T").replaceAll(/[[\]]/g, "").slice(0, 40)
      : "?";
  return `${safe}@${number(offset)}${textKey(node?.text)}`;
}

export function editorSelectionFailureNotice(
  info: Pick<TestInfo, "title" | "line" | "expectedStatus" | "status" | "attachments">,
  environment: NodeJS.ProcessEnv = process.env,
) {
  if (
    !["true", "1"].includes(environment.CI ?? "") ||
    environment.GITHUB_ACTIONS !== "true" ||
    info.title !== title ||
    info.expectedStatus !== "passed" ||
    !["failed", "timedOut"].includes(info.status ?? "")
  )
    return;
  const body = info.attachments.find(
    (item) =>
      item.name === "editor-native-selection-observation.json" &&
      item.contentType === "application/json",
  )?.body;
  let summary = "passive attachment unavailable";
  try {
    if (body && body.length <= 4 * 1024 * 1024) {
      const { observationData: data } = JSON.parse(body.toString("utf8"));
      const rows = new Map<string, string>();
      let ends = 0;
      let clicks = 0;
      let order = "?";
      for (const record of data.records.slice(0, 1000)) {
        if (!record || typeof record !== "object") continue;
        if (Array.isArray(record.childOrder)) {
          const keys = record.childOrder
            .slice(0, 24)
            .map((node: { text?: string }) => textKey(node?.text));
          order = `${keys.length},V${keys.indexOf("V")},S${keys.indexOf("S")}`;
        }
        let stage = ["installed", "stopped"].includes(record.kind) ? record.kind : "";
        if (record.kind === "event" && record.listenerPhase === "bubble") {
          if (record.type === "keyup") {
            if (
              (record.key === "End" && record.ctrlKey) ||
              (record.key === "ArrowDown" && record.metaKey)
            ) {
              if (++ends <= 2) stage = `docEnd${ends}`;
            } else if (record.key === "Enter") stage = "enter";
            else if (record.key === "Home" || (record.key === "ArrowLeft" && record.metaKey))
              stage = "lineStart";
            else if (
              record.shiftKey &&
              (record.key === "End" || (record.key === "ArrowRight" && record.metaKey))
            )
              stage = "lineSelect";
          }
          if (record.type === "input" && clicks === 0) stage = "input";
          if (
            record.type === "click" &&
            typeof record.target === "string" &&
            record.target.startsWith("outside-editor/")
          ) {
            stage = ["undo", "redo", "bold"][clicks++] ?? "";
          }
        }
        if (stage) {
          const selection = record.selection;
          rows.set(
            stage,
            `${stage} t${number(record.monotonicMs)} ${point(selection?.anchor, selection?.anchorOffset)}>${point(selection?.focus, selection?.focusOffset)} ord=${order}`.slice(
              0,
              135,
            ),
          );
        }
      }
      summary = `records=${Math.min(data.records.length, 1000)} dropped=${number(data.dropped)}; V=verification v=prefix S=seed O=other; ord=count,V-index,S-index from latest passive child sample; clicks follow original test order\n${[...rows.values()].join("\n")}`;
    }
  } catch {
    summary = "passive attachment unreadable";
  }
  const message = `Editor passive selection only; full attachment retained.\n${summary}`
    .slice(0, 1700)
    .replaceAll("%", "%25")
    .replaceAll("\r", "%0D")
    .replaceAll("\n", "%0A");
  return `::notice file=tests/editor-engine.spec.ts,line=${number(info.line)},title=Editor passive selection::${message}`;
}
