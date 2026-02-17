"""Script de seed para datos iniciales del sistema AIDA."""
import asyncio
import secrets
import hashlib
from datetime import date, datetime, timezone
from sqlalchemy import select
from app.database import engine, async_session, Base
from app.core.security import hash_password
from app.core.permissions import ALL_PERMISSIONS, DEFAULT_ROLES
from app.models.security import User, Role, Permission, RolePermission, UserRole
from app.models.config import SystemSetting
from app.models.templates import DocumentTemplate
from app.models.clients import Client, ClientUser, ClientSetting
from app.models.control_numbers import ControlNumberRange


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

        # ── 5. Seed plantillas de documentos fiscales ─────────────────────────
        print("Creando plantillas de documentos...")
        from app.api.v1.document_templates import DEFAULT_TEMPLATES

        templates_created = 0
        for tpl_data in DEFAULT_TEMPLATES:
            result = await session.execute(
                select(DocumentTemplate).where(DocumentTemplate.code == tpl_data["code"])
            )
            if not result.scalar_one_or_none():
                session.add(DocumentTemplate(
                    name=tpl_data["name"],
                    code=tpl_data["code"],
                    description=tpl_data["description"],
                    layout_config=tpl_data["layout_config"],
                    is_default=tpl_data["is_default"],
                    sort_order=tpl_data["sort_order"],
                ))
                templates_created += 1
        print(f"  {templates_created} plantillas de documentos creadas")

        # ── 6. Seed plantillas de integración (Portal 5) ─────────────────────
        print("Creando plantillas de integración...")
        from app.services.integrations.templates import seed_templates as seed_integration_templates
        integ_count = await seed_integration_templates(session)
        print(f"  {integ_count} plantillas de integración creadas")

        # ── 7. Seed clientes de prueba ────────────────────────────────────────
        print("Creando clientes de prueba...")
        await _seed_test_clients(session, admin, role_map)

        await session.commit()
        print("Seed completado exitosamente.")


async def _seed_test_clients(session, admin_user, role_map):
    """Crea 2 clientes de prueba completos para testing manual."""

    # ──────────────────────────────────────────────────────────────────────
    # CLIENTE 1: Alimentos Santoni C.A.
    # Escenario: Empresa de alimentos con SAP Business One.
    #   Quiere emitir facturas digitales con AIDA manteniendo su SAP.
    #   Plan empresarial, alto volumen.
    # ──────────────────────────────────────────────────────────────────────
    result = await session.execute(select(Client).where(Client.rif == "J-31245678-3"))
    if not result.scalar_one_or_none():
        client1 = Client(
            rif="J-31245678-3",
            razon_social="Alimentos Santoni C.A.",
            nombre_comercial="Arroz Santoni",
            direccion_fiscal="Av. Francisco de Miranda, Torre Santoni, Piso 8, Chacao, Caracas 1060, Distrito Capital",
            telefono_principal="+58-212-2615500",
            telefono_secundario="+58-412-3456789",
            email_principal="facturacion@arrozsantoni.com.ve",
            email_secundario="contabilidad@arrozsantoni.com.ve",
            representante_legal="Carlos Eduardo Santoni Martínez",
            sector_industria="Alimentos y Bebidas",
            plan="empresarial",
            fecha_inicio=date(2025, 1, 15),
            fecha_renovacion=date(2026, 1, 15),
            metodo_pago="transferencia",
            is_active=True,
            logo_url=None,
            color_primario="#d4a017",
            color_secundario="#2c5f2d",
            moneda_principal="VES",
            max_documentos_mes=99999,
            max_usuarios=99,
            max_almacenamiento_gb=100,
        )
        session.add(client1)
        await session.flush()

        # API credentials
        api_key_1 = f"aida_J312456783_{secrets.token_hex(16)}"
        api_secret_1 = secrets.token_hex(32)
        api_secret_hash_1 = hashlib.sha256(api_secret_1.encode()).hexdigest()

        for key, value, desc in [
            ("api_key", api_key_1, "API Key para integraciones"),
            ("api_secret_hash", api_secret_hash_1, "Hash del API Secret"),
            ("series.facturas", "A", "Serie para facturas"),
            ("series.notas_credito", "NC", "Serie para notas de crédito"),
            ("series.notas_debito", "ND", "Serie para notas de débito"),
            ("tipo_sistema", "sap_b1", "Tipo de sistema del cliente"),
            ("webhook_url", "https://erp.arrozsantoni.com.ve/api/webhooks/aida", "URL para webhooks"),
            ("webhook_secret", secrets.token_hex(16), "Secret para validar webhooks"),
            ("sap.service_layer_url", "https://sap.arrozsantoni.com.ve:50000/b1s/v1", "URL Service Layer SAP"),
            ("sap.company_db", "SANTONI_PROD", "BD empresa SAP"),
        ]:
            session.add(ClientSetting(client_id=client1.id, key=key, value=value, description=desc))

        # Control number range
        session.add(ControlNumberRange(
            client_id=client1.id,
            serie="A",
            numero_inicio=1,
            numero_fin=5000,
            numero_actual=1,
            is_active=True,
            fecha_asignacion=datetime.now(timezone.utc),
            autorizacion_seniat="SNAT-2025-IMP-001234",
            notas="Rango inicial asignado en onboarding",
        ))

        # Admin user for this client
        user1 = User(
            email="carlos.santoni@arrozsantoni.com.ve",
            hashed_password=hash_password("Santoni2025!"),
            first_name="Carlos",
            last_name="Santoni",
            is_active=True,
            is_verified=True,
        )
        session.add(user1)
        await session.flush()

        session.add(ClientUser(client_id=client1.id, user_id=user1.id, is_primary=True))

        if "client_admin" in role_map:
            session.add(UserRole(
                user_id=user1.id,
                role_id=role_map["client_admin"].id,
                client_id=client1.id,
                assigned_by=admin_user.id,
            ))

        # Secondary user (contadora)
        user1b = User(
            email="maria.rodriguez@arrozsantoni.com.ve",
            hashed_password=hash_password("Santoni2025!"),
            first_name="María",
            last_name="Rodríguez",
            is_active=True,
            is_verified=True,
        )
        session.add(user1b)
        await session.flush()

        session.add(ClientUser(client_id=client1.id, user_id=user1b.id, is_primary=False))

        if "client_user" in role_map:
            session.add(UserRole(
                user_id=user1b.id,
                role_id=role_map["client_user"].id,
                client_id=client1.id,
                assigned_by=admin_user.id,
            ))

        print("  Cliente 1: Alimentos Santoni C.A. (SAP B1)")
        print(f"    Admin: carlos.santoni@arrozsantoni.com.ve / Santoni2025!")
        print(f"    Usuario: maria.rodriguez@arrozsantoni.com.ve / Santoni2025!")
        print(f"    API Key: {api_key_1}")
        print(f"    API Secret: {api_secret_1}")

    # ──────────────────────────────────────────────────────────────────────
    # CLIENTE 2: Distribuidora Electro Caribe C.A.
    # Escenario: Distribuidor de electrodomésticos, NO tiene facturador.
    #   Quiere usar el facturador propio de AIDA como su sistema principal.
    #   Plan profesional, volumen medio. Actualmente factura manual.
    # ──────────────────────────────────────────────────────────────────────
    result = await session.execute(select(Client).where(Client.rif == "J-40987654-1"))
    if not result.scalar_one_or_none():
        client2 = Client(
            rif="J-40987654-1",
            razon_social="Distribuidora Electro Caribe C.A.",
            nombre_comercial="Electro Caribe",
            direccion_fiscal="Calle 72 con Av. 3H, Centro Comercial Lago Mall, Local 45, Maracaibo, Zulia",
            telefono_principal="+58-261-7924500",
            telefono_secundario="+58-424-6543210",
            email_principal="admin@electrocaribe.com.ve",
            email_secundario="ventas@electrocaribe.com.ve",
            representante_legal="Luis Alberto Pérez Hernández",
            sector_industria="Comercio / Electrodomésticos",
            plan="profesional",
            fecha_inicio=date(2025, 3, 1),
            fecha_renovacion=date(2026, 3, 1),
            metodo_pago="pago_movil",
            is_active=True,
            logo_url=None,
            color_primario="#0066cc",
            color_secundario="#ff6600",
            moneda_principal="VES",
            max_documentos_mes=500,
            max_usuarios=5,
            max_almacenamiento_gb=20,
        )
        session.add(client2)
        await session.flush()

        # API credentials
        api_key_2 = f"aida_J409876541_{secrets.token_hex(16)}"
        api_secret_2 = secrets.token_hex(32)
        api_secret_hash_2 = hashlib.sha256(api_secret_2.encode()).hexdigest()

        for key, value, desc in [
            ("api_key", api_key_2, "API Key para integraciones"),
            ("api_secret_hash", api_secret_hash_2, "Hash del API Secret"),
            ("series.facturas", "EC", "Serie para facturas"),
            ("series.notas_credito", "ECNC", "Serie para notas de crédito"),
            ("series.notas_debito", "ECND", "Serie para notas de débito"),
            ("tipo_sistema", "api_directa", "Usa facturador AIDA directamente"),
            ("webhook_url", "", "URL para webhooks"),
            ("webhook_secret", secrets.token_hex(16), "Secret para validar webhooks"),
        ]:
            session.add(ClientSetting(client_id=client2.id, key=key, value=value, description=desc))

        # Control number range
        session.add(ControlNumberRange(
            client_id=client2.id,
            serie="EC",
            numero_inicio=1,
            numero_fin=1000,
            numero_actual=1,
            is_active=True,
            fecha_asignacion=datetime.now(timezone.utc),
            autorizacion_seniat="SNAT-2025-IMP-005678",
            notas="Rango inicial - plan profesional",
        ))

        # Admin user
        user2 = User(
            email="luis.perez@electrocaribe.com.ve",
            hashed_password=hash_password("Electro2025!"),
            first_name="Luis",
            last_name="Pérez",
            is_active=True,
            is_verified=True,
        )
        session.add(user2)
        await session.flush()

        session.add(ClientUser(client_id=client2.id, user_id=user2.id, is_primary=True))

        if "client_admin" in role_map:
            session.add(UserRole(
                user_id=user2.id,
                role_id=role_map["client_admin"].id,
                client_id=client2.id,
                assigned_by=admin_user.id,
            ))

        # Vendedor
        user2b = User(
            email="ana.garcia@electrocaribe.com.ve",
            hashed_password=hash_password("Electro2025!"),
            first_name="Ana",
            last_name="García",
            is_active=True,
            is_verified=True,
        )
        session.add(user2b)
        await session.flush()

        session.add(ClientUser(client_id=client2.id, user_id=user2b.id, is_primary=False))

        if "client_user" in role_map:
            session.add(UserRole(
                user_id=user2b.id,
                role_id=role_map["client_user"].id,
                client_id=client2.id,
                assigned_by=admin_user.id,
            ))

        print("  Cliente 2: Distribuidora Electro Caribe C.A. (API Directa AIDA)")
        print(f"    Admin: luis.perez@electrocaribe.com.ve / Electro2025!")
        print(f"    Vendedora: ana.garcia@electrocaribe.com.ve / Electro2025!")
        print(f"    API Key: {api_key_2}")
        print(f"    API Secret: {api_secret_2}")


if __name__ == "__main__":
    asyncio.run(seed_database())
