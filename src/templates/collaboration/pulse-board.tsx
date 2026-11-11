import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnContent,
  KanbanItem,
  KanbanItemHandle,
} from "@/components/reui/kanban";
import { Badge } from "@/components/reui/badge";
import { Clock, Plus } from "lucide-react";
import { Avatar, Button } from "./shared";
import type { PulseTicket, PulseTicketColumns } from "./pulse-ticket-model";

/** The actual free Kanban edits projections of the parent's current ticket facts. */
export function PulseBoard({
  columns,
  onColumnsChange,
  onOpen,
  onCreate,
}: {
  columns: PulseTicketColumns;
  onColumnsChange: (columns: PulseTicketColumns) => void;
  onOpen: (ticket: PulseTicket) => void;
  onCreate: () => void;
}) {
  return (
    <Kanban value={columns} onValueChange={onColumnsChange} getItemValue={(ticket) => ticket.id}>
      <KanbanBoard className="ct-board ct-pulse-board">
        {Object.entries(columns).map(([stage, rows]) => (
          <KanbanColumn value={stage} className="ct-board-col" key={stage}>
            <h3>
              <span>
                {stage} <small className="ct-muted">{rows.length}</small>
              </span>
            </h3>
            <KanbanColumnContent value={stage}>
              {rows.map((ticket) => (
                <KanbanItem value={ticket.id} key={ticket.id}>
                  <KanbanItemHandle asChild>
                    <button
                      className={
                        "ct-ticket-card " +
                        (ticket.priority === "Urgent"
                          ? "urgent"
                          : ticket.priority === "High"
                            ? "high"
                            : "")
                      }
                      onClick={() => onOpen(ticket)}
                    >
                      <span className="ct-between">
                        <small className="ct-muted">{ticket.id}</small>
                        {ticket.priority && <Badge variant="outline">{ticket.priority}</Badge>}
                      </span>
                      <strong>{ticket.subject}</strong>
                      <small>
                        {ticket.requester ? `${ticket.requester} at ` : ""}
                        {ticket.customer}
                      </small>
                      <footer>
                        <span className="ct-person">
                          <Avatar name={ticket.agent} />
                          {ticket.agent}
                        </span>
                        <Badge
                          variant={
                            ticket.priority === "Urgent"
                              ? "destructive-light"
                              : ticket.priority === "High"
                                ? "warning-light"
                                : "info-light"
                          }
                        >
                          <Clock size={12} />
                          {ticket.due}
                        </Badge>
                      </footer>
                    </button>
                  </KanbanItemHandle>
                </KanbanItem>
              ))}
            </KanbanColumnContent>
            <Button variant="ghost" className="ct-add-ticket" onClick={onCreate}>
              <Plus />
              Add ticket
            </Button>
          </KanbanColumn>
        ))}
      </KanbanBoard>
    </Kanban>
  );
}
