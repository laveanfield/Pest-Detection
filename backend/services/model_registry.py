from typing import Optional, Type
from ultralytics import YOLO
from sqlalchemy.orm import Session
from models.model_version import ModelVersion

class ModelRegistry:
    _instance: Optional[Type["ModelRegistry"]] = None
    _model: Optional[YOLO] = None
    _active_version_id: Optional[int] = None

    @classmethod
    def get_active_model(cls, db: Session) -> YOLO:
        active = db.query(ModelVersion).filter(
            ModelVersion.is_active == True
        ).first()

        if active is None:
            raise ValueError("No active model found in DB!")
        
        if cls._active_version_id != active.id or cls._model is None:
            cls._model = YOLO(active.file_path)
            cls._active_version_id = active.id

        return cls._model
    
    @classmethod
    def invalidate(cls):
        cls._active_version_id = None
        cls._model = None
