export type DriveChoiceOption = readonly [label: string, description: string];
export const driveLanguageOptions: readonly DriveChoiceOption[] = [
  ["English (US)", "Default product language"],
  ["English (UK)", "Common team alternative"],
  ["German", "For regional ops"],
];
export const driveLandingOptions: readonly DriveChoiceOption[] = [
  ["My Drive", "The whole tree, newest first"],
  ["Recent", "What you touched last"],
  ["Favourites", "Only what you pinned"],
];
export const driveDigestOptions: readonly DriveChoiceOption[] = [
  ["Weekday mornings", "Sent before standup"],
  ["Daily evenings", "Wrap the workday"],
  ["Weekly summary", "Monday planning recap"],
];
export const driveAccessOptions: readonly DriveChoiceOption[] = [
  ["Member", "Opens and edits the work shared with them"],
  ["Admin", "Also manages people and workspace settings"],
  ["Owner", "Everything an admin can do, plus the plan and billing"],
];
