"use client";

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
import { GripVertical, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { ContentTypeIcon } from "@/components/ContentTypeIcon";
import { InlineEditor } from "@/components/InlineEditor";
import { MetadataForm } from "@/components/MetadataForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  addContentToModule,
  fetchModule,
  reorderModuleContents,
  updateContent,
  updateModule,
} from "@/lib/api";
import type { ContentItem, ModuleDetail } from "@/types";

type ModuleEditorProps = {
  moduleId: number;
  sectionId: number | null;
  onUpdated: () => Promise<void>;
};

function contentBadgeClass(type: string) {
  if (type === "theory") return "badge-theory";
  if (type === "exercise") return "badge-exercise";
  if (type === "quiz") return "badge-quiz";
  return "badge-project";
}

function ContentRow({
  content,
  onUpdated,
}: {
  content: ContentItem;
  onUpdated: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: content.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const fullText = content.body
    ? `${content.title}\n${content.body}`
    : content.title;

  async function handleSave(text: string) {
    await updateContent(content.module_id, content.id, text);
    await onUpdated();
  }

  return (
    <div ref={setNodeRef} style={style} className="admin-content-row">
      <button
        type="button"
        className="cursor-grab rounded p-1 text-muted-foreground hover:bg-muted"
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${content.title}`}
      >
        <GripVertical className="size-4" />
      </button>
      <ContentTypeIcon type={content.type} />
      <Badge className={contentBadgeClass(content.type)}>{content.type}</Badge>
      <div className="min-w-0 flex-1">
        <InlineEditor
          value={fullText}
          onSave={handleSave}
          multiline
          className="w-full text-sm"
        />
      </div>
    </div>
  );
}

export function ModuleEditor({
  moduleId,
  sectionId,
  onUpdated,
}: ModuleEditorProps) {
  const [module, setModule] = useState<ModuleDetail | null>(null);
  const [saving, setSaving] = useState(false);

  const loadModule = useCallback(async () => {
    const detail = await fetchModule(moduleId);
    setModule(detail);
  }, [moduleId]);

  useEffect(() => {
    let cancelled = false;

    fetchModule(moduleId)
      .then((detail) => {
        if (!cancelled) {
          setModule(detail);
        }
      })
      .catch(console.error);

    return () => {
      cancelled = true;
    };
  }, [moduleId]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  async function handleSaveTitle(newTitle: string) {
    setSaving(true);
    try {
      await updateModule(moduleId, { title: newTitle });
      await onUpdated();
      await loadModule();
    } finally {
      setSaving(false);
    }
  }

  async function handleAddContent(type: string) {
    await addContentToModule(moduleId, {
      type,
      title: "New content",
      order_index: module?.contents.length ?? 0,
    });
    await loadModule();
    await onUpdated();
  }

  async function handleContentDragEnd(event: DragEndEvent) {
    if (!module) {
      return;
    }

    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const ids = module.contents.map((content) => content.id);
    const oldIndex = ids.indexOf(Number(active.id));
    const newIndex = ids.indexOf(Number(over.id));
    const nextOrder = arrayMove(ids, oldIndex, newIndex);

    const updated = await reorderModuleContents(moduleId, nextOrder);
    setModule(updated);
  }

  if (!module) {
    return (
      <div className="admin-card p-6 text-sm text-muted-foreground">
        Loading module...
      </div>
    );
  }

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Module editor
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <InlineEditor
              value={module.title}
              onSave={handleSaveTitle}
              className="max-w-md text-base font-medium"
            />
            {saving ? (
              <span className="text-xs text-muted-foreground">Saving...</span>
            ) : null}
          </div>
          {sectionId ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Section ID: {sectionId}
            </p>
          ) : null}
        </div>
      </div>

      <div className="admin-card-body grid gap-8 lg:grid-cols-2">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Contents</h3>
            <div className="flex flex-wrap gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAddContent("theory")}
              >
                <Plus className="size-3" />
                Lesson
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAddContent("exercise")}
              >
                <Plus className="size-3" />
                Exercise
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAddContent("project")}
              >
                <Plus className="size-3" />
                Project
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAddContent("quiz")}
              >
                <Plus className="size-3" />
                Quiz
              </Button>
            </div>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleContentDragEnd}
          >
            <SortableContext
              items={module.contents.map((content) => content.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-2">
                {module.contents.map((content) => (
                  <ContentRow
                    key={content.id}
                    content={content}
                    onUpdated={loadModule}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {module.contents.length === 0 ? (
            <p className="mt-4 rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
              No contents yet.
            </p>
          ) : null}
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            Metadata
          </h3>
          <MetadataForm
            key={moduleId}
            moduleId={moduleId}
            initialMetadata={module.metadata}
            initialSkills={module.skills}
            onSaved={loadModule}
          />
        </div>
      </div>
    </div>
  );
}
