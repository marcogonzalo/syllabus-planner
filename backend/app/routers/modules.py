from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.database import get_session
from app.models import Module, Content, ModuleMetadata, Skill, ModuleSkill
from app.schemas import (
    ModuleCreate,
    ModuleRead,
    ModuleDetailRead,
    ContentCreate,
    ContentRead,
    ContentUpdate,
    ModuleMetadataUpdate,
    ModuleMetadataRead,
    ReorderRequest,
    SkillRead,
    SkillCreate,
    ModuleSkillsUpdate,
)
from app.services.content_display import split_content_text
from app.services.syllabus_tree import reorder_rows

router = APIRouter(prefix="/modules", tags=["modules"])


def _build_module_detail(session: Session, module_id: int) -> ModuleDetailRead | None:
    module = session.get(Module, module_id)
    if not module:
        return None

    contents = session.exec(
        select(Content)
        .where(Content.module_id == module_id)
        .order_by(Content.order_index)
    ).all()

    metadata = session.get(ModuleMetadata, module_id)
    skill_rows = session.exec(
        select(Skill)
        .join(ModuleSkill, ModuleSkill.skill_id == Skill.id)
        .where(ModuleSkill.module_id == module_id)
        .order_by(Skill.name)
    ).all()

    from app.models import SyllabusModule

    section_rel = session.exec(
        select(SyllabusModule).where(SyllabusModule.module_id == module_id)
    ).first()

    return ModuleDetailRead(
        id=module.id,
        title=module.title,
        duration_days=module.duration_days,
        syllabus_id=section_rel.syllabus_id if section_rel else None,
        contents=[ContentRead.model_validate(content) for content in contents],
        metadata=ModuleMetadataRead.model_validate(
            metadata) if metadata else None,
        skills=[SkillRead(id=skill.id, name=skill.name)
                for skill in skill_rows],
    )


@router.post("/", response_model=ModuleRead)
def create_module(module: ModuleCreate, session: Session = Depends(get_session)):
    db_module = Module.model_validate(module)
    session.add(db_module)
    session.commit()
    session.refresh(db_module)
    return db_module


@router.get("/{module_id}", response_model=ModuleDetailRead)
def read_module(module_id: int, session: Session = Depends(get_session)):
    detail = _build_module_detail(session, module_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Module not found")
    return detail


@router.patch("/{module_id}", response_model=ModuleRead)
def update_module(
    module_id: int,
    module: ModuleCreate,
    session: Session = Depends(get_session),
):
    db_module = session.get(Module, module_id)
    if not db_module:
        raise HTTPException(status_code=404, detail="Module not found")

    db_module.title = module.title
    db_module.duration_days = module.duration_days
    session.add(db_module)
    session.commit()
    session.refresh(db_module)
    return db_module


@router.post("/{module_id}/contents/", response_model=ContentRead)
def add_content(
    module_id: int,
    content: ContentCreate,
    session: Session = Depends(get_session),
):
    module = session.get(Module, module_id)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    title = content.title
    body = content.body
    if content.body is None and "\n" in content.title:
        title, body = split_content_text(content.title)

    db_content = Content(
        module_id=module_id,
        type=content.type,
        title=title,
        body=body,
        order_index=content.order_index,
    )
    session.add(db_content)
    session.commit()
    session.refresh(db_content)
    return db_content


@router.patch("/{module_id}/contents/reorder", response_model=ModuleDetailRead)
def reorder_contents(
    module_id: int,
    payload: ReorderRequest,
    session: Session = Depends(get_session),
):
    module = session.get(Module, module_id)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    rows = session.exec(select(Content).where(
        Content.module_id == module_id)).all()
    try:
        reorder_rows(session, rows, "id", payload.ordered_ids)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    detail = _build_module_detail(session, module_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Module not found")
    return detail


@router.put("/{module_id}/contents/{content_id}", response_model=ContentRead)
def update_content(
    module_id: int,
    content_id: int,
    payload: ContentUpdate,
    session: Session = Depends(get_session),
):
    content = session.get(Content, content_id)
    if not content or content.module_id != module_id:
        raise HTTPException(status_code=404, detail="Content not found")

    title, body = split_content_text(payload.text)
    content.title = title
    content.body = body
    session.add(content)
    session.commit()
    session.refresh(content)
    return content


@router.put("/{module_id}/metadata/", response_model=ModuleMetadataRead)
def update_metadata(
    module_id: int,
    metadata: ModuleMetadataUpdate,
    session: Session = Depends(get_session),
):
    module = session.get(Module, module_id)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    db_metadata = session.get(ModuleMetadata, module_id)
    if not db_metadata:
        db_metadata = ModuleMetadata(module_id=module_id)
        session.add(db_metadata)

    for key, value in metadata.model_dump(exclude_unset=True).items():
        setattr(db_metadata, key, value)

    session.commit()
    session.refresh(db_metadata)
    return db_metadata


@router.put("/{module_id}/skills", response_model=ModuleDetailRead)
def update_module_skills(
    module_id: int,
    payload: ModuleSkillsUpdate,
    session: Session = Depends(get_session),
):
    module = session.get(Module, module_id)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    for skill_id in payload.skill_ids:
        skill = session.get(Skill, skill_id)
        if not skill:
            raise HTTPException(
                status_code=404, detail=f"Skill {skill_id} not found")

    existing = session.exec(
        select(ModuleSkill).where(ModuleSkill.module_id == module_id)
    ).all()
    for row in existing:
        session.delete(row)

    for skill_id in payload.skill_ids:
        session.add(ModuleSkill(module_id=module_id, skill_id=skill_id))

    session.commit()

    detail = _build_module_detail(session, module_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Module not found")
    return detail
