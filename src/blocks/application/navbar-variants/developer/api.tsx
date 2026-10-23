import { useEffect, useRef, useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { DialogSurface } from "../../dialog-variants/first-run/free/dialog-surface";
import { AccountMenu } from "../first-run/free/account-menu";
import { PlaceholderPanel, ToolbarNotice, ToolbarScene } from "../toolbars/support";
import { useToolbarTheme } from "../toolbars/use-theme";
import { apiServices, type ApiServiceId } from "./data";
import { RequestBar, type HttpMethod } from "./free/request-bar";
import { ServicePicker } from "./free/service-picker";
import "./developer.css";

type LocalResponse = {
  service: string;
  method: HttpMethod;
  path: string;
  status: number;
  body: { demo: true; service: string; count: number; operation: string };
};

export default function ApiDeveloperNavbar() {
  const { theme, setTheme, dark } = useToolbarTheme();
  const [serviceId, setServiceId] = useState<ApiServiceId>("openai");
  const [method, setMethod] = useState<HttpMethod>("GET");
  const [path, setPath] = useState<string>(apiServices[0].path);
  const [sending, setSending] = useState(false);
  const [response, setResponse] = useState<LocalResponse | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [connectOpen, setConnectOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const serviceTrigger = useRef<HTMLButtonElement>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  function changeConnectOpen(open: boolean) {
    setConnectOpen(open);
    // The launch menu item unmounts when its menu closes; return to the stable menu trigger.
    if (!open) requestAnimationFrame(() => serviceTrigger.current?.focus());
  }
  function send() {
    if (sending) return;
    const endpoint = path.trim();
    if (!endpoint.startsWith("/") || endpoint.startsWith("//") || /\s/.test(endpoint)) {
      setNotice("Use a relative API path beginning with one slash, for example /v1/models.");
      return;
    }
    const service = apiServices.find((item) => item.id === serviceId)!;
    const request = { service: service.name, method, path: endpoint };
    setSending(true);
    setNotice(null);
    timer.current = setTimeout(() => {
      setResponse({
        ...request,
        status: method === "POST" ? 201 : 200,
        body: {
          demo: true,
          service: service.id,
          count: service.count,
          operation: method.toLowerCase(),
        },
      });
      setSending(false);
    }, 650);
  }
  return (
    <ToolbarScene id={10} dark={dark}>
      <header className="developer-api-header">
        <div className="developer-brand">
          <BrandMark className="size-8 shrink-0" />
          <span className="sr-only">Bricklane</span>
          <Separator orientation="vertical" className="h-5" />
          <ServicePicker
            triggerRef={serviceTrigger}
            value={serviceId}
            onChange={(next) => {
              setServiceId(next);
              setPath(apiServices.find((item) => item.id === next)!.path);
            }}
            onConnect={() => setConnectOpen(true)}
          />
        </div>
        <RequestBar
          method={method}
          onMethodChange={setMethod}
          path={path}
          onPathChange={setPath}
          sending={sending}
          onSend={send}
        />
        <div className="developer-account">
          <AccountMenu
            theme={theme}
            dark={dark}
            onThemeChange={setTheme}
            onAction={(action) => setNotice(`${action} selected locally. No account was changed.`)}
          />
        </div>
      </header>
      {response ? (
        <Card className="mt-6" aria-label="Local API response">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-sm">Response · {response.service}</CardTitle>
              <Badge variant="success-light">{response.status} · Demo</Badge>
            </div>
            <CardDescription>
              Local fixture only. No request was sent to {response.service}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-3 break-all font-mono text-xs">
              {response.method} {response.path}
            </p>
            <pre className="developer-response-body" aria-label="Response JSON">
              {JSON.stringify(response.body, null, 2)}
            </pre>
          </CardContent>
        </Card>
      ) : (
        <PlaceholderPanel />
      )}
      <ToolbarNotice>{notice}</ToolbarNotice>
      <Dialog open={connectOpen} onOpenChange={changeConnectOpen}>
        <DialogSurface
          id={110}
          title="Connect a service"
          description="This preview uses local service fixtures. Production credentials are never requested or stored."
          footer={
            <Button variant="outline" onClick={() => changeConnectOpen(false)}>
              Close service setup
            </Button>
          }
        >
          <p className="text-sm text-muted-foreground">
            OpenAI, Stripe and Supabase are available as local demonstrations in the service menu.
            Connecting a real account requires a separately implemented secure backend.
          </p>
        </DialogSurface>
      </Dialog>
    </ToolbarScene>
  );
}
