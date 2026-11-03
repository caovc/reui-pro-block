import { Extension } from "@tiptap/core";
import { PluginKey } from "@tiptap/pm/state";
import Suggestion, { exitSuggestion } from "@tiptap/suggestion";

export type InsertSuggestion = {
  kind: "block" | "mention";
  query: string;
  range: { from: number; to: number };
  rect: DOMRect | null;
  dismiss: () => void;
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
      ).map(([kind, char]) => {
        const pluginKey = new PluginKey(`bricklane-${kind}`);
        const dismiss = () => {
          if (!this.editor.isDestroyed) exitSuggestion(this.editor.view, pluginKey);
        };
        return Suggestion({
          editor: this.editor,
          pluginKey,
          char,
          allowSpaces: false,
          render: () => ({
            onStart: (props) =>
              onUpdate({
                kind,
                query: props.query,
                range: props.range,
                rect: props.clientRect?.() ?? null,
                dismiss,
              }),
            onUpdate: (props) =>
              onUpdate({
                kind,
                query: props.query,
                range: props.range,
                rect: props.clientRect?.() ?? null,
                dismiss,
              }),
            onExit: () => onUpdate(null),
            onKeyDown: ({ event }) => onKeyDown(event),
          }),
        });
      });
    },
  });
}
