// Actual official free REUI c-avatar-11 + c-avatar-18, MIT (c) Keenthemes.
// https://reui.io/r/radix-nova/c-avatar-11.json
// https://reui.io/r/radix-nova/c-avatar-18.json
// Retains AvatarGroup/GroupCount and first-member AvatarBadge composition.
// Original demoAvatar artwork replaces all upstream photos; data/count are props.
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import { demoAvatar } from "@/lib/demo-artwork";

export function PersonAvatar({ name, online = false }: { name: string; online?: boolean }) {
  return (
    <Avatar size="sm">
      <AvatarImage src={demoAvatar(name)} alt={name} />
      <AvatarFallback>
        {name
          .split(" ")
          .map((part) => part[0])
          .join("")}
      </AvatarFallback>
      {online && <AvatarBadge className="bg-success" />}
    </Avatar>
  );
}
export function PresenceGroup({
  names,
  extra,
  online = false,
}: {
  names: string[];
  extra: number;
  online?: boolean;
}) {
  return (
    <AvatarGroup>
      {names.slice(0, 3).map((name, index) => (
        <PersonAvatar key={name} name={name} online={online && index === 0} />
      ))}
      <AvatarGroupCount className="size-6 text-xs">+{extra}</AvatarGroupCount>
    </AvatarGroup>
  );
}
