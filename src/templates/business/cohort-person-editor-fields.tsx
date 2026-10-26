// Official free ReUI c-combobox-23 composition, adapted to the HR reporting tree.
// MIT (c) Keenthemes. https://reui.io/r/radix-nova/c-combobox-23.json
// The controlled options use internal employee IDs; avatars are Bricklane artwork.
import { useRef } from "react";
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
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CircleHelp, UserRound } from "lucide-react";
import { TinyAvatar } from "@/blocks/data/grid-advanced-shared";
import type { CohortPerson } from "./cohort-people";

export function PersonFieldLabel({ label, help }: { label: string; help?: string }) {
  return (
    <span className="cohort-person-field-label">
      {label}
      {help && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="button" variant="ghost" size="icon-xs" aria-label={`About ${label}`}>
              <CircleHelp size={12} />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="max-w-64">{help}</TooltipContent>
        </Tooltip>
      )}
    </span>
  );
}

type ManagerOption = { id: string; name: string; person?: CohortPerson };
function ManagerLabel({ option }: { option: ManagerOption }) {
  return (
    <span className="cohort-manager-option">
      <span className="cohort-manager-avatar" aria-hidden="true">
        {option.person ? (
          option.person.photo ? (
            <img src={option.person.photo} alt="" />
          ) : (
            <TinyAvatar name={option.name} photo={!option.person.photoRemoved} />
          )
        ) : (
          <UserRound size={16} />
        )}
      </span>
      <span>{option.name}</span>
    </span>
  );
}
export function PersonManagerPicker({
  value,
  people,
  onChange,
}: {
  value: string;
  people: CohortPerson[];
  onChange: (id: string) => void;
}) {
  const portal = useRef<HTMLDivElement>(null);
  const options: ManagerOption[] = [
    { id: "", name: "Nobody (top of the org chart)" },
    ...people.map((person) => ({ id: person.id, name: person.name, person })),
  ];
  const manager = options.find((option) => option.id === value) ?? options[0];
  return (
    <div ref={portal} className="cohort-manager-picker">
      <Combobox
        items={options}
        value={manager}
        onValueChange={(option: ManagerOption | null) => onChange(option?.id ?? "")}
        itemToStringValue={(option: ManagerOption) => option.name}
        isItemEqualToValue={(option: ManagerOption, selected: ManagerOption) =>
          option.id === selected.id
        }
        autoHighlight
      >
        <ComboboxTrigger
          aria-label="Manager"
          render={
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between font-normal"
            />
          }
        >
          <ComboboxValue>
            {(selected: ManagerOption | null) => selected && <ManagerLabel option={selected} />}
          </ComboboxValue>
        </ComboboxTrigger>
        <ComboboxContent
          portalContainer={portal}
          className="max-w-(--anchor-width) min-w-(--anchor-width)"
        >
          <ComboboxInput
            aria-label="Search managers"
            showTrigger={false}
            placeholder="Search people..."
            className="mb-1"
          />
          <ComboboxEmpty>No people found.</ComboboxEmpty>
          <ComboboxList>
            {(option: ManagerOption) => (
              <ComboboxItem key={option.id} value={option}>
                <ManagerLabel option={option} />
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}
