import fleetLivingRoom from "./assets/fleet-living-room.png";
import { useState } from "react";
import { toast } from "./chrome";
import { ContentCards, Rail, Segments } from "./primitives";
export function FleetHeroShell() {
  const [section, setSection] = useState("Overview");
  const [rail, setRail] = useState("Fleet");
  const [request, setRequest] = useState(true);
  return (
    <div className="shell-reference shell-fleet-hero" data-shell-variant="22">
      <div
        className="shell-hero-scene"
        aria-hidden="true"
        style={{
          backgroundImage: `url(${fleetLivingRoom})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="shell-hero-pixels">
          {Array.from({ length: 28 }, (_, i) => (
            <span
              key={i}
              style={{
                left: `${(i * 37) % 100}%`,
                bottom: `${(i * 17) % 90}px`,
                width: 4 + (i % 3) * 4,
                height: 4 + (i % 3) * 4,
                opacity: 0.2 + (i % 4) * 0.15,
              }}
            />
          ))}
        </div>
      </div>
      <Rail glass active={rail} onChange={setRail} />
      <main className="shell-content-frame !bg-transparent">
        <div className="relative z-10 mx-auto mt-4 max-w-full px-2">
          <Segments
            label="Fleet sections"
            items={["Overview", "Missions", "Statistics", "Requests", "Maintenance"]}
            value={section}
            onChange={setSection}
          />
        </div>
        {request && (
          <div className="shell-access-request absolute right-5 top-5 z-20 w-64 rounded-xl bg-black/65 p-3 text-xs text-white shadow-lg backdrop-blur-lg">
            <strong>Access request</strong>
            <p className="mt-1 text-white/70">R1-06 wants to connect to the control room.</p>
            <div className="mt-2 flex gap-2">
              <button
                className="rounded border border-white/30 px-2 py-1"
                onClick={() => setRequest(false)}
              >
                Dismiss
              </button>
              <button
                className="rounded bg-emerald-500 px-2 py-1"
                onClick={() => {
                  setRequest(false);
                  toast.success("Access allowed");
                }}
              >
                Allow
              </button>
            </div>
          </div>
        )}
        <div className="mt-[280px] flex min-h-0 flex-1">
          <ContentCards />
        </div>
      </main>
    </div>
  );
}
