/** Original Bricklane mark: three offset bricks form an abstract B. */
export function BrandGlyph({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true" className={className}>
      <rect x="5" y="5" width="7" height="22" rx="1.5" />
      <rect x="16" y="5" width="11" height="9" rx="1.5" />
      <rect x="16" y="18" width="11" height="9" rx="1.5" />
    </svg>
  );
}

export function BrandMark({
  className = "",
  outlined = false,
}: {
  className?: string;
  outlined?: boolean;
}) {
  const ink = outlined ? "currentColor" : "var(--background, #ffffff)";
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <rect
        x="0.5"
        y="0.5"
        width="31"
        height="31"
        rx="8"
        fill={outlined ? "var(--background, #ffffff)" : "currentColor"}
        stroke={outlined ? "var(--border, #d4d4d4)" : "none"}
      />
      <rect x="6" y="6" width="6" height="20" rx="1.25" fill={ink} />
      <rect x="16" y="6" width="10" height="8" rx="1.25" fill="#d57755" />
      <rect x="16" y="18" width="10" height="8" rx="1.25" fill={ink} />
    </svg>
  );
}
