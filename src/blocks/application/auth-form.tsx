import { useId, useState } from "react";
import { ArrowLeft, Check, Eye, EyeOff, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert";
import { AuthMark, FormDivider, OAuthIcon, type Provider } from "./auth-shared";

export function PasswordAuthForm({
  title = "Sign in",
  description = "Continue to your workspace.",
  magic = false,
  logo = true,
  providerRow = true,
  providers = ["Google", "Apple", "GitHub"],
  signup = true,
  initialMode = "login",
  outlinedLogo = false,
}: {
  title?: string;
  description?: string;
  magic?: boolean;
  logo?: boolean;
  providerRow?: boolean;
  providers?: Provider[];
  signup?: boolean;
  initialMode?: "login" | "signup";
  outlinedLogo?: boolean;
}) {
  const id = useId();
  const [mode, setMode] = useState<"login" | "reset" | "signup" | "sent" | "signed">(initialMode);
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [lastAction, setLastAction] = useState("Sign in");
  const confirmation = mode === "sent" || mode === "signed";
  const heading =
    mode === "reset"
      ? "Reset your password"
      : mode === "signup"
        ? "Create your account"
        : mode === "sent"
          ? "Check your inbox"
          : mode === "signed"
            ? "Welcome back"
            : title;
  return (
    <div className={`auth-detail-form ${magic ? "auth-detail-magic" : ""}`}>
      <header className="auth-detail-heading">
        {logo && <AuthMark outlined={outlinedLogo} />}
        <h1>{heading}</h1>
        <p>
          {mode === "reset"
            ? "Enter your email to receive a reset link."
            : mode === "signup"
              ? "Start building with your team."
              : confirmation
                ? "Your local preview is ready."
                : description}
        </p>
      </header>
      {confirmation ? (
        <div className="auth-detail-confirm" role="status">
          {mode === "sent" ? <Mail className="size-7" /> : <Check className="size-7" />}
          <Alert variant="success" className="text-left">
            <Check />
            <AlertTitle>
              {mode === "sent" ? "Demo link prepared" : "Demo sign-in complete"}
            </AlertTitle>
            <AlertDescription>
              {mode === "sent"
                ? `A demo ${lastAction === "Reset password" ? "reset" : "magic"} link is ready for ${email}.`
                : "You’re signed in to the demo workspace."}
            </AlertDescription>
          </Alert>
          <span>This preview does not send email or create an account.</span>
          {mode === "sent" && (
            <Button
              variant="outline"
              onClick={() => toast("Demo link prepared again", { description: email })}
            >
              Resend link
            </Button>
          )}
          <Button variant="link" onClick={() => setMode("login")}>
            <ArrowLeft />
            Back to sign in
          </Button>
        </div>
      ) : (
        <>
          <form
            className="auth-detail-fields"
            onSubmit={(event) => {
              event.preventDefault();
              setLastAction(mode === "reset" ? "Reset password" : "Sign in");
              setMode(magic || mode === "reset" ? "sent" : "signed");
            }}
          >
            {mode === "signup" && (
              <Field className="gap-2">
                <FieldLabel htmlFor={`${id}-name`}>Full name</FieldLabel>
                <Input id={`${id}-name`} placeholder="Your name" autoComplete="name" required />
              </Field>
            )}
            <Field className="gap-2">
              <FieldLabel htmlFor={`${id}-email`}>
                {magic || mode === "reset" || mode === "signup"
                  ? "Work email"
                  : "Email or username"}
              </FieldLabel>
              <Input
                id={`${id}-email`}
                type={magic || mode !== "login" ? "email" : "text"}
                placeholder={
                  magic || mode !== "login" ? "you@company.com" : "Enter email or username"
                }
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>
            {mode !== "reset" && !magic && (
              <Field className="gap-2">
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor={`${id}-password`}>Password</FieldLabel>
                  {mode === "login" && (
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto p-0 text-xs"
                      onClick={() => setMode("reset")}
                    >
                      Forgot password?
                    </Button>
                  )}
                </div>
                <div className="relative">
                  <Input
                    className="pr-10"
                    id={`${id}-password`}
                    placeholder="Enter password"
                    type={show ? "text" : "password"}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    minLength={mode === "signup" ? 8 : undefined}
                    required
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="absolute right-0 top-0 size-8 text-muted-foreground"
                    aria-label={show ? "Hide password" : "Show password"}
                    onClick={() => setShow(!show)}
                  >
                    {show ? <EyeOff /> : <Eye />}
                  </Button>
                </div>
              </Field>
            )}
            {magic && mode === "login" && (
              <p className="auth-detail-hint">Your magic link stays active for 15 minutes.</p>
            )}
            <Button className="h-8 w-full rounded-lg" type="submit">
              {mode === "reset"
                ? "Send reset link"
                : mode === "signup"
                  ? "Create account"
                  : magic
                    ? "Send magic link"
                    : "Sign in"}
            </Button>
          </form>
          {mode === "login" ? (
            <>
              <FormDivider>{magic ? "or" : "Or continue with"}</FormDivider>
              <div
                className={
                  providerRow ? "auth-detail-providers-row" : "auth-detail-providers-stack"
                }
              >
                {providers.map((provider) => (
                  <Button
                    key={provider}
                    variant="outline"
                    className="h-8 rounded-lg"
                    onClick={() =>
                      toast(`${provider} sign-in selected`, {
                        description: "Connect your own authentication service to use this method.",
                      })
                    }
                  >
                    <OAuthIcon provider={provider} />
                    {providerRow ? provider : `Continue with ${provider}`}
                  </Button>
                ))}
              </div>
              {signup && (
                <p className="auth-detail-signup">
                  Need an account?{" "}
                  <Button
                    variant="link"
                    className="h-auto p-0 text-xs font-medium"
                    onClick={() => setMode("signup")}
                  >
                    Sign up
                  </Button>
                </p>
              )}
            </>
          ) : (
            <Button variant="link" className="self-center text-xs" onClick={() => setMode("login")}>
              <ArrowLeft />
              Back to sign in
            </Button>
          )}
        </>
      )}
    </div>
  );
}
