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

/** One icon per distinct type in the module, capped at 4. */
export function visibleContentTypeIcons(
  types: string[] | null | undefined,
): ContentTypeKey[] {
  const seen = new Set<ContentTypeKey>();
  const ordered: ContentTypeKey[] = [];

  for (const key of DISPLAY_ORDER) {
    if (types?.some((type) => normalizeContentType(type) === key)) {
      seen.add(key);
      ordered.push(key);
    }
  }

  for (const type of types ?? []) {
    const normalized = normalizeContentType(type);
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      ordered.push(normalized);
    }
  }

  return ordered.slice(0, MAX_VISIBLE);
}

type ContentTypeIconStackProps = {
  types?: string[] | null;
  count?: number;
  className?: string;
};

export function ContentTypeIconStack({
  types,
  count,
  className,
}: ContentTypeIconStackProps) {
  const visible = visibleContentTypeIcons(types);
  const total = count ?? types?.length ?? 0;

  if (visible.length === 0) {
    return (
      <div className={cn("flex shrink-0 items-center", className)} aria-hidden>
        <div className="flex size-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-semibold text-muted-foreground tabular-nums">
          {total}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex shrink-0 items-center", className)} aria-hidden>
      <div className="flex size-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-semibold text-foreground tabular-nums">
        {total}
      </div>
      {visible.map((type, index) => (
        <ContentTypeIcon
          key={type}
          type={type}
          className="size-8 -ml-2.5 !rounded-full border-2 border-background"
          iconClassName="size-3.5"
        />
      ))}
    </div>
  );
}
