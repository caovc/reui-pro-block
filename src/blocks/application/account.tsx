import { useState } from "react";
import { Check, Copy, Gift, Mail, Mic, Plus, Settings, Trash2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Person, toast } from "./shared";
import type { BlockMeta } from "@/data/types";
export default function AccountPanel({ block }: { block: BlockMeta }) {
  const [accounts, setAccounts] = useState(["alex@acme.com", "alex.morgan@gmail.com"]);
  const [copied, setCopied] = useState(false);
  const [role, setRole] = useState("Member");
  const [permissions, setPermissions] = useState([
    "View content",
    "Create content",
    "Edit own content",
  ]);
  const [active, setActive] = useState(false);
  if (/Permissions|Capabilities/.test(block.name))
    return (
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap gap-2">
          {["Admin", "Member", "Guest"].map((r) => (
            <Button
              variant={role === r ? "secondary" : "outline"}
              size="sm"
              key={r}
              onClick={() => {
                setRole(r);
                setPermissions(
                  r === "Admin"
                    ? [
                        "View content",
                        "Create content",
                        "Edit own content",
                        "Delete content",
                        "Invite members",
                        "Manage roles",
                        "Manage billing",
                      ]
                    : r === "Guest"
                      ? ["View content"]
                      : ["View content", "Create content", "Edit own content"],
                );
              }}
            >
              {r}
            </Button>
          ))}
        </div>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Capability</TableHead>
                <TableHead className="text-right">Allowed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                "View content",
                "Create content",
                "Edit own content",
                "Delete content",
                "Invite members",
                "Manage roles",
                "Manage billing",
              ].map((p) => (
                <TableRow key={p}>
                  <TableCell className="text-xs">{p}</TableCell>
                  <TableCell className="text-right">
                    <Checkbox
                      aria-label={p}
                      checked={permissions.includes(p)}
                      onCheckedChange={(v) =>
                        setPermissions(v ? [...permissions, p] : permissions.filter((n) => n !== p))
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground">
          Changes apply to all members assigned the {role.toLowerCase()} role.
        </p>
      </div>
    );
  if (/Mailbox/.test(block.name))
    return (
      <div className="flex flex-col gap-4">
        {accounts.map((a, i) => (
          <Card className="shadow-none" key={a}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg border">
                  <Mail className="size-5" />
                </span>
                <div>
                  <CardTitle className="text-sm">{a}</CardTitle>
                  <CardDescription className="mt-1 text-xs">
                    {i === 0 ? "Google Workspace" : "Gmail"} · Connected
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Disconnect ${a}`}
                onClick={() => {
                  setAccounts(accounts.filter((n) => n !== a));
                  toast("Mailbox disconnected");
                }}
              >
                <Trash2 />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-xs">
                <span>Sync incoming emails</span>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        ))}
        <Button
          variant="outline"
          onClick={() => {
            setAccounts([...accounts, `new-account-${accounts.length + 1}@acme.com`]);
            toast.success("Demo mailbox connected");
          }}
        >
          <Plus />
          Connect another mailbox
        </Button>
      </div>
    );
  if (/Referral/.test(block.name))
    return (
      <div className="flex flex-col gap-6">
        <Card className="shadow-none">
          <CardHeader>
            <Gift className="mb-3 size-7" />
            <CardTitle className="text-lg">Good things are better shared.</CardTitle>
            <CardDescription className="leading-6">
              Invite a friend to Acme and you’ll both get $25 in account credits when they join Pro.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-2 text-xs font-medium">Your referral link</p>
            <div className="flex gap-2">
              <Input
                aria-label="Referral link"
                readOnly
                value="https://acme.example/invite/alex-m"
              />
              <Button
                variant="outline"
                size="icon"
                aria-label="Copy referral link"
                onClick={() => {
                  navigator.clipboard?.writeText("https://acme.example/invite/alex-m");
                  setCopied(true);
                  toast.success("Referral link copied");
                }}
              >
                {copied ? <Check /> : <Copy />}
              </Button>
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-3 gap-4">
          {[
            ["12", "Friends invited"],
            ["4", "Signed up"],
            ["$100", "Credits earned"],
          ].map(([v, t]) => (
            <div key={t} className="rounded-lg border p-4">
              <p className="text-2xl font-semibold">{v}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">{t}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-4">
          {["Olivia Rhye", "Phoenix Baker", "Lana Steiner"].map((p, i) => (
            <div key={p} className="flex items-center justify-between">
              <Person
                name={p}
                sub={["Joined Oct 12", "Joined Oct 15", "Invited Oct 20"][i]}
                compact
              />
              <Badge variant="outline">{i < 2 ? "Reward earned" : "Pending"}</Badge>
            </div>
          ))}
        </div>
      </div>
    );
  return (
    <div className="flex flex-col gap-5">
      <Card className="shadow-none">
        <CardHeader className="flex flex-row justify-between">
          <div>
            <CardTitle className="text-base">Your meeting assistant</CardTitle>
            <CardDescription className="mt-1">
              Capture the conversation. Keep the insights.
            </CardDescription>
          </div>
          <span className="flex size-10 items-center justify-center rounded-xl border">
            <Mic className="size-5" />
          </span>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Auto-join meetings</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Automatically capture meetings from your calendar.
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator className="my-5" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Generate summaries</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Get key takeaways and action items after every call.
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator className="my-5" />
          <Button
            className="w-full"
            onClick={() => {
              setActive(!active);
              toast(active ? "Recording stopped" : "Demo recording started");
            }}
          >
            <Video />
            {active ? "Stop recording" : "Record a meeting"}
          </Button>
          {active && (
            <div className="mt-4">
              <p className="mb-3 text-xs text-muted-foreground">Recording in progress…</p>
              <Progress value={42} />
            </div>
          )}
        </CardContent>
      </Card>
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="flex items-center gap-3">
          <Settings className="size-5" />
          <div>
            <p className="text-sm font-medium">Connected calendar</p>
            <p className="mt-1 text-xs text-muted-foreground">alex@acme.com · Google Calendar</p>
          </div>
        </div>
        <Badge variant="outline">Connected</Badge>
      </div>
    </div>
  );
}
