import type { Editor } from "@tiptap/core";
import { closeHistory } from "@tiptap/pm/history";
import type { Mark, Node } from "@tiptap/pm/model";

export type DocumentRevision = {
  id: string;
  author: string;
  before: string;
  after: string;
};

function isRevision(mark: Mark) {
  return mark.type.name === "revisionInsert" || mark.type.name === "revisionDelete";
}

/** Derive review cards from all current native mark fragments, including formatted text. */
export function collectDocumentRevisions(
  editor: Editor,
  authors: ReadonlyMap<string, string> = new Map(),
): DocumentRevision[] {
  const revisions = new Map<string, DocumentRevision>();
  const parents = new Map<string, { before?: Node; after?: Node }>();
  editor.state.doc.descendants((node, _position, parent) => {
    if (!node.isInline || !parent) return;
    for (const mark of node.marks) {
      if (!isRevision(mark)) continue;
      const id: unknown = mark.attrs.revision;
      if (typeof id !== "string" || !id) continue;
      const revision = revisions.get(id) ?? {
        id,
        author: authors.get(id) ?? "Alex Morgan",
        before: "",
        after: "",
      };
      const side = mark.type.name === "revisionDelete" ? "before" : "after";
      const lastParents = parents.get(id) ?? {};
      if (lastParents[side] && lastParents[side] !== parent) revision[side] += "\n";
      revision[side] += node.isText
        ? node.text!
        : node.type.name === "hardBreak"
          ? "\n"
          : node.textContent;
      lastParents[side] = parent;
      parents.set(id, lastParents);
      revisions.set(id, revision);
    }
  });
  return [...revisions.values()];
}

/** Serialize a projection without changing the document, selection, or history. */
export function documentProjection(editor: Editor, projection: "final" | "original") {
  const omitted = projection === "final" ? "revisionDelete" : "revisionInsert";
  const blocks: string[] = [];
  editor.state.doc.descendants((node) => {
    if (!node.isTextblock) return;
    let text = "";
    node.forEach((child) => {
      if (child.marks.some(({ type }) => type.name === omitted)) return;
      if (child.isText) text += child.text;
      else if (child.type.name === "hardBreak") text += "\n";
      else if (child.type.name === "mention") text += `@${child.attrs.label ?? child.attrs.id}`;
    });
    if (text || !node.attrs.assistantRevision) blocks.push(text);
    return false;
  });
  return blocks.join("\n\n").trimEnd();
}

/** Resolve fresh document positions as one native undo event, preserving unrelated marks/attrs. */
export function resolveDocumentRevisions(
  editor: Editor,
  ids: ReadonlySet<string>,
  accept: boolean,
): boolean {
  if (editor.isDestroyed || !editor.isEditable || ids.size === 0) return false;
  const ranges: { from: number; to: number; mark: Mark }[] = [];
  let ambiguous = false;
  editor.state.doc.descendants((node, position) => {
    if (!node.isInline) return;
    const revisions = node.marks.filter(isRevision);
    const targeted = revisions.filter((mark) => ids.has(mark.attrs.revision));
    if (!targeted.length) return;
    // Overlapping suggestions need their own conflict policy; never delete another ID silently.
    if (revisions.length !== 1) {
      ambiguous = true;
      return;
    }
    ranges.push({ from: position, to: position + node.nodeSize, mark: targeted[0] });
  });
  if (ambiguous || ranges.length === 0) return false;
  const transaction = editor.state.tr;
  // A generated paragraph belongs to the addition only while every child
  // carries the same revision. Keep any later manual content in that paragraph.
  const addedBlocks: { from: number; to: number; node: Node }[] = [];
  editor.state.doc.descendants((node, from) => {
    const id = node.attrs.assistantRevision;
    if (typeof id === "string" && ids.has(id)) {
      addedBlocks.push({ from, to: from + node.nodeSize, node });
    }
  });
  const keepType = accept ? "revisionInsert" : "revisionDelete";
  for (const { from, to, mark } of ranges.reverse()) {
    if (mark.type.name === keepType) transaction.removeMark(from, to, mark);
    else transaction.delete(from, to);
  }
  for (const { from, to, node } of addedBlocks.reverse()) {
    const mapped = transaction.mapping.map(from);
    const result = transaction.doc.nodeAt(mapped);
    if (!result || result.attrs.assistantRevision !== node.attrs.assistantRevision) continue;
    if (!accept && result.content.size === 0)
      transaction.delete(mapped, transaction.mapping.map(to));
    else transaction.setNodeMarkup(mapped, undefined, { ...result.attrs, assistantRevision: null });
  }
  if (!transaction.docChanged) return false;
  editor.view.dispatch(closeHistory(transaction));
  // A quick subsequent keystroke must not join the review event in native history.
  if (!editor.isDestroyed) editor.view.dispatch(closeHistory(editor.state.tr));
  return true;
}
