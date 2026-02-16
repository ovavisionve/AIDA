"""
Endpoint público de setup/bootstrap para inicialización del sistema.

Este endpoint se usa SOLO la primera vez para crear tablas y datos iniciales.
Una vez que existen usuarios, devuelve un mensaje indicando que ya está configurado.
"""
from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db, engine, Base
from app.models.security import User

router = APIRouter()


@router.post("/bootstrap")
async def bootstrap_system(db: AsyncSession = Depends(get_db)):
    """
    Inicializa el sistema: crea tablas + datos iniciales.

    Solo funciona si no hay usuarios en el sistema.
    Si ya hay usuarios, retorna un mensaje indicando que ya está listo.

    Credenciales por defecto del admin:
      - Email: admin@aida.com.ve
      - Password: Admin2024!
    """
    # Check if already initialized
    try:
        count = (await db.execute(select(func.count(User.id)))).scalar() or 0
    except Exception:
        # Tables might not exist yet, create them
        import app.models  # noqa: F401
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        count = 0

    if count > 0:
        return {
            "status": "already_initialized",
            "message": f"El sistema ya está inicializado con {count} usuario(s). Use /api/v1/auth/login para acceder.",
            "users": count,
        }

    # Run full seed
    from app.services.seed import seed_database
    await seed_database()

    return {
        "status": "initialized",
        "message": "Sistema inicializado exitosamente. Tablas creadas, roles, permisos y admin configurados.",
        "admin_email": "admin@aida.com.ve",
        "admin_password": "Admin2024!",
        "next_steps": [
            "1. Haga login en POST /api/v1/auth/login con las credenciales de admin",
            "2. Use el token para acceder a los demás endpoints",
            "3. Cambie la contraseña del admin en POST /api/v1/auth/change-password",
        ],
    }


@router.get("/status")
async def system_status(db: AsyncSession = Depends(get_db)):
    """Verificar si el sistema está inicializado."""
    try:
        count = (await db.execute(select(func.count(User.id)))).scalar() or 0
        return {
            "initialized": count > 0,
            "users": count,
            "message": "Sistema listo" if count > 0 else "Sistema no inicializado. Use POST /api/v1/setup/bootstrap",
        }
    except Exception:
        return {
            "initialized": False,
            "users": 0,
            "message": "Tablas no creadas. Use POST /api/v1/setup/bootstrap",
        }
