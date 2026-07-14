def split_content_text(text: str) -> tuple[str, str | None]:
    normalized = text.strip()
    if not normalized:
        return "", None

    if "\n" in normalized:
        first_line, rest = normalized.split("\n", 1)
        first_line = first_line.strip()
        rest = rest.strip() or None
        return first_line or normalized, rest

    return normalized, None


def _format_legacy_bullet_body(rest: str) -> str:
    parts = [part.strip() for part in rest.split(" - ") if part.strip()]
    if not parts:
        return rest.strip()
    return "\n".join(
        part if part.startswith("-") else f"- {part}" for part in parts
    )


def split_legacy_content_title(title: str) -> tuple[str, str | None]:
    normalized = title.strip()
    if not normalized:
        return title, None

    if "\n" in normalized:
        short_title, body = normalized.split("\n", 1)
        short_title = short_title.strip() or normalized
        body = body.strip() or None
        return short_title, body

    if " - " in normalized:
        short_title, rest = normalized.split(" - ", 1)
        short_title = short_title.strip() or normalized
        body = _format_legacy_bullet_body(rest) or None
        return short_title, body

    return normalized, None
