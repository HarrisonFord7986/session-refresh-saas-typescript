import { SessionService } from "./session_service.ts";

const service = new SessionService();
const account = service.onboard("learner@example.edu", "courses");
const first = service.createSession(account.id);
const second = service.rotate(first.refreshToken);
if (second.generation !== 1 || second.refreshToken === first.refreshToken) throw new Error("rotation did not advance");
let rejected = false;
try { service.rotate(first.refreshToken); } catch { rejected = true; }
if (!rejected) throw new Error("reused refresh token was accepted");
if (service.revokeUser(account.id) !== 1) throw new Error("active session was not revoked");
console.log("rotation and revocation decisions pass");
