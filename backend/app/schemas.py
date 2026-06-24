from typing import Optional, List
from pydantic import BaseModel, Field


class TotalsRead(BaseModel):
    modules: int = 0
    days: int = 0
    hours: int = 0


class SyllabusCreate(BaseModel):
    title: str
    description: Optional[str] = None
    hours_per_module: Optional[int] = None
    extra_hours_per_module: Optional[int] = None


class SyllabusRead(SyllabusCreate):
    id: int


class SectionCreate(SyllabusCreate):
    order_index: int = 0


class ChildSyllabusAdd(BaseModel):
    child_id: int
    order_index: int = 0


class ChildSyllabusRead(ChildSyllabusAdd):
    parent_id: int


class ReorderRequest(BaseModel):
    ordered_ids: List[int] = Field(min_length=1)


class ContentSummaryRead(BaseModel):
    id: int
    type: str
    title: str
    body: Optional[str] = None
    order_index: int


class ModuleSummaryRead(BaseModel):
    id: int
    title: str
    order_index: int
    primary_content_type: Optional[str] = None
    content_types: List[str] = []
    contents: List[ContentSummaryRead] = []


class SectionRead(SyllabusRead):
    order_index: int
    totals: TotalsRead
    modules: List[ModuleSummaryRead] = []


class SyllabusDetailRead(SyllabusRead):
    sections: List[SectionRead] = []
    totals: TotalsRead


class ModuleCreate(BaseModel):
    title: str


class ModuleRead(ModuleCreate):
    id: int


class ModuleAttach(BaseModel):
    module_id: Optional[int] = None
    title: Optional[str] = None
    order_index: int = 0


class ContentCreate(BaseModel):
    type: str
    title: str
    body: Optional[str] = None
    order_index: int = 0


class ContentRead(ContentCreate):
    id: int
    module_id: int


class SkillRead(BaseModel):
    id: int
    name: str


class SkillCreate(BaseModel):
    name: str


class ModuleSkillsUpdate(BaseModel):
    skill_ids: List[int] = []


class ModuleMetadataUpdate(BaseModel):
    how_to_think: Optional[str] = None
    best_practices: Optional[str] = None
    patterns: Optional[str] = None
    antipatterns: Optional[str] = None
    limitations: Optional[str] = None


class ModuleMetadataRead(ModuleMetadataUpdate):
    module_id: int


class ModuleDetailRead(ModuleRead):
    syllabus_id: Optional[int] = None
    contents: List[ContentRead] = []
    metadata: Optional[ModuleMetadataRead] = None
    skills: List[SkillRead] = []
