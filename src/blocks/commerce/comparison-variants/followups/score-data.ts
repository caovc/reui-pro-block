import { productById, type ComparisonProductId } from "../data";

/** Fictional editorial scores, deliberately independent from the overall ranking. */
export const scoreDimensions = [
  { id: "sound", label: "Sound quality" },
  { id: "noise", label: "Noise cancellation" },
  { id: "comfort", label: "Comfort" },
  { id: "battery", label: "Battery" },
  { id: "value", label: "Value" },
] as const;
export type ScoreDimension = (typeof scoreDimensions)[number]["id"];

const scores: {
  id: ComparisonProductId;
  overall: number;
  dimensions: Record<ScoreDimension, number>;
}[] = [
  {
    id: "sora",
    overall: 8.1,
    dimensions: { sound: 8.2, noise: 7.8, comfort: 8.7, battery: 7.6, value: 9.6 },
  },
  {
    id: "field",
    overall: 8.9,
    dimensions: { sound: 9.1, noise: 9, comfort: 9.4, battery: 8.8, value: 9.4 },
  },
  {
    id: "studio",
    overall: 9.2,
    dimensions: { sound: 9.5, noise: 9.8, comfort: 8.6, battery: 9.3, value: 7.8 },
  },
  {
    id: "arc",
    overall: 8.6,
    dimensions: { sound: 8.7, noise: 8.9, comfort: 9.8, battery: 9.9, value: 8.8 },
  },
  {
    id: "pocket",
    overall: 7.4,
    dimensions: { sound: 7.4, noise: 5, comfort: 9.2, battery: 7.1, value: 9.8 },
  },
  {
    id: "reference",
    overall: 9.5,
    dimensions: { sound: 9.8, noise: 9.5, comfort: 8, battery: 8.5, value: 7.2 },
  },
];

export const bestDimensionScores = Object.fromEntries(
  scoreDimensions.map(({ id }) => [id, Math.max(...scores.map((score) => score.dimensions[id]))]),
) as Record<ScoreDimension, number>;

export const rankedProducts = [...scores]
  .sort((a, b) => b.overall - a.overall)
  .map((score, index) => ({
    ...score,
    product: productById[score.id],
    rank: index + 1,
    wins: scoreDimensions.filter(({ id }) => score.dimensions[id] === bestDimensionScores[id])
      .length,
  }));
