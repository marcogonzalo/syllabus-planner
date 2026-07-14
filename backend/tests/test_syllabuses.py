from fastapi.testclient import TestClient
from sqlmodel import Session

from app.models import Syllabus, Module, SyllabusModule, Content


def test_create_syllabus(client: TestClient):
    response = client.post(
        "/syllabuses/",
        json={
            "title": "AI Engineering",
            "description": "A comprehensive syllabus",
            "hours_per_module": 10,
            "extra_hours_per_module": 5,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "AI Engineering"
    assert "id" in data


def test_read_syllabuses(client: TestClient):
    client.post("/syllabuses/", json={"title": "Test Syllabus 1"})
    client.post("/syllabuses/", json={"title": "Test Syllabus 2"})

    response = client.get("/syllabuses/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2


def test_read_syllabuses_excludes_linked_sections(client: TestClient, session: Session):
    parent = Syllabus(title="Parent Program")
    section = Syllabus(title="Linked Section")
    session.add(parent)
    session.add(section)
    session.commit()
    session.refresh(parent)
    session.refresh(section)

    client.post(
        f"/syllabuses/{parent.id}/children/",
        json={"child_id": section.id, "order_index": 0},
    )

    response = client.get("/syllabuses/")
    assert response.status_code == 200
    titles = [item["title"] for item in response.json()]
    assert "Parent Program" in titles
    assert "Linked Section" not in titles


def test_add_child_syllabus(client: TestClient, session: Session):
    parent = Syllabus(title="Parent")
    child = Syllabus(title="Child")
    session.add(parent)
    session.add(child)
    session.commit()
    session.refresh(parent)
    session.refresh(child)

    response = client.post(
        f"/syllabuses/{parent.id}/children/",
        json={"child_id": child.id, "order_index": 1},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["parent_id"] == parent.id
    assert data["child_id"] == child.id


def test_update_syllabus_title(client: TestClient):
    res = client.post("/syllabuses/", json={"title": "Old Title"})
    syllabus_id = res.json()["id"]

    response = client.patch(
        f"/syllabuses/{syllabus_id}",
        json={"title": "New Title"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "New Title"


def test_search_syllabuses(client: TestClient):
    client.post("/syllabuses/", json={"title": "AI Engineering"})
    client.post("/syllabuses/", json={"title": "Web Development"})
    client.post("/syllabuses/", json={"title": "Data Science"})

    response = client.get("/syllabuses/search?q=AI")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "AI Engineering"


def test_search_syllabuses_excludes_linked_sections(client: TestClient, session: Session):
    parent = Syllabus(title="Parent")
    section = Syllabus(title="AI Section")
    session.add(parent)
    session.add(section)
    session.commit()
    session.refresh(parent)
    session.refresh(section)

    client.post(
        f"/syllabuses/{parent.id}/children/",
        json={"child_id": section.id, "order_index": 0},
    )

    response = client.get("/syllabuses/search?q=AI")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 0
