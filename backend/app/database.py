import ssl
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import get_settings

settings = get_settings()

# Detect if SSL was requested in the original URL before we modify it
_original_url = settings.DATABASE_URL
_needs_ssl = any(x in _original_url for x in ["sslmode=", "ssl=", "neon.tech", "neon"])


def _fix_database_url(url: str) -> str:
    """
    Fix DATABASE_URL for asyncpg compatibility.

    - Neon/Railway/Heroku provide URLs as postgres:// or postgresql://
      but asyncpg needs postgresql+asyncpg://
    - Strip ssl/sslmode query params that asyncpg doesn't understand
      (we handle SSL via connect_args instead)
    """
    # Step 1: Strip SSL query params BEFORE changing scheme
    # (urlparse doesn't handle custom schemes like postgresql+asyncpg://)
    if "?" in url:
        base, query = url.split("?", 1)
        params = [p for p in query.split("&") if not p.startswith(("sslmode=", "ssl="))]
        url = base + ("?" + "&".join(params) if params else "")

    # Step 2: Fix scheme for asyncpg
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql://") and "+asyncpg" not in url:
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)

    return url


database_url = _fix_database_url(_original_url)

# Handle SSL via connect_args (not via URL query params)
connect_args = {}
if _needs_ssl:
    connect_args["ssl"] = ssl.create_default_context()

engine = create_async_engine(
    database_url,
    echo=settings.DATABASE_ECHO,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,
    connect_args=connect_args,
)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
