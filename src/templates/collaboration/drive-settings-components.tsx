// ReUI free compositions: Copyright (c) 2025 Keenthemes Inc, MIT.
// Full notice: src/components/reui/REUI-LICENSE.txt.
import {
  Children,
  Fragment,
  isValidElement,
  type ComponentProps,
  type ReactNode,
  useState,
} from "react";
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import { Button } from "@/components/ui/button";
import { FieldGroup, FieldSeparator } from "@/components/ui/field";
import {
  SettingsFields,
  SettingsRow,
} from "@/blocks/application/dialog-variants/workspace/settings-panel";
import { Upload, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LocalAvatarUpload } from "@/blocks/application/dialog-variants/workspace/free/avatar-upload";
import { demoAvatar } from "@/lib/demo-artwork";
import bricklaneLogo from "./drive-settings-free/bricklane-logo.svg";

/** Preserve the actual Pro fields while composing the official zero-gap rows. */
function DriveSettingsRows({ children }: { children: ReactNode }) {
  const rows = Children.toArray(children).flatMap<ReactNode>((child) => {
    if (
      isValidElement<ComponentProps<typeof SettingsFields>>(child) &&
      child.type === SettingsFields
    ) {
      return child.props.fields.map((field) => (
        <SettingsFields
          {...child.props}
          fields={[field]}
          key={`${child.key ?? "fields"}-${field.id}`}
        />
      ));
    }
    return [child];
  });
  const fieldsOnly =
    rows.length > 0 &&
    rows.every(
      (child) =>
        isValidElement(child) && (child.type === SettingsRow || child.type === SettingsFields),
    );
  if (!fieldsOnly) return <>{children}</>;
  return (
    <FieldGroup className="gap-0">
      {rows.map((row, index) => (
        <Fragment key={isValidElement(row) ? (row.key ?? index) : index}>
          {index > 0 && <FieldSeparator />}
          {row}
        </Fragment>
      ))}
    </FieldGroup>
  );
}

export function DriveSettingsCard({
  title,
  description,
  children,
  footer,
  action,
  hideHeader = false,
  className = "",
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  action?: ReactNode;
  hideHeader?: boolean;
  className?: string;
}) {
  return (
    <Frame dense className={`ds-card ${className}`}>
      {!hideHeader && (
        <FrameHeader>
          <div className="ds-card-heading">
            <FrameTitle>{title}</FrameTitle>
            <FrameDescription>{description}</FrameDescription>
          </div>
          {action}
        </FrameHeader>
      )}
      <FramePanel fit className="ds-card-content">
        <DriveSettingsRows>{children}</DriveSettingsRows>
      </FramePanel>
      {footer && <FrameFooter>{footer}</FrameFooter>}
    </Frame>
  );
}
export function DriveCardActions({
  onCancel,
  onSave,
  disabled,
}: {
  onCancel?: () => void;
  onSave: () => void;
  disabled?: boolean;
}) {
  return (
    <>
      {onCancel && (
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      )}
      <Button disabled={disabled} onClick={onSave}>
        Save changes
      </Button>
    </>
  );
}
export function DriveLocalUpload({ logo = false }: { logo?: boolean }) {
  const [removed, setRemoved] = useState(false);
  return (
    <div className={logo ? "ds-upload ds-upload-logo" : "ds-upload"}>
      <LocalAvatarUpload
        label={logo ? "Upload workspace logo" : "Upload profile photo"}
        changeLabel={
          <>
            <Upload aria-hidden="true" />
            Change
          </>
        }
        removeLabel={
          <>
            <X aria-hidden="true" />
            Remove
          </>
        }
        defaultAvatar={!removed ? (logo ? bricklaneLogo : demoAvatar("Alex Rivera")) : undefined}
        onDefaultRemove={() => setRemoved(true)}
        onFileChange={(file) => {
          if (file) setRemoved(true);
        }}
      />
    </div>
  );
}
export function DriveSettingsDialog({
  title,
  description,
  onClose,
  children,
  footer,
  returnFocus,
}: {
  title: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  returnFocus?: HTMLElement | null;
}) {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="reui-reference ds-dialog"
        onCloseAutoFocus={(event) => {
          const label = returnFocus?.getAttribute("aria-label");
          const target = returnFocus?.isConnected
            ? returnFocus
            : label
              ? Array.from(document.querySelectorAll<HTMLElement>("button[aria-label]")).find(
                  (button) => button.getAttribute("aria-label") === label,
                )
              : undefined;
          if (target) {
            event.preventDefault();
            target.focus({ preventScroll: true });
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="ds-dialog-body">{children}</div>
        <DialogFooter>
          {footer ?? (
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
