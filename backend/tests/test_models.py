import pytest
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from app.models import (
    Syllabus,
    SyllabusHierarchy,
    Module,
    SyllabusModule,
    Content,
    ModuleMetadata,
    Skill,
    ModuleSkill,
)


@pytest.fixture(name="engine")
def engine_fixture():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    return engine


@pytest.fixture(name="session")
def session_fixture(engine):
    with Session(engine) as session:
        yield session


def test_create_syllabus(session: Session):
    syllabus = Syllabus(
        title="AI Engineering",
        description="A comprehensive AI engineering syllabus",
        hours_per_module=10,
        extra_hours_per_module=5,
    )
    session.add(syllabus)
    session.commit()
    session.refresh(syllabus)

    assert syllabus.id is not None
    assert syllabus.title == "AI Engineering"
    assert syllabus.hours_per_module == 10


def test_syllabus_hierarchy(session: Session):
    parent = Syllabus(title="Parent Syllabus")
    child = Syllabus(title="Child Section")
    session.add(parent)
    session.add(child)
    session.commit()

    hierarchy = SyllabusHierarchy(
        parent_id=parent.id,
        child_id=child.id,
        order_index=1,
    )
    session.add(hierarchy)
    session.commit()

    assert hierarchy.parent_id == parent.id
    assert hierarchy.child_id == child.id
