import { Badge } from "@/components/reui/badge";
import { Switch } from "@/components/ui/switch";
import { setGlobalTheme, useGlobalTheme } from "@/components/site/global-theme-store";
import {
  StrataSettingsSection,
  StrataSettingsRow,
  StrataSettingsSelect,
} from "./strata-settings-shared";
import type { useStrataSettingsModel } from "./strata-settings-model";

type GeneralModel = ReturnType<typeof useStrataSettingsModel>;

export function StrataSettingsGeneral({ model }: { model: GeneralModel }) {
  const { theme } = useGlobalTheme();
  const { general, changeGeneral } = model;
  const choice = (
    key: "landing" | "dateFormat" | "firstDay" | "colorTheme" | "timestamps",
    label: string,
    description: string,
    options: readonly string[],
    badge?: React.ReactNode,
  ) => (
    <StrataSettingsRow
      id={`strata-${key}`}
      title={label}
      description={description}
      badge={badge}
      compact
    >
      <StrataSettingsSelect
        id={`strata-${key}`}
        label={label}
        value={general[key]}
        options={options}
        onChange={(value) => {
          changeGeneral(key, value);
          if (key === "colorTheme" && (value === "Light" || value === "Dark" || value === "System"))
            setGlobalTheme({ ...theme, mode: value.toLowerCase() as "light" | "dark" | "system" });
        }}
      />
    </StrataSettingsRow>
  );
  const toggle = (
    key: "refresh" | "markdown" | "reduceMotion" | "tooltips",
    label: string,
    description: string,
    badge?: React.ReactNode,
  ) => (
    <StrataSettingsRow
      id={`strata-${key}`}
      title={label}
      description={description}
      badge={badge}
      compact
    >
      <Switch
        id={`strata-${key}`}
        aria-label={label}
        checked={general[key]}
        onCheckedChange={(value) => changeGeneral(key, value)}
      />
    </StrataSettingsRow>
  );
  return (
    <div className="strata-settings-stack strata-settings-general">
      <StrataSettingsSection title="General" collapsible>
        {choice("landing", "Landing page", "Choose which page opens after sign-in.", [
          "Overview",
          "Services",
          "Monitors",
          "Logs",
        ])}
        {choice("dateFormat", "Date format", "Set how dates appear across the app.", [
          "MM/DD/YYYY",
          "DD/MM/YYYY",
          "YYYY-MM-DD",
        ])}
        {choice("firstDay", "First day of week", "Used for calendars and date pickers.", [
          "Monday",
          "Sunday",
          "Saturday",
          "Friday",
          "Thursday",
          "Wednesday",
          "Tuesday",
        ])}
        {toggle(
          "refresh",
          "Auto-refresh charts",
          "Reload live charts every 30 seconds.",
          <Badge size="sm" variant="success-light">
            Recommended
          </Badge>,
        )}
        {toggle(
          "markdown",
          "Markdown notes",
          "Format incident notes and postmortems.",
          <Badge size="sm" variant="outline">
            Editor
          </Badge>,
        )}
      </StrataSettingsSection>
      <StrataSettingsSection title="Display" collapsible>
        {choice(
          "colorTheme",
          "Color theme",
          "Choose your preferred color scheme.",
          ["System", "Light", "Dark"],
          <Badge size="sm" variant="focus-outline">
            Shared
          </Badge>,
        )}
        {choice("timestamps", "Timestamps", "Show times in UTC or your local zone.", [
          "UTC",
          "Local time",
        ])}
        {toggle(
          "reduceMotion",
          "Reduce animations",
          "Minimize motion for accessibility.",
          <Badge size="sm" variant="warning-light">
            Accessibility
          </Badge>,
        )}
        {toggle("tooltips", "Show tooltips", "Display helpful hints on hover.")}
      </StrataSettingsSection>
    </div>
  );
}
