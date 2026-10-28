import {
  Armchair,
  Bell,
  Clock3,
  CreditCard,
  RotateCcw,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { miroSettingsSections } from "./miro-settings-data";
import { MiroSettingsProfile } from "./miro-settings-profile";
import {
  MiroBillingSettings,
  MiroChairsSettings,
  MiroHoursSettings,
  MiroNotificationSettings,
  MiroProcedureSettings,
} from "./miro-settings-controls";
import type { MiroSettingsModel } from "./miro-settings-model";
import "@/blocks/reference.css";
import "@/blocks/application/dialog-variants/workspace/workspace.css";
import "./miro-settings.css";
const icons = {
  profile: UserRound,
  hours: Clock3,
  chairs: Armchair,
  procedures: Stethoscope,
  billing: CreditCard,
  notifications: Bell,
};

/** Parent composes the one real Tabs Root around Shell's aside and main slots. */
export function MiroSettingsNavigation({ model }: { model: MiroSettingsModel }) {
  return (
    <section className="miro-settings-navigation reui-reference" aria-label="Configuration">
      <header>
        <strong>Configuration</strong>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7"
          aria-label="Reset to shipped defaults"
          disabled={!model.hasChanges}
          onClick={model.resetDefaults}
        >
          <RotateCcw aria-hidden className="size-4" />
        </Button>
      </header>
      <TabsList className="miro-settings-tabs" aria-label="Configuration sections">
        {miroSettingsSections.map((section) => {
          const Icon = icons[section.id];
          return (
            <TabsTrigger key={section.id} value={section.id}>
              <Icon aria-hidden />
              {section.label}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </section>
  );
}

/** Main body only. Parent's native Shell header supplies the single visible Settings h1. */
export function MiroSettings({ model }: { model: MiroSettingsModel }) {
  return (
    <div className="miro-settings reui-reference" aria-label="Clinic settings">
      <TabsContent value="profile" aria-label="My Profile">
        <MiroSettingsProfile model={model} />
      </TabsContent>
      <TabsContent value="hours" aria-label="Hours">
        <MiroHoursSettings model={model} />
      </TabsContent>
      <TabsContent value="chairs" aria-label="Chairs">
        <MiroChairsSettings model={model} />
      </TabsContent>
      <TabsContent value="procedures" aria-label="Procedures">
        <MiroProcedureSettings model={model} />
      </TabsContent>
      <TabsContent value="billing" aria-label="Billing">
        <MiroBillingSettings model={model} />
      </TabsContent>
      <TabsContent value="notifications" aria-label="Notifications">
        <MiroNotificationSettings model={model} />
      </TabsContent>
    </div>
  );
}
