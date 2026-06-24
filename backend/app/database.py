from collections.abc import Generator

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import inspect, text
from sqlmodel import Session, SQLModel, create_engine, select

from app.models import Content
from app.services.content_display import split_legacy_content_title


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        extra="ignore",
    )

    database_url: str = "sqlite:///./syllabus_planner.db"
    cors_origins: str = "http://localhost:3000"

    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        if isinstance(value, str) and value.startswith("postgresql://"):
            return f"postgresql+psycopg://{value[len('postgresql://'):]}"
        return value


settings = Settings()

_connect_args: dict = {}
if settings.database_url.startswith("sqlite"):
    _connect_args["check_same_thread"] = False
elif settings.database_url.startswith("postgresql"):
    _connect_args["prepare_threshold"] = None

engine = create_engine(
    settings.database_url,
    echo=False,
    connect_args=_connect_args,
)


def init_db() -> None:
    SQLModel.metadata.create_all(engine)
    _migrate_content_body_column()
    _backfill_content_body()


def _migrate_content_body_column() -> None:
    inspector = inspect(engine)
    if "content" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("content")}
    if "body" in columns:
        return

    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE content ADD COLUMN body TEXT"))


def _backfill_content_body() -> None:
    with Session(engine) as session:
        contents = session.exec(select(Content)).all()
        changed = False
        for content in contents:
            if content.body:
                continue
            short_title, body = split_legacy_content_title(content.title)
            if body is None and short_title == content.title.strip():
                continue
            content.title = short_title
            content.body = body
            session.add(content)
            changed = True
        if changed:
            session.commit()


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
