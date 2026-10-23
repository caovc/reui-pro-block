import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, KeyRound, Mail } from "lucide-react";
import type { BlockProps } from "@/data/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { AuthMark, FormDivider, OAuthIcon, type Provider } from "./auth-shared";

export default function CenteredAuth({ block }: BlockProps) {
  const passwordCard = block.id === "auth-20";
  const magicPage = block.id === "auth-15";
  const picker = block.id === "auth-17";
  const workspace = block.id === "auth-16";
  const invite = block.id === "auth-19";
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [view, setView] = useState<"login" | "email" | "reset" | "sent" | "signed">("login");
  const [dialog, setDialog] = useState<
    | ""
    | "signup"
    | "invite"
    | "sso"
    | "backup"
    | "Terms"
    | "Privacy Policy"
    | "Docs"
    | "Support"
    | "learn more"
  >("");
  const [dialogDone, setDialogDone] = useState(false);
  const [dialogEmail, setDialogEmail] = useState("");
  function openDialog(value: typeof dialog) {
    setDialogDone(false);
    setDialogEmail("");
    setDialog(value);
  }
  function providerButton(provider: Provider, compact = false) {
    return (
      <Button
        variant="outline"
        className="h-8 w-full rounded-lg shadow-xs"
        key={provider}
        onClick={() =>
          toast(`${provider} sign-in selected`, {
            description: "Demo preview. Connect your own authentication service.",
          })
        }
      >
        <OAuthIcon provider={provider} />
        {compact ? provider : `Continue with ${provider}`}
      </Button>
    );
  }
  function policy(compact = false) {
    return (
      <p className="text-center text-xs leading-5 text-muted-foreground">
        By continuing, you agree to ReUI's{" "}
        <Button
          variant="link"
          className="h-auto p-0 text-xs text-foreground underline underline-offset-4"
          onClick={() => openDialog("Terms")}
        >
          {compact ? "Terms" : "Terms of Service"}
        </Button>{" "}
        and{" "}
        <Button
          variant="link"
          className="h-auto p-0 text-xs text-foreground underline underline-offset-4"
          onClick={() => openDialog("Privacy Policy")}
        >
          Privacy Policy
        </Button>
        .
      </p>
    );
  }
  function emailField({
    label = "Work email",
    placeholder = "you@company.com",
    icon = false,
    hidden = false,
    username = false,
  } = {}) {
    return (
      <Field className="gap-2">
        <FieldLabel
          className={hidden ? "sr-only" : "text-sm font-medium"}
          htmlFor={`${block.id}-email`}
        >
          {label}
        </FieldLabel>
        <div className="relative">
          {icon && (
            <Mail
              aria-hidden="true"
              className="pointer-events-none absolute left-2.5 top-2 size-4 text-muted-foreground"
            />
          )}
          <Input
            id={`${block.id}-email`}
            type={username ? "text" : "email"}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="username"
            placeholder={placeholder}
            required
            className={cn("h-8 rounded-lg shadow-xs", icon && "pl-8")}
          />
        </div>
      </Field>
    );
  }
  function confirmation() {
    return (
      <div className="flex flex-col items-center gap-5 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <Mail className="size-5" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Check your inbox</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          We sent a secure sign-in link to {email}.
        </p>
        <p className="text-xs text-muted-foreground">Demo confirmation. No email was sent.</p>
        <Button
          variant="outline"
          className="h-8 w-full"
          onClick={() => toast.success("Demo link requested again")}
        >
          Resend email
        </Button>
        <Button variant="ghost" className="h-8" onClick={() => setView("login")}>
          <ArrowLeft />
          Back to sign in
        </Button>
      </div>
    );
  }
  const dialogUi = (
    <Dialog
      open={Boolean(dialog)}
      onOpenChange={(open) => {
        if (!open) setDialog("");
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {dialog === "signup"
              ? "Create a workspace"
              : dialog === "invite"
                ? "Request workspace access"
                : dialog === "sso"
                  ? "Sign in with SAML SSO"
                  : dialog === "backup"
                    ? "Use a backup code"
                    : dialog}
          </DialogTitle>
          <DialogDescription>
            {["signup", "invite", "sso", "backup"].includes(dialog)
              ? "Continue with your workspace details."
              : "Information for this independent component preview."}
          </DialogDescription>
        </DialogHeader>
        {["signup", "invite", "sso", "backup"].includes(dialog) ? (
          dialogDone ? (
            <div className="py-5 text-center">
              <Check className="mx-auto mb-3 size-7" />
              <h2 className="font-medium">
                {dialog === "invite"
                  ? "Access request recorded"
                  : dialog === "signup"
                    ? "Your demo workspace is ready"
                    : "Demo verification complete"}
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                This action stays in the preview. No account, invitation or authentication request
                was sent.
              </p>
              <Button className="mt-5" onClick={() => setDialog("")}>
                Done
              </Button>
            </div>
          ) : (
            <form
              className="flex flex-col gap-5"
              onSubmit={(event) => {
                event.preventDefault();
                setDialogDone(true);
              }}
            >
              {dialog === "signup" && (
                <Field>
                  <FieldLabel htmlFor="auth-workspace-name">Workspace name</FieldLabel>
                  <Input id="auth-workspace-name" placeholder="Your team" required />
                </Field>
              )}
              <Field>
                <FieldLabel htmlFor="auth-dialog-email">
                  {dialog === "backup" ? "Backup code" : "Work email"}
                </FieldLabel>
                <Input
                  id="auth-dialog-email"
                  type={dialog === "backup" ? "text" : "email"}
                  value={dialogEmail}
                  onChange={(event) => setDialogEmail(event.target.value)}
                  placeholder={dialog === "backup" ? "XXXX-XXXX" : "you@company.com"}
                  minLength={dialog === "backup" ? 8 : undefined}
                  required
                  autoComplete={dialog === "backup" ? "one-time-code" : "email"}
                />
              </Field>
              <Button type="submit">
                {dialog === "invite"
                  ? "Request invite"
                  : dialog === "signup"
                    ? "Create workspace"
                    : dialog === "backup"
                      ? "Verify backup code"
                      : "Continue with SSO"}
                <ArrowRight data-icon="inline-end" />
              </Button>
            </form>
          )
        ) : (
          <div className="space-y-4 text-sm leading-6 text-muted-foreground">
            <p>
              These examples demonstrate sign-in layouts and local interface states. Add your own
              account service, privacy policy and terms when using them in a product.
            </p>
            <Button variant="outline" asChild>
              <a href="https://github.com/caovc/reui-pro-block" target="_blank" rel="noreferrer">
                Project documentation
                <ArrowRight data-icon="inline-end" />
              </a>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  if (passwordCard)
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-background px-6 py-12 text-foreground">
        <div className="w-full max-w-[420px]">
          <Card className="rounded-2xl py-8 shadow-xs">
            <CardContent className="px-8">
              {view === "sent" ? (
                confirmation()
              ) : view === "signed" ? (
                <div className="space-y-5 py-10 text-center">
                  <Check className="mx-auto size-9" />
                  <h1 className="text-xl font-semibold">Welcome back</h1>
                  <p className="text-sm text-muted-foreground">
                    You’re signed in to the demo workspace.
                  </p>
                  <Button variant="outline" onClick={() => setView("login")}>
                    Back to sign in
                  </Button>
                </div>
              ) : (
                <>
                  <div className="mb-5 flex justify-center">
                    <AuthMark />
                  </div>
                  <h1 className="text-center text-xl font-semibold tracking-tight">
                    {view === "reset" ? "Reset your password" : "Welcome back"}
                  </h1>
                  <p className="mt-2 text-center text-sm text-muted-foreground">
                    {view === "reset"
                      ? "Enter your email to receive a reset link."
                      : "Sign in to continue to your workspace."}
                  </p>
                  {view !== "reset" && (
                    <>
                      <div className="my-7 grid grid-cols-2 gap-3">
                        {providerButton("Google", true)}
                        {providerButton("Apple", true)}
                      </div>
                      <FormDivider>Or sign in with email</FormDivider>
                    </>
                  )}
                  <form
                    className="mt-6 flex flex-col gap-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                      setView(view === "reset" ? "sent" : "signed");
                    }}
                  >
                    {emailField({
                      label: view === "reset" ? "Work email" : "Email or username",
                      placeholder: view === "reset" ? "you@company.com" : "Email or username",
                      username: view !== "reset",
                    })}
                    {view !== "reset" && (
                      <Field className="gap-2">
                        <div className="flex items-center justify-between">
                          <FieldLabel
                            htmlFor={`${block.id}-password`}
                            className="text-sm font-medium"
                          >
                            Password
                          </FieldLabel>
                          <Button
                            variant="link"
                            className="h-auto p-0 text-xs text-muted-foreground"
                            type="button"
                            onClick={() => setView("reset")}
                          >
                            Forgot password?
                          </Button>
                        </div>
                        <div className="relative">
                          <Input
                            id={`${block.id}-password`}
                            className="h-8 rounded-lg pr-9 shadow-xs"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            minLength={6}
                            required
                            autoComplete="current-password"
                          />
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="absolute right-1 top-1 h-6 w-6"
                            type="button"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            aria-pressed={showPassword}
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="size-3.5" />
                            ) : (
                              <Eye className="size-3.5" />
                            )}
                          </Button>
                        </div>
                      </Field>
                    )}
                    <Button className="mt-1 h-8 w-full rounded-lg" type="submit">
                      {view === "reset" ? "Send reset link" : "Sign in"}
                    </Button>
                  </form>
                </>
              )}
            </CardContent>
          </Card>
          <div className="mt-5 text-center text-sm text-muted-foreground">
            {view === "reset" ? (
              <Button variant="ghost" size="sm" onClick={() => setView("login")}>
                Back to sign in
              </Button>
            ) : (
              <>
                Don't have an account?{" "}
                <Button
                  variant="link"
                  className="h-auto p-0 text-sm text-foreground"
                  onClick={() => openDialog("signup")}
                >
                  Create account
                </Button>
              </>
            )}
          </div>
        </div>
        {dialogUi}
      </div>
    );

  if (picker)
    return (
      <div className="min-h-svh bg-background px-6 pb-12 pt-[15vh] text-foreground">
        <div className="mx-auto flex w-full max-w-[320px] flex-col items-center">
          <AuthMark large />
          {view === "sent" ? (
            <div className="mt-9 w-full">{confirmation()}</div>
          ) : (
            <>
              <h1 className="mt-7 text-center text-xl font-medium tracking-tight">
                {view === "email" ? "What's your email address?" : "Log in to ReUI"}
              </h1>
              {view === "email" ? (
                <>
                  <form
                    className="mt-8 flex w-full flex-col gap-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                      setView("sent");
                    }}
                  >
                    {emailField({
                      label: "Email address",
                      placeholder: "Enter your email address...",
                      hidden: true,
                    })}
                    <Button className="h-8" type="submit">
                      Continue with email
                    </Button>
                  </form>
                  <Button variant="ghost" className="mt-5 h-8" onClick={() => setView("login")}>
                    Back to login
                  </Button>
                </>
              ) : (
                <>
                  <div className="mt-8 flex w-full flex-col gap-4">
                    <Button
                      className="h-8 rounded-lg"
                      onClick={() =>
                        toast("Google sign-in selected", {
                          description: "Demo preview. No provider request was sent.",
                        })
                      }
                    >
                      Continue with Google
                    </Button>
                    <Button
                      className="h-8 rounded-lg"
                      variant="outline"
                      onClick={() => setView("email")}
                    >
                      Continue with email
                    </Button>
                    <Button
                      className="h-8 rounded-lg"
                      variant="outline"
                      onClick={() => openDialog("sso")}
                    >
                      Continue with SAML SSO
                    </Button>
                    <Button
                      className="h-8 rounded-lg"
                      variant="outline"
                      onClick={() =>
                        toast("Passkey sign-in selected", {
                          description: "Connect your WebAuthn service to verify credentials.",
                        })
                      }
                    >
                      Log in with passkey
                    </Button>
                    <Button
                      className="h-8 rounded-lg"
                      variant="outline"
                      onClick={() => openDialog("backup")}
                    >
                      Use backup code
                    </Button>
                  </div>
                  <p className="mt-6 text-center text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <Button
                      variant="link"
                      className="h-auto p-0 text-sm underline underline-offset-4"
                      onClick={() => openDialog("signup")}
                    >
                      Sign up
                    </Button>{" "}
                    or{" "}
                    <Button
                      variant="link"
                      className="h-auto p-0 text-sm underline underline-offset-4"
                      onClick={() => openDialog("learn more")}
                    >
                      learn more
                    </Button>
                  </p>
                </>
              )}
            </>
          )}
        </div>
        {dialogUi}
      </div>
    );

  if (magicPage)
    return (
      <div className="flex min-h-svh flex-col items-center bg-background px-6 pb-8 pt-10 text-foreground">
        <AuthMark wordmark />
        <main className="w-full max-w-[352px] flex-1 pb-16 pt-16">
          {view === "sent" ? (
            confirmation()
          ) : (
            <>
              <h1 className="text-center text-[32px] font-semibold leading-tight tracking-tight">
                Sign in
              </h1>
              <p className="mt-1 text-center text-base text-muted-foreground">
                Enter your work email to get a magic link.
              </p>
              <form
                className="mt-8"
                onSubmit={(event) => {
                  event.preventDefault();
                  setView("sent");
                }}
              >
                {emailField({ hidden: true, icon: true })}
                <p className="mt-2 text-sm text-muted-foreground">
                  We'll email a secure sign-in link.
                </p>
                <Button className="mt-5 h-8 w-full rounded-lg" type="submit">
                  Send magic link
                  <ArrowRight data-icon="inline-end" />
                </Button>
              </form>
              <div className="my-7">
                <FormDivider>Or continue with</FormDivider>
              </div>
              <div className="flex flex-col gap-3">
                {(["Google", "Apple", "GitHub"] as Provider[]).map((provider) =>
                  providerButton(provider),
                )}
              </div>
            </>
          )}
        </main>
        <footer className="w-full max-w-[520px] text-center text-xs leading-5 text-muted-foreground">
          <p>
            By proceeding, you acknowledge that you have read, understood, and agree to ReUI's{" "}
            <Button
              variant="link"
              className="h-auto p-0 text-xs underline underline-offset-4"
              onClick={() => openDialog("Terms")}
            >
              Terms and Conditions
            </Button>
            , including our sign-in and account access policies.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-4">
            <span>Bricklane · Independent demo</span>
            {(["Privacy Policy", "Docs", "Support"] as const).map((label) => (
              <Button
                variant="link"
                className="h-auto p-0 text-xs underline underline-offset-4"
                key={label}
                onClick={() => openDialog(label)}
              >
                {label}
              </Button>
            ))}
          </div>
        </footer>
        {dialogUi}
      </div>
    );

  return (
    <div className="flex min-h-[800px] flex-col bg-background text-foreground">
      <header className="flex items-center justify-between gap-4 px-6 py-6 sm:px-10">
        <AuthMark wordmark />
        <div className="flex items-center gap-2 text-sm">
          <span className="hidden text-muted-foreground sm:inline">
            {invite ? "Need workspace access?" : "Not on ReUI yet?"}
          </span>
          <Button
            variant="link"
            className="h-auto p-0 text-sm text-foreground"
            onClick={() => openDialog(invite ? "invite" : "signup")}
          >
            {invite ? "Request invite" : "Create a workspace"}
          </Button>
        </div>
      </header>
      <main
        className={cn("flex w-full flex-1 flex-col items-center px-6", invite ? "pt-20" : "pt-11")}
      >
        <div className={cn("w-full", invite ? "max-w-[420px]" : "max-w-[384px]")}>
          {invite ? (
            <>
              <Card className="rounded-2xl py-9 shadow-none">
                <CardContent className="px-9">
                  {view === "sent" ? (
                    confirmation()
                  ) : (
                    <>
                      <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
                      <p className="mt-1 text-sm leading-5 text-muted-foreground">
                        Use your approved workspace email to receive a secure sign-in link.
                      </p>
                      <div className="mb-6 mt-11 flex flex-col gap-3">
                        {providerButton("Google")}
                        {providerButton("GitHub")}
                      </div>
                      <FormDivider />
                      <form
                        className="mt-6"
                        onSubmit={(event) => {
                          event.preventDefault();
                          setView("sent");
                        }}
                      >
                        {emailField({
                          placeholder: "name@company.com",
                          icon: true,
                        })}
                        <Button className="mt-5 h-8 w-full rounded-lg" type="submit">
                          Continue with email
                          <ArrowRight data-icon="inline-end" />
                        </Button>
                      </form>
                    </>
                  )}
                </CardContent>
              </Card>
              <div className="mt-6">{policy(true)}</div>
            </>
          ) : (
            <>
              {view === "sent" ? (
                confirmation()
              ) : (
                <>
                  <h1 className="text-center text-[28px] font-semibold leading-9 tracking-tight">
                    Back to building.
                  </h1>
                  <p className="mt-2 text-center text-sm leading-5 text-muted-foreground">
                    Sign in to sync your team, tasks, and timelines across every surface.
                  </p>
                  <div className="mt-6 flex flex-col gap-2.5">
                    {providerButton("Google")}
                    {providerButton("GitHub")}
                    <Button
                      variant="outline"
                      className="h-8 rounded-lg shadow-xs"
                      onClick={() => openDialog("sso")}
                    >
                      <KeyRound />
                      Use Single Sign-On
                    </Button>
                  </div>
                  <div className="my-7">
                    <FormDivider />
                  </div>
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      setView("sent");
                    }}
                  >
                    {emailField()}
                    <Button className="mt-4 h-8 w-full rounded-lg" type="submit">
                      Continue
                      <ArrowRight data-icon="inline-end" />
                    </Button>
                  </form>
                  <div className="mx-auto mt-6 max-w-[330px]">{policy()}</div>
                </>
              )}
            </>
          )}
        </div>
      </main>
      {workspace && (
        <footer className="px-6 pb-10 pt-20 text-center">
          <p className="mb-6 text-sm text-muted-foreground">
            Joining 14,000+ product teams shipping faster with ReUI
          </p>
          <ul
            aria-label="Customers building with ReUI"
            className="flex flex-wrap items-center justify-center gap-x-9 gap-y-5 text-lg font-semibold tracking-tight text-muted-foreground"
          >
            {["Anthropic", "Supabase", "NVIDIA", "Resend", "OpenAI"].map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </footer>
      )}
      {dialogUi}
    </div>
  );
}
