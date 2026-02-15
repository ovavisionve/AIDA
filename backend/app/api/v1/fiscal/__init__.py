from fastapi import APIRouter
from app.api.v1.fiscal import endpoints, onboarding

router = APIRouter()

router.include_router(endpoints.router, tags=["API Fiscal Estándar"])
router.include_router(onboarding.router, prefix="/onboarding", tags=["Onboarding de Clientes"])
