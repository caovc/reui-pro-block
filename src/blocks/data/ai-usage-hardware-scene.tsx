import { ReuiIsometricBar } from "./reui-free-chart-primitives";

/** Original Bricklane hardware diagrams. No reference SVG or paid assets.
 * Free c-chart-8 prism faces are actually composed for compute/memory blocks;
 * chassis, lid, fans, wires and addressable LEDs are independent domain geometry.
 */
const project = (x: number, y: number, z: number) => [
  350 + (x - y) * 0.82,
  295 + (x + y) * 0.4 - z,
];
const point = (x: number, y: number, z: number) => project(x, y, z).join(",");
function Box({
  x,
  y,
  z = 0,
  width,
  depth,
  height,
  fill = "var(--muted)",
  stroke = "var(--border)",
}: {
  x: number;
  y: number;
  z?: number;
  width: number;
  depth: number;
  height: number;
  fill?: string;
  stroke?: string;
}) {
  return (
    <g stroke={stroke} strokeWidth={1} strokeLinejoin="round">
      <polygon
        points={[
          point(x, y, z + height),
          point(x + width, y, z + height),
          point(x + width, y + depth, z + height),
          point(x, y + depth, z + height),
        ].join(" ")}
        fill={fill}
      />
      <polygon
        points={[
          point(x, y + depth, z),
          point(x + width, y + depth, z),
          point(x + width, y + depth, z + height),
          point(x, y + depth, z + height),
        ].join(" ")}
        fill="var(--background)"
      />
      <polygon
        points={[
          point(x + width, y, z),
          point(x + width, y + depth, z),
          point(x + width, y + depth, z + height),
          point(x + width, y, z + height),
        ].join(" ")}
        fill={fill}
      />
    </g>
  );
}
export default function HardwareScene({
  server = false,
  open = true,
  identify = false,
  selected = 0,
  loads,
  onSelect,
  onLid,
}: {
  server?: boolean;
  open?: boolean;
  identify?: boolean;
  selected?: number | number[];
  loads: number[];
  onSelect: (index: number) => void;
  onLid?: () => void;
}) {
  const isSelected = (index: number) =>
    Array.isArray(selected) ? selected.includes(index) : selected === index;
  const activate = (event: React.KeyboardEvent, action: () => void) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      action();
    }
  };
  return (
    <svg
      viewBox="0 0 700 480"
      role="group"
      aria-label={
        server
          ? "Bricklane GPU server cutaway"
          : `Bricklane edge inference box, lid ${open ? "open" : "closed"}`
      }
      className="h-[300px] w-full sm:h-[420px]"
    >
      <ellipse cx="350" cy="408" rx="220" ry="32" fill="var(--foreground)" opacity={0.04} />
      <Box x={-150} y={-85} width={300} depth={200} height={30} />
      {Array.from({ length: 18 }, (_, i) => (
        <path
          key={i}
          d={`M${point(-140 + i * 16, 115, 8)}L${point(-140 + i * 16, 115, 23)}`}
          stroke="var(--border)"
          strokeWidth={2}
        />
      ))}
      <Box
        x={-138}
        y={-73}
        z={30}
        width={276}
        depth={174}
        height={4}
        fill="color-mix(in oklab,var(--muted) 70%,var(--background))"
      />
      {server ? (
        <>
          <Box x={-140} y={-78} z={30} width={280} depth={7} height={150} />
          {[0, 1, 2, 3].map((index) => (
            <g
              key={index}
              role="button"
              tabIndex={0}
              aria-label={`GPU ${index}, ${Math.round(loads[index] ?? 0)} percent memory`}
              aria-pressed={isSelected(index)}
              onClick={() => onSelect(index)}
              onKeyDown={(event) => activate(event, () => onSelect(index))}
              style={{ cursor: "pointer" }}
            >
              <Box
                x={-112 + index * 66}
                y={-50}
                z={35}
                width={24}
                depth={125}
                height={105}
                fill={
                  isSelected(index)
                    ? "color-mix(in oklab,var(--foreground) 8%,var(--background))"
                    : "var(--background)"
                }
                stroke={isSelected(index) ? "var(--foreground)" : "var(--border)"}
              />
              {Array.from({ length: 12 }, (_, led) => (
                <path
                  key={led}
                  d={`M${point(-110 + index * 66, -44 + led * 9, 142)}L${point(-92 + index * 66, -44 + led * 9, 142)}`}
                  stroke={
                    led / 12 < (loads[index] ?? 0) / 100
                      ? loads[index] > 100
                        ? "var(--destructive)"
                        : "var(--foreground)"
                      : "var(--border)"
                  }
                  strokeWidth={4}
                />
              ))}
              <g
                transform={`translate(${project(-109 + index * 66, -10, 70).join(" ")}) scale(.5)`}
              >
                <ReuiIsometricBar
                  fill="var(--muted-foreground)"
                  x={0}
                  y={0}
                  width={18}
                  height={34}
                />
              </g>
            </g>
          ))}
          {[-105, -30, 45].map((x, index) => (
            <g key={x} transform={`translate(${project(x, 90, 55).join(" ")})`}>
              <circle r="23" fill="var(--background)" stroke="var(--border)" />
              <circle r="6" fill="var(--muted-foreground)" />
              {Array.from({ length: 8 }, (_, i) => (
                <path
                  key={i}
                  d="M4 5Q22 5 17 17Q9 22 4 5"
                  fill="var(--muted)"
                  stroke="var(--border)"
                  transform={`rotate(${i * 45})`}
                />
              ))}
              <text y="35" fontSize="10" textAnchor="middle" fill="var(--muted-foreground)">
                FAN {index + 1}
              </text>
            </g>
          ))}
        </>
      ) : (
        <>
          {open &&
            [0, 1, 2, 3, 4].map((index) => (
              <g
                key={index}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected(index)}
                aria-label={
                  ["Compute module", "Memory", "Storage", "Blower fan", "Power stage"][index]
                }
                onClick={() => onSelect(index)}
                onKeyDown={(event) => activate(event, () => onSelect(index))}
                style={{ cursor: "pointer" }}
              >
                <Box
                  x={-100 + (index % 3) * 75}
                  y={-40 + Math.floor(index / 3) * 85}
                  z={35}
                  width={55}
                  depth={45}
                  height={index === 3 ? 24 : 10}
                  fill={
                    isSelected(index)
                      ? "color-mix(in oklab,var(--foreground) 12%,var(--background))"
                      : "var(--background)"
                  }
                  stroke={isSelected(index) ? "var(--foreground)" : "var(--border)"}
                />
                <g
                  transform={`translate(${project(-90 + (index % 3) * 75, -20 + Math.floor(index / 3) * 85, 65).join(" ")}) scale(.6)`}
                >
                  <ReuiIsometricBar
                    fill="var(--muted-foreground)"
                    x={0}
                    y={0}
                    width={30}
                    height={18}
                  />
                </g>
              </g>
            ))}
          {open &&
            Array.from({ length: 16 }, (_, led) => (
              <path
                key={`memory-${led}`}
                d={`M${point(-14, -40 + led * 5, 48)}L${point(4, -40 + led * 5, 48)}`}
                stroke={led / 16 < (loads[1] ?? 0) / 100 ? "var(--success)" : "var(--border)"}
                strokeWidth={3}
              />
            ))}
          <g
            role="button"
            tabIndex={0}
            aria-label={open ? "Close lid" : "Open lid"}
            onClick={onLid}
            onKeyDown={(event) => activate(event, () => onLid?.())}
            className="transition-transform duration-500 motion-reduce:transition-none"
            style={{ transform: open ? "translateY(-125px)" : "translateY(0)", cursor: "pointer" }}
          >
            <Box x={-150} y={-85} z={65} width={300} depth={200} height={12} />
            {Array.from({ length: 23 }, (_, index) => (
              <Box
                key={index}
                x={-138 + index * 12}
                y={-78}
                z={77}
                width={3}
                depth={184}
                height={14}
              />
            ))}
          </g>
        </>
      )}
      {[0, 1, 2].map((index) => (
        <g key={index}>
          <Box x={-110 + index * 70} y={115} z={9} width={38} depth={4} height={12} />
          <path
            d={`M${point(-108 + index * 70, 120, 17)}L${point(-97 + index * 70, 120, 17)}`}
            stroke={identify ? "var(--warning)" : "var(--success)"}
            strokeWidth={3}
          />
        </g>
      ))}
      <text x="350" y="455" textAnchor="middle" fill="var(--muted-foreground)" fontSize="11">
        {server ? "BRICKLANE GPU / 4 × 48 GB" : "BRICKLANE EDGE / LOCAL INFERENCE"}
      </text>
    </svg>
  );
}
