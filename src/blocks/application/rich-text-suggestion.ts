import { Extension } from "@tiptap/core";
import { PluginKey } from "@tiptap/pm/state";
import Suggestion from "@tiptap/suggestion";

export type InsertSuggestion = {
  kind: "block" | "mention";
  query: string;
  range: { from: number; to: number };
  rect: DOMRect | null;
};

export function createInsertSuggestions(
  onUpdate: (state: InsertSuggestion | null) => void,
  onKeyDown: (event: KeyboardEvent) => boolean,
) {
  return Extension.create({
    name: "bricklaneInsertSuggestions",
    addProseMirrorPlugins() {
      return (
        [
          ["block", "/"],
          ["mention", "@"],
        ] as const
      ).map(([kind, char]) =>
        Suggestion({
          editor: this.editor,
          pluginKey: new PluginKey(`bricklane-${kind}`),
          char,
          allowSpaces: false,
          render: () => ({
            onStart: (props) =>
              onUpdate({
                kind,
                query: props.query,
                range: props.range,
                rect: props.clientRect?.() ?? null,
              }),
            onUpdate: (props) =>
              onUpdate({
                kind,
                query: props.query,
                range: props.range,
                rect: props.clientRect?.() ?? null,
              }),
            onExit: () => onUpdate(null),
            onKeyDown: ({ event }) => onKeyDown(event),
          }),
        }),
      );
    },
  });
}
