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
