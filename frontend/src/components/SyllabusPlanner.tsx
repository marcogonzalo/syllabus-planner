"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";

import { AppShell, ExportButton } from "@/components/AppShell";
import { ModuleEditor } from "@/components/ModuleEditor";
import { SyllabusTree } from "@/components/SyllabusTree";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  attachModuleToSection,
  createSection,
  createSyllabus,
  exportSyllabusCsv,
  fetchSyllabusDetail,
  fetchSyllabuses,
  reorderModules,
  reorderModuleContents,
  reorderSections,
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

  const activeSyllabus = selectedSyllabusId ? syllabus : null;

  async function handleCreateSyllabus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") || "").trim();
    if (!title) {
      return;
    }

    const created = await createSyllabus({ title });
    await loadSyllabuses();
    setSelectedSyllabusId(created.id);
    event.currentTarget.reset();
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
    const title = window.prompt("Module title");
    if (!title?.trim()) {
      return;
    }

    await attachModuleToSection(sectionId, { title: title.trim() });
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

  function handleSelectModule(moduleId: number, sectionId: number) {
    setSelectedModuleId(moduleId);
    setSelectedSectionId(sectionId);
  }

  const programItems = syllabuses.map((item) => ({
    value: String(item.id),
    label: item.title,
  }));

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

  return (
    <AppShell
      title={activeSyllabus?.title || "Syllabus Planner"}
      subtitle="Manage sections, modules, contents, and metadata"
      badge={
        activeSyllabus
          ? `${activeSyllabus.sections.length} sections · ${activeSyllabus.totals.modules} modules`
          : `${syllabuses.length} programs`
      }
      actions={
        selectedSyllabusId ? (
          <ExportButton href={exportSyllabusCsv(selectedSyllabusId)} />
        ) : null
      }
    >
      <div className="space-y-6">
        <div className="admin-card h-fit">
          <div className="admin-card-header !py-4">
            <h2 className="text-sm font-semibold text-foreground">Programs</h2>
          </div>
          <div className="admin-card-body space-y-4 !pt-0">
            <Select
              value={selectedSyllabusId ? String(selectedSyllabusId) : null}
              items={programItems}
              onValueChange={(value) => {
                if (!value) {
                  return;
                }
                setSelectedSyllabusId(Number(value));
                setSelectedModuleId(null);
              }}
            >
              <SelectTrigger className="w-full sm:max-w-md">
                <SelectValue placeholder="Select program" />
              </SelectTrigger>
              <SelectContent>
                {syllabuses.map((item) => (
                  <SelectItem key={item.id} value={String(item.id)}>
                    {item.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <form
              onSubmit={handleCreateSyllabus}
              className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center"
            >
              <Input
                name="title"
                placeholder="New program title"
                className="min-w-0 flex-1 sm:max-w-md"
              />
              <Button type="submit" size="sm" className="shrink-0">
                <Plus className="size-4" />
                New Program
              </Button>
            </form>
          </div>
        </div>

        {activeSyllabus ? (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard label="Sections" value={activeSyllabus.sections.length} />
              <StatCard label="Modules" value={activeSyllabus.totals.modules} />
              <StatCard label="Total hours" value={activeSyllabus.totals.hours} />
            </div>

            <SyllabusTree
              syllabus={activeSyllabus}
              selectedModuleId={selectedModuleId}
              onSelectModule={handleSelectModule}
              onReorderSections={handleReorderSections}
              onReorderModules={handleReorderModules}
              onReorderContents={handleReorderContents}
              onAddSection={handleAddSection}
              onAddModule={handleAddModule}
            />
          </>
        ) : (
          <div className="admin-empty">
            Create or select a program to begin building sections and modules.
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
      </div>
    </AppShell>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="admin-stat-card">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}
