import {
  BookOpen,
  ClipboardPen,
  Dumbbell,
  Laptop,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type ContentTypeKey = "lesson" | "quiz" | "exercise" | "project";

const CONTENT_TYPE_ICONS: Record<ContentTypeKey, LucideIcon> = {
  lesson: BookOpen,
  quiz: ClipboardPen,
  exercise: Dumbbell,
  project: Laptop,
};

export function normalizeContentType(
  type?: string | null,
): ContentTypeKey | null {
  if (!type) {
    return null;
  }

  switch (type.toLowerCase()) {
    case "theory":
    case "lesson":
      return "lesson";
    case "quiz":
      return "quiz";
    case "exercise":
    case "practica":
    case "practice":
      return "exercise";
    case "project":
    case "proyecto":
      return "project";
    default:
      return null;
  }
}

type ContentTypeIconProps = {
  type?: string | null;
  className?: string;
  iconClassName?: string;
};

export function ContentTypeIcon({
  type,
  className,
  iconClassName,
}: ContentTypeIconProps) {
  const contentType = normalizeContentType(type) ?? "lesson";
  const Icon = CONTENT_TYPE_ICONS[contentType];

  return (
    <div
      className={cn(
        "content-type-icon",
        `content-type-icon--${contentType}`,
        className,
      )}
    >
      <Icon className={cn("size-4", iconClassName)} />
    </div>
  );
}
