import { type CSSProperties, type ReactNode } from "react";
import { Building2, CreditCard, HardDrive, Settings } from "lucide-react";
import { AppShellInset } from "@/components/reui/layout";
import { ReuiSidebar, SidebarRailButton } from "@/components/reui/sidebar";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Mark, Avatar } from "./shared";
import "@/blocks/reference.css";
import "./drive-native-layout.css";

export type DriveApplication = "Drive" | "Workspace" | "Pricing" | "Settings";

type DriveLayoutProps = {
  children: ReactNode;
  onNavigate: () => void;
  onAction: (action: string) => void;
  activeApplication?: DriveApplication;
  profileName?: string;
  profileMenu?: ReactNode;
};

export function DriveApplicationTrigger() {
  return (
    <SidebarTrigger
      className="ct-drive-application-trigger"
      aria-label="Open application navigation"
    />
  );
}

function DriveRail({
  onNavigate,
  onAction,
  activeApplication = "Drive",
  profileName = "Alex Rivera",
  profileMenu,
}: Omit<DriveLayoutProps, "children">) {
  const { isMobile, setOpenMobile } = useSidebar();
  const navigate = (action: string) => {
    if (action === "Drive") onNavigate();
    else onAction(action);
    if (isMobile) setOpenMobile(false);
  };
  return (
    <ReuiSidebar
      width={63}
      mobileWidth="63px"
      mobileShowCloseButton={false}
      className="ct-drive-native-rail"
      mobileClassName="reui-reference ct-drive-native-rail ct-drive-native-mobile"
      mobileTitle="Bricklane Drive applications"
      header={
        <div className="ct-drive-native-brand">
          <button
            type="button"
            aria-label="Bricklane Drive, go to My Drive"
            onClick={() => navigate("Drive")}
          >
            <Mark />
          </button>
        </div>
      }
      footer={
        <SidebarMenu>
          <SidebarMenuItem className="flex justify-center">
            {profileMenu !== undefined ? (
              profileMenu
            ) : (
              <Button
                size="icon-sm"
                variant="ghost"
                className="ct-drive-profile-trigger"
                aria-label={`Open profile for ${profileName}`}
                onClick={() => navigate("Account settings")}
              >
                <Avatar name="Alex Rivera" />
              </Button>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      }
    >
      <SidebarMenu className="ct-drive-native-applications">
        {[
          { label: "Drive", action: "Drive", icon: HardDrive },
          { label: "Workspace", action: "Workspace settings", icon: Building2 },
          { label: "Pricing", action: "Get More Storage", icon: CreditCard },
          { label: "Settings", action: "Account settings", icon: Settings },
        ].map(({ label, action, icon: Icon }) => (
          <SidebarMenuItem key={label}>
            <SidebarRailButton label={label} active={label === activeApplication}>
              <button type="button" aria-label={label} onClick={() => navigate(action)}>
                <Icon />
              </button>
            </SidebarRailButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </ReuiSidebar>
  );
}

export function DriveLayout({
  children,
  onNavigate,
  onAction,
  activeApplication = "Drive",
  profileName = "Alex Rivera",
  profileMenu,
}: DriveLayoutProps) {
  return (
    <TooltipProvider>
      <SidebarProvider
        defaultOpen={false}
        keyboardShortcut={false}
        className="ct-app ct-drive ct-drive-native-root"
        style={{ "--sidebar-width-icon": "63px" } as CSSProperties}
      >
        <DriveRail
          onNavigate={onNavigate}
          onAction={onAction}
          activeApplication={activeApplication}
          profileName={profileName}
          profileMenu={profileMenu}
        />
        <AppShellInset className="ct-drive-window">{children}</AppShellInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
