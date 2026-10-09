# Oso-Ahia Kernel job runner

This Kernel app owns only the short-lived browser execution layer. Convex remains
the system of record for candidate data, approvals, application packs, events,
and receipts.

## Deploy

1. Create a Kernel project and API key.
2. Set `KERNEL_API_KEY` in your shell.
3. Run `bun run deploy:kernel-job-runner` from the repository root. The script
   reads the local backend environment and securely passes only `KERNEL_API_KEY`
   to the Kernel runtime.
4. Add these variables to the Convex deployment:
   - `KERNEL_API_KEY`
   - `KERNEL_JOB_APP_NAME=oso-ahia-job-agent`
   - `KERNEL_JOB_APP_VERSION=latest`

The runner deliberately uses headful, non-stealth sessions. Login, MFA, CAPTCHA,
file uploads, and ambiguous controls are handed to the user through Kernel's
live view instead of being guessed or bypassed.
