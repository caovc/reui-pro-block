// Actual official free c-select-27 / c-combobox-6 / c-combobox-19 compositions.
// Copyright (c) 2025 Keenthemes Inc, MIT; src/components/reui/REUI-LICENSE.txt.
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Item, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { demoAvatar } from "@/lib/demo-artwork";
import { Field } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import type { DriveSettingsMember } from "./drive-settings-data";
import type { DriveChoiceOption } from "./drive-settings-options";
export { PhoneInput as DrivePhoneInput } from "./drive-settings-free/phone-input";
export function DriveRichChoice({
  id,
  value,
  onChange,
  options,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly DriveChoiceOption[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className="ds-rich-choice">
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" className="reui-reference ds-rich-popup">
        <SelectGroup>
          {options.map(([label, description]) => (
            <SelectItem key={label} value={label}>
              <div className="ds-choice-description">
                <span>{label}</span>
                <span className="text-muted-foreground text-xs">{description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
const timezoneGroups = [
  {
    value: "Americas",
    items: [
      "(GMT-5) New York",
      "(GMT-8) Los Angeles",
      "(GMT-6) Chicago",
      "(GMT-5) Toronto",
      "(GMT-8) Vancouver",
      "(GMT-3) Sao Paulo",
    ],
  },
  {
    value: "Europe",
    items: [
      "(GMT+0) London",
      "(GMT+1) Paris",
      "(GMT+1) Berlin",
      "(GMT+1) Rome",
      "(GMT+1) Madrid",
      "(GMT+1) Amsterdam",
    ],
  },
  {
    value: "Asia/Pacific",
    items: [
      "(GMT+9) Tokyo",
      "(GMT+8) Shanghai",
      "(GMT+8) Singapore",
      "(GMT+4) Dubai",
      "(GMT+11) Sydney",
      "(GMT+9) Seoul",
    ],
  },
];
export function DriveTimezone({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field>
      <Combobox
        items={timezoneGroups}
        value={value}
        onValueChange={(next) => {
          if (next) onChange(next);
        }}
      >
        <ComboboxInput id={id} placeholder="Select a timezone" />
        <ComboboxContent className="reui-reference">
          <ComboboxEmpty>No timezones found.</ComboboxEmpty>
          <ComboboxList>
            {(group) => (
              <ComboboxGroup key={group.value} items={group.items}>
                <ComboboxLabel>{group.value}</ComboboxLabel>
                <ComboboxCollection>
                  {(item) => (
                    <ComboboxItem key={item} value={item}>
                      {item}
                    </ComboboxItem>
                  )}
                </ComboboxCollection>
              </ComboboxGroup>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </Field>
  );
}
export function DriveApprovers({
  value,
  onChange,
  members,
  inputLabel = "Invoice approvers",
}: {
  value: string[];
  onChange: (value: string[]) => void;
  members: DriveSettingsMember[];
  inputLabel?: string;
}) {
  const anchor = useComboboxAnchor();
  const selected = members.filter((member) => value.includes(member.id));
  return (
    <Combobox
      multiple
      items={members}
      value={selected}
      onValueChange={(next) => onChange(next.map((member) => member.id))}
      itemToStringValue={(member) => member.name}
      isItemEqualToValue={(a, b) => a.id === b.id}
    >
      <ComboboxChips ref={anchor} className="ds-approvers has-data-[slot=combobox-chip]:pl-1">
        <ComboboxValue>
          {(items: DriveSettingsMember[]) => (
            <>
              {items.map((member) => (
                <ComboboxChip key={member.id} showRemove className="rounded-full gap-1.5">
                  <Avatar className="size-4">
                    <AvatarImage src={demoAvatar(member.name)} alt="" />
                    <AvatarFallback className="text-[8px]">
                      {member.name
                        .split(" ")
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  {member.name}
                </ComboboxChip>
              ))}
              <ComboboxChipsInput
                aria-label={inputLabel}
                placeholder="Add approvers..."
                className="text-base leading-6 md:text-sm md:leading-5"
              />
            </>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent
        anchor={anchor}
        className="reui-reference min-w-(--anchor-width) max-w-(--anchor-width)"
      >
        <ComboboxEmpty>No members found.</ComboboxEmpty>
        <ComboboxList>
          {(member: DriveSettingsMember) => (
            <ComboboxItem key={member.id} value={member} aria-label={member.name}>
              <Item size="xs" className="p-0">
                <Avatar className="size-6">
                  <AvatarImage src={demoAvatar(member.name)} alt="" />
                  <AvatarFallback>
                    {member.name
                      .split(" ")
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <ItemContent>
                  <ItemTitle className="whitespace-nowrap">{member.name}</ItemTitle>
                  <ItemDescription>{member.role}</ItemDescription>
                </ItemContent>
              </Item>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
