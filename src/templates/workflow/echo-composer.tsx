/**
 * Composes the actual free ReUI Frame, c-input-group-18 and c-attachment-2 examples.
 * https://reui.io/r/radix-nova/c-frame-1.json
 * https://reui.io/r/radix-nova/c-input-group-18.json
 * https://reui.io/r/radix-nova/c-attachment-2.json
 * MIT notice: src/components/reui/REUI-LICENSE.txt.
 * Local context receipts extend the examples; no remote connector is invoked.
 */
import { useId, useState } from "react";
import {
  Activity,
  ArrowUp,
  Brain,
  ChevronDown,
  Database,
  FileText,
  FolderGit2,
  Image,
  Mic,
  Paperclip,
  Plus,
  X,
} from "lucide-react";
import { useFileUpload } from "@/hooks/use-file-upload";
import { Frame, FrameHeader, FramePanel } from "@/components/reui/frame";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";
import "./echo-composer.css";

// Original local geometric illustration, not a screenshot from the reference.
const snapshot = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="280" viewBox="0 0 480 280">
  <rect width="480" height="280" rx="16" fill="#eef2ff"/>
  <rect x="24" y="24" width="432" height="40" rx="8" fill="#fff"/>
  <rect x="24" y="84" width="130" height="172" rx="8" fill="#c7d2fe"/>
  <rect x="174" y="84" width="282" height="76" rx="8" fill="#fff"/>
  <rect x="174" y="180" width="130" height="76" rx="8" fill="#a5b4fc"/>
  <rect x="324" y="180" width="132" height="76" rx="8" fill="#818cf8"/>
</svg>`;

export function EchoComposer({
  value,
  onChange,
  think,
  onThink,
  search,
  onSearch,
  onSend,
  dictation = true,
}: {
  value: string;
  onChange: (value: string) => void;
  think: boolean;
  onThink: (value: boolean) => void;
  search: boolean;
  onSearch: (value: boolean) => void;
  onSend: (context: string[]) => void;
  dictation?: boolean;
}) {
  const id = useId();
  const [noticeVisible, setNoticeVisible] = useState(true);
  const [scopes, setScopes] = useState<string[]>([]);
  const [{ files, errors }, upload] = useFileUpload({
    multiple: true,
    maxFiles: 6,
    maxSize: 25 * 1024 * 1024,
  });
  const count = Number(think) + Number(search);
  function submit() {
    if (!value.trim()) return;
    onSend([...files.map(({ file }) => file.name), ...scopes]);
    upload.clearFiles();
    setScopes([]);
  }
  function addScope(scope: string) {
    setScopes((current) => (current.includes(scope) ? current : [...current, scope]));
  }
  return (
    <form
      className="echo-reference-form echo-frame-composer"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <input {...upload.getInputProps()} aria-label="Attach files" className="sr-only" />
      <Frame spacing="sm" dense>
        {noticeVisible && (
          <FrameHeader className="echo-usage-header">
            <div className="echo-usage-summary">
              <Activity aria-hidden="true" />
              <span className="echo-usage-copy">
                Context 64 percent full
                <span aria-hidden="true"> · </span>
                Plan limit resets Friday 12:00 PM
              </span>
              <ChevronDown className="echo-usage-chevron" aria-hidden="true" />
            </div>
            <InputGroupButton
              type="button"
              size="icon-xs"
              aria-label="Dismiss usage notice"
              onClick={() => setNoticeVisible(false)}
            >
              <X />
            </InputGroupButton>
          </FrameHeader>
        )}
        <FramePanel className="echo-composer-panel">
          <InputGroup className="border-0 bg-transparent shadow-none has-disabled:bg-transparent has-disabled:opacity-100 dark:has-disabled:bg-input/30">
            {files.length + scopes.length > 0 && (
              <InputGroupAddon align="block-start">
                <AttachmentGroup role="group" aria-label="Attached context">
                  {files.map(({ file, id: fileId }) => (
                    <Attachment key={fileId} size="xs">
                      <AttachmentMedia>
                        <FileText />
                      </AttachmentMedia>
                      <AttachmentContent>
                        <AttachmentTitle>{file.name}</AttachmentTitle>
                      </AttachmentContent>
                      <AttachmentActions>
                        <AttachmentAction
                          type="button"
                          aria-label={`Remove ${file.name}`}
                          onClick={() => upload.removeFile(fileId)}
                        >
                          <X />
                        </AttachmentAction>
                      </AttachmentActions>
                    </Attachment>
                  ))}
                  {scopes.map((scope) => (
                    <Attachment key={scope} size="xs">
                      <AttachmentMedia>
                        {scope.includes("read only") ? <Database /> : <FolderGit2 />}
                      </AttachmentMedia>
                      <AttachmentContent>
                        <AttachmentTitle>{scope}</AttachmentTitle>
                      </AttachmentContent>
                      <AttachmentActions>
                        <AttachmentAction
                          type="button"
                          aria-label={`Remove ${scope}`}
                          onClick={() =>
                            setScopes((current) => current.filter((item) => item !== scope))
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
              id={id}
              aria-label="Message Bricklane Chat"
              placeholder="Ask anything, or describe what you want changed…"
              value={value}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  submit();
                }
              }}
            />
            <InputGroupAddon align="block-end" className="echo-compose-tools">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <InputGroupButton type="button" size="icon-sm" aria-label="Add context" />
                  }
                >
                  <Plus />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" side="top" className="echo-context-menu">
                  <DropdownMenuLabel>Add context</DropdownMenuLabel>
                  <DropdownMenuItem onSelect={upload.openFileDialog}>
                    <Paperclip />
                    <span>
                      Upload files<small>PDF, CSV, images</small>
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() =>
                      upload.addFiles([
                        new File([snapshot], "workspace-snapshot.svg", { type: "image/svg+xml" }),
                      ])
                    }
                  >
                    <Image />
                    <span>
                      Add screenshot<small>Workspace snapshot</small>
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => addScope("bricklane/platform")}>
                    <FolderGit2 />
                    <span>
                      Connect repo<small>GitHub, GitLab</small>
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => addScope("analytics, read only")}>
                    <Database />
                    <span>
                      Query database<small>Read only</small>
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <InputGroupButton
                type="button"
                size="sm"
                variant={think ? "secondary" : "ghost"}
                aria-pressed={think}
                onClick={() => onThink(!think)}
              >
                <Brain />
                Think
              </InputGroupButton>
              <InputGroupButton
                type="button"
                size="sm"
                variant={search ? "secondary" : "ghost"}
                aria-pressed={search}
                onClick={() => onSearch(!search)}
              >
                <Globe />
                Search
              </InputGroupButton>
              {count > 0 && (
                <span className="echo-tool-count" aria-live="polite">
                  ● {count} {count === 1 ? "tool" : "tools"}
                </span>
              )}
              <div className="echo-composer-actions">
                {dictation && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <span
                            className="echo-dictation-control"
                            tabIndex={0}
                            aria-label="Dictation unavailable"
                          />
                        }
                      >
                        <InputGroupButton
                          type="button"
                          size="icon-sm"
                          aria-label="Dictate message"
                          disabled
                        >
                          <Mic />
                        </InputGroupButton>
                      </TooltipTrigger>
                      <TooltipContent className="reui-reference echo-dictation-tooltip">
                        Dictation is unavailable in this local preview.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                <InputGroupButton
                  type="submit"
                  variant="default"
                  size="icon-sm"
                  aria-label="Send message"
                  disabled={!value.trim()}
                >
                  <ArrowUp />
                </InputGroupButton>
              </div>
            </InputGroupAddon>
          </InputGroup>
        </FramePanel>
      </Frame>
      {errors.length > 0 && (
        <p role="alert" className="echo-upload-error">
          {errors.join(" ")}
        </p>
      )}
    </form>
  );
}
