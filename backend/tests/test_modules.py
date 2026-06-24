from fastapi.testclient import TestClient


def test_create_module(client: TestClient):
    response = client.post("/modules/", json={"title": "Intro to AI"})
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Intro to AI"
    assert "id" in data


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
