from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship


class SyllabusHierarchy(SQLModel, table=True):
    __tablename__ = "syllabus_hierarchy"
    parent_id: int = Field(foreign_key="syllabus.id", primary_key=True)
    child_id: int = Field(foreign_key="syllabus.id", primary_key=True)
    order_index: int = Field(default=0)


class SyllabusModule(SQLModel, table=True):
    __tablename__ = "syllabus_module"
    syllabus_id: int = Field(foreign_key="syllabus.id", primary_key=True)
    module_id: int = Field(foreign_key="module.id", primary_key=True)
    order_index: int = Field(default=0)


class ModuleSkill(SQLModel, table=True):
    __tablename__ = "module_skill"
    module_id: int = Field(foreign_key="module.id", primary_key=True)
    skill_id: int = Field(foreign_key="skill.id", primary_key=True)


class Syllabus(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: Optional[str] = None
    hours_per_module: Optional[int] = None
    extra_hours_per_module: Optional[int] = None


class Module(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str


class Content(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    module_id: int = Field(foreign_key="module.id")
    type: str  # 'theory', 'exercise', 'project'
    title: str
    body: Optional[str] = None
    order_index: int = Field(default=0)


class ModuleMetadata(SQLModel, table=True):
    __tablename__ = "module_metadata"
    module_id: int = Field(foreign_key="module.id", primary_key=True)
    how_to_think: Optional[str] = None
    best_practices: Optional[str] = None
    patterns: Optional[str] = None
    antipatterns: Optional[str] = None
    limitations: Optional[str] = None


class Skill(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
