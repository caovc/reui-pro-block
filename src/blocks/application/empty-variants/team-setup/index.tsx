import type { BlockProps } from "@/data/types";
import LaunchEmpty from "./launch";
import InviteEmpty from "./invite";
import SettingsEmpty from "./settings";
import BlueprintsEmpty from "./blueprints";
import "./team-setup.css";

export default function TeamSetupEmptyBlock({ block }: BlockProps) {
  switch (block.id) {
    case "empty-state-6":
      return <LaunchEmpty />;
    case "empty-state-7":
      return <InviteEmpty variant={7} />;
    case "empty-state-8":
      return <SettingsEmpty />;
    case "empty-state-9":
      return <InviteEmpty variant={9} />;
    case "empty-state-10":
      return <BlueprintsEmpty />;
    default:
      throw new Error(`Unsupported team setup empty state: ${block.id}`);
  }
}
