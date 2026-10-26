import { useState } from "react";
import { ArrowLeftRight, Check } from "lucide-react";
import { Alert, AlertDescription } from "@/components/reui/alert";
import { Badge } from "@/components/reui/badge";
import { Frame, FrameHeader, FramePanel } from "@/components/reui/frame";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
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
    <Frame spacing="sm" data-comparison-selector={side} data-selected-product={id}>
      <FrameHeader>
        <Field>
          <Select value={id} onValueChange={(value) => onChange(value as ComparisonProductId)}>
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
      </FrameHeader>
      <FramePanel fit>
        <img
          src={product.image}
          alt={`${product.name} original headphone illustration`}
          className="h-36 w-full rounded-t-none bg-[#e8e7df] object-contain scale-150 sm:h-52"
        />
      </FramePanel>
      <FramePanel>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Model {side}</p>
        <h3 className="mt-1 text-lg font-semibold leading-tight sm:text-xl">{product.name}</h3>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">{product.tagline}</p>
        <div className="mt-3">
          <ComparisonRating product={product} />
        </div>
        <p className="mt-3 text-xl font-semibold">{compareMoney(product.price)}</p>
        <div className="mt-4">
          <ComparisonCartAction id={id} compact />
        </div>
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
      description="Choose any two models. Better numeric values are emphasized; matching values and features are left equal."
      actions={
        <>
          <Button variant="outline" onClick={() => setPair([pair[1], pair[0]])}>
            <ArrowLeftRight className="size-4" />
            Swap models
          </Button>
          <Button variant="ghost" onClick={() => setPair(defaults)}>
            Reset pair
          </Button>
        </>
      }
    >
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-5">
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
        <div className="mb-5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <Badge variant="success-light">
            <Check className="size-3" />
            Better numeric value
          </Badge>
          <span data-pair-win-summary>
            {a.name}: {wins.a} <span className="px-1">·</span> {b.name}: {wins.b}
          </span>
        </div>
      )}
      <div className="overflow-hidden rounded-xl border">
        <Table className="min-w-[640px] table-fixed">
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-[32%] px-4">Specification</TableHead>
              <TableHead className="px-4">{a.name}</TableHead>
              <TableHead className="px-4">{b.name}</TableHead>
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
        <TableCell
          colSpan={3}
          className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest"
        >
          {group.name}
        </TableCell>
      </TableRow>
      {group.specs.map((spec) => {
        const winner = specWinner(spec, left, right);
        return (
          <TableRow
            key={spec.id}
            data-pair-spec={spec.id}
            className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r"
          >
            <TableCell className="bg-muted/50 whitespace-normal px-4 py-4 text-xs text-muted-foreground">
              <SpecLabel spec={spec} />
            </TableCell>
            <TableCell className={winner === a ? "bg-emerald-500/5 px-4 py-4" : "px-4 py-4"}>
              <ComparisonValue product={left} spec={spec} winner={winner === a} />
            </TableCell>
            <TableCell className={winner === b ? "bg-emerald-500/5 px-4 py-4" : "px-4 py-4"}>
              <ComparisonValue product={right} spec={spec} winner={winner === b} />
            </TableCell>
          </TableRow>
        );
      })}
    </>
  );
}
