import os
from celery import Celery
from sqlalchemy.orm import Session
from db.database import SessionLocal
from models.detection import Detection
from services.model_registry import ModelRegistry
from services.detection_service import process_detection
from services.batch_service import summarize_batch, send_webhook
from utils.logger import get_logger
from dotenv import load_dotenv

load_dotenv()

logger = get_logger(__name__)

celery_app = Celery(
    "worker",
    broker=os.getenv("REDIS_URL", "redis://redis:6379/0"),
    backend=os.getenv("REDIS_URL", "redis://redis:6379/0")
)

@celery_app.task(name="predict_task")
def predict_task(
    db_record_id: int,
    image_path: str,
    confidence_threshold: float = 0.25
):
    logger.info(f"Task started - record_id={db_record_id}")

    db: Session = SessionLocal()
    output_img_path = None
    cam_output_path = None

    try:
        model = ModelRegistry.get_active_model(db)
        process_detection(
            db, model, db_record_id, image_path, confidence_threshold
        )
    except Exception as e:
        logger.exception(f"Task failed, record_id={db_record_id}")
        db.rollback()
        record = db.query(Detection).filter(Detection.id == db_record_id).first()
        if record:
            record.status = "FAILED"
            db.commit()

    finally:
        if image_path and os.path.exists(image_path):
            os.remove(image_path)
            logger.debug(f"Removed temp file: {image_path}")
        db.close()

@celery_app.task(name="batch_callback_task")
def batch_callback_task(
    result: list,
    batch_id: str,
    webhook_url: str = None
):
    db = SessionLocal()
    try:
        summary = summarize_batch(db, batch_id, webhook_url)
        send_webhook(summary)
    except Exception:
        logger.exception(f"Failed to process batch summary!!!")
        db.rollback()
    finally:
        db.close()