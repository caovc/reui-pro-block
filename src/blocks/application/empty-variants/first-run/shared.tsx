import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Item, ItemActions, ItemContent, ItemMedia, ItemTitle } from "@/components/ui/item";

/** Free REUI c-empty-1/15 slot composition, with the public block's media and copy. */
export function EmptyHero({
  media,
  title,
  description,
  children,
  className = "",
}: {
  media: ReactNode;
  title: string;
  description: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <Empty className={`empty-first-hero ${className}`}>
      <EmptyHeader>
        <EmptyMedia>{media}</EmptyMedia>
        <EmptyTitle className="empty-first-title">{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {children && <EmptyContent>{children}</EmptyContent>}
    </Empty>
  );
}

export function EmptyStage({ id, children }: { id: number; children: ReactNode }) {
  return (
    <section className="empty-first-stage" data-empty-variant={id}>
      {children}
    </section>
  );
}

export function ActionRow({ children }: { children: ReactNode }) {
  return <div className="empty-first-actions">{children}</div>;
}

export function QuickLinks({
  title,
  items,
}: {
  title: string;
  items: { label: string; icon: ReactNode; onClick: () => void }[];
}) {
  return (
    <div className="empty-first-guides">
      <h2>{title}</h2>
      <div className="empty-first-link-list">
        {items.map(({ label, icon, onClick }) => (
          <Item key={label} asChild variant="outline">
            <Button variant="ghost" className="empty-first-guide" onClick={onClick}>
              <ItemMedia>{icon}</ItemMedia>
              <ItemContent>
                <ItemTitle>{label}</ItemTitle>
              </ItemContent>
              <ItemActions>
                <ChevronRight className="size-4 text-muted-foreground" />
              </ItemActions>
            </Button>
          </Item>
        ))}
      </div>
    </div>
  );
}

export function LocalDialog({
  title,
  description,
  open,
  onOpenChange,
  children,
}: {
  title: string;
  description: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85svh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
