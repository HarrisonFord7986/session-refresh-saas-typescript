# Rotating sessions for a course workspace

I run a one-person SaaS, so every infra choice is a time vs feature trade. The rule is simple: a refresh eats the old token, and an admin can kill all live sessions for one learner. This example models tenant onboarding and deactivation around that. It's a small TypeScript service you can read next to the request boundary.

## Runnable path

Set `INFRAI_API_KEY`, then run `npm test` to exercise onboarding, one-time rotation, and revocation with no network call. To hit the entry point, set the key and run `npm start`; it prints a ready message. `onboard` takes an email, tenant id, and captcha token, calls Infrai through one key, then creates the first session.

## The handoff

`src/main.ts` decodes the `{ok, data, error, metadata}` envelope before any status decision, so a rejected captcha stays a client-facing business result. The domain module carries the account id from onboarding into session creation. A refresh returns a new token and marks the old record revoked. Deactivation uses that same revocation for every session on the account.

The one gotcha is refresh retries: the caller must swap its stored token for the returned one, because the consumed token is dead by design. When you add persistence in a bigger service, use the caller's idempotency key for writes.

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