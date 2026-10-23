import { useState } from "react";
import { ArrowLeft, BookOpen, CalendarDays, LifeBuoy, Mail, Sparkles, Video } from "lucide-react";
import { demoAvatar } from "@/lib/demo-artwork";
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert";
import { Badge } from "@/components/reui/badge";
import { IconTile } from "@/components/reui/icon-tile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DialogSurface } from "../first-run/free/dialog-surface";
import { DialogLauncher } from "../first-run/support";

const helpRoutes = [
  {
    id: "guides",
    title: "Setup guides",
    description: "Admin and onboarding references.",
    action: "Open guides",
    icon: BookOpen,
  },
  {
    id: "walkthrough",
    title: "Short walkthroughs",
    description: "Quick lessons for rollout.",
    action: "Watch videos",
    icon: Video,
  },
  {
    id: "feedback",
    title: "Product feedback",
    description: "Share missing patterns.",
    action: "Send feedback",
    icon: Sparkles,
  },
] as const;
const guideSteps = [
  {
    id: "owners",
    title: "Set the owners",
    text: "Name a launch owner and backup approver, then choose a review window the whole team can use.",
  },
  {
    id: "apps",
    title: "Choose your tools",
    text: "Open the app picker, find a tool by name, and inspect a local connection before adding a real integration to your application.",
  },
  {
    id: "fallback",
    title: "Prepare a fallback",
    text: "Keep an escalation inbox and digest cadence ready so the next owner knows where a paused workflow needs attention.",
  },
];
type SupportView = "guides" | "walkthrough" | "feedback" | "session" | "email" | null;

export default function SupportHubDialog() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<SupportView>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [slot, setSlot] = useState("Tue 10:00 UTC");
  const [outcome, setOutcome] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogLauncher
        id={7}
        title="Support hub"
        description="Find the right next step for your workspace."
        icon={<LifeBuoy />}
        action="Open support hub"
      >
        <ItemGroup>
          {helpRoutes.map((route) => (
            <Item size="xs" key={route.id}>
              <ItemMedia variant="icon">
                <route.icon />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{route.title}</ItemTitle>
                <ItemDescription>{route.description}</ItemDescription>
              </ItemContent>
            </Item>
          ))}
        </ItemGroup>
      </DialogLauncher>
      <DialogSurface
        id={7}
        title="Need a hand with setup?"
        description="Choose the fastest path to the right team."
        footer={null}
      >
        {view ? (
          <div className="flex flex-col gap-5">
            <Button variant="ghost" className="self-start" onClick={() => setView(null)}>
              <ArrowLeft data-icon="inline-start" />
              Back to support
            </Button>
            {view === "guides" ? (
              <div className="flex flex-col gap-4">
                <h3 className="text-base font-semibold">Setup guides</h3>
                {guideSteps.map((step, index) => (
                  <Card key={step.id}>
                    <CardHeader>
                      <CardTitle>
                        {index + 1}. {step.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed text-muted-foreground">{step.text}</p>
                    </CardContent>
                  </Card>
                ))}
                <p className="text-xs text-muted-foreground">
                  Local reference material for this demonstration.
                </p>
              </div>
            ) : view === "walkthrough" ? (
              <div className="flex flex-col gap-4">
                <h3 className="text-base font-semibold">Local setup walkthrough</h3>
                <p className="text-sm text-muted-foreground">
                  No video service is connected. Explore the steps of this local walkthrough.
                </p>
                <Tabs defaultValue="owners">
                  <TabsList className="w-full">
                    {guideSteps.map((step, index) => (
                      <TabsTrigger key={step.id} value={step.id}>
                        Step {index + 1}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {guideSteps.map((step) => (
                    <TabsContent value={step.id} key={step.id}>
                      <Card>
                        <CardHeader>
                          <CardTitle>{step.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm leading-relaxed text-muted-foreground">
                            {step.text}
                          </p>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            ) : view === "session" ? (
              <FieldGroup>
                <Field>
                  <FieldLabel>Example office-hours slot</FieldLabel>
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    value={slot}
                    onValueChange={(value) => value && setSlot(value)}
                    className="flex-wrap"
                    aria-label="Example office hours"
                  >
                    {["Tue 10:00 UTC", "Wed 14:00 UTC", "Thu 16:30 UTC"].map((time) => (
                      <ToggleGroupItem key={time} value={time}>
                        {time}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </Field>
                <p className="text-sm text-muted-foreground">
                  These are local example slots. No calendar is connected or appointment booked.
                </p>
                <Button
                  onClick={() => {
                    setOutcome(`${slot} · Session draft saved locally. No appointment was booked.`);
                    setView(null);
                  }}
                >
                  Save session draft
                </Button>
              </FieldGroup>
            ) : (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  setOutcome(
                    `${subject.trim()} — ${message.trim()}. ${view === "email" ? "Support email" : "Feedback"} draft saved locally; nothing was sent.`,
                  );
                  setView(null);
                }}
              >
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="support-draft-subject">Subject</FieldLabel>
                    <Input
                      id="support-draft-subject"
                      value={subject}
                      onChange={(event) => setSubject(event.target.value)}
                      required
                      maxLength={100}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="support-draft-message">
                      {view === "email" ? "Support message" : "Feedback"}
                    </FieldLabel>
                    <Textarea
                      id="support-draft-message"
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      required
                      maxLength={1200}
                    />
                  </Field>
                  <p className="text-sm text-muted-foreground">
                    No support mailbox is connected. This saves a local draft only.
                  </p>
                  <Button type="submit">Save local draft</Button>
                </FieldGroup>
              </form>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <ItemGroup className="workspace-support-routes">
              {helpRoutes.map((route) => (
                <Item key={route.id}>
                  <ItemMedia>
                    <IconTile variant="frame">
                      <route.icon />
                    </IconTile>
                  </ItemMedia>
                  <ItemContent className="min-w-0">
                    <ItemTitle>{route.title}</ItemTitle>
                    <ItemDescription>{route.description}</ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <Button variant="outline" size="sm" onClick={() => setView(route.id)}>
                      {route.action}
                    </Button>
                  </ItemActions>
                </Item>
              ))}
            </ItemGroup>
            <div>
              <p className="mb-3 text-xs text-muted-foreground">Escalation paths</p>
              <div className="workspace-support-cards">
                <Card>
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <Avatar className="size-10">
                        <AvatarImage
                          src={demoAvatar("Mina Cole advisor")}
                          alt="Advisor demo avatar"
                        />
                        <AvatarFallback>MC</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <CardTitle>Advisor office hours</CardTitle>
                        <CardDescription>Guided setup review.</CardDescription>
                      </div>
                      <Badge variant="info-light" size="sm">
                        Office hours
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Bring setup questions for a faster next step.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" onClick={() => setView("session")}>
                      <CalendarDays data-icon="inline-start" />
                      Reserve a session
                    </Button>
                  </CardFooter>
                </Card>
                <Card>
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <IconTile variant="frame">
                        <Mail />
                      </IconTile>
                      <div>
                        <CardTitle>Direct support desk</CardTitle>
                        <CardDescription>Account and product help.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Replies usually land within one business day.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" variant="outline" onClick={() => setView("email")}>
                      Email support
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
            {outcome && (
              <Alert variant="success">
                <AlertTitle>Local support draft</AlertTitle>
                <AlertDescription>{outcome}</AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </DialogSurface>
    </Dialog>
  );
}
