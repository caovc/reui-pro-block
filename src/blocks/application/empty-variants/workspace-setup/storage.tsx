import { useState } from "react";
import { Check, ExternalLink, Folder, X } from "lucide-react";
import { integrationArtwork, svgImage } from "@/lib/demo-artwork";
import { Frame, FramePanel } from "@/components/reui/frame";
import { IconStack } from "@/components/reui/icon-stack";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { WorkspaceDialog, WorkspaceStage } from "./support";

const connectors = [
  { id: "dropbox", name: "Dropbox", initial: "D", color: "#536bb8" },
  { id: "r2", name: "Cloudflare R2", initial: "R2", color: "#c49157" },
  { id: "drive", name: "Google Drive", initial: "G", color: "#72967a" },
  { id: "onedrive", name: "Microsoft OneDrive", initial: "O", color: "#6c8ba8" },
];
type Connector = (typeof connectors)[number];
type LocalSource = { provider: Connector; folder: string };

export default function StorageEmpty() {
  const [selected, setSelected] = useState<Connector | null>(null);
  const [guide, setGuide] = useState(false);
  const [folder, setFolder] = useState("Client delivery");
  const [sources, setSources] = useState<LocalSource[]>([]);

  return (
    <WorkspaceStage id={13}>
      <section className="empty-workspace-page" aria-label="File Sources">
        <h1 className="sr-only">File sources empty state</h1>
        <header className="empty-workspace-header">
          <div>
            <h2>File Sources</h2>
            <p>Connect governed folders for contracts, exports, and client delivery packets.</p>
          </div>
          <Button
            variant="link"
            className="h-auto px-0 font-normal text-muted-foreground"
            onClick={() => setGuide(true)}
          >
            Connector guide
            <ExternalLink className="size-3.5" />
          </Button>
        </header>
        <Separator />
        {sources.length ? (
          <div className="py-8">
            <div className="mb-2 flex items-center gap-2">
              <h2 className="text-base font-semibold">Linked file sources</h2>
              <Badge variant="secondary">Local preview</Badge>
            </div>
            {sources.map((source) => (
              <article className="empty-workspace-linked-source" key={source.provider.id}>
                <Folder className="size-5 shrink-0 text-muted-foreground" />
                <div>
                  <h2>{source.provider.name}</h2>
                  <p>{source.folder} · Read-only sample folder</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Disconnect ${source.provider.name}`}
                  onClick={() =>
                    setSources((current) =>
                      current.filter((entry) => entry.provider.id !== source.provider.id),
                    )
                  }
                >
                  <X />
                </Button>
              </article>
            ))}
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              No external account has been authorized. These connections are local examples only.
            </p>
          </div>
        ) : (
          <Empty className="empty-workspace-source-empty">
            <EmptyHeader>
              <EmptyMedia>
                <IconStack>
                  <Folder className="size-7" strokeWidth={1.5} />
                </IconStack>
              </EmptyMedia>
              <EmptyTitle>No file sources are linked</EmptyTitle>
              <EmptyDescription>
                Attach a storage workspace before review files, billing exports, or signed packets
                can land in this queue.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
        <Frame className="empty-workspace-connectors" aria-label="Storage connector actions">
          {connectors.map((connector) => (
            <FramePanel key={connector.id}>
              <Button
                variant="ghost"
                onClick={() => {
                  setSelected(connector);
                  setFolder(
                    sources.find((source) => source.provider.id === connector.id)?.folder ??
                      "Client delivery",
                  );
                }}
                aria-label={`Connect ${connector.name}`}
              >
                {sources.some((source) => source.provider.id === connector.id) ? (
                  <Check className="size-4 text-success" />
                ) : (
                  <img
                    src={svgImage(integrationArtwork(connector.initial, connector.color))}
                    alt=""
                    aria-hidden="true"
                    className="size-4 rounded-[3px]"
                  />
                )}
                {connector.name}
              </Button>
            </FramePanel>
          ))}
        </Frame>
      </section>
      <WorkspaceDialog
        title={`Connect ${selected?.name ?? "file storage"}`}
        description="Configure a local read-only sample folder. No external account is authorized and no credentials are requested."
        open={selected !== null}
        onOpenChange={(value) => !value && setSelected(null)}
      >
        <form
          className="empty-workspace-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (!selected || !folder.trim()) return;
            setSources((current) => [
              ...current.filter((source) => source.provider.id !== selected.id),
              { provider: selected, folder: folder.trim() },
            ]);
            setSelected(null);
          }}
        >
          <label>
            Folder name
            <Input
              required
              maxLength={80}
              value={folder}
              onChange={(event) => setFolder(event.target.value)}
            />
          </label>
          <div className="rounded-lg border bg-muted/30 p-3 text-sm leading-relaxed text-muted-foreground">
            Read-only example access. Files are not fetched, uploaded, modified or shared by this
            preview.
          </div>
          <Button type="submit">Connect local sample folder</Button>
        </form>
      </WorkspaceDialog>
      <WorkspaceDialog
        title="Connector guide"
        description="Local demonstration of a governed storage setup. No OAuth flow is implemented."
        open={guide}
        onOpenChange={setGuide}
      >
        <ol className="list-decimal space-y-3 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li>Choose one of the four storage providers.</li>
          <li>Name the sample folder your team wants to review.</li>
          <li>Inspect the local connection and disconnect it to restore the empty state.</li>
        </ol>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Provider marks are original typographic demo artwork. They do not represent an official
          integration or vendor endorsement.
        </p>
      </WorkspaceDialog>
    </WorkspaceStage>
  );
}
