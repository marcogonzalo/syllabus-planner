"use client";

import { useState } from "react";
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
import { ChevronDown, GripVertical } from "lucide-react";

import { ContentTypeIcon } from "@/components/ContentTypeIcon";
import { ContentTypeIconStack } from "@/components/ContentTypeIconStack";
import { InlineEditor } from "@/components/InlineEditor";
import { Badge } from "@/components/ui/badge";
import { resolveContentDisplay } from "@/lib/content";
import { cn } from "@/lib/utils";
import type { ContentSummary } from "@/types";

type ContentItemRowProps = {
  content: ContentSummary;
  onSave?: (text: string) => Promise<void>;
};

function ContentItemRow({ content, onSave }: ContentItemRowProps) {
  const [expanded, setExpanded] = useState(false);
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
            hasBody && "cursor-pointer",
          )}
          onClick={() => {
            if (hasBody) {
              setExpanded((current) => !current);
            }
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if ((event.key === "Enter" || event.key === " ") && hasBody) {
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
              className="text-sm font-medium text-foreground"
            />
          </div>
          {hasBody ? (
            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform",
                !expanded && "-rotate-90",
              )}
            />
          ) : null}
        </div>
      </div>
      {hasBody && expanded ? (
        <div className="mt-2 pl-11 text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground">
          {body}
        </div>
      ) : null}
    </div>
  );
}

type ModuleContentsListProps = {
  moduleId: number;
  contents: ContentSummary[];
  onReorderContents: (moduleId: number, orderedIds: number[]) => Promise<void>;
  onUpdateContent?: (moduleId: number, contentId: number, text: string) => Promise<void>;
};

function ModuleContentsList({
  moduleId,
  contents,
  onReorderContents,
  onUpdateContent,
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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleContentDragEnd}
    >
      <SortableContext
        items={contentIds}
        strategy={verticalListSortingStrategy}
      >
        <div className="ml-7 flex flex-col gap-2 border-l border-border pl-3">
          {contents.map((content) => (
            <ContentItemRow
              key={content.id}
              content={content}
              onSave={onUpdateContent ? (text) => onUpdateContent(moduleId, content.id, text) : undefined}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
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
  onUpdateContent?: (moduleId: number, contentId: number, text: string) => Promise<void>;
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
}: DraggableItemProps) {
  const [expanded, setExpanded] = useState(false);
  const isModule = kind === "module";
  const hasContents = isModule && contents.length > 0;

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
    if (hasContents) {
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
          aria-expanded={hasContents ? expanded : undefined}
          aria-label={
            hasContents
              ? expanded
                ? `Collapse ${title}`
                : `Expand ${title}`
              : title
          }
        >
          {isModule ? (
            <ContentTypeIconStack types={contentTypes} />
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

          {hasContents ? (
            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform",
                !expanded && "-rotate-90",
              )}
            />
          ) : null}
        </div>
      </div>

      {isModule && expanded && hasContents && onReorderContents ? (
        <ModuleContentsList
          moduleId={id}
          contents={contents}
          onReorderContents={onReorderContents}
          onUpdateContent={onUpdateContent}
        />
      ) : null}
    </div>
  );
}
