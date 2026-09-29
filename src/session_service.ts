import { randomUUID } from "node:crypto";

export type Account = { id: string; email: string; tenantId: string; active: boolean };
export type Session = { id: string; userId: string; refreshToken: string; revoked: boolean; generation: number };

export class SessionService {
  private accounts = new Map<string, Account>();
  private sessions = new Map<string, Session>();

  onboard(email: string, tenantId: string): Account {
    const account = { id: randomUUID(), email, tenantId, active: true };
    this.accounts.set(account.id, account);
    return account;
  }

  createSession(userId: string): Session {
    const account = this.accounts.get(userId);
    if (!account || !account.active) throw new Error("account_inactive");
    const session = { id: randomUUID(), userId, refreshToken: randomUUID(), revoked: false, generation: 0 };
    this.sessions.set(session.id, session);
    return session;
  }

  rotate(refreshToken: string): Session {
    const current = [...this.sessions.values()].find((item) => item.refreshToken === refreshToken);
    if (!current || current.revoked) throw new Error("refresh_rejected");
    current.revoked = true;
    const next = { id: randomUUID(), userId: current.userId, refreshToken: randomUUID(), revoked: false, generation: current.generation + 1 };
    this.sessions.set(next.id, next);
    return next;
  }

  revokeUser(userId: string): number {
    let count = 0;
    for (const session of this.sessions.values()) if (session.userId === userId && !session.revoked) { session.revoked = true; count += 1; }
    return count;
  }

  deactivate(userId: string): void {
    const account = this.accounts.get(userId);
    if (account) { account.active = false; this.revokeUser(userId); }
  }
}
