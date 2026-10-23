// Actual official free REUI c-combobox-24. MIT (c) Keenthemes.
// https://reui.io/r/radix-nova/c-combobox-24.json
// Adapters: controlled form value/id, Lucide icon adapter; original picker/glyph behavior retained.
// Demo avatars replace upstream photos; function-child list keeps real search filtering.
"use client";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";
import { demoAvatar } from "@/lib/demo-artwork";
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox";
import { Field } from "@/components/ui/field";
import { Item, ItemContent, ItemMedia, ItemTitle } from "@/components/ui/item";
import { UsersIcon } from "lucide-react";

type TeamMember = {
  id: string;
  value: string;
  label: string;
  avatar?: string;
  initials: string;
  isCurrentUser?: boolean;
};

type EmptyMembersOption = {
  id: "no-members";
  value: "none";
  label: string;
  searchText: string;
};

type MemberSelectionItem = EmptyMembersOption | TeamMember;

const noMembersOption: EmptyMembersOption = {
  id: "no-members",
  value: "none",
  label: "No assigned users",
  searchText: "No assigned users no members clear members remove members empty",
};

const teamMembers: TeamMember[] = [
  {
    id: "maya",
    value: "maya",
    label: "Maya Stone",
    initials: "MS",
    avatar: demoAvatar("Maya Stone"),
    isCurrentUser: true,
  },
  { id: "leo", value: "leo", label: "Leo Grant", initials: "LG", avatar: demoAvatar("Leo Grant") },
  {
    id: "nora",
    value: "nora",
    label: "Nora Chen",
    initials: "NC",
    avatar: demoAvatar("Nora Chen"),
  },
  {
    id: "samir",
    value: "samir",
    label: "Samir Park",
    initials: "SP",
    avatar: demoAvatar("Samir Park"),
  },
  {
    id: "alex",
    value: "alex",
    label: "Alex Johnson",
    initials: "AJ",
    avatar: demoAvatar("Alex Johnson"),
  },
  {
    id: "sarah",
    value: "sarah",
    label: "Sarah Chen",
    initials: "SC",
    avatar: demoAvatar("Sarah Chen"),
  },
  {
    id: "michael",
    value: "michael",
    label: "Michael Rodriguez",
    initials: "MR",
    avatar: demoAvatar("Michael Rodriguez"),
  },
  {
    id: "emma",
    value: "emma",
    label: "Emma Wilson",
    initials: "EW",
    avatar: demoAvatar("Emma Wilson"),
  },
];

const memberSelectionOptions: MemberSelectionItem[] = [noMembersOption, ...teamMembers];

function isNoMembersOption(item: MemberSelectionItem): item is EmptyMembersOption {
  return item.id === noMembersOption.id;
}

function isMemberSelectionItemEqual(item: MemberSelectionItem, value: MemberSelectionItem) {
  return item.id === value.id;
}

function UsersGlyph({ className }: { className?: string }) {
  return <UsersIcon className={cn("size-4 shrink-0", className)} />;
}

function MemberAvatar({
  member,
  className,
  fallbackClassName,
}: {
  member: TeamMember;
  className?: string;
  fallbackClassName?: string;
}) {
  return (
    <Avatar className={className}>
      {member.avatar ? <AvatarImage src={member.avatar} alt={member.label} /> : null}
      <AvatarFallback className={cn("text-foreground text-[9px]", fallbackClassName)}>
        {member.initials}
      </AvatarFallback>
    </Avatar>
  );
}

function MembersTriggerSummary({ selectedMembers }: { selectedMembers: TeamMember[] }) {
  if (!selectedMembers.length) {
    return (
      <span className="flex min-w-0 items-center gap-2">
        <UsersGlyph className="text-muted-foreground" />
        <span className="truncate">Members</span>
      </span>
    );
  }

  const visibleMembers = selectedMembers.slice(0, 4);
  const hiddenMemberCount = selectedMembers.length - visibleMembers.length;
  const selectedLabel = selectedMembers.map((member) => member.label).join(", ");
  const countLabel =
    selectedMembers.length === 1
      ? "1 member"
      : hiddenMemberCount > 0
        ? `+${hiddenMemberCount} ${hiddenMemberCount === 1 ? "member" : "members"}`
        : `${selectedMembers.length} members`;

  return (
    <span className="flex min-w-0 items-center gap-2">
      <span className="sr-only">Selected members: {selectedLabel}</span>
      <AvatarGroup className="-space-x-1">
        {visibleMembers.map((member) => (
          <MemberAvatar
            key={member.id}
            member={member}
            className="size-5"
            fallbackClassName="text-[9px]"
          />
        ))}
      </AvatarGroup>
      <span className="truncate">{countLabel}</span>
    </span>
  );
}

function MemberListRow({ member }: { member: TeamMember }) {
  return (
    <Item size="xs" className="p-0">
      <ItemMedia>
        <MemberAvatar member={member} className="size-5" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle className="gap-1 whitespace-nowrap">
          <span>{member.label}</span>
          {member.isCurrentUser ? (
            <span className="text-muted-foreground font-normal">(You)</span>
          ) : null}
        </ItemTitle>
      </ItemContent>
    </Item>
  );
}

function MemberSelectionRow({ option }: { option: MemberSelectionItem }) {
  if (isNoMembersOption(option)) {
    return (
      <span className="flex min-w-0 items-center gap-2">
        <UsersGlyph className="text-muted-foreground" />
        <span className="truncate">{option.label}</span>
      </span>
    );
  }

  return <MemberListRow member={option} />;
}

export function ProjectMembersPicker({
  id,
  portalContainer,
  value,
  onChange,
}: {
  id: string;
  portalContainer?: ComponentProps<typeof ComboboxContent>["portalContainer"];
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const members = teamMembers.filter((member) => value.includes(member.id));
  function handleMembersChange(nextMembers: MemberSelectionItem[]) {
    onChange(
      nextMembers.some(isNoMembersOption)
        ? []
        : nextMembers
            .filter((member): member is TeamMember => !isNoMembersOption(member))
            .map((member) => member.id),
    );
  }

  return (
    <Field className="min-w-0">
      <Combobox
        multiple
        items={memberSelectionOptions}
        value={members}
        onValueChange={handleMembersChange}
        itemToStringValue={(item: MemberSelectionItem) =>
          isNoMembersOption(item) ? item.searchText : item.label
        }
        isItemEqualToValue={isMemberSelectionItemEqual}
        autoHighlight
      >
        <ComboboxTrigger
          id={id}
          render={
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between font-normal"
            />
          }
        >
          <ComboboxValue placeholder="Members">
            {(selectedMembers: TeamMember[]) => (
              <MembersTriggerSummary selectedMembers={selectedMembers ?? []} />
            )}
          </ComboboxValue>
        </ComboboxTrigger>

        <ComboboxContent
          portalContainer={portalContainer}
          className="max-w-(--anchor-width) min-w-(--anchor-width)"
        >
          <ComboboxInput showTrigger={false} placeholder="Select members" className="mb-1" />
          <ComboboxEmpty>No members found.</ComboboxEmpty>
          <ComboboxList>
            {(item) => (
              <ComboboxItem key={item.id} value={item}>
                <MemberSelectionRow option={item} />
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </Field>
  );
}
