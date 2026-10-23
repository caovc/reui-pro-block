import { Frame, FrameFooter, FramePanel } from "@/components/reui/frame";

/** Product-specific geometry built from the actual free ReUI Frame composition. */
export default function ConsoleCanvas({ variant }: { variant: number }) {
  const columns = variant === 24 || variant === 28 ? 4 : 3;
  const blank = [28, 29].includes(variant);
  const basic = variant === 23 || variant === 24;
  const bodies = variant === 24 ? 4 : variant === 23 || variant === 28 ? 6 : 9;
  return (
    <div
      className={`shell-console-content console-content-${variant}`}
      aria-label="Workspace content placeholders"
    >
      <div
        className="console-summary-grid"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: columns }, (_, i) => (
          <Frame
            key={i}
            dense
            className={`console-summary ${blank ? "blank" : basic ? "basic" : "stats"}`}
          >
            <FramePanel className="console-summary-panel">
              {basic ? (
                <>
                  <span className="console-line" />
                  <span className="console-line" />
                  <span className="console-body-block" />
                </>
              ) : (
                !blank && (
                  <>
                    <div className="flex items-center gap-3">
                      <span className="size-7 rounded-lg bg-muted" />
                      <span className="console-line w-1/3" />
                      <span className="ml-auto size-7 rounded-lg bg-muted" />
                    </div>
                    <div className="mt-auto flex gap-2">
                      <span className="console-line w-1/5" />
                      <span className="console-line w-1/2" />
                    </div>
                  </>
                )
              )}
            </FramePanel>
            {!basic && (
              <FrameFooter className="console-summary-footer">
                {!blank && (
                  <>
                    <div className="flex -space-x-2">
                      {[0, 1, 2, 3].map((n) => (
                        <span
                          key={n}
                          className="size-6 rounded-full border border-background bg-muted"
                        />
                      ))}
                    </div>
                    <span className="console-line ml-auto w-1/3" />
                  </>
                )}
              </FrameFooter>
            )}
          </Frame>
        ))}
      </div>
      <div
        className="console-body-grid"
        style={{ gridTemplateColumns: `repeat(${variant === 24 ? 2 : columns}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: bodies }, (_, i) => (
          <Frame
            key={i}
            dense
            className="console-body-card"
            style={variant === 28 && i >= 4 ? { gridColumn: "span 2" } : undefined}
          >
            <FramePanel className="console-body-panel">
              <span className="console-line" />
              <span className="console-line" />
              <span className="console-body-block" />
            </FramePanel>
          </Frame>
        ))}
      </div>
    </div>
  );
}
