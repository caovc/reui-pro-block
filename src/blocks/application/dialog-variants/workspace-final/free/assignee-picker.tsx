// Actual official free REUI c-combobox-23. MIT (c) Keenthemes.
// https://reui.io/r/radix-nova/c-combobox-23.json
// Adapters: controlled field id/value; Lucide icons, original avatar art; original mechanics retained.
"use client";
import type { ComponentProps } from "react";
import { demoAvatar } from "@/lib/demo-artwork";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { UserIcon } from "lucide-react";

type NoLeadOption = {
  type: "none";
  value: "none" | "invite";
  label: string;
};

type TeamMember = {
  type: "member";
  id: string;
  value: string;
  label: string;
  avatar: string;
  initials: string;
  isCurrentUser?: boolean;
};

type LeadOption = NoLeadOption | TeamMember;

const noLeadOption: NoLeadOption = {
  type: "none",
  value: "none",
  label: "No assignee",
};

const teamMembers: TeamMember[] = [
  {
    type: "member",
    id: "maya",
    value: "maya",
    label: "Maya Stone",
    avatar: "",
    initials: "MS",
    isCurrentUser: true,
  },
  { type: "member", id: "leo", value: "leo", label: "Leo Grant", avatar: "", initials: "LG" },
  { type: "member", id: "nora", value: "nora", label: "Nora Chen", avatar: "", initials: "NC" },
  { type: "member", id: "samir", value: "samir", label: "Samir Park", avatar: "", initials: "SP" },
];

const inviteOption: NoLeadOption = { type: "none", value: "invite", label: "Invite..." };
const leadOptions: LeadOption[] = [noLeadOption, ...teamMembers, inviteOption];

function UserGlyph({ className }: { className?: string }) {
  return <UserIcon className={cn("size-4 shrink-0", className)} />;
}

function LeadTriggerLabel({ option }: { option: LeadOption }) {
  if (option.type === "none") {
    return (
      <span className="flex min-w-0 items-center gap-2">
        <UserGlyph className="text-muted-foreground" />
        <span className="truncate">{option.label}</span>
      </span>
    );
  }

  return (
    <span className="flex min-w-0 items-center gap-2">
      <Avatar className="size-5">
        <AvatarImage src={demoAvatar(option.label)} alt="" />
        <AvatarFallback className="text-[9px]">{option.initials}</AvatarFallback>
      </Avatar>
      <span className="truncate">{option.label}</span>
    </span>
  );
}

function LeadListRow({ option }: { option: LeadOption }) {
  if (option.type === "none") {
    return (
      <span className="flex min-w-0 items-center gap-2">
        <UserGlyph className="text-muted-foreground" />
        <span className="truncate">{option.label}</span>
      </span>
    );
  }

  return (
    <Item size="xs" className="p-0">
      <ItemMedia>
        <Avatar className="size-5">
          <AvatarImage src={demoAvatar(option.label)} alt="" />
          <AvatarFallback className="text-[9px]">{option.initials}</AvatarFallback>
        </Avatar>
      </ItemMedia>
      <ItemContent>
        <ItemTitle className="gap-1 whitespace-nowrap">
          <span>{option.label}</span>
          {option.isCurrentUser ? (
            <span className="text-muted-foreground font-normal">(You)</span>
          ) : null}
        </ItemTitle>
      </ItemContent>
    </Item>
  );
}

export function EntryAssigneePicker({
  id,
  portalContainer,
  value,
  onChange,
  onInvite,
}: {
  id: string;
  portalContainer?: ComponentProps<typeof ComboboxContent>["portalContainer"];

  value: string;
  onChange: (value: string) => void;
  onInvite: () => void;
}) {
  const lead = leadOptions.find((option) => option.value === value) ?? noLeadOption;
  const setLead = (option: LeadOption | null) =>
    option?.value === "invite" ? onInvite() : onChange(option?.value ?? "none");

  return (
    <Field className="max-w-xs">
      <Combobox
        items={leadOptions}
        value={lead}
        onValueChange={setLead}
        itemToStringValue={(item: LeadOption) => item.label}
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
          <ComboboxValue placeholder="No assignee">
            {(selectedLead: LeadOption | null) =>
              selectedLead ? (
                <LeadTriggerLabel option={selectedLead} />
              ) : (
                <span className="text-muted-foreground">No lead</span>
              )
            }
          </ComboboxValue>
        </ComboboxTrigger>

        <ComboboxContent
          portalContainer={portalContainer}
          className="max-w-(--anchor-width) min-w-(--anchor-width)"
        >
          <ComboboxInput showTrigger={false} placeholder="Select assignee" className="mb-1" />
          <ComboboxEmpty>No team members found.</ComboboxEmpty>
          <ComboboxList>
            {(option) => (
              <ComboboxItem key={option.value} value={option}>
                <LeadListRow option={option} />
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </Field>
  );
}
