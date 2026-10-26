/** Actual REUI free c-input-group-18/19 and c-attachment-2 compositions (MIT).
 * https://reui.io/r/radix-nova/c-input-group-18.json
 * https://reui.io/r/radix-nova/c-attachment-2.json
 * Copyright (c) 2025 Keenthemes Inc.; preserve REUI-LICENSE.txt.
 * A scoped extension for quoted/context-bound applications. Existing frozen
 * ChatComposer remains unchanged; real InputGroup/Attachment own their UI.
 */
import { useId, type ReactNode } from "react";
import { ArrowUp, ChevronDown, FileText, Lightbulb, Plus, Quote, Square, X } from "lucide-react";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";
import type { ChatDraft } from "./ai-chat-draft";
import { CHAT_MODELS, type ChatContext, type ChatMeta } from "./ai-chat-session";

export default function WorkspaceComposer({
  draft,
  sources,
  busy,
  onSend,
  onStop,
  quote,
  onClearQuote,
  tools,
  onSuggest,
}: {
  draft: ChatDraft;
  sources: ChatContext[];
  busy: boolean;
  onSend: (text: string, meta: ChatMeta) => void;
  onStop: () => void;
  quote?: string;
  onClearQuote?: () => void;
  tools?: ReactNode;
  onSuggest?: () => void;
}) {
  const id = useId();
  const attached = sources.filter((source) => draft.contextIds.includes(source.id));
  const available = sources.filter((source) => !draft.contextIds.includes(source.id));
  function send() {
    if (busy || !draft.value.trim()) return;
    onSend(draft.value.trim(), { ...draft.meta, contextIds: attached.map((entry) => entry.id) });
    draft.setValue("");
    draft.setContextIds([]);
  }
  return (
    <form
      className="min-w-0"
      onSubmit={(event) => {
        event.preventDefault();
        send();
      }}
    >
      <Field>
        <FieldLabel htmlFor={id} className="sr-only">
          Message the assistant
        </FieldLabel>
        <InputGroup className="rounded-xl bg-background shadow-none has-disabled:bg-background has-disabled:opacity-100 dark:has-disabled:bg-background">
          {(quote || attached.length > 0) && (
            <InputGroupAddon align="block-start" className="flex-col items-stretch gap-2 px-3 pt-3">
              {quote && (
                <div
                  className="flex min-w-0 items-start gap-2 rounded-md border-s-2 border-foreground/40 bg-muted/60 p-2"
                  data-quoted-draft
                >
                  <Quote className="mt-0.5 size-3 shrink-0" />
                  <span className="line-clamp-2 min-w-0 flex-1 text-xs leading-5">{quote}</span>
                  <InputGroupButton
                    type="button"
                    size="icon-xs"
                    aria-label="Remove quoted text"
                    onClick={onClearQuote}
                  >
                    <X />
                  </InputGroupButton>
                </div>
              )}
              {attached.length > 0 && (
                <AttachmentGroup aria-label="Attached context">
                  {attached.map((entry) => (
                    <Attachment key={entry.id} size="xs" className="max-w-52">
                      <AttachmentMedia>
                        <FileText />
                      </AttachmentMedia>
                      <AttachmentContent>
                        <AttachmentTitle>{entry.name}</AttachmentTitle>
                      </AttachmentContent>
                      <AttachmentActions>
                        <AttachmentAction
                          type="button"
                          aria-label={`Remove ${entry.name}`}
                          onClick={() =>
                            draft.setContextIds((current) =>
                              current.filter((id) => id !== entry.id),
                            )
                          }
                        >
                          <X />
                        </AttachmentAction>
                      </AttachmentActions>
                    </Attachment>
                  ))}
                </AttachmentGroup>
              )}
            </InputGroupAddon>
          )}
          <InputGroupTextarea
            ref={(node) => draft.bindTextarea(node)}
            id={id}
            value={draft.value}
            placeholder={quote ? "Reply to the quoted sentence…" : "Ask about your workspace…"}
            className="max-h-32 min-h-16 text-sm"
            onChange={(event) => draft.setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.nativeEvent.isComposing) return;
              if (event.key === "ArrowUp" && !draft.value && onSuggest) {
                event.preventDefault();
                onSuggest();
              }
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                send();
              }
            }}
          />
          <InputGroupAddon align="block-end" className="flex-wrap gap-1 px-2 pb-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <InputGroupButton
                  type="button"
                  size="icon-sm"
                  aria-label="Attach context"
                  disabled={!available.length}
                >
                  <Plus />
                </InputGroupButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Available workspace files</DropdownMenuLabel>
                {available.map((source) => (
                  <DropdownMenuItem
                    key={source.id}
                    onSelect={() => draft.setContextIds((current) => [...current, source.id])}
                  >
                    <FileText />
                    <span className="min-w-0 text-xs">
                      <span className="block">{source.name}</span>
                      <span className="block text-[10px] text-muted-foreground">
                        {source.description}
                      </span>
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <InputGroupButton
                  type="button"
                  aria-label="Choose model"
                  className="max-w-36 min-w-0 text-xs"
                >
                  <span className="truncate">{draft.model}</span>
                  <ChevronDown className="size-3" />
                </InputGroupButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Model · local demo</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={draft.model} onValueChange={draft.setModel}>
                  {CHAT_MODELS.map((model) => (
                    <DropdownMenuRadioItem key={model} value={model}>
                      {model}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            {tools}
            <div className="ms-auto flex items-center gap-1">
              {onSuggest && (
                <InputGroupButton
                  type="button"
                  size="icon-sm"
                  aria-label="Suggested prompts"
                  onClick={onSuggest}
                >
                  <Lightbulb />
                </InputGroupButton>
              )}
              <InputGroupButton
                type={busy ? "button" : "submit"}
                size="icon-sm"
                variant="default"
                className="rounded-full"
                aria-label={busy ? "Stop response" : "Send message"}
                disabled={!busy && !draft.value.trim()}
                onClick={busy ? onStop : undefined}
              >
                {busy ? <Square /> : <ArrowUp />}
              </InputGroupButton>
            </div>
          </InputGroupAddon>
        </InputGroup>
      </Field>
      <div className="mt-2 flex items-center justify-between gap-2 px-1 text-[10px] text-muted-foreground">
        <span role="status">
          {attached.length
            ? `${attached.length} context ${attached.length === 1 ? "file" : "files"} staged`
            : "Local demo · review before using"}
        </span>
        <span className="flex items-center gap-1">
          <Kbd className="text-[9px]">↵</Kbd>Send
        </span>
      </div>
    </form>
  );
}
