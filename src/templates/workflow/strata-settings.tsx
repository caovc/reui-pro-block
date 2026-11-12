import { useLayoutEffect, useRef } from "react";
import {
  CreditCard,
  ExternalLink,
  KeyRound,
  RefreshCw,
  Shield,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { StrataHeaderActions } from "./strata-context";
import { StrataSettingsGeneral } from "./strata-settings-general";
import { StrataSettingsProfile } from "./strata-settings-profile";
import { StrataSettingsApi } from "./strata-settings-api";
import type { useStrataSettingsApiModel } from "./strata-settings-api-model";
import { StrataSettingsSecurity } from "./strata-settings-security";
import type { useStrataSettingsSecurityModel } from "./strata-settings-security-model";
import { StrataSettingsBilling } from "./strata-settings-billing";
import type { useStrataSettingsBillingModel } from "./strata-settings-billing-model";
import {
  STRATA_SETTINGS_TABS,
  type StrataSettingsTab,
  type useStrataSettingsModel,
} from "./strata-settings-model";
import "./strata-settings.css";

const tabs = [
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "general", label: "General", icon: SlidersHorizontal },
  { id: "api-keys", label: "API keys", icon: KeyRound },
  { id: "security", label: "Security", icon: Shield },
  { id: "billing", label: "Billing", icon: CreditCard },
] as const;

export function StrataSettings({
  tab,
  onTabChange,
  model,
  apiModel,
  securityModel,
  billingModel,
}: {
  tab: StrataSettingsTab;
  onTabChange: (tab: StrataSettingsTab) => void;
  model: ReturnType<typeof useStrataSettingsModel>;
  apiModel: ReturnType<typeof useStrataSettingsApiModel>;
  securityModel: ReturnType<typeof useStrataSettingsSecurityModel>;
  billingModel: ReturnType<typeof useStrataSettingsBillingModel>;
}) {
  const isMobile = useIsMobile();
  const navigationRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const navigation = navigationRef.current;
    if (!isMobile || !navigation) return;

    const revealSelectedTab = () => {
      const selected = navigation.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
      if (!selected) return;
      const bounds = navigation.getBoundingClientRect();
      const item = selected.getBoundingClientRect();
      const left = bounds.left + navigation.clientLeft;
      const right = left + navigation.clientWidth;
      const delta =
        item.left < left ? item.left - left : item.right > right ? item.right - right : 0;
      if (delta) navigation.scrollBy({ left: delta, behavior: "instant" });
    };

    revealSelectedTab();
    const resize = new ResizeObserver(revealSelectedTab);
    resize.observe(navigation);
    for (const trigger of navigation.querySelectorAll('[role="tab"]')) resize.observe(trigger);
    return () => resize.disconnect();
  }, [isMobile, tab]);

  return (
    <section className="strata-settings" aria-label="Settings">
      <h1 className="sr-only">Settings</h1>
      <StrataHeaderActions>
        <Button variant="outline" size="icon" aria-label="Sync from Stripe" disabled>
          <RefreshCw />
        </Button>
        <Button onClick={() => onTabChange("billing")}>
          <ExternalLink />
          Manage Billing
        </Button>
      </StrataHeaderActions>
      <Tabs
        value={tab}
        onValueChange={(value) => {
          if (STRATA_SETTINGS_TABS.includes(value as StrataSettingsTab))
            onTabChange(value as StrataSettingsTab);
        }}
        orientation={isMobile ? "horizontal" : "vertical"}
        className="strata-settings-tabs"
      >
        <TabsList
          ref={navigationRef}
          className="strata-settings-navigation"
          aria-label="Settings sections"
        >
          {tabs.map(({ id, label, icon: Icon }) => (
            <TabsTrigger key={id} value={id}>
              <Icon />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="strata-settings-content">
          <TabsContent value="profile">
            <StrataSettingsProfile model={model} />
          </TabsContent>
          <TabsContent value="general">
            <StrataSettingsGeneral model={model} />
          </TabsContent>
          <TabsContent value="api-keys">
            <StrataSettingsApi model={apiModel} />
          </TabsContent>
          <TabsContent value="security">
            <StrataSettingsSecurity model={securityModel} />
          </TabsContent>
          <TabsContent value="billing">
            <StrataSettingsBilling model={billingModel} />
          </TabsContent>
        </div>
      </Tabs>
    </section>
  );
}
