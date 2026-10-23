import { Children, isValidElement } from "react";
import type { ChangeEvent, ReactNode, SelectHTMLAttributes } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = SelectHTMLAttributes<HTMLSelectElement> & { icon?: ReactNode };
/** A shadcn Select with the same option data and value callback as a single native select. */
export function FGSelect({
  children,
  icon,
  value,
  onChange,
  className = "",
  id,
  disabled,
  "aria-label": label,
  ...rest
}: Props) {
  const options = Children.toArray(children)
    .filter(
      (child) =>
        isValidElement<{ value?: string | number; children: ReactNode }>(child) &&
        child.type === "option",
    )
    .map((child) => {
      const option = child as React.ReactElement<{
        value?: string | number;
        children: ReactNode;
      }>;
      return {
        value: String(option.props.value ?? option.props.children),
        label: option.props.children,
      };
    });
  const current = String(value ?? options[0]?.value ?? "");
  return (
    <Select
      value={current || "__fg_empty"}
      disabled={disabled}
      onValueChange={(next) =>
        onChange?.({
          target: { value: next === "__fg_empty" ? "" : next },
          currentTarget: { value: next === "__fg_empty" ? "" : next },
        } as ChangeEvent<HTMLSelectElement>)
      }
    >
      <SelectTrigger
        id={id}
        aria-label={label}
        className={`fg-select-trigger ${className}`}
        style={rest.style}
      >
        {icon}
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="fg-portal fg-select-options">
        {options.map((option) => (
          <SelectItem
            data-value={option.value}
            key={option.value}
            value={option.value || "__fg_empty"}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
