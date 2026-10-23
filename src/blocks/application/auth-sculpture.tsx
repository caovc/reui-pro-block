import { useId } from "react";

/** Original vector study, independently drawn from geometric ribbons. */
export function AuthSculpture({ cyan = false, index = 0 }: { cyan?: boolean; index?: number }) {
  const id = useId();
  return (
    <svg
      viewBox="0 0 452 590"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={cyan ? "Original cyan ribbon study" : `Original glass ribbon study ${index + 1}`}
    >
      <defs>
        <linearGradient id={`${id}-background`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor={cyan ? "#06191b" : "#edf3f7"} />
          <stop offset="1" stopColor={cyan ? "#000405" : "#c4d9e9"} />
        </linearGradient>
        <linearGradient id={`${id}-ribbon`} x1="0" y1="0" x2="1" y2=".7">
          <stop stopColor={cyan ? "#21ffff" : "#ffffff"} stopOpacity=".1" />
          <stop offset=".45" stopColor={cyan ? "#08b6ca" : "#a7c9e3"} stopOpacity=".35" />
          <stop offset=".82" stopColor={cyan ? "#65ffff" : "#ffffff"} stopOpacity=".95" />
          <stop offset="1" stopColor={cyan ? "#02c8de" : "#8eb2d2"} stopOpacity=".2" />
        </linearGradient>
        <radialGradient id={`${id}-light`}>
          <stop stopColor={cyan ? "#00c9db" : "#fff"} stopOpacity=".35" />
          <stop offset="1" stopColor={cyan ? "#041316" : "#dae6ef"} stopOpacity="0" />
        </radialGradient>
      </defs>
      <path fill={`url(#${id}-background)`} d="M0 0h452v590H0z" />
      <circle cx="120" cy="310" r="330" fill={`url(#${id}-light)`} />
      <g transform={`translate(226 295) rotate(${-25 + index * 24}) translate(-226 -295)`}>
        {[0, 1, 2, 3, 4].map((ribbon) => (
          <g key={ribbon} transform={`translate(${ribbon * 24 - 50} ${ribbon * 8})`}>
            <path
              d="M20-90C420 20 445 200 190 295S-30 540 400 700L500 600C45 430 150 405 333 302S480 18 145-110Z"
              fill={`url(#${id}-ribbon)`}
              stroke={cyan ? "#45e8ef" : "#ffffff"}
              strokeOpacity=".3"
              strokeWidth="1"
            />
            <path
              d="M20-90C420 20 445 200 190 295S-30 540 400 700"
              fill="none"
              stroke={cyan ? "#afffff" : "#ffffff"}
              strokeOpacity=".6"
              strokeWidth="1.3"
            />
          </g>
        ))}
      </g>
    </svg>
  );
}
