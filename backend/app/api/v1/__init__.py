from fastapi import APIRouter
from app.api.v1 import auth, users, clients, documents, admin
from app.api.v1 import products, customers, invoicing, portal5, ai
from app.api.v1 import validation, developers
from app.api.v1 import uploads, document_templates, payments, batch
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

# IA - Asistente Fiscal, Analytics, Reportes
router.include_router(ai.router, prefix="/ai", tags=["IA - Asistente y Analytics"])

# Portal 3 - Validación Pública
router.include_router(validation.router, prefix="/validation", tags=["Validación Pública (Portal 3)"])

# Portal 4 - Developers
router.include_router(developers.router, prefix="/developers", tags=["Developers (Portal 4)"])

# Plantillas y Uploads
router.include_router(document_templates.router, prefix="/templates", tags=["Plantillas de Documentos"])
router.include_router(uploads.router, prefix="/uploads", tags=["Upload de Archivos"])

# Pagos y Suscripciones
router.include_router(payments.router, prefix="/billing", tags=["Pagos y Suscripciones"])

# Carga Masiva / SFTP
router.include_router(batch.router, prefix="/fiscal", tags=["Carga Masiva (SFTP/Upload)"])

# API Fiscal Estándar (autenticación API Key)
router.include_router(fiscal_router, prefix="/fiscal")
