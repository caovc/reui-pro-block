import { integrationArtwork, svgImage } from "@/lib/demo-artwork";

// Locally generated illustrative team marks; no vendor artwork or customer endorsement.
const teams = [
  { name: "Alpha", initial: "A", color: "#414141" },
  { name: "Bravo", initial: "B", color: "#484848" },
  { name: "Charlie", initial: "C", color: "#505050" },
  { name: "Delta", initial: "D", color: "#414141" },
  { name: "Echo", initial: "E", color: "#484848" },
  { name: "Foxtrot", initial: "F", color: "#505050" },
];

export function PricingBrandmarks() {
  return (
    <ul className="rp-brandmarks" aria-label="Illustrative team marks">
      {teams.map((team) => (
        <li key={team.name}>
          <img
            src={svgImage(integrationArtwork(team.initial, team.color))}
            alt={`Team ${team.name} original demo mark`}
            width={20}
            height={20}
          />
          <span>{team.name}</span>
        </li>
      ))}
    </ul>
  );
}
