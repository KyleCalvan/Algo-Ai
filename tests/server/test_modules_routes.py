import os
import tempfile

_tmp_home = tempfile.mkdtemp()
os.environ["OPENJARVIS_HOME"] = _tmp_home

from fastapi.testclient import TestClient
from fastapi import FastAPI

from openjarvis.server.modules_routes import router as modules_router

app = FastAPI()
app.include_router(modules_router)
client = TestClient(app)


def test_module_import_persistence_round_trip():
    payload = {
        "title": "Binary Search Notes",
        "subject": "algorithms",
        "content": "Binary search works on sorted arrays. It repeatedly halves the search interval by comparing the target with the middle element. Time complexity is O(log n).",
    }
    res = client.post("/v1/modules/import/text", json=payload)
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["import_status"] == "indexed"
    assert body["topics"]
    mid = body["id"]

    got = client.get(f"/v1/modules/{mid}")
    assert got.status_code == 200
    assert got.json()["id"] == mid

    content = client.get(f"/v1/modules/{mid}/content")
    assert content.status_code == 200
    assert "sorted arrays" in content.json()["content"]

    listed = client.get("/v1/modules/list", params={"q": "binary search"})
    assert listed.status_code == 200
    assert any(m["id"] == mid for m in listed.json())

    deleted = client.delete(f"/v1/modules/{mid}")
    assert deleted.status_code == 200

    missing = client.get(f"/v1/modules/{mid}")
    assert missing.status_code == 404


def test_module_context_includes_content_and_ordinals():
    """The model must receive actual module CONTENT, not just titles."""
    from openjarvis.server import modules_routes as mr

    m1 = mr.ModuleImportBody(
        title="Recursion Notes",
        subject="algorithms",
        content="Recursion arises when a function calls itself. Factorial multiplies n times factorial of n-1.",
    )
    m2 = mr.ModuleImportBody(
        title="GRAPH ALGORITHM",
        subject="algorithms",
        content="BFS explores level by level using a queue. DFS uses a stack and follows one path to the end.",
    )
    rec1 = client.post("/v1/modules/import/text", json=m1.model_dump())
    rec2 = client.post("/v1/modules/import/text", json=m2.model_dump())
    assert rec1.status_code == 200 and rec2.status_code == 200

    try:
        # "module 1" must resolve to the FIRST saved module with its content.
        ctx = mr.get_relevant_learning_modules("teach me module 1", max_modules=2, max_chars=3000)
        assert "Recursion Notes" in ctx
        assert "calls itself" in ctx, "content of ordinal-referenced module missing"

        # Title references must work too.
        ctx2 = mr.get_relevant_learning_modules("open the graph algorithm module", max_modules=2, max_chars=3000)
        assert "GRAPH ALGORITHM" in ctx2
        assert "queue" in ctx2, "content of title-referenced module missing"

        # The catalog lists every saved module in saved order.
        assert "[1]" in ctx and "[2]" in ctx
    finally:
        client.delete(f"/v1/modules/{rec1.json()['id']}")
        client.delete(f"/v1/modules/{rec2.json()['id']}")
