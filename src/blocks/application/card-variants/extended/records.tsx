import { useState } from "react";
import {
  Check,
  CircleCheck,
  Clock,
  Eye,
  Globe,
  MapPin,
  Monitor,
  Banknote,
  Plus,
  Zap,
} from "lucide-react";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
  FrameDescription,
} from "@/components/reui/frame";
import { Badge } from "@/components/reui/badge";
import { IconTile } from "@/components/reui/icon-tile";
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
} from "@/components/ui/item";
import binance from "@/blocks/application/assets/card-extended/binance.svg";
import coinbase from "@/blocks/application/assets/card-extended/coinbase.svg";
import { Stage, People, RecordMenu } from "./common";
import { TradeDialog } from "./trade-dialog";

export function InstalledIntegration() {
  const [title, setTitle] = useState("LeadForge CRM");
  const [description, setDescription] = useState(
    "Sync contacts, track opportunities, and forecast deals in one unified workspace.",
  );
  const [live, setLive] = useState(true);
  const [editing, setEditing] = useState(false);
  const [guide, setGuide] = useState(false);
  return (
    <Stage id={16} width={320}>
      <Frame className="overflow-hidden bg-zinc-950 p-0.5" stacked>
        <div className="extended-integration-band extended-dots">
          <div className="flex items-center justify-between gap-2">
            <Badge variant="invert" size="sm">
              <Check />
              {live ? "Live" : "Paused"}
            </Badge>
            <RecordMenu title={title} onEdit={() => setEditing(true)} />
          </div>
          <img src={binance} alt="Binance logo" />
        </div>
        <FramePanel className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <FrameTitle>{title}</FrameTitle>
            <Badge variant="secondary" size="xs">
              Installed
            </Badge>
          </div>
          <FrameDescription>{description}</FrameDescription>
          <People />
        </FramePanel>
        <FramePanel fit className="p-3">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setGuide(true)}
          >
            Integration Guide
          </Button>
        </FramePanel>
      </Frame>
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit integration</DialogTitle>
            <DialogDescription>
              Update the installed app's local preview details.
            </DialogDescription>
          </DialogHeader>
          <form
            className="flex flex-col gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              const d = new FormData(e.currentTarget);
              setTitle(String(d.get("title")));
              setDescription(String(d.get("description")));
              setEditing(false);
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="integration-name">App name</FieldLabel>
                <Input
                  id="integration-name"
                  name="title"
                  defaultValue={title}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="integration-description">
                  Description
                </FieldLabel>
                <Textarea
                  id="integration-description"
                  name="description"
                  defaultValue={description}
                  required
                />
              </Field>
              <Field orientation="horizontal">
                <FieldLabel htmlFor="integration-live">Live status</FieldLabel>
                <Switch
                  id="integration-live"
                  checked={live}
                  onCheckedChange={setLive}
                />
              </Field>
            </FieldGroup>
            <Button>Save integration</Button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={guide} onOpenChange={setGuide}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title} integration guide</DialogTitle>
            <DialogDescription>
              Sample setup checklist; your installed state stays local.
            </DialogDescription>
          </DialogHeader>
          <ol className="flex list-decimal flex-col gap-3 pl-5 text-sm">
            <li>Create a scoped token in your workspace.</li>
            <li>Connect the account to your own backend.</li>
            <li>Choose the contacts and opportunities to sync.</li>
          </ol>
          <Button variant="outline" onClick={() => setGuide(false)}>
            Close guide
          </Button>
        </DialogContent>
      </Dialog>
    </Stage>
  );
}

export function CryptoQuote() {
  const [following, setFollowing] = useState(false);
  const [trade, setTrade] = useState(false);
  return (
    <Stage id={19} width={624}>
      <Frame>
        <FrameHeader className="flex-row flex-wrap items-center justify-between gap-2">
          <FrameTitle>Asset Overview</FrameTitle>
          <span className="text-xs text-muted-foreground">
            Updated Mar 3, 7:32 AM GMT+7
          </span>
        </FrameHeader>
        <FramePanel className="extended-quote-panel">
          <div className="flex flex-col gap-3">
            <p className="flex items-center gap-2 text-xs">
              <Globe className="size-4 text-muted-foreground" />
              BTS/USD | CRYPTOCURRENCY
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-2xl font-semibold tracking-tight">
                $93,725.75 USD
              </h3>
              <span className="text-xs text-success-foreground">
                +2.42% (+$2,215.87)
              </span>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              variant="outline"
              size="sm"
              aria-pressed={following}
              onClick={() => setFollowing(!following)}
            >
              {following ? <Check /> : <Plus />}
              {following ? "Following" : "Follow"}
            </Button>
            <Button size="sm" onClick={() => setTrade(true)}>
              <img src={binance} alt="" className="size-3" />
              Trade on Binance
            </Button>
          </div>
        </FramePanel>
      </Frame>
      <TradeDialog open={trade} onOpenChange={setTrade} />
    </Stage>
  );
}

export function JobRecommendation() {
  const [details, setDetails] = useState(false);
  const [apply, setApply] = useState(false);
  const [saved, setSaved] = useState(false);
  const [draft, setDraft] = useState({ name: "", email: "" });
  return (
    <Stage id={24} width={592}>
      <Frame>
        <FrameHeader>
          <FrameTitle className="flex items-center gap-2">
            <Zap className="size-4 text-muted-foreground" />
            Recommended Role, based on your profile
          </FrameTitle>
        </FrameHeader>
        <FramePanel className="flex flex-col gap-4">
          <Item className="p-0">
            <ItemMedia>
              <IconTile variant="solid" size="lg" className="bg-zinc-950">
                <img className="size-6" src={binance} alt="Binance logo" />
              </IconTile>
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Software Engineer</ItemTitle>
              <ItemDescription>Resend</ItemDescription>
            </ItemContent>
          </Item>
          <Separator />
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <span className="flex items-center gap-2">
              <MapPin className="size-4 text-muted-foreground" />
              Berlin, Germany
            </span>
            <span className="flex items-center gap-2">
              <Monitor className="size-4 text-muted-foreground" />
              Hybrid
            </span>
            <span className="flex items-center gap-2">
              <Banknote className="size-4 text-muted-foreground" />
              $60-75k/year
            </span>
          </div>
          <FrameDescription>
            Join the engineering team at CloudCore to build scalable cloud
            platforms. Collaborate on backend systems, APIs, and modern
            infrastructure to deliver enterprise solutions worldwide.
          </FrameDescription>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setApply(true)}>
              {saved ? "Draft saved" : "Quick Apply"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDetails(true)}
            >
              View Details
            </Button>
          </div>
        </FramePanel>
      </Frame>
      <Dialog open={details} onOpenChange={setDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Software Engineer</DialogTitle>
            <DialogDescription>
              Resend · Berlin, Germany · Hybrid
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Build reliable APIs, improve developer tooling, and collaborate with
            product teams on scalable cloud systems.
          </p>
          <ul className="flex list-disc flex-col gap-2 pl-5 text-sm">
            <li>Experience building and testing backend services.</li>
            <li>Clear technical communication and collaborative planning.</li>
            <li>Familiarity with cloud infrastructure and observability.</li>
          </ul>
          <Button
            onClick={() => {
              setDetails(false);
              setApply(true);
            }}
          >
            Prepare application
          </Button>
        </DialogContent>
      </Dialog>
      <Dialog open={apply} onOpenChange={setApply}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Application draft</DialogTitle>
            <DialogDescription>
              Save a local example. This preview does not submit an application.
            </DialogDescription>
          </DialogHeader>
          <form
            className="flex flex-col gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              setDraft({
                name: String(data.get("name")),
                email: String(data.get("email")),
              });
              setSaved(true);
              setApply(false);
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="applicant-name">Full name</FieldLabel>
                <Input
                  id="applicant-name"
                  name="name"
                  defaultValue={draft.name}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="applicant-email">Email</FieldLabel>
                <Input
                  id="applicant-email"
                  name="email"
                  defaultValue={draft.email}
                  type="email"
                  required
                />
              </Field>
            </FieldGroup>
            <Button>Save local application</Button>
          </form>
        </DialogContent>
      </Dialog>
      {saved && (
        <Alert variant="success" className="mt-3">
          <CircleCheck />
          <AlertTitle>Application draft saved</AlertTitle>
          <AlertDescription>No application has been sent.</AlertDescription>
        </Alert>
      )}
    </Stage>
  );
}

export function ApplicationSummary() {
  return (
    <Stage id={27}>
      <Frame>
        <FramePanel className="extended-summary">
          <div>
            <h3>Created</h3>
            <p>
              <img src={coinbase} alt="Coinbase" className="size-4" />
              Coinbase<span className="text-muted-foreground">24m ago</span>
            </p>
          </div>
          <div>
            <h3>Status</h3>
            <p>
              <span className="size-1.5 rounded-full bg-success" />
              Ready
            </p>
          </div>
          <div>
            <h3>Mobile</h3>
            <p>
              <Clock className="size-3.5 text-muted-foreground" />
              49s<span className="text-muted-foreground">24m ago</span>
            </p>
          </div>
          <div>
            <h3>Email</h3>
            <p>
              <Eye className="size-3.5 text-muted-foreground" />
              Preview
            </p>
          </div>
          <div>
            <h3>Domain</h3>
            <p>
              <Globe className="size-3.5 text-muted-foreground" />
              reui.io
              <Badge variant="info-light" size="xs">
                Main
              </Badge>
            </p>
          </div>
          <div className="extended-dots">
            <h3>Team</h3>
            <People extra={1} />
          </div>
        </FramePanel>
      </Frame>
    </Stage>
  );
}
