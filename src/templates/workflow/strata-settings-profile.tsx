import { useEffect, useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { Badge } from "@/components/reui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Textarea } from "@/components/ui/textarea";
import { useFileUpload } from "@/hooks/use-file-upload";
import {
  StrataSettingsSection,
  StrataSettingsRow,
  StrataSettingsSelect,
} from "./strata-settings-shared";
import type { useStrataSettingsModel } from "./strata-settings-model";
import { strataProfileDefaults } from "./strata-settings-model";

type ProfileModel = ReturnType<typeof useStrataSettingsModel>;

export function StrataSettingsProfile({ model }: { model: ProfileModel }) {
  const { profile, changeProfile } = model;
  const reader = useRef<FileReader | null>(null);
  const [photoError, setPhotoError] = useState("");
  const [photoReading, setPhotoReading] = useState(false);
  function stopReading() {
    const pending = reader.current;
    reader.current = null;
    pending?.abort();
    setPhotoReading(false);
  }
  const [uploadState, upload] = useFileUpload({
    accept: "image/png,image/jpeg,image/webp",
    maxSize: 4 * 1024 * 1024,
    onFilesAdded: ([file]) => {
      if (!(file?.file instanceof File)) return;
      stopReading();
      const next = new FileReader();
      reader.current = next;
      setPhotoReading(true);
      next.onload = () => {
        if (reader.current !== next || typeof next.result !== "string") return;
        reader.current = null;
        setPhotoReading(false);
        changeProfile("photo", next.result);
        setPhotoError("");
      };
      next.onerror = () => {
        if (reader.current !== next) return;
        reader.current = null;
        setPhotoReading(false);
        setPhotoError("This image could not be read. Choose another file.");
      };
      next.onabort = () => {
        if (reader.current !== next) return;
        reader.current = null;
        setPhotoReading(false);
      };
      next.readAsDataURL(file.file);
    },
  });
  const clearUploads = upload.clearFiles;
  useEffect(
    () => () => {
      const pending = reader.current;
      reader.current = null;
      pending?.abort();
      clearUploads();
    },
    [clearUploads],
  );
  const field = (key: "name" | "email" | "username" | "website" | "bio", label: string) => ({
    id: `strata-profile-${key}`,
    "aria-label": label,
    value: profile[key],
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      changeProfile(key, event.target.value),
  });
  function cancel() {
    stopReading();
    upload.clearFiles();
    setPhotoError("");
    model.discardProfile();
  }
  return (
    <form
      className="strata-settings-stack"
      onSubmit={(event) => {
        event.preventDefault();
        if (photoReading || reader.current?.readyState === FileReader.LOADING) return;
        model.saveProfile();
      }}
    >
      <StrataSettingsSection
        title="Profile"
        description="Public account details"
        footer={
          <div className="strata-profile-footer">
            <span role={model.profileError ? "alert" : "status"}>
              {model.profileError || model.profileNotice}
            </span>
            <div>
              <Button type="button" variant="outline" onClick={cancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={photoReading}>
                Save changes
              </Button>
            </div>
          </div>
        }
      >
        <StrataSettingsRow title="Photo" description="Shown on incidents, logs and mentions.">
          <div className="strata-profile-photo" aria-busy={photoReading}>
            <Avatar>
              <AvatarImage src={profile.photo} alt={profile.name} />
              <AvatarFallback>{profile.name.slice(0, 1) || "M"}</AvatarFallback>
            </Avatar>
            <Button type="button" variant="outline" onClick={upload.openFileDialog}>
              <Upload />
              Change
            </Button>
            <input {...upload.getInputProps({ "aria-label": "Upload profile image" })} hidden />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                stopReading();
                upload.clearFiles();
                changeProfile("photo", "");
              }}
            >
              <X />
              Remove
            </Button>
          </div>
          {photoReading && <p role="status">Reading image…</p>}
          {(photoError || uploadState.errors.length > 0) && (
            <p className="strata-settings-error" role="alert">
              {photoError || uploadState.errors.join(" ")}
            </p>
          )}
        </StrataSettingsRow>
        <StrataSettingsRow
          id="strata-profile-name"
          title="Full name"
          description="Used across the workspace."
        >
          <Input {...field("name", "Full name")} required maxLength={100} />
        </StrataSettingsRow>
        <StrataSettingsRow
          id="strata-profile-email"
          title="Email address"
          description="Primary sign-in email."
          badge={
            profile.email === strataProfileDefaults.email ? (
              <Badge size="sm" variant="success-light">
                Verified
              </Badge>
            ) : undefined
          }
        >
          <Input {...field("email", "Email address")} type="email" required maxLength={160} />
        </StrataSettingsRow>
        <StrataSettingsRow
          id="strata-profile-username"
          title="Username"
          description="Used to sign in and in mentions."
        >
          <InputGroup>
            <InputGroupAddon>@</InputGroupAddon>
            <InputGroupInput {...field("username", "Username")} required maxLength={40} />
          </InputGroup>
        </StrataSettingsRow>
        <StrataSettingsRow
          title="Profile details"
          description="Public details shared across the workspace."
        >
          <div className="strata-profile-details" role="group" aria-label="Profile details">
            <div>
              <label htmlFor="strata-profile-team">Team</label>
              <StrataSettingsSelect
                id="strata-profile-team"
                label="Team"
                value={profile.team}
                options={["Payments", "Platform", "Search", "Identity", "Edge"]}
                onChange={(value) => changeProfile("team", value)}
              />
            </div>
            <div>
              <label htmlFor="strata-profile-timeZone">Time zone</label>
              <StrataSettingsSelect
                id="strata-profile-timeZone"
                label="Time zone"
                value={profile.timeZone}
                options={[
                  "UTC-8 (Pacific Time)",
                  "UTC-5 (Eastern Time)",
                  "UTC+0 (London)",
                  "UTC+1 (Frankfurt)",
                  "UTC+9 (Tokyo)",
                ]}
                onChange={(value) => changeProfile("timeZone", value)}
              />
            </div>
            <div>
              <label htmlFor="strata-profile-website">Website</label>
              <InputGroup>
                <InputGroupAddon>https://</InputGroupAddon>
                <InputGroupInput {...field("website", "Website")} maxLength={200} />
              </InputGroup>
            </div>
          </div>
        </StrataSettingsRow>
        <StrataSettingsRow id="strata-profile-bio" title="Bio" description="Short profile summary.">
          <Textarea {...field("bio", "Bio")} rows={4} maxLength={1000} />
        </StrataSettingsRow>
      </StrataSettingsSection>
    </form>
  );
}
