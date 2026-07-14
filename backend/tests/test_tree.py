from fastapi.testclient import TestClient
from sqlmodel import Session

from app.models import Syllabus, Module, SyllabusModule, Content


def test_read_syllabus_detail_with_sections_and_totals(client: TestClient, session: Session):
    root = Syllabus(title="AI Engineering")
    section = Syllabus(
        title="Prework",
        description="Intro section",
        hours_per_module=8,
        extra_hours_per_module=2,
    )
    session.add(root)
    session.add(section)
    session.commit()
    session.refresh(root)
    session.refresh(section)

    client.post(
        f"/syllabuses/{root.id}/children/",
        json={"child_id": section.id, "order_index": 0},
    )

    module = Module(title="Platform Intro")
    session.add(module)
    session.commit()
    session.refresh(module)

    client.post(
        f"/syllabuses/{section.id}/modules",
        json={"module_id": module.id, "order_index": 0},
    )

    response = client.get(f"/syllabuses/{root.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "AI Engineering"
    assert len(data["sections"]) == 1
    assert data["sections"][0]["title"] == "Prework"
    assert data["sections"][0]["totals"]["modules"] == 1
    assert data["sections"][0]["totals"]["days"] == 1
    assert data["sections"][0]["totals"]["hours"] == 10
    assert data["totals"]["modules"] == 1
    assert data["sections"][0]["modules"][0]["duration_days"] == 1


def test_attach_module_with_duration_days(client: TestClient):
    root = client.post("/syllabuses/", json={"title": "AI Engineering"}).json()
    detail = client.post(
        f"/syllabuses/{root['id']}/sections",
        json={
            "title": "Foundations",
            "hours_per_module": 8,
            "extra_hours_per_module": 2,
            "order_index": 0,
        },
    ).json()
    section_id = detail["sections"][0]["id"]

    response = client.post(
        f"/syllabuses/{section_id}/modules",
        json={"title": "Warmup", "duration_days": 0.5, "order_index": 0},
    )
    assert response.status_code == 200
    module = response.json()
    assert module["title"] == "Warmup"
    assert module["duration_days"] == 0.5

    client.post(
        f"/syllabuses/{section_id}/modules",
        json={"title": "Deep Dive", "duration_days": 1, "order_index": 1},
    )

    tree = client.get(f"/syllabuses/{root['id']}").json()
    totals = tree["sections"][0]["totals"]
    assert totals["modules"] == 2
    assert totals["days"] == 1.5
    assert totals["hours"] == 15


def test_attach_module_rejects_non_positive_duration(client: TestClient):
    root = client.post("/syllabuses/", json={"title": "AI Engineering"}).json()
    detail = client.post(
        f"/syllabuses/{root['id']}/sections",
        json={"title": "Foundations", "order_index": 0},
    ).json()
    section_id = detail["sections"][0]["id"]

    response = client.post(
        f"/syllabuses/{section_id}/modules",
        json={"title": "Bad", "duration_days": 0},
    )
    assert response.status_code == 422


def test_create_section_endpoint(client: TestClient):
    root = client.post("/syllabuses/", json={"title": "AI Engineering"}).json()

    response = client.post(
        f"/syllabuses/{root['id']}/sections",
        json={
            "title": "Foundations",
            "description": "Core concepts",
            "hours_per_module": 6,
            "extra_hours_per_module": 1,
            "order_index": 0,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["sections"]) == 1
    assert data["sections"][0]["title"] == "Foundations"


def test_reorder_sections(client: TestClient):
    root = client.post("/syllabuses/", json={"title": "AI Engineering"}).json()
    detail = client.post(
        f"/syllabuses/{root['id']}/sections",
        json={"title": "A", "order_index": 0},
    ).json()
    section_a = detail["sections"][0]
    detail = client.post(
        f"/syllabuses/{root['id']}/sections",
        json={"title": "B", "order_index": 1},
    ).json()
    section_b = detail["sections"][1]

    response = client.patch(
        f"/syllabuses/{root['id']}/sections/reorder",
        json={"ordered_ids": [section_b["id"], section_a["id"]]},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["sections"][0]["title"] == "B"


def test_module_primary_content_type_in_syllabus_detail(
    client: TestClient, session: Session
):
    root = Syllabus(title="AI Engineering")
    section = Syllabus(title="Prework")
    module = Module(title="Postcard")
    session.add(root)
    session.add(section)
    session.add(module)
    session.commit()
    session.refresh(root)
    session.refresh(section)
    session.refresh(module)

    client.post(
        f"/syllabuses/{root.id}/children/",
        json={"child_id": section.id, "order_index": 0},
    )
    client.post(
        f"/syllabuses/{section.id}/modules",
        json={"module_id": module.id, "order_index": 0},
    )
    client.post(
        f"/modules/{module.id}/contents",
        json={"type": "theory", "title": "Intro", "order_index": 0},
    )
    client.post(
        f"/modules/{module.id}/contents",
        json={"type": "project", "title": "Postcard", "order_index": 1},
    )

    response = client.get(f"/syllabuses/{root.id}")
    assert response.status_code == 200
    module_data = response.json()["sections"][0]["modules"][0]
    assert module_data["primary_content_type"] == "project"
    assert module_data["content_types"] == ["project", "theory"]
    assert len(module_data["contents"]) == 2
    assert module_data["contents"][0]["title"] == "Intro"
    assert module_data["contents"][0]["body"] is None
    assert module_data["contents"][1]["type"] == "project"


def test_module_detail_with_skills(client: TestClient):
    module = client.post("/modules/", json={"title": "Intro"}).json()
    skill = client.post("/skills/", json={"name": "Python"}).json()
    client.put(
        f"/modules/{module['id']}/skills",
        json={"skill_ids": [skill["id"]]},
    )

    response = client.get(f"/modules/{module['id']}")
    assert response.status_code == 200
    data = response.json()
    assert data["skills"][0]["name"] == "Python"
