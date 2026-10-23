// Actual official free ReUI c-input-group-36, MIT (c) Keenthemes.
// https://reui.io/r/radix-nova/c-input-group-36.json
// Upstream SHA256: a8e7c245237042f6c608bd95eaaee8de6fdb434a2862886b01a1bb6a6a994305
// Preserves the complete HTTP menu/InputGroup/addons/Send composition.
// Adds controlled props, native form submission and semantic method color tokens.
import { ChevronDown, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

const httpMethodColors = {
  GET: "text-success",
  POST: "text-primary",
  PUT: "text-warning",
  PATCH: "text-info",
  DELETE: "text-destructive",
} as const;
export type HttpMethod = keyof typeof httpMethodColors;
const httpMethods = Object.keys(httpMethodColors) as HttpMethod[];

export function RequestBar({
  method,
  onMethodChange,
  path,
  onPathChange,
  sending,
  onSend,
}: {
  method: HttpMethod;
  onMethodChange: (method: HttpMethod) => void;
  path: string;
  onPathChange: (path: string) => void;
  sending: boolean;
  onSend: () => void;
}) {
  return (
    <form
      className="developer-request-form"
      aria-label="Local API request"
      onSubmit={(event) => {
        event.preventDefault();
        onSend();
      }}
    >
      <Field>
        <InputGroup>
          <InputGroupAddon>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <InputGroupButton
                  variant="ghost"
                  className={cn("gap-1.5 font-mono text-xs", httpMethodColors[method])}
                  aria-label={`HTTP method: ${method}`}
                >
                  {method}
                  <ChevronDown aria-hidden="true" />
                </InputGroupButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-28">
                <DropdownMenuGroup>
                  {httpMethods.map((item) => (
                    <DropdownMenuItem
                      key={item}
                      className={cn("font-mono text-xs font-semibold", httpMethodColors[item])}
                      onSelect={() => onMethodChange(item)}
                    >
                      {item}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </InputGroupAddon>
          <InputGroupInput
            value={path}
            onChange={(event) => onPathChange(event.target.value)}
            className="min-w-0 font-mono text-xs"
            aria-label="API endpoint path"
            spellCheck={false}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton type="submit" size="xs" aria-label="Send request" disabled={sending}>
              {sending && <LoaderCircle className="animate-spin" aria-hidden="true" />}
              Send
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </Field>
    </form>
  );
}
