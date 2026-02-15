import uuid
from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    totp_code: str | None = None


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: "UserInfo"
    requires_2fa: bool = False


class UserInfo(BaseModel):
    id: uuid.UUID
    email: str
    first_name: str
    last_name: str
    is_superadmin: bool
    totp_enabled: bool
    language: str
    theme: str

    model_config = {"from_attributes": True}


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class Setup2FAResponse(BaseModel):
    secret: str
    qr_code_base64: str
    uri: str


class Verify2FARequest(BaseModel):
    totp_code: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    phone: str | None = None


LoginResponse.model_rebuild()
