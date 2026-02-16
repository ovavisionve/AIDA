"""
Tests for the API key model and hash verification.

Verifies that API keys are properly hashed, stored, and queried.
"""
import hashlib
import pytest
import pytest_asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.api_keys import APIKey
from app.models.security import User
from app.api.v1.developers import _hash_key


class TestAPIKeyHashing:
    """Tests for API key hashing utility."""

    def test_hash_deterministic(self):
        """Same input produces same hash."""
        key = "aida_test_key_12345"
        assert _hash_key(key) == _hash_key(key)

    def test_hash_is_sha256(self):
        """Hash matches SHA-256 output."""
        key = "aida_test_key_12345"
        expected = hashlib.sha256(key.encode()).hexdigest()
        assert _hash_key(key) == expected

    def test_different_keys_different_hashes(self):
        """Different keys produce different hashes."""
        assert _hash_key("aida_key_a") != _hash_key("aida_key_b")


@pytest.mark.asyncio
class TestAPIKeyModel:
    """Tests for API key database operations."""

    async def test_create_api_key(self, db: AsyncSession, test_user: User):
        """Create and retrieve an API key."""
        key = APIKey(
            user_id=test_user.id,
            name="Test Key",
            description="For testing",
            key_hash=_hash_key("aida_test_key"),
            key_prefix="aida_test_ke...",
            is_active=True,
        )
        db.add(key)
        await db.flush()

        result = await db.execute(
            select(APIKey).where(APIKey.user_id == test_user.id)
        )
        stored = result.scalar_one()

        assert stored.name == "Test Key"
        assert stored.key_prefix == "aida_test_ke..."
        assert stored.is_active is True
        assert stored.request_count == 0

    async def test_find_by_hash(self, db: AsyncSession, test_user: User):
        """Find an API key by its hash (simulates authentication)."""
        raw_key = "aida_my_secret_key_xyz"
        key = APIKey(
            user_id=test_user.id,
            name="Auth Test Key",
            key_hash=_hash_key(raw_key),
            key_prefix=raw_key[:12] + "...",
            is_active=True,
        )
        db.add(key)
        await db.flush()

        # Simulate authentication lookup
        result = await db.execute(
            select(APIKey).where(
                APIKey.key_hash == _hash_key(raw_key),
                APIKey.is_active == True,
            )
        )
        found = result.scalar_one_or_none()

        assert found is not None
        assert found.name == "Auth Test Key"

    async def test_revoked_key_not_found(self, db: AsyncSession, test_user: User):
        """Revoked key should not be found in active lookup."""
        raw_key = "aida_revoked_key_abc"
        key = APIKey(
            user_id=test_user.id,
            name="Revoked Key",
            key_hash=_hash_key(raw_key),
            key_prefix=raw_key[:12] + "...",
            is_active=False,
        )
        db.add(key)
        await db.flush()

        result = await db.execute(
            select(APIKey).where(
                APIKey.key_hash == _hash_key(raw_key),
                APIKey.is_active == True,
            )
        )
        found = result.scalar_one_or_none()

        assert found is None

    async def test_multiple_keys_per_user(self, db: AsyncSession, test_user: User):
        """A user can have multiple API keys."""
        for i in range(3):
            key = APIKey(
                user_id=test_user.id,
                name=f"Key {i}",
                key_hash=_hash_key(f"aida_key_{i}"),
                key_prefix=f"aida_key_{i}...",
                is_active=True,
            )
            db.add(key)
        await db.flush()

        result = await db.execute(
            select(APIKey).where(APIKey.user_id == test_user.id)
        )
        keys = result.scalars().all()

        assert len(keys) == 3
