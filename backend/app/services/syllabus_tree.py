from sqlmodel import Session, select

from app.models import (
    Syllabus,
    SyllabusHierarchy,
    SyllabusModule,
    Module,
    Content,
)
from app.schemas import (
    ContentSummaryRead,
    TotalsRead,
    ModuleSummaryRead,
    SectionRead,
    SyllabusDetailRead,
)


def _section_totals(section: Syllabus, module_count: int) -> TotalsRead:
    hours_per = section.hours_per_module or 0
    extra_hours = section.extra_hours_per_module or 0
    hours = module_count * (hours_per + extra_hours)
    return TotalsRead(modules=module_count, days=module_count, hours=hours)


def _merge_totals(left: TotalsRead, right: TotalsRead) -> TotalsRead:
    return TotalsRead(
        modules=left.modules + right.modules,
        days=left.days + right.days,
        hours=left.hours + right.hours,
    )


CONTENT_TYPE_PRIORITY = ("project", "exercise", "quiz", "theory")


def _module_contents(session: Session, module_id: int) -> list[Content]:
    return list(
        session.exec(
            select(Content)
            .where(Content.module_id == module_id)
            .order_by(Content.order_index)
        ).all()
    )


def _unique_content_types(content_types: list[str]) -> list[str]:
    type_set = set(content_types)
    ordered = [t for t in CONTENT_TYPE_PRIORITY if t in type_set]
    for content_type in content_types:
        if content_type not in ordered:
            ordered.append(content_type)
    return ordered


def _primary_content_type(content_types: list[str]) -> str | None:
    if not content_types:
        return None

    type_set = set(content_types)
    for content_type in CONTENT_TYPE_PRIORITY:
        if content_type in type_set:
            return content_type

    return content_types[0]


def build_module_summary_read(
    session: Session, module: Module, order_index: int
) -> ModuleSummaryRead:
    contents = _module_contents(session, module.id)
    raw_types = [content.type for content in contents]
    return ModuleSummaryRead(
        id=module.id,
        title=module.title,
        order_index=order_index,
        primary_content_type=_primary_content_type(raw_types),
        content_types=_unique_content_types(raw_types),
        contents=[
            ContentSummaryRead(
                id=content.id,
                type=content.type,
                title=content.title,
                body=content.body,
                order_index=content.order_index,
            )
            for content in contents
        ],
    )


def get_section_modules(session: Session, section_id: int) -> list[tuple[SyllabusModule, Module]]:
    statement = (
        select(SyllabusModule, Module)
        .join(Module)
        .where(SyllabusModule.syllabus_id == section_id)
        .order_by(SyllabusModule.order_index)
    )
    return list(session.exec(statement).all())


def build_section_read(session: Session, section: Syllabus, order_index: int) -> SectionRead:
    module_rows = get_section_modules(session, section.id)
    modules = [
        build_module_summary_read(session, module, rel.order_index)
        for rel, module in module_rows
    ]
    totals = _section_totals(section, len(modules))
    return SectionRead(
        id=section.id,
        title=section.title,
        description=section.description,
        hours_per_module=section.hours_per_module,
        extra_hours_per_module=section.extra_hours_per_module,
        order_index=order_index,
        totals=totals,
        modules=modules,
    )


def build_syllabus_detail(session: Session, syllabus_id: int) -> SyllabusDetailRead | None:
    syllabus = session.get(Syllabus, syllabus_id)
    if not syllabus:
        return None

    hierarchy_rows = session.exec(
        select(SyllabusHierarchy, Syllabus)
        .join(Syllabus, SyllabusHierarchy.child_id == Syllabus.id)
        .where(SyllabusHierarchy.parent_id == syllabus_id)
        .order_by(SyllabusHierarchy.order_index)
    ).all()

    sections: list[SectionRead] = []
    totals = TotalsRead()
    for hierarchy, section in hierarchy_rows:
        section_read = build_section_read(
            session, section, hierarchy.order_index)
        sections.append(section_read)
        totals = _merge_totals(totals, section_read.totals)

    return SyllabusDetailRead(
        id=syllabus.id,
        title=syllabus.title,
        description=syllabus.description,
        hours_per_module=syllabus.hours_per_module,
        extra_hours_per_module=syllabus.extra_hours_per_module,
        sections=sections,
        totals=totals,
    )


def reorder_rows(session: Session, rows: list, id_attr: str, ordered_ids: list[int]) -> None:
    row_by_id = {getattr(row, id_attr): row for row in rows}
    if set(row_by_id.keys()) != set(ordered_ids):
        raise ValueError("ordered_ids must match existing items")

    for index, item_id in enumerate(ordered_ids):
        row_by_id[item_id].order_index = index

    session.commit()
