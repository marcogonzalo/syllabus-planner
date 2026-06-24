import type {
  ModuleDetail,
  ModuleMetadata,
  ModuleSummary,
  Skill,
  SyllabusDetail,
  SyllabusSummary,
} from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function fetchSyllabuses() {
  return request<SyllabusSummary[]>("/syllabuses/");
}

export function fetchSyllabusDetail(id: number) {
  return request<SyllabusDetail>(`/syllabuses/${id}`);
}

export function createSyllabus(data: { title: string; description?: string }) {
  return request<SyllabusSummary>("/syllabuses/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function createSection(
  syllabusId: number,
  data: {
    title: string;
    description?: string;
    hours_per_module?: number;
    extra_hours_per_module?: number;
    order_index?: number;
  },
) {
  return request<SyllabusDetail>(`/syllabuses/${syllabusId}/sections`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function reorderSections(syllabusId: number, orderedIds: number[]) {
  return request<SyllabusDetail>(`/syllabuses/${syllabusId}/sections/reorder`, {
    method: "PATCH",
    body: JSON.stringify({ ordered_ids: orderedIds }),
  });
}

export function attachModuleToSection(
  sectionId: number,
  data: { module_id?: number; title?: string; order_index?: number },
) {
  return request<ModuleSummary>(`/syllabuses/${sectionId}/modules`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function reorderModules(sectionId: number, orderedIds: number[]) {
  return request<SyllabusDetail>(`/syllabuses/${sectionId}/modules/reorder`, {
    method: "PATCH",
    body: JSON.stringify({ ordered_ids: orderedIds }),
  });
}

export function fetchModule(moduleId: number) {
  return request<ModuleDetail>(`/modules/${moduleId}`);
}

export function updateModule(moduleId: number, title: string) {
  return request<ModuleDetail>(`/modules/${moduleId}`, {
    method: "PATCH",
    body: JSON.stringify({ title }),
  });
}

export function addContentToModule(
  moduleId: number,
  data: { type: string; title: string; order_index?: number },
) {
  return request(`/modules/${moduleId}/contents/`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function reorderModuleContents(moduleId: number, orderedIds: number[]) {
  return request<ModuleDetail>(`/modules/${moduleId}/contents/reorder`, {
    method: "PATCH",
    body: JSON.stringify({ ordered_ids: orderedIds }),
  });
}

export function updateModuleMetadata(moduleId: number, data: ModuleMetadata) {
  return request(`/modules/${moduleId}/metadata/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function searchSkills(search?: string) {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return request<Skill[]>(`/skills${query}`);
}

export function createSkill(name: string) {
  return request<Skill>("/skills/", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function updateModuleSkills(moduleId: number, skillIds: number[]) {
  return request<ModuleDetail>(`/modules/${moduleId}/skills`, {
    method: "PUT",
    body: JSON.stringify({ skill_ids: skillIds }),
  });
}

export function exportSyllabusCsv(syllabusId: number) {
  return `${API_URL}/syllabuses/${syllabusId}/export`;
}
