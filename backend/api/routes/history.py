from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from models.detection import Detection
from schemas.history import HistoryItemResponse
from api.deps import get_db

router = APIRouter(prefix="/history", tags=["History"])

fake_db = []

@router.get("/", response_model=list[HistoryItemResponse])
def get_history(
    user_id: str = Query(None, description="Filter by user_id"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Detection).order_by(Detection.created_at.desc())

    if user_id:
        query = query.filter(Detection.user_id == user_id)

    records = query.limit(limit).all()

    return records