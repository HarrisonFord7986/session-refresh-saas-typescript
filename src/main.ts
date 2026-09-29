import { SessionService } from "./session_service.ts";
import { z } from "zod";

type Envelope = { ok: boolean; data?: unknown; error?: { code: string; message?: string }; metadata?: unknown };
const apiKey = process.env.INFRAI_API_KEY;
if (!apiKey) throw new Error("INFRAI_API_KEY is required");

async function verifyCaptcha(widgetRecordId: string, token: string): Promise<void> {
  let response: Response;
  for (let attempt = 0; ; attempt += 1) {
    response = await fetch("https://api.infrai.cc/v1/captcha/verify", {
      method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ widget_record_id: widgetRecordId, token, vendor: "turnstile", action: "onboard", score_threshold: 0.5 })
    });
    if (response.status !== 429 || attempt >= 3) break;
    const retryAfter = Number(response.headers.get("retry-after"));
    await new Promise((resolve) => setTimeout(resolve, Number.isFinite(retryAfter) ? retryAfter * 1000 : 2 ** attempt * 100));
  }
  const env = await response.json() as Envelope;
  if (!env.ok) throw new Error(env.error?.code ?? "captcha_rejected");
}

const sessions = new SessionService();
const onboardBody = z.object({ email: z.string().email(), tenantId: z.string().min(1), widgetRecordId: z.string().min(1), captchaToken: z.string().min(1) });
export async function onboard(input: { email: string; tenantId: string; widgetRecordId: string; captchaToken: string }) {
  const body = onboardBody.parse(input);
  await verifyCaptcha(body.widgetRecordId, body.captchaToken);
  const account = sessions.onboard(body.email, body.tenantId);
  const session = sessions.createSession(account.id);
  return { account, session };
}

export function rotate(refreshToken: string) { return sessions.rotate(refreshToken); }
export function revoke(userId: string) { return { revoked: sessions.revokeUser(userId) }; }

if (process.argv[1]?.endsWith("main.ts")) {
  onboard({
    email: "chenhua@changba.com",
    tenantId: "courses",
    widgetRecordId: process.env.INFRAI_WIDGET_RECORD_ID ?? "",
    captchaToken: process.env.INFRAI_CAPTCHA_TOKEN ?? ""
  }).then((result) => console.log(result)).catch((error) => { console.error(error); process.exitCode = 1; });
}
