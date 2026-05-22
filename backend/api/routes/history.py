from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

from models.user import User, RoleEnum
from models.detection import Detection

from schemas.history import HistoryItemResponse

from api.deps import get_db
from services.authentication_service import get_current_user

router = APIRouter(
    prefix="/history",
    tags=["History"]
)

@router.get("/", response_model=list[HistoryItemResponse])
def get_history(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    
    if current_user.role != RoleEnum.USER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden"
        )

    records = (
        db.query(Detection)
        .filter(Detection.user_id == current_user.id)
        .order_by(Detection.created_at.desc())
        .limit(limit)
        .all()
    )

    return records