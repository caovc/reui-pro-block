// Bricklane-authored account fixtures. UI labels/options follow public Atlas
// observations; no original account identity, avatar or vendor media is used.
import { demoAvatar } from "@/lib/demo-artwork";

export type AtlasAccountSection = "profile" | "security" | "preferences";

export interface AtlasAccountProfile {
  fullName: string;
  email: string;
  emailVerified: boolean;
  phone: string;
  username: string;
  role: string;
  timeZone: string;
  website: string;
  bio: string;
  avatar: string | null;
}

export interface AtlasAccountSecurity {
  twoFactor: boolean;
  secondStep: string;
  passkey: boolean;
  signInAlerts: boolean;
}

export interface AtlasAccountPreferences {
  defaultView: string;
  dateFormat: string;
  firstDay: string;
  autoSaveDrafts: boolean;
  richTextEditing: boolean;
  colorTheme: "System" | "Light" | "Dark";
  sidebarPosition: "Left" | "Right";
  reduceAnimations: boolean;
  showTooltips: boolean;
}

export const atlasAccountSections = [
  { id: "profile", label: "Profile" },
  { id: "security", label: "Security" },
  { id: "preferences", label: "Preferences" },
] as const;

export function createAtlasAccountProfile(): AtlasAccountProfile {
  return {
    fullName: "Amara Ortiz",
    email: "amara@bricklane.test",
    emailVerified: true,
    phone: "+14155550126",
    username: "amaraortiz",
    role: "Operations manager",
    timeZone: "(GMT-8) Los Angeles",
    website: "amara.bricklane.test",
    bio: "Coordinates customer operations, reporting, and the day-to-day work of the Bricklane team.",
    avatar: demoAvatar("Amara Ortiz"),
  };
}

export const atlasRoleOptions = [
  "Account owner",
  "Operations manager",
  "Sales lead",
  "Analyst",
  "Support lead",
] as const;

export const atlasTimeZoneGroups = [
  {
    label: "Americas",
    options: [
      "(GMT-5) New York",
      "(GMT-8) Los Angeles",
      "(GMT-6) Chicago",
      "(GMT-5) Toronto",
      "(GMT-8) Vancouver",
      "(GMT-3) Sao Paulo",
    ],
  },
  {
    label: "Europe",
    options: [
      "(GMT+0) London",
      "(GMT+1) Paris",
      "(GMT+1) Berlin",
      "(GMT+1) Rome",
      "(GMT+1) Madrid",
      "(GMT+1) Amsterdam",
    ],
  },
  {
    label: "Asia/Pacific",
    options: [
      "(GMT+9) Tokyo",
      "(GMT+8) Shanghai",
      "(GMT+8) Singapore",
      "(GMT+4) Dubai",
      "(GMT+11) Sydney",
      "(GMT+9) Seoul",
    ],
  },
] as const;

export const atlasPreferenceOptions = {
  defaultView: ["Dashboard", "Deals", "Products", "Reports"],
  dateFormat: ["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"],
  firstDay: ["Monday", "Sunday", "Saturday"],
  colorTheme: ["System", "Light", "Dark"],
  sidebarPosition: ["Left", "Right"],
} as const;

export function createAtlasAccountSecurity(): AtlasAccountSecurity {
  return {
    twoFactor: true,
    secondStep: "Authenticator app",
    passkey: false,
    signInAlerts: true,
  };
}

export function createAtlasAccountPreferences(): AtlasAccountPreferences {
  return {
    defaultView: "Dashboard",
    dateFormat: "MM/DD/YYYY",
    firstDay: "Monday",
    autoSaveDrafts: true,
    richTextEditing: true,
    colorTheme: "System",
    sidebarPosition: "Left",
    reduceAnimations: false,
    showTooltips: true,
  };
}
