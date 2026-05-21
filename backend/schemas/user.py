from datetime import datetime
from enum import Enum
import uuid


class RoleEnum(str, Enum):
    USER = "user"
    ADMIN = "admin"


class User:
    id: uuid.UUID
    name: str
    email: str
    password: str
    created_at: datetime
    updated_at: datetime
    role: RoleEnum
    otp: str | None
    otp_expired_at: datetime | None
    is_verified: bool