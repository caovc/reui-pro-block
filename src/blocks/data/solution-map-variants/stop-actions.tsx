import { createContext, useContext, useState, type ReactNode } from "react";
import { MapPin, Snowflake } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { FleetNumber, FleetSelect } from "./fleet-fields";
import { parseSeattleInput, seattleDateInput } from "./fleet-time";
import { MAP_CENTER } from "./fleet-data";
import { openStops, rankedCandidates, routeMetrics } from "./fleet-model";
import { useFleet, type DispatchDialog } from "./fleet-context";
import type { Coordinate, DeliveryStop, FleetVehicle } from "./fleet-types";

const ActionFocusContext = createContext<((event: Event) => void) | undefined>(undefined);

function ActionFrame({
  title,
  description,
  children,
  submit,
  disabled,
  onClose,
  onSubmit,
}: {
  title: string;
  description: string;
  children: ReactNode;
  submit: string;
  disabled?: boolean;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const onCloseAutoFocus = useContext(ActionFocusContext);
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="reui-reference dm-action-dialog"
        data-dm-focus-layer="action"
        onCloseAutoFocus={onCloseAutoFocus}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <DialogHeader>
            <DialogTitle tabIndex={-1} data-dm-focus-fallback>
              {title}
            </DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="dm-action-fields">{children}</div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={disabled}>
              {submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeliveryWindow({
  start,
  end,
  setStart,
  setEnd,
}: {
  start: string;
  end: string;
  setStart: (value: string) => void;
  setEnd: (value: string) => void;
}) {
  return (
    <div className="dm-form-grid">
      <Field>
        <FieldLabel htmlFor="dm-window-start">Window start</FieldLabel>
        <Input
          required
          id="dm-window-start"
          type="datetime-local"
          value={start}
          onChange={(event) => setStart(event.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="dm-window-end">Window end</FieldLabel>
        <Input
          required
          id="dm-window-end"
          type="datetime-local"
          value={end}
          onChange={(event) => setEnd(event.target.value)}
        />
      </Field>
      <p className="col-span-full text-xs text-muted-foreground">
        Seattle service day · Pacific daylight time (UTC−7)
      </p>
    </div>
  );
}

function ReassignDelivery({ stop, onClose }: { stop: DeliveryStop; onClose: () => void }) {
  const { state, act } = useFleet();
  const candidates = rankedCandidates(state, stop.id);
  const [target, setTarget] = useState(
    () => candidates.find((item) => item.eligible)?.vehicle.id ?? "",
  );
  const chosen = candidates.find((item) => item.vehicle.id === target);
  return (
    <ActionFrame
      title="Reassign delivery"
      description={`${stop.customer} · currently ${stop.vehicleId}. Ranked by route time, with capacity, range and cold-chain checks.`}
      submit="Reassign delivery"
      disabled={!chosen?.eligible}
      onClose={onClose}
      onSubmit={() => {
        if (act({ type: "reassign", stopId: stop.id, vehicleId: target })) onClose();
      }}
    >
      <RadioGroup
        value={target}
        onValueChange={setTarget}
        aria-label="Candidate vehicles"
        className="dm-candidates"
      >
        {candidates.map((candidate) => (
          <label
            key={candidate.vehicle.id}
            className="dm-candidate"
            data-disabled={!candidate.eligible}
          >
            <RadioGroupItem
              value={candidate.vehicle.id}
              disabled={!candidate.eligible}
              aria-describedby={`dm-eligibility-${candidate.vehicle.id}`}
            />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <strong>{candidate.vehicle.id}</strong>
                <span className="text-xs text-muted-foreground">{candidate.vehicle.driver}</span>
                {candidate.vehicle.coldBox && <Snowflake className="size-3 text-info" />}
              </span>
              <small id={`dm-eligibility-${candidate.vehicle.id}`}>
                {candidate.eligible
                  ? `${candidate.minutes.toFixed(0)} min route · ${candidate.miles.toFixed(1)} mi away`
                  : candidate.reason}
              </small>
            </span>
            <Badge size="sm" variant={candidate.eligible ? "success-light" : "outline"}>
              {candidate.eligible ? "Eligible" : "Unavailable"}
            </Badge>
          </label>
        ))}
      </RadioGroup>
      {!candidates.some((item) => item.eligible) && (
        <Alert variant="warning">
          <AlertTitle>No eligible vehicle</AlertTitle>
          <AlertDescription>
            Update the window, cargo requirements or available capacity before reassigning.
          </AlertDescription>
        </Alert>
      )}
    </ActionFrame>
  );
}

function RescheduleDelivery({ stop, onClose }: { stop: DeliveryStop; onClose: () => void }) {
  const { act } = useFleet();
  const [start, setStart] = useState(seattleDateInput(stop.windowStart));
  const [end, setEnd] = useState(seattleDateInput(stop.windowEnd));
  return (
    <ActionFrame
      title="Reschedule delivery"
      description={`${stop.customer} · ${stop.vehicleId}`}
      submit="Save window"
      onClose={onClose}
      onSubmit={() => {
        if (
          act({
            type: "reschedule",
            stopId: stop.id,
            windowStart: parseSeattleInput(start),
            windowEnd: parseSeattleInput(end),
          })
        )
          onClose();
      }}
    >
      <DeliveryWindow start={start} end={end} setStart={setStart} setEnd={setEnd} />
    </ActionFrame>
  );
}

function CreateDelivery({
  onClose,
  placing,
  onPickMap,
  pickedPosition,
}: {
  onClose: () => void;
  placing: boolean;
  onPickMap: () => void;
  pickedPosition: Coordinate | null;
}) {
  const onCloseAutoFocus = useContext(ActionFocusContext);
  const { state, act } = useFleet();
  const vehicles = Object.values(state.vehicles).filter(
    (vehicle) => !["Retired", "Breakdown", "Maintenance", "Charging"].includes(vehicle.status),
  );
  const [vehicleId, setVehicleId] = useState(
    state.selectedVehicleId && vehicles.some((item) => item.id === state.selectedVehicleId)
      ? state.selectedVehicleId
      : (vehicles[0]?.id ?? ""),
  );
  const [customer, setCustomer] = useState("");
  const [address, setAddress] = useState("");
  const [merchant, setMerchant] = useState("");
  const [note, setNote] = useState("");
  const [parcels, setParcels] = useState(1);
  const [cold, setCold] = useState(false);
  const [start, setStart] = useState(seattleDateInput(state.now));
  const [end, setEnd] = useState(seattleDateInput(state.now + 2 * 3600_000));
  const [manualPosition, setManualPosition] = useState({
    point: pickedPosition ?? MAP_CENTER,
    fromMap: pickedPosition,
  });
  const position =
    manualPosition.fromMap === pickedPosition
      ? manualPosition.point
      : (pickedPosition ?? MAP_CENTER);
  const setPosition = (point: Coordinate) => setManualPosition({ point, fromMap: pickedPosition });
  return (
    <Dialog
      open={!placing}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="reui-reference dm-action-dialog"
        data-dm-focus-layer="action"
        onCloseAutoFocus={onCloseAutoFocus}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (
              act({
                type: "create-stop",
                stop: {
                  vehicleId,
                  customer,
                  address,
                  merchant,
                  note,
                  parcels,
                  cold,
                  position,
                  windowStart: parseSeattleInput(start),
                  windowEnd: parseSeattleInput(end),
                  serviceMinutes: 4,
                },
              })
            )
              onClose();
          }}
        >
          <DialogHeader>
            <DialogTitle>New delivery</DialogTitle>
            <DialogDescription>
              Add a local delivery to an available Seattle van. This demo does not geocode
              addresses.
            </DialogDescription>
          </DialogHeader>
          <div className="dm-action-fields">
            <Field>
              <FieldLabel htmlFor="dm-customer">Customer</FieldLabel>
              <Input
                id="dm-customer"
                required
                value={customer}
                onChange={(event) => setCustomer(event.target.value)}
                placeholder="Customer name"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="dm-address">Address</FieldLabel>
              <Input
                id="dm-address"
                required
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="Street address, Seattle"
              />
            </Field>
            <FleetSelect
              label="Assign vehicle"
              value={vehicleId}
              onChange={setVehicleId}
              options={vehicles.map((vehicle) => ({
                value: vehicle.id,
                label: `${vehicle.id} · ${vehicle.driver}`,
              }))}
            />
            <div className="dm-form-grid">
              <FleetNumber label="Parcels" value={parcels} min={1} max={20} onChange={setParcels} />
              <Field>
                <FieldLabel htmlFor="dm-merchant">Merchant (optional)</FieldLabel>
                <Input
                  id="dm-merchant"
                  value={merchant}
                  onChange={(event) => setMerchant(event.target.value)}
                />
              </Field>
            </div>
            <Field orientation="horizontal">
              <Checkbox
                id="dm-cold"
                checked={cold}
                onCheckedChange={(next) => setCold(next === true)}
              />
              <FieldLabel htmlFor="dm-cold">Temperature-controlled delivery</FieldLabel>
            </Field>
            <DeliveryWindow start={start} end={end} setStart={setStart} setEnd={setEnd} />
            <div className="dm-form-grid">
              <FleetNumber
                label="Longitude"
                min={-122.5}
                max={-122.1}
                step={0.001}
                value={position[0]}
                onChange={(value) => setPosition([value, position[1]])}
              />
              <FleetNumber
                label="Latitude"
                min={47.45}
                max={47.8}
                step={0.001}
                value={position[1]}
                onChange={(value) => setPosition([position[0], value])}
              />
            </div>
            <Button type="button" variant="outline" onClick={onPickMap}>
              <MapPin />
              Pick location on map
            </Button>
            <Field>
              <FieldLabel htmlFor="dm-delivery-note">Delivery note (optional)</FieldLabel>
              <Textarea
                id="dm-delivery-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!vehicleId}>
              Create delivery
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditVehicle({ vehicle, onClose }: { vehicle: FleetVehicle; onClose: () => void }) {
  const { state, act } = useFleet();
  const [driver, setDriver] = useState(vehicle.driver);
  const [registration, setRegistration] = useState(vehicle.registration);
  const [capacity, setCapacity] = useState(vehicle.capacity);
  const [kind, setKind] = useState(vehicle.kind);
  const [coldBox, setColdBox] = useState(vehicle.coldBox);
  const [fuel, setFuel] = useState(vehicle.fuel);
  return (
    <ActionFrame
      title={`Edit ${vehicle.id}`}
      description="Changes affect this local vehicle, route eligibility and the fleet list."
      submit="Save van"
      onClose={onClose}
      onSubmit={() => {
        if (
          act({
            type: "edit-vehicle",
            vehicleId: vehicle.id,
            driver,
            registration,
            capacity,
            kind,
            coldBox,
            fuel,
          })
        )
          onClose();
      }}
    >
      <Field>
        <FieldLabel htmlFor="dm-driver">Driver</FieldLabel>
        <Input
          id="dm-driver"
          required
          value={driver}
          onChange={(event) => setDriver(event.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="dm-registration">Registration</FieldLabel>
        <Input
          id="dm-registration"
          required
          value={registration}
          onChange={(event) => setRegistration(event.target.value)}
        />
      </Field>
      <FleetSelect
        label="Powertrain"
        value={kind}
        onChange={(value) => setKind(value as FleetVehicle["kind"])}
        options={[
          { value: "gas", label: "Gasoline" },
          { value: "electric", label: "Electric" },
        ]}
      />
      <FleetNumber
        label="Parcel capacity"
        value={capacity}
        min={1}
        max={80}
        onChange={setCapacity}
      />
      <p className="text-xs text-muted-foreground">
        Current remaining load: {routeMetrics(state, vehicle.id).parcels} parcels.
      </p>
      <FleetNumber
        label={kind === "electric" ? "Battery charge (%)" : "Fuel level (%)"}
        value={fuel}
        min={0}
        max={100}
        onChange={setFuel}
      />
      <Field orientation="horizontal">
        <Checkbox
          id="dm-vehicle-cold"
          checked={coldBox}
          onCheckedChange={(value) => setColdBox(value === true)}
        />
        <FieldLabel htmlFor="dm-vehicle-cold">Temperature-controlled cargo box</FieldLabel>
      </Field>
    </ActionFrame>
  );
}

function TextAction({
  dialog,
  onClose,
}: {
  dialog: Exclude<DispatchDialog, null>;
  onClose: () => void;
}) {
  const { state, act } = useFleet();
  const [text, setText] = useState("");
  const failed = dialog.kind === "fail";
  const stop = "stopId" in dialog ? state.stops[dialog.stopId] : null;
  return (
    <ActionFrame
      title={failed ? "Mark delivery failed" : "Message driver"}
      description={
        failed
          ? `${stop?.customer} · Record a local failure reason.`
          : "Records an activity note only. No message is sent to a real driver."
      }
      submit={failed ? "Mark failed" : "Record message"}
      onClose={onClose}
      onSubmit={() => {
        const valid =
          failed && stop
            ? act({ type: "fail-stop", stopId: stop.id, reason: text })
            : "vehicleId" in dialog
              ? act({ type: "message", vehicleId: dialog.vehicleId, message: text })
              : false;
        if (valid) onClose();
      }}
    >
      <Field>
        <FieldLabel htmlFor="dm-action-text">{failed ? "Failure reason" : "Message"}</FieldLabel>
        <Textarea
          id="dm-action-text"
          required
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <FieldDescription>
          {failed
            ? "The failed stop remains on its route and appears in Exceptions."
            : "This note is retained in this vehicle's local activity history."}
        </FieldDescription>
      </Field>
    </ActionFrame>
  );
}

type DispatchActionsProps = {
  dialog: DispatchDialog;
  onClose: () => void;
  onCloseAutoFocus: (event: Event) => void;
  placing: boolean;
  onPickMap: () => void;
  pickedPosition: Coordinate | null;
};

export function DispatchActions(props: DispatchActionsProps) {
  return (
    <ActionFocusContext.Provider value={props.onCloseAutoFocus}>
      <DispatchActionContent {...props} />
    </ActionFocusContext.Provider>
  );
}

function DispatchActionContent({
  dialog,
  onClose,
  placing,
  onPickMap,
  pickedPosition,
}: DispatchActionsProps) {
  const { state, act } = useFleet();
  const onCloseAutoFocus = useContext(ActionFocusContext);
  if (!dialog) return null;
  if (dialog.kind === "create")
    return (
      <CreateDelivery
        onClose={onClose}
        placing={placing}
        onPickMap={onPickMap}
        pickedPosition={pickedPosition}
      />
    );
  if (dialog.kind === "reassign" || dialog.kind === "reschedule") {
    const stop = state.stops[dialog.stopId];
    if (!stop) return null;
    return dialog.kind === "reassign" ? (
      <ReassignDelivery stop={stop} onClose={onClose} />
    ) : (
      <RescheduleDelivery stop={stop} onClose={onClose} />
    );
  }
  if (dialog.kind === "edit")
    return <EditVehicle vehicle={state.vehicles[dialog.vehicleId]} onClose={onClose} />;
  if (dialog.kind === "retire") {
    const vehicle = state.vehicles[dialog.vehicleId];
    return (
      <AlertDialog
        open
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <AlertDialogContent
          className="reui-reference dm-action-dialog"
          data-dm-focus-layer="action"
          onCloseAutoFocus={onCloseAutoFocus}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Retire {vehicle.id}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the van from active dispatch. The most recent change can be undone in the
              local simulation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={openStops(state, vehicle.id).length > 0}
              onClick={(event) => {
                if (!act({ type: "retire", vehicleId: vehicle.id })) event.preventDefault();
              }}
            >
              Retire van
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }
  return <TextAction dialog={dialog} onClose={onClose} />;
}
