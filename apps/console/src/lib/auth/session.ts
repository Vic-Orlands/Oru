import { authClient } from "./client";

export function useSessionUser() {
  const session = authClient.useSession();
  return {
    user: session.data?.user ?? null,
    isLoaded: !session.isPending,
    isSignedIn: Boolean(session.data?.user),
  };
}

export async function signInWithGoogle(): Promise<void> {
  const result = await authClient.signIn.social({
    provider: "google",
    callbackURL: window.location.href,
  });
  if (result.error) {
    throw new Error(result.error.message || "Google sign-in failed.");
  }
}

export async function signOut(): Promise<void> {
  const result = await authClient.signOut();
  if (result.error) {
    throw new Error(result.error.message || "Sign-out failed.");
  }
}
