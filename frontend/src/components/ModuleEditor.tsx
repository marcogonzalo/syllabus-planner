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
import { MetadataForm } from "@/components/MetadataForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addContentToModule,
  fetchModule,
  reorderModuleContents,
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
  return "badge-project";
}

function ContentRow({ content }: { content: ContentItem }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: content.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

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
        <span className="block truncate text-sm font-medium text-foreground">
          {content.title}
        </span>
        {content.body ? (
          <p className="mt-1 line-clamp-2 text-xs whitespace-pre-wrap text-muted-foreground">
            {content.body}
          </p>
        ) : null}
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
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  const loadModule = useCallback(async () => {
    const detail = await fetchModule(moduleId);
    setModule(detail);
    setTitle(detail.title);
  }, [moduleId]);

  useEffect(() => {
    let cancelled = false;

    fetchModule(moduleId)
      .then((detail) => {
        if (!cancelled) {
          setModule(detail);
          setTitle(detail.title);
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

  async function handleSaveTitle() {
    setSaving(true);
    try {
      await updateModule(moduleId, title);
      await onUpdated();
      await loadModule();
    } finally {
      setSaving(false);
    }
  }

  async function handleAddContent() {
    const contentTitle = window.prompt("Content title");
    if (!contentTitle?.trim()) {
      return;
    }

    const contentType = window.prompt(
      "Type: theory, exercise, or project",
      "theory",
    );
    if (!contentType) {
      return;
    }

    await addContentToModule(moduleId, {
      type: contentType.trim().toLowerCase(),
      title: contentTitle.trim(),
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
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="max-w-md text-base font-medium"
            />
            <Button onClick={handleSaveTitle} disabled={saving} size="sm">
              {saving ? "Saving..." : "Save"}
            </Button>
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddContent}
            >
              <Plus className="size-4" />
              Add Content
            </Button>
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
                  <ContentRow key={content.id} content={content} />
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
