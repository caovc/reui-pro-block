import { useState } from "react";
import { ExternalLink, Mail, ShieldCheck } from "lucide-react";
import { IconTile } from "@/components/reui/icon-tile";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose } from "@/components/ui/dialog";
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Separator } from "@/components/ui/separator";
import { DialogSurface } from "../first-run/free/dialog-surface";
import { DialogLauncher } from "../first-run/support";
import { SyncScopeOptions } from "./free/scope-options";

const scopes = [
  {
    id: "headers",
    title: "Headers Only",
    badge: "Recommended",
    description: "Sender, subject, and dates.",
  },
  {
    id: "messages",
    title: "Messages",
    badge: "Better context",
    description: "Thread text for answers.",
  },
];
export default function ConnectionConsentDialog() {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState("headers");
  const [saved, setSaved] = useState<string | null>(null);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogLauncher
        id={14}
        title="Connection consent"
        description="Review the scope before saving a local connection choice."
        icon={<ShieldCheck />}
        action="Open connection consent"
        result={
          saved && (
            <span>
              {saved} selected locally. No OAuth request was started, no Gmail data was accessed,
              and no permission was granted.
            </span>
          )
        }
      >
        <p className="text-sm text-muted-foreground">
          Headers or full message context: choose one sync scope.
        </p>
      </DialogLauncher>
      <DialogSurface
        id={14}
        title="Connect Gmail"
        description="Choose what Gmail can share."
        media={undefined}
        footer={
          <>
            <DialogClose asChild>
              <Button variant="outline" className="flex-1">
                Cancel
              </Button>
            </DialogClose>
            <Button
              className="flex-1"
              onClick={() => {
                setSaved(scopes.find((option) => option.id === scope)!.title);
                setOpen(false);
              }}
            >
              Continue
            </Button>
          </>
        }
      >
        <div
          className="final-consent-provider-rail"
          aria-label="Original demo service and mail provider marks"
        >
          <IconTile variant="frame">
            <span className="text-xs font-semibold">BL</span>
          </IconTile>
          <span aria-hidden="true" className="tracking-widest text-muted-foreground">
            •••
          </span>
          <IconTile variant="frame">
            <Mail />
          </IconTile>
        </div>
        <div className="flex flex-col gap-5">
          <Item className="p-0">
            <ItemMedia>
              <IconTile variant="elevated">
                <ExternalLink />
              </IconTile>
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Google Review</ItemTitle>
              <ItemDescription>Approve permissions on Google&apos;s page.</ItemDescription>
            </ItemContent>
          </Item>
          <Item className="p-0">
            <ItemMedia>
              <IconTile variant="elevated">
                <ShieldCheck />
              </IconTile>
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Data Control</ItemTitle>
              <ItemDescription>Disconnect anytime from settings.</ItemDescription>
            </ItemContent>
          </Item>
          <Separator className="my-2" />
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold">Sync Scope</h3>
            <div className="final-consent-options">
              <SyncScopeOptions value={scope} onChange={setScope} options={scopes} />
            </div>
          </div>
        </div>
      </DialogSurface>
    </Dialog>
  );
}
