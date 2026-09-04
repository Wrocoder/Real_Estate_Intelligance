from domarion.core.config import Settings, normalize_sqlalchemy_database_url


def test_sqlalchemy_database_url_normalizes_provider_postgres_urls() -> None:
    assert normalize_sqlalchemy_database_url("postgres://u:p@host/db") == (
        "postgresql+psycopg://u:p@host/db"
    )
    assert normalize_sqlalchemy_database_url("postgresql://u:p@host/db") == (
        "postgresql+psycopg://u:p@host/db"
    )
    assert normalize_sqlalchemy_database_url("postgresql+psycopg://u:p@host/db") == (
        "postgresql+psycopg://u:p@host/db"
    )


def test_settings_exposes_sqlalchemy_database_url_property() -> None:
    settings = Settings(database_url="postgresql://u:p@host/db")

    assert settings.sqlalchemy_database_url == "postgresql+psycopg://u:p@host/db"


def test_demo_mode_requires_explicit_environment_flag(monkeypatch) -> None:
    monkeypatch.delenv("DEMO_MODE_ENABLED", raising=False)

    settings = Settings(_env_file=None)

    assert settings.demo_mode_enabled is False
