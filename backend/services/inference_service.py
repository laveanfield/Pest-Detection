from ultralytics import YOLO
from pathlib import Path
from utils.logger import get_logger

logger = get_logger(__name__)

PEST_MAPPING = {
    "bo thon": "thin_pest",
    "bo map" : "round_pest",
    "bo to"  : "big_pest"
}

def predict_image(file_path: str, conf: float = 0.25, model=None) -> dict:
    if model is None:
        raise ValueError("Model must be provided.")
    results = model.predict(source=file_path, conf=conf)
    result = results[0]
    
    input_path = Path(file_path)
    output_img_path = str(input_path.parent / f"output_{input_path.stem}.jpg")
    result.save(filename=output_img_path)

    counts = {"thin_pest": 0, "round_pest": 0, "big_pest": 0}
    boxes = []

    for box in result.boxes:
        class_id = int(box.cls[0])
        class_name = result.names[class_id]
        confidence = float(box.conf[0])
        x1, y1, x2, y2 = box.xyxy[0].tolist()

        real_name = PEST_MAPPING.get(class_name)
        if real_name is None:
            logger.warning(f"Unknown class: {class_name} !!!")
            continue
        
        counts[real_name] += 1
        boxes.append({
            "class_name": class_name,
            "confidence": round(confidence, 2),
            "x1"        : round(x1, 2),
            "y1"        : round(y1, 2),
            "x2"        : round(x2, 2),
            "y2"        : round(y2, 2),
        })

    logger.info(
        f"Prediction done\n"
        f"Total: {len(boxes)}\n"
        f"thin : {counts['thin_pest']}\n"
        f"round: {counts['round_pest']}\n"
        f"big  : {counts['big_pest']}"
    )

    return {
        "total_count"    : len(boxes),
        "counts"         : counts,
        "boxes"          : boxes,
        "output_img_path": output_img_path
    }