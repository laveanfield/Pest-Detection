import os
from fastapi import APIRouter, UploadFile, File, Depends, Form, HTTPException
from sqlalchemy.orm import Session
from models.detection import Detection
from models.batch_summary import BatchSummary
from schemas.detection import DetectionResponse, PredictCreateResponse
from schemas.batch import BatchCreateResponse, BatchStatusResponse, BatchSummaryResponse
from services.predict_service import dispatch_single, dispatch_batch
from api.deps import get_db
from utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/predict", tags=["Predict"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/", response_model=PredictCreateResponse)
async def predict(
    user_id: str = Form(...), 
    file: UploadFile = File(...),
    confidence_threshold: float = Form(default=0.25, ge=0.01, le=1.0),
    db: Session = Depends(get_db)
):
    
    content = await file.read()
    record = dispatch_single(db, user_id, content, file.filename, confidence_threshold)
    return {"id": record.id, "status": "PENDING"}

@router.post("/batch", response_model=BatchCreateResponse)
async def predict_batch(
    user_id: str = Form(...),
    files: list[UploadFile] = File(...),
    confidence_threshold: float = Form(default=0.25, ge=0.01, le=1.0),
    webhook_url: str = Form(None),
    db: Session = Depends(get_db)
):
    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Not to upload over 10 images per batch.")
    
    files_data = [(await f.read(), f.filename) for f in files]
    batch_id = dispatch_batch(db, user_id, files_data, confidence_threshold, webhook_url)

    return {"batch_id": batch_id, "total": len(files), "status": "PROCESSING"}

@router.get("/{detection_id}", response_model=DetectionResponse)
async def get_predict_result(
    detection_id: int,
    db: Session = Depends(get_db)
):
    record = db.query(Detection).filter(Detection.id == detection_id).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="Request not found")

    return record

@router.get("/batch/{batch_id}", response_model=BatchStatusResponse)
def get_batch_status(
    batch_id: str,
    db: Session = Depends(get_db)
):
    records = db.query(Detection).filter(Detection.batch_id == batch_id).all()

    if not records:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    finished = sum(1 for r in records if r.status == "FINISHED")

    return {
        "batch_id": batch_id,
        "total": len(records),
        "finished": finished,
        "failed": sum(1 for r in records if r.status == "FAILED"),
        "progress": f"{finished}/{len(records)}"
    }

@router.get("/batch/{batch_id}/summary", response_model=BatchSummaryResponse)
def get_batch_summary(
    batch_id: str,
    db: Session = Depends(get_db)
):
    summary = db.query(BatchSummary).filter(BatchSummary.batch_id == batch_id).first()
    if not summary:
        raise HTTPException(status_code=404, detail="Summary not found or batch not finished yet.")
    
    return summary