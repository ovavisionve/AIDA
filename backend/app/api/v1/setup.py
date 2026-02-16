"""
Endpoint público de setup/bootstrap para inicialización del sistema.

Este endpoint se usa SOLO la primera vez para crear tablas y datos iniciales.
Una vez que existen usuarios, devuelve un mensaje indicando que ya está configurado.
"""
import traceback
from fastapi import APIRouter
from sqlalchemy import select, func, text
from app.database import engine, async_session, Base

router = APIRouter()


@router.post("/bootstrap")
async def bootstrap_system():
    """
    Inicializa el sistema: crea tablas + datos iniciales.

    Solo funciona si no hay usuarios en el sistema.
    Si ya hay usuarios, retorna un mensaje indicando que ya está listo.

    Credenciales por defecto del admin:
      - Email: admin@aida.com.ve
      - Password: Admin2024!
    """
    errors = []

    # Step 1: Create tables
    try:
        import app.models  # noqa: F401
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception as e:
        errors.append(f"Error creando tablas: {str(e)}")
        traceback.print_exc()
        return {"status": "error", "errors": errors}

    # Step 2: Check if already initialized
    try:
        from app.models.security import User
        async with async_session() as session:
            count = (await session.execute(select(func.count(User.id)))).scalar() or 0
    except Exception as e:
        errors.append(f"Error consultando usuarios: {str(e)}")
        traceback.print_exc()
        return {"status": "error", "errors": errors}

    if count > 0:
        return {
            "status": "already_initialized",
            "message": f"El sistema ya está inicializado con {count} usuario(s). Use /api/v1/auth/login para acceder.",
            "users": count,
        }

    # Step 3: Run full seed
    try:
        from app.services.seed import seed_database
        await seed_database()
    except Exception as e:
        errors.append(f"Error en seed: {str(e)}")
        traceback.print_exc()
        return {"status": "error", "message": "Tablas creadas pero seed falló", "errors": errors}

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
async def system_status():
    """Verificar si el sistema está inicializado y la DB está conectada."""
    # Test DB connection
    db_ok = False
    db_error = None
    try:
        async with async_session() as session:
            await session.execute(text("SELECT 1"))
            db_ok = True
    except Exception as e:
        db_error = str(e)

    if not db_ok:
        return {
            "initialized": False,
            "database": "disconnected",
            "error": db_error,
            "message": "No se puede conectar a la base de datos. Verifique DATABASE_URL en Railway.",
        }

    # Check if tables exist and have users
    try:
        from app.models.security import User
        async with async_session() as session:
            count = (await session.execute(select(func.count(User.id)))).scalar() or 0
        return {
            "initialized": count > 0,
            "database": "connected",
            "users": count,
            "message": "Sistema listo" if count > 0 else "Sistema no inicializado. Use POST /api/v1/setup/bootstrap",
        }
    except Exception as e:
        return {
            "initialized": False,
            "database": "connected",
            "tables_exist": False,
            "error": str(e),
            "message": "DB conectada pero tablas no existen. Use POST /api/v1/setup/bootstrap",
        }
