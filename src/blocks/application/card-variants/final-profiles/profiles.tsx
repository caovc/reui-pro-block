import { useState } from "react";
import { Bar, BarChart } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import {
  BadgeCheck,
  Box,
  CheckCircle2,
  Mail,
  MapPin,
  UserRound,
  UserRoundPlus,
} from "lucide-react";
import { Frame, FramePanel } from "@/components/reui/frame";
import { Badge } from "@/components/reui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarBadge,
  AvatarGroup,
} from "@/components/ui/avatar";
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Item, ItemContent, ItemTitle, ItemDescription, ItemActions } from "@/components/ui/item";
import jenny from "@/blocks/application/assets/schedule-emma-wilson.jpg";
import ralph from "@/blocks/application/assets/schedule-james-park.jpg";
import ari from "@/blocks/application/assets/schedule-sarah-chen.jpg";
import mila from "@/blocks/application/assets/schedule-sofia-reyes.jpg";
import theo from "@/blocks/application/assets/schedule-liam-torres.jpg";
import { Stage } from "../extended/common";
import "./final-profiles.css";
export function CustomerProfile() {
  const [connected, setConnected] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  return (
    <Stage id={42} width={320}>
      <Frame variant="ghost" dense>
        <FramePanel className="profile-card-mesh flex flex-col items-center gap-5 p-5">
          <Avatar className="size-20 data-[size=lg]:size-20" size="lg">
            <AvatarImage src={jenny} alt="Jenny Klabber" />
            <AvatarFallback>JK</AvatarFallback>
            <AvatarBadge
              className="bottom-auto top-1 bg-green-500"
              aria-label="Online"
              role="img"
            />
          </Avatar>
          <div className="flex flex-col items-center gap-2">
            <h2 className="flex items-center gap-1.5 text-base font-semibold">
              Jenny Klabber
              <BadgeCheck
                className="size-4 text-blue-500"
                role="img"
                aria-label="Verified profile"
              />
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Box className="size-3.5" />
                KeenThemes
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="size-3.5" />
                jenny@kteam.com
              </span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs text-muted-foreground/60">TEAM</p>
            <AvatarGroup aria-label="Ari Lane, Mila Stone, K, Theo Vale">
              {[
                [ari, "Ari Lane", "AL"],
                [mila, "Mila Stone", "MS"],
                ["", "K", "K"],
                [theo, "Theo Vale", "TV"],
              ].map(([src, name, initials]) => (
                <Avatar key={name} size="sm">
                  {src ? <AvatarImage src={src} alt={name} /> : null}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              ))}
            </AvatarGroup>
          </div>
          <Frame variant="ghost" dense className="my-1 w-full">
            <FramePanel className="grid grid-cols-3 bg-muted/30 px-2 py-2.5">
              {[
                ["92", "Orders"],
                ["$69", "Avg. Price"],
                ["$6,240", "Total Spent"],
              ].map(([value, label]) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1 border-r last:border-0"
                >
                  <p className="text-sm font-medium">{value}</p>
                  <p className="text-[11px] text-muted-foreground">{label}</p>
                </div>
              ))}
            </FramePanel>
          </Frame>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            aria-pressed={connected}
            onClick={() => {
              if (connected) setDisconnecting(true);
              else setConnected(true);
            }}
          >
            {connected ? <CheckCircle2 /> : <UserRoundPlus />}
            {connected ? "Connected" : "Connect"}
          </Button>
        </FramePanel>
      </Frame>
      <Dialog open={disconnecting} onOpenChange={setDisconnecting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect Jenny Klabber?</DialogTitle>
            <DialogDescription>
              Change the connection in this local preview. No contact or account data is sent.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDisconnecting(false)}>
              Keep connection
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setConnected(false);
                setDisconnecting(false);
              }}
            >
              Disconnect locally
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Stage>
  );
}
const projects = [
  { title: "Analytics Suite", id: "PX-102", kind: "analytics" },
  { title: "Mobile Checkout", id: "UX-384", kind: "checkout" },
  { title: "Metrics Console", id: "DS-471", kind: "console" },
] as const;
type Project = (typeof projects)[number];
// Independent UI miniatures replace the reference's remote Unsplash project photos.
// Surfaces and status chips remain real free Frame/Badge rather than image extracts.
const thumbnailData = [28, 49, 40, 65, 44, 76, 62, 88].map((visitors, index) => ({
  period: index + 1,
  visitors,
}));
function ProjectThumbnail({ kind }: { kind: Project["kind"] }) {
  return (
    <div className={`profile-project-thumb profile-project-${kind}`} aria-hidden="true">
      <div className="profile-project-appbar">
        <span />
        <span />
        <span />
      </div>
      {kind === "checkout" ? (
        <div className="profile-project-phone">
          <div className="mb-1 h-2 w-7 rounded-sm bg-muted" />
          <Badge size="xs" variant="success-light">
            Paid
          </Badge>
          <div className="my-2 flex gap-1">
            {[1, 2, 3].map((n) => (
              <span key={n} className="h-5 flex-1 rounded-sm bg-indigo-100" />
            ))}
          </div>
          <div className="h-2 w-full rounded-sm bg-primary" />
        </div>
      ) : (
        <div className="profile-project-dashboard">
          <aside />
          <main>
            <div className="grid grid-cols-3 gap-1">
              {["26.4k", "8.2k", "+12%"].map((value) => (
                <Frame variant="ghost" dense key={value}>
                  <FramePanel className="p-1 text-[5px] font-medium">{value}</FramePanel>
                </Frame>
              ))}
            </div>
            <ChartContainer
              className="profile-project-chart aspect-auto"
              config={{
                visitors: {
                  label: "Sample visits",
                  color: kind === "console" ? "#56c8b1" : "#7a6cec",
                },
              }}
              initialDimension={{ width: 120, height: 40 }}
            >
              <BarChart
                data={thumbnailData}
                accessibilityLayer={false}
                margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
              >
                <Bar
                  dataKey="visitors"
                  fill="var(--color-visitors)"
                  radius={1}
                  isAnimationActive={false}
                />
              </BarChart>
            </ChartContainer>
            <div className="grid gap-1">
              {[1, 2].map((n) => (
                <span key={n} className="h-1 rounded bg-muted" />
              ))}
            </div>
          </main>
        </div>
      )}
    </div>
  );
}
export function ContributorPortfolio() {
  const [profileOpen, setProfileOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [draft, setDraft] = useState({ name: "", email: "", message: "" });
  const [saved, setSaved] = useState(false);
  return (
    <Stage id={43} width={400}>
      <Frame variant="ghost" dense>
        <FramePanel className="flex flex-col gap-4 p-4">
          <div className="profile-card-cover" aria-label="Abstract muted cover banner" role="img" />
          <Item className="profile-portfolio-info relative -mt-11 items-end gap-3 p-0">
            <Avatar className="size-20 data-[size=lg]:size-20 ring-4 ring-background" size="lg">
              <AvatarImage src={ralph} alt="Ralph Edwards" />
              <AvatarFallback>RE</AvatarFallback>
              <AvatarBadge
                className="right-1 bottom-1 bg-green-500"
                role="img"
                aria-label="Online"
              />
            </Avatar>
            <ItemContent className="min-w-0 gap-0.5 pb-1">
              <ItemTitle className="w-full max-w-full min-w-0 gap-1">
                <span className="truncate">Ralph Edwards</span>
                <BadgeCheck
                  className="size-3.5 shrink-0 text-blue-500"
                  role="img"
                  aria-label="Verified profile"
                />
              </ItemTitle>
              <ItemDescription className="line-clamp-1 truncate text-xs">
                Sacramento, California
              </ItemDescription>
            </ItemContent>
            <ItemActions className="pb-1">
              <Button
                variant="outline"
                size="sm"
                className="gap-1 px-2"
                onClick={() => setProfileOpen(true)}
              >
                <UserRound />
                View Profile
              </Button>
            </ItemActions>
          </Item>
          <ScrollArea type="always" className="w-full" aria-label="Project portfolio">
            <div className="flex w-max gap-2 pb-3">
              {projects.map((p) => (
                <Frame key={p.id} variant="ghost" dense>
                  <FramePanel className="p-0">
                    <Button
                      variant="ghost"
                      className="h-auto w-[136px] flex-col items-stretch gap-0 rounded-[inherit] p-0 text-left"
                      aria-label={`View ${p.title}`}
                      onClick={() => setProject(p)}
                    >
                      <AspectRatio ratio={4 / 3}>
                        <ProjectThumbnail kind={p.kind} />
                      </AspectRatio>
                      <div className="flex flex-col gap-0.5 p-2">
                        <h3 className="truncate text-sm font-medium">{p.title}</h3>
                        <p className="text-xs font-normal text-muted-foreground">
                          Project ID: {p.id}
                        </p>
                      </div>
                    </Button>
                  </FramePanel>
                </Frame>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
          <Button
            className="w-full bg-zinc-900 text-white hover:bg-zinc-800"
            onClick={() => setContactOpen(true)}
          >
            {saved ? "Review message draft" : "Get in Touch"}
          </Button>
        </FramePanel>
      </Frame>
      {saved ? (
        <Alert variant="success" className="mt-3">
          <CheckCircle2 />
          <AlertTitle>Message draft saved</AlertTitle>
          <AlertDescription>This preview did not send a message.</AlertDescription>
        </Alert>
      ) : null}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ralph Edwards</DialogTitle>
            <DialogDescription>Independent contributor profile · local example</DialogDescription>
          </DialogHeader>
          <p className="flex items-center gap-2 text-sm">
            <MapPin className="size-4" />
            Sacramento, California
          </p>
          <p className="text-sm text-muted-foreground">
            Product designer focused on analytics interfaces, checkout flows and developer tools.
          </p>
          <ul className="list-disc space-y-2 pl-5 text-sm">
            {projects.map((p) => (
              <li key={p.id}>
                {p.title} · {p.id}
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!project}
        onOpenChange={(open) => {
          if (!open) setProject(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{project?.title}</DialogTitle>
            <DialogDescription>
              Project ID: {project?.id} · independently composed UI thumbnail
            </DialogDescription>
          </DialogHeader>
          {project ? (
            <AspectRatio ratio={4 / 3}>
              <ProjectThumbnail kind={project.kind} />
            </AspectRatio>
          ) : null}
          <p className="text-sm text-muted-foreground">
            This is a local portfolio sample. No external project service is connected.
          </p>
        </DialogContent>
      </Dialog>
      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Get in touch with Ralph</DialogTitle>
            <DialogDescription>
              Prepare a local message draft. Nothing is sent from this preview.
            </DialogDescription>
          </DialogHeader>
          <form
            className="flex flex-col gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              const d = new FormData(e.currentTarget);
              setDraft({
                name: String(d.get("name")),
                email: String(d.get("email")),
                message: String(d.get("message")),
              });
              setSaved(true);
              setContactOpen(false);
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="portfolio-name">Your name</FieldLabel>
                <Input id="portfolio-name" name="name" defaultValue={draft.name} required />
              </Field>
              <Field>
                <FieldLabel htmlFor="portfolio-email">Your email</FieldLabel>
                <Input
                  id="portfolio-email"
                  name="email"
                  type="email"
                  defaultValue={draft.email}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="portfolio-message">Message</FieldLabel>
                <Textarea
                  id="portfolio-message"
                  name="message"
                  defaultValue={draft.message}
                  required
                />
              </Field>
            </FieldGroup>
            <Button>Save message locally</Button>
          </form>
        </DialogContent>
      </Dialog>
    </Stage>
  );
}
