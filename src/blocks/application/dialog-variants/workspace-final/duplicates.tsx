import { useRef, useState } from "react";
import { ContactRound } from "lucide-react";
import { toast } from "sonner";
import { demoAvatar } from "@/lib/demo-artwork";
import { Badge } from "@/components/reui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose } from "@/components/ui/dialog";
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item";
import { DialogLauncher } from "../first-run/support";
import { DialogSurface } from "../first-run/free/dialog-surface";
import { ContactCandidateItem } from "./free/candidate-item";

const incoming = {
  name: "Maya Chen",
  email: "maya.chen@northwind.example",
  company: "Northwind Labs",
  status: "Demo request",
};
const candidates = [
  {
    id: "maya-l",
    name: "Maya L. Chen",
    initials: "MC",
    score: 97,
    email: incoming.email,
    company: incoming.company,
    status: "Customer",
  },
  {
    id: "maya-ruiz",
    name: "Maya Chen-Ruiz",
    initials: "MC",
    score: 81,
    email: "maya.ruiz@example.com",
    company: incoming.company,
    status: "Lead",
  },
  {
    id: "m-chen",
    name: "M. Chen",
    initials: "MC",
    score: 74,
    email: "mchen@northwind.example",
    company: incoming.company,
    status: "Churned",
  },
  {
    id: "maya-cheng",
    name: "Maya Cheng",
    initials: "MC",
    score: 58,
    email: "maya@chengstudio.example",
    company: "Cheng Studio",
    status: "Qualified",
  },
].sort((a, b) => b.score - a.score);
export default function DuplicateContactDialog() {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const pending = useRef<(typeof candidates)[number] | null>(null);
  function completeLink() {
    if (!pending.current) return;
    setSaved(`Linked ${incoming.name} to ${pending.current.name} in this local preview.`);
    pending.current = null;
  }
  function link(candidate: (typeof candidates)[number]) {
    pending.current = candidate;
    setOpen(false);
    toast(`Link ${incoming.name} to ${candidate.name}?`, {
      description:
        "Local link is pending until this notice closes. No remote record will be changed.",
      duration: 5000,
      action: {
        label: "Undo",
        onClick: () => {
          pending.current = null;
          setOpen(true);
        },
      },
      onAutoClose: completeLink,
      onDismiss: completeLink,
    });
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogLauncher
        id={16}
        title="Duplicate contact check"
        description="Review ranked matches before saving a contact draft."
        icon={<ContactRound />}
        action="Open duplicate check"
        result={saved && <span>{saved} No contact was created, merged or linked remotely.</span>}
      >
        <Item className="p-0">
          <ItemMedia>
            <Avatar>
              <AvatarImage src={demoAvatar(incoming.name)} alt={incoming.name} />
              <AvatarFallback>MC</AvatarFallback>
            </Avatar>
          </ItemMedia>
          <ItemContent>
            <ItemTitle>{incoming.name}</ItemTitle>
            <ItemDescription>{incoming.company} · 4 possible matches</ItemDescription>
          </ItemContent>
        </Item>
      </DialogLauncher>
      <DialogSurface
        id={16}
        title="Possible Duplicates"
        description="4 existing contacts may match this one."
        footer={
          <>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={() => {
                pending.current = null;
                setSaved(`Created a new local draft for ${incoming.name}.`);
                setOpen(false);
              }}
            >
              Create New
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-6">
          <section aria-labelledby="incoming-contact-heading" className="flex flex-col gap-3">
            <h3 id="incoming-contact-heading" className="text-sm font-semibold">
              New Contact
            </h3>
            <Item variant="muted">
              <ItemMedia>
                <Avatar>
                  <AvatarImage src={demoAvatar(incoming.name)} alt={incoming.name} />
                  <AvatarFallback>MC</AvatarFallback>
                </Avatar>
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{incoming.name}</ItemTitle>
                <ItemDescription className="flex flex-col gap-1">
                  <span className="break-all">{incoming.email}</span>
                  <span>{incoming.company}</span>
                  <Badge variant="outline" className="self-start">
                    {incoming.status}
                  </Badge>
                </ItemDescription>
              </ItemContent>
            </Item>
          </section>
          <section aria-labelledby="existing-contact-heading" className="flex flex-col gap-3">
            <h3 id="existing-contact-heading" className="text-sm font-semibold">
              Existing Contacts
            </h3>
            <ul className="flex flex-col gap-3">
              {candidates.map((candidate) => (
                <li key={candidate.id}>
                  <ContactCandidateItem
                    name={candidate.name}
                    initials={candidate.initials}
                    onLink={() => link(candidate)}
                    badge={
                      <>
                        <Badge
                          variant={
                            candidate.score >= 90
                              ? "success-light"
                              : candidate.score >= 70
                                ? "warning-light"
                                : "secondary"
                          }
                          size="sm"
                        >
                          {candidate.score >= 90
                            ? "Strong"
                            : candidate.score >= 70
                              ? "Likely"
                              : "Weak"}
                        </Badge>
                        <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                          {candidate.score}%
                        </span>
                      </>
                    }
                  >
                    <span className="break-all">
                      {candidate.email}
                      {candidate.email === incoming.email && (
                        <span className="ml-1 text-emerald-600">(matches)</span>
                      )}
                    </span>
                    <span>
                      {candidate.company}
                      {candidate.company === incoming.company && (
                        <span className="ml-1 text-emerald-600">(matches)</span>
                      )}
                    </span>
                    <Badge variant="outline" className="self-start">
                      {candidate.status}
                    </Badge>
                  </ContactCandidateItem>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </DialogSurface>
    </Dialog>
  );
}
