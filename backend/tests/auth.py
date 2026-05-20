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


def test_register():

    response = client.post(
        "/auth/register",
        json={
            "name": "Test User",
            "email": "testuser@gmail.com",
            "password": "123456",
            "role": "TEAM_MEMBER"
        }
    )

    assert response.status_code == 200


def test_login():

    response = client.post(
        "/auth/login",
        json={
            "email": "testuser@gmail.com",
            "password": "123456"
        }
    )

    assert response.status_code == 200

    assert "access_token" in response.json()