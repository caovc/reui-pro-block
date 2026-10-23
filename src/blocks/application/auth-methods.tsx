import { useId, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Frame, FramePanel } from "@/components/reui/frame";
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PasswordAuthForm } from "./auth-form";
import { AuthMark } from "./auth-shared";
import { RotatingCustomerPanel } from "./auth-grid-review";
import "./auth-methods.css";

type Method = "choose" | "email" | "saml" | "backup" | "signup";

function MethodPicker() {
  const id = useId();
  const [method, setMethod] = useState<Method>("choose");
  const [value, setValue] = useState("");
  const [notice, setNotice] = useState("");
  const select = (next: Method) => {
    setMethod(next);
    setValue("");
    setNotice("");
  };
  if (method === "signup")
    return (
      <div className="auth-method-signup">
        <PasswordAuthForm title="Create your account" initialMode="signup" providers={["Google"]} />
        <Button variant="link" onClick={() => select("choose")}>
          <ArrowLeft data-icon="inline-start" />
          Back to login
        </Button>
      </div>
    );
  return (
    <div className="auth-method-picker">
      <header>
        <AuthMark large />
        <h1>
          {method === "choose"
            ? "Log in to Bricklane"
            : method === "email"
              ? "What’s your email address?"
              : method === "saml"
                ? "Your organization’s sign-in"
                : "Use a backup code"}
        </h1>
      </header>
      {notice ? (
        <div role="status">
          <Alert>
            <AlertTitle>
              {method === "email" ? "Check your inbox" : "Local sign-in preview"}
            </AlertTitle>
            <AlertDescription>{notice}</AlertDescription>
          </Alert>
          <Button variant="link" onClick={() => setNotice("")}>
            Try another method
          </Button>
        </div>
      ) : method === "choose" ? (
        <div className="auth-method-buttons">
          <Button
            onClick={() =>
              setNotice(
                "Google sign-in selected. This preview does not contact a provider or create a session.",
              )
            }
          >
            Continue with Google
          </Button>
          <Button variant="outline" onClick={() => select("email")}>
            Continue with email
          </Button>
          <Button variant="outline" onClick={() => select("saml")}>
            Continue with SAML SSO
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              setNotice(
                "Passkey sign-in selected. No credential has been requested or created in this local preview.",
              )
            }
          >
            Log in with passkey
          </Button>
          <Button variant="outline" onClick={() => select("backup")}>
            Use backup code
          </Button>
        </div>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setNotice(
              method === "email"
                ? `A demo magic link is ready for ${value}. No email was sent.`
                : method === "saml"
                  ? `Organization sign-in selected for ${value.split("@")[1]}. This preview does not start an SSO session.`
                  : "Backup code submitted to the local demo. No account was verified.",
            );
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor={id}>
                {method === "backup" ? "Backup code" : "Email address"}
              </FieldLabel>
              <Input
                id={id}
                type={method === "backup" ? "text" : "email"}
                autoComplete={method === "backup" ? "one-time-code" : "email"}
                inputMode={method === "backup" ? "numeric" : "email"}
                pattern={method === "backup" ? "[0-9]{8}" : undefined}
                maxLength={method === "backup" ? 8 : undefined}
                placeholder={method === "backup" ? "8-digit code" : "you@company.com"}
                value={value}
                onChange={(event) => setValue(event.target.value)}
                required
              />
            </Field>
            <Button type="submit">
              {method === "email"
                ? "Continue with email"
                : method === "saml"
                  ? "Continue with SSO"
                  : "Verify backup code"}
            </Button>
          </FieldGroup>
        </form>
      )}
      {method !== "choose" && (
        <Button variant="link" onClick={() => select("choose")}>
          <ArrowLeft data-icon="inline-start" />
          Back to login
        </Button>
      )}
      {method === "choose" && (
        <footer>
          Don’t have an account?{" "}
          <Button variant="link" onClick={() => select("signup")}>
            Sign up
          </Button>
          {" or "}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="link">Learn more</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Choose a sign-in method</DialogTitle>
                <DialogDescription>
                  Use email for a one-time sign-in link, your organization’s SSO for a managed
                  workspace, or a passkey when your account has one.
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </footer>
      )}
    </div>
  );
}

export function GridReviewLogin() {
  return (
    <main className="auth-grid-login">
      <section className="auth-grid-form">
        <PasswordAuthForm
          title="Sign in"
          description="Enter your work email to get a magic link."
          magic
          magicArrow
          providers={["Google", "Apple", "GitHub"]}
          providerRow={false}
          signup={false}
        />
      </section>
      <RotatingCustomerPanel />
    </main>
  );
}

export function MultiMethodLogin() {
  return (
    <main className="auth-method-login">
      <Frame className="auth-method-frame">
        <FramePanel>
          <section className="auth-method-form">
            <MethodPicker />
          </section>
          <RotatingCustomerPanel />
        </FramePanel>
        <span className="auth-method-corner auth-method-corner-left" aria-hidden="true">
          +
        </span>
        <span className="auth-method-corner auth-method-corner-right" aria-hidden="true">
          +
        </span>
      </Frame>
    </main>
  );
}
