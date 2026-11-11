import { getSchema, type Editor, type Extensions } from "@tiptap/core";
import Collaboration from "@tiptap/extension-collaboration";
import { DOMParser as ProseMirrorParser } from "@tiptap/pm/model";
import { prosemirrorToYDoc, yCursorPlugin, yCursorPluginKey } from "@tiptap/y-tiptap";
import {
  applyAwarenessUpdate,
  Awareness,
  encodeAwarenessUpdate,
  removeAwarenessStates,
} from "y-protocols/awareness";
import * as Y from "yjs";

export type Discussion = {
  id: string;
  author: string;
  message: string;
  quote: string;
  resolved: boolean;
  time: string;
};
export type Reply = {
  id: string;
  thread: string;
  author: string;
  message: string;
};

export const collaborators = [
  {
    name: "Mira Stone",
    initials: "MS",
    color: "#8b5cf6",
    note: " Confirm the handoff in the activity log.",
  },
  {
    name: "Leo Grant",
    initials: "LG",
    color: "#db2777",
    note: " Track the first week of escalations.",
  },
  {
    name: "Nora Vale",
    initials: "NV",
    color: "#0284c7",
    note: " Include the fallback in the support runbook.",
  },
];

export const collaborationThreads: Discussion[] = [
  {
    id: "handoff",
    author: "Leo Grant",
    message: "Does the timing include the first handoff from the support queue?",
    quote: "the time spent handing a draft back and forth",
    resolved: false,
    time: "Sep 25",
  },
  {
    id: "ownership",
    author: "Mira Stone",
    message: "What should the second writer see if the owner loses their connection?",
    quote: "Only the owner can submit the reply",
    resolved: false,
    time: "9:12 AM",
  },
  {
    id: "permissions",
    author: "Nora Vale",
    message: "Confirm permissions with support before inviting the first workspaces.",
    quote: "read-only teammates",
    resolved: false,
    time: "11:30 AM",
  },
];

export const collaborationReplies: Reply[] = [
  {
    id: "ownership-response",
    thread: "ownership",
    author: "Leo Grant",
    message: "Keep the draft visible and show that delivery is paused.",
  },
];

export function createCollaborationDocument(extensions: Extensions, html: string) {
  const source = new DOMParser().parseFromString(html, "text/html");
  const doc = ProseMirrorParser.fromSchema(getSchema(extensions)).parse(source.body);
  return prosemirrorToYDoc(doc, "default");
}

export function collaborationExtension(document: Y.Doc) {
  return Collaboration.configure({ document });
}

function exchangeDocument(from: Y.Doc, to: Y.Doc, origin: symbol) {
  Y.applyUpdate(to, Y.encodeStateAsUpdate(from, Y.encodeStateVector(to)), origin);
}

function textBlock(doc: Y.Doc, index: number) {
  const paragraphs = doc
    .getXmlFragment("default")
    .toArray()
    .filter(
      (node) =>
        node instanceof Y.XmlElement &&
        node.nodeName === "paragraph" &&
        node.get(0) instanceof Y.XmlText,
    ) as Y.XmlElement[];
  return paragraphs[index]?.get(0) as Y.XmlText | undefined;
}

export function connectPreviewRoom(
  editor: Editor,
  localDoc: Y.Doc,
  onActivity: (name: string | null) => void,
) {
  const transport = Symbol("preview transport");
  const local = { doc: localDoc, awareness: new Awareness(localDoc) };
  const peers = collaborators.map((user) => {
    const doc = new Y.Doc();
    exchangeDocument(localDoc, doc, transport);
    return { doc, awareness: new Awareness(doc), user };
  });
  const clients = [local, ...peers];
  const timers = new Set<number>();
  let online = true;

  function canSend(sender: typeof local, recipient: typeof local) {
    return sender !== recipient && (online || (sender !== local && recipient !== local));
  }

  const disconnect = clients.map((client) => {
    const syncDocument = (update: Uint8Array, origin: unknown) => {
      if (origin === transport) return;
      for (const recipient of clients) {
        if (canSend(client, recipient)) Y.applyUpdate(recipient.doc, update, transport);
      }
    };
    const syncPresence = (
      change: { added: number[]; updated: number[]; removed: number[] },
      origin: unknown,
    ) => {
      if (origin === transport) return;
      const ids = [...change.added, ...change.updated, ...change.removed];
      const update = encodeAwarenessUpdate(client.awareness, ids);
      for (const recipient of clients) {
        if (canSend(client, recipient))
          applyAwarenessUpdate(recipient.awareness, update, transport);
      }
    };
    client.doc.on("update", syncDocument);
    client.awareness.on("update", syncPresence);
    return () => {
      client.doc.off("update", syncDocument);
      client.awareness.off("update", syncPresence);
    };
  });

  editor.registerPlugin(
    yCursorPlugin(local.awareness, {
      cursorBuilder(user) {
        const caret = document.createElement("span");
        caret.className = "rich-text-peer-caret";
        caret.style.setProperty("--peer-color", user.color);
        caret.setAttribute("aria-hidden", "true");
        const label = document.createElement("span");
        label.textContent = user.name;
        caret.append(label);
        return caret;
      },
    }),
  );
  local.awareness.setLocalStateField("user", { name: "Alex Morgan", color: "#64748b" });

  function updatePeerCursor(index: number, typing: boolean) {
    const { doc, awareness, user } = peers[index];
    const text = textBlock(doc, index);
    const start = typing ? (text?.length ?? 0) : Math.min(18 + index * 13, text?.length ?? 0);
    const anchor = text && Y.createRelativePositionFromTypeIndex(text, start);
    const head =
      text &&
      Y.createRelativePositionFromTypeIndex(text, Math.min(start + (typing ? 0 : 14), text.length));
    awareness.setLocalState({ user, cursor: anchor && head ? { anchor, head } : null });
  }

  peers.forEach(({ awareness, user }) => awareness.setLocalState({ user }));

  function schedule(task: () => void, delay: number) {
    const timer = window.setTimeout(() => {
      timers.delete(timer);
      task();
    }, delay);
    timers.add(timer);
  }

  function replay() {
    for (const timer of timers) window.clearTimeout(timer);
    timers.clear();
    peers.forEach(({ doc, user }, index) => {
      schedule(
        () => {
          onActivity(user.name);
          const text = textBlock(doc, index);
          const plain = text
            ?.toDelta()
            .map(({ insert }: { insert: string }) => insert)
            .join("");
          doc.transact(() => {
            if (text && !plain?.includes(user.note.trim())) text.insert(text.length, user.note, {});
            const replies = doc.getMap<Reply>("replies");
            if (
              index === 0 &&
              doc.getMap("threads").has("handoff") &&
              !replies.has("replay-handoff")
            ) {
              replies.set("replay-handoff", {
                id: "replay-handoff",
                thread: "handoff",
                author: user.name,
                message: "I added a note to track the handoff in the activity log.",
              });
            }
          });
          updatePeerCursor(index, true);
        },
        900 + index * 950,
      );
    });
    schedule(() => onActivity(null), 3650);
  }

  return {
    replay,
    setOnline(next: boolean) {
      if (online === next) return;
      online = next;
      if (next) {
        for (const peer of peers) exchangeDocument(peer.doc, local.doc, transport);
        for (const peer of peers) exchangeDocument(local.doc, peer.doc, transport);
        peers.forEach((_peer, index) => updatePeerCursor(index, false));
        local.awareness.setLocalState(local.awareness.getLocalState());
      } else {
        removeAwarenessStates(
          local.awareness,
          peers.map(({ doc }) => doc.clientID),
          transport,
        );
        for (const peer of peers)
          removeAwarenessStates(peer.awareness, [local.doc.clientID], transport);
      }
    },
    destroy() {
      for (const timer of timers) window.clearTimeout(timer);
      if (!editor.isDestroyed) editor.unregisterPlugin(yCursorPluginKey);
      disconnect.forEach((dispose) => dispose());
      clients.forEach(({ awareness }) => awareness.destroy());
      peers.forEach(({ doc }) => doc.destroy());
    },
  };
}
