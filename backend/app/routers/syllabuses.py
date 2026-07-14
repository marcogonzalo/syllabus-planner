from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select

from app.database import get_session
from app.models import Syllabus, SyllabusHierarchy, SyllabusModule, Module
from app.schemas import (
    SyllabusCreate,
    SyllabusRead,
    SyllabusDetailRead,
    SyllabusUpdate,
    SectionCreate,
    ChildSyllabusAdd,
    ChildSyllabusRead,
    ReorderRequest,
    ModuleAttach,
    ModuleSummaryRead,
)
from app.services.export import generate_csv_for_syllabus
from app.services.syllabus_tree import (
    build_module_summary_read,
    build_syllabus_detail,
    get_section_modules,
    reorder_rows,
)

router = APIRouter(prefix="/syllabuses", tags=["syllabuses"])


@router.post("/", response_model=SyllabusRead)
def create_syllabus(syllabus: SyllabusCreate, session: Session = Depends(get_session)):
    db_syllabus = Syllabus.model_validate(syllabus)
    session.add(db_syllabus)
    session.commit()
    session.refresh(db_syllabus)
    return db_syllabus


@router.get("/", response_model=list[SyllabusRead])
def read_syllabuses(session: Session = Depends(get_session)):
    child_ids = set(session.exec(select(SyllabusHierarchy.child_id)).all())
    syllabuses = session.exec(select(Syllabus).order_by(Syllabus.id)).all()
    return [syllabus for syllabus in syllabuses if syllabus.id not in child_ids]


@router.get("/search", response_model=list[SyllabusRead])
def search_syllabuses(q: str = "", session: Session = Depends(get_session)):
    child_ids = set(session.exec(select(SyllabusHierarchy.child_id)).all())
    if q.strip():
        syllabuses = session.exec(
            select(Syllabus).where(Syllabus.title.ilike(
                f"%{q}%")).order_by(Syllabus.id)
        ).all()
    else:
        syllabuses = session.exec(select(Syllabus).order_by(Syllabus.id)).all()
    return [s for s in syllabuses if s.id not in child_ids]


@router.get("/{syllabus_id}", response_model=SyllabusDetailRead)
def read_syllabus_detail(syllabus_id: int, session: Session = Depends(get_session)):
    detail = build_syllabus_detail(session, syllabus_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Syllabus not found")
    return detail


@router.patch("/{syllabus_id}", response_model=SyllabusRead)
def update_syllabus(
    syllabus_id: int,
    payload: SyllabusUpdate,
    session: Session = Depends(get_session),
):
    syllabus = session.get(Syllabus, syllabus_id)
    if not syllabus:
        raise HTTPException(status_code=404, detail="Syllabus not found")

    if payload.title is not None:
        syllabus.title = payload.title
    if payload.description is not None:
        syllabus.description = payload.description
    session.add(syllabus)
    session.commit()
    session.refresh(syllabus)
    return syllabus


@router.post("/{parent_id}/sections", response_model=SyllabusDetailRead)
def create_section(
    parent_id: int,
    section: SectionCreate,
    session: Session = Depends(get_session),
):
    parent = session.get(Syllabus, parent_id)
    if not parent:
        raise HTTPException(
            status_code=404, detail="Parent syllabus not found")

    db_section = Syllabus(
        title=section.title,
        description=section.description,
        hours_per_module=section.hours_per_module,
        extra_hours_per_module=section.extra_hours_per_module,
    )
    session.add(db_section)
    session.commit()
    session.refresh(db_section)

    hierarchy = SyllabusHierarchy(
        parent_id=parent_id,
        child_id=db_section.id,
        order_index=section.order_index,
    )
    session.add(hierarchy)
    session.commit()

    detail = build_syllabus_detail(session, parent_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Syllabus not found")
    return detail


@router.post("/{parent_id}/children/", response_model=ChildSyllabusRead)
def add_child_syllabus(
    parent_id: int,
    child: ChildSyllabusAdd,
    session: Session = Depends(get_session),
):
    parent = session.get(Syllabus, parent_id)
    if not parent:
        raise HTTPException(
            status_code=404, detail="Parent syllabus not found")

    child_syllabus = session.get(Syllabus, child.child_id)
    if not child_syllabus:
        raise HTTPException(status_code=404, detail="Child syllabus not found")

    existing = session.get(SyllabusHierarchy, (parent_id, child.child_id))
    if existing:
        raise HTTPException(status_code=409, detail="Section already linked")

    hierarchy = SyllabusHierarchy(
        parent_id=parent_id,
        child_id=child.child_id,
        order_index=child.order_index,
    )
    session.add(hierarchy)
    session.commit()
    session.refresh(hierarchy)
    return hierarchy


@router.patch("/{syllabus_id}/sections/reorder", response_model=SyllabusDetailRead)
def reorder_sections(
    syllabus_id: int,
    payload: ReorderRequest,
    session: Session = Depends(get_session),
):
    rows = session.exec(
        select(SyllabusHierarchy).where(
            SyllabusHierarchy.parent_id == syllabus_id)
    ).all()
    try:
        reorder_rows(session, rows, "child_id", payload.ordered_ids)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    detail = build_syllabus_detail(session, syllabus_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Syllabus not found")
    return detail


@router.post("/{section_id}/modules", response_model=ModuleSummaryRead)
def attach_module_to_section(
    section_id: int,
    payload: ModuleAttach,
    session: Session = Depends(get_session),
):
    section = session.get(Syllabus, section_id)
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")

    if payload.module_id:
        module = session.get(Module, payload.module_id)
        if not module:
            raise HTTPException(status_code=404, detail="Module not found")
        if payload.duration_days is not None:
            module.duration_days = payload.duration_days
            session.add(module)
            session.commit()
            session.refresh(module)
    elif payload.title:
        module = Module(
            title=payload.title,
            duration_days=(
                payload.duration_days if payload.duration_days is not None else 1.0
            ),
        )
        session.add(module)
        session.commit()
        session.refresh(module)
    else:
        raise HTTPException(
            status_code=400, detail="module_id or title is required")

    existing = session.get(SyllabusModule, (section_id, module.id))
    if existing:
        raise HTTPException(
            status_code=409, detail="Module already linked to section")

    relationship = SyllabusModule(
        syllabus_id=section_id,
        module_id=module.id,
        order_index=payload.order_index,
    )
    session.add(relationship)
    session.commit()
    session.refresh(relationship)

    return build_module_summary_read(session, module, relationship.order_index)


@router.patch("/{section_id}/modules/reorder", response_model=SyllabusDetailRead)
def reorder_modules(
    section_id: int,
    payload: ReorderRequest,
    session: Session = Depends(get_session),
):
    section = session.get(Syllabus, section_id)
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")

    rows = session.exec(
        select(SyllabusModule).where(SyllabusModule.syllabus_id == section_id)
    ).all()
    try:
        reorder_rows(session, rows, "module_id", payload.ordered_ids)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    parent = session.exec(
        select(SyllabusHierarchy).where(
            SyllabusHierarchy.child_id == section_id)
    ).first()
    if not parent:
        raise HTTPException(
            status_code=404, detail="Parent syllabus not found")

    detail = build_syllabus_detail(session, parent.parent_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Syllabus not found")
    return detail


@router.get("/{syllabus_id}/export")
def export_syllabus_csv(syllabus_id: int, session: Session = Depends(get_session)):
    syllabus = session.get(Syllabus, syllabus_id)
    if not syllabus:
        raise HTTPException(status_code=404, detail="Syllabus not found")

    csv_content = generate_csv_for_syllabus(syllabus_id, session)
    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f"attachment; filename=syllabus_{syllabus_id}.csv"
        },
    )
