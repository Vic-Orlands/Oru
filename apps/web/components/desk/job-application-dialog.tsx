"use client";

import { useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import {
  IconArrowUpRight,
  IconBriefcaseFilled,
  IconBrowser,
  IconCircleCheckFilled,
  IconLoader2,
  IconPlayerPlayFilled,
  IconSend,
  IconX,
} from "@tabler/icons-react";
import { api } from "@whirl/backend/convex/_generated/api";
import type { Id } from "@whirl/backend/convex/_generated/dataModel";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { showToast } from "@/lib/toasts";
import { JobApplicationFields } from "./job-application-fields";
import { JobApplicationTimeline } from "./job-application-timeline";

type BusyState = "starting" | "saving" | "filling" | "submitting" | "closing" | null;

export function JobApplicationDialog({
  opportunityId,
  title,
  organization,
}: {
  opportunityId: Id<"opportunities">;
  title: string;
  organization: string;
}) {
  const [open, setOpen] = useState(false);
  const [applicationId, setApplicationId] = useState<Id<"jobApplications"> | null>(null);
  const [answerOverrides, setAnswerOverrides] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<BusyState>(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const ensureDraft = useMutation(api.jobApplications.ensureDraft);
  const saveAnswers = useMutation(api.jobApplications.saveAnswers);
  const approvePack = useMutation(api.jobApplications.approvePack);
  const updateStatus = useMutation(api.jobApplications.updateStatus);
  const openBrowser = useAction(api.jobApplicationActions.open);
  const fillApplication = useAction(api.jobApplicationActions.fill);
  const submitApplication = useAction(api.jobApplicationActions.submit);
  const closeBrowser = useAction(api.jobApplicationActions.closeBrowser);
  const application = useQuery(
    api.jobApplications.getByOpportunity,
    open ? { opportunityId } : "skip",
  );

  const answers = {
    ...Object.fromEntries(
      (application?.pack?.fields ?? []).map((field) => [field.key, field.value ?? ""]),
    ),
    ...answerOverrides,
  };

  const run = async (state: Exclude<BusyState, null>, task: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(state);
    try {
      await task();
    } catch (cause) {
      showToast(cause instanceof Error ? cause.message : "That application step did not finish. Try again.");
    } finally {
      setBusy(null);
    }
  };

  const begin = async () => {
    if (busy) return;
    setOpen(true);
    setBusy("starting");
    try {
      const id = await ensureDraft({ opportunityId });
      setApplicationId(id);
    } catch (cause) {
      setOpen(false);
      showToast(cause instanceof Error ? cause.message : "Could not start this application.");
    } finally {
      setBusy(null);
    }
  };

  const saveAndFill = () => run("saving", async () => {
    if (!applicationId || !application?.pack) return;
    await saveAnswers({
      applicationId,
      answers: application.pack.fields.map((field) => ({ key: field.key, value: answers[field.key] ?? "" })),
    });
    await approvePack({ applicationId });
    setBusy("filling");
    await fillApplication({ applicationId });
    showToast("Approved answers were filled. Review the employer form before submitting.");
  });

  const status = application?.status.replaceAll("_", " ") ?? "preparing";
  const liveViewUrl = application?.run && !["cancelled", "failed", "succeeded"].includes(application.run.status)
    ? application.run.liveViewUrl
    : undefined;
  const hasBrowser = Boolean(liveViewUrl);
  const canSubmit = ["ready_to_submit", "waiting_for_user"].includes(application?.run?.status ?? "");

  return (
    <>
      <Button type="button" size="xs" variant="outline" onClick={() => void begin()}>
        <IconBriefcaseFilled size={13} />
        {application?.status === "submitted" ? "Submitted" : "Apply"}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="top-1/2 flex max-h-[92vh] max-w-6xl -translate-y-1/2 flex-col overflow-hidden p-0">
          <DialogHeader className="border-b border-border px-5 py-4 pr-12">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <DialogTitle className="flex items-center gap-2 text-base">
                  {title}
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium capitalize text-muted-foreground">{status}</span>
                </DialogTitle>
                <DialogDescription className="mt-1">{organization} · reviewed application mode</DialogDescription>
              </div>
              {application?.ats && <span className="text-xs text-muted-foreground">Detected {application.ats}</span>}
            </div>
          </DialogHeader>
          <DialogClose className="absolute top-4 right-4 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close application desk">
            <IconX size={17} />
          </DialogClose>

          <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,.75fr)]">
            <section className="flex min-h-[460px] flex-col border-b border-border lg:border-r lg:border-b-0">
              <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                <div className="flex items-center gap-2 text-xs font-medium"><IconBrowser size={15} /> Secure browser</div>
                {liveViewUrl && (
                  <a href={liveViewUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                    Open in new tab <IconArrowUpRight size={13} />
                  </a>
                )}
              </div>
              {liveViewUrl ? (
                <iframe title={`Application for ${title}`} src={liveViewUrl} allow="clipboard-read; clipboard-write" className="min-h-[440px] flex-1 bg-background" />
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                  <span className="grid size-11 place-items-center rounded-xl bg-muted"><IconBrowser size={22} /></span>
                  <div><p className="text-sm font-medium">Open the employer form here</p><p className="mt-1 max-w-sm text-xs text-muted-foreground">Kernel keeps the browser private while Oso-Ahia scans the form. You stay in control of logins, uploads, captchas, and the final submit.</p></div>
                  <Button disabled={!applicationId || busy !== null} onClick={() => applicationId && void run("starting", () => openBrowser({ applicationId }))}>
                    {busy === "starting" ? <IconLoader2 className="animate-spin" /> : <IconPlayerPlayFilled />}
                    Open application
                  </Button>
                </div>
              )}
            </section>

            <aside className="min-h-0 overflow-y-auto p-4">
              <div className="mb-4">
                <h3 className="text-sm font-semibold">Answer pack</h3>
                <p className="mt-1 text-xs text-muted-foreground">Nothing is filled until you approve these answers.</p>
              </div>
              <JobApplicationFields
                fields={application?.pack?.fields ?? []}
                answers={answers}
                disabled={busy !== null || application?.pack?.status === "used"}
                onChange={(key, value) => setAnswerOverrides((current) => ({ ...current, [key]: value }))}
              />
              {application?.pack?.fields.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button disabled={busy !== null || application.pack.status === "used"} onClick={saveAndFill}>
                    {busy === "saving" || busy === "filling" ? <IconLoader2 className="animate-spin" /> : <IconCircleCheckFilled />}
                    Approve and fill
                  </Button>
                  {hasBrowser && (
                    <Button variant="ghost" disabled={busy !== null} onClick={() => applicationId && void run("closing", () => closeBrowser({ applicationId }))}>Close browser</Button>
                  )}
                </div>
              ) : null}

              {canSubmit && (
                <div className="mt-5 rounded-xl bg-amber-500/8 p-3 ring-1 ring-amber-500/20">
                  <p className="text-xs font-semibold">Final submission</p>
                  <p className="mt-1 text-xs text-muted-foreground">Review the live form. Oso-Ahia will only mark this applied after the employer confirms receipt.</p>
                  {confirmSubmit ? (
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" disabled={busy !== null} onClick={() => applicationId && void run("submitting", async () => { await submitApplication({ applicationId }); setConfirmSubmit(false); showToast("Application submitted and confirmed."); })}>
                        {busy === "submitting" ? <IconLoader2 className="animate-spin" /> : <IconSend />} Submit now
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setConfirmSubmit(false)}>Not yet</Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" className="mt-3" onClick={() => setConfirmSubmit(true)}><IconSend /> Review submission</Button>
                  )}
                </div>
              )}

              {application?.confirmationText && (
                <div className="mt-5 rounded-xl bg-emerald-500/8 p-3 text-xs ring-1 ring-emerald-500/20">
                  <p className="font-semibold text-emerald-700 dark:text-emerald-300">Employer confirmed receipt</p>
                  <p className="mt-1 text-muted-foreground">{application.confirmationText}</p>
                </div>
              )}

              {application?.submittedAt && (
                <label className="mt-5 block">
                  <span className="mb-1.5 block text-xs font-semibold">Hiring status</span>
                  <select
                    value={application.status === "submitted" ? "confirmed" : application.status}
                    disabled={busy !== null}
                    onChange={(event) => applicationId && void run("saving", () => updateStatus({
                      applicationId,
                      status: event.target.value as "confirmed" | "recruiter_screen" | "interview" | "offer" | "rejected" | "withdrawn" | "closed",
                    }))}
                    className="h-9 w-full rounded-lg bg-background px-3 text-sm ring-1 ring-border outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                  >
                    <option value="confirmed">Application received</option>
                    <option value="recruiter_screen">Recruiter screen</option>
                    <option value="interview">Interview</option>
                    <option value="offer">Offer</option>
                    <option value="rejected">Rejected</option>
                    <option value="withdrawn">Withdrawn</option>
                    <option value="closed">Closed</option>
                  </select>
                </label>
              )}

              <div className="mt-6 border-t border-border pt-4">
                <h3 className="mb-3 text-xs font-semibold">Application activity</h3>
                <JobApplicationTimeline events={application?.events ?? []} />
              </div>
            </aside>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
