from datetime import datetime
from enum import Enum
from sqlalchemy.orm import relationship
import uuid

from sqlalchemy import (
    Column,
    String,
    DateTime,
    Boolean,
    Enum as SqlEnum
)

from sqlalchemy.dialects.postgresql import UUID

from db.database import Base

class RoleEnum(str, Enum):
    USER = "user"
    ADMIN = "admin"


class User(Base):

    __tablename__ = "users"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    name = Column(
        String,
        nullable=False
    )

    email = Column(
        String,
        unique=True,
        nullable=False
    )

    password = Column(
        String,
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    role = Column(
        SqlEnum(RoleEnum),
        default=RoleEnum.USER,
        nullable=False
    )

    otp = Column(
        String,
        nullable=True
    )

    otp_expired_at = Column(
        DateTime,
        nullable=True
    )

    is_verified = Column(
        Boolean,
        default=False
    )

    detections = relationship(
        "Detection",
        back_populates="user"
    )

    batch_summaries = relationship(
        "BatchSummary",
        back_populates="user"
    )