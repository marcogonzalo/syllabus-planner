"use client";

import { useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, GripVertical, Plus } from "lucide-react";

import { ContentTypeIcon } from "@/components/ContentTypeIcon";
import { ContentTypeIconStack } from "@/components/ContentTypeIconStack";
import { InlineEditor } from "@/components/InlineEditor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { resolveContentDisplay } from "@/lib/content";
import { cn } from "@/lib/utils";
import type { ContentSummary } from "@/types";

const CONTENT_ADD_TYPES = [
  { type: "theory", label: "Lesson" },
  { type: "exercise", label: "Exercise" },
  { type: "project", label: "Project" },
  { type: "quiz", label: "Quiz" },
] as const;

function AddContentDropdown({ onAdd }: { onAdd: (type: string) => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative w-fit">
      <Button
        type="button"
        variant="link"
        size="sm"
        className="h-auto px-0 text-xs"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((current) => !current);
        }}
      >
        <Plus className="size-3" />
        Add asset
      </Button>
      {open ? (
        <div
          role="menu"
          className="absolute top-full right-0 z-20 mt-1 min-w-40 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {CONTENT_ADD_TYPES.map(({ type, label }) => (
            <button
              key={type}
              type="button"
              role="menuitem"
              className="flex w-full cursor-pointer items-center rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted"
              onClick={(event) => {
                event.stopPropagation();
                setOpen(false);
                onAdd(type);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

type ContentItemRowProps = {
  content: ContentSummary;
  onSave?: (text: string) => Promise<void>;
};

function ContentItemRow({ content, onSave }: ContentItemRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const { title, body } = resolveContentDisplay(content);
  const hasBody = Boolean(body);

  const fullText = body ? `${title}\n${body}` : title;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: content.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  function startEditing(event: React.MouseEvent | React.KeyboardEvent) {
    event.stopPropagation();
    event.preventDefault();
    setEditing(true);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-lg border border-border bg-background px-3 py-2",
        isDragging && "opacity-60",
      )}
    >
      <div className="flex min-w-0 items-center gap-1">
        <button
          type="button"
          className="cursor-grab rounded p-1 text-muted-foreground hover:bg-muted active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label={`Reorder ${title}`}
          onClick={(event) => event.stopPropagation()}
        >
          <GripVertical className="size-4" />
        </button>

        <div
          className={cn(
            "flex min-w-0 flex-1 items-center gap-3 text-left",
            hasBody && !editing && "cursor-pointer",
          )}
          onClick={() => {
            if (hasBody && !editing) {
              setExpanded((current) => !current);
            }
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (
              (event.key === "Enter" || event.key === " ") &&
              hasBody &&
              !editing
            ) {
              event.preventDefault();
              setExpanded((current) => !current);
            }
          }}
          aria-expanded={hasBody ? expanded : undefined}
          aria-label={
            hasBody
              ? expanded
                ? `Collapse ${title}`
                : `Expand ${title}`
              : title
          }
        >
          <ContentTypeIcon type={content.type} />
          <div className="min-w-0 flex-1">
            <InlineEditor
              value={fullText}
              onSave={onSave ?? (async () => {})}
              multiline
              displayValue={title}
              editing={editing}
              onEditingChange={setEditing}
              className="text-sm font-medium text-foreground"
            />
          </div>
          {hasBody && !editing ? (
            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform",
                !expanded && "-rotate-90",
              )}
            />
          ) : null}
        </div>
      </div>
      {hasBody && expanded && !editing ? (
        <button
          type="button"
          onClick={startEditing}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              startEditing(event);
            }
          }}
          className="mt-2 w-full cursor-pointer rounded px-1.5 py-0.5 pl-11 text-left text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground transition-colors hover:bg-muted/50"
          title="Click to edit"
        >
          {body}
        </button>
      ) : null}
    </div>
  );
}

type ModuleContentsListProps = {
  moduleId: number;
  contents: ContentSummary[];
  onReorderContents: (moduleId: number, orderedIds: number[]) => Promise<void>;
  onUpdateContent?: (
    moduleId: number,
    contentId: number,
    text: string,
  ) => Promise<void>;
  onAddContent?: (moduleId: number, type: string) => Promise<void>;
};

function ModuleContentsList({
  moduleId,
  contents,
  onReorderContents,
  onUpdateContent,
  onAddContent,
}: ModuleContentsListProps) {
  const contentIds = contents.map((content) => content.id);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  async function handleContentDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = contentIds.indexOf(Number(active.id));
    const newIndex = contentIds.indexOf(Number(over.id));
    const nextOrder = arrayMove(contentIds, oldIndex, newIndex);
    await onReorderContents(moduleId, nextOrder);
  }

  return (
    <div className="ml-7 flex flex-col gap-2 border-l border-border pl-3">
      {contents.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleContentDragEnd}
        >
          <SortableContext
            items={contentIds}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-2">
              {contents.map((content) => (
                <ContentItemRow
                  key={content.id}
                  content={content}
                  onSave={
                    onUpdateContent
                      ? (text) => onUpdateContent(moduleId, content.id, text)
                      : undefined
                  }
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <p className="rounded-md border border-dashed border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
          No contents yet.
        </p>
      )}

      {onAddContent ? (
        <div className="flex justify-end">
          <AddContentDropdown
            onAdd={(type) => {
              void onAddContent(moduleId, type);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

type DraggableItemProps = {
  id: number;
  title: string;
  kind: "section" | "module";
  subtitle?: string;
  contentTypes?: string[];
  contents?: ContentSummary[];
  selected?: boolean;
  onSelect?: () => void;
  onReorderContents?: (moduleId: number, orderedIds: number[]) => Promise<void>;
  onUpdateTitle?: (title: string) => Promise<void>;
  onUpdateContent?: (
    moduleId: number,
    contentId: number,
    text: string,
  ) => Promise<void>;
  onAddContent?: (moduleId: number, type: string) => Promise<void>;
};

export function DraggableItem({
  id,
  title,
  kind,
  subtitle,
  contentTypes,
  contents = [],
  selected = false,
  onSelect,
  onReorderContents,
  onUpdateTitle,
  onUpdateContent,
  onAddContent,
}: DraggableItemProps) {
  const [expanded, setExpanded] = useState(false);
  const isModule = kind === "module";
  const canExpand = isModule;
  const stackTypes =
    contents.length > 0
      ? contents.map((content) => content.type)
      : (contentTypes ?? []);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  function handleRowClick() {
    onSelect?.();
    if (canExpand) {
      setExpanded((current) => !current);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "admin-module-row",
          selected && "admin-module-row-active",
          isDragging && "opacity-60",
        )}
      >
        <button
          type="button"
          className="cursor-grab rounded p-1 text-muted-foreground hover:bg-muted active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label={`Reorder ${title}`}
          onClick={(event) => event.stopPropagation()}
        >
          <GripVertical className="size-4" />
        </button>

        <div
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
          onClick={handleRowClick}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              handleRowClick();
            }
          }}
          aria-expanded={canExpand ? expanded : undefined}
          aria-label={
            canExpand
              ? expanded
                ? `Collapse ${title}`
                : `Expand ${title}`
              : title
          }
        >
          {isModule ? (
            <ContentTypeIconStack
              types={stackTypes}
              count={contents.length || stackTypes.length}
            />
          ) : (
            <ContentTypeIcon type="lesson" />
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                className={
                  kind === "section" ? "badge-section" : "badge-module"
                }
              >
                {kind === "section" ? "Section" : "Module"}
              </Badge>
              <InlineEditor
                value={title}
                onSave={onUpdateTitle ?? (async () => {})}
                className="text-sm font-medium text-foreground"
              />
            </div>
            {subtitle ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>

          {canExpand ? (
            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform",
                !expanded && "-rotate-90",
              )}
            />
          ) : null}
        </div>
      </div>

      {isModule && expanded && onReorderContents ? (
        <ModuleContentsList
          moduleId={id}
          contents={contents}
          onReorderContents={onReorderContents}
          onUpdateContent={onUpdateContent}
          onAddContent={onAddContent}
        />
      ) : null}
    </div>
  );
}
