"""
Sistema RBAC - Permisos del sistema AIDA.

Estructura de permisos: modulo:categoria:accion
Ejemplo: portal_1:documents:view, portal_2:inventory:create
"""

# --- Portal 1: Portal Cliente ---
P1_DOCUMENTS_VIEW = "portal_1:documents:view"
P1_DOCUMENTS_DOWNLOAD = "portal_1:documents:download"
P1_DOCUMENTS_SEND = "portal_1:documents:send"
P1_REPORTS_VIEW = "portal_1:reports:view"
P1_REPORTS_EXPORT = "portal_1:reports:export"
P1_AI_ASSISTANT = "portal_1:ai:use"
P1_PROFILE_EDIT = "portal_1:profile:edit"
P1_USERS_MANAGE = "portal_1:users:manage"

# --- Portal 2: Facturador ---
P2_INVOICES_CREATE = "portal_2:invoices:create"
P2_INVOICES_VIEW = "portal_2:invoices:view"
P2_INVOICES_VOID = "portal_2:invoices:void"
P2_CREDIT_NOTES_CREATE = "portal_2:credit_notes:create"
P2_DEBIT_NOTES_CREATE = "portal_2:debit_notes:create"
P2_DISPATCH_CREATE = "portal_2:dispatch:create"
P2_QUOTES_CREATE = "portal_2:quotes:create"
P2_QUOTES_CONVERT = "portal_2:quotes:convert"
P2_INVENTORY_VIEW = "portal_2:inventory:view"
P2_INVENTORY_MANAGE = "portal_2:inventory:manage"
P2_PRODUCTS_CREATE = "portal_2:products:create"
P2_PRODUCTS_EDIT = "portal_2:products:edit"
P2_PRODUCTS_DELETE = "portal_2:products:delete"
P2_CUSTOMERS_CREATE = "portal_2:customers:create"
P2_CUSTOMERS_EDIT = "portal_2:customers:edit"
P2_PURCHASES_CREATE = "portal_2:purchases:create"
P2_PURCHASES_VIEW = "portal_2:purchases:view"
P2_CASH_MANAGE = "portal_2:cash:manage"
P2_BANKS_MANAGE = "portal_2:banks:manage"
P2_AR_VIEW = "portal_2:accounts_receivable:view"
P2_AP_VIEW = "portal_2:accounts_payable:view"
P2_REPORTS_VIEW = "portal_2:reports:view"
P2_REPORTS_FINANCIAL = "portal_2:reports:financial"
P2_POS_USE = "portal_2:pos:use"

# --- Portal 3: SENIAT ---
P3_DOCUMENTS_VIEW = "portal_3:documents:view"
P3_DOCUMENTS_VALIDATE = "portal_3:documents:validate"
P3_REPORTS_VIEW = "portal_3:reports:view"
P3_REPORTS_EXPORT = "portal_3:reports:export"
P3_AUDIT_VIEW = "portal_3:audit:view"

# --- Portal 5: Gestión ---
P5_PROJECTS_VIEW = "portal_5:projects:view"
P5_PROJECTS_CREATE = "portal_5:projects:create"
P5_PROJECTS_EDIT = "portal_5:projects:edit"
P5_PROJECTS_DELETE = "portal_5:projects:delete"
P5_MONITORING_VIEW = "portal_5:monitoring:view"
P5_APIS_MANAGE = "portal_5:apis:manage"
P5_LOGS_VIEW = "portal_5:logs:view"
P5_ERRORS_MANAGE = "portal_5:errors:manage"
P5_CONTROL_NUMBERS_MANAGE = "portal_5:control_numbers:manage"
P5_USERS_MANAGE = "portal_5:users:manage"

# --- Portal 6: Admin ---
P6_CLIENTS_VIEW = "portal_6:clients:view"
P6_CLIENTS_CREATE = "portal_6:clients:create"
P6_CLIENTS_EDIT = "portal_6:clients:edit"
P6_CLIENTS_DELETE = "portal_6:clients:delete"
P6_USERS_VIEW = "portal_6:users:view"
P6_USERS_CREATE = "portal_6:users:create"
P6_USERS_EDIT = "portal_6:users:edit"
P6_USERS_DELETE = "portal_6:users:delete"
P6_PROJECTS_VIEW = "portal_6:projects:view"
P6_PROJECTS_CREATE = "portal_6:projects:create"
P6_PROJECTS_EDIT = "portal_6:projects:edit"
P6_ROLES_MANAGE = "portal_6:roles:manage"
P6_PERMISSIONS_MANAGE = "portal_6:permissions:manage"
P6_PLANS_MANAGE = "portal_6:plans:manage"
P6_BILLING_VIEW = "portal_6:billing:view"
P6_BILLING_MANAGE = "portal_6:billing:manage"
P6_CONTROL_NUMBERS_GLOBAL = "portal_6:control_numbers:manage"
P6_SYSTEM_CONFIG = "portal_6:system:config"
P6_INFRASTRUCTURE_VIEW = "portal_6:infrastructure:view"
P6_SUPPORT_MANAGE = "portal_6:support:manage"
P6_REPORTS_VIEW = "portal_6:reports:view"
P6_AUDIT_VIEW = "portal_6:audit:view"
P6_CLAUDE_CODE_MANAGE = "portal_6:claude_code:manage"

# --- Definición de roles predeterminados ---

ALL_PERMISSIONS = {
    # Portal 1
    P1_DOCUMENTS_VIEW: ("Ver documentos", "portal_1", "documents"),
    P1_DOCUMENTS_DOWNLOAD: ("Descargar documentos", "portal_1", "documents"),
    P1_DOCUMENTS_SEND: ("Enviar documentos por email", "portal_1", "documents"),
    P1_REPORTS_VIEW: ("Ver reportes", "portal_1", "reports"),
    P1_REPORTS_EXPORT: ("Exportar reportes", "portal_1", "reports"),
    P1_AI_ASSISTANT: ("Usar asistente IA", "portal_1", "ai"),
    P1_PROFILE_EDIT: ("Editar perfil", "portal_1", "profile"),
    P1_USERS_MANAGE: ("Gestionar usuarios", "portal_1", "users"),
    # Portal 2
    P2_INVOICES_CREATE: ("Crear facturas", "portal_2", "invoices"),
    P2_INVOICES_VIEW: ("Ver facturas", "portal_2", "invoices"),
    P2_INVOICES_VOID: ("Anular facturas", "portal_2", "invoices"),
    P2_CREDIT_NOTES_CREATE: ("Crear notas de crédito", "portal_2", "credit_notes"),
    P2_DEBIT_NOTES_CREATE: ("Crear notas de débito", "portal_2", "debit_notes"),
    P2_DISPATCH_CREATE: ("Crear guías de despacho", "portal_2", "dispatch"),
    P2_QUOTES_CREATE: ("Crear cotizaciones", "portal_2", "quotes"),
    P2_QUOTES_CONVERT: ("Convertir cotizaciones a facturas", "portal_2", "quotes"),
    P2_INVENTORY_VIEW: ("Ver inventario", "portal_2", "inventory"),
    P2_INVENTORY_MANAGE: ("Gestionar inventario", "portal_2", "inventory"),
    P2_PRODUCTS_CREATE: ("Crear productos", "portal_2", "products"),
    P2_PRODUCTS_EDIT: ("Editar productos", "portal_2", "products"),
    P2_PRODUCTS_DELETE: ("Eliminar productos", "portal_2", "products"),
    P2_CUSTOMERS_CREATE: ("Crear clientes", "portal_2", "customers"),
    P2_CUSTOMERS_EDIT: ("Editar clientes", "portal_2", "customers"),
    P2_PURCHASES_CREATE: ("Crear órdenes de compra", "portal_2", "purchases"),
    P2_PURCHASES_VIEW: ("Ver compras", "portal_2", "purchases"),
    P2_CASH_MANAGE: ("Gestionar caja", "portal_2", "cash"),
    P2_BANKS_MANAGE: ("Gestionar bancos", "portal_2", "banks"),
    P2_AR_VIEW: ("Ver cuentas por cobrar", "portal_2", "accounts"),
    P2_AP_VIEW: ("Ver cuentas por pagar", "portal_2", "accounts"),
    P2_REPORTS_VIEW: ("Ver reportes facturador", "portal_2", "reports"),
    P2_REPORTS_FINANCIAL: ("Ver reportes financieros", "portal_2", "reports"),
    P2_POS_USE: ("Usar punto de venta", "portal_2", "pos"),
    # Portal 3
    P3_DOCUMENTS_VIEW: ("Ver documentos SENIAT", "portal_3", "documents"),
    P3_DOCUMENTS_VALIDATE: ("Validar documentos", "portal_3", "documents"),
    P3_REPORTS_VIEW: ("Ver reportes fiscales", "portal_3", "reports"),
    P3_REPORTS_EXPORT: ("Exportar reportes fiscales", "portal_3", "reports"),
    P3_AUDIT_VIEW: ("Ver auditoría SENIAT", "portal_3", "audit"),
    # Portal 5
    P5_PROJECTS_VIEW: ("Ver proyectos", "portal_5", "projects"),
    P5_PROJECTS_CREATE: ("Crear proyectos", "portal_5", "projects"),
    P5_PROJECTS_EDIT: ("Editar proyectos", "portal_5", "projects"),
    P5_PROJECTS_DELETE: ("Eliminar proyectos", "portal_5", "projects"),
    P5_MONITORING_VIEW: ("Ver monitoreo", "portal_5", "monitoring"),
    P5_APIS_MANAGE: ("Gestionar APIs", "portal_5", "apis"),
    P5_LOGS_VIEW: ("Ver logs", "portal_5", "logs"),
    P5_ERRORS_MANAGE: ("Gestionar errores", "portal_5", "errors"),
    P5_CONTROL_NUMBERS_MANAGE: ("Gestionar números de control", "portal_5", "control_numbers"),
    P5_USERS_MANAGE: ("Gestionar usuarios proyecto", "portal_5", "users"),
    # Portal 6
    P6_CLIENTS_VIEW: ("Ver clientes AIda", "portal_6", "clients"),
    P6_CLIENTS_CREATE: ("Crear clientes", "portal_6", "clients"),
    P6_CLIENTS_EDIT: ("Editar clientes", "portal_6", "clients"),
    P6_CLIENTS_DELETE: ("Eliminar clientes", "portal_6", "clients"),
    P6_USERS_VIEW: ("Ver usuarios", "portal_6", "users"),
    P6_USERS_CREATE: ("Crear usuarios", "portal_6", "users"),
    P6_USERS_EDIT: ("Editar usuarios", "portal_6", "users"),
    P6_USERS_DELETE: ("Eliminar usuarios", "portal_6", "users"),
    P6_PROJECTS_VIEW: ("Ver proyectos admin", "portal_6", "projects"),
    P6_PROJECTS_CREATE: ("Crear proyectos admin", "portal_6", "projects"),
    P6_PROJECTS_EDIT: ("Editar proyectos admin", "portal_6", "projects"),
    P6_ROLES_MANAGE: ("Gestionar roles", "portal_6", "roles"),
    P6_PERMISSIONS_MANAGE: ("Gestionar permisos", "portal_6", "permissions"),
    P6_PLANS_MANAGE: ("Gestionar planes", "portal_6", "plans"),
    P6_BILLING_VIEW: ("Ver facturación", "portal_6", "billing"),
    P6_BILLING_MANAGE: ("Gestionar facturación", "portal_6", "billing"),
    P6_CONTROL_NUMBERS_GLOBAL: ("Gestionar números control global", "portal_6", "control_numbers"),
    P6_SYSTEM_CONFIG: ("Configuración del sistema", "portal_6", "system"),
    P6_INFRASTRUCTURE_VIEW: ("Ver infraestructura", "portal_6", "infrastructure"),
    P6_SUPPORT_MANAGE: ("Gestionar soporte", "portal_6", "support"),
    P6_REPORTS_VIEW: ("Ver reportes admin", "portal_6", "reports"),
    P6_AUDIT_VIEW: ("Ver auditoría global", "portal_6", "audit"),
    P6_CLAUDE_CODE_MANAGE: ("Gestionar Claude Code", "portal_6", "claude_code"),
}

# Roles predefinidos del sistema con sus permisos
DEFAULT_ROLES = {
    # --- Roles internos AIda ---
    "super_admin": {
        "display_name": "Super Administrador",
        "description": "Acceso total al sistema",
        "level": "aida_internal",
        "permissions": list(ALL_PERMISSIONS.keys()),
    },
    "account_manager": {
        "display_name": "Gerente de Cuenta",
        "description": "Gestión de clientes asignados y proyectos",
        "level": "aida_internal",
        "permissions": [
            P6_CLIENTS_VIEW, P6_CLIENTS_EDIT, P6_USERS_VIEW,
            P6_PROJECTS_VIEW, P6_PROJECTS_CREATE, P6_PROJECTS_EDIT,
            P6_SUPPORT_MANAGE, P6_REPORTS_VIEW,
            P5_PROJECTS_VIEW, P5_PROJECTS_CREATE, P5_PROJECTS_EDIT,
            P5_MONITORING_VIEW, P5_LOGS_VIEW, P5_ERRORS_MANAGE,
        ],
    },
    "tech_support": {
        "display_name": "Soporte Técnico",
        "description": "Acceso lectura a proyectos, logs y debugging",
        "level": "aida_internal",
        "permissions": [
            P6_CLIENTS_VIEW, P6_PROJECTS_VIEW, P6_SUPPORT_MANAGE,
            P5_PROJECTS_VIEW, P5_MONITORING_VIEW, P5_LOGS_VIEW,
            P5_ERRORS_MANAGE,
        ],
    },
    "developer": {
        "display_name": "Desarrollador",
        "description": "Acceso a Claude Code, deploy y testing",
        "level": "aida_internal",
        "permissions": [
            P6_PROJECTS_VIEW, P6_CLAUDE_CODE_MANAGE,
            P5_PROJECTS_VIEW, P5_PROJECTS_EDIT, P5_APIS_MANAGE,
            P5_MONITORING_VIEW, P5_LOGS_VIEW, P5_ERRORS_MANAGE,
        ],
    },
    # --- Roles de cliente ---
    "client_admin": {
        "display_name": "Admin Cliente",
        "description": "Acceso total a portales 1, 2 y 5",
        "level": "client",
        "permissions": [
            # Portal 1
            P1_DOCUMENTS_VIEW, P1_DOCUMENTS_DOWNLOAD, P1_DOCUMENTS_SEND,
            P1_REPORTS_VIEW, P1_REPORTS_EXPORT, P1_AI_ASSISTANT,
            P1_PROFILE_EDIT, P1_USERS_MANAGE,
            # Portal 2
            P2_INVOICES_CREATE, P2_INVOICES_VIEW, P2_INVOICES_VOID,
            P2_CREDIT_NOTES_CREATE, P2_DEBIT_NOTES_CREATE, P2_DISPATCH_CREATE,
            P2_QUOTES_CREATE, P2_QUOTES_CONVERT,
            P2_INVENTORY_VIEW, P2_INVENTORY_MANAGE,
            P2_PRODUCTS_CREATE, P2_PRODUCTS_EDIT, P2_PRODUCTS_DELETE,
            P2_CUSTOMERS_CREATE, P2_CUSTOMERS_EDIT,
            P2_PURCHASES_CREATE, P2_PURCHASES_VIEW,
            P2_CASH_MANAGE, P2_BANKS_MANAGE,
            P2_AR_VIEW, P2_AP_VIEW, P2_REPORTS_VIEW, P2_REPORTS_FINANCIAL,
            P2_POS_USE,
            # Portal 5
            P5_PROJECTS_VIEW, P5_MONITORING_VIEW, P5_LOGS_VIEW,
            P5_USERS_MANAGE, P5_CONTROL_NUMBERS_MANAGE,
        ],
    },
    "client_operator": {
        "display_name": "Usuario Operativo",
        "description": "Emitir documentos y operación diaria",
        "level": "client",
        "permissions": [
            P1_DOCUMENTS_VIEW, P1_DOCUMENTS_DOWNLOAD,
            P2_INVOICES_CREATE, P2_INVOICES_VIEW,
            P2_CREDIT_NOTES_CREATE, P2_DEBIT_NOTES_CREATE,
            P2_DISPATCH_CREATE, P2_QUOTES_CREATE,
            P2_INVENTORY_VIEW, P2_PRODUCTS_CREATE,
            P2_CUSTOMERS_CREATE, P2_CUSTOMERS_EDIT,
            P2_POS_USE, P2_REPORTS_VIEW,
        ],
    },
    "client_accountant": {
        "display_name": "Contador/Auditor",
        "description": "Lectura de documentos y reportes fiscales",
        "level": "client",
        "permissions": [
            P1_DOCUMENTS_VIEW, P1_DOCUMENTS_DOWNLOAD, P1_DOCUMENTS_SEND,
            P1_REPORTS_VIEW, P1_REPORTS_EXPORT,
            P2_INVOICES_VIEW, P2_INVENTORY_VIEW, P2_PURCHASES_VIEW,
            P2_AR_VIEW, P2_AP_VIEW, P2_REPORTS_VIEW, P2_REPORTS_FINANCIAL,
        ],
    },
    "client_salesperson": {
        "display_name": "Vendedor",
        "description": "Emitir facturas y cotizaciones",
        "level": "client",
        "permissions": [
            P1_DOCUMENTS_VIEW,
            P2_INVOICES_CREATE, P2_INVOICES_VIEW,
            P2_QUOTES_CREATE, P2_QUOTES_CONVERT,
            P2_CUSTOMERS_CREATE, P2_CUSTOMERS_EDIT,
            P2_POS_USE,
        ],
    },
    "client_viewer": {
        "display_name": "Solo Lectura",
        "description": "Ver y descargar documentos sin emisión",
        "level": "client",
        "permissions": [
            P1_DOCUMENTS_VIEW, P1_DOCUMENTS_DOWNLOAD,
            P1_REPORTS_VIEW,
            P2_INVOICES_VIEW, P2_INVENTORY_VIEW, P2_PURCHASES_VIEW,
        ],
    },
}
