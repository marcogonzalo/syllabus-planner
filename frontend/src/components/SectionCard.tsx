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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Clock, ChevronDown, GripVertical, Layers, Plus } from "lucide-react";

import { DraggableItem } from "@/components/DraggableItem";
import { InlineEditor } from "@/components/InlineEditor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Section } from "@/types";

type SectionCardProps = {
  section: Section;
  selectedModuleId: number | null;
  onSelectModule: (moduleId: number, sectionId: number) => void;
  onReorderModules: (sectionId: number, orderedIds: number[]) => Promise<void>;
  onReorderContents: (moduleId: number, orderedIds: number[]) => Promise<void>;
  onAddModule: (sectionId: number) => void;
  onUpdateTitle: (sectionId: number, title: string) => Promise<void>;
  onUpdateModuleTitle?: (moduleId: number, title: string) => Promise<void>;
  onUpdateContent?: (
    moduleId: number,
    contentId: number,
    text: string,
  ) => Promise<void>;
  onAddContent?: (moduleId: number, type: string) => Promise<void>;
};

function SectionShell({
  section,
  children,
  selectedModuleId,
  onUpdateTitle,
}: {
  section: Section;
  children: React.ReactNode;
  selectedModuleId: number | null;
  onUpdateTitle?: (title: string) => void;
}) {
  const [userCollapsed, setUserCollapsed] = useState(false);
  const hasSelectedModule = section.modules.some(
    (module) => module.id === selectedModuleId,
  );
  const collapsed = hasSelectedModule ? false : userCollapsed;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`admin-section-card overflow-hidden ${isDragging ? "opacity-70" : ""}`}
    >
      <div className={cn("admin-section-header", collapsed && "border-b-0")}>
        <button
          type="button"
          className="mt-0.5 cursor-grab rounded-md p-1.5 text-muted-foreground hover:bg-muted active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label={`Reorder section ${section.title}`}
        >
          <GripVertical className="size-4" />
        </button>

        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300">
          <Layers className="size-5" />
        </div>

        <div className="flex min-w-0 flex-1 cursor-pointer items-start gap-1">
          <div
            role="button"
            tabIndex={0}
            className="min-w-0 flex-1 cursor-pointer text-left"
            onClick={() => setUserCollapsed((current) => !current)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setUserCollapsed((current) => !current);
              }
            }}
            aria-expanded={!collapsed}
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="badge-section">Section</Badge>
              <InlineEditor
                value={section.title}
                onSave={(title) => onUpdateTitle?.(title)}
                className="text-base font-semibold text-foreground"
              />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" />
                {section.totals.days}d · {section.totals.hours}h total
              </span>
              <span>{section.totals.modules} modules</span>
              <span>
                {section.hours_per_module ?? 0}h/module +{" "}
                {section.extra_hours_per_module ?? 0}h extra
              </span>
            </div>
          </div>

          <button
            type="button"
            className="shrink-0 cursor-pointer self-center rounded-md p-1.5 text-muted-foreground hover:bg-muted"
            onClick={() => setUserCollapsed((current) => !current)}
            aria-expanded={!collapsed}
            aria-label={
              collapsed
                ? `Expand section ${section.title}`
                : `Collapse section ${section.title}`
            }
          >
            <ChevronDown
              className={cn(
                "size-4 transition-transform",
                collapsed && "-rotate-90",
              )}
            />
          </button>
        </div>
      </div>

      {!collapsed ? <div className="px-5 py-4">{children}</div> : null}
    </div>
  );
}

export function SectionCard({
  section,
  selectedModuleId,
  onSelectModule,
  onReorderModules,
  onReorderContents,
  onAddModule,
  onUpdateTitle,
  onUpdateModuleTitle,
  onUpdateContent,
  onAddContent,
}: SectionCardProps) {
  const moduleIds = section.modules.map((module) => module.id);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  async function handleModuleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = moduleIds.indexOf(Number(active.id));
    const newIndex = moduleIds.indexOf(Number(over.id));
    const nextOrder = arrayMove(moduleIds, oldIndex, newIndex);
    await onReorderModules(section.id, nextOrder);
  }

  return (
    <SectionShell
      section={section}
      selectedModuleId={selectedModuleId}
      onUpdateTitle={(title) => onUpdateTitle(section.id, title)}
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">Modules</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onAddModule(section.id)}
        >
          <Plus className="size-4" />
          Add Module
        </Button>
      </div>

      {section.modules.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
          No modules in this section yet.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleModuleDragEnd}
        >
          <SortableContext
            items={moduleIds}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-2">
              {section.modules.map((module) => (
                <DraggableItem
                  key={module.id}
                  id={module.id}
                  title={module.title}
                  kind="module"
                  contentTypes={module.content_types}
                  contents={module.contents}
                  selected={selectedModuleId === module.id}
                  onSelect={() => onSelectModule(module.id, section.id)}
                  onReorderContents={onReorderContents}
                  onUpdateTitle={
                    onUpdateModuleTitle
                      ? (title) => onUpdateModuleTitle(module.id, title)
                      : undefined
                  }
                  onUpdateContent={onUpdateContent}
                  onAddContent={onAddContent}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </SectionShell>
  );
}
