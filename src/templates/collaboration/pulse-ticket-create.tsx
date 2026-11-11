import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Observed form body: https://pulse-helpdesk.reui.io/tickets (New ticket).
 * Reuses the existing ReUI free Field/Input/Textarea/Select implementations and
 * the FieldLabel/control-id composition used by the project's Pro SettingsFields.
 * Free source notice: src/components/reui/REUI-LICENSE.txt; dependency notices:
 * THIRD_PARTY_NOTICES.md. Sheet, footer actions and canonical records stay owned
 * by the caller; no original avatar, artwork or brand asset is distributed here.
 */
export interface PulseCreateTicketInput {
  subject: string;
  requester: string;
  customer: string;
  queue: string;
  priority: string;
  agent: string;
}

export interface PulseCreateTicketFieldsProps {
  formId: string;
  agents: string[];
  onSubmit: (input: PulseCreateTicketInput) => void;
}

export function PulseCreateTicketFields({
  formId,
  agents,
  onSubmit,
}: PulseCreateTicketFieldsProps) {
  return (
    <form
      id={formId}
      className="min-w-0"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        onSubmit({
          subject: String(data.get("subject") ?? "").trim(),
          requester: String(data.get("requester") ?? "").trim(),
          customer: String(data.get("customer") ?? "").trim(),
          queue: String(data.get("queue") ?? ""),
          priority: String(data.get("priority") ?? ""),
          agent: String(data.get("agent") ?? ""),
        });
      }}
    >
      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel htmlFor={`${formId}-subject`}>What happened</FieldLabel>
          <Textarea
            id={`${formId}-subject`}
            name="subject"
            placeholder="Checkout fails with a card error the bank cannot see"
            rows={2}
            required
          />
        </Field>
        <div className="grid min-w-0 grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor={`${formId}-requester`}>Reported by</FieldLabel>
            <Input id={`${formId}-requester`} name="requester" placeholder="Hana Kim" required />
          </Field>
          <Field>
            <FieldLabel htmlFor={`${formId}-customer`}>Account</FieldLabel>
            <Input
              id={`${formId}-customer`}
              name="customer"
              placeholder="Meridian Retail"
              required
            />
          </Field>
        </div>
        <div className="grid min-w-0 grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor={`${formId}-queue`}>Queue</FieldLabel>
            <Select name="queue" required>
              <SelectTrigger id={`${formId}-queue`}>
                <SelectValue placeholder="Pick a queue" />
              </SelectTrigger>
              <SelectContent className="reui-reference">
                {["Technical", "Billing", "Onboarding", "Account"].map((queue) => (
                  <SelectItem key={queue} value={queue}>
                    {queue}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor={`${formId}-priority`}>Priority</FieldLabel>
            <Select name="priority" defaultValue="Normal" required>
              <SelectTrigger id={`${formId}-priority`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="reui-reference">
                {["Low", "Normal", "High", "Urgent"].map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    {priority}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor={`${formId}-agent`}>Assign to</FieldLabel>
          <Select name="agent" required>
            <SelectTrigger id={`${formId}-agent`}>
              <SelectValue placeholder="Pick an agent" />
            </SelectTrigger>
            <SelectContent className="reui-reference">
              {agents.map((agent) => (
                <SelectItem key={agent} value={agent}>
                  {agent}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </FieldGroup>
    </form>
  );
}
