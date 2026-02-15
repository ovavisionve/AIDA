import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    phone: str | None = None
    is_active: bool = True
    role_name: str | None = None
    client_id: uuid.UUID | None = None


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    is_active: bool | None = None
    language: str | None = None
    timezone: str | None = None
    theme: str | None = None


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    first_name: str
    last_name: str
    phone: str | None
    is_active: bool
    is_superadmin: bool
    is_verified: bool
    totp_enabled: bool
    last_login: datetime | None
    language: str
    timezone: str
    theme: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserListResponse(BaseModel):
    items: list[UserResponse]
    total: int
    page: int
    page_size: int
    pages: int


class AssignRoleRequest(BaseModel):
    role_name: str
    client_id: uuid.UUID | None = None
