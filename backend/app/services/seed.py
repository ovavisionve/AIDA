"""Script de seed para datos iniciales del sistema AIDA."""
import asyncio
from sqlalchemy import select
from app.database import engine, async_session, Base
from app.core.security import hash_password
from app.core.permissions import ALL_PERMISSIONS, DEFAULT_ROLES
from app.models.security import User, Role, Permission, RolePermission, UserRole
from app.models.config import SystemSetting


async def seed_database():
    """Crea tablas y datos iniciales."""
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        # 1. Seed permissions
        print("Creando permisos...")
        perm_map = {}
        for code, (name, module, category) in ALL_PERMISSIONS.items():
            result = await session.execute(select(Permission).where(Permission.code == code))
            perm = result.scalar_one_or_none()
            if not perm:
                perm = Permission(code=code, name=name, module=module, category=category)
                session.add(perm)
                await session.flush()
            perm_map[code] = perm
        print(f"  {len(perm_map)} permisos configurados")

        # 2. Seed roles
        print("Creando roles...")
        role_map = {}
        for role_name, role_data in DEFAULT_ROLES.items():
            result = await session.execute(select(Role).where(Role.name == role_name))
            role = result.scalar_one_or_none()
            if not role:
                role = Role(
                    name=role_name,
                    display_name=role_data["display_name"],
                    description=role_data["description"],
                    level=role_data["level"],
                    is_system=True,
                )
                session.add(role)
                await session.flush()

                for perm_code in role_data["permissions"]:
                    if perm_code in perm_map:
                        session.add(RolePermission(role_id=role.id, permission_id=perm_map[perm_code].id))
            role_map[role_name] = role
        print(f"  {len(role_map)} roles configurados")

        # 3. Create super admin user
        print("Verificando super admin...")
        result = await session.execute(select(User).where(User.email == "admin@aida.com.ve"))
        admin = result.scalar_one_or_none()
        if not admin:
            admin = User(
                email="admin@aida.com.ve",
                hashed_password=hash_password("Admin2024!"),
                first_name="Super",
                last_name="Admin",
                is_active=True,
                is_superadmin=True,
                is_verified=True,
            )
            session.add(admin)
            await session.flush()

            # Assign super_admin role
            if "super_admin" in role_map:
                session.add(UserRole(user_id=admin.id, role_id=role_map["super_admin"].id))

            print("  Super admin creado: admin@aida.com.ve / Admin2024!")
        else:
            print("  Super admin ya existe")

        # 4. Seed system settings
        print("Configurando parámetros del sistema...")
        default_settings = [
            ("empresa.rif", "J-XXXXXXXX-X", "RIF de AIda", "empresa", False),
            ("empresa.razon_social", "AIda Imprenta Digital C.A.", "Razón social", "empresa", False),
            ("empresa.direccion", "Caracas, Venezuela", "Dirección fiscal", "empresa", False),
            ("empresa.telefono", "+58-XXX-XXXXXXX", "Teléfono principal", "empresa", False),
            ("empresa.email", "info@aida.com.ve", "Email principal", "empresa", False),
            ("facturacion.moneda_principal", "VES", "Moneda principal", "facturacion", False),
            ("facturacion.iva_general", "16.00", "Alícuota IVA general (%)", "facturacion", False),
            ("facturacion.iva_reducida", "8.00", "Alícuota IVA reducida (%)", "facturacion", False),
            ("facturacion.iva_exento", "0.00", "IVA exento", "facturacion", False),
            ("seguridad.max_login_attempts", "5", "Intentos de login antes de bloqueo", "seguridad", False),
            ("seguridad.lockout_minutes", "30", "Minutos de bloqueo", "seguridad", False),
            ("seguridad.session_timeout_minutes", "30", "Timeout de sesión (min)", "seguridad", False),
            ("seguridad.password_min_length", "8", "Longitud mínima de contraseña", "seguridad", False),
            ("almacenamiento.retencion_anos", "10", "Años de retención de datos (SENIAT)", "almacenamiento", False),
        ]
        for key, value, desc, category, sensitive in default_settings:
            result = await session.execute(select(SystemSetting).where(SystemSetting.key == key))
            if not result.scalar_one_or_none():
                session.add(SystemSetting(
                    key=key, value=value, description=desc,
                    category=category, is_sensitive=sensitive,
                ))

        await session.commit()
        print("Seed completado exitosamente.")


if __name__ == "__main__":
    asyncio.run(seed_database())
