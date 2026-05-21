import httpx
from sqlalchemy.orm import Session
from models.detection import Detection
from models.batch_summary import BatchSummary
from utils.logger import get_logger

logger = get_logger(__name__)

def summarize_batch(
    db: Session, 
    batch_id: str, 
    webhook_url: str = None
) -> BatchSummary:
    exist_ok = db.query(BatchSummary).filter(BatchSummary.batch_id == batch_id).first()
    if exist_ok:
        logger.info("Batch summary already exists.")
        return
    records = db.query(Detection).filter(Detection.batch_id == batch_id).all()

    summary = BatchSummary(
        batch_id = batch_id,
        user_id=records[0].user_id if records else None,
        total_images=len(records),
        finished_images=sum(1 for r in records if r.status == "FINISHED"),
        failed_images=sum(1 for r in records if r.status == "FAILED"),
        total_pest=sum(r.total_count for r in records),
        thin_pest_total=sum(r.thin_pest_count for r in records),
        round_pest_total=sum(r.round_pest_count for r in records),
        big_pest_total=sum(r.big_pest_count for r in records),
        webhook_url=webhook_url
    )

    db.add(summary)
    db.commit()
    logger.info(f"Batch {batch_id} summary saved. Total pest = {summary.total_pest}")

    return summary

def send_webhook(summary: BatchSummary) -> None:
    if not summary.webhook_url:
        return
    try:
        httpx.post(summary.webhook_url, json={
            "batch_id": summary.batch_id,
            "total_images": summary.total_images,
            "finished": summary.finished_images,
            "failed": summary.failed_images,
            "total_pest": summary.total_pest,
            "breakdown": {
                "thin_pest": summary.thin_pest_total,
                "round_pest": summary.round_pest_total,
                "big_pest": summary.big_pest_total,
            }
        }, timeout=10)
        logger.info(f"Webhook sent to {summary.webhook_url}.")
    except Exception:
        logger.warning(f"Webhook failed!!!")
    
    