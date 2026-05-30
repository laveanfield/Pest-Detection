import os
import time
from prometheus_client import start_http_server
from utils.metrics import(
    CELERY_TASK_SUCCESS,
    CELERY_TASK_FAILED,
    CELERY_TASK_DURATION
)
from celery import Celery
from sqlalchemy.orm import Session
from db.database import SessionLocal
from models.detection import Detection
from models.user import User
from models.batch_summary import BatchSummary
from models.model_version import ModelVersion
from services.model_registry import ModelRegistry
from services.detection_service import process_detection
from services.batch_service import summarize_batch, send_webhook
from utils.logger import get_logger
from dotenv import load_dotenv

load_dotenv()

logger = get_logger(__name__)

start_http_server(9100)

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
    start = time.time()

    try:
        model = ModelRegistry.get_active_model(db)
        process_detection(
            db, model, db_record_id, image_path, confidence_threshold
        )
        CELERY_TASK_SUCCESS.labels(task_name="predict_task").inc()
        CELERY_TASK_DURATION.labels(task_name="predict_task").observe(time.time() - start)

    except Exception as e:
        logger.exception(f"Task failed, record_id={db_record_id}")
        CELERY_TASK_FAILED.labels(task_name="predict_task").inc()

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
    start = time.time()

    try:
        summary = summarize_batch(db, batch_id, webhook_url)
        send_webhook(summary)

        CELERY_TASK_SUCCESS.labels(task_name="batch_callback_task").inc()
        CELERY_TASK_DURATION.labels(task_name="batch_callback_task").observe(time.time() - start)
    except Exception:
        logger.exception(f"Failed to process batch summary!!!")
        CELERY_TASK_FAILED.labels(task_name="batch_callback_task").inc()
        db.rollback()
    finally:
        db.close()