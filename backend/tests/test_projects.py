import sys
import os

sys.path.append(
    os.path.abspath(
        os.path.join(
            os.path.dirname(__file__),
            ".."
        )
    )
)

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_get_projects():

    response = client.get("/projects/all")

    assert response.status_code in [200, 401, 403]