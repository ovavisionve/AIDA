import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class CustomerCreate(BaseModel):
    rif: str = Field(..., max_length=20)
    cedula: str | None = None
    razon_social: str = Field(..., max_length=255)
    nombre_comercial: str | None = None
    direccion_fiscal: str
    direccion_entrega: str | None = None
    telefono_principal: str | None = None
    telefono_secundario: str | None = None
    email: EmailStr | None = None
    contacto_nombre: str | None = None
    contacto_telefono: str | None = None
    contacto_email: EmailStr | None = None
    limite_credito: float = 0
    condicion_pago: str = "contado"
    categoria: str | None = None
    segmento: str | None = None
    notas: str | None = None


class CustomerUpdate(BaseModel):
    razon_social: str | None = None
    nombre_comercial: str | None = None
    direccion_fiscal: str | None = None
    direccion_entrega: str | None = None
    telefono_principal: str | None = None
    email: EmailStr | None = None
    contacto_nombre: str | None = None
    limite_credito: float | None = None
    condicion_pago: str | None = None
    categoria: str | None = None
    segmento: str | None = None
    is_active: bool | None = None
    notas: str | None = None


class CustomerResponse(BaseModel):
    id: uuid.UUID
    rif: str
    cedula: str | None
    razon_social: str
    nombre_comercial: str | None
    direccion_fiscal: str
    direccion_entrega: str | None
    telefono_principal: str | None
    email: str | None
    contacto_nombre: str | None
    limite_credito: float
    condicion_pago: str
    categoria: str | None
    segmento: str | None
    is_active: bool
    is_moroso: bool
    notas: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CustomerListResponse(BaseModel):
    items: list[CustomerResponse]
    total: int
    page: int
    page_size: int
    pages: int
