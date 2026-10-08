"use client";

import { IconBrandGoogleFilled, IconX } from "@tabler/icons-react";

import { signInWithGoogle } from "@/lib/auth/session";
import { OsoLogo } from "@/components/oso-logo";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import { showToast } from "@/lib/toasts";

export function AuthModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-label="Sign in to Oso-Ahia" className="top-1/2 -translate-y-1/2 p-6">
        <DialogClose
          aria-label="Close"
          className="absolute top-3 right-3 flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <IconX size={16} />
        </DialogClose>
        <div className="flex flex-col items-center pt-2 text-center">
          <OsoLogo size={28} />
          <h2 className="mt-4 text-[18px] font-medium tracking-tight">
            Sign in to Oso-Ahia
          </h2>
          <p className="mt-1.5 max-w-[18rem] text-[13px]/5 text-muted-foreground">
            Google is the only door. Your desk, lists, and approvals stay on your workspace.
          </p>
          <Button
            className="mt-5 w-full"
            onClick={() => {
              void signInWithGoogle().catch(() => {
                showToast("Google sign-in didn’t start. Check the OAuth keys.");
              });
            }}
          >
            <IconBrandGoogleFilled size={16} />
            Continue with Google
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
