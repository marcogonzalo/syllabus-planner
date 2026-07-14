"use client";

import { FormEvent, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  parseAddModuleForm,
  type AddModuleFormErrors,
} from "@/lib/addModuleForm";

type AddModuleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { title: string; duration_days: number }) => Promise<void>;
};

export function AddModuleDialog({
  open,
  onOpenChange,
  onSubmit,
}: AddModuleDialogProps) {
  const titleId = useId();
  const durationId = useId();
  const [title, setTitle] = useState("");
  const [durationDays, setDurationDays] = useState("1");
  const [errors, setErrors] = useState<AddModuleFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseAddModuleForm(title, durationDays);
    if ("errors" in parsed) {
      setErrors(parsed.errors);
      return;
    }

    setErrors({});
    setSubmitError(null);
    setSubmitting(true);
    try {
      await onSubmit(parsed.values);
      onOpenChange(false);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Failed to add module.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="contents">
          <DialogHeader>
            <DialogTitle>Add module</DialogTitle>
            <DialogDescription>
              Create a module in this section. Duration is in days (use 0.5 for
              half day).
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <label
                htmlFor={titleId}
                className="text-sm font-medium text-foreground"
              >
                Title
              </label>
              <Input
                id={titleId}
                name="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Module title"
                autoFocus
                aria-invalid={Boolean(errors.title)}
                disabled={submitting}
              />
              {errors.title ? (
                <p className="text-xs text-destructive">{errors.title}</p>
              ) : null}
            </div>

            <div className="grid gap-1.5">
              <label
                htmlFor={durationId}
                className="text-sm font-medium text-foreground"
              >
                Duration (days)
              </label>
              <Input
                id={durationId}
                name="duration_days"
                type="number"
                inputMode="decimal"
                min={0.5}
                step={0.5}
                value={durationDays}
                onChange={(event) => setDurationDays(event.target.value)}
                aria-invalid={Boolean(errors.duration_days)}
                disabled={submitting}
              />
              {errors.duration_days ? (
                <p className="text-xs text-destructive">
                  {errors.duration_days}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Default 1 day. Half days allowed (0.5).
                </p>
              )}
            </div>

            {submitError ? (
              <p className="text-sm text-destructive">{submitError}</p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Adding…" : "Add module"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
