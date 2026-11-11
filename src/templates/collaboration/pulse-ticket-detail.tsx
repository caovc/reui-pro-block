import { Badge } from "@/components/reui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Item, ItemContent, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Separator } from "@/components/ui/separator";
import { demoAvatar } from "@/lib/demo-artwork";
import type { PulseTicket } from "./pulse-ticket-model";
import "./pulse-ticket-detail.css";

function DetailRows({ rows }: { rows: readonly (readonly [string, string | undefined])[] }) {
  return (
    <dl className="pulse-ticket-detail-rows">
      {rows
        .filter(([, value]) => Boolean(value))
        .map(([label, value]) => (
          <div className="pulse-ticket-detail-row" key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
    </dl>
  );
}

/** Detail body only: the parent supplies the subject title, Sheet and real actions. */
export function PulseTicketDetail({ ticket }: { ticket: PulseTicket }) {
  const agent = ticket.agent || "Unassigned";
  const initials = agent
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  return (
    <div className="pulse-ticket-detail">
      <div className="pulse-ticket-detail-status">
        {ticket.priority && (
          <Badge
            variant={
              ticket.priority === "Urgent"
                ? "destructive-light"
                : ticket.priority === "High"
                  ? "warning-light"
                  : "outline"
            }
          >
            {ticket.priority}
          </Badge>
        )}
        <Badge variant="outline">{ticket.stage}</Badge>
      </div>
      <Separator decorative={false} />
      <section className="pulse-ticket-detail-section">
        <h3>Ticket</h3>
        <DetailRows
          rows={[
            ["Queue", ticket.queue],
            ["SLA state", ticket.sla],
            ["Due by", ticket.due],
            ["Ticket ID", ticket.id],
          ]}
        />
      </section>
      <Separator decorative={false} />
      <section className="pulse-ticket-detail-section">
        <h3>Customer</h3>
        <DetailRows
          rows={[
            ["Reported by", ticket.requester],
            ["Account", ticket.customer],
            ["Contact", ticket.email],
            ["Account value", ticket.value === "—" ? undefined : ticket.value],
          ]}
        />
      </section>
      <Separator decorative={false} />
      <section className="pulse-ticket-detail-section">
        <h3>Assigned to</h3>
        <Item className="pulse-ticket-detail-assignee">
          <ItemMedia>
            <Avatar className="pulse-ticket-detail-avatar">
              {ticket.agent && <AvatarImage src={demoAvatar(ticket.agent)} alt="" />}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </ItemMedia>
          <ItemContent>
            <ItemTitle>{agent}</ItemTitle>
          </ItemContent>
        </Item>
      </section>
    </div>
  );
}
