from fastapi import APIRouter
from app.api.v1 import auth, users, clients, documents, admin
from app.api.v1 import products, customers, invoicing, portal5
from app.api.v1.fiscal import router as fiscal_router

router = APIRouter()

# Portales Web (autenticación JWT)
router.include_router(auth.router, prefix="/auth", tags=["Autenticación"])
router.include_router(users.router, prefix="/users", tags=["Usuarios"])
router.include_router(clients.router, prefix="/clients", tags=["Clientes AIda"])
router.include_router(documents.router, prefix="/documents", tags=["Documentos (Portal 1)"])
router.include_router(admin.router, prefix="/admin", tags=["Administración (Portal 6)"])

# Portal 2 - Facturador
router.include_router(products.router, prefix="/products", tags=["Productos (Portal 2)"])
router.include_router(customers.router, prefix="/customers", tags=["Clientes Finales (Portal 2)"])
router.include_router(invoicing.router, prefix="/invoicing", tags=["Facturación (Portal 2)"])

# Portal 5 - Gestión de Integraciones
router.include_router(portal5.router, prefix="/portal5", tags=["Gestión (Portal 5)"])

# API Fiscal Estándar (autenticación API Key)
router.include_router(fiscal_router, prefix="/fiscal")
