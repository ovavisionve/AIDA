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

        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("database_tables_ready")

        # Auto-seed if no users exist
        from sqlalchemy import select, func
        from app.database import async_session
        from app.models.security import User

        async with async_session() as session:
            count = (await session.execute(select(func.count(User.id)))).scalar() or 0
            if count == 0:
                logger.info("no_users_found_running_seed")
                from app.services.seed import seed_database
                await seed_database()
                logger.info("seed_completed")
            else:
                logger.info("users_exist_skipping_seed", user_count=count)
    except Exception as e:
        logger.error("startup_error", error=str(e))

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
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_v1_router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    return {"status": "ok", "version": settings.APP_VERSION}
