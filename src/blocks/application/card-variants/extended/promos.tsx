import { useState } from "react";
import { CheckCircle2, Zap } from "lucide-react";
import {
  Frame,
  FramePanel,
  FrameTitle,
  FrameDescription,
} from "@/components/reui/frame";
import { Badge } from "@/components/reui/badge";
import { IconTile } from "@/components/reui/icon-tile";
import { Alert, AlertTitle, AlertDescription } from "@/components/reui/alert";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import aurora from "@/blocks/application/assets/card-extended/gradient-aurora.svg";
import prism from "@/blocks/application/assets/card-extended/gradient-prism.svg";
import openai from "@/blocks/application/assets/card-brands/openai.svg";
import gemini from "@/blocks/application/assets/card-extended/googlegemini.svg";
import cursor from "@/blocks/application/assets/card-extended/cursor.svg";
import n8n from "@/blocks/application/assets/card-extended/n8n.svg";
import { Stage } from "./common";
import { TradeDialog } from "./trade-dialog";

export function UpsellPromo() {
  const [open, setOpen] = useState(false);
  return (
    <Stage id={22} width={288}>
      <Frame>
        <FramePanel className="flex flex-col items-center gap-6 px-4 py-7 text-center">
          <div
            className="extended-promo-art"
            aria-label="Two abstract product preview thumbnails"
          >
            {[
              [aurora, "Abstract aurora preview"],
              [prism, "Abstract prism preview"],
            ].map(([src, alt]) => (
              <Frame key={alt}>
                <FramePanel className="p-0">
                  <AspectRatio ratio={1}>
                    <img src={src} alt={alt} />
                  </AspectRatio>
                </FramePanel>
              </Frame>
            ))}
          </div>
          <div className="flex flex-col items-center gap-4">
            <Badge variant="outline" radius="full" size="sm">
              Play Mode
            </Badge>
            <FrameTitle className="text-lg">Practice Trading Safely</FrameTitle>
            <FrameDescription className="text-xs leading-5 text-foreground">
              Analyze live market data to identify patterns
              <br />
              and respond with precision
            </FrameDescription>
          </div>
          <Button className="rounded-full" onClick={() => setOpen(true)}>
            <Zap />
            Try Demo Trading
          </Button>
        </FramePanel>
      </Frame>
      <TradeDialog open={open} onOpenChange={setOpen} />
    </Stage>
  );
}

export function MonitoringPromo() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [tools, setTools] = useState(["OpenAI", "Gemini"]);
  const [endpoint, setEndpoint] = useState("");
  return (
    <Stage id={23} width={384}>
      <Frame stacked>
        <FramePanel className="extended-monitor-top extended-mesh">
          <div className="absolute left-12 top-9 flex items-center gap-4">
            <h3 className="text-6xl font-semibold tracking-tighter">24</h3>
            <div>
              <p className="text-xs text-muted-foreground">Monitoring</p>
              <span className="text-3xl font-medium text-muted-foreground/40">
                /7
              </span>
            </div>
          </div>
          <div className="extended-monitor-logo left-[224px] top-8">
            <IconTile
              variant="elevated"
              size="xl"
              className="[--icon-tile-size:--spacing(18)]"
            >
              <span
                className="size-6 bg-current"
                role="img"
                aria-label="OpenAI logo"
                style={{
                  maskImage: `url("${openai}")`,
                  maskSize: "contain",
                  maskRepeat: "no-repeat",
                }}
              />
            </IconTile>
          </div>
          <div className="extended-monitor-logo left-[314px] top-8">
            <IconTile
              variant="elevated"
              size="xl"
              className="[--icon-tile-size:--spacing(18)]"
            >
              <img src={gemini} alt="Gemini logo" />
            </IconTile>
          </div>
          <div className="extended-monitor-logo left-[104px] top-[124px]">
            <IconTile
              variant="elevated"
              size="xl"
              className="[--icon-tile-size:--spacing(18)]"
            >
              <img src={cursor} alt="Cursor logo" />
            </IconTile>
          </div>
          <div className="extended-monitor-logo left-[194px] top-[124px]">
            <IconTile
              variant="elevated"
              size="xl"
              className="[--icon-tile-size:--spacing(18)]"
            >
              <img src={n8n} alt="n8n logo" />
            </IconTile>
          </div>
        </FramePanel>
        <FramePanel className="flex flex-col items-center gap-5 px-9 py-8 text-center">
          <FrameTitle className="text-lg">Always On Watch</FrameTitle>
          <FrameDescription className="text-foreground">
            Get continuous oversight of market activity with automated tools
            running day and night.
          </FrameDescription>
          <Button size="sm" onClick={() => setOpen(true)}>
            {name ? "Monitoring configured" : "Start Monitoring"}
          </Button>
        </FramePanel>
      </Frame>
      {name && (
        <Alert variant="success" className="mt-3">
          <CheckCircle2 />
          <AlertTitle>{name}</AlertTitle>
          <AlertDescription>
            Local monitor configured for {tools.join(", ") || "no services"}. No
            background polling is running.
          </AlertDescription>
        </Alert>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure monitoring demo</DialogTitle>
            <DialogDescription>
              Prepare a local monitor configuration. Connect your backend to run
              real checks.
            </DialogDescription>
          </DialogHeader>
          <form
            className="flex flex-col gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              const d = new FormData(e.currentTarget);
              setName(String(d.get("name")));
              setEndpoint(String(d.get("endpoint")));
              setOpen(false);
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="monitor-name">Monitor name</FieldLabel>
                <Input
                  id="monitor-name"
                  name="name"
                  defaultValue={name}
                  required
                  placeholder="Production API"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="monitor-url">Endpoint URL</FieldLabel>
                <Input
                  id="monitor-url"
                  name="endpoint"
                  defaultValue={endpoint}
                  type="url"
                  required
                  placeholder="https://api.example.com/health"
                />
              </Field>
              <FieldSet>
                <FieldLegend>Services</FieldLegend>
                <div className="grid grid-cols-2 gap-3">
                  {["OpenAI", "Gemini", "Cursor", "n8n"].map((tool) => (
                    <Field orientation="horizontal" key={tool}>
                      <Checkbox
                        id={`monitor-${tool}`}
                        checked={tools.includes(tool)}
                        onCheckedChange={(v) =>
                          setTools(
                            v
                              ? [...tools, tool]
                              : tools.filter((s) => s !== tool),
                          )
                        }
                      />
                      <FieldLabel htmlFor={`monitor-${tool}`}>
                        {tool}
                      </FieldLabel>
                    </Field>
                  ))}
                </div>
              </FieldSet>
            </FieldGroup>
            <Button>Save monitor locally</Button>
          </form>
        </DialogContent>
      </Dialog>
    </Stage>
  );
}
