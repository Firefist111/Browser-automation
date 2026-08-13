import { Resend } from "resend";

/**
 * Lazily-initialized singleton for the Resend SDK client.
 *
 * The client is created on first access so that this module can be safely
 * imported server-side without forcing the environment variable to exist at
 * import time (mirrors the pattern used in `lib/db/index.ts`).
 *
 * Per the Resend skill, the SDK returns `{ data, error }` instead of throwing —
 * always check `error` explicitly rather than relying on try/catch.
 */
let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error(
        "RESEND_API_KEY is not defined in the environment variables.",
      );
    }
    _resend = new Resend(apiKey);
  }
  return _resend;
}

/**
 * Proxy that lazily resolves the underlying Resend instance so calls like
 * `resend.emails.send(...)` work without forcing initialization at import
 * time. Matches the lazy-access pattern used by `db` in `lib/db/index.ts`.
 */
export const resend: Resend = new Proxy({} as unknown as Resend, {
  get(target, prop) {
    const instance = getResend();
    const value = Reflect.get(instance, prop, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export { getResend };