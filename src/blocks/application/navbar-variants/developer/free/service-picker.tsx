// Actual official free ReUI c-button-group-54 service segment, MIT (c) Keenthemes.
// https://reui.io/r/radix-nova/c-button-group-54.json
// Upstream SHA256: 08942f1f187d5abeb2d394eafcf532845b58cbb26740c6dfa0d00b41d1236568
// Radio selection is the actual c-dropdown-menu-7 composition, MIT (c) Keenthemes.
// https://reui.io/r/radix-nova/c-dropdown-menu-7.json
// SHA256: 3b01e43ffa25ca9fea8da20c7e7936e28a855da6d5d8f3aada6f193c53255ec7
// Only the service segment is needed here; environment/version segments are omitted.
import type { Ref } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiServices, type ApiServiceId } from "../data";

export function ServicePicker({
  value,
  onChange,
  onConnect,
  triggerRef,
}: {
  value: ApiServiceId;
  onChange: (value: ApiServiceId) => void;
  onConnect: () => void;
  triggerRef?: Ref<HTMLButtonElement>;
}) {
  const service = apiServices.find((item) => item.id === value)!;
  const Icon = service.icon;
  return (
    <ButtonGroup aria-label="API service selector">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            ref={triggerRef}
            variant="outline"
            size="sm"
            className="gap-1.5"
            aria-label="Select API service"
          >
            <Icon data-icon="inline-start" />
            {service.name}
            <ChevronDown data-icon="inline-end" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          <DropdownMenuGroup>
            <DropdownMenuLabel>API services</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={value}
              onValueChange={(next) => onChange(next as ApiServiceId)}
            >
              {apiServices.map(({ id, name, icon: ServiceIcon }) => (
                <DropdownMenuRadioItem key={id} value={id}>
                  <ServiceIcon aria-hidden="true" />
                  {name}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={onConnect}>
              <Plus aria-hidden="true" />
              Connect service
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  );
}
