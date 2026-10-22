import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Fingerprint,
  Mail,
  ShieldCheck,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Brand, Person, toast } from "./shared";
import type { BlockProps } from "@/data/types";
import "./auth.css";
type Provider = "Google" | "Apple" | "GitHub";
type AuthConfig = {
  providers: Provider[];
  magic?: boolean;
  split?: boolean;
  photo?: boolean;
  quote?: boolean;
  framed?: boolean;
  methods?: boolean;
  signup?: boolean;
  backdrop?: boolean;
  dark?: boolean;
  logos?: boolean;
  header?: boolean;
  sso?: boolean;
  rotate?: boolean;
  providerRow?: boolean;
};
// Provider and authentication modes come from each public REUI block brief.
const authConfig: Record<string, AuthConfig> = {
  "auth-1": { providers: ["Google", "Apple"], split: true, photo: true },
  "auth-2": {
    providers: ["Google", "Apple", "GitHub"],
    split: true,
    quote: true,
    rotate: true,
  },
  "auth-3": {
    providers: ["Google", "Apple", "GitHub"],
    magic: true,
    split: true,
    quote: true,
  },
  "auth-4": {
    providers: ["Google", "Apple", "GitHub"],
    framed: true,
    providerRow: true,
  },
  "auth-5": {
    providers: ["Google", "GitHub"],
    signup: true,
    split: true,
    logos: true,
  },
  "auth-6": {
    providers: ["Google", "Apple", "GitHub"],
    split: true,
    quote: true,
  },
  "auth-7": {
    providers: ["Google", "Apple", "GitHub"],
    magic: true,
    framed: true,
    dark: true,
    logos: true,
  },
  "auth-8": {
    providers: ["Google", "Apple", "GitHub"],
    backdrop: true,
    framed: true,
  },
  "auth-9": {
    providers: ["Google", "Apple", "GitHub"],
    magic: true,
    split: true,
    quote: true,
    rotate: true,
  },
  "auth-10": {
    providers: ["Google", "Apple", "GitHub"],
    magic: true,
    split: true,
    quote: true,
    framed: true,
  },
  "auth-11": { providers: ["Google", "Apple"], split: true, quote: true },
  "auth-12": {
    providers: ["Google"],
    magic: true,
    split: true,
    quote: true,
    methods: true,
    rotate: true,
  },
  "auth-13": {
    providers: ["Google", "Apple", "GitHub"],
    magic: true,
    split: true,
    photo: true,
  },
  "auth-14": {
    providers: ["Google", "Apple", "GitHub"],
    split: true,
    photo: true,
    sso: true,
  },
  "auth-15": { providers: ["Google", "Apple", "GitHub"], magic: true },
  "auth-16": {
    providers: ["Google", "GitHub"],
    magic: true,
    header: true,
    logos: true,
    sso: true,
  },
  "auth-17": { providers: ["Google"], magic: true, methods: true },
  "auth-18": { providers: ["Google", "Apple"], split: true, quote: true },
  "auth-19": { providers: ["Google", "GitHub"], magic: true, header: true },
  "auth-20": { providers: ["Google", "Apple"], framed: true },
};
function OAuthIcon({ provider }: { provider: Provider }) {
  if (provider === "Google")
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M21.6 12.23c0-.71-.06-1.39-.18-2.04H12v3.86h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.9-1.75 2.98-4.33 2.98-7.34Z"
        />
        <path
          fill="#34A853"
          d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.24-2.5c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.75-5.59-4.11H3.06v2.59A10 10 0 0 0 12 22Z"
        />
        <path
          fill="#FBBC05"
          d="M6.41 13.92A6 6 0 0 1 6.1 12c0-.67.11-1.31.31-1.92V7.49H3.06A10 10 0 0 0 2 12c0 1.61.39 3.14 1.06 4.51l3.35-2.59Z"
        />
        <path
          fill="#EA4335"
          d="M12 5.97c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.94 5.49l3.35 2.59C7.2 7.72 9.4 5.97 12 5.97Z"
        />
      </svg>
    );
  if (provider === "Apple")
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M16.7 12.8c0-2 1.6-3 1.7-3.1-1-1.5-2.6-1.7-3.2-1.7-1.4-.2-2.8.9-3.5.9-.7 0-1.8-.9-3-.8-1.5 0-2.9.9-3.7 2.2-1.6 2.7-.4 6.8 1.1 9 .7 1.1 1.6 2.2 2.8 2.1 1.1 0 1.6-.7 3-.7s1.8.7 3.1.7c1.3 0 2.1-1.1 2.8-2.1.8-1.2 1.2-2.5 1.2-2.5-.1 0-2.3-.9-2.3-4ZM14.4 6.5c.6-.8 1.1-1.9 1-3-.9 0-2.1.6-2.8 1.4-.6.7-1.2 1.8-1.1 2.9 1 .1 2.2-.5 2.9-1.3Z" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.86c-2.78.6-3.37-1.18-3.37-1.18-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.64-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02A9.6 9.6 0 0 1 12 6.83c.85 0 1.71.11 2.51.34 1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
    </svg>
  );
}
function TrustLogos() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm font-semibold tracking-tight opacity-55">
      <span>Layers</span>
      <span>Quotient</span>
      <span>Sisyphus</span>
      <span>Catalog</span>
    </div>
  );
}
export default function AuthBlock({ block }: BlockProps) {
  const config = authConfig[block.id] ?? authConfig["auth-20"];
  const [show, setShow] = useState(false);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState<"login" | "signup" | "reset">(
    config.signup ? "signup" : "login",
  );
  const [method, setMethod] = useState<"picker" | "email" | "sso" | "backup">(
    config.methods ? "picker" : "email",
  );
  const [notice, setNotice] = useState("");
  const [quoteIndex, setQuoteIndex] = useState(0);
  useEffect(() => {
    if (!config.rotate) return;
    const interval = setInterval(() => setQuoteIndex((v) => (v + 1) % 3), 6500);
    return () => clearInterval(interval);
  }, [config.rotate]);
  const quotes = [
    "The best tools get out of your way. Acme helps our team focus on what matters — building something great.",
    "We found our rhythm as a team. There’s less busywork and more time for the ideas that deserve it.",
    "Thoughtful details make all the difference. Our team felt at home from the very first day.",
  ];
  const magic = (Boolean(config.magic) && mode === "login") || method === "sso";
  const showForm = !config.methods || method !== "picker" || mode !== "login";
  const signup = mode === "signup";
  function selectProvider(provider: Provider) {
    setNotice(
      `${provider} sign-in is selected. Connect your authentication adapter to complete sign-in.`,
    );
    toast(`${provider} sign-in selected`, {
      description: "This preview does not contact an authentication provider.",
    });
  }
  const form = (
    <div className="mx-auto flex w-full max-w-[340px] flex-col gap-5">
      <div className="flex justify-center">
        <Brand small />
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-semibold tracking-tight">
          {sent
            ? "Check your inbox"
            : signup
              ? "Start your free trial"
              : mode === "reset"
                ? "Reset your password"
                : method === "sso"
                  ? "Sign in with SSO"
                  : method === "backup"
                    ? "Use a backup code"
                    : config.methods && method === "picker"
                      ? "How would you like to sign in?"
                      : magic
                        ? "Welcome back."
                        : "Back to building."}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {sent
            ? `We sent a secure sign-in link to ${email}.`
            : signup
              ? "Try Acme free for 14 days. No credit card required."
              : mode === "reset"
                ? "Enter your email and we’ll send you a reset link."
                : block.id === "auth-19"
                  ? "Use your approved workspace email to continue."
                  : method === "backup"
                    ? "Enter one of the backup codes you saved."
                    : "Sign in to your account to continue."}
        </p>
      </div>
      {sent ? (
        <div className="flex flex-col items-center gap-5 py-4">
          <div className="flex size-14 items-center justify-center rounded-full border bg-muted">
            <Mail className="size-6" />
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Use the link to securely access your workspace. This preview shows
            the confirmation state without sending an email.
          </p>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => toast.success("Demo sign-in link requested again")}
          >
            Resend email
          </Button>
          <Button
            variant="link"
            onClick={() => {
              setSent(false);
              if (config.methods) setMethod("picker");
            }}
          >
            <ArrowLeft />
            Back to sign in
          </Button>
        </div>
      ) : (
        <>
          {(method === "picker" || !config.methods) && mode !== "reset" && (
            <div
              className={
                config.providerRow
                  ? "grid grid-cols-3 gap-2"
                  : "flex flex-col gap-2"
              }
            >
              {config.providers.map((provider) => (
                <Button
                  key={provider}
                  variant="outline"
                  className="w-full"
                  aria-label={`Continue with ${provider}`}
                  onClick={() => selectProvider(provider)}
                >
                  <OAuthIcon provider={provider} />
                  {config.providerRow ? provider : `Continue with ${provider}`}
                </Button>
              ))}
            </div>
          )}
          {config.methods && method === "picker" && mode === "login" && (
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setMethod("email");
                  setNotice("");
                }}
              >
                <Mail />
                Continue with email
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  setNotice(
                    "Passkey sign-in selected. Connect a WebAuthn authentication service to create or verify credentials.",
                  )
                }
              >
                <Fingerprint />
                Sign in with passkey
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setMethod("sso");
                  setNotice("");
                }}
              >
                <ShieldCheck />
                Continue with SAML SSO
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setMethod("backup");
                  setNotice("");
                }}
              >
                Use a backup code
              </Button>
            </div>
          )}
          {config.sso && !config.methods && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setMethod(method === "sso" ? "email" : "sso");
                setNotice("");
              }}
            >
              <ShieldCheck />
              {method === "sso"
                ? "Back to email sign-in"
                : "Single sign-on (SSO)"}
            </Button>
          )}
          {showForm && (
            <>
              {config.providers.length > 0 &&
                !config.methods &&
                mode !== "reset" && (
                  <div className="flex items-center gap-3">
                    <Separator className="flex-1" />
                    <span className="text-[11px] text-muted-foreground">
                      Or with email
                    </span>
                    <Separator className="flex-1" />
                  </div>
                )}
              {config.methods && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="self-start px-0"
                  onClick={() => {
                    setMethod("picker");
                    setMode("login");
                  }}
                >
                  <ArrowLeft />
                  All sign-in methods
                </Button>
              )}
              <form
                className="flex flex-col gap-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (method === "backup") {
                    setNotice(
                      "Backup code checked in this local preview. Connect your authentication service to verify real codes.",
                    );
                  } else if (magic || mode === "reset") {
                    setSent(true);
                  } else {
                    setNotice(
                      signup
                        ? "Your demo account is ready."
                        : "You are signed in to the demo workspace.",
                    );
                    toast.success(
                      signup
                        ? "Your demo account is ready"
                        : "Signed in to the demo workspace",
                    );
                  }
                }}
              >
                <FieldGroup>
                  {signup && (
                    <Field>
                      <FieldLabel htmlFor={`${block.id}-name`}>
                        Full name
                      </FieldLabel>
                      <Input
                        id={`${block.id}-name`}
                        placeholder="Alex Morgan"
                        required
                      />
                    </Field>
                  )}
                  {method === "backup" ? (
                    <Field>
                      <FieldLabel htmlFor={`${block.id}-backup`}>
                        Backup code
                      </FieldLabel>
                      <Input
                        id={`${block.id}-backup`}
                        placeholder="XXXX-XXXX"
                        autoComplete="one-time-code"
                        minLength={8}
                        required
                      />
                    </Field>
                  ) : (
                    <Field>
                      <FieldLabel htmlFor={`${block.id}-email`}>
                        {magic || signup || mode === "reset"
                          ? "Work email"
                          : "Email or username"}
                      </FieldLabel>
                      <Input
                        id={`${block.id}-email`}
                        type={
                          magic || signup || mode === "reset" ? "email" : "text"
                        }
                        placeholder={
                          magic || signup
                            ? "you@company.com"
                            : "Email or username"
                        }
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </Field>
                  )}
                  {!magic && mode !== "reset" && method !== "backup" && (
                    <Field>
                      <div className="flex items-center justify-between">
                        <FieldLabel htmlFor={`${block.id}-pass`}>
                          Password
                        </FieldLabel>
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs"
                          onClick={() => setMode("reset")}
                        >
                          Forgot password?
                        </Button>
                      </div>
                      <div className="relative">
                        <Input
                          id={`${block.id}-pass`}
                          type={show ? "text" : "password"}
                          placeholder="Enter your password"
                          minLength={6}
                          autoComplete={
                            signup ? "new-password" : "current-password"
                          }
                          required
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="absolute right-1 top-1"
                          aria-label={show ? "Hide password" : "Show password"}
                          onClick={() => setShow(!show)}
                        >
                          {show ? <EyeOff /> : <Eye />}
                        </Button>
                      </div>
                    </Field>
                  )}
                  {!magic &&
                    mode === "login" &&
                    ["auth-4", "auth-8", "auth-14", "auth-20"].includes(
                      block.id,
                    ) && (
                      <div className="flex items-center gap-2">
                        <Checkbox id={`${block.id}-remember`} />
                        <label
                          className="text-xs"
                          htmlFor={`${block.id}-remember`}
                        >
                          Keep me signed in
                        </label>
                      </div>
                    )}
                </FieldGroup>
                <Button type="submit" className="w-full">
                  {method === "backup"
                    ? "Verify backup code"
                    : method === "sso"
                      ? "Continue with SSO"
                      : mode === "reset"
                        ? "Send reset link"
                        : signup
                          ? "Create account"
                          : block.id === "auth-16"
                            ? "Continue"
                            : magic
                              ? "Send magic link"
                              : "Sign in"}
                  <ArrowRight data-icon="inline-end" />
                </Button>
              </form>
            </>
          )}
          <p className="text-center text-xs text-muted-foreground">
            {signup ? "Already have an account?" : "New here?"}{" "}
            <Button
              variant="link"
              className="h-auto p-0 text-xs"
              onClick={() => {
                setMode(signup ? "login" : "signup");
                setMethod("email");
              }}
            >
              {signup ? "Sign in" : "Create an account"}
            </Button>
          </p>
        </>
      )}
      {notice && (
        <Alert>
          <ShieldCheck />
          <AlertTitle>Sign-in preview</AlertTitle>
          <AlertDescription className="text-xs">{notice}</AlertDescription>
        </Alert>
      )}
      <p className="text-center text-[10px] leading-relaxed text-muted-foreground">
        By continuing, you agree to our Terms of Service
        <br />
        and Privacy Policy.
      </p>
      {config.logos && !config.split && (
        <div className="mt-3 border-t pt-5">
          <p className="mb-4 text-center text-[10px] text-muted-foreground">
            Trusted by teams that build great things.
          </p>
          <TrustLogos />
        </div>
      )}
    </div>
  );
  return (
    <div
      className={`reui-auth relative min-h-[680px] overflow-hidden bg-background ${config.dark ? "dark text-foreground" : ""}`}
    >
      {config.header && (
        <header className="relative flex items-center justify-between border-b px-7 py-4">
          <Brand />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setMode("signup");
              setMethod("email");
            }}
          >
            Create a workspace
            <ArrowRight />
          </Button>
        </header>
      )}
      {config.backdrop && (
        <img
          src="https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1600&q=85"
          alt="Quiet mountain lake"
          className="absolute inset-0 size-full object-cover blur-[3px]"
          loading="lazy"
        />
      )}
      <div
        className={`relative ${config.split ? "grid min-h-[680px] lg:grid-cols-2" : "flex min-h-[640px] items-center justify-center p-8"}`}
      >
        {config.split && (
          <aside
            className={`relative hidden min-h-[680px] flex-col justify-between overflow-hidden p-10 lg:flex ${config.photo ? "bg-foreground text-background" : "bg-muted/40"}`}
          >
            {config.photo ? (
              <img
                src={`https://images.unsplash.com/${block.id === "auth-14" ? "photo-1486406146926-c627a92ad1ab" : "photo-1464822759023-fed622ff2c3b"}?auto=format&fit=crop&w=1000&q=85`}
                alt={
                  block.id === "auth-14"
                    ? "Architectural view from the workspace"
                    : "Sunlight over a mountain peak"
                }
                className="absolute inset-0 size-full object-cover opacity-75"
                loading="lazy"
              />
            ) : (
              <div className="reui-auth-dots absolute inset-0 opacity-50" />
            )}
            <div className="relative">
              <Brand />
            </div>
            <div className="relative my-12">
              {config.quote ? (
                <>
                  <div className="mb-6 flex gap-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} className="size-4 fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-3xl font-medium leading-snug tracking-tight">
                    “{quotes[config.rotate ? quoteIndex : 0]}”
                  </blockquote>
                  <div className="mt-8">
                    <Person
                      name={
                        ["Sarah Mitchell", "James Chen", "Rachel Torres"][
                          config.rotate ? quoteIndex : 0
                        ]
                      }
                      sub="Founder & CEO, Layers"
                    />
                  </div>
                  {config.rotate && (
                    <div className="mt-6 flex gap-2">
                      {quotes.map((_, i) => (
                        <button
                          className={`size-1.5 rounded-full ${i === quoteIndex ? "bg-foreground" : "bg-foreground/20"}`}
                          key={i}
                          aria-label={`Show testimonial ${i + 1}`}
                          aria-pressed={quoteIndex === i}
                          onClick={() => setQuoteIndex(i)}
                        />
                      ))}
                    </div>
                  )}
                  <div className="mt-12 border-t border-current/10 pt-6">
                    <TrustLogos />
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-4xl font-medium leading-tight tracking-tight">
                    {config.signup
                      ? "Your next great idea starts here."
                      : "A little structure. A lot of possibility."}
                  </h3>
                  <p className="mt-4 max-w-sm text-sm leading-6 opacity-70">
                    {config.signup
                      ? "One place for your projects, people, and best work. Get started in minutes and build with a little more clarity."
                      : "A thoughtful place to bring your team together and turn your ideas into something great."}
                  </p>
                  {config.signup && (
                    <div className="mt-12">
                      <TrustLogos />
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="relative flex justify-between text-xs opacity-65">
              <span>© 2026 Acme Inc.</span>
              <span>Made for the way you work.</span>
            </div>
          </aside>
        )}
        <div
          className={`relative flex items-center justify-center p-7 sm:p-10 ${!config.split ? "w-full" : ""}`}
        >
          {config.framed ? (
            <Card
              className={`w-full max-w-[430px] py-8 shadow-none ${config.dark ? "border border-dashed border-foreground/30" : ""}`}
            >
              <CardContent>{form}</CardContent>
            </Card>
          ) : (
            form
          )}
        </div>
      </div>
    </div>
  );
}
