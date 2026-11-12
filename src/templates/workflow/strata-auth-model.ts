export type StrataAuthMode = "sign-in" | "sign-up";
export type StrataAuthRoute = "/sign-in" | "/sign-up" | "/";
export type StrataAuthErrors = { identifier?: string; password?: string };

export type StrataAuthValidation =
  | { ok: true; identifier: string }
  | { ok: false; errors: StrataAuthErrors };

/** Local demo validation only. A successful result never contains the password. */
export function validateStrataAuth(
  mode: StrataAuthMode,
  identifier: string,
  password: string,
): StrataAuthValidation {
  const normalized = identifier.trim();
  const errors: StrataAuthErrors = {};
  if (!normalized) {
    errors.identifier = mode === "sign-up" ? "Enter your email." : "Enter your email or username.";
  } else if (mode === "sign-up" && !/^[^\s@]+@[^\s@]+$/.test(normalized)) {
    errors.identifier = "Enter a valid email address.";
  }
  if (!password.length) {
    errors.password = "Enter your password.";
  } else if (mode === "sign-up" && password.length < 8) {
    errors.password = "Use at least 8 characters.";
  }
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, identifier: normalized };
}
