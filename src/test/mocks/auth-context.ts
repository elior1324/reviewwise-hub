/**
 * src/test/mocks/auth-context.ts
 *
 * A reusable factory for AuthContext values in tests.
 */
import { vi } from "vitest";
import type { User } from "@supabase/supabase-js";

export const MOCK_USER: User = {
  id: "test-user-id-00000000",
  email: "test@example.com",
  aud: "authenticated",
  role: "authenticated",
  created_at: "2024-01-01T00:00:00Z",
  app_metadata: {},
  user_metadata: { display_name: "Test User" },
  identities: [],
  factors: [],
  updated_at: "2024-01-01T00:00:00Z",
};

interface AuthContextOverrides {
  user?: User | null;
  loading?: boolean;
  signIn?: ReturnType<typeof vi.fn>;
  signUp?: ReturnType<typeof vi.fn>;
  signInWithGoogle?: ReturnType<typeof vi.fn>;
  signOut?: ReturnType<typeof vi.fn>;
}

export function mockAuthContext(overrides: AuthContextOverrides = {}) {
  return {
    user: overrides.user ?? null,
    session: null,
    loading: overrides.loading ?? false,
    subscriptionTier: "free" as const,
    subscriptionEnd: null,
    isSubscribed: false,
    checkSubscription: vi.fn().mockResolvedValue(undefined),
    signIn: overrides.signIn ?? vi.fn().mockResolvedValue({ data: {}, error: null }),
    signUp: overrides.signUp ?? vi.fn().mockResolvedValue({ data: { user: MOCK_USER }, error: null }),
    signInWithGoogle: overrides.signInWithGoogle ?? vi.fn().mockResolvedValue({ error: null }),
    signOut: overrides.signOut ?? vi.fn().mockResolvedValue(undefined),
    // MFA stubs
    mfaEnroll: vi.fn().mockResolvedValue({ qrCode: "", secret: "", factorId: "", error: null }),
    mfaVerifyEnrollment: vi.fn().mockResolvedValue({ error: null }),
    mfaUnenroll: vi.fn().mockResolvedValue({ error: null }),
    mfaChallenge: vi.fn().mockResolvedValue({ challengeId: "", error: null }),
    mfaVerify: vi.fn().mockResolvedValue({ error: null }),
    mfaListFactors: vi.fn().mockResolvedValue({ totp: [], error: null }),
  };
}
