from datetime import datetime
import uuid

from sqlalchemy.orm import Session
from passlib.context import CryptContext

from models.user import User, RoleEnum


pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


def hash_password(password: str) -> str:

    return pwd_context.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:

    return pwd_context.verify(
        plain_password,
        hashed_password
    )


def create_user(
    db: Session,
    username: str,
    email: str,
    password: str,
    otp: str,
    otp_expired_at: datetime
) -> User:
    new_user = User(
        id=uuid.uuid4(),
        name=username,
        email=email,
        password=hash_password(password),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        role=RoleEnum.USER,
        otp=otp,
        otp_expired_at=otp_expired_at,
        is_verified=False
    )

    db.add(new_user)

    db.commit()

    db.refresh(new_user)

    return new_user


def get_user_by_email(
    db: Session,
    email: str
) -> User | None:

    return db.query(User).filter(
        User.email == email
    ).first()


def get_user_by_id(
    db: Session,
    user_id: uuid.UUID
) -> User | None:

    return db.query(User).filter(
        User.id == user_id
    ).first()


def get_all_users(db: Session):

    return db.query(User).all()


def update_user(
    db: Session,
    user: User,
    **kwargs
):

    for key, value in kwargs.items():
        setattr(user, key, value)

    user.updated_at = datetime.utcnow()

    db.commit()

    db.refresh(user)

    return user


def delete_user(
    db: Session,
    user: User
):

    db.delete(user)

    db.commit()