import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/reui/alert";
import { Badge } from "@/components/reui/badge";
import { Frame, FramePanel } from "@/components/reui/frame";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Item, ItemContent, ItemGroup, ItemMedia } from "@/components/ui/item";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  comparisonGroups,
  comparisonProducts,
  productById,
  compareMoney,
  specWinner,
  type ComparisonProductId,
} from "./data";
import { ComparisonCartAction } from "./cart";
import { ComparisonLayout, ComparisonRating, ComparisonValue, SpecLabel } from "./shared";

const defaults: [ComparisonProductId, ComparisonProductId] = ["field", "studio"];

/** Actual c-select-1 Field/SelectGroup composition in the official Frame implementation. */
function SelectorCard({
  side,
  id,
  onChange,
}: {
  side: "A" | "B";
  id: ComparisonProductId;
  onChange: (id: ComparisonProductId) => void;
}) {
  const product = productById[id];
  return (
    <Frame
      dense
      spacing="sm"
      className="min-w-0 bg-background"
      data-comparison-selector={side}
      data-selected-product={id}
    >
      <FramePanel fit className="m-0! flex flex-col gap-4 border-0 p-4 sm:p-5">
        <ItemGroup>
          <Item className="flex-nowrap gap-4 border-0 p-0">
            <ItemMedia
              className="size-20 overflow-hidden rounded-lg bg-muted sm:size-24"
              data-comparison-model-media
            >
              <img
                src={product.image}
                alt={`${product.name} original headphone illustration`}
                className="size-full object-contain"
              />
            </ItemMedia>
            <ItemContent className="min-w-0 gap-2">
              <Field>
                <Select
                  value={id}
                  onValueChange={(value) => onChange(value as ComparisonProductId)}
                >
                  <SelectTrigger aria-label={`Model ${side}`} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectGroup>
                      {comparisonProducts.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" size="sm">
                  Over-ear
                </Badge>
                <p className="text-xs text-muted-foreground">Wireless headphones</p>
              </div>
            </ItemContent>
          </Item>
        </ItemGroup>
        <p className="truncate text-sm leading-5 text-muted-foreground">{product.tagline}</p>
        <div className="flex items-center justify-between gap-4">
          <p className="text-2xl font-semibold leading-8">{compareMoney(product.price)}</p>
          <ComparisonRating product={product} />
        </div>
        <ComparisonCartAction id={id} compact />
      </FramePanel>
    </Frame>
  );
}

/** Actual free c-table-16 vertical-spec composition, extended with typed two-model winner cells. */
export function TwoProductCompare() {
  const [pair, setPair] = useState<[ComparisonProductId, ComparisonProductId]>(defaults);
  const [a, b] = pair.map((id) => productById[id]);
  const same = a.id === b.id;
  const wins = {
    a: comparisonGroups
      .flatMap((group) => group.specs)
      .filter((spec) => specWinner(spec, a, b) === a.id).length,
    b: comparisonGroups
      .flatMap((group) => group.specs)
      .filter((spec) => specWinner(spec, a, b) === b.id).length,
  };
  return (
    <ComparisonLayout
      variant={2}
      title="A closer comparison"
      description="Compare your everyday essentials, then choose the model that fits your routine."
      headerActions={
        <Button
          variant="outline"
          size="sm"
          aria-label="Swap models"
          onClick={() => setPair([pair[1], pair[0]])}
        >
          <ArrowLeftRight className="size-4" />
          Swap
        </Button>
      }
      actions={
        <Button variant="ghost" onClick={() => setPair(defaults)}>
          Reset pair
        </Button>
      }
    >
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
        <SelectorCard side="A" id={pair[0]} onChange={(id) => setPair([id, pair[1]])} />
        <SelectorCard side="B" id={pair[1]} onChange={(id) => setPair([pair[0], id])} />
      </div>
      {same ? (
        <Alert className="mb-5">
          <AlertDescription>
            Same model selected. All specifications match; choose a different model for a
            head-to-head comparison.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="sr-only">
          <span data-pair-win-summary>
            {a.name}: {wins.a} <span className="px-1">·</span> {b.name}: {wins.b}
          </span>
        </div>
      )}
      <div className="overflow-hidden rounded-xl border">
        <Table className="w-full table-fixed" data-comparison-pair-table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-48 px-4 sm:w-56">Specification</TableHead>
              <TableHead className="whitespace-normal break-words px-4">{a.name}</TableHead>
              <TableHead className="whitespace-normal break-words px-4">{b.name}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {comparisonGroups.map((group) => (
              <GroupRows key={group.id} group={group} a={a.id} b={b.id} />
            ))}
          </TableBody>
        </Table>
      </div>
    </ComparisonLayout>
  );
}
function GroupRows({
  group,
  a,
  b,
}: {
  group: (typeof comparisonGroups)[number];
  a: ComparisonProductId;
  b: ComparisonProductId;
}) {
  const left = productById[a],
    right = productById[b];
  return (
    <>
      <TableRow className="bg-muted/40 hover:bg-muted/40">
        <TableCell colSpan={3} className="px-4 py-2 text-xs font-medium leading-4">
          {group.name}
        </TableCell>
      </TableRow>
      {group.specs.map((spec) => {
        const winner = specWinner(spec, left, right);
        return (
          <TableRow
            key={spec.id}
            data-pair-spec={spec.id}
            className="h-10 *:border-border hover:bg-transparent [&>:not(:last-child)]:border-r"
          >
            <TableCell className="bg-muted/50 whitespace-normal px-4 py-2 text-xs text-muted-foreground">
              <SpecLabel spec={spec} />
            </TableCell>
            <TableCell
              className={`whitespace-normal break-words px-4 py-2 ${winner && winner !== a ? "text-muted-foreground" : ""}`}
            >
              <ComparisonValue product={left} spec={spec} winner={winner === a} compactRating />
            </TableCell>
            <TableCell
              className={`whitespace-normal break-words px-4 py-2 ${winner && winner !== b ? "text-muted-foreground" : ""}`}
            >
              <ComparisonValue product={right} spec={spec} winner={winner === b} compactRating />
            </TableCell>
          </TableRow>
        );
      })}
    </>
  );
}
