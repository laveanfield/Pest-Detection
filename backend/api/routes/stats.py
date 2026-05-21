from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from models.detection import Detection
from api.deps import get_db
from utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/stats", tags=["Stats"])

@router.get("/")
def get_stats(db: Session = Depends(get_db)):
    logger.info("Stat request")

    total_img = db.query(func.count(Detection.id)).scalar()

    total_pest = db.query(
        func.sum(Detection.thin_pest_count+Detection.round_pest_count+Detection.big_pest_count)
    ).filter(Detection.status == "FINISHED").scalar() or 0

    breakdown = db.query(
        func.sum(Detection.thin_pest_count),
        func.sum(Detection.round_pest_count),
        func.sum(Detection.big_pest_count)
    ).filter(Detection.status == "FINISHED").first()

    return {
        "total_images": total_img,
        "total_pests": int(total_pest),
        "breakdown": {
            "thin_pest": int(breakdown[0] or 0),
            "round_pest": int(breakdown[1] or 0),
            "big_pest":   int(breakdown[2] or 0)
        }
    }