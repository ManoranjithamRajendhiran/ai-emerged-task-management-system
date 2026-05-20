import sys, os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# FIX: password was "123456" (too short — fails 8-char validation now)
# FIX: status was asserted as 200, register now returns 201
TEST_EMAIL = "testuser_fixture@example.com"
TEST_PASSWORD = "TestPass123"

def test_register():
    response = client.post("/auth/register", json={
        "name": "Test User",
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
        "role": "TEAM_MEMBER"
    })
    # Accept 201 (created) or 400 (already registered if test runs twice)
    assert response.status_code in (201, 400)

def test_register_duplicate_email():
    # First registration
    client.post("/auth/register", json={
        "name": "Test User",
        "email": "duplicate@example.com",
        "password": TEST_PASSWORD,
        "role": "TEAM_MEMBER"
    })
    # Second should fail with 400
    response = client.post("/auth/register", json={
        "name": "Test User",
        "email": "duplicate@example.com",
        "password": TEST_PASSWORD,
        "role": "TEAM_MEMBER"
    })
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]

def test_register_weak_password():
    response = client.post("/auth/register", json={
        "name": "Test User",
        "email": "weakpass@example.com",
        "password": "123",
        "role": "TEAM_MEMBER"
    })
    assert response.status_code == 422

def test_register_invalid_role():
    response = client.post("/auth/register", json={
        "name": "Test User",
        "email": "badrole@example.com",
        "password": TEST_PASSWORD,
        "role": "SUPERADMIN"
    })
    assert response.status_code == 422

def test_login_success():
    # Ensure user exists first
    client.post("/auth/register", json={
        "name": "Login Tester",
        "email": "logintest@example.com",
        "password": TEST_PASSWORD,
        "role": "TEAM_MEMBER"
    })
    response = client.post("/auth/login", json={
        "email": "logintest@example.com",
        "password": TEST_PASSWORD
    })
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_login_wrong_password():
    response = client.post("/auth/login", json={
        "email": "logintest@example.com",
        "password": "WrongPassword999"
    })
    assert response.status_code == 401

def test_login_unknown_email():
    response = client.post("/auth/login", json={
        "email": "nobody@nowhere.com",
        "password": TEST_PASSWORD
    })
    assert response.status_code == 401