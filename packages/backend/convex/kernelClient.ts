import { env } from "./_generated/server";

const KERNEL_API = "https://api.onkernel.com";

type KernelInvocation = {
  id: string;
  status: "queued" | "running" | "succeeded" | "failed";
  output?: string;
  status_reason?: string;
};

function configuredKernel() {
  const apiKey = env.KERNEL_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "Kernel is not configured. Add KERNEL_API_KEY to the Convex deployment before starting an application.",
    );
  }
  return {
    apiKey,
    appName: env.KERNEL_JOB_APP_NAME?.trim() || "oru-job-agent",
    version: env.KERNEL_JOB_APP_VERSION?.trim() || "latest",
  };
}

export async function invokeKernelAction<T>(
  actionName: string,
  payload: Record<string, unknown>,
): Promise<{ invocationId: string; output: T }> {
  const config = configuredKernel();
  const response = await fetch(`${KERNEL_API}/invocations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      app_name: config.appName,
      version: config.version,
      action_name: actionName,
      payload: JSON.stringify(payload),
    }),
  });
  const text = await response.text();
  if (!response.ok) {
    let message = text.slice(0, 500);
    try {
      const parsed = JSON.parse(text) as { message?: string };
      message = parsed.message || message;
    } catch {
      // Kernel sometimes returns plain text for platform failures.
    }
    throw new Error(`Kernel could not ${actionName.replaceAll("-", " ")} (${response.status}): ${message}`);
  }

  const invocation = JSON.parse(text) as KernelInvocation;
  if (invocation.status !== "succeeded") {
    throw new Error(
      invocation.status_reason ||
        `Kernel ${actionName.replaceAll("-", " ")} did not complete.`,
    );
  }
  if (!invocation.output) {
    throw new Error("Kernel completed without returning an application result.");
  }
  try {
    return {
      invocationId: invocation.id,
      output: JSON.parse(invocation.output) as T,
    };
  } catch {
    throw new Error("Kernel returned an unreadable application result.");
  }
}
