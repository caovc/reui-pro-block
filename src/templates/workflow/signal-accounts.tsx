import { useState, type FormEvent } from "react";
import { Frame, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { accountHandover, initialAccounts, initialTeam } from "./signal-model";

type Team = typeof initialTeam;

export function SignalAccounts({ team }: { team: Team }) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [active, setActive] = useState("");
  const [message, setMessage] = useState("");
  return (
    <Frame>
      <FrameHeader>
        <FrameTitle>Account ownership</FrameTitle>
      </FrameHeader>
      <FramePanel>
        <ul className="divide-y">
          {accounts.map((account) => {
            const owner = team.find(({ id }) => account.owner === id);
            const recipient = accountHandover(accounts, team, account.owner);
            return (
              <li
                key={account.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div>
                  <p className="font-medium">{account.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {owner?.name} · {account.open} open requests
                  </p>
                </div>
                <Dialog
                  open={active === account.id}
                  onOpenChange={(open) => setActive(open ? account.id : "")}
                >
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" aria-label={`Hand over ${account.name}`}>
                      Hand over
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Hand over {account.name}</DialogTitle>
                      <DialogDescription>
                        {recipient.name} has the lowest open workload among the other teammates.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setActive("")}>
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          setAccounts((previous) =>
                            previous.map((item) =>
                              item.id === account.id ? { ...item, owner: recipient.id } : item,
                            ),
                          );
                          setActive("");
                          setMessage(`${account.name} is now assigned to ${recipient.name}.`);
                        }}
                      >
                        Confirm handover
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </li>
            );
          })}
        </ul>
        {message && (
          <p className="mt-4 text-sm" role="status">
            {message}
          </p>
        )}
      </FramePanel>
    </Frame>
  );
}

export function SignalSettings({
  team,
  onTeamChange,
  signInHref,
}: {
  team: Team;
  onTeamChange: (team: Team) => void;
  signInHref: string;
}) {
  return (
    <Frame>
      <FrameHeader>
        <FrameTitle>Workspace team</FrameTitle>
        <Button variant="outline" size="sm" asChild>
          <a href={signInHref}>Demo sign in</a>
        </Button>
      </FrameHeader>
      <FramePanel>
        <ul className="divide-y">
          {team.map((member) => (
            <li className="flex flex-wrap items-center justify-between gap-3 py-3" key={member.id}>
              <span className="font-medium">{member.name}</span>
              <Select
                value={member.role}
                onValueChange={(value) =>
                  onTeamChange(
                    team.map((item) => (item.id === member.id ? { ...item, role: value } : item)),
                  )
                }
              >
                <SelectTrigger aria-label={`${member.name} role`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Lead">Lead</SelectItem>
                  <SelectItem value="Analyst">Analyst</SelectItem>
                  <SelectItem value="Viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </li>
          ))}
        </ul>
      </FramePanel>
    </Frame>
  );
}

export function SignalSignIn() {
  const [message, setMessage] = useState("");
  function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "")
      .trim()
      .toLowerCase();
    setMessage(
      email === "demo@brick.test"
        ? "A production workspace would send a one-time sign-in link."
        : "Use demo@brick.test to preview a sign-in link.",
    );
  }
  return (
    <Frame className="max-w-lg">
      <FrameHeader>
        <FrameTitle>Email sign-in preview</FrameTitle>
      </FrameHeader>
      <FramePanel>
        <form onSubmit={signIn} className="grid gap-4">
          <p className="text-sm text-muted-foreground">
            Use demo@brick.test to preview email sign-in. The demo runs locally.
          </p>
          <label className="grid gap-2 text-sm">
            Email address
            <Input name="email" type="email" autoComplete="email" required />
          </label>
          <Button type="submit">Preview sign-in link</Button>
          {message && (
            <p role="status" className="text-sm">
              {message}
            </p>
          )}
        </form>
      </FramePanel>
    </Frame>
  );
}
