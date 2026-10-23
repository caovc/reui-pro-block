import { Database, FileText } from "lucide-react";
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from "@/components/ui/attachment";
import { chatSources } from "./branching-chat-data";
import type { ChatNode } from "./branching-chat-data";

type SourcesProps = {
  sources: ChatNode["sources"];
  selectedIndex?: number;
  onSelect: (index: number) => void;
};

export default function Sources({
  sources,
  selectedIndex = -1,
  onSelect,
}: SourcesProps) {
  const entries = sources?.filter((index) => chatSources[index]);
  if (!entries?.length) return null;
  const numbered = entries.length === 3;

  return (
    <section
      className="flex min-w-0 flex-col gap-1.5"
      role="group"
      aria-label="Sources"
    >
      <h4 className="text-[13px]/[18.5714px] font-medium text-muted-foreground">
        <span className="tabular-nums">{entries.length}</span>{" "}
        {numbered ? "Sources" : "Documents Read"}
      </h4>
      <AttachmentGroup className="gap-2">
        {entries.map((index) => {
          const source = chatSources[index];
          const Icon = source.title.endsWith(".yaml") ? Database : FileText;
          return (
            <Attachment
              key={index}
              size="xs"
              state="done"
              data-active={selectedIndex === index}
              className="max-w-56 transition-colors has-data-[slot=attachment-content]:px-1 data-[active=true]:border-primary/50 data-[active=true]:bg-primary/5"
            >
              <AttachmentMedia className="text-muted-foreground">
                <Icon />
              </AttachmentMedia>
              <AttachmentContent>
                <AttachmentTitle className="flex items-center gap-1.5 text-[13px]">
                  {numbered && (
                    <span className="text-muted-foreground tabular-nums">
                      {index + 1}
                    </span>
                  )}
                  <span className="min-w-0 truncate">{source.title}</span>
                </AttachmentTitle>
                <AttachmentDescription>{source.detail}</AttachmentDescription>
              </AttachmentContent>
              <AttachmentTrigger
                aria-label={`Source${numbered ? ` ${index + 1}` : ""}, ${source.title}`}
                aria-pressed={selectedIndex === index}
                onClick={() => onSelect(index)}
              />
            </Attachment>
          );
        })}
      </AttachmentGroup>
    </section>
  );
}
