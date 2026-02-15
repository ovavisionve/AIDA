"""
Servicio de almacenamiento de archivos para AIDA.

Soporta backend local y S3 (abstracción para producción).
Almacena PDFs, XMLs y otros archivos generados por el sistema.
"""
import os
import uuid
from pathlib import Path
from datetime import datetime, timezone

from app.config import get_settings


class StorageBackend:
    """Abstracción de almacenamiento de archivos."""

    def __init__(self):
        self.settings = get_settings()
        self.backend = self.settings.STORAGE_BACKEND
        self.base_path = Path(self.settings.STORAGE_PATH)

    def _ensure_dir(self, path: Path):
        path.parent.mkdir(parents=True, exist_ok=True)

    def _build_path(self, client_id: str, doc_type: str, filename: str) -> Path:
        """Construye ruta: {base}/{client_id}/{doc_type}/{YYYY-MM}/{filename}"""
        now = datetime.now(timezone.utc)
        month_dir = now.strftime("%Y-%m")
        return self.base_path / client_id / doc_type / month_dir / filename

    async def save(self, content: bytes, client_id: str, doc_type: str, filename: str) -> str:
        """Guarda un archivo y retorna la ruta relativa."""
        rel_path = self._build_path(client_id, doc_type, filename)
        full_path = rel_path

        if self.backend == "local":
            self._ensure_dir(full_path)
            full_path.write_bytes(content)
            return str(rel_path.relative_to(self.base_path))
        else:
            # S3 placeholder - en producción usar boto3
            self._ensure_dir(full_path)
            full_path.write_bytes(content)
            return str(rel_path.relative_to(self.base_path))

    async def read(self, relative_path: str) -> bytes | None:
        """Lee un archivo por su ruta relativa."""
        full_path = self.base_path / relative_path
        if full_path.exists():
            return full_path.read_bytes()
        return None

    async def delete(self, relative_path: str) -> bool:
        """Elimina un archivo."""
        full_path = self.base_path / relative_path
        if full_path.exists():
            full_path.unlink()
            return True
        return False

    async def exists(self, relative_path: str) -> bool:
        """Verifica si un archivo existe."""
        return (self.base_path / relative_path).exists()

    def get_download_url(self, relative_path: str) -> str:
        """Retorna URL de descarga para el archivo."""
        return f"/api/v1/fiscal/files/{relative_path}"


# Singleton
_storage: StorageBackend | None = None


def get_storage() -> StorageBackend:
    global _storage
    if _storage is None:
        _storage = StorageBackend()
    return _storage
