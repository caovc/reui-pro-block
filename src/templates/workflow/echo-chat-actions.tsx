import { useState } from "react";
import { Archive, CalendarClock, Ellipsis, Link, Pencil, Pin, PinOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SidebarMenuAction, useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FieldError, FieldLabel } from "@/components/ui/field";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import type { EchoChat, EchoChatHistory } from "./echo-chat-data";

export function EchoChatActions({
  chat,
  history,
  onRename,
  onSchedule,
  onArchive,
  onDelete,
}: {
  chat: EchoChat;
  history: EchoChatHistory;
  onRename: (id: string, title: string) => boolean;
  onSchedule: (chat: EchoChat) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { isMobile, setOpenMobile } = useSidebar();
  const [rename, setRename] = useState(false);
  const [name, setName] = useState(chat.title);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [copyError, setCopyError] = useState("");
  async function share() {
    const url = history.share(chat.id);
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Local share link copied");
    } catch {
      setShareUrl(url);
      setCopyError("Clipboard access is unavailable. You can select and copy the local link.");
    }
  }
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction showOnHover aria-label={`Actions for ${chat.title}`}>
            <Ellipsis />
          </SidebarMenuAction>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="reui-reference min-w-40">
          <DropdownMenuItem onSelect={() => history.update(chat.id, { pinned: !chat.pinned })}>
            {chat.pinned ? <PinOff /> : <Pin />}
            {chat.pinned ? "Unpin" : "Pin"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              setName(chat.title);
              setError("");
              setRename(true);
            }}
          >
            <Pencil />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => void share()}>
            <Link />
            Share link
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              onSchedule(chat);
              if (isMobile) setOpenMobile(false);
            }}
          >
            <CalendarClock />
            Schedule
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => {
              onArchive(chat.id);
              toast.success("Chat archived", {
                action: {
                  label: "Undo",
                  onClick: () => history.update(chat.id, { archived: false, pinned: chat.pinned }),
                },
              });
            }}
          >
            <Archive />
            Archive
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(true)}>
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={rename} onOpenChange={setRename}>
        <DialogContent className="reui-reference sm:max-w-96">
          <DialogHeader>
            <DialogTitle>Rename chat</DialogTitle>
            <DialogDescription>
              Give this conversation a name you will recognise later.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!onRename(chat.id, name)) {
                setError("Enter a unique, non-empty chat name.");
                return;
              }
              setRename(false);
            }}
          >
            <div className="space-y-2">
              <FieldLabel htmlFor={`echo-rename-${chat.id}`}>Name</FieldLabel>
              <Input
                id={`echo-rename-${chat.id}`}
                value={name}
                maxLength={200}
                onChange={(event) => setName(event.target.value)}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `echo-rename-${chat.id}-error` : undefined}
              />
              {error && <FieldError id={`echo-rename-${chat.id}-error`}>{error}</FieldError>}
            </div>
            <DialogFooter className="mt-5">
              <Button variant="outline" type="button" onClick={() => setRename(false)}>
                Cancel
              </Button>
              <Button type="submit">Rename</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(shareUrl)} onOpenChange={(open) => !open && setShareUrl("")}>
        <DialogContent className="reui-reference">
          <DialogHeader>
            <DialogTitle>Local share link</DialogTitle>
            <DialogDescription>
              This link opens a snapshot of this local conversation.
            </DialogDescription>
          </DialogHeader>
          <FieldLabel htmlFor={`echo-share-${chat.id}`}>Share link</FieldLabel>
          <Textarea
            id={`echo-share-${chat.id}`}
            value={shareUrl}
            readOnly
            onFocus={(event) => event.target.select()}
          />
          {copyError && (
            <p role="status" className="text-sm text-muted-foreground">
              {copyError}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" asChild>
              <a href={shareUrl} target="_blank" rel="noreferrer">
                Open shared chat
              </a>
            </Button>
            <Button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(shareUrl);
                  setCopyError("Link copied.");
                } catch {
                  setCopyError("Select and copy the local link above.");
                }
              }}
            >
              Copy link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleting} onOpenChange={setDeleting}>
        <AlertDialogContent className="reui-reference">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this chat?</AlertDialogTitle>
            <AlertDialogDescription>
              “{chat.title}” and its local messages will be removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => onDelete(chat.id)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
