from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select

from app.database import get_session
from app.models import Skill
from app.schemas import SkillCreate, SkillRead

router = APIRouter(prefix="/skills", tags=["skills"])


@router.get("/", response_model=list[SkillRead])
def search_skills(
    search: str | None = Query(default=None),
    session: Session = Depends(get_session),
):
    statement = select(Skill).order_by(Skill.name)
    if search:
        statement = statement.where(Skill.name.ilike(f"%{search}%"))
    return session.exec(statement).all()


@router.post("/", response_model=SkillRead)
def create_skill(skill: SkillCreate, session: Session = Depends(get_session)):
    existing = session.exec(select(Skill).where(
        Skill.name == skill.name)).first()
    if existing:
        return existing

    db_skill = Skill(name=skill.name)
    session.add(db_skill)
    session.commit()
    session.refresh(db_skill)
    return db_skill
