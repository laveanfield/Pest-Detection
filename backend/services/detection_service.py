import os
from sqlalchemy.orm import Session
from models.detection import Detection
from services.inference_service import predict_image
from services.cloudinary_service import upload_image
from services.eigen_cam_service import generate_eigencam
from utils.logger import get_logger

logger = get_logger(__name__)

def process_detection(
    db: Session,
    model,
    db_record_id: int,
    image_path: str,
    confidence_threshold: float
) -> None:
    
    output_img_path = None
    cam_output_path = None

    try:
        prediction = predict_image(image_path, conf=confidence_threshold, model=model)

        output_img_path = prediction["output_img_path"]
        image_url = upload_image(output_img_path)

        cam_output_path = image_path.replace(".jpg", "_cam.jpg")
        generate_eigencam(model, image_path, cam_output_path)
        cam_url = upload_image(cam_output_path)

        logger.info(f"Uploaded to Cloudinary: {image_url}")

        record = db.query(Detection).filter(Detection.id == db_record_id).first()
        if record:
            record.status = "FINISHED"
            record.image_url = image_url
            record.cam_url = cam_url
            record.total_count = prediction["total_count"]
            record.thin_pest_count = prediction["counts"]["thin_pest"]
            record.round_pest_count = prediction["counts"]["round_pest"]
            record.big_pest_count = prediction["counts"]["big_pest"]
            db.commit()

            logger.info(f"Detection finished. Total = {prediction['total_count']}")
    finally:
        for path in [output_img_path, cam_output_path]:
            if path and os.path.exists(path):
                os.remove(path)
    
    return output_img_path, cam_output_path
