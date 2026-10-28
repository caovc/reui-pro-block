import type { SettingsFieldDefinition } from "@/blocks/application/dialog-variants/workspace/settings-panel";

export type CommerceDateFormat = "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY/MM/DD";
export type CommerceGeneralValues = {
  name: string;
  domain: string;
  timezone: string;
  logo: string;
  brandColor: string;
  region: string;
  currency: string;
  dateFormat: CommerceDateFormat;
  taxIncluded: boolean;
  passwordProtected: boolean;
  maintenance: boolean;
  poweredBy: boolean;
};
export type CommerceDemoDataAction = "load" | "reset" | "clear";

export function createCommerceGeneralDefaults(): CommerceGeneralValues {
  return {
    name: "Bricklane Store",
    domain: "bricklane.store",
    timezone: "(GMT-05:00) New York",
    logo: "",
    brandColor: "#6366f1",
    region: "United States",
    currency: "USD · US Dollar",
    dateFormat: "MM/DD/YYYY",
    taxIncluded: true,
    passwordProtected: false,
    maintenance: false,
    poweredBy: true,
  };
}

export const commerceGeneralFields = [
  {
    id: "name",
    controlId: "commerce-general-name",
    label: "Store name",
    description: "The name customers see across your storefront and emails.",
    maxLength: 100,
  },
  {
    id: "domain",
    controlId: "commerce-general-domain",
    label: "Store URL",
    description: "Your primary storefront domain.",
    prefix: "https://",
    maxLength: 253,
  },
] satisfies SettingsFieldDefinition[];

export const commerceTimezones = [
  "(GMT-05:00) New York",
  "(GMT-06:00) Chicago",
  "(GMT-08:00) Los Angeles",
  "(GMT+00:00) London",
  "(GMT+01:00) Berlin",
  "(GMT+09:00) Tokyo",
  "(GMT+11:00) Sydney",
];
export const commerceRegions = [
  "United States",
  "European Union",
  "United Kingdom",
  "Japan",
  "Australia",
];
export const commerceCurrencies = [
  "USD · US Dollar",
  "EUR · Euro",
  "GBP · British Pound",
  "JPY · Japanese Yen",
  "AUD · Australian Dollar",
];
export const commerceBrandColors = [
  { value: "#6366f1", label: "Indigo" },
  { value: "#f43f5e", label: "Rose" },
  { value: "#f97316", label: "Orange" },
  { value: "#8b5cf6", label: "Violet" },
  { value: "#10b981", label: "Emerald" },
  { value: "#0ea5e9", label: "Sky" },
];
export const commerceDateFormats: CommerceDateFormat[] = ["MM/DD/YYYY", "DD/MM/YYYY", "YYYY/MM/DD"];
export const commerceStorefrontPreferences: {
  id: "taxIncluded" | "passwordProtected" | "maintenance" | "poweredBy";
  title: string;
  description: string;
}[] = [
  {
    id: "taxIncluded",
    title: "Show prices with tax included.",
    description: "Display tax-inclusive prices across the storefront.",
  },
  {
    id: "passwordProtected",
    title: "Password-protect storefront.",
    description: "Require a password before customers can view the store.",
  },
  {
    id: "maintenance",
    title: "Enable maintenance mode.",
    description: "Temporarily take the storefront offline for updates.",
  },
  {
    id: "poweredBy",
    title: 'Show "Powered by" badge.',
    description: "Display the platform badge in the storefront footer.",
  },
];
