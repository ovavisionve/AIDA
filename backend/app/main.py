import traceback
import structlog
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.api.v1 import router as api_v1_router

settings = get_settings()
logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create all tables and run seed if needed
    logger.info("aida_startup", environment=settings.ENVIRONMENT)
    try:
        from app.database import engine, Base
        import app.models  # noqa: F401 — register all models

        logger.info("creating_tables")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("database_tables_ready")
    except Exception as e:
        logger.error("table_creation_failed", error=str(e))
        traceback.print_exc()

    try:
        from app.services.seed import seed_database
        logger.info("running_seed_idempotent")
        await seed_database()
        logger.info("seed_completed")
    except Exception as e:
        logger.error("seed_failed", error=str(e))
        traceback.print_exc()

    yield

    # Shutdown
    logger.info("aida_shutdown")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url="/api/redoc" if settings.DEBUG else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_origin_regex=settings.ALLOWED_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_v1_router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    """Health check con verificación de DB."""
    db_ok = False
    db_error = None
    try:
        from sqlalchemy import text
        from app.database import async_session
        async with async_session() as session:
            await session.execute(text("SELECT 1"))
            db_ok = True
    except Exception as e:
        db_error = str(e)

    return {
        "status": "ok" if db_ok else "degraded",
        "version": settings.APP_VERSION,
        "database": "connected" if db_ok else f"error: {db_error}",
    }
