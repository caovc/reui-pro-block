// Actual official free REUI c-popover-3. MIT (c) Keenthemes.
// https://reui.io/r/radix-nova/c-popover-3.json
// Retains Popover/Header/Title/Description/FieldGroup form composition.
// Dimension inputs become an email field; controlled submit/validation are local adapters.
import { useState } from "react";
import { Plus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
  PopoverTrigger,
} from "@/components/ui/popover";
export function InvitePopover({ onInvite }: { onInvite: (email: string) => void }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Invite team member">
          <UserPlus />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!valid) return;
            onInvite(email.trim());
            setEmail("");
            setOpen(false);
          }}
        >
          <PopoverHeader>
            <PopoverTitle>Invite to workspace</PopoverTitle>
            <PopoverDescription>Save an invitation in this local demo.</PopoverDescription>
          </PopoverHeader>
          <FieldGroup className="gap-2">
            <Field>
              <FieldLabel htmlFor="navbar-invite-email">Email address</FieldLabel>
              <Input
                id="navbar-invite-email"
                type="email"
                placeholder="colleague@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </Field>
          </FieldGroup>
          <Button size="sm" type="submit" disabled={!valid}>
            <Plus data-icon="inline-start" />
            Send invite
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
