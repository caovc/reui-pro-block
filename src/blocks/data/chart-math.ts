export const polar = (cx: number, cy: number, r: number, angle: number): [number, number] => [
  cx + Math.cos(((angle - 90) * Math.PI) / 180) * r,
  cy + Math.sin(((angle - 90) * Math.PI) / 180) * r,
];
export function arcPath(cx: number, cy: number, r: number, start: number, end: number) {
  const a = polar(cx, cy, r, start),
    b = polar(cx, cy, r, end);
  return `M ${a[0]} ${a[1]} A ${r} ${r} 0 ${end - start > 180 ? 1 : 0} 1 ${b[0]} ${b[1]}`;
}
export function wedgePath(
  cx: number,
  cy: number,
  inner: number,
  outer: number,
  start: number,
  end: number,
) {
  const a = polar(cx, cy, outer, start),
    b = polar(cx, cy, outer, end),
    c = polar(cx, cy, inner, end),
    d = polar(cx, cy, inner, start);
  return `M ${a[0]} ${a[1]} A ${outer} ${outer} 0 ${end - start > 180 ? 1 : 0} 1 ${b[0]} ${b[1]} L ${c[0]} ${c[1]} A ${inner} ${inner} 0 ${end - start > 180 ? 1 : 0} 0 ${d[0]} ${d[1]} Z`;
}
export const money = (value: number) =>
  `$${value >= 1000000 ? (value / 1000000).toFixed(1).replace(/\.0$/, "") + "M" : value >= 1000 ? (value / 1000).toFixed(1).replace(/\.0$/, "") + "K" : value.toFixed(0)}`;
export const compact = (value: number) =>
  value >= 1000000
    ? (value / 1000000).toFixed(1) + "M"
    : value >= 1000
      ? (value / 1000).toFixed(1) + "K"
      : String(Math.round(value));
