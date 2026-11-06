import { Children, Fragment, type ReactNode } from "react";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { cn } from "@/lib/utils";

/** Miro consumer of ReUI's free Field anatomy; the caller owns every control and value. */
export function MiroSettingsFields({
  legend,
  description,
  children,
}: {
  legend: string;
  description?: string;
  children: ReactNode;
}) {
  const rows = Children.toArray(children);
  return (
    <FieldSet className="miro-settings-fields">
      <FieldLegend className="sr-only">{legend}</FieldLegend>
      {description && <FieldDescription className="sr-only">{description}</FieldDescription>}
      <FieldGroup className="miro-settings-field-group">
        {rows.map((row, index) => (
          <Fragment key={index}>
            {index > 0 && <FieldSeparator />}
            {row}
          </Fragment>
        ))}
      </FieldGroup>
    </FieldSet>
  );
}

export function MiroSettingsField({
  id,
  title,
  description,
  badge,
  children,
  invalid,
  className,
}: {
  id?: string;
  title: ReactNode;
  description?: ReactNode;
  badge?: ReactNode;
  children: ReactNode;
  invalid?: boolean;
  className?: string;
}) {
  return (
    <Field
      orientation="responsive"
      className={cn("miro-settings-field", className)}
      data-invalid={invalid}
    >
      <div className="miro-settings-field-label">
        <div className="miro-settings-field-heading">
          {id ? <FieldLabel htmlFor={id}>{title}</FieldLabel> : <FieldTitle>{title}</FieldTitle>}
          {badge}
        </div>
        {description && (
          <FieldDescription id={id ? `${id}-description` : undefined}>
            {description}
          </FieldDescription>
        )}
      </div>
      <FieldContent className="miro-settings-field-control">{children}</FieldContent>
    </Field>
  );
}
