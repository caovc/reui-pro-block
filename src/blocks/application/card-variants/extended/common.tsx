import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Ellipsis, FileText } from "lucide-react";
import { Frame } from "@/components/reui/frame";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import sarah from "@/blocks/application/assets/schedule-sarah-chen.jpg";
import james from "@/blocks/application/assets/schedule-james-park.jpg";
import emma from "@/blocks/application/assets/schedule-emma-wilson.jpg";
import "./extended.css";
export function Stage({
  id,
  children,
  width = 976,
}: {
  id: number;
  children: ReactNode;
  width?: number;
}) {
  return (
    <section className="extended-card-stage" data-card-variant={id}>
      <div className="extended-card-content" style={{ maxWidth: width }}>
        {children}
      </div>
    </section>
  );
}
export function GridFrame({
  children,
  columns = 3,
  className = "",
}: {
  children: ReactNode;
  columns?: number;
  className?: string;
}) {
  return (
    <Frame
      className={`extended-frame-grid ${className}`}
      style={{ "--extended-columns": columns } as CSSProperties}
    >
      {children}
    </Frame>
  );
}
export function People({ extra = 3 }: { extra?: number }) {
  return (
    <AvatarGroup aria-label={`Sarah Chen, James Park, Emma Wilson and ${extra} others`}>
      {[
        [sarah, "Sarah Chen"],
        [james, "James Park"],
        [emma, "Emma Wilson"],
      ].map(([src, name]) => (
        <Avatar key={name} size="sm">
          <AvatarImage src={src} alt={name} />
          <AvatarFallback>
            {name
              .split(" ")
              .map((s) => s[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
      ))}
      <AvatarGroupCount className="size-6 text-[9px]">+{extra}</AvatarGroupCount>
    </AvatarGroup>
  );
}
export function ContentLink({
  title,
  children,
  description,
  className = "",
}: {
  title: string;
  children: ReactNode;
  description?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="link"
        className={`extended-content-link ${className}`}
        onClick={() => setOpen(true)}
      >
        {children}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              {description ?? "This destination is presented as a local component preview."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-start gap-3 rounded-lg border p-4">
            <FileText className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Sample content for {title}. Connect this card to your own application route.
            </p>
          </div>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Back to cards
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
export function RecordMenu({ title, onEdit }: { title: string; onEdit: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-xs" aria-label={`${title} actions`}>
          <Ellipsis />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={onEdit}>Edit</DropdownMenuItem>
          <DropdownMenuItem
            onSelect={async () => {
              try {
                await navigator.clipboard.writeText(
                  `${location.href}?record=${encodeURIComponent(title)}`,
                );
                toast.success("Preview link copied");
              } catch {
                toast.error("Clipboard unavailable");
              }
            }}
          >
            Copy link
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
