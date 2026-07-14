from typing import Optional, List
from pydantic import BaseModel, Field, field_validator

CONTENT_TYPES = ("theory", "exercise", "project", "quiz")


class TotalsRead(BaseModel):
    modules: int = 0
    days: float = 0
    hours: float = 0


class SyllabusCreate(BaseModel):
    title: str
    description: Optional[str] = None
    hours_per_module: Optional[int] = None
    extra_hours_per_module: Optional[int] = None


class SyllabusRead(SyllabusCreate):
    id: int


class SyllabusUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None


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
    duration_days: float = 1.0
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
    duration_days: float = Field(default=1.0, gt=0)


class ModuleRead(ModuleCreate):
    id: int


class ModuleAttach(BaseModel):
    module_id: Optional[int] = None
    title: Optional[str] = None
    duration_days: Optional[float] = Field(default=None, gt=0)
    order_index: int = 0


class ContentCreate(BaseModel):
    type: str
    title: str
    body: Optional[str] = None
    order_index: int = 0

    @field_validator("type")
    @classmethod
    def validate_content_type(cls, v: str) -> str:
        if v not in CONTENT_TYPES:
            raise ValueError(
                f"Content type must be one of: {', '.join(CONTENT_TYPES)}")
        return v


class ContentUpdate(BaseModel):
    text: str

    @field_validator("text")
    @classmethod
    def validate_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Content text cannot be empty")
        return v


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
