import * as Lucide from "lucide-react";
import type { LucideIcon, LucideProps } from "lucide-react";
/** Registry icon-library adapter, equivalent to shadcn's configured lucide substitution. */
export function IconPlaceholder({
  lucide,
  tabler,
  hugeicons,
  phosphor,
  remixicon,
  ...props
}: LucideProps & {
  lucide?: string;
  tabler?: string;
  hugeicons?: string;
  phosphor?: string;
  remixicon?: string;
}) {
  void tabler;
  void hugeicons;
  void phosphor;
  void remixicon;
  const library = Lucide as unknown as Record<string, LucideIcon>;
  const Icon =
    library[lucide ?? "SquareIcon"] ??
    library[(lucide ?? "SquareIcon").replace(/Icon$/, "")] ??
    Lucide.Square;
  return <Icon {...props} />;
}
