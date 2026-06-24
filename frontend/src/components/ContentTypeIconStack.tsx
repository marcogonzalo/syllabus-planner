import {
  ContentTypeIcon,
  normalizeContentType,
  type ContentTypeKey,
} from "@/components/ContentTypeIcon";
import { cn } from "@/lib/utils";

const MAX_VISIBLE = 4;

const DISPLAY_ORDER: ContentTypeKey[] = [
  "lesson",
  "quiz",
  "exercise",
  "project",
];

function uniqueNormalizedTypes(types: string[]): ContentTypeKey[] {
  const seen = new Set<ContentTypeKey>();
  const ordered: ContentTypeKey[] = [];

  for (const key of DISPLAY_ORDER) {
    if (types.some((type) => normalizeContentType(type) === key)) {
      seen.add(key);
      ordered.push(key);
    }
  }

  for (const type of types) {
    const normalized = normalizeContentType(type);
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      ordered.push(normalized);
    }
  }

  return ordered;
}

type ContentTypeIconStackProps = {
  types?: string[] | null;
  className?: string;
};

export function ContentTypeIconStack({
  types,
  className,
}: ContentTypeIconStackProps) {
  const normalized = uniqueNormalizedTypes(types ?? []);
  const visible = normalized.slice(0, MAX_VISIBLE);
  const overflow = normalized.length - visible.length;

  if (normalized.length === 0) {
    return (
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium text-muted-foreground",
          className,
        )}
        aria-hidden
      >
        —
      </div>
    );
  }

  return (
    <div className={cn("flex items-center", className)} aria-hidden>
      {visible.map((type, index) => (
        <ContentTypeIcon
          key={type}
          type={type}
          className={cn(
            "size-8 !rounded-full border-2 border-background",
            index > 0 && "-ml-2.5",
          )}
          iconClassName="size-3.5"
        />
      ))}
      {overflow > 0 ? (
        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-semibold text-muted-foreground",
            "-ml-2.5",
          )}
        >
          +{overflow}
        </div>
      ) : null}
    </div>
  );
}
