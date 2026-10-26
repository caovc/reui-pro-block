/** Connected Apps: actual REUI free Frame, c-combobox-26, c-item-11 and
 * c-radio-group-16 compositions; audited official sources, not Pro code.
 * https://reui.io/r/radix-nova/c-combobox-26.json
 * https://reui.io/r/radix-nova/c-item-11.json
 * MIT, Copyright (c) 2025 Keenthemes Inc.; preserve REUI-LICENSE.txt.
 * Independent receipts/grants are local application state. Initials replace
 * original integration art; no OAuth or external integration is invoked.
 */
import { useId, useState } from "react";
import { Check, FileText, Plug, RotateCcw, Sparkles, X } from "lucide-react";
import { Badge } from "@/components/reui/badge";
import { Frame, FrameFooter, FramePanel } from "@/components/reui/frame";
import { IconTile } from "@/components/reui/icon-tile";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import { Message, MessageContent, MessageHeader } from "@/components/ui/message";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useChatDraft } from "./ai-chat-draft";
import { CHAT_CONTEXTS } from "./ai-chat-session";
import {
  APP_JOB_MODES,
  WORK_APPS,
  appRunAnswer,
  connectRunSource,
  createAppRun,
  useConnectedRun,
} from "./ai-chat-connected-model";
import WorkspaceComposer from "./ai-chat-workspace-composer";

function AppScope({
  connected,
  onChange,
}: {
  connected: string[];
  onChange: (ids: string[]) => void;
}) {
  const selected = WORK_APPS.filter((app) => connected.includes(app.id));
  return (
    <Combobox
      multiple
      items={WORK_APPS}
      value={selected}
      onValueChange={(apps) => onChange(apps.map((app) => app.id))}
      itemToStringLabel={(app) => `${app.label} ${app.hint}`}
      itemToStringValue={(app) => app.id}
      isItemEqualToValue={(app, value) => app.id === value.id}
      autoHighlight
    >
      <ComboboxTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 min-w-0 text-xs"
            aria-label="Choose connected apps"
          />
        }
      >
        <ComboboxValue placeholder="Connect apps">
          {(apps: typeof WORK_APPS) => (
            <span className="truncate">
              {apps.length
                ? `${apps.length} connected ${apps.length === 1 ? "app" : "apps"}`
                : "Connect apps"}
            </span>
          )}
        </ComboboxValue>
      </ComboboxTrigger>
      <ComboboxContent className="w-72 max-w-[calc(100vw-2rem)]">
        <ComboboxInput showTrigger={false} placeholder="Find an app…" aria-label="Find an app" />
        <ComboboxEmpty>No apps found.</ComboboxEmpty>
        <ComboboxList>
          {(app: (typeof WORK_APPS)[number]) => (
            <ComboboxItem key={app.id} value={app}>
              <span
                className="flex size-6 shrink-0 items-center justify-center rounded border bg-muted/40 text-[9px] font-semibold"
                aria-hidden="true"
              >
                {app.mark}
              </span>
              <span className="min-w-0">
                <span className="block text-xs">{app.label}</span>
                <span className="block truncate text-[10px] text-muted-foreground">{app.hint}</span>
              </span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

export default function ConnectedAppsChat() {
  const id = useId();
  const draft = useChatDraft();
  const [connected, setConnected] = useState(["drive", "slack", "calendar"]);
  const [mode, setMode] = useState("catchup");
  const { run, setRun } = useConnectedRun();
  const busy = run?.status === "running";
  const pending = run?.receipts.find((entry) => entry.status === "pending");
  const answer = run && !pending ? appRunAnswer(run) : "";
  const shownAnswer = run?.status === "complete" ? answer : answer.slice(0, run?.revealed ?? 0);
  return (
    <div className="flex min-h-svh w-full flex-col bg-background" data-ai-chat="connected">
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b px-5">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="size-4" />
          Workspace assistant
        </div>
        {run && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => {
              setRun(null);
              draft.prepare("");
            }}
          >
            <RotateCcw />
            New request
          </Button>
        )}
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-7 px-4 py-10 sm:py-16">
        {!run && (
          <Empty className="flex-none gap-5 border-0 p-0">
            <IconTile variant="frame" size="lg">
              <Sparkles />
            </IconTile>
            <EmptyHeader>
              <EmptyTitle className="text-2xl tracking-tight">
                Your work, brought together
              </EmptyTitle>
              <EmptyDescription>
                Ask a question across the apps you choose. Every answer shows what was read and what
                was skipped.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
        <RadioGroup
          aria-label="Job mode"
          value={mode}
          onValueChange={(value) => {
            setMode(value);
            const next = APP_JOB_MODES.find((entry) => entry.id === value);
            if (next) draft.prepare(next.prompt);
          }}
          className="flex flex-wrap justify-center gap-x-5 gap-y-3"
        >
          {APP_JOB_MODES.map((entry) => (
            <Field key={entry.id} orientation="horizontal" className="w-auto gap-1.5">
              <RadioGroupItem value={entry.id} id={`${id}-${entry.id}`} />
              <FieldLabel
                htmlFor={`${id}-${entry.id}`}
                className="cursor-pointer text-xs font-normal"
              >
                {entry.label}
              </FieldLabel>
            </Field>
          ))}
        </RadioGroup>
        <Frame spacing="sm" data-connected-composer>
          <FramePanel className="p-0">
            <div className="p-3">
              <WorkspaceComposer
                draft={draft}
                sources={CHAT_CONTEXTS.slice(0, 2)}
                busy={Boolean(busy)}
                onStop={() =>
                  setRun((current) => (current ? { ...current, status: "stopped" } : current))
                }
                onSend={(text, meta) =>
                  setRun((current) =>
                    createAppRun((current?.id ?? 0) + 1, text, mode, connected, meta),
                  )
                }
              />
            </div>
          </FramePanel>
          <FrameFooter className="flex-row flex-wrap items-center gap-1.5 py-1.5">
            <AppScope connected={connected} onChange={setConnected} />
            <div className="ms-auto flex flex-wrap gap-1">
              {WORK_APPS.filter((app) => connected.includes(app.id)).map((app) => (
                <Tooltip key={app.id}>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Disconnect ${app.label}`}
                      className="group relative rounded border bg-background text-[9px] font-semibold"
                      onClick={() =>
                        setConnected((current) => current.filter((value) => value !== app.id))
                      }
                    >
                      <span aria-hidden="true" className="group-hover:opacity-0">
                        {app.mark}
                      </span>
                      <X className="absolute size-3 opacity-0 group-hover:opacity-100" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{app.label} · remove from next request</TooltipContent>
                </Tooltip>
              ))}
            </div>
          </FrameFooter>
        </Frame>
        {run && (
          <section aria-label="Request receipts" className="min-w-0 space-y-5" data-app-run>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="min-w-0 truncate font-medium">
                {APP_JOB_MODES.find((entry) => entry.id === run.modeId)?.label}
              </span>
              <Badge variant={run.status === "complete" ? "success-light" : "outline"}>
                {run.status === "complete"
                  ? "Complete"
                  : run.status === "stopped"
                    ? "Stopped"
                    : pending
                      ? "Reading sources"
                      : "Writing answer"}
              </Badge>
            </div>
            <p className="rounded-lg bg-muted/60 px-3 py-2 text-sm">{run.prompt}</p>
            <ItemGroup className="gap-2">
              {run.receipts.map((receipt) => {
                const app = WORK_APPS.find((entry) => entry.id === receipt.appId)!;
                const live = busy && pending?.appId === app.id;
                return (
                  <Item
                    key={app.id}
                    role="listitem"
                    variant="outline"
                    size="xs"
                    data-source-receipt={app.id}
                  >
                    <ItemMedia variant="icon">
                      <span
                        className="flex size-7 items-center justify-center rounded-md border bg-muted/40 text-[9px] font-semibold"
                        aria-hidden="true"
                      >
                        {app.mark}
                      </span>
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle className="text-xs">{app.label}</ItemTitle>
                      <ItemDescription className="text-[11px]">
                        {receipt.status === "read"
                          ? "Read original local demo content"
                          : receipt.status === "skipped"
                            ? "Skipped · app not connected for this request"
                            : live
                              ? "Reading permitted source…"
                              : "Waiting for the preceding source"}
                      </ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      {receipt.status === "skipped" ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          aria-label={`Connect ${app.label} and read source`}
                          onClick={() => {
                            setConnected((current) => [...new Set([...current, app.id])]);
                            setRun((current) =>
                              current ? connectRunSource(current, app.id) : current,
                            );
                          }}
                        >
                          <Plug />
                          Connect
                        </Button>
                      ) : receipt.status === "read" ? (
                        <Badge variant="success-light" size="sm">
                          <Check />
                          Read
                        </Badge>
                      ) : live ? (
                        <Spinner className="size-3.5" />
                      ) : (
                        <span className="text-[10px] text-muted-foreground">Pending</span>
                      )}
                    </ItemActions>
                  </Item>
                );
              })}
            </ItemGroup>
            <Message>
              <MessageContent>
                <MessageHeader className="gap-2 px-0">
                  <Sparkles className="size-3.5" />
                  Bricklane assistant
                  <span className="ms-auto text-[10px] font-normal">{run.meta.model}</span>
                </MessageHeader>
                <span role="status" className="sr-only">
                  {run.status === "complete"
                    ? "Answer ready"
                    : run.status === "stopped"
                      ? "Request stopped"
                      : pending
                        ? "Reading sources"
                        : "Writing answer"}
                </span>
                <Bubble variant="ghost" aria-busy={Boolean(busy)}>
                  <BubbleContent>
                    {shownAnswer ? (
                      <div className="space-y-3" data-scoped-answer>
                        {shownAnswer.split("\n\n").map((paragraph, index) => (
                          <p key={index} className="whitespace-pre-wrap leading-6">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <Marker>
                        <MarkerIcon>{busy ? <Spinner /> : <FileText />}</MarkerIcon>
                        <MarkerContent>
                          {run.status === "stopped"
                            ? "Stopped before an answer was ready."
                            : "Checking the source scope…"}
                        </MarkerContent>
                      </Marker>
                    )}
                  </BubbleContent>
                </Bubble>
              </MessageContent>
            </Message>
            {run.status === "stopped" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setRun((current) => (current ? { ...current, status: "running" } : current))
                }
              >
                Resume request
              </Button>
            )}
            <p className="text-[10px] leading-5 text-muted-foreground">
              Scope is captured when sending. Changing the app strip affects the next request;
              Connect on a skipped receipt explicitly grants and replays that source. This demo does
              not contact external apps.
            </p>
          </section>
        )}
        {!run && (
          <p className="text-center text-[11px] leading-5 text-muted-foreground">
            Original demo content · no account connection or external search
          </p>
        )}
      </main>
    </div>
  );
}
