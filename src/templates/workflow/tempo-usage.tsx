import { Frame, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame";
import { Progress } from "./free/flowly-progress";
import "./tempo-usage.css";

export function TempoUsage() {
  return (
    <Frame dense spacing="sm" className="tempo-usage">
      <FrameHeader>
        <FrameTitle role="heading" aria-level={2}>
          Usage Limit
        </FrameTitle>
      </FrameHeader>
      <FramePanel>
        <p className="tempo-usage-description">Your usage resets at the end of the month</p>
        <div className="tempo-usage-meter">
          <Progress value={82} aria-label="Usage Limit" className="tempo-usage-progress" />
        </div>
        <div className="tempo-usage-totals">
          <span>
            <span className="tempo-usage-value">82%</span> Used
          </span>{" "}
          <span>
            <span className="tempo-usage-value">18%</span> Free
          </span>
        </div>
      </FramePanel>
    </Frame>
  );
}
