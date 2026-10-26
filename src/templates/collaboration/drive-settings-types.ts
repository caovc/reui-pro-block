import type { DriveSettingsSection } from "./drive-settings-data";
export type DriveSettingsNavigation = {
  href: (section: DriveSettingsSection, memberSlug?: string) => string;
  onNavigate: (section: DriveSettingsSection, memberSlug?: string) => void;
};
export type DriveSettingsFile = {
  id: string;
  name: string;
  owner: string;
  type: string;
  size: string;
  modified: string;
  deleted?: boolean;
};
