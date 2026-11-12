import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { OAuthIcon, FormDivider } from "@/blocks/application/auth-shared";
import { Alert, AlertDescription } from "@/components/reui/alert";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Mark,
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./shared";
import "./filebox-auth.css";

/** Filebox consumes the existing free form primitives; Drive owns sign-in and routing. */
export function FileboxAuth({ onLogin }: { onLogin: () => void }) {
  const [visible, setVisible] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [sent, setSent] = useState(false);
  const resetEmailRef = useRef<HTMLInputElement>(null);
  const resetStatusRef = useRef<HTMLDivElement>(null);
  const forgotButtonRef = useRef<HTMLButtonElement>(null);
  const restoreSignInFocus = useRef(false);

  useEffect(() => {
    if (forgot) {
      if (sent) resetStatusRef.current?.focus();
      else resetEmailRef.current?.focus();
    } else if (restoreSignInFocus.current) {
      forgotButtonRef.current?.focus();
      restoreSignInFocus.current = false;
    }
  }, [forgot, sent]);

  return (
    <div className="ct-app ct-drive-login ct-filebox-auth">
      <div className="ct-login-container">
        {!forgot && (
          <Alert className="ct-login-notice" role="note" aria-label="Demo sign-in">
            <AlertDescription>
              <p>
                This is a live demo. The credentials are filled in, just click <b>Sign in.</b>
              </p>
            </AlertDescription>
          </Alert>
        )}
        <Card>
          <CardHeader>
            <div className="ct-login-heading">
              <Mark />
              <CardTitle>{forgot ? "Reset your password" : "Welcome back"}</CardTitle>
              <CardDescription>
                {forgot
                  ? "We will send a link to the address on your account."
                  : "Sign in to continue to your workspace."}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {forgot ? (
              <form
                className="filebox-auth-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  setSent(true);
                }}
              >
                {sent ? (
                  <Alert ref={resetStatusRef} role="status" tabIndex={-1}>
                    <AlertDescription>Reset link prepared for this local demo.</AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <Field>
                      <FieldLabel htmlFor="filebox-reset-email">Email</FieldLabel>
                      <Input
                        ref={resetEmailRef}
                        id="filebox-reset-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        aria-describedby="filebox-reset-email-description"
                        required
                      />
                      <FieldDescription id="filebox-reset-email-description">
                        The address you sign in with.
                      </FieldDescription>
                    </Field>
                    <Button type="submit">Send reset link</Button>
                  </>
                )}
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => {
                    setForgot(false);
                    setSent(false);
                    setVisible(false);
                  }}
                >
                  <ArrowLeft />
                  Back to sign in
                </Button>
              </form>
            ) : (
              <>
                <div className="ct-two">
                  {(["Google", "Apple"] as const).map((provider) => (
                    <Button
                      key={provider}
                      type="button"
                      variant="outline"
                      onClick={() => toast("Use the demo email sign-in below")}
                    >
                      <OAuthIcon provider={provider} />
                      {provider}
                    </Button>
                  ))}
                </div>
                <div className="filebox-auth-divider">
                  <FormDivider>Or sign in with email</FormDivider>
                </div>
                <form
                  className="filebox-auth-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    onLogin();
                  }}
                >
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="filebox-login-email">Email or username</FieldLabel>
                      <Input
                        id="filebox-login-email"
                        name="username"
                        type="email"
                        autoComplete="username"
                        defaultValue="alex.rivera@bricklane.example"
                        required
                      />
                    </Field>
                    <Field>
                      <div className="filebox-auth-password-label">
                        <FieldLabel htmlFor="filebox-login-password">Password</FieldLabel>
                        <button
                          ref={forgotButtonRef}
                          type="button"
                          className="ct-subtle"
                          onClick={() => {
                            restoreSignInFocus.current = true;
                            setForgot(true);
                          }}
                        >
                          Forgot password?
                        </button>
                      </div>
                      <InputGroup>
                        <InputGroupInput
                          id="filebox-login-password"
                          name="password"
                          type={visible ? "text" : "password"}
                          autoComplete="current-password"
                          defaultValue="password"
                          required
                        />
                        <InputGroupAddon align="inline-end">
                          <InputGroupButton
                            type="button"
                            size="icon-xs"
                            variant="ghost"
                            aria-label={visible ? "Hide password" : "Show password"}
                            aria-pressed={visible}
                            onClick={() => setVisible(!visible)}
                          >
                            {visible ? <EyeOff /> : <Eye />}
                          </InputGroupButton>
                        </InputGroupAddon>
                      </InputGroup>
                    </Field>
                  </FieldGroup>
                  <Button type="submit">Sign in</Button>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
