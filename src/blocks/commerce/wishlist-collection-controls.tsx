/** Official free c-avatar-10 + c-avatar-4 cover stacks, c-alert-dialog-1
 * confirmation and REUI Frame surfaces. Sources: https://reui.io/r/radix-nova/
 * MIT, Keenthemes. Original example photographs are never used.
 */
import { useState, type ReactNode } from "react";
import { FolderHeart, Plus, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from "@/components/ui/avatar";
import { Frame, FramePanel } from "@/components/reui/frame";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { wishlistArtwork } from "./wishlist-artwork";
import type { WishlistCollection } from "./wishlist-data";
import { WishlistImage } from "./wishlist-common";

export function CollectionCover({ collection }: { collection: WishlistCollection }) {
  const cover = collection.products.slice(0, collection.coverCount ?? 4);
  return (
    <Frame variant="ghost" spacing="xs" className="overflow-hidden bg-transparent p-0">
      <FramePanel className="relative grid aspect-square grid-cols-2 grid-rows-2 gap-px border-0 bg-muted p-0 shadow-none">
        {cover.map((product) => (
          <WishlistImage key={product.id} product={product} className="size-full object-cover" />
        ))}
        {Array.from({ length: 4 - cover.length }, (_, i) => (
          <div key={i} className="flex items-center justify-center bg-muted">
            {!cover.length && i === 0 && (
              <FolderHeart className="size-8 text-muted-foreground/40" />
            )}
          </div>
        ))}
        {collection.products.length > cover.length && (
          <Badge className="absolute bottom-3 right-3" size="sm">
            +{collection.products.length - cover.length}
          </Badge>
        )}
      </FramePanel>
    </Frame>
  );
}

export function CollectionCoverStack({ collection }: { collection: WishlistCollection }) {
  return (
    <AvatarGroup className="-space-x-4" aria-label={`${collection.name} product covers`}>
      {collection.products.slice(0, 3).map((product) => (
        <Avatar key={product.id} className="size-12 rounded-lg after:rounded-lg">
          <AvatarImage
            src={wishlistArtwork(product.art, product.tone)}
            alt={product.name}
            className="rounded-lg"
          />
          <AvatarFallback className="rounded-lg">{product.name.slice(0, 2)}</AvatarFallback>
        </Avatar>
      ))}
      {!collection.products.length && (
        <Avatar className="size-12 rounded-lg after:rounded-lg">
          <AvatarFallback className="rounded-lg">
            <FolderHeart className="size-5" />
          </AvatarFallback>
        </Avatar>
      )}
    </AvatarGroup>
  );
}

export function NewWishlistCollection({
  onCreate,
  trigger,
}: {
  onCreate: (collection: WishlistCollection) => void;
  trigger?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [shared, setShared] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus />
            New Collection
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a collection</DialogTitle>
          <DialogDescription>
            Group your saved pieces in this local demo. Nothing is uploaded.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!name.trim()) return;
            onCreate({
              id: `collection-${crypto.randomUUID()}`,
              name: name.trim(),
              description: description.trim() || "A new collection for your next finds.",
              products: [],
              updated: "Updated just now",
              daysAgo: 0,
              shared,
            });
            setName("");
            setDescription("");
            setShared(false);
            setOpen(false);
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="wishlist-collection-name">Collection name</Label>
            <Input
              id="wishlist-collection-name"
              required
              maxLength={60}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Weekend plans"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wishlist-collection-description">Description</Label>
            <Textarea
              id="wishlist-collection-description"
              maxLength={180}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What belongs in this collection?"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={shared} onCheckedChange={(checked) => setShared(checked === true)} />
            Mark as shared
          </label>
          <p className="text-xs text-muted-foreground">
            The shared marker is local. Use the list download to share your current items.
          </p>
          <Button type="submit" className="w-full">
            Create collection
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteWishlistCollection({
  collection,
  onDelete,
}: {
  collection: WishlistCollection;
  onDelete: () => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="secondary"
          size="icon-sm"
          className="size-7 bg-background/85"
          aria-label={`Delete ${collection.name}`}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {collection.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            Remove this collection and its {collection.products.length} saved items from this demo.
            Your bag is unchanged.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onDelete}>
            Delete collection
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
