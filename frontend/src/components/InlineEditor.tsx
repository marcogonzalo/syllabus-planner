"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type InlineEditorProps = {
  value: string;
  onSave: (value: string) => void | Promise<void>;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
  textClassName?: string;
  displayValue?: string;
};

export function InlineEditor({
  value,
  onSave,
  multiline = false,
  placeholder = "Click to edit",
  className,
  textClassName,
  displayValue,
}: InlineEditorProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      ref.current?.focus();
      ref.current?.select();
      if (multiline && ref.current) {
        ref.current.style.height = "auto";
        ref.current.style.height = `${ref.current.scrollHeight}px`;
      }
    }
  }, [editing, multiline]);

  function handleStart(event: React.MouseEvent) {
    event.stopPropagation();
    setDraft(value);
    setEditing(true);
  }

  async function handleCommit() {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) {
      await onSave(trimmed);
    } else {
      setDraft(value);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      setDraft(value);
      setEditing(false);
    }
    if (!multiline && event.key === "Enter") {
      event.preventDefault();
      handleCommit();
    }
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={handleStart}
        className={cn(
          "min-w-0 flex-1 cursor-pointer rounded px-1.5 py-0.5 text-left transition-colors hover:bg-muted/50",
          !value && "text-muted-foreground italic",
          className,
          textClassName,
        )}
        title="Click to edit"
      >
        {displayValue || value || placeholder}
      </button>
    );
  }

  const sharedProps = {
    ref: ref as React.Ref<HTMLInputElement>,
    value: draft,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setDraft(e.target.value),
    onBlur: handleCommit,
    onKeyDown: handleKeyDown,
    className: cn(
      "min-w-0 flex-1 rounded border border-primary bg-background px-1.5 py-0.5 text-sm outline-none ring-1 ring-primary/30",
      className,
    ),
  };

  if (multiline) {
    function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
      setDraft(e.target.value);
      e.target.style.height = "auto";
      e.target.style.height = `${e.target.scrollHeight}px`;
    }

    return (
      <textarea
        ref={ref as React.Ref<HTMLTextAreaElement>}
        value={draft}
        onChange={handleTextareaChange}
        onBlur={handleCommit}
        onKeyDown={handleKeyDown}
        className={cn(
          "w-full resize-none overflow-hidden rounded border border-primary bg-background px-1.5 py-0.5 text-sm outline-none ring-1 ring-primary/30",
          className,
        )}
      />
    );
  }

  return <input type="text" {...sharedProps} />;
}
