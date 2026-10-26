import { Fragment, useState } from "react";
import { ChevronDown } from "lucide-react";
import { SettingsChoice } from "@/blocks/application/dialog-variants/workspace/settings-panel";
import { Badge } from "@/components/reui/badge";
import { Frame, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { Separator } from "@/components/ui/separator";
import {
  lucentInitialNotifications,
  lucentNotificationGroups,
  type LucentNotificationValues,
} from "./lucent-preferences-data";

export function LucentNotificationRules() {
  const [values, setValues] = useState({ ...lucentInitialNotifications });

  function change(id: keyof LucentNotificationValues, value: string | boolean) {
    setValues((current) => ({ ...current, [id]: value }));
  }

  return (
    <section className="wf-lucent-notification-rules" aria-labelledby="lucent-notifications-title">
      <header>
        <h2 id="lucent-notifications-title">Notification rules</h2>
        <p>Choose what reaches you, through which channel, and when.</p>
      </header>
      {lucentNotificationGroups.map((group) => (
        <Collapsible key={group.id} defaultOpen>
          <Frame dense spacing="sm" className="wf-lucent-rule-frame" aria-label={group.title}>
            <FrameHeader>
              <CollapsibleTrigger asChild>
                <Button type="button" variant="ghost" className="wf-lucent-rule-group-trigger">
                  <FrameTitle>{group.title}</FrameTitle>
                  <ChevronDown aria-hidden="true" />
                </Button>
              </CollapsibleTrigger>
            </FrameHeader>
            <CollapsibleContent className="wf-lucent-rule-content">
              <FramePanel>
                {group.rules.map((rule, index) => {
                  const id = `lucent-rule-${rule.id}`;
                  return (
                    <Fragment key={rule.id}>
                      <Item className="wf-lucent-rule-item">
                        <ItemContent>
                          <ItemTitle>
                            <label htmlFor={id} className="wf-lucent-rule-label">
                              {rule.label}
                              {rule.badge && (
                                <Badge
                                  aria-hidden="true"
                                  variant="outline"
                                  className={`wf-lucent-badge-${rule.badge.tone}`}
                                >
                                  {rule.badge.label}
                                </Badge>
                              )}
                            </label>
                          </ItemTitle>
                          <ItemDescription id={`${id}-description`}>
                            {rule.description}
                          </ItemDescription>
                        </ItemContent>
                        <ItemActions>
                          {rule.options ? (
                            <SettingsChoice
                              id={id}
                              value={String(values[rule.id])}
                              options={rule.options}
                              onChange={(value) => change(rule.id, value)}
                              describedBy={`${id}-description`}
                            />
                          ) : (
                            <Switch
                              id={id}
                              aria-label={rule.label}
                              checked={Boolean(values[rule.id])}
                              onCheckedChange={(checked) => change(rule.id, checked)}
                              aria-describedby={`${id}-description`}
                            />
                          )}
                          {rule.id === "quietHours" && values.quietHours === "Custom window" && (
                            <p className="wf-lucent-custom-window-note" role="status">
                              Custom window editing is not available in this local demo.
                            </p>
                          )}
                        </ItemActions>
                      </Item>
                      {index < group.rules.length - 1 && <Separator />}
                    </Fragment>
                  );
                })}
              </FramePanel>
            </CollapsibleContent>
          </Frame>
        </Collapsible>
      ))}
    </section>
  );
}
