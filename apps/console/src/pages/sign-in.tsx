import { useState } from "react";
import { IconBrandGoogle, IconLoader2 } from "@tabler/icons-react";

import { WhirlMark } from "~/components/whirl-mark";
import { signInWithGoogle } from "~/lib/auth/session";
import { userErrorMessage } from "~/lib/errors";

/**
 * Signed-out landing. Better Auth and Convex share the same session as apps/v2,
 * so an existing Oso-Ahia account signs straight in.
 */
export function SignInPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async () => {
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (cause) {
      setError(userErrorMessage(cause, "Couldn't start Google sign-in."));
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-[#F3F3F3] px-4 py-12 dark:bg-[#141414]">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex items-center gap-2.5">
          <WhirlMark size={24} />
          <span className="text-[18px] font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            Oso-Ahia
          </span>
          <span className="rounded-full border border-black/[0.1] px-2 py-0.5 text-[11px] font-medium text-neutral-500 dark:border-white/[0.14] dark:text-neutral-400">
            Console
          </span>
        </div>
        <p className="max-w-sm text-[13.5px] leading-relaxed text-neutral-500 dark:text-neutral-400">
          Sign in with your Oso-Ahia account to manage your integrations and API
          keys.
        </p>
      </div>
      <div className="w-full max-w-sm rounded-2xl border border-black/[0.07] bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-[#1B1B1B]">
        <button
          type="button"
          onClick={() => void signIn()}
          disabled={busy}
          className="flex h-11 w-full items-center justify-center gap-2.5 rounded-xl bg-neutral-900 px-4 text-[13px] font-medium text-white transition-colors hover:bg-neutral-700 disabled:cursor-wait disabled:opacity-60 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          {busy ? (
            <IconLoader2 size={17} className="animate-spin" />
          ) : (
            <IconBrandGoogle size={17} />
          )}
          {busy ? "Opening Google…" : "Continue with Google"}
        </button>
        {error && (
          <p
            role="alert"
            className="mt-3 text-[12px] leading-relaxed text-red-600 dark:text-red-400"
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
