from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from api.deps import get_db

from services.authentication_service import (
    login,
    register,
    verify_register_otp,
    forgot_password,
    reset_password,
    get_current_user
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# REGISTER
@router.post("/register")
def register_route(
    username: str,
    email: str,
    password: str,
    db: Session = Depends(get_db)
):

    return register(
        db=db,
        username=username,
        email=email,
        password=password
    )


# VERIFY REGISTER OTP
@router.post("/verify-register-otp")
def verify_register_otp_route(
    email: str,
    otp: str,
    db: Session = Depends(get_db)
):

    return verify_register_otp(
        db=db,
        email=email,
        otp=otp
    )


# LOGIN
@router.post("/login")
def login_route(
    email: str,
    password: str,
    db: Session = Depends(get_db)
):

    return login(
        db=db,
        email=email,
        password=password
    )


# GET CURRENT USER
@router.get("/me")
def get_me(
    current_user = Depends(get_current_user)
):

    return {
        "id": str(current_user.id),
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "created_at": current_user.created_at
    }


# FORGOT PASSWORD
@router.post("/forgot-password")
def forgot_password_route(
    email: str,
    db: Session = Depends(get_db)
):

    return forgot_password(
        db=db,
        email=email
    )


# RESET PASSWORD
@router.post("/reset-password")
def reset_password_route(
    email: str,
    otp: str,
    new_password: str,
    db: Session = Depends(get_db)
):

    return reset_password(
        db=db,
        email=email,
        otp=otp,
        new_password=new_password
    )