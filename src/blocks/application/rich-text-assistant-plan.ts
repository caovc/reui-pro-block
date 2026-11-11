import type { Editor } from "@tiptap/core";

const tasks = [
  { label: "Polish the plan", group: "Edit", match: /polish|rewrite|concise|improve|shorten/i },
  { label: "Fix spelling", group: "Edit", match: /spell|typo|proofread/i },
  { label: "Add a summary", group: "Add", match: /summari[sz]e|summary|recap/i },
  { label: "Add a checklist", group: "Add", match: /checklist|action items|next steps/i },
  { label: "Find open questions", group: "Review", match: /question|tbd|unresolved|risk/i },
  { label: "Find owners and tasks", group: "Review", match: /owner|assign|teammate/i },
] as const;

export const assistantTasks = tasks;
export type AssistantTask = (typeof tasks)[number];
export type AssistantRange = { from: number; to: number };
export type AssistantEdit = AssistantRange & { text: string; append?: boolean };

const spelling = {
  occured: "occurred",
  seperate: "separate",
  recieve: "receive",
  accomodate: "accommodate",
  definately: "definitely",
  enviroment: "environment",
};

export function planAssistant(editor: Editor, prompt: string, selection: AssistantRange | null) {
  const task = tasks.find(({ match }) => match.test(prompt)) ?? tasks[0];
  const { doc } = editor.state;
  const scope = selection ?? { from: 0, to: doc.content.size };
  const excerpts: { from: number; text: string }[] = [];
  let sections = 0;
  doc.nodesBetween(scope.from, scope.to, (node, position) => {
    if (node.type.name === "heading") sections += 1;
    if (!node.isTextblock) return;
    let excerpt: (typeof excerpts)[number] | undefined;
    node.forEach((child, offset) => {
      const start = position + offset + 1;
      const from = Math.max(start, scope.from);
      const to = Math.min(start + child.nodeSize, scope.to);
      if (
        !child.isText ||
        from >= to ||
        child.marks.some(({ type }) => type.name.startsWith("revision"))
      ) {
        excerpt = undefined;
        return;
      }
      const text = child.text!.slice(from - start, to - start);
      if (excerpt && excerpt.from + excerpt.text.length === from) excerpt.text += text;
      else {
        excerpt = { from, text };
        excerpts.push(excerpt);
      }
    });
    return false;
  });

  const edits: AssistantEdit[] = [];
  const findings: { from: number; text: string }[] = [];
  for (const excerpt of excerpts) {
    if (task === tasks[1]) {
      for (const match of excerpt.text.matchAll(
        /\b(occured|seperate|recieve|accomodate|definately|enviroment)\b/gi,
      )) {
        const from = excerpt.from + match.index;
        const corrected = spelling[match[0].toLowerCase() as keyof typeof spelling];
        edits.push({
          from,
          to: from + match[0].length,
          text: /^[A-Z]/.test(match[0])
            ? corrected[0].toUpperCase() + corrected.slice(1)
            : corrected,
        });
      }
    } else if (task === tasks[0]) {
      const text = excerpt.text
        .replace(/\bat this point in time,?\s*/gi, "")
        .replace(/\bwe are going to\b/gi, "We will")
        .replace(/\bin order to\b/gi, "to")
        .replace(/\ba number of\b/gi, "several")
        .replace(/\bit is important to note that\s+/gi, "")
        .replace(/\bfor a period of\b/gi, "for")
        .replace(/\bin the event that\b/gi, "if");
      if (text !== excerpt.text && text.trim()) {
        edits.push({
          from: excerpt.from,
          to: excerpt.from + excerpt.text.length,
          text: text.replace(/^\p{L}/u, (letter) => letter.toUpperCase()),
        });
      }
    } else if (task.group === "Review") {
      const match = task === tasks[4] ? /\?|\bTBD\b/i : /\b(owner|assign\w*|review|confirm)\b/i;
      if (match.test(excerpt.text)) findings.push(excerpt);
    }
  }

  if (task.group === "Add") {
    const lines = excerpts
      .map(({ text }) => text.trim())
      .filter((text) => text.length > 24)
      .slice(0, 3)
      .map((text) => text.split(/(?<=[.!?])\s/)[0]);
    if (lines.length) {
      const at = doc.content.size;
      const text =
        task === tasks[2] ? `Summary — ${lines.join(" ")}` : `Checklist — ${lines.join(" • ")}`;
      edits.push({ from: at, to: at, text, append: true });
    }
  }

  return {
    task,
    edits: edits.reverse(),
    findings,
    context: `Read ${sections} sections, ${excerpts.flatMap(({ text }) => text.trim().split(/\s+/).filter(Boolean)).length} words`,
  };
}
