import uuid
from datetime import date, datetime
from pydantic import BaseModel, EmailStr


class ClientCreate(BaseModel):
    rif: str
    razon_social: str
    nombre_comercial: str | None = None
    direccion_fiscal: str
    telefono_principal: str | None = None
    telefono_secundario: str | None = None
    email_principal: EmailStr
    email_secundario: EmailStr | None = None
    representante_legal: str | None = None
    sector_industria: str | None = None
    plan: str = "basico"
    fecha_inicio: date
    moneda_principal: str = "VES"
    max_documentos_mes: int = 100
    max_usuarios: int = 1
    max_almacenamiento_gb: int = 5


class ClientUpdate(BaseModel):
    razon_social: str | None = None
    nombre_comercial: str | None = None
    direccion_fiscal: str | None = None
    telefono_principal: str | None = None
    telefono_secundario: str | None = None
    email_principal: EmailStr | None = None
    email_secundario: EmailStr | None = None
    representante_legal: str | None = None
    sector_industria: str | None = None
    plan: str | None = None
    is_active: bool | None = None
    is_suspended: bool | None = None
    suspension_reason: str | None = None
    moneda_principal: str | None = None
    max_documentos_mes: int | None = None
    max_usuarios: int | None = None
    max_almacenamiento_gb: int | None = None
    logo_url: str | None = None
    color_primario: str | None = None
    color_secundario: str | None = None


class ClientResponse(BaseModel):
    id: uuid.UUID
    rif: str
    razon_social: str
    nombre_comercial: str | None
    direccion_fiscal: str
    telefono_principal: str | None
    email_principal: str
    representante_legal: str | None
    sector_industria: str | None
    plan: str
    fecha_inicio: date
    fecha_renovacion: date | None
    is_active: bool
    is_suspended: bool
    moneda_principal: str
    max_documentos_mes: int
    max_usuarios: int
    max_almacenamiento_gb: int
    logo_url: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ClientListResponse(BaseModel):
    items: list[ClientResponse]
    total: int
    page: int
    page_size: int
    pages: int
