from sqlalchemy.orm import Session

from db.database import SessionLocal
from models.user import User, RoleEnum

from services.user_service import hash_password

db: Session = SessionLocal()

admin = db.query(User).filter(
    User.email == "admin@pest.local"
).first()

if not admin:

    admin = User(
        name="Administrator",
        email="admin@pest.local",
        password=hash_password("admin"),
        role=RoleEnum.ADMIN,
        is_verified=True
    )

    db.add(admin)
    db.commit()

    print("Admin account created.")

else:
    print("Admin already exists.")

db.close()