from fastapi.testclient import TestClient


def test_create_module(client: TestClient):
    response = client.post("/modules/", json={"title": "Intro to AI"})
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Intro to AI"
    assert data["duration_days"] == 1
    assert "id" in data


def test_create_module_with_duration_days(client: TestClient):
    response = client.post(
        "/modules/",
        json={"title": "Half day", "duration_days": 0.5},
    )
    assert response.status_code == 200
    assert response.json()["duration_days"] == 0.5


def test_add_content_to_module(client: TestClient):
    module_res = client.post("/modules/", json={"title": "Module 1"})
    module_id = module_res.json()["id"]

    response = client.post(
        f"/modules/{module_id}/contents/",
        json={"type": "theory", "title": "What is AI?", "order_index": 1},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "What is AI?"
    assert data["type"] == "theory"
    assert data["module_id"] == module_id


def test_update_module_metadata(client: TestClient):
    module_res = client.post("/modules/", json={"title": "Module 1"})
    module_id = module_res.json()["id"]

    response = client.put(
        f"/modules/{module_id}/metadata/",
        json={"how_to_think": "Systematically",
              "best_practices": "Test everything"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["how_to_think"] == "Systematically"
    assert data["best_practices"] == "Test everything"


def test_add_quiz_content(client: TestClient):
    module_res = client.post("/modules/", json={"title": "Module 1"})
    module_id = module_res.json()["id"]

    response = client.post(
        f"/modules/{module_id}/contents/",
        json={"type": "quiz", "title": "Week 1 Quiz", "order_index": 0},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "quiz"
    assert data["title"] == "Week 1 Quiz"


def test_invalid_content_type_rejected(client: TestClient):
    module_res = client.post("/modules/", json={"title": "Module 1"})
    module_id = module_res.json()["id"]

    response = client.post(
        f"/modules/{module_id}/contents/",
        json={"type": "invalid", "title": "Bad content"},
    )
    assert response.status_code == 422


def test_update_content_with_text_blob(client: TestClient):
    module_res = client.post("/modules/", json={"title": "Module 1"})
    module_id = module_res.json()["id"]

    content_res = client.post(
        f"/modules/{module_id}/contents/",
        json={"type": "theory", "title": "Original title"},
    )
    content_id = content_res.json()["id"]

    response = client.put(
        f"/modules/{module_id}/contents/{content_id}",
        json={"text": "New Title\n- First detail\n- Second detail"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "New Title"
    assert data["body"] == "- First detail\n- Second detail"
