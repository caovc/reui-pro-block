import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Check, Copy, Ellipsis } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import sarah from "@/blocks/application/assets/schedule-sarah-chen.jpg";
import james from "@/blocks/application/assets/schedule-james-park.jpg";
import emma from "@/blocks/application/assets/schedule-emma-wilson.jpg";
import "./cards.css";
import { Frame } from "@/components/reui/frame";
import resendMark from "@/blocks/application/assets/card-brands/resend.svg";
import stripeMark from "@/blocks/application/assets/card-brands/stripe.svg";
import supabaseMark from "@/blocks/application/assets/card-brands/supabase.svg";
import openaiMark from "@/blocks/application/assets/card-brands/openai.svg";
import anthropicMark from "@/blocks/application/assets/card-brands/anthropic.svg";
import paypalMark from "@/blocks/application/assets/card-brands/paypal.svg";
import discordMark from "@/blocks/application/assets/card-brands/discord.svg";
import redisMark from "@/blocks/application/assets/card-brands/redis.svg";
import appstoreMark from "@/blocks/application/assets/card-brands/appstore.svg";
import mongodbMark from "@/blocks/application/assets/card-brands/mongodb.svg";
import solanaMark from "@/blocks/application/assets/card-brands/solana.svg";
const brandFiles: Record<string, string> = {
  resend: resendMark,
  stripe: stripeMark,
  supabase: supabaseMark,
  openai: openaiMark,
  anthropic: anthropicMark,
  paypal: paypalMark,
  discord: discordMark,
  redis: redisMark,
  appstore: appstoreMark,
  mongodb: mongodbMark,
  solana: solanaMark,
};
export function Brand({ name }: { name: string }) {
  const src = brandFiles[name.toLowerCase()];
  if (["resend", "openai", "anthropic"].includes(name.toLowerCase()))
    return (
      <span
        role="img"
        aria-label={`${name} logo`}
        className="refined-brand refined-brand-ink"
        style={{ maskImage: `url("${src}")`, WebkitMaskImage: `url("${src}")` }}
      />
    );
  return <img className="refined-brand" src={src} alt={`${name} logo`} />;
}
export function CardStage({
  children,
  variant,
  narrow = false,
}: {
  children: ReactNode;
  variant: number;
  narrow?: boolean;
}) {
  return (
    <section className="refined-card-stage" data-card-variant={variant}>
      <div className={narrow ? "refined-card-content refined-narrow" : "refined-card-content"}>
        {children}
      </div>
    </section>
  );
}
export function FramedGrid({
  children,
  columns = 4,
  className = "",
}: {
  children: ReactNode;
  columns?: number;
  className?: string;
}) {
  return (
    <Frame
      className={`refined-grid ${className}`}
      style={{ "--card-columns": columns } as CSSProperties}
    >
      {children}
    </Frame>
  );
}
export function Avatars({ extra = 3 }: { extra?: number }) {
  return (
    <div
      className="flex shrink-0 items-center"
      aria-label={`Sarah Chen, James Park, Emma Wilson and ${extra} others`}
    >
      {[
        [sarah, "Sarah Chen"],
        [james, "James Park"],
        [emma, "Emma Wilson"],
      ].map(([src, name]) => (
        <Avatar className="-ml-1 size-6 border-2 border-background first:ml-0" key={name}>
          <AvatarImage src={src} alt={name} />
          <AvatarFallback>
            {name
              .split(" ")
              .map((s) => s[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
      ))}
      <span className="-ml-1 flex size-6 items-center justify-center rounded-full border-2 border-background bg-muted text-[9px] text-muted-foreground">
        +{extra}
      </span>
    </div>
  );
}
export function CopyValue({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="ghost"
      size="icon-xs"
      aria-label={`Copy ${label}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          toast.success(`${label} copied`);
        } catch {
          toast.error("Clipboard unavailable", { description: value });
        }
      }}
    >
      {copied ? <Check /> : <Copy />}
    </Button>
  );
}
export function LocalLink({
  children,
  title,
  description,
  className = "",
}: {
  children: ReactNode;
  title: string;
  description?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="link"
        className={`refined-text-link ${className}`}
        onClick={() => setOpen(true)}
      >
        {children}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              {description ??
                "This is a local component preview. Connect this link to the destination in your application."}
            </DialogDescription>
          </DialogHeader>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Back to cards
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
export function Actions({
  label,
  onEdit,
  onDuplicate,
  onCopy,
}: {
  label: string;
  onEdit: () => void;
  onDuplicate?: () => void;
  onCopy?: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon-xs" variant="ghost" aria-label={`${label} actions`}>
          <Ellipsis />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={onEdit}>Edit</DropdownMenuItem>
          {onDuplicate && <DropdownMenuItem onSelect={onDuplicate}>Duplicate</DropdownMenuItem>}
          {onCopy && <DropdownMenuItem onSelect={onCopy}>Copy link</DropdownMenuItem>}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
