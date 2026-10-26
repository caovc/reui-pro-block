// Actual official free c-slider-5 controlled-value composition, plus REUI NumberField.
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Frame, FrameHeader, FrameTitle, FramePanel } from "@/components/reui/frame";
import { FleetNumber, FleetSelect } from "./fleet-fields";
import { useFleet } from "./fleet-context";
import type { FleetVehicle, VehicleControls as Controls } from "./fleet-types";

export function VehicleControls({ vehicle }: { vehicle: FleetVehicle }) {
  const { act } = useFleet();
  const [draft, setDraft] = useState<Controls>({ ...vehicle.controls });
  const dirty = JSON.stringify(draft) !== JSON.stringify(vehicle.controls);
  const disabled = vehicle.status === "Retired";
  const set = <K extends keyof Controls>(key: K, value: Controls[K]) =>
    setDraft((old) => ({ ...old, [key]: value }));
  return (
    <form
      className="dm-controls"
      onSubmit={(event) => {
        event.preventDefault();
        act({ type: "controls", vehicleId: vehicle.id, controls: draft });
      }}
    >
      <Frame spacing="sm">
        <FrameHeader>
          <FrameTitle>Driving</FrameTitle>
        </FrameHeader>
        <FramePanel className="space-y-5">
          <FleetSelect
            label="Drive mode"
            value={draft.mode}
            options={["Eco", "Standard", "Power"].map((value) => ({ value, label: value }))}
            onChange={(value) => set("mode", value as Controls["mode"])}
          />
          <p className="text-xs text-muted-foreground">
            {draft.mode === "Eco"
              ? "Gentler acceleration prioritizes range on this simulated route."
              : draft.mode === "Power"
                ? "Responsive acceleration uses more of the available range."
                : "Balanced performance for everyday deliveries."}
          </p>
          <Field>
            <div className="flex justify-between">
              <FieldLabel htmlFor="dm-speed-limit">Speed limit</FieldLabel>
              <span className="text-xs tabular-nums">{draft.speedLimit} mph</span>
            </div>
            <Slider
              id="dm-speed-limit"
              aria-label="Speed limit"
              value={[draft.speedLimit]}
              min={45}
              max={75}
              step={5}
              disabled={disabled}
              onValueChange={(value) => set("speedLimit", value[0])}
            />
          </Field>
          <FleetNumber
            label="Minimum reserve (%)"
            value={draft.reserve}
            min={5}
            max={40}
            onChange={(value) => set("reserve", value)}
          />
        </FramePanel>
      </Frame>
      {(vehicle.kind === "electric" || vehicle.coldBox) && (
        <Frame spacing="sm">
          <FrameHeader>
            <FrameTitle>{vehicle.coldBox ? "Cargo & charging" : "Charging"}</FrameTitle>
          </FrameHeader>
          <FramePanel className="space-y-4">
            {vehicle.coldBox && (
              <FleetNumber
                label="Cargo target (°F)"
                value={draft.targetTemperature}
                min={33}
                max={41}
                onChange={(value) => set("targetTemperature", value)}
              />
            )}
            {vehicle.kind === "electric" && (
              <FleetNumber
                label="Charge limit (%)"
                value={draft.chargeLimit}
                min={60}
                max={100}
                onChange={(value) => set("chargeLimit", value)}
              />
            )}
          </FramePanel>
        </Frame>
      )}
      <Frame spacing="sm">
        <FrameHeader>
          <FrameTitle>Safety & efficiency</FrameTitle>
        </FrameHeader>
        <FramePanel className="space-y-4">
          {(
            [
              ["idleShutdown", "Idle shutdown", "Stop the engine during prolonged idle periods."],
              [
                "geofenceAlerts",
                "Geofence alerts",
                "Flag departures from the local Seattle service area.",
              ],
              [
                "driverCoaching",
                "Driver coaching",
                "Record gentle acceleration and braking reminders.",
              ],
            ] as const
          ).map(([key, label, description]) => (
            <Field key={key} orientation="horizontal">
              <div className="flex-1">
                <FieldLabel htmlFor={`dm-${key}`}>{label}</FieldLabel>
                <FieldDescription>{description}</FieldDescription>
              </div>
              <Switch
                id={`dm-${key}`}
                checked={draft[key]}
                disabled={disabled}
                onCheckedChange={(value) => set(key, value)}
              />
            </Field>
          ))}
        </FramePanel>
      </Frame>
      <p className="text-xs text-muted-foreground">
        Local simulation controls. No settings are sent to a real vehicle.
      </p>
      <div className="dm-form-footer">
        <Button
          type="button"
          variant="outline"
          disabled={!dirty || disabled}
          onClick={() => setDraft({ ...vehicle.controls })}
        >
          Reset
        </Button>
        <Button type="submit" disabled={!dirty || disabled}>
          Save changes
        </Button>
      </div>
    </form>
  );
}
