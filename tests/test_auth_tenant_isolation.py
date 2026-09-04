from fastapi.testclient import TestClient

from domarion.auth_store.factory import memory_auth_store
from domarion.core.config import Settings
from domarion.main import create_app
from domarion.report_store.factory import memory_report_store
from domarion.services.auth_sessions import create_session_token
from domarion.user_store.factory import memory_user_store

LIVE_SETTINGS = Settings(
    environment="test",
    demo_mode_enabled=False,
    auth_session_secret="test-session-secret-that-is-long-enough-12345",
)
app = create_app(LIVE_SETTINGS)


def setup_function() -> None:
    memory_auth_store.clear()
    memory_user_store.clear()
    memory_report_store.clear()


def _register(client: TestClient, email: str) -> dict:
    response = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "correct-horse-battery-staple", "display_name": email},
    )
    assert response.status_code == 201
    assert "HttpOnly" in response.headers["set-cookie"]
    assert "SameSite=lax" in response.headers["set-cookie"]
    return response.json()


def test_personal_endpoints_reject_anonymous_and_forged_demo_identity() -> None:
    with TestClient(app) as client:
        assert client.get("/api/v1/me").status_code == 401
        assert client.get("/api/v1/favorites?owner_id=other-user").status_code == 401
        assert (
            client.get(
                "/api/v1/me",
                headers={
                    "X-Domarion-User-Id": "forged-admin",
                    "X-Domarion-Role": "admin",
                    "X-Domarion-Plan": "enterprise",
                },
            ).status_code
            == 401
        )

        parameters = client.get("/openapi.json").json()["paths"]["/api/v1/me"]["get"]["parameters"]
        parameter_names = {parameter["name"].casefold() for parameter in parameters}
        assert "owner_id" not in parameter_names
        assert not any(name.startswith("x-domarion-") for name in parameter_names)


def test_two_sessions_are_isolated_on_read_update_and_delete() -> None:
    with TestClient(app) as alice, TestClient(app) as bob:
        alice_session = _register(alice, "alice@example.com")
        bob_session = _register(bob, "bob@example.com")
        assert alice_session["user"]["id"] != bob_session["user"]["id"]

        favorite = alice.post(
            "/api/v1/favorites",
            json={"listing_id": "wr-001", "note": "Alice private note"},
        ).json()
        assert alice.get(f"/api/v1/favorites/{favorite['id']}").status_code == 200
        assert bob.get("/api/v1/favorites").json() == []
        assert bob.get(f"/api/v1/favorites/{favorite['id']}").status_code == 404
        assert (
            bob.patch(
                f"/api/v1/favorites/{favorite['id']}?owner_id={alice_session['user']['id']}",
                json={"note": "tampered"},
            ).status_code
            == 404
        )
        assert (
            bob.delete(
                f"/api/v1/favorites/{favorite['id']}?owner_id={alice_session['user']['id']}"
            ).status_code
            == 404
        )
        assert (
            alice.get(f"/api/v1/favorites/{favorite['id']}").json()["note"] == "Alice private note"
        )


def test_reports_and_alerts_are_isolated_between_sessions() -> None:
    with TestClient(app) as alice, TestClient(app) as bob:
        _register(alice, "alice@example.com")
        _register(bob, "bob@example.com")
        alert = alice.post("/api/v1/alerts", json={"name": "Alice alert", "filters": {}}).json()
        report = alice.post(
            "/api/v1/reports/object/generate",
            json={"listing_id": "wr-001", "audience": "buyer", "report_format": "html"},
        ).json()

        assert bob.get("/api/v1/alerts").json() == []
        assert bob.get(f"/api/v1/alerts/{alert['id']}").status_code == 404
        assert (
            bob.patch(f"/api/v1/alerts/{alert['id']}", json={"is_active": False}).status_code == 404
        )
        assert bob.delete(f"/api/v1/alerts/{alert['id']}").status_code == 404
        assert bob.get("/api/v1/reports").json() == []
        assert bob.get(f"/api/v1/reports/{report['id']}").status_code == 404
        assert bob.get(f"/api/v1/reports/{report['id']}/content").status_code == 404


def test_logout_and_expired_session_require_sign_in_again() -> None:
    with TestClient(app) as client:
        _register(client, "buyer@example.com")
        assert client.get("/api/v1/me").status_code == 200
        assert client.post("/api/v1/auth/logout").status_code == 204
        assert client.get("/api/v1/me").status_code == 401

        expired, _ = create_session_token(
            "missing-user",
            LIVE_SETTINGS.auth_session_secret,
            -1,
        )
        response = client.get("/api/v1/me", headers={"Authorization": f"Bearer {expired}"})
        assert response.status_code == 401
        assert response.headers["www-authenticate"] == "Bearer"


def test_login_rejects_bad_password_and_restores_session() -> None:
    with TestClient(app) as client:
        _register(client, "buyer@example.com")
        client.post("/api/v1/auth/logout")
        denied = client.post(
            "/api/v1/auth/login",
            json={"email": "buyer@example.com", "password": "incorrect-password"},
        )
        assert denied.status_code == 401
        unknown = client.post(
            "/api/v1/auth/login",
            json={"email": "missing@example.com", "password": "incorrect-password"},
        )
        assert unknown.status_code == 401
        assert unknown.json() == denied.json()

        accepted = client.post(
            "/api/v1/auth/login",
            json={"email": "BUYER@example.com", "password": "correct-horse-battery-staple"},
        )
        assert accepted.status_code == 200
        assert client.get("/api/v1/me").status_code == 200
