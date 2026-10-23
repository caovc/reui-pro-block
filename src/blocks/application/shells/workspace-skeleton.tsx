import { Frame, FramePanel } from "@/components/reui/frame";
import { Skeleton } from "@/components/ui/skeleton";
import "./workspace-skeleton.css";

export default function WorkspaceSkeleton({ spacing = 16 }: { spacing?: 16 | 24 }) {
  return (
    <div
      className="shell-workspace-skeleton"
      data-spacing={spacing}
      aria-label="Workspace content placeholders"
      aria-hidden="true"
    >
      <div className="workspace-summary-grid">
        {[0, 1, 2, 3].map((i) => (
          <Frame variant="ghost" key={i} className="workspace-skeleton-card summary">
            <FramePanel>
              <Skeleton />
              <Skeleton />
              <Skeleton className="workspace-skeleton-body" />
            </FramePanel>
          </Frame>
        ))}
      </div>
      <div className="workspace-body-grid">
        {[0, 1, 2, 3].map((i) => (
          <Frame variant="ghost" key={i} className="workspace-skeleton-card">
            <FramePanel>
              <Skeleton />
              <Skeleton />
              <Skeleton className="workspace-skeleton-body" />
            </FramePanel>
          </Frame>
        ))}
      </div>
    </div>
  );
}
