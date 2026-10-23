/** Independently authored compact chart fixtures. */
export const sparkTones = {
  green: "#35ad8d",
  teal: "#138e80",
  pink: "#e55e78",
  red: "#cf393e",
  amber: "#dda810",
  purple: "#8762e8",
  blue: "#5884e8",
  gray: "#92979e",
};

export function sparkSeries(seed: number, count = 28, rising = true) {
  return Array.from({ length: count }, (_, i) =>
    Math.round(
      36 +
        (rising ? i * 1.4 : 30 - i * 0.6) +
        Math.sin(i * 1.13 + seed) * 10 +
        Math.cos(i * 0.71 + seed) * 6,
    ),
  );
}
