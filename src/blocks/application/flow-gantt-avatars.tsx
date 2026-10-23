import { demoAvatar } from "@/lib/demo-artwork";

// Keep the observed initials fallback while using original, local art for demo people.
const portraitNames = new Set([
  "IM",
  "TL",
  "HB",
  "DC",
  "Mira Stone",
  "Nora Vale",
  "Theo Park",
  "Leo Grant",
  "Alex Johnson",
  "Priya Patel",
  "Sana Qureshi",
  "Sarah Chen",
  "Sofia Romero",
]);

export function MiniAvatar({ name, photo = true }: { name: string; photo?: boolean }) {
  if (photo && portraitNames.has(name))
    return (
      <span className="fg-avatar fg-person" title={name}>
        <img src={demoAvatar(name)} alt={name} />
      </span>
    );

  return (
    <span className="fg-avatar fg-person" title={name}>
      {name.length < 4
        ? name
        : name
            .split(" ")
            .map((w) => w[0])
            .slice(0, 2)
            .join("")}
    </span>
  );
}
