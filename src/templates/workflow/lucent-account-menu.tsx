import { useState, type MouseEvent } from "react";
import { Label } from "@/components/ui/label";
import {
  CreditCard,
  CircleHelp,
  LogOut,
  Monitor,
  Moon,
  MoreHorizontal,
  Palette,
  Settings,
  Sun,
  UserRound,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SidebarMenuButton, useSidebar } from "@/components/ui/sidebar";
import { setGlobalTheme, useGlobalTheme } from "@/components/site/global-theme-store";
import { toast } from "sonner";
import type { LucentDestination } from "./lucent-account-routes";

export function LucentAccountMenu({
  name,
  email,
  avatar,
  href,
  onNavigate,
}: {
  name: string;
  email: string;
  avatar?: string;
  href: (destination: LucentDestination) => string | null;
  onNavigate: (destination: LucentDestination) => void;
}) {
  const { isMobile, state, setOpenMobile } = useSidebar();
  const { theme } = useGlobalTheme();
  const [open, setOpen] = useState(false);
  const selectedTheme = theme.mode === "light" || theme.mode === "dark" ? theme.mode : "system";
  const collapsed = !isMobile && state === "collapsed";
  const image = avatar;
  const navigate = (event: MouseEvent<HTMLAnchorElement>, destination: LucentDestination) => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.currentTarget.target === "_blank"
    )
      return;
    if (!href(destination)) return;
    event.preventDefault();
    setOpen(false);
    if (isMobile) setOpenMobile(false);
    onNavigate(destination);
  };
  const entries = [
    { destination: "profile", label: "Profile", icon: UserRound, shortcut: "⇧⌘P" },
    { destination: "billing", label: "Billing", icon: CreditCard },
    { destination: "settings", label: "Preferences", icon: Settings, shortcut: "⌘" },
  ] as const;
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton aria-label="Open user menu" tooltip={name} className="h-9 gap-2">
          <Avatar className="size-7">
            <AvatarImage src={image} alt="" />
            <AvatarFallback>
              {name
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1 truncate">{name}</span>
              <MoreHorizontal className="size-4" />
            </>
          )}
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="reui-reference w-64"
        side={isMobile ? "top" : "right"}
        align="end"
        sideOffset={8}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-3 p-2">
            <Avatar className="size-9">
              <AvatarImage src={image} alt="" />
              <AvatarFallback>{name.slice(0, 1)}</AvatarFallback>
            </Avatar>
            <span className="min-w-0">
              <strong className="block truncate font-medium">{name}</strong>
              <span className="block truncate text-xs font-normal text-muted-foreground">
                {email}
              </span>
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {entries.map((entry) => (
            <DropdownMenuItem key={entry.destination} asChild>
              <a
                href={href(entry.destination) ?? undefined}
                onClick={(event) => navigate(event, entry.destination)}
              >
                <entry.icon />
                {entry.label}
                {"shortcut" in entry && (
                  <DropdownMenuShortcut>{entry.shortcut}</DropdownMenuShortcut>
                )}
              </a>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() =>
              toast.info("Help & Support", {
                description: "This independent preview runs locally. No support request was sent.",
              })
            }
          >
            <CircleHelp />
            Help &amp; Support
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(event) => event.preventDefault()}
            className="justify-between"
          >
            <span className="flex items-center gap-2">
              <Palette className="size-4" />
              Theme
            </span>
            <RadioGroup
              aria-label="Theme"
              value={selectedTheme}
              onValueChange={(mode) => {
                if (mode === "light" || mode === "dark" || mode === "system")
                  setGlobalTheme({ ...theme, mode });
              }}
              className="flex w-auto gap-1"
            >
              {[
                { value: "light", label: "Light", icon: Sun },
                { value: "dark", label: "Dark", icon: Moon },
                { value: "system", label: "System", icon: Monitor },
              ].map((mode) => (
                <Label
                  key={mode.value}
                  className="relative flex size-7 cursor-pointer items-center justify-center rounded-md has-[[aria-checked=true]]:bg-muted focus-within:ring-2 focus-within:ring-ring"
                >
                  <RadioGroupItem
                    value={mode.value}
                    aria-label={mode.label}
                    className="absolute inset-0 size-full rounded-md border-0 bg-transparent after:inset-0 dark:bg-transparent [&>[data-slot=radio-group-indicator]]:hidden"
                  />
                  <mode.icon className="pointer-events-none relative size-4" aria-hidden="true" />
                </Label>
              ))}
            </RadioGroup>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled
            aria-description="Authentication is unavailable in this local preview."
          >
            <LogOut />
            Sign Out<DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
