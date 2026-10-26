import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { closeHistory } from "@tiptap/pm/history";
import { Check, Eye, FileText, MoreHorizontal, Pencil, Redo2, Undo2 } from "lucide-react";
import RichEditorBlock from "@/blocks/application/editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Frame, FramePanel } from "@/components/reui/frame";
import { MeshHeader } from "./mesh-header";
import { copyMeshText, meshPageLink } from "./mesh-page-actions";
import { MeshAssistant } from "./mesh-assistant";
import {
  documentStorageKey,
  documentTemplates,
  escapeDocumentText,
  readDocumentStore,
} from "./mesh-document-model";
import type { DocumentStore, MeshDocument } from "./mesh-document-model";
import "./mesh-documents.css";

export function MeshDocuments({ onHome }: { onHome: () => void }) {
  const [store, setStore] = useState(readDocumentStore);
  const storeRef = useRef(store);
  const current = store.documents.find((doc) => doc.id === store.active)!;
  const [openedDocument, setOpenedDocument] = useState(() => ({
    html: current.html,
    token: crypto.randomUUID(),
  }));
  const activeMount = useRef(openedDocument.token);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false });
  const unsubscribe = useRef<(() => void) | null>(null);
  const [readOnly, setReadOnly] = useState(
    () => new URLSearchParams(location.search).get("mode") === "view",
  );
  const [formatting, setFormatting] = useState(false);
  const [outline, setOutline] = useState(true);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [dialog, setDialog] = useState<"new" | "rename" | "clear" | "delete" | null>(null);
  const [title, setTitle] = useState("");
  const [templateHtml, setTemplateHtml] = useState("");
  const [saveError, setSaveError] = useState(false);
  const [deleted, setDeleted] = useState<MeshDocument | null>(null);

  // Save the native update synchronously, before a route change can unmount it.
  // This store is also authoritative between two commands in the same event.
  function commit(recipe: (previous: DocumentStore) => DocumentStore) {
    const previous = storeRef.current;
    const next = recipe(previous);
    if (next === previous) return;
    storeRef.current = next;
    setStore(next);
    if (previous.active !== next.active) {
      const url = new URL(location.href);
      if (url.searchParams.has("doc")) {
        url.searchParams.set("doc", next.active);
        history.replaceState(history.state, "", url);
      }
    }
    try {
      localStorage.setItem(documentStorageKey, JSON.stringify(next));
      setSaveError(false);
    } catch {
      setSaveError(true);
    }
  }

  useEffect(() => () => unsubscribe.current?.(), []);

  function openHtml(html: string) {
    const token = crypto.randomUUID();
    activeMount.current = token;
    unsubscribe.current?.();
    unsubscribe.current = null;
    setEditor(null);
    setOpenedDocument({ html, token });
  }

  function receiveEditor(instance: Editor | null, documentId: string, token: string) {
    // Tiptap can destroy an old instance after a new document has mounted.
    if (token !== activeMount.current) return;
    unsubscribe.current?.();
    unsubscribe.current = null;
    setEditor(instance);
    if (!instance) return;
    const capture = () => {
      const html = instance.getHTML();
      const heading = instance.state.doc.firstChild;
      const headingTitle =
        heading?.type.name === "heading" && heading.attrs.level === 1
          ? heading.textContent.trim().slice(0, 200)
          : "";
      commit((previous) => {
        const doc = previous.documents.find((item) => item.id === documentId);
        if (!doc || doc.html === html) return previous;
        return {
          ...previous,
          documents: previous.documents.map((item) =>
            item.id === documentId
              ? {
                  ...item,
                  html,
                  title: headingTitle || item.title,
                  updated: new Date().toISOString(),
                }
              : item,
          ),
        };
      });
    };
    const transaction = () => {
      const next = { canUndo: instance.can().undo(), canRedo: instance.can().redo() };
      setHistoryState((previous) =>
        previous.canUndo === next.canUndo && previous.canRedo === next.canRedo ? previous : next,
      );
    };
    instance.on("update", capture);
    instance.on("transaction", transaction);
    unsubscribe.current = () => {
      instance.off("update", capture);
      instance.off("transaction", transaction);
    };
    transaction();
    capture();
  }

  function selectDocument(id: string) {
    if (id === storeRef.current.active) return;
    const doc = storeRef.current.documents.find((item) => item.id === id);
    if (!doc) return;
    openHtml(doc.html);
    commit((previous) => ({ ...previous, active: id }));
  }
  function createDocument(name: string, body = "") {
    const cleanName = name.trim() || "Untitled document";
    const next: MeshDocument = {
      id: crypto.randomUUID(),
      title: cleanName,
      html: `<h1>${escapeDocumentText(cleanName)}</h1>${body || "<p></p>"}`,
      updated: new Date().toISOString(),
    };
    openHtml(next.html);
    commit((previous) => ({
      ...previous,
      active: next.id,
      documents: [...previous.documents, next],
    }));
    setDialog(null);
  }
  function duplicateDocument() {
    const name = `${current.title} (copy)`.slice(0, 200);
    const parsed = new DOMParser().parseFromString(editor?.getHTML() || current.html, "text/html");
    const heading = parsed.body.firstElementChild;
    if (heading?.tagName === "H1") heading.textContent = name;
    const next = {
      ...current,
      id: crypto.randomUUID(),
      title: name,
      html: parsed.body.innerHTML,
      updated: new Date().toISOString(),
    };
    openHtml(next.html);
    commit((previous) => ({
      ...previous,
      active: next.id,
      documents: [...previous.documents, next],
    }));
  }
  function removeDocument() {
    const active = storeRef.current.documents.find((doc) => doc.id === storeRef.current.active)!;
    setDeleted(active);
    let documents = storeRef.current.documents.filter((doc) => doc.id !== active.id);
    if (!documents.length) {
      documents = [
        {
          id: crypto.randomUUID(),
          title: "Untitled document",
          html: "<h1>Untitled document</h1><p></p>",
          updated: new Date().toISOString(),
        },
      ];
    }
    openHtml(documents[0].html);
    commit((previous) => ({ ...previous, documents, active: documents[0].id }));
    setDialog(null);
  }
  function renameDocument() {
    const name = title.trim();
    if (!name || !editor || readOnly) return;
    // A native transaction keeps the first-heading change in Undo/Redo.
    editor.commands.command(({ tr, state }) => {
      closeHistory(tr);
      const first = state.doc.firstChild;
      if (first?.type.name === "heading" && first.attrs.level === 1) {
        tr.insertText(name, 1, first.nodeSize - 1);
      } else {
        tr.insert(0, state.schema.nodes.heading.create({ level: 1 }, state.schema.text(name)));
      }
      return true;
    });
    commit((previous) => ({
      ...previous,
      documents: previous.documents.map((doc) =>
        doc.id === current.id ? { ...doc, title: name } : doc,
      ),
    }));
    setDialog(null);
  }
  function beginNew(name = "", html = "") {
    setTitle(name);
    setTemplateHtml(html);
    setDialog("new");
  }
  function copyDocument(type: "html" | "text") {
    if (!editor) return;
    return copyMeshText(
      type === "html" ? editor.getHTML() : editor.getText(),
      type === "html" ? "HTML copied" : "Text copied",
    );
  }
  const editorReady = Boolean(editor && !editor.isDestroyed);

  return (
    <div
      className="mesh-engine-page mesh-documents"
      data-full-width={store.fullWidth}
      data-small-text={store.smallText}
      data-outline={outline}
      data-formatting={formatting}
    >
      <MeshHeader
        title="Documents"
        status={saveError ? "Storage unavailable" : "Saved"}
        onHome={onHome}
        onAskAI={() => setAssistantOpen((open) => !open)}
        assistantOpen={assistantOpen}
        readOnly={readOnly}
        onReadOnlyChange={setReadOnly}
        documentId={current.id}
      >
        <ToggleGroup
          type="single"
          aria-label="Document mode"
          value={readOnly ? "view" : "edit"}
          onValueChange={(value) => value && setReadOnly(value === "view")}
          className="mesh-document-mode"
        >
          <ToggleGroupItem value="edit" aria-label="Edit">
            <Pencil />
            <span>Edit</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="view" aria-label="View">
            <Eye />
            <span>View</span>
          </ToggleGroupItem>
        </ToggleGroup>
        <div className="mesh-document-history">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Undo"
            disabled={!editorReady || readOnly || !historyState.canUndo}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => editor?.chain().focus().undo().run()}
          >
            <Undo2 />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Redo"
            disabled={!editorReady || readOnly || !historyState.canRedo}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => editor?.chain().focus().redo().run()}
          >
            <Redo2 />
          </Button>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon-sm" variant="ghost" aria-label="Doc options">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Doc</DropdownMenuLabel>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Open Doc</DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="mesh-open-doc-menu max-h-[65dvh] w-80 max-w-[calc(100vw-32px)] overflow-auto">
                  <DropdownMenuRadioGroup value={current.id} onValueChange={selectDocument}>
                    {store.documents.map((doc) => (
                      <DropdownMenuRadioItem
                        key={doc.id}
                        value={doc.id}
                        className="items-start py-2"
                      >
                        <FileText className="mt-0.5 size-4 shrink-0" />
                        <span className="min-w-0">
                          <span className="block truncate">{doc.title}</span>
                          <span className="mt-1 block text-[10px] text-muted-foreground">
                            {documentUpdated(doc.updated)}
                          </span>
                        </span>
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem onSelect={() => beginNew()}>New Doc</DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>New from Template</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {documentTemplates.map((template) => (
                    <DropdownMenuItem
                      key={template.title}
                      onSelect={() => beginNew(template.title, template.html)}
                    >
                      {template.title}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem
                disabled={readOnly || !editorReady}
                onSelect={() => {
                  setTitle(current.title);
                  setDialog("rename");
                }}
              >
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={duplicateDocument}>Duplicate</DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => copyMeshText(meshPageLink(current.id), "Link copied")}
              >
                Copy Link
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Display</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={store.fullWidth}
                onCheckedChange={(checked) =>
                  commit((previous) => ({ ...previous, fullWidth: checked }))
                }
              >
                Full Width
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={store.smallText}
                onCheckedChange={(checked) =>
                  commit((previous) => ({ ...previous, smallText: checked }))
                }
              >
                Small Text
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={formatting} onCheckedChange={setFormatting}>
                Formatting toolbar
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={outline} onCheckedChange={setOutline}>
                Document outline
              </DropdownMenuCheckboxItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled={!editorReady} onSelect={() => copyDocument("html")}>
              Copy HTML
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!editorReady} onSelect={() => copyDocument("text")}>
              Copy Text
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={readOnly || !editorReady}
              onSelect={() => setDialog("clear")}
            >
              Clear Doc
            </DropdownMenuItem>
            <DropdownMenuItem disabled={readOnly} onSelect={() => setDialog("delete")}>
              Delete Doc
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </MeshHeader>
      {deleted && (
        <div className="mesh-deleted-document" role="status">
          <span>Deleted “{deleted.title}”</span>
          <Button
            size="xs"
            variant="outline"
            onClick={() => {
              const restored = deleted;
              openHtml(restored.html);
              commit((previous) => ({
                ...previous,
                active: restored.id,
                documents: [...previous.documents, restored],
              }));
              setDeleted(null);
            }}
          >
            Restore document
          </Button>
        </div>
      )}
      <Frame className="mesh-document-frame" spacing="sm">
        <FramePanel>
          <RichEditorBlock
            key={openedDocument.token}
            compact
            readOnly={readOnly}
            initialHtml={openedDocument.html}
            onEditorReady={(instance) => receiveEditor(instance, current.id, openedDocument.token)}
            documentTitle={current.title}
            block={{
              id: `mesh-document-${current.id}-2`,
              name: current.title,
              category: "rich-text-editor",
              group: "application",
              reference: "https://mesh-whiteboard.reui.io/documents",
              index: 1,
            }}
          />
        </FramePanel>
      </Frame>
      {assistantOpen && (
        <MeshAssistant
          key={`document-assistant-${current.id}`}
          context={{
            title: current.title,
            kind: "document",
            text: editor?.getText() || documentText(current.html),
            sources: documentSections(current.html),
          }}
          onClose={() => setAssistantOpen(false)}
        />
      )}
      <Dialog open={dialog !== null} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog === "new"
                ? "New Doc"
                : dialog === "rename"
                  ? "Rename document"
                  : dialog === "clear"
                    ? "Clear document?"
                    : "Delete document?"}
            </DialogTitle>
            <DialogDescription>
              {dialog === "new"
                ? "Create a document in this local workspace."
                : dialog === "rename"
                  ? "Change the document name and its first heading."
                  : dialog === "clear"
                    ? "Remove the content of this document. You can undo this change."
                    : "Remove this document from the workspace. Use Restore document to bring it back."}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (dialog === "new") createDocument(title, templateHtml);
              if (dialog === "rename") renameDocument();
              if (dialog === "clear" && editor && !readOnly) {
                editor
                  .chain()
                  .command(({ tr }) => {
                    closeHistory(tr);
                    return true;
                  })
                  .clearContent()
                  .run();
                setDialog(null);
              }
              if (dialog === "delete" && !readOnly) removeDocument();
            }}
          >
            {(dialog === "new" || dialog === "rename") && (
              <label className="mesh-document-title-label">
                Document name
                <Input
                  autoFocus
                  value={title}
                  maxLength={200}
                  onChange={(event) => setTitle(event.target.value)}
                  required
                />
              </label>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialog(null)}>
                Cancel
              </Button>
              <Button type="submit">
                {dialog === "new" ? (
                  "Create document"
                ) : dialog === "rename" ? (
                  <>
                    <Check />
                    Save name
                  </>
                ) : dialog === "clear" ? (
                  "Clear document"
                ) : (
                  "Delete document"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function documentUpdated(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? "Saved document"
    : `Updated ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

function documentText(html: string) {
  const parsed = new DOMParser().parseFromString(html, "text/html");
  return Array.from(parsed.body.children)
    .map((node) => node.textContent?.trim())
    .filter(Boolean)
    .join("\n");
}

function documentSections(html: string) {
  const parsed = new DOMParser().parseFromString(html, "text/html");
  const sections: { id: string; title: string; text: string }[] = [];
  for (const node of parsed.body.children) {
    if (/^H[1-3]$/.test(node.tagName)) {
      sections.push({
        id: node.id || `section-${sections.length}`,
        title: node.textContent || "Untitled section",
        text: "",
      });
    } else if (sections.length && node.textContent?.trim()) {
      sections[sections.length - 1].text += `${node.textContent.trim()}\n`;
    }
  }
  return sections.filter((section) => section.text.trim());
}
