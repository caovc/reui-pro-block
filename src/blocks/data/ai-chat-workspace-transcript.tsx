/** Actual free REUI c-message-scroller-2/3/4 composition (MIT).
 * https://reui.io/r/radix-nova/c-message-scroller-3.json
 * Copyright (c) 2025 Keenthemes Inc.; preserve REUI-LICENSE.txt.
 * The upstream primitive owns scroll intent, anchoring and jump visibility;
 * application answers are slots, allowing quotes/plans rather than fake text.
 */
import type { ReactNode } from "react";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Message, MessageContent } from "@/components/ui/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";

export type WorkspaceTurn = { id: string; role: "user" | "assistant"; body: string };
export default function WorkspaceTranscript({
  turns,
  children,
  threadId,
  busy = false,
}: {
  turns: WorkspaceTurn[];
  children: (turn: WorkspaceTurn) => ReactNode;
  threadId: string;
  busy?: boolean;
}) {
  return (
    <MessageScrollerProvider
      key={threadId}
      autoScroll
      defaultScrollPosition="last-anchor"
      scrollPreviousItemPeek={64}
      scrollMargin={16}
    >
      <MessageScroller>
        <MessageScrollerViewport aria-label="Chat transcript">
          <MessageScrollerContent
            aria-busy={busy}
            className="mx-auto w-full max-w-3xl gap-7 px-4 py-6"
          >
            {turns.map((turn) => (
              <MessageScrollerItem
                key={turn.id}
                messageId={turn.id}
                scrollAnchor={turn.role === "user"}
              >
                {turn.role === "user" ? (
                  <Message align="end">
                    <MessageContent>
                      <Bubble variant="muted" align="end">
                        <BubbleContent className="whitespace-pre-wrap">{turn.body}</BubbleContent>
                      </Bubble>
                    </MessageContent>
                  </Message>
                ) : (
                  children(turn)
                )}
              </MessageScrollerItem>
            ))}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton />
      </MessageScroller>
    </MessageScrollerProvider>
  );
}
