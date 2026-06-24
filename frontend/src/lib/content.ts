export type ResolvedContent = {
  title: string;
  body: string | null;
};

function formatLegacyBulletBody(rest: string): string {
  const parts = rest
    .split(" - ")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return rest.trim();
  }

  return parts
    .map((part) => (part.startsWith("-") ? part : `- ${part}`))
    .join("\n");
}

export function resolveContentDisplay(content: {
  title: string;
  body?: string | null;
}): ResolvedContent {
  const storedBody = content.body?.trim();
  if (storedBody) {
    return { title: content.title.trim(), body: storedBody };
  }

  const title = content.title.trim();
  const newlineIndex = title.indexOf("\n");
  if (newlineIndex !== -1) {
    const shortTitle = title.slice(0, newlineIndex).trim();
    const body = title.slice(newlineIndex + 1).trim();
    return {
      title: shortTitle || title,
      body: body || null,
    };
  }

  const bulletIndex = title.indexOf(" - ");
  if (bulletIndex !== -1) {
    const shortTitle = title.slice(0, bulletIndex).trim();
    const body = formatLegacyBulletBody(title.slice(bulletIndex + 3));
    return {
      title: shortTitle || title,
      body: body || null,
    };
  }

  return { title, body: null };
}
