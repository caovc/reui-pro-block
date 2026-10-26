import { useState } from "react";
import { toast } from "sonner";
import {
  UserRound,
  Upload,
  X,
  RotateCcw,
  Save,
  CircleHelp,
  Palette,
  Users,
  CircleCheck,
  Grip,
  ClipboardList,
  Palmtree,
  Building2,
} from "lucide-react";
import { TabsBar } from "@/blocks/data/grid-base-common";
import { Alert, AlertDescription } from "@/components/reui/alert";
import {
  Item,
  ItemGroup,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from "@/components/ui/item";
import { IconTile } from "@/components/reui/icon-tile";
import { useFileUpload } from "@/hooks/use-file-upload";
import { useGlobalTheme, setGlobalTheme } from "@/components/site/global-theme-store";
import { Avatar, Button, Input } from "./shared";
import { SettingsSection, SettingsRow, SettingsSelect, SettingsNumber } from "./settings-shared";
import { RosterSettingsList } from "./roster-settings-list";
import { rosterSettingsTabs, type RosterSettingsState } from "./roster-settings-model";
import "./roster-settings.css";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export function RosterSettings({
  model,
  onTabChange,
  onFlowsSave,
  onClear,
  canClear,
}: {
  model: RosterSettingsState;
  onTabChange: (tab: string) => void;
  onFlowsSave: (flows: Record<string, string>) => void;
  onClear: (key: string) => void;
  canClear: Record<string, boolean>;
}) {
  const { theme } = useGlobalTheme();
  const [error, setError] = useState("");
  const [{ errors }, upload] = useFileUpload({
    accept: "image/*",
    maxSize: 2 * 1024 * 1024,
    onFilesAdded: (files) => {
      const file = files[0]?.file;
      if (!(file instanceof File)) return;
      const reader = new FileReader();
      reader.onload = () =>
        model.profile.setDraft((profile) => ({
          ...profile,
          photo: true,
          image: String(reader.result),
        }));
      reader.onerror = () => setError("Unable to read this photo.");
      reader.readAsDataURL(file);
    },
  });
  function validatedSave(name: string, save: () => void) {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setError("");
    save();
  }
  return (
    <div
      className={`ct-roster-settings${model.tab === "Profile" ? " ct-roster-settings-profile" : model.tab === "Preferences" ? " ct-roster-settings-preferences" : ""}`}
    >
      <div className="ct-heading">
        <h1>Settings</h1>
      </div>
      <TabsBar
        tabs={rosterSettingsTabs}
        value={model.tab}
        onChange={(tab) => {
          onTabChange(tab);
          setError("");
        }}
      />
      <div className="ct-roster-settings-panels">
        {model.tab === "Organisation" ? (
          <>
            <SettingsSection
              title="Company"
              description="Company details."
              dirty={model.company.dirty}
              save={() => validatedSave(model.company.draft.name, model.company.save)}
              discard={model.company.discard}
            >
              <SettingsRow title="Legal name" description="The registered company name.">
                <Input
                  aria-label="Legal name"
                  value={model.company.draft.name}
                  onChange={(e) =>
                    model.company.setDraft({ ...model.company.draft, name: e.target.value })
                  }
                />
              </SettingsRow>
              <SettingsRow
                title="Fiscal year starts"
                description="Start of the financial and leave year."
              >
                <div className="ct-settings-fiscal">
                  <SettingsSelect
                    label="Fiscal month"
                    value={model.company.draft.month}
                    options={[
                      "January",
                      "February",
                      "March",
                      "April",
                      "May",
                      "June",
                      "July",
                      "August",
                      "September",
                      "October",
                      "November",
                      "December",
                    ]}
                    onChange={(month) => model.company.setDraft({ ...model.company.draft, month })}
                  />
                  <SettingsSelect
                    label="Fiscal day"
                    value={String(model.company.draft.day)}
                    options={Array.from({ length: 31 }, (_, index) => String(index + 1))}
                    onChange={(day) =>
                      model.company.setDraft({ ...model.company.draft, day: Number(day) })
                    }
                  />
                </div>
              </SettingsRow>
            </SettingsSection>
            <RosterSettingsList
              title="Departments"
              description="Departments people can belong to."
              addLabel="Add department"
              firstColumn="Department"
              model={model.departments}
            />
            <RosterSettingsList
              title="Locations"
              description="Offices and regions, with their timezone."
              addLabel="Add location"
              firstColumn="Location"
              model={model.locations}
              timezone
            />
            <SettingsSection
              title="Working week"
              description="Days that count as working days."
              dirty={model.workdays.dirty}
              save={() => {
                if (!model.workdays.draft.length) {
                  setError("Choose at least one working day.");
                  return;
                }
                setError("");
                model.workdays.save();
              }}
              discard={model.workdays.discard}
            >
              <SettingsRow
                title="Working days"
                description={`${model.workdays.draft.length} days a week: ${days.filter((day) => model.workdays.draft.includes(day.slice(0, 3))).join(", ")}`}
              >
                <div className="ct-workdays">
                  {days.map((day) => (
                    <Button
                      key={day}
                      variant={
                        model.workdays.draft.includes(day.slice(0, 3)) ? "default" : "outline"
                      }
                      aria-label={day}
                      aria-pressed={model.workdays.draft.includes(day.slice(0, 3))}
                      onClick={() =>
                        model.workdays.setDraft((selected) =>
                          selected.includes(day.slice(0, 3))
                            ? selected.filter((item) => item !== day.slice(0, 3))
                            : [...selected, day.slice(0, 3)],
                        )
                      }
                    >
                      {day.slice(0, 3)}
                    </Button>
                  ))}
                </div>
              </SettingsRow>
            </SettingsSection>
          </>
        ) : model.tab === "Policies" ? (
          <>
            <RosterSettingsList
              title="Leave types"
              description="Leave types and their yearly entitlement."
              addLabel="Add leave type"
              firstColumn="Type"
              model={model.leave}
              days
            />
            <SettingsSection
              title="Leave rules"
              description="Rules that apply to every leave type."
              dirty={model.rules.dirty}
              save={model.rules.save}
              discard={model.rules.discard}
            >
              <SettingsRow
                title="Carry-over cap"
                description="Unused days carried into the next leave year."
              >
                <SettingsNumber
                  label="Carry-over cap"
                  value={model.rules.draft.carryover}
                  onChange={(carryover) => model.rules.setDraft({ carryover })}
                />
              </SettingsRow>
            </SettingsSection>
            <RosterSettingsList
              title="Employment types"
              description="Contract types."
              addLabel="Add employment type"
              firstColumn="Employment type"
              model={model.employment}
            />
          </>
        ) : model.tab === "Approval flows" ? (
          <SettingsSection
            title="Sign-off"
            description="The role that decides each kind of request."
            dirty={model.flows.dirty}
            save={() => {
              model.flows.save();
              onFlowsSave(model.flows.draft);
            }}
            discard={model.flows.discard}
          >
            {Object.entries(model.flows.draft).map(([type, role], index) => (
              <SettingsRow
                key={type}
                title={type}
                description={
                  [
                    "Time off requests.",
                    "Spend over the claim threshold.",
                    "Offers to candidates.",
                    "Salary, band and level changes.",
                    "Personal and payroll data.",
                  ][index]
                }
              >
                <SettingsSelect
                  label={`${type} approver`}
                  value={role}
                  options={["Manager", "Department head", "HR admin", "Finance"]}
                  onChange={(value) =>
                    model.flows.setDraft({ ...model.flows.draft, [type]: value })
                  }
                />
              </SettingsRow>
            ))}
          </SettingsSection>
        ) : model.tab === "Profile" ? (
          <SettingsSection title="Profile" description="How you appear across the app.">
            <SettingsRow title="Photo">
              <div className="ct-settings-profile-photo">
                {model.profile.draft.photo ? (
                  model.profile.draft.image ? (
                    <img src={model.profile.draft.image} alt="Your profile" />
                  ) : (
                    <Avatar name={model.profile.draft.name} />
                  )
                ) : (
                  <IconTile radius="full">
                    <UserRound />
                  </IconTile>
                )}
                <Button variant="outline" onClick={upload.openFileDialog}>
                  <Upload />
                  Change
                </Button>
                <Button
                  variant="ghost"
                  onClick={() =>
                    model.profile.setDraft({ ...model.profile.draft, photo: false, image: "" })
                  }
                >
                  <X />
                  Remove
                </Button>
                <input
                  {...upload.getInputProps()}
                  className="sr-only"
                  aria-label="Upload profile photo"
                />
              </div>
            </SettingsRow>
            <SettingsRow title="Full Name">
              <Input
                aria-label="Full Name"
                value={model.profile.draft.name}
                onChange={(e) =>
                  model.profile.setDraft({ ...model.profile.draft, name: e.target.value })
                }
              />
            </SettingsRow>
            <SettingsRow
              title={
                <span className="ct-profile-title">
                  Job Title
                  <CircleHelp aria-label="Your role in the organisation" />
                </span>
              }
            >
              <Input
                aria-label="Job Title"
                value={model.profile.draft.title}
                onChange={(e) =>
                  model.profile.setDraft({ ...model.profile.draft, title: e.target.value })
                }
              />
            </SettingsRow>
            <SettingsRow title="Location">
              <Input
                aria-label="Location"
                value={model.profile.draft.location}
                onChange={(event) =>
                  model.profile.setDraft({ ...model.profile.draft, location: event.target.value })
                }
              />
            </SettingsRow>
            <div className="ct-setting-footer">
              <span>{model.profile.dirty ? "Unsaved changes" : "All changes saved"}</span>
              <div className="ct-toolbar">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!model.profile.dirty}
                  onClick={model.profile.discard}
                >
                  <RotateCcw />
                  Reset
                </Button>
                <Button
                  size="sm"
                  disabled={!model.profile.dirty}
                  onClick={() => validatedSave(model.profile.draft.name, model.profile.save)}
                >
                  <Save />
                  Save changes
                </Button>
              </div>
            </div>
          </SettingsSection>
        ) : (
          <SettingsSection title="Preferences" description="Appearance and stored data.">
            <ItemGroup className="ct-preferences-list">
              {[
                {
                  key: "appearance",
                  title: "Appearance",
                  description: "Light, dark, or follow the system.",
                  icon: Palette,
                },
                {
                  key: "people",
                  title: "People you added",
                  description: "Added or edited by you.",
                  icon: Users,
                },
                {
                  key: "approvals",
                  title: "Approval decisions",
                  description: "Requests you approved or rejected.",
                  icon: CircleCheck,
                },
                {
                  key: "hiring",
                  title: "Hiring pipeline",
                  description: "Candidates you moved between stages.",
                  icon: Grip,
                },
                {
                  key: "notes",
                  title: "Person notes",
                  description: "Notes on a person's record.",
                  icon: ClipboardList,
                },
                {
                  key: "leave",
                  title: "Booked leave",
                  description: "Leave you booked, edited or cancelled.",
                  icon: Palmtree,
                },
                {
                  key: "timesheets",
                  title: "Timesheet sign-offs",
                  description: "Weeks you signed off or sent back.",
                  icon: CircleCheck,
                },
                {
                  key: "organisation",
                  title: "Organisation settings",
                  description: "Departments, locations, policies and approval flows.",
                  icon: Building2,
                },
              ].map(({ key, title, description, icon: Icon }) => (
                <Item key={key} className="ct-preference-item" role="listitem">
                  <ItemMedia>
                    <IconTile variant="elevated" className="text-muted-foreground">
                      <Icon />
                    </IconTile>
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{title}</ItemTitle>
                    <ItemDescription>{description}</ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!["appearance", "organisation"].includes(key) && !canClear[key]}
                      aria-label={
                        key === "appearance"
                          ? "Change appearance"
                          : key === "organisation"
                            ? "Restore organisation settings"
                            : `Clear ${title.toLowerCase()}`
                      }
                      title={
                        !["appearance", "organisation"].includes(key) && !canClear[key]
                          ? "Nothing saved to clear"
                          : undefined
                      }
                      onClick={() => {
                        if (key === "appearance") {
                          const mode =
                            theme.mode === "light"
                              ? "dark"
                              : theme.mode === "dark"
                                ? "system"
                                : "light";
                          setGlobalTheme({ ...theme, mode });
                          toast.success(`Appearance: ${mode}`);
                        } else if (key === "organisation") {
                          model.restore();
                          onFlowsSave({
                            Leave: "Manager",
                            Expense: "Finance",
                            Offer: "Department head",
                            Compensation: "HR admin",
                            "Profile change": "HR admin",
                          });
                          toast.success("Organisation settings restored");
                        } else {
                          onClear(key);
                          toast.success(`${title} cleared`, {
                            description: "The sample data is back to how it shipped.",
                          });
                        }
                      }}
                    >
                      {key === "appearance"
                        ? "Change"
                        : key === "organisation"
                          ? "Restore"
                          : "Clear"}
                    </Button>
                  </ItemActions>
                </Item>
              ))}
            </ItemGroup>
          </SettingsSection>
        )}
        {(error || errors.length > 0) && (
          <Alert variant="destructive">
            <AlertDescription>{error || errors.join(" ")}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
