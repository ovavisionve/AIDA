import ssl
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import get_settings

settings = get_settings()


def _fix_database_url(url: str) -> str:
    """
    Fix DATABASE_URL for asyncpg compatibility.

    - Neon/Railway/Heroku provide URLs as postgres:// or postgresql://
      but asyncpg needs postgresql+asyncpg://
    - Strip ssl/sslmode query params that asyncpg doesn't understand
      (we handle SSL via connect_args instead)
    """
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql://") and "+asyncpg" not in url:
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)

    # Remove ssl-related query parameters that asyncpg can't handle
    parsed = urlparse(url)
    if parsed.query:
        params = parse_qs(parsed.query, keep_blank_values=True)
        params.pop("sslmode", None)
        params.pop("ssl", None)
        # Rebuild query string (flatten single-value lists)
        clean_params = {k: v[0] if len(v) == 1 else v for k, v in params.items()}
        new_query = urlencode(clean_params, doseq=True)
        url = urlunparse(parsed._replace(query=new_query))

    return url


database_url = _fix_database_url(settings.DATABASE_URL)

# Enable SSL for Neon or any production DB that needs it
connect_args = {}
if "neon.tech" in database_url or "neon" in database_url:
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
