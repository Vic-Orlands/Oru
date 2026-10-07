"use client";

import { authClient } from "./client";
import { isDemoMode } from "./mode";

/** The slice of a user the rest of the app already reads. */
export type SessionUser = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  username: string | null;
  imageUrl: string;
  primaryEmailAddress: { emailAddress: string } | null;
};

const DEMO_USER: SessionUser = {
  id: "demo-chimezie",
  firstName: "Chimezie",
  lastName: "Okafor",
  fullName: "Chimezie Okafor",
  username: "chimezie",
  imageUrl: "",
  primaryEmailAddress: { emailAddress: "chimezie@osoahia.com" },
};

function fromBetterAuth(user: {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}): SessionUser {
  const parts = user.name.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] ?? null;
  const lastName = parts.slice(1).join(" ") || null;
  return {
    id: user.id,
    firstName,
    lastName,
    fullName: user.name || null,
    username: null,
    imageUrl: user.image ?? "",
    primaryEmailAddress: user.email
      ? { emailAddress: user.email }
      : null,
  };
}

export function useUser() {
  const session = authClient.useSession();
  if (isDemoMode()) {
    return { user: DEMO_USER, isLoaded: true, isSignedIn: true as const };
  }
  const raw = session.data?.user;
  const user = raw ? fromBetterAuth(raw) : null;
  return {
    user,
    isLoaded: !session.isPending,
    isSignedIn: Boolean(user),
  };
}

export function useAuth() {
  const { isLoaded, isSignedIn } = useUser();
  return {
    isLoaded,
    isSignedIn,
    getToken: async (_opts?: { template?: string }) => undefined,
  };
}

export function useClerk() {
  return {
    signOut: async () => {
      if (isDemoMode()) return;
      await authClient.signOut();
    },
    openUserProfile: () => {
      window.history.pushState(null, "", "/settings/account");
    },
  };
}

export async function signInWithGoogle() {
  if (isDemoMode()) return;
  await authClient.signIn.social({
    provider: "google",
    callbackURL: "/app",
  });
}
