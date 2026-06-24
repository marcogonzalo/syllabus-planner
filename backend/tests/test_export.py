from fastapi.testclient import TestClient
from sqlmodel import Session

from app.models import Syllabus, Module, SyllabusModule, Content


def test_export_csv(client: TestClient, session: Session):
    syllabus = Syllabus(title="AI Engineering")
    section = Syllabus(title="Prework")
    session.add(syllabus)
    session.add(section)
    session.commit()
    session.refresh(syllabus)
    session.refresh(section)

    client.post(
        f"/syllabuses/{syllabus.id}/children/",
        json={"child_id": section.id, "order_index": 0},
    )

    module = Module(title="Intro to AI")
    session.add(module)
    session.commit()
    session.refresh(module)

    session.add(
        SyllabusModule(syllabus_id=section.id,
                       module_id=module.id, order_index=0)
    )
    session.add(
        Content(
            module_id=module.id,
            type="theory",
            title="What is AI?",
            body="- Neural networks\n- Deep learning",
            order_index=1,
        )
    )
    session.add(
        Content(
            module_id=module.id,
            type="exercise",
            title="Build a perceptron",
            order_index=2,
        )
    )
    session.commit()

    response = client.get(f"/syllabuses/{syllabus.id}/export")
    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]

    csv_content = response.text
    assert "### Prework ###" in csv_content
    assert "### Intro to AI ###" in csv_content
    assert "> Theory:" in csv_content
    assert "+ What is AI?" in csv_content
    assert "- Neural networks" in csv_content
    assert "> Exercises" in csv_content
    assert "+ Build a perceptron" in csv_content
