import uuid
import os
from fastapi import APIRouter, UploadFile, File, Depends, Form, HTTPException
from sqlalchemy.orm import Session
from worker import predict_task
from models.detection import Detection
from schemas.detection import DetectionResponse, PredictCreateResponse
from api.deps import get_db
from utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/predict", tags=["Predict"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/", response_model=PredictCreateResponse)
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

@router.get("/{detection_id}", response_model=DetectionResponse)
async def get_predict_result(
    detection_id: int,
    db: Session = Depends(get_db)
):
    record = db.query(Detection).filter(Detection.id == detection_id).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="Request not found")

    return record
