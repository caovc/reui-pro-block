// Actual official free REUI c-dropdown-menu-14, MIT (c) Keenthemes.
// https://reui.io/r/radix-nova/c-dropdown-menu-14.json
// Upstream source SHA256: 8b6f7b239fbb780abf94ebde68851cf708d9e45f9aff07f99bcbbb157b22a9f2
// Existing real free14 derivative reused; frozen original cannot configure its account rows.
// Only domain rows/icons/handlers extended here; see docs/navbar7-9-implementation.md.
"use client";

import { useState } from "react";
import { Badge } from "@/components/reui/badge";

import { cn } from "@/lib/utils";
import { demoAvatar } from "@/lib/demo-artwork";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bot,
  Check,
  LifeBuoy,
  LogOut,
  Monitor,
  Moon,
  Gauge,
  KeyRound,
  Settings,
  Sun,
} from "lucide-react";

const statuses = [
  { value: "available", label: "Available", color: "bg-success" },
  { value: "away", label: "Away", color: "bg-warning" },
  { value: "busy", label: "Busy", color: "bg-destructive" },
  { value: "offline", label: "Offline", color: "bg-muted-foreground" },
];

export function MarketplaceAccountMenu({
  theme,
  agentCount,
  dark,
  onThemeChange: setTheme,
  onAction,
}: {
  theme: string;
  agentCount: number;
  dark: boolean;
  onThemeChange: (theme: string) => void;
  onAction: (action: string) => void;
}) {
  const [status, setStatus] = useState("available");

  const activeStatus = statuses.find((s) => s.value === status) || statuses[0];

  return (
    <div className="flex items-center justify-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Account menu">
            <Avatar className="size-4">
              <AvatarImage src={demoAvatar("Maya Stone")} alt="Maya Stone" />
              <AvatarFallback>MS</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className={cn("w-60", dark && "dark")} align="start" sideOffset={8}>
          <div className="flex items-center gap-3 px-1 pt-1.5">
            <Avatar className="size-8">
              <AvatarImage src={demoAvatar("Maya Stone")} alt="Maya Stone" />
              <AvatarFallback>MS</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-foreground text-sm font-medium">Maya Stone</span>
              <span className="text-muted-foreground text-xs">maya@bricklane.local</span>
            </div>
          </div>
          <div className="py-2.5">
            <Tabs value={theme} onValueChange={setTheme}>
              <TabsList className="w-full">
                <TabsTrigger value="light" className="h-6 flex-1">
                  <Sun aria-hidden="true" />
                  <span className="sr-only">Light</span>
                </TabsTrigger>
                <TabsTrigger value="dark" className="h-6 flex-1">
                  <Moon aria-hidden="true" />
                  <span className="sr-only">Dark</span>
                </TabsTrigger>
                <TabsTrigger value="system" className="h-6 flex-1">
                  <Monitor aria-hidden="true" />
                  <span className="sr-only">System</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => onAction("My Agents")} className="justify-between">
              <span className="flex items-center gap-2">
                <Bot aria-hidden="true" />
                My Agents
              </span>
              <Badge variant="secondary" size="sm" className="rounded-full px-1.5">
                {agentCount}
              </Badge>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAction("Usage")} className="justify-between">
              <span className="flex items-center gap-2">
                <Gauge aria-hidden="true" />
                Usage
              </span>
              <Badge variant="secondary" size="sm" className="rounded-full px-1.5">
                {agentCount * 125}
              </Badge>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => onAction("API Keys")}>
              <KeyRound />
              API Keys
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <span className="flex items-center gap-2">
                <span className={cn("size-2 rounded-full", activeStatus.color)} />
                {activeStatus.label}
              </span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-40">
              {statuses.map((s) => (
                <DropdownMenuItem
                  key={s.value}
                  onClick={() => setStatus(s.value)}
                  className="justify-between"
                >
                  <span className="flex items-center gap-2">
                    <span className={`size-2 rounded-full ${s.color}`} />
                    {s.label}
                  </span>
                  {status === s.value && <Check aria-hidden="true" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => onAction("Settings")}>
              <Settings aria-hidden="true" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAction("Help center")}>
              <LifeBuoy aria-hidden="true" />
              Help Center
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => onAction("Signed out locally")}>
            <LogOut aria-hidden="true" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
