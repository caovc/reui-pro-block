/** Original Bricklane clinic settings data; no original preview people or prices. */
export type MiroSettingsSection =
  | "profile"
  | "hours"
  | "chairs"
  | "procedures"
  | "billing"
  | "notifications";
export const miroSettingsSections = [
  { id: "profile", label: "My Profile" },
  { id: "hours", label: "Hours" },
  { id: "chairs", label: "Chairs" },
  { id: "procedures", label: "Procedures" },
  { id: "billing", label: "Billing" },
  { id: "notifications", label: "Notifications" },
] as const;
export interface MiroProfile {
  fullName: string;
  email: string;
  username: string;
  role: string;
  timeZone: string;
  website: string;
  bio: string;
  avatar: string;
}
export type MiroProfileField = Exclude<keyof MiroProfile, "avatar">;
export const initialMiroProfile: MiroProfile = {
  fullName: "Mara Ellis",
  email: "mara.ellis@clinic.bricklane.example",
  username: "mara.ellis",
  role: "Practice manager",
  timeZone: "UTC+0 (London)",
  website: "",
  bio: "",
  avatar: "default",
};
export const miroRoles = ["Practice manager", "Clinician", "Receptionist"] as const;
export const miroTimeZones = [
  "UTC+0 (London)",
  "UTC+1 (Paris)",
  "UTC-5 (New York)",
  "UTC+8 (Singapore)",
] as const;
export const miroChairColors = [
  { id: "peacock", label: "Peacock", color: "#2563eb" },
  { id: "grape", label: "Grape", color: "#b929e8" },
  { id: "tangerine", label: "Tangerine", color: "#f97316" },
  { id: "basil", label: "Basil", color: "#0d9488" },
  { id: "lavender", label: "Lavender", color: "#8b5cf6" },
  { id: "flamingo", label: "Flamingo", color: "#ef4444" },
  { id: "sage", label: "Sage", color: "#16a34a" },
  { id: "blueberry", label: "Blueberry", color: "#4f46e5" },
  { id: "tomato", label: "Tomato", color: "#e11d48" },
] as const;
export type MiroChairColor = (typeof miroChairColors)[number]["id"];
export interface MiroChair {
  id: string;
  name: string;
  specialty: string;
  color: MiroChairColor;
  visible: boolean;
}
export const initialMiroChairs: readonly MiroChair[] = [
  {
    id: "chair-1",
    name: "Dr. Leila Hart",
    specialty: "Restorative",
    color: "peacock",
    visible: true,
  },
  {
    id: "chair-2",
    name: "Dr. Dev Sharma",
    specialty: "Endodontics",
    color: "grape",
    visible: true,
  },
  {
    id: "chair-3",
    name: "Dr. Sofia Marin",
    specialty: "Orthodontics",
    color: "tangerine",
    visible: true,
  },
  {
    id: "chair-4",
    name: "Dr. Felix Bennett",
    specialty: "Oral Surgery",
    color: "basil",
    visible: true,
  },
  { id: "chair-5", name: "Dr. Yuna Park", specialty: "Hygiene", color: "lavender", visible: true },
  {
    id: "chair-6",
    name: "Dr. Malik Foster",
    specialty: "Periodontics",
    color: "flamingo",
    visible: false,
  },
  { id: "chair-7", name: "Dr. Aditi Rao", specialty: "Pediatrics", color: "sage", visible: false },
  {
    id: "chair-8",
    name: "Dr. Henrik Dahl",
    specialty: "Implantology",
    color: "blueberry",
    visible: false,
  },
  {
    id: "chair-9",
    name: "Dr. Lucía Vega",
    specialty: "Prosthodontics",
    color: "tomato",
    visible: false,
  },
];
export const miroProcedures = [
  { id: "checkup", name: "General Checkup", minutes: 30, price: 105 },
  { id: "scaling", name: "Scaling", minutes: 45, price: 145 },
  { id: "whitening", name: "Whitening", minutes: 60, price: 310 },
  { id: "filling", name: "Composite Filling", minutes: 45, price: 205 },
  { id: "root-canal", name: "Root Canal", minutes: 90, price: 910 },
  { id: "extraction", name: "Extraction", minutes: 60, price: 245 },
  { id: "crown", name: "Crown Fitting", minutes: 60, price: 1020 },
  { id: "braces", name: "Braces Adjustment", minutes: 30, price: 165 },
  { id: "implant", name: "Implant Review", minutes: 45, price: 135 },
] as const;
export type MiroPriceList = Record<string, number | null>;
export const createMiroPrices = (): MiroPriceList =>
  Object.fromEntries(miroProcedures.map((procedure) => [procedure.id, procedure.price]));
export const miroAlertTypes = [
  { id: "booked", label: "Booked", description: "A chair was given to a patient." },
  {
    id: "rescheduled",
    label: "Rescheduled",
    description: "A booking moved to another time or chair.",
  },
  {
    id: "status",
    label: "Status",
    description: "Somebody arrived, took the chair, or settled up.",
  },
  { id: "updated", label: "Updated", description: "A booking's details were corrected." },
  { id: "cancelled", label: "Cancelled", description: "A slot was given back." },
] as const;
export type MiroAlertType = (typeof miroAlertTypes)[number]["id"];
export interface MiroActivity {
  id: string;
  type: MiroAlertType;
}
export const initialMiroActivities: readonly MiroActivity[] = [
  { id: "activity-01", type: "booked" },
  { id: "activity-02", type: "booked" },
  { id: "activity-03", type: "rescheduled" },
  { id: "activity-04", type: "status" },
  { id: "activity-05", type: "updated" },
];
export interface MiroInvoiceForSettings {
  id: string;
  amount: number;
  issuedAt: string;
  status: "open" | "paid" | "void";
}
export const initialMiroSettingsInvoices: readonly MiroInvoiceForSettings[] = [
  { id: "BR-INVOICE-01", amount: 405, issuedAt: "2026-10-20", status: "open" },
  { id: "BR-INVOICE-02", amount: 680, issuedAt: "2026-10-07", status: "open" },
  { id: "BR-INVOICE-03", amount: 270, issuedAt: "2026-09-28", status: "open" },
];
export const miroSettingsAsOf = "2026-10-22";
export const miroPaymentTerms = [0, 7, 14, 30, 60] as const;
