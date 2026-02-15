from fastapi import APIRouter
from app.api.v1 import auth, users, clients, documents, admin

router = APIRouter()

router.include_router(auth.router, prefix="/auth", tags=["Autenticación"])
router.include_router(users.router, prefix="/users", tags=["Usuarios"])
router.include_router(clients.router, prefix="/clients", tags=["Clientes"])
router.include_router(documents.router, prefix="/documents", tags=["Documentos"])
router.include_router(admin.router, prefix="/admin", tags=["Administración"])
