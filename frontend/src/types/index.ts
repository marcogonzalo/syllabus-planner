export type Totals = {
  modules: number;
  days: number;
  hours: number;
};

export type ContentSummary = {
  id: number;
  type: string;
  title: string;
  body?: string | null;
  order_index: number;
};

export type ContentType = "theory" | "exercise" | "project" | "quiz";

export type ModuleSummary = {
  id: number;
  title: string;
  duration_days: number;
  order_index: number;
  primary_content_type?: string | null;
  content_types?: string[];
  contents?: ContentSummary[];
};

export type Section = {
  id: number;
  title: string;
  description?: string | null;
  hours_per_module?: number | null;
  extra_hours_per_module?: number | null;
  order_index: number;
  totals: Totals;
  modules: ModuleSummary[];
};

export type SyllabusSummary = {
  id: number;
  title: string;
  description?: string | null;
  hours_per_module?: number | null;
  extra_hours_per_module?: number | null;
};

export type SyllabusDetail = SyllabusSummary & {
  sections: Section[];
  totals: Totals;
};

export type ContentItem = {
  id: number;
  module_id: number;
  type: string;
  title: string;
  body?: string | null;
  order_index: number;
};

export type ModuleMetadata = {
  module_id: number;
  how_to_think?: string | null;
  best_practices?: string | null;
  patterns?: string | null;
  antipatterns?: string | null;
  limitations?: string | null;
};

export type Skill = {
  id: number;
  name: string;
};

export type ModuleDetail = {
  id: number;
  title: string;
  duration_days: number;
  syllabus_id?: number | null;
  contents: ContentItem[];
  metadata?: ModuleMetadata | null;
  skills: Skill[];
};
