import { useMemo, useState } from "react";
import { ArrowLeft, Copy, FileText } from "lucide-react";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DriveSettingsCard } from "./drive-settings-components";
import {
  DriveChangeMemberRole,
  DriveMemberAvatar,
  DriveMemberStatusBadge,
} from "./drive-settings-team";
import { copyDriveMemberValue } from "./drive-settings-downloads";
import type { DriveSettingsModel } from "./drive-settings-model";
import type { DriveSettingsFile, DriveSettingsNavigation } from "./drive-settings-types";
function fileBytes(size: string) {
  const amount = parseFloat(size) || 0;
  return (
    amount *
    (size.includes("GB")
      ? 1024 ** 3
      : size.includes("MB")
        ? 1024 ** 2
        : size.includes("KB")
          ? 1024
          : 1)
  );
}
function relativeOrder(value: string) {
  if (value === "Today") return 0;
  if (value === "Yesterday") return 1;
  if (value === "Last week") return 7;
  if (value.includes("day")) return parseInt(value) || 0;
  if (value.includes("week")) return (parseInt(value) || 1) * 7;
  return 30;
}
export function DriveMemberDetail({
  model,
  memberSlug,
  files,
  navigation,
  onOpenFile,
}: {
  model: DriveSettingsModel;
  memberSlug: string;
  files: readonly DriveSettingsFile[];
  navigation: DriveSettingsNavigation;
  onOpenFile: (id: string) => void;
}) {
  const member = model.members.find((entry) => entry.id === memberSlug);
  const owned = useMemo(
    () =>
      member
        ? files
            .filter((file) => !file.deleted && file.owner === member.name && file.type !== "Folder")
            .sort((a, b) => relativeOrder(a.modified) - relativeOrder(b.modified))
        : [],
    [files, member],
  );
  const [roleTrigger, setRoleTrigger] = useState<HTMLElement | null>(null);
  const total = owned.reduce((sum, file) => sum + fileBytes(file.size), 0);
  const used = `${(total / 1024).toFixed(1)} KB`;
  const percent = (total / 1024 ** 3) * 100;
  const fraction = percent < 1 ? "<1%" : `${percent.toFixed(1)}%`;
  if (!member)
    return (
      <DriveSettingsCard
        title="Member unavailable"
        description="This member is not in the local workspace."
      >
        <Button asChild variant="outline">
          <a
            href={navigation.href("team")}
            onClick={(event) => {
              if (
                event.button === 0 &&
                !event.metaKey &&
                !event.ctrlKey &&
                !event.shiftKey &&
                !event.altKey
              ) {
                event.preventDefault();
                navigation.onNavigate("team");
              }
            }}
          >
            Back to team
          </a>
        </Button>
      </DriveSettingsCard>
    );
  return (
    <>
      <Button asChild variant="ghost" size="sm" className="ds-back-team">
        <a
          href={navigation.href("team")}
          onClick={(event) => {
            if (
              event.button === 0 &&
              !event.metaKey &&
              !event.ctrlKey &&
              !event.shiftKey &&
              !event.altKey
            ) {
              event.preventDefault();
              navigation.onNavigate("team");
            }
          }}
        >
          <ArrowLeft />
          Back to team
        </a>
      </Button>
      <DriveSettingsCard title={member.name} description={member.email} hideHeader>
        <div className="ds-member-detail-identity">
          <DriveMemberAvatar name={member.name} />
          <div>
            <strong>{member.name}</strong>
            {member.id === "alex-rivera" && (
              <Badge variant="outline" size="sm">
                You
              </Badge>
            )}
            <p>{member.email}</p>
          </div>
          <Badge variant="outline" size="sm">
            {member.access}
          </Badge>
          <DriveMemberStatusBadge status={member.status} />
        </div>
        <div className="ds-detail-actions">
          <Button
            size="sm"
            variant="outline"
            onClick={() => copyDriveMemberValue(member.email, "Email")}
          >
            <Copy />
            Copy email
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={(event) => setRoleTrigger(event.currentTarget)}
          >
            Change role
          </Button>
        </div>
        <dl className="ds-member-facts">
          {[
            ["Title", member.role],
            ["Department", member.department],
            ["Location", member.id === "alex-rivera" ? "Brooklyn, NY" : "—"],
            ["Joined", member.id === "alex-rivera" ? "Jan 2024" : "—"],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </DriveSettingsCard>
      <DriveSettingsCard
        title="Drive Usage"
        description="Measured from the files you own, not stored on the account."
      >
        <div className="ds-summary-grid ds-usage-grid">
          <section>
            <p className="ds-muted">Storage used</p>
            <strong>{used}</strong>
            <p>{fraction} of the 1.00 GB workspace plan.</p>
            <Badge variant="secondary">{fraction}</Badge>
          </section>
          <section>
            <p className="ds-muted">Files owned</p>
            <strong>{owned.length} files</strong>
            <p>Counted across every folder, including shared ones.</p>
          </section>
          <section>
            <p className="ds-muted">Last activity</p>
            <strong>{owned[0]?.modified ?? "No files"}</strong>
            <p>When the newest file they own was last modified.</p>
          </section>
        </div>
        <section className="ds-storage-share">
          <strong>Share of workspace storage</strong>
          <p>One plan across the workspace, not a quota per person.</p>
          <div>
            <span>{used}</span>
            <span>{fraction}</span>
          </div>
          <Progress value={Math.min(100, percent)} aria-label="Share of workspace storage" />
          <p>{used} of 1.00 GB used across the workspace.</p>
        </section>
      </DriveSettingsCard>
      <DriveSettingsCard title="Recent files" description="Your most recently modified files.">
        <div className="ds-recent-files">
          {owned.slice(0, 5).map((file) => (
            <Button
              key={file.id}
              variant="ghost"
              data-drive-file-open={file.id}
              onClick={() => onOpenFile(file.id)}
            >
              <FileText />
              <span>{file.name}</span>
              <span>{file.size}</span>
              <span>{file.modified}</span>
            </Button>
          ))}
          {owned.length === 0 && <p>No owned files in this workspace.</p>}
        </div>
      </DriveSettingsCard>
      {roleTrigger && (
        <DriveChangeMemberRole
          model={model}
          member={member}
          trigger={roleTrigger}
          onClose={() => setRoleTrigger(null)}
        />
      )}
    </>
  );
}
