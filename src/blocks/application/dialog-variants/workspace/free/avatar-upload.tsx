// Actual official free REUI c-file-upload-2 avatar implementation. MIT (c) Keenthemes.
// https://reui.io/r/radix-nova/c-file-upload-2.json
// Adapters: compact settings row, accessible Change/Remove buttons, default-image removal callback.
// Actual official useFileUpload selection, drag/drop, type/size checks and local Blob preview retained.
"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useFileUpload, type FileWithPreview } from "@/hooks/use-file-upload";
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CircleAlertIcon, UserIcon } from "lucide-react";

interface AvatarUploadProps {
  label?: string;
  changeLabel?: ReactNode;
  removeLabel?: ReactNode;
  onDefaultRemove?: () => void;
  maxSize?: number;
  className?: string;
  onFileChange?: (file: FileWithPreview | null) => void;
  defaultAvatar?: string;
}

export function LocalAvatarUpload({
  label = "Upload profile avatar",
  changeLabel = "Change",
  removeLabel = "Remove",
  onDefaultRemove,
  maxSize = 2 * 1024 * 1024, // 2MB
  className,
  onFileChange,
  defaultAvatar,
}: AvatarUploadProps) {
  const [
    { files, isDragging, errors },
    {
      removeFile,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      getInputProps,
    },
  ] = useFileUpload({
    maxFiles: 1,
    maxSize,
    accept: "image/*",
    multiple: false,
  });

  const changeCallback = useRef(onFileChange);
  const notifiedFiles = useRef(files);
  useEffect(() => {
    changeCallback.current = onFileChange;
  }, [onFileChange]);
  useEffect(() => {
    if (notifiedFiles.current === files) return;
    notifiedFiles.current = files;
    changeCallback.current?.(files[0] ?? null);
  }, [files]);

  const currentFile = files[0];
  const previewUrl = currentFile?.preview || defaultAvatar;

  const handleRemove = () => {
    onDefaultRemove?.();
    if (currentFile) {
      removeFile(currentFile.id);
    }
  };

  return (
    <div className={cn("workspace-settings-avatar flex flex-wrap items-center gap-3", className)}>
      {/* Avatar Preview */}
      <div className="relative">
        <div
          className={cn(
            "group/avatar relative size-12 cursor-pointer overflow-hidden rounded-full border border-dashed transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/20",
            previewUrl && "border-solid",
          )}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          <input {...getInputProps({ "aria-label": label })} className="sr-only" />

          {previewUrl ? (
            <img src={previewUrl} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <UserIcon className="text-muted-foreground size-6" />
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" type="button" onClick={openFileDialog}>
          {changeLabel}
        </Button>
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={handleRemove}
          disabled={!previewUrl}
        >
          {removeLabel}
        </Button>
      </div>
      {/* Error Messages */}
      {errors.length > 0 && (
        <Alert variant="destructive" className="mt-5">
          <CircleAlertIcon />
          <AlertTitle>File upload error(s)</AlertTitle>
          <AlertDescription>
            {errors.map((error, index) => (
              <p key={index} className="last:mb-0">
                {error}
              </p>
            ))}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
