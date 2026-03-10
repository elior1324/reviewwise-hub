/**
 * src/test/mocks/supabase.ts
 *
 * A fully-typed vi.fn() mock of the Supabase client.
 * Import this in test files that call supabase directly, OR place a
 * __mocks__ file — but using vi.mock() at the test level is preferred
 * so each test controls its own return values.
 *
 * Usage in a test file:
 *   vi.mock("@/integrations/supabase/client", () => ({ supabase: mockSupabase }));
 *   mockSupabase.from.mockReturnValue(chain({ data: [...], error: null }));
 */
import { vi } from "vitest";

/** Build a chainable query builder that resolves with `result`. */
export function chain(result: { data: unknown; error: unknown }) {
  const q: Record<string, unknown> = {};
  const methods = [
    "select", "insert", "update", "delete", "upsert",
    "eq", "neq", "gt", "lt", "gte", "lte", "in",
    "is", "not", "or", "and", "filter",
    "order", "limit", "range", "single", "maybeSingle",
    "match", "returns",
  ];
  for (const m of methods) {
    q[m] = vi.fn(() => q);
  }
  // Terminal methods that return a Promise
  (q as Record<string, unknown>).then = (resolve: (v: unknown) => void) =>
    Promise.resolve(result).then(resolve);
  Object.assign(q, result); // allow destructuring `const { data } = supabase.from(...)`
  return q;
}

/** Build a chainable RPC stub. */
export function rpcChain(result: { data: unknown; error: unknown }) {
  return {
    ...result,
    then: (resolve: (v: unknown) => void) => Promise.resolve(result).then(resolve),
  };
}

export const mockSupabase = {
  from: vi.fn(() => chain({ data: null, error: null })),
  rpc: vi.fn(() => rpcChain({ data: null, error: null })),
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signUp: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
    signInWithOAuth: vi.fn().mockResolvedValue({ data: {}, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
    resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
    updateUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
  },
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn().mockResolvedValue({ data: { path: "mock/path" }, error: null }),
      getPublicUrl: vi.fn(() => ({ data: { publicUrl: "https://example.com/mock.jpg" } })),
      remove: vi.fn().mockResolvedValue({ error: null }),
    })),
  },
  functions: {
    invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
  channel: vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  })),
  removeChannel: vi.fn(),
};
