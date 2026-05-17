import uuid
import os
from fastapi import APIRouter, UploadFile, File, Depends, Form, HTTPException
from sqlalchemy.orm import Session
from worker import predict_task
from models.detection import Detection
from api.deps import get_db
from utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/predict", tags=["Predict"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/")
async def predict(
    user_id: str, 
    file: UploadFile = File(...),
    confidence_threshold: float = Form(default=0.25, ge=0.01, le=1.0),
    db: Session = Depends(get_db)
):
    
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)

    new_record = Detection(
        status="PENDING", 
        user_id=user_id,
        confidence_threshold=confidence_threshold
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record) 

    task = predict_task.delay(new_record.id, file_path, confidence_threshold)

    new_record.task_id = task.id
    db.commit()

    return {"id": new_record.id, "status": "PENDING"}

@router.get("/{detection_id}")
async def get_predict_result(
    detection_id: int,
    db: Session = Depends(get_db)
):
    record = db.query(Detection).filter(Detection.id == detection_id).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="Request not found")

    response = {
        "id": record.id,
        "status": record.status,
        "created_at": record.created_at
    }

    if record.status == "FINISHED":
        response["result"] = {
            "image_url"  : record.image_url,
            "cam_url"    : record.cam_url,
            "total_count": record.total_count,
            "details": {
                "thin_pest" : record.thin_pest_count,
                "round_pest": record.round_pest_count,
                "big_pest"  : record.big_pest_count
            }
        }
    elif record.status == "FAILED":
        response["message"] = "Image processing failed. Please try again."

    return response
