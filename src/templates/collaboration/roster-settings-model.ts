import { useState } from "react";
import { useSettingsDraft } from "./settings-model";
export type SettingRecord = {
  id: string;
  name: string;
  count?: number;
  days?: number;
  timezone?: string;
};
const initialCompany = { name: "Roster UK", month: "April", day: 6 };
const initialDepartments: SettingRecord[] = [
  "Engineering",
  "Product",
  "Design",
  "Sales",
  "Marketing",
  "Customer Success",
  "People",
  "Finance",
].map((name, index) => ({ id: `dept-${index}`, name, count: [5, 2, 2, 3, 2, 2, 3, 2][index] }));
const initialLocations: SettingRecord[] = ["London", "Lisbon", "Berlin"].map((name) => ({
  id: name,
  name,
  timezone: `Europe/${name}`,
}));
const initialLeave: SettingRecord[] = ["Annual", "Sick", "Parental", "Unpaid"].map(
  (name, index) => ({ id: name, name, days: [25, 10, 90, 0][index], count: [27, 4, 1, 2][index] }),
);
const initialEmployment: SettingRecord[] = ["Full-time", "Part-time", "Contract"].map(
  (name, index) => ({ id: name, name, count: [19, 1, 1][index] }),
);
const initialFlows: Record<string, string> = {
  Leave: "Manager",
  Expense: "Finance",
  Offer: "Department head",
  Compensation: "HR admin",
  "Profile change": "HR admin",
};
export const rosterSettingsTabs = [
  "Organisation",
  "Policies",
  "Approval flows",
  "Profile",
  "Preferences",
];
export function useRosterSettingsState() {
  const [tab, setTab] = useState("Organisation");
  const company = useSettingsDraft(initialCompany);
  const departments = useSettingsDraft(initialDepartments);
  const locations = useSettingsDraft(initialLocations);
  const workdays = useSettingsDraft(["Mon", "Tue", "Wed", "Thu", "Fri"]);
  const leave = useSettingsDraft(initialLeave);
  const rules = useSettingsDraft({ carryover: 5 });
  const employment = useSettingsDraft(initialEmployment);
  const flows = useSettingsDraft(initialFlows);
  const profile = useSettingsDraft({
    name: "Bruno Duarte",
    title: "People Partner",
    location: "Lisbon",
    photo: true,
    image: "",
  });
  function restore() {
    company.restore(initialCompany);
    departments.restore(initialDepartments);
    locations.restore(initialLocations);
    workdays.restore(["Mon", "Tue", "Wed", "Thu", "Fri"]);
    leave.restore(initialLeave);
    rules.restore({ carryover: 5 });
    employment.restore(initialEmployment);
    flows.restore(initialFlows);
  }
  return {
    tab,
    setTab,
    company,
    departments,
    locations,
    workdays,
    leave,
    rules,
    employment,
    flows,
    profile,
    restore,
  };
}
export type RosterSettingsState = ReturnType<typeof useRosterSettingsState>;
