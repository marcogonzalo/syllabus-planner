export type AddModuleFormValues = {
  title: string;
  duration_days: number;
};

export type AddModuleFormErrors = {
  title?: string;
  duration_days?: string;
};

export function parseAddModuleForm(
  titleRaw: string,
  durationRaw: string,
): { values: AddModuleFormValues } | { errors: AddModuleFormErrors } {
  const title = titleRaw.trim();
  const errors: AddModuleFormErrors = {};

  if (!title) {
    errors.title = "Title is required.";
  }

  const duration_days = Number(durationRaw);
  if (!Number.isFinite(duration_days) || duration_days <= 0) {
    errors.duration_days = "Duration must be a positive number of days.";
  }

  if (errors.title || errors.duration_days) {
    return { errors };
  }

  return { values: { title, duration_days } };
}
