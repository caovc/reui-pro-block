/** Actual ReUI free c-message-scroller-2/3 composition (MIT).
 * https://reui.io/r/radix-nova/c-message-scroller-2.json
 * https://reui.io/r/radix-nova/c-message-scroller-3.json
 * MessageScroller owns scroll intent, anchoring, following and jump visibility.
 * Echo supplies its existing message elements without copying those behaviors.
 */
import type { ReactNode } from "react";
import { Message, MessageContent, MessageHeader } from "@/components/ui/message";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import "./echo-message-viewport.css";

export function EchoMessageViewport({
  threadId,
  children,
}: {
  threadId?: string;
  children: ReactNode;
}) {
  // The original empty chat is a home surface rather than a message viewport.
  if (threadId === undefined) {
    return <div className="echo-conversation">{children}</div>;
  }

  return (
    <MessageScrollerProvider
      key={threadId}
      autoScroll
      defaultScrollPosition="last-anchor"
      scrollPreviousItemPeek={64}
      scrollMargin={16}
    >
      <MessageScroller className="echo-message-viewport">
        <MessageScrollerViewport aria-label="Messages" role="region">
          <MessageScrollerContent className="echo-message-content">
            {children}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton variant="outline" className="rounded-full shadow-sm" />
      </MessageScroller>
    </MessageScrollerProvider>
  );
}

export function EchoMessageItem({
  id,
  anchor = false,
  role,
  label,
  children,
}: {
  id: string;
  anchor?: boolean;
  role?: "user" | "assistant";
  label?: string;
  children: ReactNode;
}) {
  const alignment = role === "user" ? "end" : "start";
  return (
    <MessageScrollerItem messageId={id} scrollAnchor={anchor}>
      {role ? (
        <Message align={alignment} className={`echo-message ${role}`}>
          <MessageContent>
            {label && <MessageHeader>{label}</MessageHeader>}
            <Bubble variant={role === "user" ? "muted" : "ghost"} align={alignment}>
              <BubbleContent className="whitespace-pre-wrap">
                <p>{children}</p>
              </BubbleContent>
            </Bubble>
          </MessageContent>
        </Message>
      ) : (
        children
      )}
    </MessageScrollerItem>
  );
}
