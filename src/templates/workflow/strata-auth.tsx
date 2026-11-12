import { useId, useRef, useState, type FormEvent, type MouseEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { BrandMark } from "@/components/brand-mark";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { FormDivider, OAuthIcon } from "@/blocks/application/auth-shared";
import {
  validateStrataAuth,
  type StrataAuthErrors,
  type StrataAuthMode,
  type StrataAuthRoute,
} from "./strata-auth-model";
import "./strata-auth.css";

export type StrataAuthProps = {
  mode: StrataAuthMode;
  href: (route: StrataAuthRoute) => string;
  onNavigate: (route: StrataAuthRoute) => void;
  onContinue: (email: string) => void;
};

/** Observed auth composition; Root owns routes and the explicit local demo continuation. */
export function StrataAuth(props: StrataAuthProps) {
  // Each route owns its uncontrolled fields and visibility/error state.
  return <StrataAuthPage key={props.mode} {...props} />;
}

function StrataAuthPage({ mode, href, onNavigate, onContinue }: StrataAuthProps) {
  const id = useId();
  const identifierRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [visible, setVisible] = useState(false);
  const [errors, setErrors] = useState<StrataAuthErrors>({});
  const signingUp = mode === "sign-up";
  const title = signingUp ? "Create account" : "Sign in";
  const destination = signingUp ? "/sign-in" : "/sign-up";

  function navigate(event: MouseEvent<HTMLAnchorElement>, route: StrataAuthRoute) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    event.preventDefault();
    onNavigate(route);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = validateStrataAuth(
      mode,
      String(form.get("identifier") ?? ""),
      String(form.get("password") ?? ""),
    );
    if (!result.ok) {
      setErrors(result.errors);
      const invalid = result.errors.identifier ? identifierRef.current : passwordRef.current;
      invalid?.focus({ preventScroll: true });
      return;
    }
    setErrors({});
    if (passwordRef.current) passwordRef.current.value = "";
    toast.info("Opening the local demo", {
      description: "No authentication request is sent and no account is created.",
    });
    // Only the identifier crosses this boundary. Passwords are never persisted or forwarded.
    onContinue(result.identifier);
  }

  return (
    <div className="strata-auth" data-auth-mode={mode}>
      <main className="strata-auth-main" aria-labelledby={`${id}-title`}>
        <div className="strata-auth-group">
          <Frame className="strata-auth-frame">
            <FramePanel fit className="strata-auth-panel">
              <FrameHeader className="strata-auth-header">
                <span role="img" aria-label="Bricklane" className="strata-auth-mark">
                  <BrandMark outlined />
                </span>
                <FrameTitle id={`${id}-title`} role="heading" aria-level={1}>
                  {title}
                </FrameTitle>
                <FrameDescription>
                  {signingUp ? "Get started with your workspace." : "Continue to your workspace."}
                </FrameDescription>
              </FrameHeader>
              <form className="strata-auth-form" onSubmit={submit} aria-describedby={`${id}-demo`}>
                <FieldGroup className="strata-auth-fields">
                  <Field data-invalid={!!errors.identifier}>
                    <FieldLabel htmlFor={`${id}-identifier`}>
                      {signingUp ? "Email" : "Email or username"}
                    </FieldLabel>
                    <Input
                      ref={identifierRef}
                      id={`${id}-identifier`}
                      name="identifier"
                      type={signingUp ? "email" : "text"}
                      autoComplete={signingUp ? "email" : "username"}
                      autoCapitalize="none"
                      spellCheck={false}
                      placeholder={signingUp ? "Email" : "Email or username"}
                      defaultValue={signingUp ? "" : "m@example.com"}
                      required
                      aria-invalid={!!errors.identifier}
                      aria-describedby={errors.identifier ? `${id}-identifier-error` : undefined}
                      onChange={() => setErrors({})}
                    />
                    {errors.identifier && (
                      <FieldError id={`${id}-identifier-error`}>{errors.identifier}</FieldError>
                    )}
                  </Field>
                  <Field data-invalid={!!errors.password}>
                    <div className="strata-auth-password-label">
                      <FieldLabel htmlFor={`${id}-password`}>Password</FieldLabel>
                      {!signingUp && (
                        <Button
                          type="button"
                          variant="link"
                          className="strata-auth-forgot"
                          onClick={() =>
                            toast.info("Password recovery", {
                              description:
                                "Password reset is unavailable in this local demo. No email is sent.",
                            })
                          }
                        >
                          Forgot password?
                        </Button>
                      )}
                    </div>
                    <InputGroup>
                      <InputGroupInput
                        ref={passwordRef}
                        id={`${id}-password`}
                        name="password"
                        type={visible ? "text" : "password"}
                        autoComplete={signingUp ? "new-password" : "current-password"}
                        placeholder={signingUp ? "At least 8 characters" : "Enter your password"}
                        defaultValue={signingUp ? "" : "demo-password"}
                        minLength={signingUp ? 8 : undefined}
                        required
                        aria-invalid={!!errors.password}
                        aria-describedby={errors.password ? `${id}-password-error` : undefined}
                        onChange={() => setErrors({})}
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupButton
                          type="button"
                          size="icon-xs"
                          aria-label={visible ? "Hide password" : "Show password"}
                          aria-pressed={visible}
                          onClick={() => setVisible((current) => !current)}
                        >
                          {visible ? <EyeOff /> : <Eye />}
                        </InputGroupButton>
                      </InputGroupAddon>
                    </InputGroup>
                    {errors.password && (
                      <FieldError id={`${id}-password-error`}>{errors.password}</FieldError>
                    )}
                  </Field>
                </FieldGroup>
                <Button type="submit" className="strata-auth-submit">
                  {title}
                </Button>
              </form>
              <div className="strata-auth-social">
                <FormDivider>Or continue with</FormDivider>
                <div className="strata-auth-providers">
                  {(["Google", "Apple", "GitHub"] as const).map((provider) => (
                    <Button
                      key={provider}
                      type="button"
                      variant="outline"
                      onClick={() =>
                        toast.info(`${provider} sign-in is not connected`, {
                          description:
                            "Use the form to enter the local demo. No social authorization is performed.",
                        })
                      }
                    >
                      <OAuthIcon provider={provider} />
                      {provider}
                    </Button>
                  ))}
                </div>
              </div>
            </FramePanel>
          </Frame>
          <p className="strata-auth-route-hint">
            {signingUp ? "Already have an account?" : "Need an account?"}{" "}
            <a href={href(destination)} onClick={(event) => navigate(event, destination)}>
              {signingUp ? "Sign in" : "Sign up"}
            </a>
          </p>
          <p id={`${id}-demo`} className="strata-auth-demo-note" role="note">
            Local demo only. No real account is created.
          </p>
        </div>
      </main>
      <footer className="strata-auth-footer">
        <nav aria-label="Footer">
          {["Privacy", "Terms", "Status"].map((label) => (
            <a
              key={label}
              href="#"
              onClick={(event) => {
                event.preventDefault();
                toast.info(`${label} is a demo placeholder`, {
                  description: "This reference link has no destination in the local demo.",
                });
              }}
            >
              {label}
            </a>
          ))}
        </nav>
      </footer>
    </div>
  );
}
