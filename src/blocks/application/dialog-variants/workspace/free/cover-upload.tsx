// Actual official free REUI c-file-upload-10. MIT (c) Keenthemes.
// https://reui.io/r/radix-nova/c-file-upload-10.json
// Adapters: original demo cover, optional guidelines, accessible actions, real local file callback.
// Upstream simulated upload/random failures removed: this preview performs no network upload.
"use client";

import { useState } from "react";
import { useFileUpload, type FileMetadata, type FileWithPreview } from "@/hooks/use-file-upload";
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CircleAlertIcon, CloudUploadIcon, ImageIcon, UploadIcon, XIcon } from "lucide-react";
import { demoPanel } from "@/lib/demo-artwork";

interface CoverUploadProps {
  showGuidelines?: boolean;
  maxSize?: number;
  accept?: string;
  className?: string;
  onImageChange?: (file: File | null) => void;
}

export function CoverUpload({
  showGuidelines = false,
  maxSize = 5 * 1024 * 1024, // 5MB default
  accept = "image/*",
  className,
  onImageChange,
}: CoverUploadProps) {
  // Default cover image
  const defaultCoverImage: FileMetadata = {
    id: "default-cover",
    name: "original-demo-cover.svg",
    size: 0,
    type: "image/svg+xml",
    url: demoPanel(3),
  };

  const [coverImage, setCoverImage] = useState<FileWithPreview | null>({
    id: defaultCoverImage.id,
    file: defaultCoverImage,
    preview: defaultCoverImage.url,
  });

  const [imageLoading, setImageLoading] = useState(true);

  const [
    { isDragging, errors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      getInputProps,
      clearFiles,
    },
  ] = useFileUpload({
    maxFiles: 1,
    maxSize,
    accept,
    multiple: false,
    onFilesChange: (files) => {
      if (files.length > 0) {
        setImageLoading(true);
        setCoverImage(files[0]);
        onImageChange?.(files[0].file as File);
      }
    },
  });

  const removeCoverImage = () => {
    clearFiles();
    setCoverImage(null);
    setImageLoading(false);
    onImageChange?.(null);
  };

  const hasImage = coverImage && coverImage.preview;

  return (
    <div className={cn("flex w-full flex-col gap-4", className)}>
      {/* Cover Upload Area */}
      <div
        className={cn(
          "group border-border rounded-xl relative overflow-hidden border transition-all duration-200",
          isDragging
            ? "border-primary bg-primary/5 border-dashed"
            : hasImage
              ? "border-border bg-background hover:border-primary/50"
              : "border-muted-foreground/25 bg-muted/30 hover:border-primary hover:bg-primary/5 border-dashed",
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Hidden file input */}
        <input
          {...getInputProps({ "aria-label": "Upload project cover image" })}
          className="sr-only"
        />

        {hasImage ? (
          <>
            {/* Cover Image Display */}
            <div className="relative aspect-21/9 w-full">
              {/* Loading placeholder */}
              {imageLoading && (
                <div className="bg-muted absolute inset-0 flex animate-pulse items-center justify-center">
                  <div className="text-muted-foreground flex flex-col items-center gap-2">
                    <ImageIcon className="size-5" />
                    <span className="text-sm">Loading image...</span>
                  </div>
                </div>
              )}

              {/* Actual image */}
              <img
                src={coverImage.preview}
                alt="Cover"
                className={cn(
                  "h-full w-full object-cover transition-opacity duration-300",
                  imageLoading ? "opacity-0" : "opacity-100",
                )}
                onLoad={() => setImageLoading(false)}
                onError={() => setImageLoading(false)}
              />

              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/0 transition-all duration-200 group-hover:bg-black/40" />

              {/* Action buttons overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-100 transition-opacity duration-200 sm:opacity-0 sm:group-hover:opacity-100 group-focus-within:opacity-100">
                <div className="flex gap-2">
                  <Button onClick={openFileDialog} size="sm" variant="outline">
                    <UploadIcon />
                    Change Cover
                  </Button>
                  <Button onClick={removeCoverImage} size="sm">
                    <XIcon />
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div
            className="flex aspect-21/9 w-full cursor-pointer flex-col items-center justify-center gap-4 p-8 text-center"
            onClick={openFileDialog}
          >
            <div className="bg-primary/10 rounded-full p-4">
              <CloudUploadIcon className="text-primary size-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Upload Cover Image</h3>
              <p className="text-muted-foreground text-sm">
                Drag and drop an image here, or click to browse
              </p>
              <p className="text-muted-foreground text-xs">
                Recommended size: 1200x514px • Max size: 5MB
              </p>
            </div>

            <Button variant="outline" size="sm">
              <ImageIcon />
              Browse Files
            </Button>
          </div>
        )}
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

      {/* Upload Tips */}
      {showGuidelines && (
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="mb-2 text-sm font-medium">Cover Image Guidelines</h4>
          <ul className="text-muted-foreground space-y-1 text-xs">
            <li>• Use high-quality images with good lighting and composition</li>
            <li>• Recommended aspect ratio: 21:9 (ultrawide) for best results</li>
            <li>• Avoid images with important content near the edges</li>
            <li>• Supported formats: JPG, PNG, WebP</li>
          </ul>
        </div>
      )}
    </div>
  );
}
