// Actual official free REUI c-item-3. MIT (c) Keenthemes.
// https://reui.io/r/radix-nova/c-item-3.json
// Adapter: domain content slots, original demo avatar, and actual local Link callback.
import type { ReactNode } from "react";
import { demoAvatar } from "@/lib/demo-artwork";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";

export function ContactCandidateItem({
  name,
  initials,
  badge,
  children,
  onLink,
}: {
  name: string;
  initials: string;
  badge: ReactNode;
  children: ReactNode;
  onLink: () => void;
}) {
  return (
    <Item variant="outline" size="xs" className="final-dialog-candidate">
      <ItemMedia>
        <Avatar>
          <AvatarImage src={demoAvatar(name)} alt={name} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </ItemMedia>
      <ItemContent>
        <ItemTitle className="flex-wrap">
          {name}
          {badge}
        </ItemTitle>
        <ItemDescription className="flex flex-col gap-1">{children}</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button variant="outline" size="sm" onClick={onLink} aria-label={`Link ${name}`}>
          Link
        </Button>
      </ItemActions>
    </Item>
  );
}
