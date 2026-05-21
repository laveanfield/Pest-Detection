import uuid
import os
from fastapi import UploadFile
from sqlalchemy.orm import Session
from models.detection import Detection
from worker import predict_task, batch_callback_task
from celery import group, chord

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def save_upload_file(file_content: bytes, filename: str) -> str:
    ext = os.path.splitext(filename)[1]
    unique_filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    with open(file_path, "wb") as f:
        f.write(file_content)

    return file_path

def create_detection_record(
    db: Session,
    user_id: str,
    confidence_threshold: float,
    batch_id: str = None
) -> Detection:
    record = Detection(
        status="PENDING",
        user_id=user_id,
        confidence_threshold=confidence_threshold,
        batch_id=batch_id
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    return record

def dispatch_single(
    db: Session,
    user_id: str,
    file_content: bytes,
    filename: str,
    confidence_threshold: float
) -> Detection:
    file_path = save_upload_file(file_content, filename)
    record = create_detection_record(db, user_id, confidence_threshold)
    task = predict_task.delay(record.id, file_path, confidence_threshold)

    record.task_id = task.id

    db.commit()

    return record

def dispatch_batch(
    db: Session,
    user_id: str,
    files_data: list[tuple[bytes, str]],
    confidence_threshold: float,
    webhook_url: str = None
) -> str:
    batch_id = str(uuid.uuid4())
    record_ids = []

    for content, filename in files_data:
        file_path = save_upload_file(content, filename)
        record = create_detection_record(db, user_id, confidence_threshold, batch_id)
        record_ids.append((record.id, file_path))

    tasks = group(
        predict_task.s(record_id, path, confidence_threshold)
        for record_id, path in record_ids
    )
    
    chord(tasks)(
        batch_callback_task.s(batch_id=batch_id, webhook_url=webhook_url)
    )

    return batch_id