import { TextSelection } from "@tiptap/pm/state";
import type { EditorProps } from "@tiptap/pm/view";

/** Keep native keyboard actions on the caret that the user has just placed. */
export const richTextEditorProps: EditorProps = {
  attributes: {
    role: "textbox",
    "aria-label": "Rich text document",
    "aria-multiline": "true",
    class: "reui-rich-document min-h-[520px] px-6 py-8 outline-none sm:px-12 sm:py-10",
  },
  handleDOMEvents: {
    keydown(view, event) {
      if (
        !view.editable ||
        view.composing ||
        event.isComposing ||
        event.keyCode === 229 ||
        !(view.state.selection instanceof TextSelection)
      )
        return false;
      const selection = view.dom.ownerDocument.getSelection();
      if (
        !selection?.anchorNode ||
        !selection.focusNode ||
        !view.dom.contains(selection.anchorNode) ||
        !view.dom.contains(selection.focusNode)
      )
        return false;
      const anchorElement =
        selection.anchorNode.nodeType === Node.ELEMENT_NODE
          ? (selection.anchorNode as Element)
          : selection.anchorNode.parentElement;
      const focusElement =
        selection.focusNode.nodeType === Node.ELEMENT_NODE
          ? (selection.focusNode as Element)
          : selection.focusNode.parentElement;
      if (
        anchorElement?.closest('[contenteditable="false"]') ||
        focusElement?.closest('[contenteditable="false"]')
      )
        return false;
      try {
        const anchor = view.posAtDOM(selection.anchorNode, selection.anchorOffset);
        const head = view.posAtDOM(selection.focusNode, selection.focusOffset);
        const next = TextSelection.between(
          view.state.doc.resolve(anchor),
          view.state.doc.resolve(head),
        );
        if (!view.state.selection.eq(next))
          view.dispatch(view.state.tr.setSelection(next).setMeta("addToHistory", false));
      } catch {
        // NodeViews can own non-document DOM. Their native key handling remains authoritative.
      }
      return false;
    },
  },
};
