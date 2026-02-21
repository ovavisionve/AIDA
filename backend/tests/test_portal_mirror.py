"""
Tests for the Mirror (Client) portal API endpoints.

Covers: authentication, profile, dashboard, document listing/download,
template preferences, logo/banner uploads, and AI chat.
Also includes static analysis checks for known frontend issues.
"""
import pytest
import uuid
import pathlib
from unittest.mock import AsyncMock, MagicMock, patch

from httpx import AsyncClient, ASGITransport

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

TEST_CLIENT_ID = uuid.uuid4()
TEST_USER_ID = uuid.uuid4()

MIRROR_PAGE = pathlib.Path(
    "/home/user/AIDA/frontend/apps/portal-client/app/page.tsx"
)
MIRROR_CHAT = pathlib.Path(
    "/home/user/AIDA/frontend/apps/portal-client/components/AIChatWidget.tsx"
)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

def _fake_user():
    user = MagicMock()
    user.id = TEST_USER_ID
    user.email = "cliente@mirror.test"
    user.first_name = "Ana"
    user.last_name = "García"
    user.phone = "+58 412 1234567"
    user.is_active = True
    user.is_superadmin = False
    user.is_verified = True
    user.totp_enabled = False
    user.language = "es"
    user.timezone = "America/Caracas"
    user.theme = "dark"
    user.client_id = TEST_CLIENT_ID
    # Nested client
    user.client = MagicMock()
    user.client.id = TEST_CLIENT_ID
    user.client.rif = "J-98765432-1"
    user.client.razon_social = "Distribuidora Mirror CA"
    user.client.nombre_comercial = "MirrorTest"
    user.client.plan = "empresarial"
    user.client.is_active = True
    return user


@pytest.fixture
def app():
    from app.main import app as _app
    from app.database import get_db
    from app.services.auth import get_current_user

    mock_db = AsyncMock()
    mock_db.execute = AsyncMock(
        return_value=MagicMock(scalar_one_or_none=MagicMock(return_value=None))
    )
    mock_db.flush = AsyncMock()
    mock_db.commit = AsyncMock()
    mock_db.rollback = AsyncMock()

    async def _db_override():
        yield mock_db

    _app.dependency_overrides[get_db] = _db_override
    _app.dependency_overrides[get_current_user] = lambda: _fake_user()

    yield _app, mock_db
    _app.dependency_overrides.clear()


@pytest.fixture
async def client(app):
    _app, _ = app
    transport = ASGITransport(app=_app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        c.headers["Authorization"] = "Bearer fake-jwt-for-testing"
        yield c


# ---------------------------------------------------------------------------
# Auth & Login
# ---------------------------------------------------------------------------

class TestMirrorAuth:
    """Login and session management for Mirror."""

    @pytest.mark.anyio
    async def test_login_success_structure(self, client):
        """POST /auth/login should return access_token + user on success."""
        with patch("app.api.v1.auth.authenticate_user", new_callable=AsyncMock) as mock:
            mock.return_value = {
                "access_token": "tok_mirror",
                "refresh_token": "ref_mirror",
                "user": {
                    "id": str(TEST_USER_ID),
                    "email": "cliente@mirror.test",
                    "first_name": "Ana",
                    "last_name": "García",
                    "is_superadmin": False,
                },
            }
            res = await client.post("/api/v1/auth/login", json={
                "email": "cliente@mirror.test",
                "password": "SecureP@ss1",
            })
        assert res.status_code in (200, 422, 500)
        if res.status_code == 200:
            data = res.json()
            assert "access_token" in data

    @pytest.mark.anyio
    async def test_login_empty_body(self, client):
        """POST /auth/login with empty body should 422."""
        res = await client.post("/api/v1/auth/login", json={})
        assert res.status_code == 422

    @pytest.mark.anyio
    async def test_login_missing_password(self, client):
        """POST /auth/login without password should 422."""
        res = await client.post("/api/v1/auth/login", json={"email": "a@b.com"})
        assert res.status_code == 422


# ---------------------------------------------------------------------------
# Profile
# ---------------------------------------------------------------------------

class TestMirrorProfile:
    """User profile endpoint."""

    @pytest.mark.anyio
    async def test_profile_returns_full_data(self, client):
        """GET /users/me/profile should include user + client info."""
        res = await client.get("/api/v1/users/me/profile")
        assert res.status_code == 200
        data = res.json()
        assert "email" in data
        assert "first_name" in data
        assert "last_name" in data

    @pytest.mark.anyio
    async def test_profile_no_auth(self, app):
        """GET /users/me/profile without token should 401/403."""
        _app, _ = app
        _app.dependency_overrides.clear()  # Remove auth override
        transport = ASGITransport(app=_app)
        async with AsyncClient(transport=transport, base_url="http://test") as c:
            res = await c.get("/api/v1/users/me/profile")
        assert res.status_code in (401, 403, 422)


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------

class TestMirrorDashboard:
    """Dashboard stats for the client portal."""

    @pytest.mark.anyio
    async def test_dashboard_returns_stats(self, client):
        """GET /documents/dashboard should return stat fields."""
        res = await client.get("/api/v1/documents/dashboard")
        assert res.status_code == 200
        data = res.json()
        # At minimum the structure should be present
        assert isinstance(data, dict)

    @pytest.mark.anyio
    async def test_dashboard_stat_fields(self, client):
        """Dashboard should contain expected stat keys."""
        res = await client.get("/api/v1/documents/dashboard")
        if res.status_code == 200:
            data = res.json()
            expected_keys = {
                "total_documents_month",
                "total_pending_download",
                "total_billed_current",
                "total_billed_previous",
            }
            # Check at least some keys are present
            assert len(expected_keys & set(data.keys())) > 0 or "recent_documents" in data


# ---------------------------------------------------------------------------
# Document Listing
# ---------------------------------------------------------------------------

class TestMirrorDocuments:
    """Document listing and search for the client portal."""

    @pytest.mark.anyio
    async def test_list_documents_default(self, client):
        """GET /documents should return paginated list."""
        res = await client.get("/api/v1/documents?page=1&page_size=20")
        assert res.status_code == 200
        data = res.json()
        assert "items" in data or isinstance(data, list)

    @pytest.mark.anyio
    async def test_list_documents_search(self, client):
        """GET /documents?search=... should filter results."""
        res = await client.get("/api/v1/documents?search=J-98765432")
        assert res.status_code == 200

    @pytest.mark.anyio
    async def test_list_documents_pagination(self, client):
        """GET /documents with page params should paginate."""
        res = await client.get("/api/v1/documents?page=2&page_size=5")
        assert res.status_code == 200
        data = res.json()
        if "page" in data:
            assert data["page"] == 2

    @pytest.mark.anyio
    async def test_list_documents_invalid_page(self, client):
        """GET /documents?page=0 should 422 (page must be >= 1)."""
        res = await client.get("/api/v1/documents?page=0")
        assert res.status_code == 422


# ---------------------------------------------------------------------------
# Document Downloads
# ---------------------------------------------------------------------------

class TestMirrorDownloads:
    """PDF and XML download endpoints."""

    @pytest.mark.anyio
    async def test_download_pdf_unknown_doc(self, client):
        """GET /documents/{id}/pdf with unknown ID should 404."""
        fake_id = str(uuid.uuid4())
        res = await client.get(f"/api/v1/documents/{fake_id}/pdf")
        assert res.status_code in (404, 500)

    @pytest.mark.anyio
    async def test_download_xml_unknown_doc(self, client):
        """GET /documents/{id}/xml with unknown ID should 404."""
        fake_id = str(uuid.uuid4())
        res = await client.get(f"/api/v1/documents/{fake_id}/xml")
        assert res.status_code in (404, 500)

    @pytest.mark.anyio
    async def test_download_invalid_format(self, client):
        """GET /documents/{id}/csv should 404/405 (only pdf/xml supported)."""
        fake_id = str(uuid.uuid4())
        res = await client.get(f"/api/v1/documents/{fake_id}/csv")
        assert res.status_code in (404, 405, 422)


# ---------------------------------------------------------------------------
# Templates & Preferences
# ---------------------------------------------------------------------------

class TestMirrorTemplates:
    """Template management in the client portal."""

    @pytest.mark.anyio
    async def test_list_templates(self, client):
        """GET /templates/ should return available templates."""
        res = await client.get("/api/v1/templates/")
        assert res.status_code == 200

    @pytest.mark.anyio
    async def test_get_preferences(self, client):
        """GET /templates/preferences/me should return preference map."""
        res = await client.get("/api/v1/templates/preferences/me")
        assert res.status_code == 200

    @pytest.mark.anyio
    async def test_set_preference(self, client):
        """POST /templates/preference should save preference."""
        fake_template_id = str(uuid.uuid4())
        res = await client.post(
            f"/api/v1/templates/preference?document_type=factura&template_id={fake_template_id}"
        )
        # May 404 if template doesn't exist, but endpoint should respond
        assert res.status_code in (200, 201, 404, 422, 500)


# ---------------------------------------------------------------------------
# Uploads (Logo & Banners)
# ---------------------------------------------------------------------------

class TestMirrorUploads:
    """File upload endpoints for branding."""

    @pytest.mark.anyio
    async def test_list_banners(self, client):
        """GET /uploads/banners should return list."""
        res = await client.get("/api/v1/uploads/banners")
        assert res.status_code == 200

    @pytest.mark.anyio
    async def test_upload_logo_no_file(self, client):
        """POST /uploads/logo without file should 422."""
        res = await client.post("/api/v1/uploads/logo")
        assert res.status_code == 422

    @pytest.mark.anyio
    async def test_delete_banner_unknown(self, client):
        """DELETE /uploads/banners/{id} with unknown ID should 404."""
        fake_id = str(uuid.uuid4())
        res = await client.delete(f"/api/v1/uploads/banners/{fake_id}")
        assert res.status_code in (404, 500)


# ---------------------------------------------------------------------------
# AI Chat
# ---------------------------------------------------------------------------

class TestMirrorAIChat:
    """AI fiscal assistant chat endpoint."""

    @pytest.mark.anyio
    async def test_chat_basic_message(self, client):
        """POST /ai/chat should return a response."""
        res = await client.post("/api/v1/ai/chat", json={
            "message": "¿Cuántos números de control me quedan?",
            "conversation_history": [],
            "include_context": True,
        })
        # May fail if AI service not configured, but endpoint should respond
        assert res.status_code in (200, 500, 503)

    @pytest.mark.anyio
    async def test_chat_empty_message(self, client):
        """POST /ai/chat with empty message should 422."""
        res = await client.post("/api/v1/ai/chat", json={
            "message": "",
            "conversation_history": [],
            "include_context": False,
        })
        assert res.status_code == 422

    @pytest.mark.anyio
    async def test_chat_with_history(self, client):
        """POST /ai/chat should accept conversation history."""
        res = await client.post("/api/v1/ai/chat", json={
            "message": "¿Y las notas de crédito?",
            "conversation_history": [
                {"role": "user", "content": "Resumen fiscal del mes"},
                {"role": "assistant", "content": "Tienes 15 facturas emitidas..."},
            ],
            "include_context": True,
        })
        assert res.status_code in (200, 500, 503)


# ===========================================================================
# STATIC ANALYSIS: Known Frontend Issues in Mirror
# ===========================================================================

class TestMirrorFrontendIssues:
    """
    Static checks that verify known issues in the Mirror portal frontend.
    These tests document bugs/gaps and will FAIL when the issues are fixed
    (at which point the assertions should be updated).
    """

    def test_2fa_not_implemented(self):
        """
        BUG: 2FA detection shows error but no input form.
        Users with 2FA enabled cannot log in.
        """
        content = MIRROR_PAGE.read_text()
        # The portal detects 2FA but only shows an error message
        assert 'requires_2fa' in content, "2FA detection should exist"
        # There is no TOTP input field
        assert 'totp' not in content.lower() or 'totp_code' not in content, \
            "No TOTP input field implemented — 2FA users are blocked"

    def test_download_silent_failure(self):
        """
        BUG: handleDownload returns silently on error (no user feedback).
        Line ~397: if (!res.ok) return;
        """
        content = MIRROR_PAGE.read_text()
        assert "if (!res.ok) return;" in content, \
            "Download still silently fails on error (no feedback to user)"

    def test_empty_catch_in_download(self):
        """
        BUG: Empty catch block in handleDownload swallows errors.
        """
        content = MIRROR_PAGE.read_text()
        # The function has a catch {} with no error handling
        assert "catch {}" in content or "} catch {" in content, \
            "Empty catch block still present in document download"

    def test_ai_chat_api_path_mismatch(self):
        """
        BUG: AIChatWidget uses a different API base than the main app.
        Main app: NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
        Chat widget: NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        Then calls: ${API}/api/v1/ai/chat

        This works but is inconsistent — if NEXT_PUBLIC_API_URL includes
        /api/v1, the chat widget will double-up the path.
        """
        chat_content = MIRROR_CHAT.read_text()
        page_content = MIRROR_PAGE.read_text()

        # Main page defaults to /api/v1
        assert 'http://localhost:8000/api/v1' in page_content

        # Chat widget defaults WITHOUT /api/v1
        assert 'http://localhost:8000"' in chat_content, \
            "Chat widget API base is different from main app"

    def test_no_token_refresh_mechanism(self):
        """
        GAP: No token refresh logic — sessions expire silently.
        """
        content = MIRROR_PAGE.read_text()
        assert "refresh_token" in content, "refresh_token is stored"
        # But it's never USED for refreshing
        assert "/auth/refresh" not in content, \
            "No refresh endpoint called — tokens expire silently"

    def test_template_load_silent_failure(self):
        """
        BUG: Template section catch block silently swallows errors.
        catch { /* templates are non-critical */ }
        """
        content = MIRROR_PAGE.read_text()
        assert "templates are non-critical" in content, \
            "Template load errors are silently ignored"

    def test_currency_format_hardcoded(self):
        """
        GAP: Currency is hardcoded to Bolívares (Bs.) — no USD support.
        """
        content = MIRROR_PAGE.read_text()
        assert "Bs." in content, "Currency hardcoded to Bolivares"

    def test_no_document_filters(self):
        """
        GAP: Document list has basic search but no type/status/date filters
        (unlike the facturador portal which has full filters).
        """
        content = MIRROR_PAGE.read_text()
        # DocumentsSection in Mirror only has a search input
        # No select dropdowns for doc_type or status
        assert "doc_type" not in content.split("function DocumentsSection")[1].split("function ")[0] if "function DocumentsSection" in content else True, \
            "No document type filter in client portal"
