import { useId, useState } from "react";
import { ArrowLeft, Check, Eye, EyeOff, Mail, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Frame, FramePanel } from "@/components/reui/frame";
import { Badge } from "@/components/reui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AuthMark, FormDivider, OAuthIcon, type Provider } from "./auth-shared";
import { PasswordAuthForm } from "./auth-form";
import stripe from "./assets/card-brands/stripe.svg";
import openai from "./assets/card-brands/openai.svg";
import anthropic from "./assets/card-brands/anthropic.svg";
import resend from "./assets/card-brands/resend.svg";
import "./auth-growth.css";

function CustomerMarks({ extended = false }: { extended?: boolean }) {
  return (
    <ul className="growth-customer-marks" aria-label="Customer brands">
      {[
        [stripe, "Stripe"],
        [openai, "OpenAI"],
        [anthropic, "Anthropic"],
      ].map(([src, name]) => (
        <li key={name}>
          <img src={src} alt="" />
          <span>{name}</span>
        </li>
      ))}
      <li>
        <span className="growth-slack-mark" aria-hidden="true">
          ✣
        </span>
        <span>slack</span>
      </li>
      <li>
        <span className="growth-mint-mark" aria-hidden="true">
          ◈
        </span>
        <span>mintlify</span>
      </li>
      <li>
        <img src={resend} alt="" />
        <span>Resend</span>
      </li>
      {extended && (
        <>
          <li>
            <span aria-hidden="true">▲</span>
            <span>Vercel</span>
          </li>
          <li>
            <span aria-hidden="true">◒</span>
            <span>Linear</span>
          </li>
        </>
      )}
    </ul>
  );
}

function LegalLinks({ trial = false }: { trial?: boolean }) {
  const [document, setDocument] = useState("");
  return (
    <>
      <p className="growth-legal">
        {trial ? "By signing up, you agree to our " : "By continuing, you agree to our "}
        <Button type="button" variant="link" onClick={() => setDocument("Terms of Service")}>
          Terms of Service
        </Button>{" "}
        and{" "}
        <Button type="button" variant="link" onClick={() => setDocument("Privacy Policy")}>
          Privacy Policy
        </Button>
        .
      </p>
      <Dialog open={!!document} onOpenChange={(open) => !open && setDocument("")}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{document}</DialogTitle>
            <DialogDescription>
              Sample policy information for this component preview. Add your own organization’s
              policies before using this form in a product.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setDocument("")}>Done</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AccountDialog({ trial = false }: { trial?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" variant="link" onClick={() => setOpen(true)}>
        {trial ? "Start a free trial" : "Sign in"}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{trial ? "Start your free trial" : "Sign in to ReUI"}</DialogTitle>
            <DialogDescription>
              {trial ? "Explore the local account form." : "Continue to your workspace."}
            </DialogDescription>
          </DialogHeader>
          <PasswordAuthForm
            initialMode={trial ? "signup" : "login"}
            title="Welcome back"
            logo={false}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function GrowthForm({ trial = false }: { trial?: boolean }) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [show, setShow] = useState(false);
  const [sent, setSent] = useState(false);
  const providers: Provider[] = trial ? ["Google", "GitHub"] : ["Google", "Apple", "GitHub"];
  const oauth = (
    <div className={trial ? "growth-provider-stack" : "growth-provider-row"}>
      {providers.map((provider) => (
        <Button
          type="button"
          variant="outline"
          key={provider}
          onClick={() =>
            toast(`${provider} sign-in selected`, {
              description: "Connect your authentication provider to complete this flow.",
            })
          }
        >
          <OAuthIcon provider={provider} />
          {trial ? `Continue with ${provider}` : provider}
        </Button>
      ))}
    </div>
  );
  if (sent)
    return (
      <section className="growth-confirmation" role="status">
        <Alert variant="success">
          <Check />
          <AlertTitle>{trial ? "Your trial preview is ready" : "Check your inbox"}</AlertTitle>
          <AlertDescription>
            {trial
              ? `Demo workspace prepared for ${email}.`
              : `A demo sign-in link is ready for ${email}.`}
          </AlertDescription>
        </Alert>
        <p>This local preview does not send email or create an account.</p>
        {!trial && (
          <Button
            variant="outline"
            onClick={() => toast("Demo sign-in link prepared again", { description: email })}
          >
            Resend link
          </Button>
        )}
        <Button variant="link" onClick={() => setSent(false)}>
          <ArrowLeft />
          Back to {trial ? "signup" : "sign in"}
        </Button>
      </section>
    );
  return (
    <div className="growth-form">
      {trial && (
        <>
          {oauth}
          <FormDivider>OR</FormDivider>
        </>
      )}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setSent(true);
        }}
      >
        <Field className="gap-2">
          <FieldLabel className={trial ? "" : "sr-only"} htmlFor={`${id}-email`}>
            {trial ? "Work email" : "Email address"}
          </FieldLabel>
          <InputGroup>
            <InputGroupInput
              id={`${id}-email`}
              required
              type="email"
              placeholder={trial ? "you@company.com" : "Enter your email"}
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            {!trial && (
              <InputGroupAddon>
                <Mail />
              </InputGroupAddon>
            )}
          </InputGroup>
        </Field>
        {trial && (
          <Field className="gap-2">
            <FieldLabel htmlFor={`${id}-password`}>Password</FieldLabel>
            <InputGroup>
              <InputGroupInput
                id={`${id}-password`}
                required
                minLength={8}
                type={show ? "text" : "password"}
                placeholder="8+ characters"
                autoComplete="new-password"
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  aria-label={show ? "Hide password" : "Show password"}
                  size="icon-xs"
                  onClick={() => setShow(!show)}
                >
                  {show ? <EyeOff /> : <Eye />}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </Field>
        )}
        <Button type="submit" className="w-full">
          {trial ? "Start free trial" : "Send sign-in link"}
          {trial && <ArrowRight />}
        </Button>
      </form>
      {!trial && (
        <>
          <p className="growth-or">Or continue with</p>
          {oauth}
          <p className="growth-trial-link">
            New here? <AccountDialog trial />
          </p>
        </>
      )}
      {trial && <LegalLinks trial />}
    </div>
  );
}

export function FreeTrialSignup() {
  return (
    <main className="auth-growth auth-trial-signup">
      <div className="growth-gradient" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <header className="growth-page-header">
        <AuthMark wordmark />
        <span>
          Already on ReUI? <AccountDialog />
        </span>
      </header>
      <div className="growth-trial-layout">
        <section className="growth-marketing">
          <Badge variant="outline">
            <span className="size-1.5 rounded-full bg-current" />
            Global product teams ship on ReUI
          </Badge>
          <h1>
            The UI layer to
            <br />
            grow your <em>product</em>.
          </h1>
          <p>
            Bring your ideas to life with thoughtfully crafted components. A stronger foundation for
            everything your team is building next.
          </p>
        </section>
        <Frame className="growth-trial-frame">
          <FramePanel>
            <header className="growth-form-heading">
              <h2>Start your 14-day trial</h2>
              <p>No credit card. No sales call. Just ship.</p>
            </header>
            <GrowthForm trial />
          </FramePanel>
        </Frame>
      </div>
      <footer className="growth-trial-trust">
        <p>TEAMS SHIPPING WITH REUI</p>
        <CustomerMarks />
      </footer>
    </main>
  );
}

export function BlueprintMagicLink() {
  return (
    <main className="auth-growth auth-blueprint-login dark">
      <div className="growth-blueprint-grid" aria-hidden="true" />
      <div className="growth-blueprint-group">
        <div className="growth-blueprint-outline">
          <i />
          <i />
          <i />
          <i />
          <Frame className="growth-blueprint-frame" stacked dense>
            <FramePanel className="growth-blueprint-form">
              <header className="growth-form-heading">
                <AuthMark outlined />
                <h1>Sign in to ReUI</h1>
                <p>Enter your email to receive a sign-in link.</p>
              </header>
              <GrowthForm />
            </FramePanel>
            <FramePanel className="growth-blueprint-trust">
              <p>Shipping with teams at</p>
              <CustomerMarks extended />
            </FramePanel>
          </Frame>
        </div>
        <LegalLinks />
      </div>
    </main>
  );
}
