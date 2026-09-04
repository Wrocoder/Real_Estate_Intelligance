from typing import Annotated

from fastapi import Depends, FastAPI, Response, status
from fastapi.middleware.cors import CORSMiddleware

from domarion import __version__
from domarion.api import router
from domarion.api.auth_routes import router as auth_router
from domarion.core import Settings, get_settings
from domarion.ingestion_admin_store import IngestionAdminStore
from domarion.ingestion_admin_store.factory import get_ingestion_admin_store
from domarion.observability import (
    StructuredRequestLoggingMiddleware,
    configure_error_tracking,
    configure_logging,
)
from domarion.schemas import ProductionReadinessReport, RuntimeContext
from domarion.services.production_readiness import (
    build_production_readiness_report,
    validate_startup_auth,
    validate_startup_data_mode,
)


def create_app(settings_override: Settings | None = None) -> FastAPI:
    settings = settings_override or get_settings()
    validate_startup_data_mode(settings)
    validate_startup_auth(settings)
    configure_logging(settings.log_level)
    configure_error_tracking(
        dsn=settings.sentry_dsn,
        environment=settings.environment,
        release=f"domarion-analytics@{__version__}",
        traces_sample_rate=settings.sentry_traces_sample_rate,
    )
    app = FastAPI(
        title=settings.app_name,
        version=__version__,
        description="API foundation for WartoMetr real estate decision support.",
    )
    app.state.settings = settings

    app.add_middleware(
        StructuredRequestLoggingMiddleware,
        service_name=settings.app_name,
        environment=settings.environment,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health")
    def health() -> dict[str, str]:
        return {
            "status": "ok",
            "service": settings.app_name,
            "environment": settings.environment,
            "version": __version__,
        }

    @app.get("/ready", response_model=ProductionReadinessReport)
    def readiness(
        response: Response,
        ingestion_store: Annotated[IngestionAdminStore, Depends(get_ingestion_admin_store)],
    ) -> ProductionReadinessReport:
        sources = (
            ingestion_store.list_sources()
            if settings.environment.strip().casefold() == "production"
            else []
        )
        report = build_production_readiness_report(settings, sources=sources)
        if report.status == "blocked":
            response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return report

    @app.get("/runtime-context", response_model=RuntimeContext)
    def runtime_context() -> RuntimeContext:
        return RuntimeContext(
            data_mode="demo" if settings.demo_mode_enabled else "live",
            demo_mode_enabled=settings.demo_mode_enabled,
        )

    app.include_router(auth_router)
    app.include_router(router)
    return app


app = create_app()
