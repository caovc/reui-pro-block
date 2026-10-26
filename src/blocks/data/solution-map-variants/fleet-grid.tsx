import { useMemo, useState } from "react";
import { Columns3, Search, SlidersHorizontal, Truck } from "lucide-react";
import {
  useTable,
  type ColumnDef,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import {
  DataGrid,
  DataGridContainer,
  dataGridFeatures,
  type DataGridFeatures,
} from "@/components/reui/data-grid/data-grid";
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
  FrameDescription,
  FrameFooter,
} from "@/components/reui/frame";
import { Filters } from "@/components/reui/filters/filters";
import { createFilterQuery } from "@/components/reui/filters/filters-query";
import type { FilterField, FilterQuery } from "@/components/reui/filters/filters-types";
import {
  Cascader,
  CascaderTrigger,
  CascaderContent,
  CascaderPanel,
  CascaderList,
  CascaderEmpty,
  CascaderStatus,
} from "@/components/reui/cascader/cascader";
import { CascaderValue, CascaderNav, CascaderInput } from "@/components/reui/cascader/cascader-nav";
import { CascaderItems } from "@/components/reui/cascader/cascader-item";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Field, FieldLabel } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { useFleet } from "./fleet-context";
import { routeMetrics, vehicleAlerts } from "./fleet-model";
import { matchesFleetQuery } from "./fleet-filter";
import { VehicleStatusBadge } from "./fleet-status";
import type { FleetVehicle } from "./fleet-types";

const fields: FilterField[] = [
  {
    id: "status",
    label: "Status",
    type: "select",
    options: ["On route", "Returning", "At depot", "Charging", "Maintenance", "Breakdown"].map(
      (value) => ({ value, label: value }),
    ),
  },
  {
    id: "kind",
    label: "Powertrain",
    type: "select",
    options: ["gas", "electric"].map((value) => ({ value, label: value })),
  },
  { id: "fuel", label: "Fuel / charge (%)", type: "number" },
  { id: "parcels", label: "Remaining parcels", type: "number" },
];
const optionalColumns = ["alerts", "status", "driver", "kind", "parcels", "range"];

export function FleetGrid({ onDetails }: { onDetails: (id: string) => void }) {
  const { state, act } = useFleet();
  const [text, setText] = useState("");
  const [query, setQuery] = useState<FilterQuery>(() => createFilterQuery());
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});
  const [dense, setDense] = useState(false);
  const data = useMemo(
    () =>
      Object.values(state.vehicles).filter((vehicle) => {
        return (
          vehicle.status !== "Retired" &&
          `${vehicle.id} ${vehicle.driver} ${vehicle.registration}`
            .toLowerCase()
            .includes(text.toLowerCase()) &&
          matchesFleetQuery(query, vehicle, state)
        );
      }),
    [state, text, query],
  );
  const columns = useMemo<ColumnDef<DataGridFeatures, FleetVehicle>[]>(
    () => [
      {
        id: "vehicle",
        accessorKey: "id",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Vehicle" />,
        size: 130,
        enableHiding: false,
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="ghost"
            aria-label={`Select ${row.original.id}`}
            aria-pressed={state.selectedVehicleId === row.original.id}
            onClick={() => {
              act({ type: "select", vehicleId: row.original.id });
              onDetails(row.original.id);
            }}
          >
            <Truck data-icon="inline-start" />
            {row.original.id}
          </Button>
        ),
      },
      {
        id: "alerts",
        header: "Alerts",
        size: 85,
        accessorFn: (vehicle) => vehicleAlerts(state, vehicle.id).length,
        cell: ({ row }) => <span>{vehicleAlerts(state, row.original.id).length || "—"}</span>,
      },
      {
        id: "status",
        accessorKey: "status",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Status" />,
        size: 135,
        cell: ({ row }) => <VehicleStatusBadge status={row.original.status} />,
      },
      {
        id: "driver",
        accessorKey: "driver",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Driver" />,
        size: 170,
      },
      { id: "kind", accessorKey: "kind", header: "Powertrain", size: 145 },
      {
        id: "parcels",
        header: "Load",
        accessorFn: (vehicle) => routeMetrics(state, vehicle.id).parcels,
        size: 110,
        cell: ({ row }) => (
          <span>
            {routeMetrics(state, row.original.id).parcels} / {row.original.capacity}
          </span>
        ),
      },
      {
        id: "range",
        header: "Range",
        accessorFn: (vehicle) => routeMetrics(state, vehicle.id).remainingRange,
        size: 110,
        cell: ({ row }) => (
          <span>{routeMetrics(state, row.original.id).remainingRange.toFixed(0)} mi</span>
        ),
      },
    ],
    [state, act, onDetails],
  );
  const table = useTable({
    features: dataGridFeatures,
    data,
    columns,
    getRowId: (vehicle: FleetVehicle) => vehicle.id,
    state: { pagination, sorting, columnVisibility },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
  });
  return (
    <Frame className="dm-list-frame" spacing="sm">
      <FrameHeader>
        <FrameTitle>Fleet</FrameTitle>
        <FrameDescription>
          {data.length} of {Object.keys(state.vehicles).length} vehicles · Seattle
        </FrameDescription>
      </FrameHeader>
      <FramePanel className="dm-grid-panel">
        <div className="dm-grid-toolbar">
          <InputGroup className="dm-grid-search">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              aria-label="Search fleet"
              placeholder="Search vehicles or drivers…"
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                setPagination((old) => ({ ...old, pageIndex: 0 }));
              }}
            />
          </InputGroup>
          <Filters
            fields={fields}
            query={query}
            onQueryChange={(next) => {
              setQuery(next);
              setPagination((old) => ({ ...old, pageIndex: 0 }));
            }}
            showClear
          />
          <Cascader
            multiple
            items={optionalColumns.map((value) => ({
              value,
              label: value[0].toUpperCase() + value.slice(1),
            }))}
            value={optionalColumns.filter((id) => columnVisibility[id] !== false)}
            onValueChange={(values) =>
              setColumnVisibility(
                Object.fromEntries(optionalColumns.map((id) => [id, values.includes(id)])),
              )
            }
          >
            <CascaderTrigger aria-label="Fleet columns" render={<Button variant="outline" />}>
              <Columns3 data-icon="inline-start" />
              <CascaderValue placeholder="Columns">{() => "Columns"}</CascaderValue>
            </CascaderTrigger>
            <CascaderContent className="reui-reference">
              <CascaderPanel>
                <CascaderNav>
                  <CascaderInput placeholder="Search columns…" />
                </CascaderNav>
                <CascaderEmpty />
                <CascaderList>
                  <CascaderItems />
                </CascaderList>
                <CascaderStatus />
              </CascaderPanel>
            </CascaderContent>
          </Cascader>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" aria-label="Fleet display settings">
                <SlidersHorizontal />
                Settings
              </Button>
            </PopoverTrigger>
            <PopoverContent className="reui-reference">
              <Field orientation="horizontal">
                <FieldLabel htmlFor="dm-dense">Compact rows</FieldLabel>
                <Switch id="dm-dense" checked={dense} onCheckedChange={setDense} />
              </Field>
            </PopoverContent>
          </Popover>
        </div>
        {data.length ? (
          <DataGrid
            table={table}
            recordCount={data.length}
            tableLayout={{ dense, width: "fixed", rowBorder: true }}
          >
            <DataGridContainer>
              <DataGridScrollArea>
                <DataGridTable />
              </DataGridScrollArea>
            </DataGridContainer>
            <DataGridPagination />
          </DataGrid>
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyMedia>
                <Search />
              </EmptyMedia>
              <EmptyTitle>No vehicles found</EmptyTitle>
              <EmptyDescription>Try another search or remove fleet filters.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                variant="outline"
                onClick={() => {
                  setText("");
                  setQuery(createFilterQuery());
                }}
              >
                Clear filters
              </Button>
            </EmptyContent>
          </Empty>
        )}
      </FramePanel>
      <FrameFooter>
        <p className="text-xs text-muted-foreground">
          Simulation data · Selecting a row opens the same vehicle shown on the map.
        </p>
      </FrameFooter>
    </Frame>
  );
}
