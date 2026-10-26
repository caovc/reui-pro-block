import { useEffect, useRef } from "react";
import { Building2, CreditCard, UserRound, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DriveProfileSettings } from "./drive-settings-profile";
import { DriveWorkspaceSettings } from "./drive-settings-workspace";
import { DriveTeamSettings } from "./drive-settings-team";
import { DriveBillingSettings } from "./drive-settings-billing";
import { DriveMemberDetail } from "./drive-settings-member-detail";
import {
  driveSettingsSections,
  driveSettingsTitles,
  type DriveSettingsSection,
} from "./drive-settings-data";
import type { DriveSettingsModel } from "./drive-settings-model";
import type { DrivePlan } from "./drive-workspace-model";
import type { DriveSettingsFile, DriveSettingsNavigation } from "./drive-settings-types";
import "./drive-settings.css";

const icons = { profile: UserRound, workspace: Building2, team: Users, billing: CreditCard };
export function DriveSettings({
  section,
  memberSlug,
  model,
  currentPlan,
  navigation,
  files,
  onOpenFile,
  pricingHref,
  onPricing,
}: {
  section: DriveSettingsSection;
  memberSlug?: string;
  model: DriveSettingsModel;
  currentPlan: DrivePlan;
  navigation: DriveSettingsNavigation;
  files: readonly DriveSettingsFile[];
  onOpenFile: (id: string) => void;
  pricingHref: string;
  onPricing: () => void;
}) {
  const scroll = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scroll.current) scroll.current.scrollTop = 0;
  }, [section, memberSlug]);
  return (
    <div ref={scroll} className="ds-root reui-reference" data-drive-settings-section={section}>
      <div className="ds-container">
        <header className="ds-heading">
          <h1>Account Settings</h1>
          <p>Update your account, workspace, team, and billing.</p>
        </header>
        <div className="ds-layout">
          <nav aria-label="Account settings sections" className="ds-navigation">
            {driveSettingsSections.map((entry) => {
              const Icon = icons[entry];
              return (
                <Button asChild key={entry} variant="ghost" className="ds-navigation-link">
                  <a
                    href={navigation.href(entry)}
                    aria-current={section === entry ? "page" : undefined}
                    onClick={(event) => {
                      if (
                        event.button === 0 &&
                        !event.metaKey &&
                        !event.ctrlKey &&
                        !event.shiftKey &&
                        !event.altKey
                      ) {
                        event.preventDefault();
                        navigation.onNavigate(entry);
                      }
                    }}
                  >
                    <Icon />
                    {driveSettingsTitles[entry]}
                  </a>
                </Button>
              );
            })}
          </nav>
          <main className="ds-page" key={`${section}/${memberSlug ?? "root"}`}>
            {section === "profile" ? (
              <DriveProfileSettings model={model} />
            ) : section === "workspace" ? (
              <DriveWorkspaceSettings model={model} />
            ) : section === "team" ? (
              memberSlug ? (
                <DriveMemberDetail
                  model={model}
                  memberSlug={memberSlug}
                  files={files}
                  navigation={navigation}
                  onOpenFile={onOpenFile}
                />
              ) : (
                <DriveTeamSettings model={model} navigation={navigation} />
              )
            ) : (
              <DriveBillingSettings
                model={model}
                currentPlan={currentPlan}
                pricingHref={pricingHref}
                onPricing={onPricing}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
