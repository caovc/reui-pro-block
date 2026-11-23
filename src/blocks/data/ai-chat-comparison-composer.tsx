/** Actual free ReUI c-input-group-19 and c-attachment-2 composition (MIT).
 * Copyright (c) 2025 Keenthemes Inc.; preserve REUI-LICENSE.txt.
 * Attachments stay in local demo state; no file bytes or prompts are uploaded.
 */
import { useId, useRef, type Ref } from "react";
import { ArrowUp, FileText, MessageSquareQuote, Paperclip, Square, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment";
import { ComparisonTip } from "./ai-chat-comparison-actions";

export type ComparisonFile = { name: string; detail: string };
export default function ComparisonComposer({
  draft,
  onDraft,
  quote,
  onClearQuote,
  files,
  onFiles,
  busy,
  onSend,
  onStop,
  textareaRef,
}: {
  draft: string;
  onDraft: (text: string) => void;
  quote: string;
  onClearQuote: () => void;
  files: ComparisonFile[];
  onFiles: (files: ComparisonFile[]) => void;
  busy: boolean;
  onSend: () => void;
  onStop: () => void;
  textareaRef: Ref<HTMLTextAreaElement>;
}) {
  const id = useId();
  const upload = useRef<HTMLInputElement>(null);
  return (
    <form
      className="comparison-composer"
      data-has-quote={Boolean(quote)}
      onSubmit={(event) => {
        event.preventDefault();
        onSend();
      }}
    >
      <div className="comparison-composer-heading">
        <span>Shared prompt</span>
        <span>Sample answers · files stay on this device</span>
      </div>
      <Field className="gap-0">
        <FieldLabel htmlFor={id} className="sr-only">
          Prompt both models
        </FieldLabel>
        <InputGroup className="comparison-input-group has-disabled:bg-background has-disabled:opacity-100 dark:has-disabled:bg-background">
          {quote && (
            <InputGroupAddon align="block-start" className="comparison-quote">
              <MessageSquareQuote />
              <span>{quote}</span>
              <Button
                type="button"
                size="icon-xs"
                variant="ghost"
                aria-label="Remove quoted selection"
                onClick={onClearQuote}
              >
                <X />
              </Button>
            </InputGroupAddon>
          )}
          <InputGroupTextarea
            ref={textareaRef}
            id={id}
            value={draft}
            onChange={(event) => onDraft(event.target.value)}
            placeholder="What would you like to compare?"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                onSend();
              }
            }}
            className="comparison-prompt"
          />
          <InputGroupAddon align="block-end" className="comparison-composer-actions">
            <AttachmentGroup className="comparison-files" aria-label="Attached local context">
              {files.map((file) => (
                <Attachment key={file.name} size="xs" className="comparison-file">
                  <AttachmentMedia className="comparison-file-icon">
                    <FileText />
                  </AttachmentMedia>
                  <AttachmentContent>
                    <AttachmentTitle className="comparison-file-name">
                      {file.name}
                      <span className="comparison-file-detail"> • {file.detail}</span>
                    </AttachmentTitle>
                  </AttachmentContent>
                  <AttachmentActions>
                    <AttachmentAction
                      aria-label={`Remove ${file.name}`}
                      className="comparison-file-remove"
                      onClick={() => onFiles(files.filter((entry) => entry.name !== file.name))}
                    >
                      <X />
                    </AttachmentAction>
                  </AttachmentActions>
                </Attachment>
              ))}
            </AttachmentGroup>
            <ComparisonTip label="Attach a file to this local demo; nothing is uploaded">
              <InputGroupButton
                type="button"
                size="icon-xs"
                aria-label="Attach a file"
                className="comparison-attach"
                onClick={() => upload.current?.click()}
              >
                <Paperclip />
              </InputGroupButton>
            </ComparisonTip>
            <span className="flex-1" />
            {busy ? (
              <ComparisonTip label="Stop both answers">
                <InputGroupButton
                  type="button"
                  variant="default"
                  size="icon-sm"
                  aria-label="Stop generating"
                  className="comparison-send"
                  onClick={onStop}
                >
                  <Square className="fill-current size-3" />
                </InputGroupButton>
              </ComparisonTip>
            ) : (
              <ComparisonTip label="Send to both models">
                <InputGroupButton
                  type="submit"
                  variant="default"
                  size="icon-sm"
                  aria-label="Send to both models"
                  className="comparison-send"
                  disabled={!draft.trim()}
                >
                  <ArrowUp />
                </InputGroupButton>
              </ComparisonTip>
            )}
          </InputGroupAddon>
        </InputGroup>
      </Field>
      <input
        ref={upload}
        type="file"
        multiple
        className="hidden"
        aria-label="Choose local context files"
        onChange={(event) => {
          const added = Array.from(event.target.files ?? []).map((file) => ({
            name: file.name,
            detail: file.size < 1024 ? `${file.size} B` : `${Math.ceil(file.size / 1024)} KB`,
          }));
          onFiles([
            ...files,
            ...added.filter((file) => !files.some((current) => current.name === file.name)),
          ]);
          event.target.value = "";
        }}
      />
    </form>
  );
}
