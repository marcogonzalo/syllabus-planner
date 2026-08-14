"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock, ArrowLeftRight } from "lucide-react";

import { AppShell, ExportButton } from "@/components/AppShell";
import { AddModuleDialog } from "@/components/AddModuleDialog";
import { ModuleEditor } from "@/components/ModuleEditor";
import { SyllabusPickerDialog } from "@/components/SyllabusPickerDialog";
import { SyllabusTree } from "@/components/SyllabusTree";
import { Button } from "@/components/ui/button";
import {
  attachModuleToSection,
  createSection,
  createSyllabus,
  addContentToModule,
  exportSyllabusCsv,
  fetchSyllabusDetail,
  fetchSyllabuses,
  importSyllabusAsSection,
  reorderModules,
  reorderModuleContents,
  reorderSections,
  updateContent,
  updateModule,
  updateSyllabus,
} from "@/lib/api";
import type { SyllabusDetail, SyllabusSummary } from "@/types";

export function SyllabusPlanner() {
  const [syllabuses, setSyllabuses] = useState<SyllabusSummary[]>([]);
  const [selectedSyllabusId, setSelectedSyllabusId] = useState<number | null>(
    null,
  );
  const [syllabus, setSyllabus] = useState<SyllabusDetail | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(
    null,
  );
  const [addModuleSectionId, setAddModuleSectionId] = useState<number | null>(
    null,
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSyllabuses = useCallback(async () => {
    const items = await fetchSyllabuses();
    setSyllabuses(items);
    if (!selectedSyllabusId && items.length > 0) {
      setSelectedSyllabusId(items[0].id);
    }
  }, [selectedSyllabusId]);

  const loadSyllabus = useCallback(async (id: number) => {
    const detail = await fetchSyllabusDetail(id);
    setSyllabus(detail);
  }, []);

  useEffect(() => {
    async function bootstrap() {
      try {
        setLoading(true);
        setError(null);
        await loadSyllabuses();
      } catch (bootstrapError) {
        setError(
          bootstrapError instanceof Error
            ? bootstrapError.message
            : "Failed to load syllabuses",
        );
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, [loadSyllabuses]);

  useEffect(() => {
    if (!selectedSyllabusId) {
      return;
    }

    let cancelled = false;

    fetchSyllabusDetail(selectedSyllabusId)
      .then((detail) => {
        if (!cancelled) {
          setSyllabus(detail);
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load syllabus",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedSyllabusId]);

  const activeSyllabus =
    selectedSyllabusId && syllabus?.id === selectedSyllabusId ? syllabus : null;

  async function handleCreateSyllabus(title: string) {
    const created = await createSyllabus({ title });
    await loadSyllabuses();
    setSelectedSyllabusId(created.id);
    setSelectedModuleId(null);
    setSelectedSectionId(null);
  }

  function handleSelectSyllabus(id: number) {
    setSelectedSyllabusId(id);
    setSelectedModuleId(null);
    setSelectedSectionId(null);
  }

  async function handleAddSection() {
    if (!selectedSyllabusId) {
      return;
    }

    const title = window.prompt("Section title");
    if (!title?.trim()) {
      return;
    }

    const detail = await createSection(selectedSyllabusId, {
      title: title.trim(),
      description: "",
      hours_per_module: 8,
      extra_hours_per_module: 0,
      order_index: syllabus?.sections.length ?? 0,
    });
    setSyllabus(detail);
  }

  async function handleAddModule(sectionId: number) {
    setAddModuleSectionId(sectionId);
  }

  async function handleSubmitAddModule(data: {
    title: string;
    duration_days: number;
  }) {
    if (addModuleSectionId === null) {
      return;
    }

    await attachModuleToSection(addModuleSectionId, data);
    if (selectedSyllabusId) {
      await loadSyllabus(selectedSyllabusId);
    }
  }

  async function handleReorderSections(orderedIds: number[]) {
    if (!selectedSyllabusId) {
      return;
    }
    const detail = await reorderSections(selectedSyllabusId, orderedIds);
    setSyllabus(detail);
  }

  async function handleReorderModules(sectionId: number, orderedIds: number[]) {
    const detail = await reorderModules(sectionId, orderedIds);
    setSyllabus(detail);
  }

  async function handleReorderContents(moduleId: number, orderedIds: number[]) {
    await reorderModuleContents(moduleId, orderedIds);
    if (selectedSyllabusId) {
      await loadSyllabus(selectedSyllabusId);
    }
  }

  async function handleUpdateSectionTitle(sectionId: number, title: string) {
    await updateSyllabus(sectionId, { title });
    if (selectedSyllabusId) {
      await loadSyllabus(selectedSyllabusId);
    }
  }

  async function handleUpdateModuleTitle(moduleId: number, title: string) {
    await updateModule(moduleId, { title });
    if (selectedSyllabusId) {
      await loadSyllabus(selectedSyllabusId);
    }
  }

  async function handleUpdateContent(
    moduleId: number,
    contentId: number,
    text: string,
  ) {
    await updateContent(moduleId, contentId, text);
    if (selectedSyllabusId) {
      await loadSyllabus(selectedSyllabusId);
    }
  }

  async function handleAddContent(moduleId: number, type: string) {
    const section = syllabus?.sections.find((item) =>
      item.modules.some((module) => module.id === moduleId),
    );
    const module = section?.modules.find((item) => item.id === moduleId);
    await addContentToModule(moduleId, {
      type,
      title: "New content",
      order_index: module?.contents?.length ?? 0,
    });
    if (selectedSyllabusId) {
      await loadSyllabus(selectedSyllabusId);
    }
  }

  async function handleImportSection(childId: number) {
    if (!selectedSyllabusId) {
      return;
    }
    const orderIndex = syllabus?.sections.length ?? 0;
    await importSyllabusAsSection(selectedSyllabusId, childId, orderIndex);
    await loadSyllabus(selectedSyllabusId);
  }

  function handleSelectModule(moduleId: number, sectionId: number) {
    setSelectedModuleId(moduleId);
    setSelectedSectionId(sectionId);
  }

  if (loading) {
    return (
      <AppShell title="Syllabus Planner" subtitle="Loading programs...">
        <div className="admin-empty">Loading syllabus planner...</div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell title="Syllabus Planner" subtitle="Connection error">
        <div className="admin-card border-destructive/30 p-6">
          <p className="font-medium text-destructive">
            Failed to connect to API
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <p className="mt-4 text-sm text-muted-foreground">
            Start backend with{" "}
            <code className="rounded bg-muted px-1">
              docker compose -f docker-compose.yml -f docker-compose.dev.yml
              --profile local-db up --build
            </code>
          </p>
        </div>
      </AppShell>
    );
  }

  const syllabusHeader = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-1.5">
          <h1 className="truncate text-base font-semibold text-foreground">
            {activeSyllabus?.title ?? "Select a syllabus"}
          </h1>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0 text-muted-foreground"
            aria-label="Change syllabus"
            onClick={() => setPickerOpen(true)}
          >
            <ArrowLeftRight className="size-3.5" />
          </Button>
        </div>
        {activeSyllabus ? (
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" />
              {activeSyllabus.totals.days} days
            </span>
            <span aria-hidden>·</span>
            <span>{activeSyllabus.sections.length} sections</span>
            <span aria-hidden>·</span>
            <span>{activeSyllabus.totals.modules} modules</span>
            <span aria-hidden>·</span>
            <span>{activeSyllabus.totals.hours}h</span>
          </p>
        ) : (
          <p className="mt-0.5 text-xs text-muted-foreground">
            Choose or create a program to start planning.
          </p>
        )}
      </div>

      {selectedSyllabusId ? (
        <div className="shrink-0">
          <ExportButton href={exportSyllabusCsv(selectedSyllabusId)} />
        </div>
      ) : null}
    </div>
  );

  return (
    <AppShell header={syllabusHeader}>
      <div className="space-y-6">
        {activeSyllabus ? (
          <SyllabusTree
            syllabus={activeSyllabus}
            selectedModuleId={selectedModuleId}
            onSelectModule={handleSelectModule}
            onReorderSections={handleReorderSections}
            onReorderModules={handleReorderModules}
            onReorderContents={handleReorderContents}
            onAddSection={handleAddSection}
            onImportSection={handleImportSection}
            onAddModule={handleAddModule}
            onUpdateSectionTitle={handleUpdateSectionTitle}
            onUpdateModuleTitle={handleUpdateModuleTitle}
            onUpdateContent={handleUpdateContent}
            onAddContent={handleAddContent}
          />
        ) : (
          <div className="admin-empty">
            Use the switch button to select or create a syllabus.
          </div>
        )}

        {selectedModuleId ? (
          <ModuleEditor
            moduleId={selectedModuleId}
            sectionId={selectedSectionId}
            onUpdated={async () => {
              if (selectedSyllabusId) {
                await loadSyllabus(selectedSyllabusId);
              }
            }}
          />
        ) : null}

        <SyllabusPickerDialog
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          syllabuses={syllabuses}
          selectedSyllabusId={selectedSyllabusId}
          onSelect={handleSelectSyllabus}
          onCreate={handleCreateSyllabus}
        />

        <AddModuleDialog
          key={addModuleSectionId ?? "closed"}
          open={addModuleSectionId !== null}
          onOpenChange={(open) => {
            if (!open) {
              setAddModuleSectionId(null);
            }
          }}
          onSubmit={handleSubmitAddModule}
        />
      </div>
    </AppShell>
  );
}
