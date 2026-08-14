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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
  onUpdateContent?: (
    moduleId: number,
    contentId: number,
    text: string,
  ) => Promise<void>;
  onAddContent?: (moduleId: number, type: string) => Promise<void>;
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
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
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

function AddSectionSlot({
  onNewSection,
  onImportSection,
}: {
  onNewSection: () => void;
  onImportSection: () => void;
}) {
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
    <div className="flex justify-center py-1">
      <div ref={rootRef} className="relative">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          aria-expanded={open}
          aria-haspopup="menu"
          onClick={() => setOpen((current) => !current)}
        >
          <Plus className="size-3.5" />
          Add Section
          <ChevronDown className="size-3" />
        </Button>
        {open ? (
          <div
            role="menu"
            className="absolute top-full left-1/2 z-10 mt-1 w-52 -translate-x-1/2 rounded-lg border border-border bg-card shadow-md"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onNewSection();
              }}
              className="flex w-full items-center gap-2 rounded-t-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/50"
            >
              <Plus className="size-4 text-muted-foreground" />
              New section
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onImportSection();
              }}
              className="flex w-full items-center gap-2 rounded-b-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/50"
            >
              <Link2 className="size-4 text-muted-foreground" />
              Import existing syllabus
            </button>
          </div>
        ) : null}
      </div>
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
  onAddContent,
}: SyllabusTreeProps) {
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

  return (
    <div className="flex flex-col gap-2">
      {showImportPanel ? (
        <ImportSectionPanel
          onImport={onImportSection}
          onCancel={() => setShowImportPanel(false)}
        />
      ) : null}

      {syllabus.sections.length === 0 && !showImportPanel ? (
        <div className="admin-empty">
          No sections yet. Add a section (microsyllabus) to start building the
          program.
        </div>
      ) : null}

      <AddSectionSlot
        onNewSection={onAddSection}
        onImportSection={() => setShowImportPanel(true)}
      />

      {syllabus.sections.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleSectionDragEnd}
        >
          <SortableContext
            items={sectionIds}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-2">
              {syllabus.sections.map((section: Section) => (
                <div key={section.id} className="flex flex-col gap-2">
                  <SectionCard
                    section={section}
                    selectedModuleId={selectedModuleId}
                    onSelectModule={onSelectModule}
                    onReorderModules={onReorderModules}
                    onReorderContents={onReorderContents}
                    onAddModule={onAddModule}
                    onUpdateTitle={onUpdateSectionTitle}
                    onUpdateModuleTitle={onUpdateModuleTitle}
                    onUpdateContent={onUpdateContent}
                    onAddContent={onAddContent}
                  />
                  <AddSectionSlot
                    onNewSection={onAddSection}
                    onImportSection={() => setShowImportPanel(true)}
                  />
                </div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : null}
    </div>
  );
}
