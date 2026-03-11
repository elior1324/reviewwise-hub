/**
 * src/lib/auth-security.ts
 *
 * Client-side authentication security utilities.
 *
 * ── Contents ──────────────────────────────────────────────────────────────────
 *
 * 1. ClientRateLimiter
 *    A last-line-of-defence in-memory limiter (sessionStorage-backed) that
 *    prevents the browser from even sending login requests if the tab has
 *    already accumulated too many failures.  The real rate-limit enforcement
 *    lives in the DB via check_login_rate_limit() — this is an additional UX
 *    layer that gives instant feedback without a network round-trip.
 *
 * 2. SessionTimeout
 *    Tracks user activity (mousemove, keydown, click, touchstart) and fires a
 *    callback when the user has been idle for INACTIVITY_LIMIT_MS.  AuthContext
 *    hooks this up to call supabase.auth.signOut().
 *    Note on HttpOnly cookies: a pure browser SPA cannot SET HttpOnly cookies
 *    (that requires a server-side Set-Cookie header).  The session token is
 *    stored in sessionStorage (not localStorage) — already the safest option
 *    for a client-side-only app.  The timeout below gives a sliding-window
 *    equivalent to a short-lived session.
 *
 * 3. helpers: formatCountdown, secondsUntil
 */

// ── 1. ClientRateLimiter ──────────────────────────────────────────────────────

interface AttemptRecord {
  timestamps: number[]; // epoch ms of each failed attempt
}

const CLIENT_RL_KEY    = "rl_login";  // sessionStorage key
const CLIENT_MAX_FAILS = 5;           // failures before client-side block
const CLIENT_WINDOW_MS = 15 * 60 * 1000; // 15-minute rolling window
const CLIENT_LOCKOUT_MS = 30 * 60 * 1000; // 30-minute lockout

export interface ClientRLResult {
  allowed: boolean;
  remainingAttempts: number;
  lockedUntilMs: number | null; // epoch ms, or null if not locked
}

function loadRecord(): AttemptRecord {
  try {
    const raw = sessionStorage.getItem(CLIENT_RL_KEY);
    if (!raw) return { timestamps: [] };
    return JSON.parse(raw) as AttemptRecord;
  } catch {
    return { timestamps: [] };
  }
}

function saveRecord(record: AttemptRecord): void {
  try {
    sessionStorage.setItem(CLIENT_RL_KEY, JSON.stringify(record));
  } catch { /* ignore quota errors */ }
}

/** Check whether the current tab is allowed to attempt a login. */
export function clientCheckRateLimit(): ClientRLResult {
  const now = Date.now();
  const record = loadRecord();

  // Drop timestamps older than the rolling window
  const recent = record.timestamps.filter(t => now - t < CLIENT_WINDOW_MS);

  if (recent.length >= CLIENT_MAX_FAILS) {
    // Use the most-recent failure to compute lock expiry
    const lockedUntilMs = Math.max(...recent) + CLIENT_LOCKOUT_MS;
    if (now < lockedUntilMs) {
      return { allowed: false, remainingAttempts: 0, lockedUntilMs };
    }
    // Lockout has expired — reset
    saveRecord({ timestamps: [] });
    return { allowed: true, remainingAttempts: CLIENT_MAX_FAILS, lockedUntilMs: null };
  }

  return {
    allowed: true,
    remainingAttempts: CLIENT_MAX_FAILS - recent.length,
    lockedUntilMs: null,
  };
}

/** Record a failed login attempt in the in-memory store. */
export function clientRecordFailure(): void {
  const record = loadRecord();
  const now = Date.now();
  const recent = record.timestamps.filter(t => now - t < CLIENT_WINDOW_MS);
  recent.push(now);
  saveRecord({ timestamps: recent });
}

/** Clear the in-memory counter after a successful login. */
export function clientClearAttempts(): void {
  sessionStorage.removeItem(CLIENT_RL_KEY);
}

// ── 2. SessionTimeout ─────────────────────────────────────────────────────────

/**
 * How long a user can be completely idle before the session is invalidated.
 * 30 minutes matches common banking/enterprise standards.
 */
export const INACTIVITY_LIMIT_MS = 30 * 60 * 1000; // 30 minutes

/**
 * How often we warn the user before the session expires (shown in UI).
 * A toast warning appears when idle time crosses this threshold.
 */
export const INACTIVITY_WARN_MS = 25 * 60 * 1000; // warn at 25 min idle

const ACTIVITY_EVENTS = ["mousemove", "keydown", "click", "touchstart", "scroll"] as const;

export class SessionTimeout {
  private lastActivity = Date.now();
  private checkTimer: ReturnType<typeof setInterval> | null = null;
  private onExpire: () => void;
  private onWarn: (() => void) | undefined;
  private warned = false;

  constructor(onExpire: () => void, onWarn?: () => void) {
    this.onExpire = onExpire;
    this.onWarn   = onWarn;
  }

  start(): void {
    this.lastActivity = Date.now();
    this.warned = false;
    ACTIVITY_EVENTS.forEach(evt =>
      window.addEventListener(evt, this.handleActivity, { passive: true })
    );
    // Check every 60 s — low-overhead polling
    this.checkTimer = setInterval(() => this.tick(), 60_000);
  }

  stop(): void {
    ACTIVITY_EVENTS.forEach(evt =>
      window.removeEventListener(evt, this.handleActivity)
    );
    if (this.checkTimer !== null) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
  }

  /** Reset idle clock (called by activity listener). */
  private handleActivity = (): void => {
    this.lastActivity = Date.now();
    this.warned = false;
  };

  private tick(): void {
    const idle = Date.now() - this.lastActivity;

    if (idle >= INACTIVITY_LIMIT_MS) {
      this.stop();
      this.onExpire();
      return;
    }

    if (!this.warned && idle >= INACTIVITY_WARN_MS && this.onWarn) {
      this.warned = true;
      this.onWarn();
    }
  }

  /** Remaining ms before expiry. Useful for countdown UI. */
  remainingMs(): number {
    return Math.max(0, INACTIVITY_LIMIT_MS - (Date.now() - this.lastActivity));
  }
}

// ── 3. Helpers ────────────────────────────────────────────────────────────────

/** Returns the number of whole seconds until a future epoch-ms timestamp. */
export function secondsUntil(epochMs: number): number {
  return Math.max(0, Math.ceil((epochMs - Date.now()) / 1000));
}

/** Formats a seconds-remaining value as "mm:ss". */
export function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}
