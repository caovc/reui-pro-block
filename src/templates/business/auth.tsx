import { useState } from "react";
import { Eye, EyeOff, KeyRound, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/reui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Mark, Button, Input, Card, toast } from "./shared";
export function Auth({ id, onLogin }: { id: string; onLogin: () => void }) {
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [reset, setReset] = useState(false);
  const cohort = id === "cohort";
  return (
    <div className={`bt-auth bt-auth-${id}`}>
      <div className="bt-auth-inner">
        <Card>
          <div className="bt-auth-header">
            <Mark />
            <h1>{reset ? "Reset your password" : cohort ? "Sign in" : "Log in to your account"}</h1>
            <p>
              {reset
                ? "Enter your email to get a password reset link."
                : cohort
                  ? "Continue to your workspace."
                  : "Enter your email and password below to log in"}
            </p>
          </div>
          <Alert variant={cohort ? "default" : "info"} className="bt-auth-note">
            {!cohort && <Info />}
            <AlertDescription>
              {reset
                ? "Password recovery is demonstrated locally."
                : "This is a live demo. The credentials are filled in, just click "}
              {!reset && <strong>{cohort ? "Sign in." : "Log in."}</strong>}
            </AlertDescription>
          </Alert>
          {!cohort && !reset && (
            <>
              <div className="bt-social">
                <Button
                  variant="outline"
                  onClick={() => toast("Google sign-in needs your own OAuth configuration")}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M21.6 12.2c0-.7-.1-1.4-.2-2.1H12v4h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.8 3-4.3 3-7.4Z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.9-1.8-5.7-4.2H3v2.6A10 10 0 0 0 12 22Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M6.3 13.9a6 6 0 0 1 0-3.8V7.5H3a10 10 0 0 0 0 9l3.3-2.6ZM12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.8A9.6 9.6 0 0 0 12 2a10 10 0 0 0-9 5.5l3.3 2.6C7.1 7.7 9.4 5.9 12 5.9Z"
                    />
                  </svg>
                  Google
                </Button>
                <Button
                  variant="outline"
                  onClick={() => toast("Apple sign-in needs your own OAuth configuration")}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M17.1 12.4c0-2.6 2.2-3.9 2.3-4-1.3-1.8-3.2-2.1-3.9-2.1-1.7-.2-3.4 1-4.2 1-.9 0-2.3-1-3.7-1-1.9 0-3.6 1.1-4.6 2.8-2 3.4-.5 8.4 1.3 11.1.9 1.3 1.9 2.7 3.3 2.6 1.3 0 1.9-.8 3.6-.8s2.2.8 3.7.8 2.4-1.3 3.2-2.6a12 12 0 0 0 1.5-3.1 4.8 4.8 0 0 1-2.5-4.7ZM14.3 4.6c.7-.9 1.2-2.1 1.1-3.3-1.1 0-2.5.7-3.3 1.6-.7.8-1.3 2-1.2 3.2 1.3.1 2.6-.6 3.4-1.5Z"
                    />
                  </svg>
                  Apple
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={() =>
                  toast("Passkeys can be configured when you connect an authentication provider")
                }
              >
                <KeyRound />
                Sign in with a passkey
              </Button>
              <div className="bt-auth-divider">Or continue with email</div>
            </>
          )}
          <form
            className="bt-form"
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              if (reset) {
                toast.success("Demo reset link requested");
                setReset(false);
                return;
              }
              if (!String(data.get("password")).trim()) {
                setError("Enter your password.");
                return;
              }
              onLogin();
            }}
          >
            <label>
              Email address
              <Input name="email" type="email" defaultValue="nick@reui.io" required />
            </label>
            {!reset && (
              <>
                <label>
                  <span className="bt-password-label">
                    Password
                    <button type="button" onClick={() => setReset(true)}>
                      Forgot {cohort ? "password?" : "your password?"}
                    </button>
                  </span>
                  <span className="bt-password">
                    <Input
                      name="password"
                      type={show ? "text" : "password"}
                      defaultValue="password"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={show ? "Hide password" : "Show password"}
                      onClick={() => setShow(!show)}
                    >
                      {show ? <EyeOff /> : <Eye />}
                    </Button>
                  </span>
                </label>
                <label className="bt-auth-check">
                  <Checkbox />
                  Remember me
                </label>
              </>
            )}
            {error && (
              <p className="bt-login-error" role="alert">
                {error}
              </p>
            )}
            <Button type="submit">
              {reset ? "Send reset link" : cohort ? "Sign in" : "Log in"}
            </Button>
          </form>
          {cohort && !reset && (
            <>
              <div className="bt-auth-divider">Or continue with</div>
              <div className="bt-social">
                {["Google", "Apple", "GitHub"].map((x) => (
                  <Button
                    key={x}
                    variant="outline"
                    onClick={() => toast(`${x} sign-in needs your own OAuth configuration`)}
                  >
                    {x === "Google" && (
                      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                        <path
                          fill="#4285F4"
                          d="M21.6 12.2c0-.7-.1-1.4-.2-2.1H12v4h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.8 3-4.3 3-7.4Z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.9-1.8-5.7-4.2H3v2.6A10 10 0 0 0 12 22Z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M6.3 13.9a6 6 0 0 1 0-3.8V7.5H3a10 10 0 0 0 0 9l3.3-2.6ZM12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.8A9.6 9.6 0 0 0 12 2a10 10 0 0 0-9 5.5l3.3 2.6C7.1 7.7 9.4 5.9 12 5.9Z"
                        />
                      </svg>
                    )}
                    {x === "Apple" && (
                      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                        <path
                          fill="currentColor"
                          d="M17.1 12.4c0-2.6 2.2-3.9 2.3-4-1.3-1.8-3.2-2.1-3.9-2.1-1.7-.2-3.4 1-4.2 1-.9 0-2.3-1-3.7-1-1.9 0-3.6 1.1-4.6 2.8-2 3.4-.5 8.4 1.3 11.1.9 1.3 1.9 2.7 3.3 2.6 1.3 0 1.9-.8 3.6-.8s2.2.8 3.7.8 2.4-1.3 3.2-2.6a12 12 0 0 0 1.5-3.1 4.8 4.8 0 0 1-2.5-4.7ZM14.3 4.6c.7-.9 1.2-2.1 1.1-3.3-1.1 0-2.5.7-3.3 1.6-.7.8-1.3 2-1.2 3.2 1.3.1 2.6-.6 3.4-1.5Z"
                        />
                      </svg>
                    )}
                    {x === "GitHub" && (
                      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                        <path
                          fill="currentColor"
                          d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.86c-2.78.6-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.95 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02A9.6 9.6 0 0 1 12 6.82c.85 0 1.71.11 2.51.34 1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.85-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2z"
                        />
                      </svg>
                    )}
                    {x}
                  </Button>
                ))}
              </div>
            </>
          )}
        </Card>
        {cohort && (
          <p className="bt-auth-foot">
            Need an account?{" "}
            <Button
              variant="link"
              onClick={() => toast("Use the pre-filled demo account to explore the workspace")}
            >
              Sign up
            </Button>
          </p>
        )}
      </div>
      {cohort && (
        <footer className="bt-auth-footer">
          <span>Privacy</span>
          <span>Terms</span>
          <span>Status</span>
        </footer>
      )}
    </div>
  );
}
