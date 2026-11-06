import { useId, useState, type FormEvent, type MouseEvent } from "react";
import { Eye, EyeOff, Info, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/reui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { AuthMark, FormDivider, OAuthIcon } from "@/blocks/application/auth-shared";
import "./manifest-auth.css";

/** Manifest's observed login composition, with the existing local demo callback. */
export function ManifestAuth({ onLogin }: { onLogin: () => void }) {
  const id = useId();
  const [showPassword, setShowPassword] = useState(false);
  const [reset, setReset] = useState(false);
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (reset) {
      toast.success("Demo reset link requested", {
        description: "This local preview does not send email.",
      });
      setError("");
      setReset(false);
      return;
    }
    if (!String(data.get("password") ?? "").trim()) {
      setError("Enter your password.");
      return;
    }
    setError("");
    onLogin();
  }

  function openReset(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    setError("");
    setReset(true);
  }

  return (
    <div className="bt-auth bt-auth-manifest manifest-auth">
      <Card className="manifest-auth-card shadow-sm">
        <CardHeader className="manifest-auth-header">
          <a href="./" aria-label="Bricklane home" className="manifest-auth-mark">
            <AuthMark />
          </a>
          <div className="manifest-auth-heading">
            <h1>{reset ? "Reset your password" : "Log in to your account"}</h1>
            <p>
              {reset
                ? "Enter your email to get a password reset link."
                : "Enter your email and password below to log in"}
            </p>
          </div>
        </CardHeader>
        <CardContent className="manifest-auth-content">
          <Alert variant="info" className="manifest-auth-note">
            <Info aria-hidden="true" />
            <AlertDescription>
              <p>
                {reset ? (
                  "Password recovery is demonstrated locally."
                ) : (
                  <>
                    This is a live demo. The credentials are filled in, just click{" "}
                    <strong>Log in.</strong>
                  </>
                )}
              </p>
            </AlertDescription>
          </Alert>
          {!reset && (
            <>
              <div className="manifest-auth-providers">
                {(["Google", "Apple"] as const).map((provider) => (
                  <Button
                    key={provider}
                    type="button"
                    variant="outline"
                    onClick={() =>
                      toast(`${provider} sign-in selected`, {
                        description: "Connect your own authentication service to use this method.",
                      })
                    }
                  >
                    <OAuthIcon provider={provider} />
                    {provider}
                  </Button>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  toast("Passkey sign-in selected", {
                    description: "Connect an authentication provider to enable passkeys.",
                  })
                }
              >
                <KeyRound aria-hidden="true" />
                Sign in with a passkey
              </Button>
              <FormDivider>Or continue with email</FormDivider>
            </>
          )}
          <form className="manifest-auth-form" onSubmit={submit}>
            <FieldGroup className="manifest-auth-fields">
              <Field>
                <FieldLabel htmlFor={`${id}-email`}>Email address</FieldLabel>
                <Input
                  id={`${id}-email`}
                  name="email"
                  type="email"
                  autoComplete="username"
                  defaultValue="nick@bricklane.demo"
                  required
                  autoFocus
                />
              </Field>
              {!reset && (
                <>
                  <Field>
                    <div className="manifest-auth-password-label">
                      <FieldLabel htmlFor={`${id}-password`}>Password</FieldLabel>
                      <a href="/forgot-password" onClick={openReset}>
                        Forgot your password?
                      </a>
                    </div>
                    <InputGroup>
                      <InputGroupInput
                        id={`${id}-password`}
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        defaultValue="password"
                        required
                        aria-invalid={error ? true : undefined}
                        aria-describedby={error ? `${id}-error` : undefined}
                        onChange={() => setError("")}
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupButton
                          size="icon-xs"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          aria-pressed={showPassword}
                          onClick={() => setShowPassword((shown) => !shown)}
                        >
                          {showPassword ? <EyeOff /> : <Eye />}
                        </InputGroupButton>
                      </InputGroupAddon>
                    </InputGroup>
                  </Field>
                  <div className="manifest-auth-remember">
                    <Checkbox id={`${id}-remember`} name="remember" />
                    <Label htmlFor={`${id}-remember`}>Remember me</Label>
                  </div>
                </>
              )}
            </FieldGroup>
            {error && (
              <p id={`${id}-error`} className="bt-login-error manifest-auth-error" role="alert">
                {error}
              </p>
            )}
            <Button type="submit">{reset ? "Send reset link" : "Log in"}</Button>
          </form>
          {reset && (
            <Button
              type="button"
              variant="link"
              onClick={() => {
                setError("");
                setReset(false);
              }}
            >
              Back to log in
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
