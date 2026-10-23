// Actual official free REUI c-dropdown-menu-10, MIT (c) Keenthemes.
// https://reui.io/r/radix-nova/c-dropdown-menu-10.json
// Upstream source SHA256: 2a3ee70435fe8c41f9b7cb2c67c81300e2541284342a1cf8c9354285013125f3
// Adaptations documented in docs/navbar1-3-implementation.md.
"use client";

import type { ReactNode } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, ChevronsUpDown, Plus, Settings } from "lucide-react";

export type SwitcherOption = {
  id: string;
  name: string;
  plan: string;
  avatar?: string;
  logo?: ReactNode;
};
export function ContextSwitcher({
  label,
  options: workspaces,
  value: activeWorkspaceId,
  onChange: setActiveWorkspaceId,
  onAction,
}: {
  label: string;
  options: SwitcherOption[];
  value: string;
  onChange: (value: string) => void;
  onAction?: (action: string) => void;
}) {
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];
  return (
    <div className="flex items-center justify-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" aria-label={label} className="max-w-full">
            <div className="gap-1.5 flex items-center">
              {activeWorkspace.logo}
              <span className="text-sm font-medium">{activeWorkspace.name}</span>
            </div>

            <ChevronsUpDown aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="start" sideOffset={8}>
          <DropdownMenuGroup>
            <DropdownMenuLabel>{label}</DropdownMenuLabel>
            {workspaces.map((workspace) => (
              <DropdownMenuItem
                key={workspace.id}
                className="gap-3"
                onSelect={() => setActiveWorkspaceId(workspace.id)}
              >
                {workspace.logo}
                {workspace.avatar && (
                  <Avatar className="size-5 rounded-md">
                    <AvatarImage src={workspace.avatar} alt={workspace.name} />
                    <AvatarFallback className="rounded-md text-[10px]">
                      {workspace.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className="flex flex-1 flex-col">
                  <span className="text-sm font-medium">{workspace.name}</span>
                  <span className="text-muted-foreground text-xs">{workspace.plan}</span>
                </div>
                {activeWorkspaceId === workspace.id && <Check aria-hidden="true" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => onAction?.(`Create ${label.toLowerCase()}`)}>
              <Plus aria-hidden="true" />
              Create new
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAction?.(`Manage ${label.toLowerCase()}`)}>
              <Settings aria-hidden="true" />
              Manage
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
