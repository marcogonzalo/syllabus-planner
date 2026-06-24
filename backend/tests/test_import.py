from pathlib import Path

from sqlmodel import Session, select

from app.models import (
    Content,
    ModuleMetadata,
    Skill,
    SyllabusHierarchy,
    SyllabusModule,
)
from app.services.import_csv import import_syllabus_from_csv
from app.services.syllabus_csv_parser import parse_syllabus_csv

FIXTURE_CSV = Path(__file__).parent / "fixtures" / "sample_syllabus.csv"


def _find_source_csv() -> Path | None:
    for ancestor in Path(__file__).resolve().parents:
        candidate = (
            ancestor
            / "course-outline-generator"
            / "ai-engineering"
            / "New Syllabus AI Engineer - Planificación del programa.csv"
        )
        if candidate.is_file():
            return candidate
    return None


SOURCE_CSV = _find_source_csv()


def test_parse_sample_csv():
    parsed = parse_syllabus_csv(FIXTURE_CSV, title="Sample")
    assert parsed.title == "Sample"
    assert len(parsed.sections) == 1
    assert parsed.sections[0].title == "INTRO SECTION"
    assert parsed.sections[0].phase == "PREWORK"
    assert len(parsed.sections[0].modules) == 2
    assert parsed.sections[0].modules[0].skill_name == "First skill"
    assert len(parsed.sections[0].modules[0].blocks) == 2


def test_import_sample_csv(session: Session):
    syllabus = import_syllabus_from_csv(
        session, FIXTURE_CSV, title="Sample Import")
    assert syllabus.id is not None

    sections = session.exec(
        select(SyllabusHierarchy).where(
            SyllabusHierarchy.parent_id == syllabus.id)
    ).all()
    assert len(sections) == 1

    section_id = sections[0].child_id
    module_links = session.exec(
        select(SyllabusModule).where(SyllabusModule.syllabus_id == section_id)
    ).all()
    assert len(module_links) == 2

    module_id = module_links[0].module_id
    metadata = session.get(ModuleMetadata, module_id)
    assert metadata is not None
    assert "Think first" in (metadata.how_to_think or "")

    contents = session.exec(select(Content).where(
        Content.module_id == module_id)).all()
    assert any(content.type == "theory" for content in contents)
    assert any(content.type == "project" for content in contents)
    theory = next(c for c in contents if c.type == "theory")
    assert theory.title == "Intro lesson"
    assert theory.body is not None
    assert "Detail one" in theory.body
    project = next(c for c in contents if c.type == "project")
    assert project.title == "Sample project"
    assert not project.body

    skills = session.exec(select(Skill)).all()
    assert any(skill.name == "First skill" for skill in skills)


def test_import_ai_engineering_csv(session: Session):
    if SOURCE_CSV is None:
        return

    syllabus = import_syllabus_from_csv(
        session,
        SOURCE_CSV,
        title="AI Engineer Import Test",
    )
    sections = session.exec(
        select(SyllabusHierarchy).where(
            SyllabusHierarchy.parent_id == syllabus.id)
    ).all()
    assert len(sections) >= 20
