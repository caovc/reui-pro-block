import { useId, useState } from "react";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import { Slider } from "@/components/ui/slider";
import { Toggle } from "@/components/ui/toggle";
import { Label } from "@/components/ui/label";
import { ShieldAlert } from "lucide-react";
import type { DeploymentRecord } from "./deploy-board-data";
import { canChangeTraffic, CANARY_STEPS, deployTime } from "./deploy-board-model";

function Dial({ percent, label }: { percent: number; label: string }) {
  return (
    <div className="deploy-machine-dial" aria-hidden="true">
      <svg viewBox="0 0 110 92" fill="none">
        <path d="M22 72a42 42 0 1 1 66 0" stroke="currentColor" strokeWidth="1" />
        <path d="M29 66a33 33 0 1 1 52 0" stroke="currentColor" strokeOpacity=".25" />
        {Array.from({ length: 9 }, (_, index) => (
          <path
            key={index}
            d="M55 7v5"
            stroke="currentColor"
            transform={`rotate(${index * 28 - 112} 55 45)`}
          />
        ))}
        <path
          d="M55 45V17"
          stroke="currentColor"
          strokeWidth="1.5"
          transform={`rotate(${Math.min(100, percent) * 2.24 - 112} 55 45)`}
        />
        <circle cx="55" cy="45" r="3" fill="currentColor" />
        <text x="55" y="81" textAnchor="middle" fill="currentColor" fontSize="9">
          {label}
        </text>
      </svg>
    </div>
  );
}

/**
 * Actual official free c-slider-5 controlled composition and c-slider-10 ticks.
 * MIT ReUI examples; preserve src/components/reui/REUI-LICENSE.txt.
 * Native Radix Slider owns pointer capture, touch and keyboard. The bench/dials
 * are independent decorative geometry, not a replacement input engine.
 */
export function CanaryLever({
  record,
  onTraffic,
  onRollback,
}: {
  record: DeploymentRecord;
  onTraffic: (value: number) => void;
  onRollback: () => void;
}) {
  const labelId = useId();
  const [armedFor, setArmedFor] = useState<string | null>(null);
  const locked = !canChangeTraffic(record);
  const armed = !locked && armedFor === record.id;
  const selected = Math.max(
    0,
    CANARY_STEPS.indexOf(record.target as (typeof CANARY_STEPS)[number]),
  );
  const percent = record.actual < 1 ? record.actual.toFixed(2) : record.actual.toFixed(1);
  return (
    <Frame spacing="sm">
      <FrameHeader>
        <FrameTitle>Canary Traffic</FrameTitle>
        <FrameDescription>Push to promote, arm to roll back</FrameDescription>
      </FrameHeader>
      <FramePanel className="deploy-machine-panel">
        <div className="deploy-machine" data-locked={locked || undefined}>
          <div className="deploy-machine-base" aria-hidden="true" />
          <div className="deploy-machine-gauges">
            <Dial percent={record.actual} label="TRAFFIC" />
            <Dial percent={(record.errorRate / record.errorLimit) * 100} label="ERROR" />
          </div>
          <div className="deploy-machine-rail">
            <Label id={labelId} className="sr-only">
              Canary traffic, {record.id} {record.service}
            </Label>
            <Slider
              aria-labelledby={labelId}
              aria-valuetext={`${record.target}% traffic`}
              value={[selected]}
              min={0}
              max={CANARY_STEPS.length - 1}
              step={1}
              disabled={locked}
              className="deploy-lever-slider"
              onValueChange={(values) => {
                const value = CANARY_STEPS[values[0] ?? selected];
                if (value === 0) {
                  if (armed) onRollback();
                  return;
                }
                onTraffic(value);
              }}
            />
            <div className="deploy-lever-ticks" aria-hidden="true">
              {CANARY_STEPS.map((value) => (
                <span key={value}>
                  <i />
                  {value}
                </span>
              ))}
            </div>
          </div>
        </div>
        <dl className="deploy-traffic-readouts">
          <div>
            <dt>Traffic</dt>
            <dd>
              {percent}% <span>Target {record.target}%</span>
            </dd>
          </div>
          <div>
            <dt>Error Rate</dt>
            <dd>
              {record.errorRate.toFixed(2)}% <span>Limit {record.errorLimit.toFixed(2)}%</span>
            </dd>
          </div>
        </dl>
        <div className="deploy-machine-actions">
          <Toggle
            variant="outline"
            size="sm"
            pressed={armed}
            disabled={locked}
            onPressedChange={(value) => setArmedFor(value ? record.id : null)}
            aria-label="Arm Rollback"
          >
            <ShieldAlert /> Arm Rollback
          </Toggle>
          {locked && (
            <span>
              {record.phase === "Rolled back"
                ? `Rolled back at ${deployTime(record.completedAt ?? record.changedAt)}`
                : `Locked: ${record.phase}`}
            </span>
          )}
        </div>
        <p className="sr-only">
          Drag the grip or press the arrow keys to step the canary. Arm rollback to go below 5
          percent.{locked ? ` Locked: ${record.phase}.` : ""}
        </p>
      </FramePanel>
    </Frame>
  );
}
