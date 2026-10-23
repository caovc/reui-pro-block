import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type LocalMember = { email: string; role: string };

export function InviteForm({ onAdd }: { onAdd: (member: LocalMember) => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Editor");

  return (
    <form
      className="empty-team-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (!email.trim()) return;
        onAdd({ email: email.trim().toLowerCase(), role });
        setEmail("");
      }}
    >
      <label>
        Email address
        <Input
          type="email"
          required
          autoComplete="off"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="teammate@example.com"
          maxLength={160}
        />
      </label>
      <label>
        Workspace role
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["Owner", "Editor", "Reviewer"].map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      <Button type="submit">Create local invite</Button>
    </form>
  );
}
