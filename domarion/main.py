from fastapi import FastAPI, Response, status
from fastapi.middleware.cors import CORSMiddleware

from domarion import __version__
from domarion.api import router
from domarion.core import get_settings
from domarion.observability import (
    StructuredRequestLoggingMiddleware,
    configure_error_tracking,
    configure_logging,
)
from domarion.schemas import ProductionReadinessReport
from domarion.services.production_readiness import build_production_readiness_report


def create_app() -> FastAPI:
    settings = get_settings()
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
        description="API foundation for Domarion Analytics real estate intelligence.",
    )

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
    def readiness(response: Response) -> ProductionReadinessReport:
        report = build_production_readiness_report(settings)
        if report.status == "blocked":
            response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return report

    app.include_router(router)
    return app


app = create_app()
