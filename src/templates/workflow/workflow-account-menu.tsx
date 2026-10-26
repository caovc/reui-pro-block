import { useRef, useState, type RefObject } from "react";
import {
  Building2,
  Check,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Monitor,
  MoreHorizontal,
  Moon,
  Palette,
  Plus,
  Settings,
  SlidersHorizontal,
  Sun,
  UserRound,
  Users,
} from "lucide-react";
import { BrandGlyph } from "@/components/brand-mark";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton, useSidebar } from "@/components/ui/sidebar";
import { setGlobalTheme, useGlobalTheme } from "@/components/site/global-theme-store";
import type { WorkflowAccountIdentity } from "./workflow-account-settings";
import type { WorkflowAccountKind, WorkflowAccountSection } from "./workflow-account-settings-data";
import "@/blocks/reference.css";
import "./workflow-account-menu.css";

const accountEntries = [
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "workspace", label: "Workspace", icon: Building2 },
  { id: "team", label: "Team", icon: Users },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "preferences", label: "Preferences", icon: SlidersHorizontal },
] as const;
const appearances = [
  { value: "light", label: "Light theme", icon: Sun },
  { value: "dark", label: "Dark theme", icon: Moon },
  { value: "system", label: "System theme", icon: Monitor },
] as const;
const organizations = ["Bricklane Studio", "Northstar", "Acme"];

/** Private review candidate: actual free menu controls; domain Settings stay in the Pro panel. */
export function WorkflowAccountMenu({
  kind,
  identity,
  collapsed,
  triggerRef,
  onSectionSelect,
}: {
  kind: WorkflowAccountKind;
  identity: WorkflowAccountIdentity;
  collapsed: boolean;
  triggerRef: RefObject<HTMLButtonElement | null>;
  onSectionSelect: (section: WorkflowAccountSection, trigger: HTMLButtonElement | null) => void;
}) {
  const [organization, setOrganization] = useState(organizations[0]);
  const { isMobile } = useSidebar();
  const opensSettings = useRef(false);
  const { theme } = useGlobalTheme();
  const selectedTheme = theme.mode === "light" || theme.mode === "dark" ? theme.mode : "system";
  const mesh = kind === "mesh";
  const entries = accountEntries.filter(
    (entry) => mesh || !["workspace", "team"].includes(entry.id),
  );
  const initials = identity.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
  const avatar = (className: string) => (
    <Avatar className={className}>
      <AvatarImage src={identity.avatar} alt="" />
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          ref={triggerRef}
          data-account-kind={kind}
          data-account-collapsed={collapsed}
          className={
            mesh
              ? "wf-account-menu-trigger wf-account-menu-trigger-mesh"
              : "wf-account-menu-trigger"
          }
          aria-label={mesh ? `Open profile for ${identity.name}` : "Open workspace menu"}
          tooltip={mesh ? identity.name : organization}
        >
          {mesh ? avatar("size-7 rounded-lg") : <BrandGlyph className="size-4 shrink-0" />}
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1 truncate">{mesh ? identity.name : organization}</span>
              {mesh ? <ChevronsUpDown /> : <MoreHorizontal />}
            </>
          )}
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className={`reui-reference wf-account-menu wf-account-menu-${kind}`}
        side={!mesh && isMobile ? "top" : "right"}
        align="end"
        sideOffset={8}
        onCloseAutoFocus={(event) => {
          if (opensSettings.current) {
            event.preventDefault();
            opensSettings.current = false;
          }
        }}
      >
        {mesh ? (
          <DropdownMenuLabel className="wf-account-menu-identity">
            {avatar("size-8 rounded-lg")}
            <span className="flex min-w-0 flex-col">
              <strong className="truncate font-medium">{identity.name}</strong>
              <small className="truncate text-xs font-normal text-muted-foreground">
                sienna@nimbusfleet.example
              </small>
            </span>
          </DropdownMenuLabel>
        ) : (
          <>
            <DropdownMenuLabel>Organizations</DropdownMenuLabel>
            <DropdownMenuGroup>
              {organizations.map((name) => (
                <DropdownMenuItem key={name} onSelect={() => setOrganization(name)}>
                  {name === organizations[0] ? (
                    <BrandGlyph />
                  ) : (
                    <span className="wf-account-organization-mark">{name[0]}</span>
                  )}
                  {name}
                  {name === organization && <Check className="ml-auto" />}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem
                disabled
                aria-description="Organization creation is outside this local account-settings preview."
              >
                <Plus />
                New Organization
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled
                aria-description="Organization management is outside this local account-settings preview."
              >
                <Settings />
                Manage Organizations
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}
        <DropdownMenuSeparator />
        {!mesh && (
          <DropdownMenuLabel className="wf-account-menu-account-label">
            <span>Account</span>
            <span className="ml-auto inline-flex min-w-0 items-center gap-1.5">
              {avatar("size-4")}
              <span className="truncate">{identity.name}</span>
            </span>
          </DropdownMenuLabel>
        )}
        <DropdownMenuGroup>
          {entries.map(({ id, label, icon: Icon }) => (
            <DropdownMenuItem
              key={id}
              onSelect={() => {
                opensSettings.current = true;
                onSectionSelect(id, triggerRef.current);
              }}
            >
              <Icon />
              {label}
              {id === "profile" && <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        {mesh && <DropdownMenuSeparator />}
        <div className="wf-account-menu-theme-row">
          <Palette className="size-4" />
          <span>Theme</span>
          <DropdownMenuRadioGroup
            value={selectedTheme}
            onValueChange={(mode) => setGlobalTheme({ ...theme, mode })}
            className="wf-account-menu-theme-choices"
            aria-label="Account appearance"
          >
            {appearances.map(({ value, label, icon: Icon }) => (
              <DropdownMenuRadioItem
                key={value}
                value={value}
                aria-label={label}
                title={label}
                className="wf-account-menu-theme-choice"
                onSelect={(event) => event.preventDefault()}
              >
                <Icon className="size-3.5" />
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled
          aria-description="This local preview has no authenticated session to sign out of."
        >
          <LogOut />
          Sign Out{!mesh && <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
