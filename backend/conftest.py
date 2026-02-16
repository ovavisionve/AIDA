"""
Pytest configuration and shared fixtures for AIDA backend tests.

Uses SQLite async for fast isolated tests without requiring PostgreSQL.
"""
import asyncio
import uuid
from datetime import datetime, date, timezone

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base

# Import ALL models so SQLAlchemy creates all tables
import app.models  # noqa: F401

from app.models.security import User
from app.models.clients import Client
from app.models.control_numbers import ControlNumberRange


@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for the test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture
async def db_engine():
    """Create an in-memory SQLite async engine for testing."""
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def db(db_engine):
    """Create a fresh DB session for each test."""
    session_factory = async_sessionmaker(
        db_engine, class_=AsyncSession, expire_on_commit=False,
    )
    async with session_factory() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def test_user(db: AsyncSession) -> User:
    """Create a test user."""
    user = User(
        email="test@aida.com.ve",
        hashed_password="$2b$12$test_hash_not_real",
        first_name="Test",
        last_name="User",
        is_active=True,
        is_superadmin=True,
    )
    db.add(user)
    await db.flush()
    return user


@pytest_asyncio.fixture
async def test_client(db: AsyncSession) -> Client:
    """Create a test client (company)."""
    client = Client(
        rif="J-12345678-9",
        razon_social="Empresa Test C.A.",
        direccion_fiscal="Av. Test 123, Caracas",
        email_principal="empresa@test.com",
        plan="profesional",
        fecha_inicio=date(2024, 1, 1),
        is_active=True,
        max_documentos_mes=1000,
        max_usuarios=10,
    )
    db.add(client)
    await db.flush()
    return client


@pytest_asyncio.fixture
async def test_control_range(db: AsyncSession, test_client: Client) -> ControlNumberRange:
    """Create a control number range for testing."""
    cnr = ControlNumberRange(
        client_id=test_client.id,
        serie="00",
        numero_inicio=1,
        numero_fin=999999,
        numero_actual=0,
        is_active=True,
        fecha_asignacion=datetime.now(timezone.utc),
    )
    db.add(cnr)
    await db.flush()
    return cnr
