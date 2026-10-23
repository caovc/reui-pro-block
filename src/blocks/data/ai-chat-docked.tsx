/** Original document/docked-assistant controller composed from actual free
 * REUI chat parts in the imported transcript/composer and IconStack/IconTile.
 * Document Insert/Undo and responsive Sheet are application wiring, not a fake
 * AI backend. Public reference desktop/mobile inspection remains pending.
 */
import { useState } from "react";
import {
  ArrowLeft,
  Check,
  FileText,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Share2,
  Sparkles,
  Undo2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/reui/badge";
import { IconStack } from "@/components/reui/icon-stack";
import { IconTile } from "@/components/reui/icon-tile";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import ChatComposer from "./ai-chat-composer";
import { useChatDraft } from "./ai-chat-draft";
import ChatHistory from "./ai-chat-history";
import { useChatSession } from "./ai-chat-session";
import ChatTranscript from "./ai-chat-transcript";

export default function DockedAssistant() {
  const session = useChatSession("release");
  const draft = useChatDraft();
  const mobile = useIsMobile();
  const [open, setOpen] = useState(true);
  const [insertedBody, setInsertedBody] = useState("");
  function insert(body: string) {
    setInsertedBody((current) => (current === body ? "" : body));
  }
  const panel = (
    <div className="flex h-full min-h-0 w-full flex-col bg-background" data-docked-panel>
      <header className="flex h-12 shrink-0 items-center justify-between gap-1 border-b px-2">
        <div className="flex min-w-0 flex-1 items-center gap-1">
          <Sparkles className="ms-1 size-3.5 shrink-0" />
          <ChatHistory session={session} />
        </div>
        <div className="flex shrink-0 gap-0.5">
          <Button
            size="icon-xs"
            variant="ghost"
            aria-label="New assistant conversation"
            onClick={() => {
              session.selectThread("new");
              draft.prepare("");
            }}
          >
            <Plus />
          </Button>
          <Button
            size="icon-xs"
            variant="ghost"
            aria-label="Close assistant"
            onClick={() => setOpen(false)}
          >
            {mobile ? <X /> : <PanelRightClose />}
          </Button>
        </div>
      </header>
      <div className="min-h-0 flex-1">
        {session.thread?.turns.length ? (
          <ChatTranscript session={session} onInsert={insert} insertedBody={insertedBody} />
        ) : (
          <Empty className="h-full gap-4 px-5">
            <IconStack>
              <FileText className="size-5" />
            </IconStack>
            <EmptyHeader>
              <EmptyTitle className="text-base">Work on the document together</EmptyTitle>
              <EmptyDescription>
                Ask for a section, then insert its draft into the page.
              </EmptyDescription>
            </EmptyHeader>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                draft.prepare("Draft a release summary for the customer note", ["release"])
              }
            >
              Draft the customer update
            </Button>
          </Empty>
        )}
      </div>
      <footer className="shrink-0 border-t px-3 pt-3 pb-3">
        <ChatComposer
          draft={draft}
          busy={Boolean(session.pending)}
          onSend={session.send}
          onStop={session.stop}
          compact
          usedTokens={Math.ceil(
            (session.thread?.turns.reduce((sum, turn) => sum + turn.body.length, 0) ?? 0) / 4,
          )}
        />
      </footer>
    </div>
  );
  return (
    <div className="flex h-svh min-h-0 w-full overflow-hidden bg-background" data-ai-chat="docked">
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 text-xs">
            <ArrowLeft className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate text-muted-foreground">Documents</span>
            <span className="text-muted-foreground">/</span>
            <span className="truncate">Release notes</span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="text-xs"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    "https://example.com/bricklane/workspace/release-notes",
                  );
                  toast.success("Demo document link copied");
                } catch {
                  toast.error("Clipboard unavailable");
                }
              }}
            >
              <Share2 />
              <span className="max-sm:sr-only">Share</span>
            </Button>
            <Button
              size="sm"
              variant={open ? "secondary" : "outline"}
              className="text-xs"
              aria-label={open ? "Hide assistant" : "Open assistant"}
              onClick={() => setOpen(!open)}
            >
              <PanelRightOpen />
              <span className="max-sm:sr-only">Assistant</span>
            </Button>
          </div>
        </header>
        <ScrollArea className="min-h-0 flex-1">
          <article className="mx-auto w-full max-w-3xl px-5 py-9 sm:px-10 sm:py-12">
            <IconTile variant="frame">
              <FileText />
            </IconTile>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight">Workspace release notes</h1>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <div className="flex -space-x-2" aria-label="Original demo collaborators">
                {["JL", "SK", "AR"].map((initials) => (
                  <Avatar key={initials} className="size-6 border-2 border-background">
                    <AvatarFallback className="text-[9px]">{initials}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <span>Jamie, Sam and Ari</span>
              <span>Local draft</span>
            </div>
            <div className="mt-9 space-y-10">
              <section className="space-y-3" aria-label="Document introduction placeholder">
                <Skeleton className="h-4 w-2/5" />
                <Skeleton className="h-2.5 w-full" />
                <Skeleton className="h-2.5 w-11/12" />
                <Skeleton className="h-2.5 w-4/5" />
              </section>
              <section
                aria-labelledby="customer-draft-heading"
                className="rounded-xl border p-4 sm:p-5"
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <h2 id="customer-draft-heading" className="text-base font-semibold">
                    Customer update
                  </h2>
                  {insertedBody ? (
                    <Badge variant="success-light">
                      <Check />
                      Inserted locally
                    </Badge>
                  ) : (
                    <Badge variant="outline">Draft section</Badge>
                  )}
                </div>
                {insertedBody ? (
                  <div data-inserted-draft className="space-y-4 text-sm leading-7">
                    {insertedBody.split("\n\n").map((paragraph, index) => (
                      <p key={index} className="whitespace-pre-wrap">
                        {paragraph}
                      </p>
                    ))}
                    <Button size="sm" variant="outline" onClick={() => setInsertedBody("")}>
                      <Undo2 />
                      Undo insertion
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Ask the assistant for a draft, then use Insert into draft to add it here.
                    </p>
                    <Skeleton className="h-2.5 w-11/12" />
                    <Skeleton className="h-2.5 w-3/4" />
                  </div>
                )}
              </section>
              <section className="space-y-3" aria-label="Rollout checklist placeholder">
                <Skeleton className="h-4 w-1/3" />
                {["w-full", "w-4/5", "w-11/12"].map((width) => (
                  <Skeleton key={width} className={`h-2.5 ${width}`} />
                ))}
              </section>
            </div>
          </article>
        </ScrollArea>
      </div>
      {!mobile && open && (
        <aside aria-label="Docked assistant" className="h-full w-96 shrink-0 border-s">
          {panel}
        </aside>
      )}
      {mobile && (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            showCloseButton={false}
            className="gap-0 p-0"
            style={{ width: "min(100vw, 28rem)" }}
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Document assistant</SheetTitle>
              <SheetDescription>
                Draft a reply and insert it into the local document.
              </SheetDescription>
            </SheetHeader>
            {panel}
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
