"use client";

import { FormEvent, useEffect, useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SyllabusSummary } from "@/types";

const CREATE_PROGRAM_VALUE = "__create__";

type SyllabusPickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  syllabuses: SyllabusSummary[];
  selectedSyllabusId: number | null;
  onSelect: (id: number) => void;
  onCreate: (title: string) => Promise<void>;
};

export function SyllabusPickerDialog({
  open,
  onOpenChange,
  syllabuses,
  selectedSyllabusId,
  onSelect,
  onCreate,
}: SyllabusPickerDialogProps) {
  const [mode, setMode] = useState<"select" | "create">(
    selectedSyllabusId ? "select" : "create",
  );
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setMode(selectedSyllabusId ? "select" : "create");
      setCreateError(null);
    }
  }, [open, selectedSyllabusId]);

  const selectValue =
    mode === "create"
      ? CREATE_PROGRAM_VALUE
      : selectedSyllabusId
        ? String(selectedSyllabusId)
        : null;

  const programItems = [
    ...syllabuses.map((item) => ({
      value: String(item.id),
      label: item.title,
    })),
    { value: CREATE_PROGRAM_VALUE, label: "Create new syllabus" },
  ];

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") || "").trim();
    if (!title) {
      return;
    }

    setCreating(true);
    setCreateError(null);
    try {
      await onCreate(title);
      onOpenChange(false);
      event.currentTarget.reset();
    } catch (error) {
      setCreateError(
        error instanceof Error ? error.message : "Failed to create syllabus.",
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change syllabus</DialogTitle>
          <DialogDescription>
            Select an existing program or create a new one.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-1">
          <Select
            value={selectValue}
            items={programItems}
            onValueChange={(value) => {
              if (!value) {
                return;
              }
              if (value === CREATE_PROGRAM_VALUE) {
                setMode("create");
                return;
              }
              setMode("select");
              onSelect(Number(value));
              onOpenChange(false);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select syllabus" />
            </SelectTrigger>
            <SelectContent>
              {syllabuses.map((item) => (
                <SelectItem key={item.id} value={String(item.id)}>
                  {item.title}
                </SelectItem>
              ))}
              <SelectSeparator />
              <SelectItem value={CREATE_PROGRAM_VALUE}>
                Create new syllabus
              </SelectItem>
            </SelectContent>
          </Select>

          {mode === "create" ? (
            <form
              onSubmit={handleCreate}
              className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center"
            >
              <Input
                name="title"
                placeholder="New program title"
                className="min-w-0 flex-1"
                autoFocus
                disabled={creating}
              />
              <Button
                type="submit"
                size="sm"
                className="shrink-0"
                disabled={creating}
              >
                <Plus className="size-4" />
                {creating ? "Creating…" : "New Program"}
              </Button>
            </form>
          ) : null}

          {createError ? (
            <p className="text-sm text-destructive">{createError}</p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
