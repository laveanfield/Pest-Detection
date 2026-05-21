from datetime import datetime
import uuid

from passlib.context import CryptContext
from sqlalchemy.orm import Session

from schemas.user import RoleEnum, User


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


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


def get_user_by_id(
    db: Session,
    user_id: uuid.UUID
) -> User | None:

    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(
    db: Session,
    email: str
) -> User | None:

    return db.query(User).filter(User.email == email).first()


def get_user_by_username(
    db: Session,
    username: str
) -> User | None:

    return db.query(User).filter(User.name == username).first()


def get_all_users(
    db: Session,
    skip: int = 0,
    limit: int = 100
):

    return db.query(User).offset(skip).limit(limit).all()


def update_user(
    db: Session,
    user_id: uuid.UUID,
    username: str | None = None,
    email: str | None = None,
    password: str | None = None,
    role: str | None = None
) -> User | None:

    existing_user = get_user_by_id(db, user_id)

    if not existing_user:
        return None

    if username:
        existing_user.name = username

    if email:
        existing_user.email = email

    if password:
        existing_user.password = hash_password(password)

    if role:
        existing_user.role = role

    existing_user.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(existing_user)

    return existing_user


def delete_user(
    db: Session,
    user_id: uuid.UUID
) -> bool:

    existing_user = get_user_by_id(db, user_id)

    if not existing_user:
        return False

    db.delete(existing_user)
    db.commit()

    return True