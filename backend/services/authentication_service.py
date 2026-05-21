from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import get_db
from datetime import datetime, timedelta
from services.email_service import send_email

from services.jwt_handler import (
    create_access_token,
    verify_token
)

from services.otp_service import generate_otp
from services.user_service import (
    create_user,
    get_user_by_email,
    hash_password,
    verify_password
)


oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="auth/login"
)


# LOGIN
def login(
    db: Session,
    email: str,
    password: str
):

    user = get_user_by_email(
        db,
        email
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not verify_password(
        password,
        user.password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email not verified"
        )

    access_token = create_access_token({
        "sub": user.email,
        "role": user.role,
        "id": str(user.id)
    })

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "role": user.role
        }
    }


# GET CURRENT USER
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):

    payload = verify_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

    email = payload.get("sub")

    if email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

    user = get_user_by_email(
        db,
        email
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    if not user.is_verified:
        raise HTTPException(
            status_code=401,
            detail="Email not verified"
        )

    return user


# REGISTER
def register(
    db: Session,
    username: str,
    email: str,
    password: str
):

    existing_user = get_user_by_email(
        db,
        email
    )

    if existing_user and existing_user.is_verified:
        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )

    otp = generate_otp()

    otp_expired_at = datetime.utcnow() + timedelta(minutes=5)

    if existing_user and not existing_user.is_verified:

        existing_user.otp = otp
        existing_user.otp_expired_at = otp_expired_at
        existing_user.updated_at = datetime.utcnow()
        existing_user.name = username
        existing_user.password = hash_password(password)

        db.commit()
        db.refresh(existing_user)

    else:

        create_user(
            db=db,
            username=username,
            email=email,
            password=password,
            otp=otp,
            otp_expired_at=otp_expired_at
        )

    send_email(
        to_email=email,
        subject="Verify your email",
        body=f"Your OTP code is: {otp}"
    )

    return {
        "message": "OTP sent to email"
    }

def verify_register_otp(
    db: Session,
    email: str,
    otp: str
):

    user = get_user_by_email(
        db,
        email
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if user.is_verified:
        raise HTTPException(
            status_code=400,
            detail="User already verified"
        )

    if user.otp is None or user.otp != otp:
        raise HTTPException(
            status_code=400,
            detail="Invalid OTP"
        )

    if (
        user.otp_expired_at is None or
        datetime.utcnow() > user.otp_expired_at
    ):
        raise HTTPException(
            status_code=400,
            detail="OTP expired"
        )

    user.is_verified = True

    user.otp = None
    user.otp_expired_at = None

    user.updated_at = datetime.utcnow()

    db.commit()

    db.refresh(user)

    return {
        "message": "Email verified successfully"
    }


# AUTHENTICATION
def forgot_password(
    db: Session,
    email: str
):

    user = get_user_by_email(
        db,
        email
    )

    if not user:
        return {
            "message": "If the email exists, OTP has been sent"
        }

    if not user.is_verified:
        return {
            "message": "If the email exists, OTP has been sent"
        }

    otp = generate_otp()

    otp_expired_at = datetime.utcnow() + timedelta(
        minutes=5
    )

    user.otp = otp
    user.otp_expired_at = otp_expired_at

    user.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(user)

    send_email(
        to_email=email,
        subject="Reset Password OTP",
        body=f"Your OTP code is: {otp}"
    )

    return {
        "message": "If the email exists, OTP has been sent"
    }


def reset_password(
    db: Session,
    email: str,
    otp: str,
    new_password: str
):

    user = get_user_by_email(
        db,
        email
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if user.otp is None or user.otp != otp:
        raise HTTPException(
            status_code=400,
            detail="Invalid OTP"
        )

    if (
        user.otp_expired_at is None or
        datetime.utcnow() > user.otp_expired_at
    ):
        raise HTTPException(
            status_code=400,
            detail="OTP expired"
        )

    user.password = hash_password(
        new_password
    )

    user.otp = None
    user.otp_expired_at = None

    user.updated_at = datetime.utcnow()

    db.commit()

    db.refresh(user)

    return {
        "message": "Password reset successfully"
    }


# LOGOUT
def logout():
    return {
        "message": "Logout successful"
    }