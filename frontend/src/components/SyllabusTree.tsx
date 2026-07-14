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
import { ChevronDown, Link2, Plus, Search, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { SectionCard } from "@/components/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchSyllabuses } from "@/lib/api";
import type { Section, SyllabusDetail, SyllabusSummary } from "@/types";

type SyllabusTreeProps = {
  syllabus: SyllabusDetail;
  selectedModuleId: number | null;
  onSelectModule: (moduleId: number, sectionId: number) => void;
  onReorderSections: (orderedIds: number[]) => Promise<void>;
  onReorderModules: (sectionId: number, orderedIds: number[]) => Promise<void>;
  onReorderContents: (moduleId: number, orderedIds: number[]) => Promise<void>;
  onAddSection: () => void;
  onImportSection: (childId: number) => Promise<void>;
  onAddModule: (sectionId: number) => void;
  onUpdateSectionTitle: (sectionId: number, title: string) => Promise<void>;
  onUpdateModuleTitle?: (moduleId: number, title: string) => Promise<void>;
  onUpdateContent?: (moduleId: number, contentId: number, text: string) => Promise<void>;
};

function ImportSectionPanel({
  onImport,
  onCancel,
}: {
  onImport: (childId: number) => Promise<void>;
  onCancel: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SyllabusSummary[]>([]);
  const [searching, setSearching] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    setQuery(q);
    if (q.trim().length < 1) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const items = await searchSyllabuses(q);
      setResults(items);
    } finally {
      setSearching(false);
    }
  }, []);

  async function handleSelect(childId: number) {
    await onImport(childId);
    onCancel();
  }

  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="mb-3 flex items-center gap-2">
        <Search className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">
          Import existing syllabus as section
        </span>
        <button
          type="button"
          onClick={onCancel}
          className="ml-auto rounded p-1 text-muted-foreground hover:bg-muted"
        >
          <X className="size-4" />
        </button>
      </div>
      <Input
        value={query}
        onChange={(e) => doSearch(e.target.value)}
        placeholder="Search syllabuses by title..."
        className="mb-2"
        autoFocus
      />
      {searching ? (
        <p className="text-xs text-muted-foreground">Searching...</p>
      ) : null}
      {results.length > 0 ? (
        <div className="flex flex-col gap-1">
          {results.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50"
            >
              <Link2 className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate font-medium text-foreground">
                {item.title}
              </span>
            </button>
          ))}
        </div>
      ) : query.trim().length >= 1 && !searching ? (
        <p className="text-xs text-muted-foreground">No results found.</p>
      ) : null}
    </div>
  );
}

export function SyllabusTree({
  syllabus,
  selectedModuleId,
  onSelectModule,
  onReorderSections,
  onReorderModules,
  onReorderContents,
  onAddSection,
  onImportSection,
  onAddModule,
  onUpdateSectionTitle,
  onUpdateModuleTitle,
  onUpdateContent,
}: SyllabusTreeProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showImportPanel, setShowImportPanel] = useState(false);

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

  function handleNewSection() {
    setShowAddMenu(false);
    setShowImportPanel(false);
    onAddSection();
  }

  function handleShowImport() {
    setShowAddMenu(false);
    setShowImportPanel(true);
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
        <div className="relative">
          <Button
            onClick={() => setShowAddMenu((v) => !v)}
            size="sm"
          >
            <Plus className="size-4" />
            Add Section
            <ChevronDown className="size-3 ml-1" />
          </Button>
          {showAddMenu ? (
            <div className="absolute right-0 top-full z-10 mt-1 w-52 rounded-lg border border-border bg-card shadow-md">
              <button
                type="button"
                onClick={handleNewSection}
                className="flex w-full items-center gap-2 rounded-t-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/50"
              >
                <Plus className="size-4 text-muted-foreground" />
                New section
              </button>
              <button
                type="button"
                onClick={handleShowImport}
                className="flex w-full items-center gap-2 rounded-b-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/50"
              >
                <Link2 className="size-4 text-muted-foreground" />
                Import existing syllabus
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {showImportPanel ? (
        <div className="border-b border-border px-6 py-4">
          <ImportSectionPanel
            onImport={onImportSection}
            onCancel={() => setShowImportPanel(false)}
          />
        </div>
      ) : null}

      <div className="admin-card-body">
        {syllabus.sections.length === 0 && !showImportPanel ? (
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
                    onUpdateTitle={onUpdateSectionTitle}
                    onUpdateModuleTitle={onUpdateModuleTitle}
                    onUpdateContent={onUpdateContent}
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
