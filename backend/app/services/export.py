import io
import csv

from sqlmodel import Session, select

from app.models import (
    Syllabus,
    SyllabusHierarchy,
    SyllabusModule,
    Module,
    Content,
    ModuleMetadata,
    ModuleSkill,
    Skill,
)
from app.services.syllabus_tree import get_section_modules


def _content_section_label(content_type: str) -> str:
    if content_type == "theory":
        return "> Theory:"
    if content_type == "project":
        return "> Projects"
    if content_type == "exercise":
        return "> Exercises"
    if content_type == "quiz":
        return "> Quizzes"
    return f"> {content_type.title()}:"


def _format_skills(session: Session, module_id: int) -> str:
    skills = session.exec(
        select(Skill)
        .join(ModuleSkill, ModuleSkill.skill_id == Skill.id)
        .where(ModuleSkill.module_id == module_id)
        .order_by(Skill.name)
    ).all()
    if not skills:
        return ""
    return "\n".join(f"Skill: {skill.name}" for skill in skills)


def _write_module_rows(
    writer: csv.writer,
    session: Session,
    module: Module,
    week: str = "",
    day: str = "",
) -> None:
    metadata = session.get(ModuleMetadata, module.id)
    skills_text = _format_skills(session, module.id)

    writer.writerow(
        [
            week,
            day,
            skills_text,
            metadata.how_to_think if metadata else "",
            metadata.best_practices if metadata else "",
            metadata.patterns if metadata else "",
            metadata.antipatterns if metadata else "",
            metadata.limitations if metadata else "",
        ]
    )

    writer.writerow(["", "", f"### {module.title} ###", "", "", "", "", ""])

    contents = session.exec(
        select(Content)
        .where(Content.module_id == module.id)
        .order_by(Content.order_index)
    ).all()

    grouped: dict[str, list[Content]] = {}
    for content in contents:
        grouped.setdefault(content.type, []).append(content)

    for content_type in ("theory", "exercise", "project", "quiz"):
        items = grouped.get(content_type, [])
        if not items:
            continue
        writer.writerow(["", "En Syllabus", _content_section_label(
            content_type), "", "", "", "", ""])
        for item in items:
            writer.writerow(["", "", f"+ {item.title}", "", "", "", "", ""])
            if item.body:
                for line in item.body.splitlines():
                    writer.writerow(["", "", line, "", "", "", "", ""])


def _write_section_modules(
    writer: csv.writer,
    session: Session,
    section: Syllabus,
) -> None:
    writer.writerow(["", "", f"### {section.title} ###", "", "", "", "", ""])
    for _, module in get_section_modules(session, section.id):
        _write_module_rows(writer, session, module)


def generate_csv_for_syllabus(syllabus_id: int, session: Session) -> str:
    syllabus = session.get(Syllabus, syllabus_id)
    if not syllabus:
        return ""

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
        [
            "Week",
            "Day",
            "",
            "How to think",
            "Best practices",
            "Patterns",
            "Anti pattern",
            "Limitaciones",
        ]
    )

    sections = session.exec(
        select(SyllabusHierarchy, Syllabus)
        .join(Syllabus, SyllabusHierarchy.child_id == Syllabus.id)
        .where(SyllabusHierarchy.parent_id == syllabus_id)
        .order_by(SyllabusHierarchy.order_index)
    ).all()

    if sections:
        for _, section in sections:
            _write_section_modules(writer, session, section)
    else:
        for _, module in get_section_modules(session, syllabus_id):
            _write_module_rows(writer, session, module)

    return output.getvalue()
