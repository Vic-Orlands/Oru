"use client";

import { IconAlertTriangleFilled, IconPaperclip } from "@tabler/icons-react";

import { Input } from "@/components/ui/input";

export type ApplicationField = {
  key: string;
  label: string;
  type: string;
  required: boolean;
  options: string[];
  sensitive: boolean;
  value?: string;
};

export function JobApplicationFields({
  fields,
  answers,
  disabled,
  onChange,
}: {
  fields: ApplicationField[];
  answers: Record<string, string>;
  disabled: boolean;
  onChange: (key: string, value: string) => void;
}) {
  if (fields.length === 0) {
    return (
      <p className="rounded-lg bg-muted/60 px-3 py-2.5 text-xs text-muted-foreground">
        Open the application to inspect the employer form and build a reviewable answer pack.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {fields.map((field) => (
        <label
          key={field.key}
          className={field.type === "textarea" ? "sm:col-span-2" : undefined}
        >
          <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium">
            {field.label}
            {field.required && <span className="text-destructive">*</span>}
            {field.sensitive && (
              <span
                title="Review this sensitive answer carefully"
                className="inline-flex text-amber-600 dark:text-amber-400"
              >
                <IconAlertTriangleFilled size={13} />
              </span>
            )}
          </span>
          {field.type === "file" ? (
            <div className="flex h-9 items-center gap-2 rounded-lg bg-muted/60 px-3 text-xs text-muted-foreground ring-1 ring-border">
              <IconPaperclip size={14} />
              Upload this in the secure browser
            </div>
          ) : field.type === "select" ? (
            <select
              value={answers[field.key] ?? ""}
              disabled={disabled}
              onChange={(event) => onChange(field.key, event.target.value)}
              className="h-9 w-full rounded-lg bg-background px-3 text-sm ring-1 ring-border outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              <option value="">Choose an answer</option>
              {field.options.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          ) : field.type === "textarea" ? (
            <textarea
              value={answers[field.key] ?? ""}
              disabled={disabled}
              rows={3}
              onChange={(event) => onChange(field.key, event.target.value)}
              className="w-full resize-y rounded-lg bg-transparent px-3 py-2 text-sm ring-1 ring-border outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            />
          ) : field.type === "checkbox" ? (
            <select
              value={answers[field.key] ?? ""}
              disabled={disabled}
              onChange={(event) => onChange(field.key, event.target.value)}
              className="h-9 w-full rounded-lg bg-background px-3 text-sm ring-1 ring-border outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              <option value="">Choose an answer</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          ) : (
            <Input
              type={["email", "tel", "url", "number", "date"].includes(field.type) ? field.type : "text"}
              value={answers[field.key] ?? ""}
              disabled={disabled}
              onChange={(event) => onChange(field.key, event.target.value)}
            />
          )}
        </label>
      ))}
    </div>
  );
}
