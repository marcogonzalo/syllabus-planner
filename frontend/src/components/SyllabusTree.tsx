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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { useMemo } from "react";

import { SectionCard } from "@/components/SectionCard";
import { Button } from "@/components/ui/button";
import type { Section, SyllabusDetail } from "@/types";

type SyllabusTreeProps = {
  syllabus: SyllabusDetail;
  selectedModuleId: number | null;
  onSelectModule: (moduleId: number, sectionId: number) => void;
  onReorderSections: (orderedIds: number[]) => Promise<void>;
  onReorderModules: (sectionId: number, orderedIds: number[]) => Promise<void>;
  onReorderContents: (moduleId: number, orderedIds: number[]) => Promise<void>;
  onAddSection: () => void;
  onAddModule: (sectionId: number) => void;
};

export function SyllabusTree({
  syllabus,
  selectedModuleId,
  onSelectModule,
  onReorderSections,
  onReorderModules,
  onReorderContents,
  onAddSection,
  onAddModule,
}: SyllabusTreeProps) {
  const sectionIds = useMemo(
    () => syllabus.sections.map((section) => section.id),
    [syllabus.sections],
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  async function handleSectionDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = sectionIds.indexOf(Number(active.id));
    const newIndex = sectionIds.indexOf(Number(over.id));
    const nextOrder = arrayMove(sectionIds, oldIndex, newIndex);
    await onReorderSections(nextOrder);
  }

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Program structure
          </p>
          <h2 className="text-lg font-semibold text-foreground">
            Sections & modules
          </h2>
        </div>
        <Button onClick={onAddSection} size="sm">
          <Plus className="size-4" />
          Add Section
        </Button>
      </div>

      <div className="admin-card-body">
        {syllabus.sections.length === 0 ? (
          <div className="admin-empty">
            No sections yet. Add a section (microsyllabus) to start building the
            program.
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleSectionDragEnd}
          >
            <SortableContext
              items={sectionIds}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-4">
                {syllabus.sections.map((section: Section) => (
                  <SectionCard
                    key={section.id}
                    section={section}
                    selectedModuleId={selectedModuleId}
                    onSelectModule={onSelectModule}
                    onReorderModules={onReorderModules}
                    onReorderContents={onReorderContents}
                    onAddModule={onAddModule}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
