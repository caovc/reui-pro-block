import miraPortrait from "./assets/flow-gantt/mira.jpg";
import novaPortrait from "./assets/flow-gantt/priya.jpg";
import theoPortrait from "./assets/flow-gantt/leo.jpg";
import leoPortrait from "./assets/flow-gantt/theo.jpg";
import alexPortrait from "./assets/flow-gantt/alex.jpg";
import priyaPortrait from "./assets/flow-gantt/sana.jpg";
import sanaPortrait from "./assets/flow-gantt/nora.jpg";
import sarahPortrait from "./assets/schedule-sarah-chen.jpg";
import sofiaPortrait from "./assets/flow-gantt/sofia.jpg";
const portraits: Record<string, string> = {
  IM: miraPortrait,
  TL: theoPortrait,
  HB: sanaPortrait,
  DC: leoPortrait,
  "Mira Stone": miraPortrait,
  "Nora Vale": sanaPortrait,
  "Theo Park": leoPortrait,
  "Leo Grant": theoPortrait,
  "Alex Johnson": alexPortrait,
  "Priya Patel": novaPortrait,
  "Sana Qureshi": priyaPortrait,
  "Sarah Chen": sarahPortrait,
  "Sofia Romero": sofiaPortrait,
};
export function MiniAvatar({ name, photo = true }: { name: string; photo?: boolean }) {
  if (photo && portraits[name])
    return (
      <span className="fg-avatar fg-person" title={name}>
        <img src={portraits[name]} alt={name} />
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
