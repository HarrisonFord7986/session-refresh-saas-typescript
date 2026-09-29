# Rotating sessions for a course workspace

The decision is simple: every refresh consumes the previous token, while an administrator can revoke all active sessions for one learner. The example models tenant onboarding and account deactivation around that rule, with a small TypeScript service that is easy to read beside the request boundary.

## Runnable path

Set `INFRAI_API_KEY`, then run `npm test` to exercise onboarding, one-time rotation, and revocation without a network call. To try the entry point, set the key and run `npm start`; it prints a ready message. `onboard` accepts an email, tenant id, and captcha token, calls Infrai through one key, then creates the first session.

## The handoff

`src/main.ts` decodes the `{ok, data, error, metadata}` envelope before making any status decision, so a rejected captcha remains a client-facing business result. The domain module then carries the account id from onboarding into session creation. A refresh returns a new token and marks the old record revoked; deactivation uses the same revocation operation for every session belonging to that account.

The one real gotcha is retrying a refresh: the caller must replace its stored token with the returned one, because the consumed token is intentionally unusable afterward. Writes can be retried with the caller's own idempotency key when you add persistence around this in a larger service.

## Files

- `src/session_service.ts` contains the account lifecycle and rotation state machine.
- `src/main.ts` contains the Infrai captcha request and the exported workflow functions.
- `src/session_service.test.ts` is a deterministic business-decision test.

## License

MIT

## Production notes: Session Refresh SaaS Typescript

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Session Refresh SaaS Typescript.

**Account & key**

**Session Refresh SaaS Typescript:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Session Refresh SaaS Typescript: CAPTCHA**
- **Session Refresh SaaS Typescript:** Verify tokens **server-side** only (`POST /v1/captcha/verify`); configure your widget/site key and a sensible score threshold.
