import type { ChatDraft } from "./ai-chat-draft";
import { Separator } from "@/components/ui/separator";
/** Actual free REUI c-input-group-18/19 + c-attachment-2 composition.
 * Sources: https://reui.io/r/radix-nova/c-input-group-18.json
 * https://reui.io/r/radix-nova/c-attachment-2.json
 * MIT, Copyright (c) 2025 Keenthemes Inc. Preserve REUI-LICENSE.txt.
 * Keeps the real InputGroup toolbar and conditional AttachmentGroup tray;
 * extends them with controlled original demo metadata and real form submission.
 */
import { useId, useState } from "react";
import {
  ArrowUp,
  Brain,
  Check,
  ChevronDown,
  FileText,
  Globe,
  Mic,
  Plus,
  Square,
  X,
} from "lucide-react";
import { CHAT_CONTEXTS, CHAT_MODELS, type ChatMeta } from "./ai-chat-session";
import { Button } from "@/components/ui/button";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";

export default function ChatComposer({
  draft,
  busy,
  onSend,
  onStop,
  usedTokens = 0,
  effortPicker = false,
  compact = false,
}: {
  draft: ChatDraft;
  busy: boolean;
  onSend: (text: string, meta: ChatMeta) => void;
  onStop: () => void;
  usedTokens?: number;
  effortPicker?: boolean;
  compact?: boolean;
}) {
  const id = useId();
  const [listening, setListening] = useState(false);
  const contexts = CHAT_CONTEXTS.filter((entry) => draft.contextIds.includes(entry.id));
  const available = CHAT_CONTEXTS.filter((entry) => !draft.contextIds.includes(entry.id));
  const estimate = Math.min(64000, usedTokens + draft.contextIds.length * 2400);
  const percent = (estimate / 64000) * 100;
  function submit() {
    if (busy || !draft.value.trim()) return;
    onSend(draft.value, { ...draft.meta, contextIds: [...draft.contextIds] });
    draft.setValue("");
    draft.setContextIds([]);
    setListening(false);
  }
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="min-w-0"
    >
      <Field>
        <FieldLabel htmlFor={id} className="sr-only">
          Message the assistant
        </FieldLabel>
        <InputGroup className="rounded-xl bg-background shadow-xs has-disabled:bg-background has-disabled:opacity-100 dark:has-disabled:bg-background">
          {contexts.length > 0 && (
            <InputGroupAddon align="block-start" className="min-w-0 px-3 pt-2">
              <AttachmentGroup role="group" aria-label="Attached context">
                {contexts.map((entry) => (
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
                            current.filter((value) => value !== entry.id),
                          )
                        }
                      >
                        <X />
                      </AttachmentAction>
                    </AttachmentActions>
                  </Attachment>
                ))}
              </AttachmentGroup>
            </InputGroupAddon>
          )}
          <InputGroupTextarea
            ref={(node) => draft.bindTextarea(node)}
            id={id}
            placeholder="Ask anything, or describe a task…"
            className="field-sizing-content max-h-32 min-h-14 text-sm"
            value={draft.value}
            onChange={(event) => draft.setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                submit();
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
                <DropdownMenuLabel>Add workspace context</DropdownMenuLabel>
                {available.map((entry) => (
                  <DropdownMenuItem
                    key={entry.id}
                    onSelect={() => draft.setContextIds((current) => [...current, entry.id])}
                  >
                    <FileText />
                    <span className="min-w-0">
                      <span className="block text-xs">{entry.name}</span>
                      <span className="block text-[11px] text-muted-foreground">
                        {entry.description}
                      </span>
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {!compact && (
              <InputGroupButton
                type="button"
                variant={draft.webSearch ? "secondary" : "ghost"}
                size="icon-sm"
                aria-label="Web search"
                aria-pressed={draft.webSearch}
                onClick={() => draft.setWebSearch(!draft.webSearch)}
              >
                <Globe />
              </InputGroupButton>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <InputGroupButton
                  type="button"
                  className="h-7 max-w-37 min-w-0 px-2 text-xs"
                  aria-label="Choose model"
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
            {effortPicker ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <InputGroupButton
                    type="button"
                    className="h-7 px-2 text-xs"
                    aria-label="Thinking effort"
                  >
                    {draft.effort}
                    <ChevronDown className="size-3" />
                  </InputGroupButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuRadioGroup
                    value={draft.effort}
                    onValueChange={(value) => {
                      if (value === "Instant" || value === "Extended" || value === "Deep")
                        draft.setEffort(value);
                    }}
                  >
                    {["Instant", "Extended", "Deep"].map((value) => (
                      <DropdownMenuRadioItem value={value} key={value}>
                        {value}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              !compact && (
                <InputGroupButton
                  type="button"
                  aria-label="Extended thinking"
                  aria-pressed={draft.thinking}
                  variant={draft.thinking ? "secondary" : "ghost"}
                  size="icon-sm"
                  onClick={() => draft.setThinking(!draft.thinking)}
                >
                  <Brain />
                </InputGroupButton>
              )
            )}
            <div className="ms-auto flex items-center gap-1">
              <InputGroupButton
                type="button"
                size="icon-sm"
                aria-label="Dictation demo"
                aria-pressed={listening}
                variant={listening ? "secondary" : "ghost"}
                onClick={() => setListening(!listening)}
              >
                <Mic />
              </InputGroupButton>
              <InputGroupButton
                type={busy ? "button" : "submit"}
                variant="default"
                size="icon-sm"
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
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-1 text-[10px] text-muted-foreground">
        <span>
          {listening
            ? "Dictation demo active · no audio is captured"
            : "Local demo replies · review before using"}
        </span>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              size="xs"
              variant="ghost"
              className="h-5 gap-1 px-1 text-[10px]"
              aria-label="Context window"
            >
              <span
                className="size-2.5 rounded-full border-2 border-muted-foreground/40"
                aria-hidden="true"
              />
              {percent.toFixed(0)}%
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-medium">Context window</span>
              <Check className="size-3 text-success" />
            </div>
            <Progress value={percent} aria-label="Estimated context used" className="h-1.5" />
            <p>{estimate.toLocaleString()} / 64,000 estimated tokens</p>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              An original local estimate based on the transcript and staged context. No model
              request or charge is made.
            </p>
            <Separator />
            <p className="flex items-center gap-1 text-[11px]">
              <Kbd>Enter</Kbd> send <span className="px-1">·</span>
              <Kbd>Shift ↵</Kbd> new line
            </p>
          </PopoverContent>
        </Popover>
      </div>
      <span className="sr-only" aria-live="polite">
        {contexts.length} context sources attached
        {listening ? ". Dictation demo active; no audio captured." : ""}
      </span>
    </form>
  );
}
